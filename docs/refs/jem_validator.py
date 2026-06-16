#!/usr/bin/env python3
"""
jem_validator.py - Validate OptiFine CEM / EMF .jem and .jpm entity models.

Target runtime: Entity Model Features (EMF). Base spec: OptiFine CEM.
Companion to refs/CEM_EMF_REFERENCE.md.

Usage:
    python3 jem_validator.py <file-or-folder> [<file-or-folder> ...]
    python3 jem_validator.py --quiet <path>     # errors only, suppress warnings/info

Checks:
  - JSON validity (with line/col on parse failure)
  - .jem: required `models`; each model requires `part`; `id` recommended;
    type-checks for attach/scale/textureSize; resolves `model` (.jpm) paths and
    `baseId` references; checks texture file existence when resolvable.
  - parts (inline or .jpm): box `coordinates` length 6; the textureOffset-XOR-uvFace
    rule; uv<Face> length 4; sizeAdd/sizesAdd types; recursion into submodel(s);
    warns on `sprites` (EMF does not support sprites).
  - animations: key parses to a valid TARGET.VAR / var.* / varb.* / render.*;
    flags unknown model-variable suffixes (error) and unknown identifiers in
    expressions (warning); flags animations declared on a submodel (error).
  - duplicate `id` values.

Exit codes: 0 = no errors (warnings allowed), 1 = one or more errors, 2 = bad usage.
"""
import sys, os, json, re

# ---- known vocabularies (see CEM_EMF_REFERENCE.md) ----------------------------
MODEL_VARS = {"tx","ty","tz","sx","sy","sz","rx","ry","rz","visible","visible_boxes"}
RENDER_VARS = {"shadow_size","shadow_opacity","shadow_offset_x","shadow_offset_z",
               "leash_offset_x","leash_offset_y","leash_offset_z"}
UV_FACES = {"uvDown","uvUp","uvNorth","uvSouth","uvWest","uvEast",
            "uvFront","uvBack","uvLeft","uvRight"}

BASE_VARS = {
 "pi","true","false","age","anger_time","day_count","day_time","death_time","dimension",
 "frame_counter","frame_time","head_yaw","head_pitch","health","hurt_time","id",
 "is_aggressive","is_alive","is_burning","is_child","is_glowing","is_hurt","is_in_hand",
 "is_in_item_frame","is_in_ground","is_in_gui","is_in_lava","is_in_water","is_invisible",
 "is_on_ground","is_on_head","is_on_shoulder","is_ridden","is_riding","is_sitting",
 "is_sneaking","is_sprinting","is_tamed","is_wet","limb_swing","limb_speed","max_health",
 "player_pos_x","player_pos_y","player_pos_z","player_rot_x","player_rot_y",
 "pos_x","pos_y","pos_z","rot_x","rot_y","rule_index","swing_progress","time",
}
EMF_VARS = {"is_climbing","is_blocking","is_crawling","distance","fluid_depth",
            "fluid_depth_up","fluid_depth_down","move_forward","move_strafing","nan","e"}
KNOWN_VARS = BASE_VARS | EMF_VARS

BASE_FUNCS = {"sin","cos","tan","asin","acos","atan","atan2","torad","todeg","min","max",
              "clamp","abs","floor","ceil","exp","frac","log","pow","random","round",
              "signum","sqrt","fmod","lerp","if","ifb","print","printb","between","equals","in"}
EMF_FUNCS = {"keyframe","keyframeloop","catmullrom","quadbezier","cubicbezier","hermite",
             "wrapdeg","wraprad","degdiff","raddiff"} | {
  "easeinoutexpo","easeinexpo","easeoutexpo","easeinoutcirc","easeincirc","easeoutcirc",
  "easeinoutelastic","easeinelastic","easeoutelastic","easeinoutback","easeinback","easeoutback",
  "easeinoutbounce","easeinbounce","easeoutbounce","easeinquad","easeoutquad","easeinoutquad",
  "easeincubic","easeoutcubic","easeinoutcubic","easeinquart","easeoutquart","easeinoutquart",
  "easeinquint","easeoutquint","easeinoutquint","easeinsine","easeoutsine","easeinoutsine"}
KNOWN_FUNCS = BASE_FUNCS | EMF_FUNCS

IDENT = re.compile(r"[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*")


class Reporter:
    def __init__(self, path):
        self.path = path
        self.errors = []
        self.warnings = []
        self.infos = []
    def err(self, where, msg):  self.errors.append((where, msg))
    def warn(self, where, msg): self.warnings.append((where, msg))
    def info(self, where, msg): self.infos.append((where, msg))


def is_number(x): return isinstance(x, (int, float)) and not isinstance(x, bool)


def check_box(box, where, R):
    if not isinstance(box, dict):
        R.err(where, "box must be an object"); return
    coords = box.get("coordinates")
    if coords is None:
        R.err(where, "box missing required `coordinates`")
    elif not (isinstance(coords, list) and len(coords) == 6 and all(is_number(c) for c in coords)):
        R.err(where, f"`coordinates` must be 6 numbers [x,y,z,w,h,d], got {coords!r}")
    else:
        w, h, d = coords[3], coords[4], coords[5]
        # Negative w/h/d are VALID in CEM — they mirror/flip the box (Fresh Animations
        # uses this routinely). Do not flag. Only an all-zero box is worth a note.
        if w == 0 and h == 0 and d == 0:
            R.info(where, "box has all-zero dimensions (invisible placeholder?)")
    has_off = "textureOffset" in box
    faces = [k for k in box if k in UV_FACES]
    if has_off and faces:
        R.err(where, f"box uses BOTH `textureOffset` and per-face UV ({', '.join(faces)}) — pick one")
    if not has_off and not faces:
        R.warn(where, "box has neither `textureOffset` nor per-face UV — texture will be undefined")
    if has_off:
        off = box["textureOffset"]
        if not (isinstance(off, list) and len(off) == 2 and all(is_number(c) for c in off)):
            R.err(where, f"`textureOffset` must be 2 numbers, got {off!r}")
    for f in faces:
        v = box[f]
        if not (isinstance(v, list) and len(v) == 4 and all(is_number(c) for c in v)):
            R.err(where, f"`{f}` must be 4 numbers [u1,v1,u2,v2], got {v!r}")
    if "sizeAdd" in box and not is_number(box["sizeAdd"]):
        R.err(where, f"`sizeAdd` must be a number, got {box['sizeAdd']!r}")
    if "sizesAdd" in box:
        sa = box["sizesAdd"]
        if not (isinstance(sa, list) and len(sa) == 3 and all(is_number(c) for c in sa)):
            R.err(where, f"`sizesAdd` must be 3 numbers, got {sa!r}")


def collect_ids(part, ids, where, R):
    """Recursively collect declared ids/part-names for cross-reference."""
    if not isinstance(part, dict):
        return
    for key in ("id", "part"):
        v = part.get(key)
        if isinstance(v, str):
            ids.add(v)
    for sm in part.get("submodels", []) or []:
        collect_ids(sm, ids, where, R)
    if isinstance(part.get("submodel"), dict):
        collect_ids(part["submodel"], ids, where, R)


def check_part(part, where, R, is_root):
    """Validate a part definition (inline model object, or a .jpm root)."""
    if not isinstance(part, dict):
        R.err(where, "part must be an object"); return
    if "sprites" in part:
        R.warn(where, "`sprites` is present — EMF does NOT support sprites; use `boxes` instead")
    if "translate" in part:
        t = part["translate"]
        if not (isinstance(t, list) and len(t) == 3 and all(is_number(c) for c in t)):
            R.err(where, f"`translate` must be 3 numbers, got {t!r}")
    if "rotate" in part:
        ro = part["rotate"]
        if not (isinstance(ro, list) and len(ro) == 3 and all(is_number(c) for c in ro)):
            R.err(where, f"`rotate` must be 3 numbers, got {ro!r}")
    if "invertAxis" in part and not (isinstance(part["invertAxis"], str)
                                     and set(part["invertAxis"]) <= set("xyz")):
        R.err(where, f"`invertAxis` must be a subset of 'xyz', got {part['invertAxis']!r}")
    for box_i, box in enumerate(part.get("boxes", []) or []):
        check_box(box, f"{where} > boxes[{box_i}]", R)
    # animations only valid on a root/parent
    if "animations" in part and not is_root:
        R.err(where, "`animations` declared on a submodel — animations must be on the parent/root part")
    # recurse
    for i, sm in enumerate(part.get("submodels", []) or []):
        check_part(sm, f"{where} > submodels[{i}]", R, is_root=False)
    if "submodel" in part:
        check_part(part["submodel"], f"{where} > submodel", R, is_root=False)


def check_animations(anim_list, where, R, known_targets):
    if not isinstance(anim_list, list):
        R.err(where, "`animations` must be a list of objects"); return
    declared_vars = set()
    # first pass: collect declared var./varb. names so later refs don't false-flag
    for obj in anim_list:
        if isinstance(obj, dict):
            for k in obj:
                if k.startswith("var.") or k.startswith("varb."):
                    declared_vars.add(k)
    for oi, obj in enumerate(anim_list):
        if not isinstance(obj, dict):
            R.err(f"{where}[{oi}]", "animation entry must be an object"); continue
        for key, expr in obj.items():
            kw = f"{where}[{oi}] key `{key}`"
            # ---- validate destination key ----
            if key.startswith("var.") or key.startswith("varb."):
                pass
            elif key.startswith("render."):
                rv = key.split(".", 1)[1]
                if rv not in RENDER_VARS:
                    R.err(kw, f"unknown render variable `render.{rv}`")
            elif "." in key:
                target, var = key.rsplit(".", 1)
                if var not in MODEL_VARS:
                    R.err(kw, f"unknown model variable `.{var}` (expected one of {sorted(MODEL_VARS)})")
                # target existence is best-effort: only info, targets may be external/hierarchical
                base_target = target.split(":")[0]
                if known_targets and base_target not in {"this", "part"} \
                        and base_target not in known_targets:
                    R.info(kw, f"animation target `{target}` not found among declared parts "
                               f"(ok if it is a vanilla part or cross-file reference)")
            else:
                R.err(kw, f"animation key `{key}` is not TARGET.VAR / var.* / varb.* / render.*")
            # ---- scan expression identifiers ----
            # A bare number (e.g. 0 instead of "0") is accepted by EMF/OptiFine and
            # used by Fresh Animations; only non-string/non-number values are wrong.
            if is_number(expr):
                continue
            if not isinstance(expr, str):
                R.err(kw, f"expression must be a string or number, got {expr!r}"); continue
            for m in IDENT.finditer(expr):
                tok = m.group(0)
                end = m.end()
                is_call = end < len(expr) and expr[end:end+1].lstrip(" ") .startswith("(")
                head = tok.split(".")[0]
                if "." in tok:
                    # var.x / varb.x / model-target.var / render.x  -> structural, skip deep check
                    if tok in declared_vars: continue
                    if head in ("var","varb","render"): continue
                    continue  # cross-part ref, can't verify here
                if is_call:
                    if tok not in KNOWN_FUNCS:
                        R.warn(kw, f"unknown function `{tok}()` in expression")
                else:
                    if tok in KNOWN_VARS: continue
                    if tok in ("var","varb","render","this","part"): continue
                    R.warn(kw, f"unknown identifier `{tok}` in expression "
                               f"(not a known CEM/EMF variable; typo?)")


def resolve_texture(model, base_dir, R):
    tex = model.get("texture")
    if not isinstance(tex, str): return
    # form: namespace:textures/entity/foo.png  -> assets/<ns>/textures/entity/foo.png
    if ":" in tex:
        ns, rel = tex.split(":", 1)
    else:
        ns, rel = "minecraft", tex
    # walk up to an assets/ root if present
    p = base_dir
    assets_root = None
    while True:
        if os.path.basename(p) == "assets":
            assets_root = p; break
        parent = os.path.dirname(p)
        if parent == p: break
        p = parent
    if not assets_root:
        return  # can't resolve outside a pack layout; skip silently
    cand = os.path.join(assets_root, ns, rel)
    if not os.path.isfile(cand):
        R.warn("texture", f"texture `{tex}` not found at {cand}")


def validate_jem(data, path, R):
    base_dir = os.path.dirname(os.path.abspath(path))
    if not isinstance(data, dict):
        R.err("root", "top-level .jem must be a JSON object"); return
    if "textureSize" in data:
        ts = data["textureSize"]
        if not (isinstance(ts, list) and len(ts) == 2 and all(is_number(c) for c in ts)):
            R.err("root", f"`textureSize` must be 2 numbers, got {ts!r}")
    if "shadowSize" in data and not is_number(data["shadowSize"]):
        R.err("root", f"`shadowSize` must be a number, got {data['shadowSize']!r}")
    models = data.get("models")
    if models is None:
        R.err("root", "missing required `models` array"); return
    if not isinstance(models, list) or not models:
        R.err("root", "`models` must be a non-empty array"); return

    resolve_texture(data, base_dir, R)

    # collect ids/parts across whole file for cross-reference
    known = set()
    for m in models:
        collect_ids(m, known, "models", R)

    seen_ids = {}
    for i, m in enumerate(models):
        where = f"models[{i}]"
        if not isinstance(m, dict):
            R.err(where, "model entry must be an object"); continue
        if "part" not in m or not isinstance(m["part"], str) or not m["part"]:
            R.err(where, "model missing required string `part`")
        if "id" not in m:
            R.info(where, "model has no `id` (fine; parts can be targeted by `part` name)")
        else:
            mid = m["id"]
            if mid in seen_ids:
                R.err(where, f"duplicate id `{mid}` (also at {seen_ids[mid]})")
            else:
                seen_ids[mid] = where
        if "attach" in m and not isinstance(m["attach"], (bool, str)):
            R.err(where, f"`attach` must be boolean (or \"true\"/\"false\"), got {m['attach']!r}")
        if "scale" in m and not is_number(m["scale"]):
            R.err(where, f"`scale` must be a number, got {m['scale']!r}")
        if "baseId" in m and isinstance(m["baseId"], str) and m["baseId"] not in known:
            R.warn(where, f"`baseId` references `{m['baseId']}` which is not a declared id in this file")
        # external jpm?
        jpm = m.get("model")
        if isinstance(jpm, str):
            cand = os.path.join(base_dir, jpm)
            if not os.path.isfile(cand):
                R.err(where, f"`model` references `{jpm}` but file not found at {cand}")
            else:
                sub = load_json(cand, R)
                if sub is not None:
                    check_part(sub, f"{where}->{jpm}", R, is_root=True)
                    if "animations" in sub:
                        check_animations(sub["animations"], f"{where}->{jpm} animations", R, known)
        else:
            # inline part definition
            check_part(m, where, R, is_root=True)
        if "animations" in m:
            check_animations(m["animations"], f"{where} animations", R, known)


def validate_jpm(data, path, R):
    # a .jpm is a single part; treat as root for animation rules
    check_part(data, "root", R, is_root=True)
    known = set(); collect_ids(data, known, "root", R)
    if isinstance(data, dict) and "animations" in data:
        check_animations(data["animations"], "root animations", R, known)


def load_json(path, R=None):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        msg = f"JSON parse error: {e.msg} at line {e.lineno}, col {e.colno}"
        if R: R.err("json", msg)
        else: print(f"  ERROR  {msg}")
        return None
    except OSError as e:
        if R: R.err("io", str(e))
        else: print(f"  ERROR  {e}")
        return None


def validate_file(path, quiet=False):
    R = Reporter(path)
    data = load_json(path, R)
    if data is not None:
        if path.endswith(".jpm"):
            validate_jpm(data, path, R)
        else:  # .jem and anything else treated as model
            validate_jem(data, path, R)
    # ---- print report ----
    rel = path
    n_e, n_w, n_i = len(R.errors), len(R.warnings), len(R.infos)
    status = "OK" if n_e == 0 else "FAIL"
    print(f"\n[{status}] {rel}  ({n_e} error(s), {n_w} warning(s))")
    for where, msg in R.errors:
        print(f"  ERROR  {where}: {msg}")
    if not quiet:
        for where, msg in R.warnings:
            print(f"  WARN   {where}: {msg}")
        for where, msg in R.infos:
            print(f"  info   {where}: {msg}")
    return n_e


def gather(paths):
    out = []
    for p in paths:
        if os.path.isdir(p):
            for root, _, files in os.walk(p):
                for fn in files:
                    if fn.endswith((".jem", ".jpm")):
                        out.append(os.path.join(root, fn))
        else:
            out.append(p)
    return out


def main(argv):
    quiet = False
    args = []
    for a in argv[1:]:
        if a in ("-q", "--quiet"): quiet = True
        else: args.append(a)
    if not args:
        print(__doc__); return 2
    files = gather(args)
    if not files:
        print("No .jem/.jpm files found."); return 2
    total_err = 0
    for f in files:
        total_err += validate_file(f, quiet=quiet)
    print(f"\n=== {len(files)} file(s) checked, {total_err} total error(s) ===")
    return 1 if total_err else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
