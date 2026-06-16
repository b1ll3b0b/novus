# kubejs/data audit — findings

**Date**: 2026-05-08
**Scope**: 168 JSON files under `novus_dev/minecraft/kubejs/data/` across 23 namespaces (dynamictrees 38, tconstruct 20, dtquark 18, kubejs 16, dttconstruct 14, minecraft 10, plus smaller namespaces).
**References**: `Novus/refs/VANILLA_REFERENCE.md`, `Novus/refs/STYLE_GUIDE.md`, plus session memories cited inline.

## Overall pack health

The pack's data/ tree is **largely clean**. No HIGH-severity schema corruption was found beyond what's already tracked (the `place_feast` re-verification). The two most impactful findings are **structural** rather than syntactic: (1) the three orphan GLM files at `forge/loot_modifiers/` and `novus/loot_modifiers/` are recursion-unsafe by their own design but inert because `global_loot_modifiers.json` registers them as `entries: []` — they should be deleted as historical residue; and (2) the Dynamic Trees branch and leaves loot tables in the `dynamictrees` and `dtquark` namespaces declare `"type": "minecraft:block"` while the parallel dttconstruct files correctly declare `"type": "dynamictrees:branches"` / `"dynamictrees:leaves"`. Several smaller findings concern style (4-space indent on tconstruct attribute files, kubejs-namespace recipes that should be novus-namespace, `bonus_rolls: 0.0` boilerplate). The vast bulk of files (despoil tables, hidden-from-recipe-viewers tags, villagers trades, Quark seed_pouch, RoadWeaver weight-0 overrides, the chocolate-bar tag stack) are well-formed and consistent with vanilla schemas.

---

## Findings

### [LOW] Orphan recursion-unsafe GLM file: skeleton_quiver_drop

**File**: `kubejs/data/novus/loot_modifiers/skeleton_quiver_drop.json`
**Category**: C / E
**Refs section violated**: STYLE_GUIDE §3 ("Don't re-introduce known recursion patterns") — content is the exact `moonlight:add_loot_table` against `minecraft:entities/skeleton` pattern memory `feedback_glm_add_loot_table_recursion.md` proscribes.
**Issue**: The file declares an `add_loot_table`-style GLM targeting an entity loot table — the documented infinite-recursion pattern. PATCHES.md (Supplementaries quiver section, "Orphan files from the failed first attempt") explicitly identifies this file as inert residue from a 2026-04-25 abandoned approach: it is not registered in `forge/loot_modifiers/global_loot_modifiers.json` (`entries: []`), so Forge never loads it. The active mechanism is `kubejs/server_scripts/quiver_drop.js` using `ServerEvents.entityLootTables`. Because the modifier is not registered, the file cannot trigger the recursion — but it remains a footgun if someone copy-pastes from it or accidentally adds the entry to the registration file.
**Suggested fix**: leave alone — flagging only. PATCHES.md offers explicit permission to delete; if/when the user wants cleanup, also delete `stray_quiver_drop.json`, `forge/loot_modifiers/global_loot_modifiers.json`, and `novus/loot_tables/inject/quiver_drop.json` together.

### [LOW] Orphan recursion-unsafe GLM file: stray_quiver_drop

**File**: `kubejs/data/novus/loot_modifiers/stray_quiver_drop.json`
**Category**: C / E
**Refs section violated**: STYLE_GUIDE §3
**Issue**: Same as above — `moonlight:add_loot_table` against `minecraft:entities/stray`. Inert (unregistered).
**Suggested fix**: leave alone — flagging only.

### [LOW] Orphan inject loot table for unregistered GLMs

**File**: `kubejs/data/novus/loot_tables/inject/quiver_drop.json`
**Category**: E
**Refs section violated**: n/a (file is well-formed)
**Issue**: The inject table referenced by the two orphan GLMs above. Carries a `"_comment_chance": "TESTING VALUE — set to 1.0 (100%)..."` note inside the pool — a vestige from the testing iteration before the GLM approach was abandoned. The 1.0 chance means **if** the GLMs were ever re-registered, every skeleton/stray would drop a quiver and (per memory) immediately stack-overflow. Acts as a tripwire: deleting just `global_loot_modifiers.json`'s `entries: []` would not be enough — the user would have to delete this orphan inject table too to defuse the trap.
**Suggested fix**: leave alone — flagging only.

### [LOW] Empty GLM registration file

**File**: `kubejs/data/forge/loot_modifiers/global_loot_modifiers.json`
**Category**: E
**Refs section violated**: n/a
**Issue**: `{ "replace": false, "entries": [] }` — registers no GLMs. Functionally a no-op file. Per PATCHES.md, kept as residue from the abandoned quiver approach. Forge's GLM resolver tolerates an empty entries list and does nothing.
**Suggested fix**: leave alone — flagging only.

### [MEDIUM] Branch loot tables declare wrong loot-context type — `dynamictrees` namespace

**File**: `kubejs/data/dynamictrees/loot_tables/trees/branches/*.json` (12 files: acacia, birch, cherry, crimson, dark_oak, jungle, mangrove, oak, spruce, warped + others)
**Category**: A
**Refs section violated**: VANILLA_REFERENCE.md §3 (`type` field controls available `LootContextParam`s); cross-checked against memory `reference_dt_loot_context.md`.
**Issue**: Every branch loot table in the `dynamictrees` namespace declares `"type": "minecraft:block"`, but the corresponding files in `dttconstruct/loot_tables/trees/branches/` (bloodshroom, enderbark, greenheart, skyroot) correctly declare `"type": "dynamictrees:branches"`. Per the dt-loot-context memory, branch drops fire under `DTLootParameterSets.BRANCHES` (a custom paramset with TOOL/SPECIES/VOLUME, no `this`/blockstate). MC's `LootContextParamSets.validate()` is permissive at registration but logs warnings/silently fails entries that depend on missing params. The branch loot in this pack only uses `match_tool` + `survives_explosion` + `dynamictrees:multiply_logs_count`, all of which work — so the in-game outcome is currently correct. But the type declaration is wrong on the merits and inconsistent with the dttconstruct sister files. If a future edit adds a `block_state_property`/`entity_properties` condition, it will silently fail; with a correct paramset declaration the failure would be a registration warning instead.
**Suggested fix**: leave alone — flagging only. Verify in-game seed yield still matches "1-4 branch baseline" (per memory) before any change.

### [MEDIUM] Branch loot tables declare wrong loot-context type — `dtquark` namespace

**File**: `kubejs/data/dtquark/loot_tables/trees/branches/{ancient,azalea,blossom,glow_shroom}.json`
**Category**: A
**Refs section violated**: VANILLA_REFERENCE.md §3; memory `reference_dt_loot_context.md`.
**Issue**: Same as the dynamictrees branch issue. All four files use `"type": "minecraft:block"` despite being branch-context loot tables (the dttconstruct equivalents use `"type": "dynamictrees:branches"`).
**Suggested fix**: leave alone — flagging only.

### [MEDIUM] Leaves tree-fall loot tables declare wrong loot-context type — `dynamictrees` and `dtquark` namespaces

**File**: `kubejs/data/dynamictrees/loot_tables/trees/leaves/*.json` (~12 files), `kubejs/data/dtquark/loot_tables/trees/leaves/*.json` (6 files), `kubejs/data/dtquark/loot_tables/trees/mushroom_caps/glow_shroom.json`
**Category**: A
**Refs section violated**: VANILLA_REFERENCE.md §3; memory `reference_dt_loot_context.md`.
**Issue**: Tree-fall leaf decay drops use `DTLootParameterSets.LEAVES` per the memory (paramset `dynamictrees:leaves`), and the dttconstruct sister files in `dttconstruct/loot_tables/trees/leaves/{earth_slime,ender_slime,sky_slime}.json` correctly declare `"type": "dynamictrees:leaves"`. The dynamictrees and dtquark equivalents declare `"type": "minecraft:block"`. Same silent-fail concern as branches if anyone adds a context-dependent condition; current content (`survives_explosion`, `table_bonus`, `dynamictrees:seasonal_seed_drop_chance`) works in either context.
**Suggested fix**: leave alone — flagging only.

### [LOW] Pack-authored recipes use `kubejs` namespace instead of `novus`

**File**: `kubejs/data/kubejs/recipes/compacting/*.json` (16 files: greenheart_seed_to_earth_slime, skyroot_seed_to_sky_slime, enderbark_seed_to_ender_slime, mega_spruce_seed_to_plant_oil, mega_jungle_seed_to_plant_oil, fiery/frosty/serene/sunny/warm_blossom_seed_to_experience, crimson/mega_crimson_seed_to_blazing_blood, bloodshroom_seed_to_ichor, ancient_seed_to_venom, warped/mega_warped_seed_to_liquid_soul)
**Category**: D
**Refs section violated**: STYLE_GUIDE §2 ("File paths") — "Pack-local content (recipes the user wrote, novel loot tables) goes under the `novus` namespace at `kubejs/data/novus/...`."
**Issue**: All 16 Create-compacting seed→fluid recipes register under namespace `kubejs:` rather than the `novus:` convention. Functionally fine — the namespace is just an ID prefix and KubeJS itself doesn't care — but it diverges from the documented Novus convention and from sibling pack-authored files (e.g. recipes added via `ServerEvents.recipes` script use `novus:*` IDs). Mass rename would change recipe IDs (loaded recipes track by ID), so no urgency.
**Suggested fix**: leave alone — flagging only.

### [LOW] tconstruct/weapon_attributes — 4-space indent + odd brace placement

**File**: `kubejs/data/tconstruct/weapon_attributes/*.json` (20 files)
**Category**: D
**Refs section violated**: STYLE_GUIDE §2 ("Naming and indentation") — 2-space indent is the documented preference; existing 4-space files are tolerated.
**Issue**: Every file is the three-line shape `{\n    "parent": "bettercombat:<weapon>"\n  }` — 4-space indent and a trailing closing-brace at 2 spaces (the closing-brace column is one level shallower than the body's indent). Style guide explicitly permits 4-space as legacy, so this is cosmetic. The brace-column mismatch is unusual but parses fine. Better Combat is installed (`bettercombat-forge-1.9.0+1.20.1.jar`) so all 20 parent IDs resolve.
**Suggested fix**: leave alone — flagging only.

### [LOW] biomancy mob_effect cradle tag — entry value not verifiable from this audit

**File**: `kubejs/data/biomancy/tags/mob_effect/cradle/life_energy_sources.json`
**Category**: B
**Refs section violated**: STYLE_GUIDE §3 ("Verify ID existence before referencing")
**Issue**: The file extends the `mob_effect/cradle/life_energy_sources` tag with `"brewinandchewin:sweet_heart"`. This is a mob-effect ID, and `CRADLE_TRIBUTES.md` §9 documents the entry as authoritative — but the entry is plain-string (`required: true` by default), so if BrewinAndChewin ever renames the effect the tag will fail to load loudly. The other two cradle overlay files (`success_sources.json`, `disease_sources.json`) follow the same plain-string pattern for `farmersrespite:caffeinated`, `brewinandchewin:tipsy`, `brewinandchewin:intoxication`, etc. Brewin'andChewin 3.2.1 and Farmer's Respite are pinned in this pack so the IDs effectively don't move.
**Suggested fix**: leave alone — flagging only. Could be made more resilient with `{ "id": "...", "required": false }` per STYLE_GUIDE §3, but the current plain-string form is also valid (it just trades silent-skip for loud-fail).

### [LOW] dynamictrees `mega_*_seed` entries use wrong entry type

**File**: `kubejs/data/dynamictrees/loot_tables/trees/branches/{crimson,warped}.json`
**Category**: A
**Refs section violated**: VANILLA_REFERENCE.md §3 (loot pool entries — `type` must be a registered loot-pool-entry type)
**Issue**: The fifth pool in each file uses `{"type": "minecraft:item", "name": "dynamictrees:mega_crimson_seed", ...}` (and `mega_warped_seed`). The other DT seed entries in the same file use `{"type": "dynamictrees:seed_item"}` — which is the DT-shipped entry type that resolves through the species' `getSeed()` API. For `mega_*_seed`, the author may have used `minecraft:item` deliberately because `seed_item` resolves to the species's own seed (regular crimson seed), and the mega seed is a different item that shares no API path. If that's the case, this is correct. Verifying requires reading DT's `seed_item` entry implementation. Either way, both entry types are valid in vanilla loot schema and both reference real items.
**Suggested fix**: leave alone — flagging only. Probably intentional per the comment above.

### [TRACKED] FarmersDelight place_feast advancement — under re-verification

**File**: `kubejs/data/farmersdelight/advancements/main/place_feast.json`
**Category**: A (under audit)
**Refs section violated**: per the user's task framing, FD's original schema may have been canonical.
**Issue**: Already tracked (task #15). The `BlockPredicate` `{"block": {"blocks": [...]}}` shape was rewritten on 2026-05-08; vanilla audit later showed FD's original `{"block": "farmersdelight:..."}` shape was canonical. Just noting it's tracked.
**Suggested fix**: leave alone — handled in task #15 follow-up.

---

## Sorted punch list (severity-first)

| Severity | Title | File |
|---|---|---|
| MEDIUM | Branch loot wrong context type — dynamictrees | `kubejs/data/dynamictrees/loot_tables/trees/branches/*.json` |
| MEDIUM | Branch loot wrong context type — dtquark | `kubejs/data/dtquark/loot_tables/trees/branches/*.json` |
| MEDIUM | Leaves tree-fall loot wrong context type — dynamictrees + dtquark | `kubejs/data/{dynamictrees,dtquark}/loot_tables/trees/leaves/*.json` + `dtquark/loot_tables/trees/mushroom_caps/glow_shroom.json` |
| LOW | Orphan GLM — skeleton_quiver_drop | `kubejs/data/novus/loot_modifiers/skeleton_quiver_drop.json` |
| LOW | Orphan GLM — stray_quiver_drop | `kubejs/data/novus/loot_modifiers/stray_quiver_drop.json` |
| LOW | Orphan inject table | `kubejs/data/novus/loot_tables/inject/quiver_drop.json` |
| LOW | Empty GLM registration | `kubejs/data/forge/loot_modifiers/global_loot_modifiers.json` |
| LOW | `kubejs:*` namespace for pack-authored recipes | `kubejs/data/kubejs/recipes/compacting/*.json` (16 files) |
| LOW | 4-space indent + brace placement | `kubejs/data/tconstruct/weapon_attributes/*.json` (20 files) |
| LOW | Plain-string mob-effect tag entry resilience | `kubejs/data/biomancy/tags/mob_effect/cradle/life_energy_sources.json` |
| LOW | `mega_*_seed` entry type discrepancy | `kubejs/data/dynamictrees/loot_tables/trees/branches/{crimson,warped}.json` |
| TRACKED | FD place_feast | `kubejs/data/farmersdelight/advancements/main/place_feast.json` |

No HIGH-severity findings.
