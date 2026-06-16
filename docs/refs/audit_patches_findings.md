# PATCHES.md drift audit — findings

**Date**: 2026-05-08
**Method**: cross-reference of `Novus/PATCHES.md` against actual filesystem state of `novus_dev/minecraft/kubejs/data/` and `kubejs/{server,client,startup}_scripts/`.
**Scope**: drift only — no fixes proposed.

---

## 1. Summary

| Metric | Count |
|---|---|
| Distinct file/script paths explicitly mentioned in PATCHES.md | ~33 (across 16 mod entries) |
| Existing files under `kubejs/data/` (excluding the bulk of dynamictrees+dtquark seasonal-leaf overrides which the doc treats as a single "pre-existing" line item) | ~150 (most are the dynamictrees/dtquark/dttconstruct branch+leaf+leaves/blocks tables documented under a single bullet, plus biomancy despoil tables, tconstruct weapon attributes, villagersplus trades, etc.) |
| Existing scripts under `kubejs/server_scripts/` | 9 |
| Existing scripts under `kubejs/client_scripts/` | 1 (powah) plus `example.js` |
| Existing scripts under `kubejs/startup_scripts/` | 1 (cradle) plus `example.js` |
| Documented-but-missing | **0** |
| Existing-but-undocumented (substantive) | **9 distinct subsystems** — see §3 |
| Risk-class concerns | **3** entries flagged — see §4 |

Headline: doc is **not stale on the "files I claim exist" axis** — every path PATCHES.md names is present on disk. It is **incomplete** on the "files I forgot to document" axis: several large pre-existing patch families (biomancy despoil, dynamic-trees branch/leaf overrides, tconstruct weapon attributes, villagersplus trades, Powah lockdown, c:hidden_from_recipe_viewers, biomancy cradle tags, etc.) live in the filesystem with no entry in PATCHES.md.

---

## 2. Documented but missing

None. Every file path explicitly named in PATCHES.md exists on the filesystem at the stated location:

- `kubejs/data/farmersdelight/advancements/main/place_feast.json` — present
- `kubejs/data/forge/tags/{blocks,items}/stoves.json` — both present
- `kubejs/data/miners_delight/loot_modifiers/scavenging_{tentacles,silverfish}.json` — both present
- `kubejs/data/compatdelight/tags/items/chocolate.json` — present
- `kubejs/data/supplementaries/tags/items/chocolate_bars.json` — present
- `kubejs/data/forge/tags/items/bars/chocolate.json` — present
- `kubejs/data/novus/loot_tables/inject/quiver_drop.json` — present (orphan, doc admits this)
- `kubejs/data/novus/loot_modifiers/{skeleton,stray}_quiver_drop.json` — both present (orphans, doc admits)
- `kubejs/data/forge/loot_modifiers/global_loot_modifiers.json` — present (orphan, doc admits)
- `kubejs/data/moreburners/recipes/{ember_burner,converter_cover,item_application/heat_converter}.json` — all present
- `kubejs/data/moreburners/loot_tables/blocks/{ember_burner,heat_converter}.json` — both present
- `kubejs/data/create_hypertube/advancements/recipes/misc/redstone_detector_tube_attachment.json` — present
- `kubejs/data/roadweaver/worldgen/structure/roadside_grave_{notch,technoblade,fogg05,magic_muggle,easter_egg}.json` — all five present
- `kubejs/data/dttconstruct/loot_tables/blocks/{earth,ender,sky}_slime_leaves.json` — all three present
- `kubejs/data/dttconstruct/loot_tables/blocks/{green,sky,ender,blood}_slime_fruit.json` — all four present
- `server_scripts/{chocolate_bar_alternates,compatdelight_knife_removals,quiver_drop,matrix_enchanting,seed_oil,rope_tags,rope_recipes,cmyk_dye_mixing}.js` — all present

---

## 3. Existing but undocumented

Grouped by namespace. One-line description from inspecting the file content.

### biomancy / minecraft / quark / botania / goblintraders / supplementaries — despoil loot tables

`kubejs/data/{minecraft,quark,botania,goblintraders,supplementaries}/loot_tables/biomancy/despoil/*.json` (16 files):

- `minecraft/loot_tables/biomancy/despoil/{zombie,zombie_villager,zombie_horse,husk,drowned,shulker,spider,cave_spider,chicken,parrot}.json`
- `quark/loot_tables/biomancy/despoil/{crab,shiba,stoneling,toretoise}.json`
- `botania/loot_tables/biomancy/despoil/pink_wither.json`
- `goblintraders/loot_tables/biomancy/despoil/{goblin_trader,vein_goblin_trader}.json`
- `supplementaries/loot_tables/biomancy/despoil/red_merchant.json`

Guess: per-mob despoil-tool drop tables that extend Biomancy's flesh-extractor system to mobs the mod doesn't natively cover (cross-mod and vanilla-extras coverage). PATCHES.md is silent on this entire system.

### biomancy — cradle effect-source tags

`kubejs/data/biomancy/tags/mob_effect/cradle/{life_energy_sources,success_sources,disease_sources}.json`

Guess: tags adding cross-mod mob effects (e.g. `brewinandchewin:sweet_heart`) into Biomancy's Primordial Cradle effect-tribute classification. PATCHES.md doesn't mention these despite the tribute architecture being prominent in user memory and the project synopsis.

### biomancy — primordial_core recipe override

`kubejs/data/biomancy/recipes/crafting/primordial_core.json`

Guess: shaped-craft override for the primordial core (raw_meats + bone + ender pearl). Likely a Novus-specific recipe redefinition. No entry in PATCHES.md.

### tconstruct — weapon_attributes (BetterCombat integration)

`kubejs/data/tconstruct/weapon_attributes/*.json` (19 files: battlesign, broad_axe, cleaver, dagger, earth_staff, ender_staff, hand_axe, ichor_staff, kama, mattock, melting_pan, pickadze, pickaxe, scythe, sky_staff, sledge_hammer, sword, vein_hammer, war_pick)

Guess: each file is a one-liner mapping a TConstruct weapon to a BetterCombat parent (e.g. dagger → `bettercombat:dagger`). Cross-mod combat-integration patches. Completely undocumented.

### villagersplus — villager trade overrides

`kubejs/data/villagersplus/villager_trades/{alchemist,horticulturist,occultist,oceanographer}.json` (4 files)

Guess: custom trade economies for VillagersPlus's added professions (each defines novice→master tier offers). Substantive content patches, undocumented.

### dynamictrees + dtquark — branch and leaves loot tables (large)

- `kubejs/data/dynamictrees/loot_tables/trees/branches/*.json` (10: oak, birch, spruce, jungle, acacia, dark_oak, cherry, mangrove, crimson, warped)
- `kubejs/data/dynamictrees/loot_tables/blocks/*_leaves.json` (~14: vanilla + azalea variants + nether wart blocks)
- `kubejs/data/dynamictrees/loot_tables/trees/leaves/*.json` (~14)
- `kubejs/data/dtquark/loot_tables/trees/branches/{ancient,azalea,blossom,glow_shroom}.json`
- `kubejs/data/dtquark/loot_tables/blocks/{ancient,fiery_blossom,frosty_blossom,serene_blossom,sunny_blossom,warm_blossom}_leaves.json` (6)
- `kubejs/data/dtquark/loot_tables/trees/leaves/*.json` (6 matching)
- `kubejs/data/dttconstruct/loot_tables/trees/branches/{bloodshroom,enderbark,greenheart,skyroot}.json`
- `kubejs/data/dttconstruct/loot_tables/trees/leaves/{earth,ender,sky}_slime.json`

Guess: full Dynamic Trees branch and leaves loot economy — seed-drop curves, branch-volume-weighted log/stick yields, seasonal modifiers per the `reference_dt_loot_context.md` memory. Mentioned in MEMORY but **completely absent** from PATCHES.md. Only the `dttconstruct/loot_tables/blocks/*_slime_leaves.json` and `*_slime_fruit.json` subset is documented there.

### Powah — tier lockdown (recipe + EMI hide)

- `kubejs/server_scripts/powah_tier_lock.js` (130-item recipe-removal list)
- `kubejs/client_scripts/powah_tier_emi_hide.js` (companion EMI hide)
- `kubejs/data/c/tags/items/hidden_from_recipe_viewers.json` (~130 entries)
- `kubejs/data/c/tags/blocks/hidden_from_recipe_viewers.json`

Guess: the entire "Powah locked at tier 0–2 until progression milestone" system. Source-of-truth referenced in script header is `Novus/DISABLED_ITEMS.md`. Not mentioned anywhere in PATCHES.md.

### startup — cradle fluid tributes

`kubejs/startup_scripts/cradle_fluid_tributes.js`

Guess: registers BAC/FR drink fluids as Primordial Cradle fluid tributes (matches the user-memory entry `project_novus_cradle_fluid_tributes.md`). Substantive runtime patch (FluidTribute lazy-eval architecture). Not mentioned in PATCHES.md.

### createaddition — charged_snowball recipe

`kubejs/data/createaddition/recipes/charging/charged_snowball.json`

Guess: a charging-recipe injection making `powah:charged_snowball` craftable via createaddition's charging coil at 500kFE / 2k rate. Cross-mod power-economy bridge for Powah. Undocumented.

### quark — seed_pouch_holdable tag (remove agricraft:seed)

`kubejs/data/quark/tags/items/seed_pouch_holdable.json`

Guess: removes `agricraft:seed` (template/non-real seed) from Quark's seed_pouch holdable tag. Tiny patch; not in PATCHES.md.

---

## 4. Risk-class concerns

### 4a. miners_delight loot_modifiers — listed as **High**, behaves like **Low/Medium**

> "miners_delight | 2 | High — patch fixes legacy loot-condition syntax; if upstream fixes, our overrides take precedence and may diverge"

The two files just rename `"alternative"` → `"minecraft:any_of"`. The patch is structurally trivial, the loot-condition rename is a stable 1.20.1 vanilla schema fact, and divergence concerns are weak (worst case: upstream fixes upstream, ours stays; ours still works; user just hasn't deleted the file). Per STYLE_GUIDE §7.3, High is reserved for patches "sensitive to upstream changes" — these aren't sensitive at all, they're frozen 1.18-era condition-name rewrites. **Suggest re-classify Medium** (acknowledges that an upstream schema rewrite could break it, but the current syntax is stable).

### 4b. createaddition + createdieselgenerators (`seed_oil.js`) — listed as **Medium**, behaves like **Low**

> "createaddition + createdieselgenerators | Pre-existing seed_oil cleanup | Medium — tied to specific recipe IDs"

The script is a single `event.remove({id:'createaddition:compacting/seed_oil'})`. If the ID changes, the remove no-ops harmlessly — duplicate plant-oil source returns, but nothing breaks. No data-loss, no crash, no parse-failure. STYLE_GUIDE §7.3 reserves Medium for "missing-dep or mid-fragility integration". A duplicate-recipe re-emergence is purely additive content drift. **Suggest Low.**

### 4c. FarmersDelight + Supplementaries rope unification — listed as **Medium**, behaves like **Medium-leaning-High**

> "FarmersDelight + Supplementaries (rope) | Pre-existing tag + recipe streamlining | Medium — tied to specific recipe IDs"

This one is **arguably under-rated** in the opposite direction. The patch `event.remove`s FD's rope recipe and adds 1:1 conversions; if FD renames the recipe ID OR changes the rope item ID OR adds new rope variants (e.g. waxed rope), the player loses a craft path entirely (silent no-op leaves no FD rope obtainable). Compare to FD `place_feast` which is explicitly High because it's "sensitive to upstream changes". The rope patch is similarly sensitive and arguably more user-impactful. **Suggest re-classify High** — or at minimum add an explicit "if FD rope is gone, players can't make FD-recipe rope" risk note.

### 4d. Honorable mentions (not flagged, but worth a glance)

- **compatdelight knife removals** — Medium. Reasonable; if IDs rename, removes silently no-op. Aligned with style guide.
- **Supplementaries quiver drop relocation** — Medium. Reasonable; the doc itself catalogs many ways it could break (config rename, loot-function rename, GLM serializer pull).
- **RoadWeaver graves** — Low. Reasonable; weight-0 overrides are additive in spirit, fail open.
- **Forge `maxThreads = 1`** — Low. Reasonable; a stock config knob.

---

## 5. Recent-change verification (2026-05-08)

### 5a. Slime fruit empty-pool stubs — VERIFIED LANDED

Doc lines 280-284 list:
```
kubejs/data/dttconstruct/loot_tables/blocks/blood_slime_fruit.json
kubejs/data/dttconstruct/loot_tables/blocks/ender_slime_fruit.json
kubejs/data/dttconstruct/loot_tables/blocks/green_slime_fruit.json
kubejs/data/dttconstruct/loot_tables/blocks/sky_slime_fruit.json
```

Filesystem: all four exist. Content of `blood_slime_fruit.json`:
```json
{
  "type": "minecraft:block",
  "pools": []
}
```

Matches doc's stated "empty-pool stub" shape. **Reflected correctly.**

### 5b. Slime leaves `alternative` → `any_of` fix — VERIFIED LANDED

Doc lines 273-278 list:
```
kubejs/data/dttconstruct/loot_tables/blocks/earth_slime_leaves.json
kubejs/data/dttconstruct/loot_tables/blocks/ender_slime_leaves.json
kubejs/data/dttconstruct/loot_tables/blocks/sky_slime_leaves.json
```
with note "fixed to `minecraft:any_of` on 2026-05-08".

Filesystem spot-check of all three: each contains `"condition": "minecraft:any_of"` near the top of the loot pool's match-tool block. No remaining `"alternative"` strings. **Reflected correctly.**

### 5c. Doc note about earth/ender/sky vs. blood

Doc treats the three documented `*_slime_leaves.json` (earth, ender, sky) and four fruits (green, sky, ender, blood) cleanly. There is **no `blood_slime_leaves.json`** on disk and the doc doesn't claim one — consistent. The `green_slime_leaves.json` similarly absent and not claimed.

---

## Appendix — methodology notes

- Walked `kubejs/data/**/*.json`, `kubejs/{server,client,startup}_scripts/**/*.js` and grouped by namespace; cross-referenced PATCHES.md headings and `kubejs/...` path mentions.
- Did not audit configurations under `config/` (PATCHES.md mentions `fml.toml` and `supplementaries-common.toml` but these are out of scope per instructions).
- Treated `example.js` files in `client_scripts/` and `startup_scripts/` as KubeJS skeleton boilerplate, not substantive patches.
- Did not assess correctness of patch contents — only doc-vs-disk presence and stated risk-class plausibility.
