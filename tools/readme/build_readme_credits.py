#!/usr/bin/env python3
"""
build_readme_credits.py  —  Novus README credits/list generator.

Regenerates the Mods table, license-mix summary, and resource-pack tables in
README.md between the <!-- BEGIN:xxx --> / <!-- END:xxx --> markers, straight
from ground truth so the lists never drift:

  * mods/*.jar              -> each jar's META-INF/mods.toml (name, authors, license)
  * mods/.index/*.pw.toml   -> packwiz metadata (download source, side, project IDs)
  * tools/readme/overrides.json     -> VERIFIED license/author/name corrections
  * tools/readme/modrinth_cache.json-> canonical Modrinth licenses + slugs (offline cache)
  * tools/readme/cf_slugs.json      -> CurseForge slugs for CF-distributed mods
  * tools/readme/resourcepacks.json -> hand-maintained resource-pack credits

License precedence (most to least authoritative):
    overrides.json  >  Modrinth canonical license  >  jar mods.toml  >  (blank)
The override file is where this repo records anything checked against a project's
actual LICENSE file; those beat both the jar and the Modrinth listing.

Usage:
    python3 tools/readme/build_readme_credits.py            # rewrite README.md in place
    python3 tools/readme/build_readme_credits.py --check    # report only, exit 1 on drift
    python3 tools/readme/build_readme_credits.py --refresh  # re-fetch Modrinth cache (needs net)

Add a mod -> drop the jar in mods/, run packwiz so its .index/*.pw.toml exists,
then run this. If a license is wrong, fix it in overrides.json (not here).
"""
import json, os, re, sys, glob, zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
MODS = os.path.join(REPO, "mods")
IDX = os.path.join(MODS, ".index")
README = os.path.join(REPO, "README.md")

def load(name):
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        return json.load(f)

OVERRIDES = load("overrides.json")
MR_CACHE = load("modrinth_cache.json")
CF_SLUGS = load("cf_slugs.json")
RP = load("resourcepacks.json")
DESCRIPTIONS = load("descriptions.json")  # hand-curated one-liners keyed by display name; beat the jar's

# ------------------------------------------------------------ description clean
def clean_desc(d):
    """Turn a jar's raw description into one tidy README line."""
    if not d: return ""
    d = re.sub(r"§.", "", d)                              # strip MC color codes (e.g. §7)
    d = re.sub(r"\s+", " ", d).strip().strip('"').strip()
    # drop leaked attribution / marketing / link tails
    d = re.split(r"(?i)\s*(?:Attributions?:|Credits?:|Features include|Check out|Join (?:our|the)\b|Discord|https?://)", d, maxsplit=1)[0].strip()
    if len(d) > 115:                                      # prefer the first sentence, else hard-trim
        first = re.split(r"(?<=[.!?])\s", d, maxsplit=1)[0]
        d = first if 25 <= len(first) <= 115 else d[:112].rstrip() + "…"
    return d.replace("|", "\\|")

# ---------------------------------------------------------------- jar reading
def read_jar(jar):
    info = {"jar": os.path.basename(jar), "modid": "", "name": "", "authors": "", "license": "", "desc": ""}
    try:
        z = zipfile.ZipFile(jar); names = z.namelist()
        tp = next((c for c in ("META-INF/mods.toml", "META-INF/neoforge.mods.toml") if c in names), None)
        if tp:
            raw = z.read(tp).decode("utf-8", "replace")
            def g(p, fl=0):
                m = re.search(p, raw, fl); return m.group(1).strip().replace("\n", " ") if m else ""
            info["license"] = g(r'(?m)^\s*license\s*=\s*"(.*?)"')
            info["modid"] = g(r'(?m)^\s*modId\s*=\s*"(.*?)"')
            info["name"] = g(r'(?m)^\s*displayName\s*=\s*"(.*?)"')
            info["authors"] = g(r'(?m)^\s*authors\s*=\s*"(.*?)"', re.S)
            dm = (re.search(r"(?ms)^\s*description\s*=\s*'''(.*?)'''", raw) or
                  re.search(r'(?ms)^\s*description\s*=\s*"""(.*?)"""', raw) or
                  re.search(r'(?m)^\s*description\s*=\s*"(.*?)"', raw) or
                  re.search(r"(?m)^\s*description\s*=\s*'(.*?)'", raw))
            info["desc"] = dm.group(1) if dm else ""
        elif "fabric.mod.json" in names:
            fj = json.loads(z.read("fabric.mod.json").decode("utf-8", "replace"))
            info["modid"] = fj.get("id", ""); info["name"] = fj.get("name", "")
            info["license"] = str(fj.get("license", ""))
            a = fj.get("authors", [])
            info["authors"] = "; ".join(x if isinstance(x, str) else x.get("name", "") for x in a)
            info["desc"] = str(fj.get("description", ""))
        z.close()
    except Exception as e:
        info["name"] = f"(error reading jar: {e})"
    return info

def read_pw_index():
    by_file = {}
    for p in glob.glob(os.path.join(IDX, "*.pw.toml")):
        raw = open(p, encoding="utf-8").read()
        def s(pat):
            m = re.search(pat, raw, re.M); return m.group(1) if m else ""
        fn = s(r"^filename\s*=\s*'(.*?)'") or s(r'^filename\s*=\s*"(.*?)"')
        if not fn: continue
        by_file[fn] = {
            "name": s(r"^name\s*=\s*'(.*?)'") or s(r'^name\s*=\s*"(.*?)"'),
            "side": s(r"^side\s*=\s*'(.*?)'"),
            "mode": s(r"^mode\s*=\s*'(.*?)'"),
            "modrinth": s(r"^mod-id\s*=\s*'(.*?)'"),
            "curseforge": s(r"^project-id\s*=\s*(\d+)"),
        }
    return by_file

# ---------------------------------------------------------- license normalize
def norm_license(s):
    if not s: return ""
    t = s.strip()
    low = t.lower()
    if "insert license here" in low: return ""
    # LicenseRef-* from Modrinth
    refmap = {
        "licenseref-all-rights-reserved": "All Rights Reserved",
        "licenseref-create-mod-license": "Custom — Create Mod License",
        "licenseref-botania-license": "Custom — Botania License",
        "licenseref-tr7zw-protective-license": "Custom — tr7zw Protective License",
        "licenseref-tdl-m": "Custom — TDL-M",
        "licenseref-polyform-perimeter-license-1.0.1": "PolyForm Perimeter 1.0.1",
        "licenseref-lgpl-with-additional-dependency-clause": "Custom — LGPL + dependency clause",
        "licenseref-supplementaries-team-license": "Custom — Supplementaries Team License",
        "licenseref-supplementaries-team-license-1.1": "Custom — Supplementaries Team License",
        "licenseref-osl-3.0": "OSL-3.0",
        "licenseref-custom": "Custom",
    }
    if low in refmap: return refmap[low]
    if low.startswith("licenseref-see-terms"): return "Custom"
    if low.startswith("licenseref-undopia"): return "Custom — Undopia Patch License"
    # plain ARR
    if low.replace(".", "").strip() in ("all rights reserved", "arr"): return "All Rights Reserved"
    # CC
    if "cc0" in low: return "CC0-1.0"
    if "by-nc-sa" in low or "by-nc-sa" in low.replace(" ", "-"):
        return "CC-BY-NC-SA-4.0" if "4" in low else "CC-BY-NC-SA-3.0"
    if "cc-by-4" in low or low == "cc-by-4.0": return "CC-BY-4.0"
    # families
    if "unlicense" in low: return "Unlicense"
    if "mpl" in low or "mozilla public" in low: return "MPL-2.0"
    if "apache" in low: return "Apache-2.0"
    if "agpl" in low: return "AGPL-3.0-or-later" if "later" in low else "AGPL-3.0-only"
    if "lgpl" in low or "lesser general public" in low:
        if "2.1" in low or "v2.1" in low or "v2_1" in low: return "LGPL-2.1-only"
        return "LGPL-3.0-or-later" if "later" in low else "LGPL-3.0-only"
    if "gpl" in low or "general public" in low:
        return "GPL-3.0-or-later" if "later" in low else "GPL-3.0"
    if low.startswith("bsd"):
        if "4" in low: return "BSD-4-Clause"
        if "2" in low: return "BSD-2-Clause"
        return "BSD-3-Clause"
    if "afl" in low or "academic free" in low: return "AFL-3.0"
    if "osl" in low: return "OSL-3.0"
    if low.startswith("mit"): return "MIT"
    if "& cc-by-nc" in low: return t  # Biomancy-style dual license, keep verbatim
    if low.startswith("custom") or low.startswith("polyform"): return t
    if low.startswith("http"): return ""  # bare URL placeholder
    return t  # already clean / unknown-but-explicit

OPEN = {"MIT", "Apache-2.0", "LGPL-3.0-only", "LGPL-3.0-or-later", "LGPL-2.1-only",
        "GPL-3.0", "GPL-3.0-or-later", "AGPL-3.0-only", "AGPL-3.0-or-later",
        "MPL-2.0", "BSD-2-Clause", "BSD-3-Clause", "BSD-4-Clause", "OSL-3.0",
        "Unlicense", "CC0-1.0", "CC-BY-4.0", "AFL-3.0"}

def bucket(lic):
    if not lic: return "unverified"
    if lic == "All Rights Reserved": return "arr"
    if lic in OPEN: return "open"
    if lic.startswith("CC-BY-NC"): return "cc-nc"
    return "custom"  # Custom — *, PolyForm, dual, etc.

# ---------------------------------------------------------------- build rows
def build_rows():
    pw = read_pw_index()
    rows, warnings, footnotes = [], [], {}
    for jar in sorted(glob.glob(os.path.join(MODS, "*.jar")), key=str.lower):
        j = read_jar(jar)
        p = pw.get(j["jar"], {})
        # Match by modId; fall back to the Modrinth project id for jars that
        # ship no mods.toml (e.g. Sinytra Connector), whose modId reads blank.
        ov = OVERRIDES.get(j["modid"]) or OVERRIDES.get(p.get("modrinth", ""), {})
        # name
        name = ov.get("name") or j["name"] or p.get("name") or j["jar"]
        # description: hand-curated override (by name) beats the cleaned jar description
        desc = DESCRIPTIONS.get(name) or clean_desc(j["desc"])
        if not desc:
            warnings.append(f"no description: {name} ({j['modid'] or j['jar']})")
        # authors
        authors = ov.get("authors") or j["authors"] or "—"
        # license precedence
        if "license" in ov:
            lic = norm_license(ov["license"]) or ov["license"]
        else:
            mr = MR_CACHE.get(p.get("modrinth", ""), {})
            lic = norm_license(mr.get("license_id", "")) or norm_license(j["license"])
        # footnote from override note
        note = ov.get("note", "")
        fn = ""
        if note:
            footnotes.setdefault(note, len(footnotes) + 1)
            fn = footnotes[note]
        # source link
        link = source_link(j["modid"], p, ov)
        if link == "—":
            warnings.append(f"no source link: {name} ({j['modid'] or j['jar']})")
        if not lic:
            warnings.append(f"blank license: {name} ({j['modid'] or j['jar']})")
        rows.append({"name": name, "desc": desc, "authors": authors, "license": lic, "fn": fn,
                     "link": link, "bucket": bucket(lic)})
    rows.sort(key=lambda r: r["name"].lower())
    return rows, warnings, footnotes

def source_link(modid, p, ov):
    if "source" in ov:  # explicit override {type, slug}
        s = ov["source"]
        if s["type"] == "modrinth": return f"[Modrinth](https://modrinth.com/mod/{s['slug']})"
        return f"[CurseForge](https://www.curseforge.com/minecraft/mc-mods/{s['slug']})"
    mode = p.get("mode", "")
    if "curseforge" in mode or (p.get("curseforge") and not p.get("modrinth")):
        slug = CF_SLUGS.get(modid)
        if slug: return f"[CurseForge](https://www.curseforge.com/minecraft/mc-mods/{slug})"
    mr = MR_CACHE.get(p.get("modrinth", ""), {})
    if mr.get("slug"): return f"[Modrinth](https://modrinth.com/mod/{mr['slug']})"
    slug = CF_SLUGS.get(modid)
    if slug: return f"[CurseForge](https://www.curseforge.com/minecraft/mc-mods/{slug})"
    return "—"

# ---------------------------------------------------------------- rendering
def render_mods(rows, footnotes):
    out = [f"_{len(rows)} mods. This table is generated from the jars and packwiz "
           "metadata by `tools/readme/build_readme_credits.py` — don't edit it by hand._",
           "", "| Mod | Description | Author(s) | License | Source |", "|---|---|---|---|---|"]
    for r in rows:
        lic = r["license"] or "—"
        if r["fn"]: lic += f" [^{r['fn']}]"
        desc = r["desc"] or "—"
        out.append(f"| {r['name']} | {desc} | {r['authors']} | {lic} | {r['link']} |")
    out.append("")
    if footnotes:
        out.append("Notes on specific licenses:")
        out.append("")
        for note, n in sorted(footnotes.items(), key=lambda kv: kv[1]):
            out.append(f"[^{n}]: {note}")
        out.append("")
    out.append("A dash in the License column means no license could be confirmed from "
               "the jar, the project's listing, or its source repository. Treat those as "
               "All Rights Reserved unless and until the author states otherwise.")
    return "\n".join(out)

def render_mix(rows):
    b = {"open": 0, "arr": 0, "custom": 0, "cc-nc": 0, "unverified": 0}
    for r in rows: b[r["bucket"]] += 1
    total = len(rows)
    lines = [f"Across all {total} mods:", "", "| License type | Count |", "|---|---|",
             f"| Open source (MIT, Apache, LGPL/GPL, MPL, BSD, OSL, CC0/CC-BY, etc.) | {b['open']} |",
             f"| All rights reserved | {b['arr']} |",
             f"| Custom / source-available (Create, Supplementaries, Botania, PolyForm, etc.) | {b['custom']} |",
             f"| Creative Commons non-commercial (Quark family, Jade, the compasses) | {b['cc-nc']} |"]
    if b["unverified"]:
        lines.append(f"| License not confirmed (shown as a dash above) | {b['unverified']} |")
    return "\n".join(lines)

def render_resourcepacks():
    o = []
    o.append(RP["intro"]); o.append("")
    o.append("> **Please read — resource-pack licensing.** " + RP["warning"]); o.append("")
    o.append("### Third-party packs, included whole"); o.append("")
    o.append("| Pack(s) | Author | License / terms | Link |"); o.append("|---|---|---|---|")
    for p in RP["bundled_whole"]:
        lic = p["license"] or "—"
        if p.get("note"): lic += f" — {p['note']}"
        o.append(f"| {p['pack']} | {p['author']} | {lic} | {p['link']} |")
    o.append("")
    o.append("### Novus packs that merge or adapt third-party work"); o.append("")
    o.append("| Pack | Built from | Upstream authors |"); o.append("|---|---|---|")
    for p in RP["derived"]:
        o.append(f"| {p['pack']} | {p['built_from']} | {p['upstream']} |")
    o.append("")
    o.append("### Original packs made for Novus"); o.append("")
    o.append(RP["original_intro"]); o.append("")
    o.append("| Pack | Draws assets from |"); o.append("|---|---|")
    for p in RP["original"]:
        o.append(f"| {p['pack']} | {p['draws_from']} |")
    o.append("")
    o.append("### Source packs (assets drawn from)"); o.append("")
    o.append("Licenses confirmed from each project's listing or in-file LICENSE on "
             "2026-06-05. A blank License cell means none was stated anywhere — treat it "
             "as All Rights Reserved until confirmed."); o.append("")
    o.append("| Source pack | Author | License | Link |"); o.append("|---|---|---|---|")
    for p in RP["sources"]:
        lic = p["license"] or "—"
        if p.get("note"): lic = (lic + f" — {p['note']}") if p["license"] else (lic + f" ({p['note']})")
        o.append(f"| {p['name']} | {p['author']} | {lic} | {p['link']} |")
    o.append("")
    o.append("### Datapacks"); o.append("")
    o.append(RP["datapacks_intro"]); o.append("")
    o.append("| Datapack | Author | License | Applied via | Link |")
    o.append("|---|---|---|---|---|")
    for p in RP["datapacks"]:
        lic = p["license"] or "—"
        o.append(f"| {p['name']} | {p['author']} | {lic} | {p['applied']} | {p['link']} |")
    return "\n".join(o)

# ---------------------------------------------------------------- splice
def splice(text, tag, body):
    b, e = f"<!-- BEGIN:{tag} -->", f"<!-- END:{tag} -->"
    pat = re.compile(re.escape(b) + r"(.*?)" + re.escape(e), re.S)
    m = pat.search(text)
    if not m:
        raise SystemExit(f"marker {b} ... {e} not found in README.md")
    inline = "\n" not in m.group(1)            # keep one-liners (e.g. the mod count) inline
    repl = (b + body + e) if inline else (b + "\n" + body + "\n" + e)
    return text[:m.start()] + repl + text[m.end():]

def main():
    check = "--check" in sys.argv
    rows, warnings, footnotes = build_rows()
    text = open(README, encoding="utf-8").read()
    new = text
    new = splice(new, "MODCOUNT", str(len(rows)))
    new = splice(new, "MODS", render_mods(rows, footnotes))
    new = splice(new, "LICENSEMIX", render_mix(rows))
    new = splice(new, "RESOURCEPACKS", render_resourcepacks())

    print(f"mods: {len(rows)}")
    mix = {}
    for r in rows: mix[r["bucket"]] = mix.get(r["bucket"], 0) + 1
    print("license mix:", mix)
    if warnings:
        print("\nWARNINGS:")
        for w in warnings: print("  -", w)
    if check:
        if new != text:
            print("\nDRIFT: README.md is out of date. Run without --check to regenerate.")
            sys.exit(1)
        print("\nREADME.md is up to date.")
        return
    if new != text:
        open(README, "w", encoding="utf-8").write(new)
        print("\nREADME.md updated.")
    else:
        print("\nREADME.md already up to date.")

if __name__ == "__main__":
    main()
