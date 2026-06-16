# CEM / EMF Entity Model Reference (.jem / .jpm)

Authoritative format reference for building and rigging custom entity models in Novus.

- **Runtime in Novus:** Entity Model Features (EMF) `3.2.4` for Forge 1.20.1. No OptiFine.
- **Build target:** EMF. We author for EMF; OptiFine CEM is the base spec EMF implements, documented here so we stay portable and understand what is base vs. EMF-only.
- **Source of truth:** OptiFine CEM docs (model/parts/animation) + EMF `FEATURES.md` / `emf_model.txt`. Links at bottom. When in doubt, the installed EMF jar wins — re-verify against it before asserting.

Convention in this doc: lines marked **[BASE]** are OptiFine CEM + EMF; **[EMF]** are EMF-only extensions that will NOT work under bare OptiFine.

---

## 1. File types and locations

Two JSON file types, both plain JSON despite the custom extensions:

- `.jem` — **J**SON **E**ntity **M**odel. The whole entity: a texture, a texture size, and a list of part-models. This is the top-level file named after the entity.
- `.jpm` — **J**SON **P**art **M**odel. A single reusable part definition (boxes + submodels, optionally animations). Referenced from a `.jem` via `"model": "foo.jpm"`, or the same fields can be written inline in the `.jem`.

**Path:** `assets/<namespace>/optifine/cem/**/<entity>.jem`

- `<namespace>` is `minecraft` for vanilla entities, or the **mod id** for modded entities (e.g. `goblintraders`). EMF resolves modded entities through the entity model loader.
- The file may sit anywhere under `cem/`, or inside a subfolder named after the entity: `cem/<entity>/<entity>.jem`.
- **[EMF]** EMF also reads `assets/<namespace>/emf/cem/**`. Use this only when you need an EMF-exclusive override that should not be picked up by an OptiFine user. For Novus (EMF-only), `optifine/cem` is fine and is what Blockbench exports to.
- The `.jem` filename must match a known entity/part name (see §7) or be in a correctly-named subfolder.

**Novus convention:** integration models live in their resource pack under `assets/<modid>/optifine/cem/...`. For our own assets, keep namespaced and additive — do not route entity models through Paxi.

**Gold-standard reference pack:** Fresh Animations v1.10.4 (in the pack as `config/paxi/resourcepacks/FreshAnimations_v1.10.4_Novus.zip`, and unpacked copies under `backups/`). 211 known-good `.jem`/`.jpm` files — the authoritative example of correct rigging and animation idioms. *Note: the `FA+GoblinTraders` files under `resourcepacks-build/` are a failed attempt, NOT a reference — do not copy their patterns.*

---

## 2. `.jem` model file — keys

```jsonc
{
  "texture": "namespace:textures/entity/foo.png",  // [BASE] optional; texture for the whole model
  "textureSize": [W, H],                            // [BASE] optional; texture px size, e.g. [64,64]
  "shadowSize": 0.5,                                // [BASE] optional; 0.0–1.0 shadow scale
  "models": [ /* list of part-models, see below */ ] // [BASE] REQUIRED
}
```

Each object in `models`:

| Key | Type | Req | Notes |
|---|---|---|---|
| `part` | string | **yes** | Vanilla/modded part this attaches to. Must be a valid part name for the entity (§7). |
| `id` | string | no | Identifier so animations / `baseId` can target this model. Strongly recommended. |
| `model` | string | no | Path to a `.jpm` to load this part's geometry from. If absent, write the part fields (`boxes`, `submodels`, …) **inline** in this same object. |
| `baseId` | string | no | Inherit all properties from another model with this `id`. |
| `attach` | bool | no | `true` = add to the vanilla part (keep original); `false`/absent = **replace** the vanilla part. |
| `scale` | float | no | Render scale, default `1.0`. `0.0` = invisible. |
| `translate` | `[x,y,z]` | no | Position of this part. **Note the CEM sign convention** — see §5. |
| `animations` | array | no | Animation expressions; see §6. **Must live on the parent/root model object, not a submodel.** |
| *(part fields)* | — | no | `boxes`, `submodels`, `rotate`, `invertAxis`, etc. inline when `model` is absent. |

Inheritance: a model with `baseId` copies the referenced model and overrides only what it redefines — useful for left/right mirrored limbs.

---

## 3. `.jpm` part file — keys

```jsonc
{
  "invertAxis": "xyz",          // [BASE] axes to invert; Blockbench exports "xyz" almost always
  "translate": [x, y, z],       // [BASE] move the part (see §5 sign note)
  "rotate": [ax, ay, az],       // [BASE] rotate in DEGREES around x,y,z
  "mirrorTexture": "uv",        // [BASE] mirror texture on u and/or v
  "boxes": [ /* cuboids */ ],   // [BASE] the geometry
  "sprites": [ /* … */ ],       // [BASE] 3D sprites — NOT SUPPORTED by EMF (see §8)
  "submodels": [ /* child parts, same schema, recursive */ ],
  "submodel":  { /* single child part */ },
  "animations": [ /* only meaningful on a root/parent */ ]
}
```

### Boxes

```jsonc
{
  "coordinates": [x, y, z, width, height, depth],  // REQUIRED; origin + size
  "textureOffset": [u, v],                          // box-style UV …
  // --- OR per-face UV (mutually exclusive with textureOffset) ---
  "uvDown":  [u1,v1,u2,v2], "uvUp":   [...],
  "uvNorth": [...] /* alias uvFront */, "uvSouth": [...] /* alias uvBack */,
  "uvWest":  [...] /* alias uvLeft  */, "uvEast":  [...] /* alias uvRight */,
  "sizeAdd": 0.5,                                    // inflate all dims (Blockbench "inflate")
  "sizesAdd": [sx, sy, sz]                           // asymmetric inflate
}
```

**Hard rule:** a box uses **either** `textureOffset` **or** the `uv<Face>` set — never both. Mixing them is invalid.

`submodels` is recursive: a part holds child parts; children move and rotate with the parent. This hierarchy is the "rig."

---

## 4. Animation expressions

Animations are a list of objects mapping a **destination** (key) to an **expression** (value string). Evaluated every frame.

```jsonc
"animations": [
  { "var.ls": "limb_swing/1.2" },                 // define helpers first
  { "left_leg.rx": "cos(var.ls*2)*1.4*limb_speed" } // then targets
]
```

### Destinations (keys)

`TARGET.VAR` where `VAR` is one of:

- `tx, ty, tz` — translation (default 0)
- `sx, sy, sz` — scale (default 1)
- `rx, ry, rz` — rotation in **radians** (default 0)
- `visible` — bool, show part + submodels
- `visible_boxes` — bool, show this part's boxes only (not submodels)

Plus standalone:
- `var.NAME` — float scratch variable (persists between frames per-entity; uninitialized = 0)
- `varb.NAME` — boolean scratch variable (default false)
- `render.shadow_size`, `render.shadow_opacity`, `render.shadow_offset_{x,z}`, `render.leash_offset_{x,y,z}`

### Targets

- `this` — the current model. `part` — the original vanilla part it attaches to.
- `<part name>` or `<id>` — another part by name or id.
- Hierarchical: `head:left_horn:tip` — walk nested parts by name/id; intermediate levels may be skipped; first deep match wins.

### Critical rigging rules

1. **Rotations are radians.** Game inputs like `head_pitch`/`head_yaw` are degrees → wrap in `torad(...)`. Fresh Animations does this in 55 of its models, e.g. `"head.ry": "torad(head_yaw)/1.2 + ..."`.
2. **`animations` must be on the parent/root model object**, never on a submodel. EMF/OptiFine ignore animations declared on sub-bones.
3. Define `var.*` helpers in an earlier object than the targets that consume them, so ordering resolves cleanly. Fresh Animations declares a block of `var.*`/`varb.*` (e.g. `var.ls`, `var.aggro`, `var.hurt`) first, then references them in the `*.rx`/`*.ry`/`*.rz` targets.
4. Reuse via cross-part refs: a target's expression can read another part's resolved value, e.g. `"hood.rx": "head.rx"`.

### Built-in variables (selected, [BASE])

Movement: `limb_swing`, `limb_speed`, `swing_progress`, `age`, `time`, `frame_time`, `frame_counter`.
Look: `head_yaw`, `head_pitch`, `rot_x/rot_y`, `pos_x/y/z`, `player_pos_*`, `player_rot_*`.
State bools: `is_alive`, `is_burning`, `is_child`, `is_sneaking`, `is_sprinting`, `is_riding`, `is_ridden`, `is_in_water`, `is_in_lava`, `is_on_ground`, `is_aggressive`, `is_sitting`, `is_tamed`, `is_wet`, `is_glowing`, `is_invisible`, `is_hurt`, …
Stats: `health`, `max_health`, `hurt_time`, `death_time`, `anger_time`.
Misc: `id` (unique per entity — seed `random()` with it), `rule_index`, `dimension`, `day_time`, `day_count`.
Constants: `pi`, `true`, `false`.

### Functions ([BASE])

`sin cos tan asin acos atan atan2` (degrees in/out), `torad todeg`, `min max clamp abs floor ceil round signum sqrt exp frac log pow fmod`, `random(seed?)`, `lerp(k,x,y)`, `if(cond,val,…,else)`, `ifb(...)` (boolean), `between(x,min,max)`, `equals(x,y,margin)`, `in(x, …)`, `print/printb` (debug).

---

## 5. Coordinate & pivot gotchas

- CEM uses a Y-down-ish convention inherited from the old model system; **Blockbench's OptiFine/CEM exporter handles the conversion** and writes `invertAxis: "xyz"`. If you hand-edit, keep `invertAxis` consistent with how the boxes were authored or the model flips.
- `translate` positions the part's pivot. Sign conventions trip people up: positive `translate[1]` (y) and on-screen "up" do not always match because of `invertAxis`. Author in Blockbench, then hand-tune.
- `coordinates` origin `[x,y,z]` is the corner of the box, not its center; `[width,height,depth]` extend from there.
- A box with one zero dimension (e.g. width `0`) is a flat plane — valid and commonly used for ears/fins/wings.
- **Negative `width`/`height`/`depth` are valid** and mirror/flip the box; Fresh Animations uses negative dims routinely. Do not "fix" them.

---

## 6. EMF-exclusive features [EMF]

Will not work under bare OptiFine — fine for Novus since we run EMF.

### Extra model files
- **Armor:** `MOBNAME_inner_armor.jem` (leggings layer) and `MOBNAME_outer_armor.jem` (rest), for any biped. Parts: `head, headwear, body, left_arm, right_arm, left_leg, right_leg`. Generic `inner_armor.jem`/`outer_armor.jem` act as fallbacks; baby variants fall back to adult.
- **Player:** `player.jem`, `player_slim.jem`, `player_cape.jem`. Player parts include `ear, left_sleeve, right_sleeve, left_pants, right_pants, jacket, cloak`. *Blockbench mislabels `*_sleeve` as `*_sleve` in its unsupported player model — fix in a text editor.* `player_cape.jem` (only a `cloak` part) renders without vanilla cape animation, enabling fully custom cape motion.
- **Auto-captured vanilla not in OptiFine:** `shield.jem` (plate, handle), `elytra.jem` (left_wing, right_wing), `spin_attack.jem`.

### Extra animation variables
`is_climbing`, `is_blocking`, `is_crawling`, `distance` (blocks from client player), `fluid_depth` / `fluid_depth_up` / `fluid_depth_down`, `move_forward` & `move_strafing` (−1..1 directionality vs. facing — multiply directional sub-animations by these to blend), `nan` (→ Float.NaN, debugging), `e` (Euler's number).

### Extra animation functions
- `keyframe(k, a, b, c, …)` / `keyframeloop(...)` — `k` is the timeline; each further arg is a keyframe value at integer steps, linearly interpolated. `loop` wraps past the last frame.
- Easing: `easeinoutexpo easeinexpo easeoutexpo easeinoutcirc easeincirc easeoutcirc easeinoutelastic easeinelastic easeoutelastic easeinoutback easeinback easeoutback easeinoutbounce easeinbounce easeoutbounce easeinquad easeoutquad easeinoutquad easeincubic easeoutcubic easeinoutcubic easeinquart easeoutquart easeinoutquart easeinquint easeoutquint easeinoutquint easeinsine easeoutsine easeinoutsine` — all called like `lerp()`: `(delta, start, end)`. Curve previews: easings.net.
- Splines/curves: `catmullrom()` (5 args), `quadbezier()`/`cubicbezier()` (4 args), `hermite()` (5 args) — delta first.
- Rotation helpers: `wrapdeg() wraprad()` (reduce to smallest equivalent), `degdiff() raddiff()` (shortest signed difference between two angles).

### Other
- **Modded entity CEM:** supported for any modded entity surfaced through the entity model loader; part names differ from in-code names — export to discover them.
- **Model export tool:** EMF config GUI → Models → pick a model → "Export model as .jem", or Tools → "Export models" slider for bulk. Output lands in `[MC_DIR]/emf/export/`. Exported models have correct pivots/boxes/UVs and open directly in Blockbench — **this is the fastest way to get a correct starting rig for any vanilla or modded entity.**
- **ETFAnimationApi:** mods can register custom animation functions/variables.

---

## 7. Part names

The full vanilla part-name table (per entity, plus baby/boat/minecart/block-entity/variant fallbacks) is reproduced in `emf_model.txt` and the OptiFine `cem_entity_names` page. Key reminder: **part names are EMF/OptiFine names, not the in-code field names** — a modded `cow.jem` will have different part names than its Java model even if it copies the vanilla cow. Always confirm names by exporting the target entity. Most bipeds use: `head, headwear, body, left_arm, right_arm, left_leg, right_leg`. Most quadrupeds use: `body, head, leg1 … leg4`. Models (except `banner`, `bed`, `conduit`, `decorated_pot`) also expose a `root` part.

---

## 8. Known limits & Novus-specific notes

- **Sprites are not supported by EMF.** Avoid `sprites`; use `boxes`. (OptiFine-only feature.)
- **`trident.jem`** can't declare a texture override in EMF — it uses the default (texture still variable via ETF).
- **Incompatible mods:** OptiFine, OptiFabric, dorianpb's CEM. (N/A for Novus, but note if migrating assets.)
- EMF handles random models like OptiFine: `foo.jem`, `foo2.jem`, … selected by entity id, customizable with a `foo.properties` file using `models.<n>=<list>` (same syntax as Random Entities). `rule_index` exposes the matched rule to animations.
- 1.20.1 is frozen — no need to hedge for future MC changes.

---

## 9. Validation

Run the bundled validator before shipping any `.jem`/`.jpm`:

```
python3 refs/jem_validator.py <path-to-.jem-or-.jpm-or-folder>
```

It checks JSON validity, required keys, box geometry, the `textureOffset` vs `uv<Face>` exclusivity rule, orphaned/duplicate part ids, animation target/variable sanity (including EMF-only vars/functions), and texture file existence when resolvable. See the script header for exit codes.

---

## Sources
- OptiFine CEM overview — https://optifine.readthedocs.io/cem.html
- OptiFine CEM models (.jem) — https://optifine.readthedocs.io/cem_models.html
- OptiFine CEM parts (.jpm) — https://optifine.readthedocs.io/cem_parts.html
- OptiFine CEM animation — https://optifine.readthedocs.io/cem_animation.html
- EMF FEATURES.md — https://github.com/Traben-0/Entity_Model_Features/blob/master/FEATURES.md
- EMF annotated model spec — https://github.com/Traben-0/Entity_Model_Features/blob/master/.github/emf_model.txt
- Wynem CEM tools/docs — https://wynem.com/cem/ , https://wynem.com/cemanimation/
