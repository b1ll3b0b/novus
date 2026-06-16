# Novus Pack — Local Patch Registry

This document lists every datapack override and KubeJS script we ship under `novus_dev/minecraft/kubejs/` that targets a third-party mod. Use it when a mod updates: visit the entry, check whether the patch is still needed (the upstream bug may have been fixed, or the file paths/IDs may have changed).

**Convention**: a patch is "Claude-session" if it was authored during a 2026-04-24 review session, or "Pre-existing" if it predates that work.

## Quick index

| Mod | Patch count | Risk if mod updates |
|---|---|---|
| FarmersDelight | 2 (`place_feast`, `cake_from_milk_bottle`) | High — both patches override FD-namespaced advancements that FDP malformedly clobbers; rename/restructure breaks them |
| tcintegrations | 1 fluid_effect override + 1 c-tag fluid hide (24 entries) | Medium — substitutes `botania:soul_cross` for the broken `ars_nouveau:recovery` reference and hides 12 dormant TCI fluids (with flowing variants) from EMI |
| immersive_gateways | 2 (structure_set override dropping `plains/0` + spacing retune 32→40 / 8→10; structure-tag override dropping `plains/0` from `#immersive_gateways:plains`) | Low — additive overrides; if the mod renames `plains/0` or restructures the schema they silently no-op |
| FarmersDelightPlus | 1 (via `forge:stoves`) | Medium — patch handles a missing-dep tag entry |
| miners_delight | 2 | Medium — patch is a frozen 1.18-era condition rename; only at risk if upstream rewrites the loot schema entirely |
| compatdelight | 1 (chocolate tag) + 1 (knife removals script) + 2 (EMI hide entries) | Low — additive merge tag + recipe-removal script for moss/sculk_vein knives (restored 2026-05-09 after false-removal on 2026-05-08); Sweet Delight conversions removed 2026-05-08 |
| supplementaries | 1 (chocolate_bars tag) | Low — additive merge tag, harmless if upstream changes |
| Create + create_central_kitchen | 1 (chocolate bars tag) | Low — additive merge tag |
| diagonalfences + diagonalwalls | 2 (non-diagonal blacklist tags, 16 blocks) | Low — cosmetic noise-suppression; resync if the diagonal WARN list changes |
| Biomancy (despoil + cradle + recipe) | ~16 despoil tables, 3 cradle effect tags, 1 recipe | Medium — cross-mod despoil tables; mod-update of any host mob namespace can stale individual entries |
| Biomancy (cradle fluid tributes) | 1 startup script | Medium — KubeJS startup script registers fluids; if Biomancy refactors the FluidTribute API, breaks |
| Biomancy (withering ooze brewing) | 1 CraftTweaker script | Low — 2 Healing→Harming brewing-stand recipes via CraftTweaker's `brewing.addRecipe`; no-ops if `biomancy:withering_ooze` or the potion IDs change |
| tconstruct (BetterCombat integration) | 19 weapon_attributes files | Low — one-line mod-id mappings; only at risk if BetterCombat or TConstruct rename a weapon kind |
| villagersplus (trades) | 4 trade override files | Medium — trade economy customization; structure tied to villagersplus profession registry |
| Powah (full recipe disable + selective EMI visibility + Create-style replacement recipes) | 1 server script (mod-namespace wipe) + 2 c-tag files (~120 items + ~91 blocks hidden) + 32 replacement recipes (3×3 + mechanical_crafting) + 2 baseline C&A 3×3 alternatives | Medium — recipes pinned to specific Create + C&A item IDs; need maintenance if those mods rename core components |
| createaddition (charged_snowball) | 1 charging recipe | Low — additive recipe, fails open if charging recipe schema changes |
| Dynamic Trees (loot economy) | ~40 branch + leaves loot files across dynamictrees, dtquark, dttconstruct | Low-Medium — DT-paramset loot tables; sensitive to DT-side condition/function renames, but stable on the 1.20.1 branch |
| moreburners | Pre-existing recipes + loot tables | Low — datapack overrides for moreburners' own files |
| dttconstruct (slime leaves + fruit) | 3 leaves + 4 fruit stubs | Low |
| create_hypertube | Pre-existing advancement | Low |
| Quark (matrix_enchanting + seed_pouch) | 1 recipe + 1 tag | Low |
| Botania (lexicon recipe) | 1 recipe override | Low — swaps the Lexica Botania craft off `#minecraft:saplings` (Dynamic Trees conflict) onto `#minecraft:flowers`; silently no-ops if Botania restructures the recipe |
| createaddition + createdieselgenerators | Pre-existing seed_oil cleanup | Low — additive content drift only; remove no-ops harmlessly |
| Various (cmyk_dye_mixing) | Pre-existing crafting recipes | Low |
| FarmersDelight + Supplementaries (rope) | Pre-existing tag + recipe streamlining | High — re-classified 2026-05-08; if FD renames `farmersdelight:rope` recipe ID OR rope item OR adds new rope variants, players lose a craft path entirely |
| Forge (`fml.toml`) | 1 (`maxThreads = 1`) | Low — vanilla Forge config knob, survives Forge updates |
| Supplementaries (quiver) | 1 config edit + 1 KubeJS server script | Medium — quiver loot drop relocated from native skeleton-spawn-equip to KubeJS-driven entity-loot pool injection |
| RoadWeaver (graves) | 5 datapack overrides (`weight: 0`) | Low — additive overrides; if RoadWeaver renames the structure paths or restructures the schema, overrides silently no-op and graves come back |
| ~~vs_clockwork (disc_wanderlust)~~ | RETIRED 2026-06-11 — VS suite removed; patch asset preserved in `optional_modules/valkyrien_skies/`, re-apply with the module | — |
| connector / frightsdelight / FarmersDelight (`mineable/knife`) | 1 (`forge:mineable/knife` rebuilt as the 66-entry cross-mod union, cycle broken) | Medium — hand-built union; must be regenerated if any of the 8 contributing mods adds new knife-mineable blocks |

---

## FarmersDelight (1.20.1-1.2.11a)

### `kubejs/data/farmersdelight/advancements/main/place_feast.json` *(Claude-session, last rewrite 2026-05-08)*

**What**: Overrides the broken `farmersdelight:main/place_feast` advancement. Both FD and FarmersDelightPlus ship a file at `data/farmersdelight/advancements/main/place_feast.json` (the FDP file shadows FD's because FDP loads later). FDP's version is the actual culprit — it uses the obsolete flat-block form `"conditions": { "block": "farmersdelightplus:heart_of_the_minotaur_block" }` with no `location` wrap, which fails `placed_block`'s `ContextAwarePredicate` parse and emits `Failed to parse 'location' field`. The cascade kills `master_chef`, `master_chef_deluxe` (FDP), and `only_one_in_the_world` (FDP), all of which parent off `place_feast`.

**Patch shape**: 5 criteria, each using the canonical 1.20.1 `placed_block` schema (matches vanilla `data/minecraft/advancements/husbandry/plant_seed.json` and FD's own working `place_skillet.json` / `place_cooking_pot.json`):
```json
{
  "trigger": "minecraft:placed_block",
  "conditions": {
    "location": [
      { "block": "farmersdelight:<feast_block>", "condition": "minecraft:block_state_property" }
    ]
  }
}
```

**Why upstream is broken**: FDP appears to have copy-pasted from a pre-1.18 placed_block snippet without updating to the `location`-as-ContextAwarePredicate shape that 1.20.1 requires. FD's own `place_feast.json` is canonical; FDP just clobbers it.

**Verification**: after a `moot>worldgen>closeout` cycle, grep `latest.log` for `place_feast` — should be clean. Sister cascade advancements (`master_chef`, `farmersdelightplus:main/master_chef_deluxe`, `farmersdelightplus:main/only_one_in_the_world`) should also load.

**On FD or FDP update — check**:
- If FDP rewrites their `place_feast.json` to use the canonical schema, this patch is redundant and can be deleted.
- If FD or FDP adds new feast blocks, this override won't include them — needs editing.
- If the `parent` changes (currently `farmersdelight:main/eat_nourishing_food`), update the patch.

**History**: An earlier 2026-05-08 rewrite used `BlockPredicate` form (`"block": {"blocks": ["X"]}`). That form is for `LocationPredicate` fields, not `placed_block.location` (which is a `ContextAwarePredicate` array of loot conditions). It was reverted to the canonical form same day after the audit grounded the schema against vanilla `plant_seed.json`. Backups for both intermediate states live in `Novus/backups/20260508_*_place_feast*/`.

---

## FarmersDelightPlus (1.20.1-1.3.1)

### `kubejs/data/forge/tags/blocks/stoves.json` + `items/stoves.json` *(Claude-session)*

**What**: Replaces FDP's `forge:stoves` tag content. The original ships a hard-required entry for `nethersdelight:blackstone_stove`, which doesn't exist (Nether's Delight isn't installed). The replacement keeps `farmersdelight:stove` and marks `nethersdelight:blackstone_stove` as optional so it'll auto-activate if Nether's Delight is ever added.

**Patch shape**:
```json
{ "replace": true, "values": [
  "farmersdelight:stove",
  { "id": "nethersdelight:blackstone_stove", "required": false }
] }
```

**On FDP update — check**:
- If FDP marks the entry optional, this patch can be deleted.
- If FDP adds new stoves (e.g. a fancy_stove block), they need to be added here, since `replace: true` wipes other contributions.

---

## miners_delight (1.20.1-1.2.3)

### `kubejs/data/miners_delight/loot_modifiers/scavenging_tentacles.json` *(Claude-session)*
### `kubejs/data/miners_delight/loot_modifiers/scavenging_silverfish.json` *(Claude-session)*

**What**: Replaces both files with identical content except for one rename: `"condition": "alternative"` → `"condition": "minecraft:any_of"`. The original uses the legacy 1.18-era loot condition name, which no longer exists in 1.20.1. Without the patch, both loot modifiers silently fail to load (no glow_squid/squid tentacle drops, no silverfish arthropod drops).

**Why upstream is broken**: miners_delight 1.2.3 ships with the legacy condition name — the mod hasn't updated this JSON for the rename.

**On miners_delight update — check**:
- If the mod fixes both files, delete our overrides.
- If the mod adds new loot modifiers, scan their `conditions` arrays for `"alternative"` and patch any new ones.

---

## compatdelight (1.0.1.1)

### `kubejs/data/compatdelight/tags/items/chocolate.json` *(Claude-session)*

**What**: Adds `create:bar_of_chocolate` to compatdelight's own chocolate tag (additive merge, `replace: false`). Lets compatdelight's chocolate-driven logic recognize Create's bar.

**On compatdelight update — check**: harmless on most updates. If compatdelight changes the tag name or adds replace-semantics, revisit.

### `kubejs/data/farmersdelight/advancements/recipes/food/cake_from_milk_bottle.json` *(Claude-session, 2026-05-08)*

**What**: Neutralizes a malformed FDP deletion stub. FDP ships an empty `{}` file at `data/farmersdelight/advancements/recipes/food/cake_from_milk_bottle.json` intended to delete FD's recipe-unlock advancement (FDP also stubs the matching recipe file, and intends both gone). Empty `{}` parses cleanly as a recipe stub but fails the advancement parser — `Missing criteria, expected to find a JsonObject`. The override replaces it with the canonical "impossible advancement" shape (`minecraft:impossible` trigger, single-criterion requirements, telemetry off — same shape vanilla uses for `recipes/root.json` and similar inert-by-design entries):

```json
{
  "criteria": { "impossible": { "trigger": "minecraft:impossible" } },
  "requirements": [["impossible"]],
  "sends_telemetry_event": false
}
```

This honors FDP's stated intent (advancement should never fire, recipe is gone) without emitting a parse error every load. Backup of FD's original (`fd_original.json`, 674 bytes) and FDP's broken stub (`fdp_stub.json`, 2 bytes) at `Novus/backups/20260508_230018_fd_cake_advancement_neutralize/`.

**Why upstream is broken**: FDP appears to use `{}` as a "delete this file" idiom across several other paths too (`data/create/recipes/{campfire_cooking,smoking,smelting}/bread.json`, `data/create/recipes/crafting/curiosities/cake.json`, `data/farmersdelight/recipes/cake_from_milk_bottle.json`). MC's recipe parser tolerates empty `{}` silently (skipping the recipe), but the advancement parser does not — which is why only this one file emits an error. If any of FDP's other empty-stub paths flips from recipe-shape to advancement-shape in a future MC/Forge version, expect more parse errors of the same class.

**On FD or FDP update — check**:
- If FDP rewrites this file with the canonical impossible-advancement shape, this patch is redundant and can be deleted.
- If FDP changes course and wants `cake_from_milk_bottle` to actually work, reading FD's original via `unzip -p` and writing that as the override is the right move.

### `kubejs/data/tcintegrations/tinkering/fluid_effects/molten_manasteel.json` *(Claude-session, 2026-05-08)*

**What**: Overrides tcintegrations' fluid_effect file for molten manasteel. The shipping jar references `ars_nouveau:recovery` as the on-hit / cloud effect, gated by `forge:mod_loaded modid: botania`. Ars Nouveau is **not installed** in this pack but Botania **is**, so the gating condition succeeds and tcintegrations tries to resolve `ars_nouveau:recovery` against the mob_effect registry — fails with `Unable to parse effect as registry minecraft:mob_effect does not contain ID ars_nouveau:recovery` on every load.

The override keeps the same structure (entity damage + mob effect + cloud) but substitutes `botania:soul_cross` for both effect references — a Botania-namespaced healing-on-kill effect that's thematically aligned with manasteel's "magical metal that helps you recover" intent and guaranteed-present (Botania is the gating mod). Level and duration preserved from the original (level 2, 120 ticks).

**Why upstream is broken**: tcintegrations seems to have copy-pasted a manasteel-flavored effect block from a development environment that had AN installed, gated on Botania (because manasteel is Botania's metal). The mod author likely confused which mod provides which effect — recovery is from AN, not Botania. The shipping configuration triggers when *only* Botania is present.

**On tcintegrations update — check**:
- If tcintegrations fixes the file to use a Botania-native effect (or correctly gates on AN presence), this patch is redundant.
- If tcintegrations changes the file's structure (e.g. `block_effects`/`entity_effects`/`fluid` → different keys), regenerate from the new shape.
- If Ars Nouveau is ever added to the pack, consider reverting to AN's effect for thematic accuracy — `ars_nouveau:recovery` would then resolve.

Backup of the broken in-jar original at `Novus/backups/20260508_230332_tcintegrations_molten_manasteel/original_in_jar.json`.

### `kubejs/data/c/tags/fluids/hidden_from_recipe_viewers.json` *(Claude-session, 2026-05-08)*

**What**: Hides 12 dormant TCI fluids (each in source + flowing variant, 24 entries total) from EMI's fluid browser. TCI registers all 15 of its molten metals Java-side under its own `tcintegrations:` namespace regardless of host-mod presence — so when the host mod isn't installed, the fluid still appears in EMI as an inert curiosity with no recipes attached. The c-tag entry tells EMI to exclude it from the viewer.

**Hidden fluids (host mod → fluid)**:
- Ad Astra → `molten_calorite`, `molten_desh`, `molten_ostrum`
- Undergarden → `molten_cloggrum`, `molten_froststeel`, `molten_forgotten_metal`
- Ice and Fire → `molten_dragonsteel_{fire,ice,lightning}`
- Aquaculture → `molten_neptunium`
- Malum → `molten_soul_stained_steel`
- Ars Nouveau → `molten_source_gem`

**Not hidden** (these stay visible because their host mod *is* installed):
- Create → `molten_brass`, `molten_copper`
- Botania → `molten_manasteel`

**Defensive shape**: every entry uses `"required": false` so removing TCI or any of these fluids from registration silently drops the entry rather than erroring. The tag uses `"replace": false` so it composes additively with EMI's built-in exclusions list (which references `c:hidden_from_recipe_viewers` as the canonical hide tag).

**On host mod or TCI update — check**:
- If you add a host mod (e.g. Aquaculture), remove that mod's fluids from this tag so they re-appear in EMI with their now-active recipes.
- If TCI adds new dormant fluids in a future version, audit and add them to the tag.
- If TCI changes its fluid namespace (e.g. moves to `tcintegrations:fluid/molten_X`), regenerate from the new IDs.

**Companion files**: this is the third c-tag in the pack — `kubejs/data/c/tags/items/hidden_from_recipe_viewers.json` and `kubejs/data/c/tags/blocks/hidden_from_recipe_viewers.json` (both Powah tier-lockdown — see Powah section above) hide ~130 items+blocks; this fluid tag hides 24 fluid entries on top.

---

## immersive_gateways (forge-0.0.5+1.20.1)

> Mod updated 0.0.4 → 0.0.5. Re-verified 2026-05-23: the `portals` structure_set is still at the same path with the same 25-entry schema, so the override below applies cleanly under 0.0.5.

### `kubejs/data/immersive_gateways/worldgen/structure_set/portals.json` *(Claude-session, 2026-05-08)*

**What**: Overrides the mod's `portals` structure_set to drop the `immersive_gateways:plains/0` variant — the only structure in the entire mod that uses `minecraft:ominous_banner` (confirmed by NBT scan). It's the pillager-outpost-coded variant of the plains gateway: dark_oak + cobblestone + ominous banner palette, reading "Village & Pillage 1.14 outpost" rather than "ancient ruined gateway." That breaks the mod's stated "ancient gateways connecting the world" thesis.

**Patch shape**: a complete replacement of the structure_set's `structures` array with all 24 of the original entries minus `plains/0`, plus a `placement` retune to thin spawn rate. Entry weights are unchanged (all `weight: 1`), so the surviving 24 variants share the spawn budget evenly.

**Placement tuning (2026-05-08)**: changed from default `spacing: 32, separation: 8` to **`spacing: 40, separation: 10`** (`salt: 74858347` preserved). New density: ~2.44 portals per km² (down from default ~4 per km²), with a 160-block guaranteed minimum between any two portals. Iteration history: 60/20 was tried briefly to land at literal 1-per-km² density but the user opted for the denser 40/10 — naturalistic placement (separation/spacing ratio 0.25 matches mod-author convention and vanilla woodland mansion / village ratios) and a "common but not wallpaper" feel that fits the pack's exploration pacing better than the rarer 60/20 alternative.

**Variants kept**: `plains/{1,2}`, `cherry_grove/{0,1,2}`, `badlands/{0,1,2}`, `desert/{0,1}`, `ice/{0,1}`, `jungle/{0,1,2}`, `mangrove_swamp/{0,1,2}`, `mountain/{0,1}`, `mushroom/{0,1,2}`, `swamp/0`. The Tier-2 candidates flagged in the audit (1.20-archeology variants `badlands/0`, `desert/0`, `jungle/0`, `plains/2`, plus the 1.19+/1.20-biome variants `cherry_grove/*`, `mangrove_swamp/*`) are intentionally retained; the user reviewed them and chose to keep all of them, cutting only the pillager-outpost variant.

**On immersive_gateways update — check**:
- If the mod adds new variants in a future version, this override silently leaves them out. Audit the new structure_set against this list and add any new entries you want to keep.
- If `plains/0` is renamed or its theme is changed, the override silently no-ops and the variant comes back. Re-grep the new jar's NBT for `ominous_banner` to confirm whether the pillager-outpost feel is still tied to that path.
- If the mod refactors the `placement` block (e.g. switches away from `random_spread`), the override needs to be regenerated from the new shape.

**Note on related config**: `config/immersive_gateways.json` carries a pre-existing distance customization (`onlyPlayersCanTeleport: true` plus a min/max distance). The `0.0.5` update appears to have reset the distance values (live config reads `minDistance: 2048, maxDistance: 8096` as of 2026-05-23 — neither the original nor any intended value). Not part of any patch; left alone per user direction 2026-05-23.

---

### `kubejs/data/immersive_gateways/tags/worldgen/structure/plains.json` *(Claude-session, 2026-05-23)*

**What**: Companion to the `portals` structure_set override above. Drops `immersive_gateways:plains/0` (the pillager-outpost-coded variant) from the `#immersive_gateways:plains` structure tag.

**Why**: The structure_set override only governs *natural worldgen* of new gateways. It does **not** govern the mod's gateway teleport-destination logic, which resolves the destination structure through the biome→structure tag (`#immersive_gateways:plains`). Discovered 2026-05-23: a player stepped through a gateway and arrived at a `plains/0` despite the structure_set override, because the tag still listed it. This override removes `plains/0` from the tag so the teleport path can't select it either.

**Patch shape**: `{"replace": true, "values": ["immersive_gateways:plains/1","immersive_gateways:plains/2"]}` — a full tag replacement (not a merge), so `plains/0` is excluded rather than re-added on top of the mod's tag.

**On immersive_gateways update — check**:
- `replace: true` means any new `plains/*` variants the mod adds are silently excluded. Re-audit the jar's `tags/worldgen/structure/plains.json` on update and add wanted entries.
- If the mod stops resolving teleport destinations via this tag, the override no-ops harmlessly.
- If `plains/0` still appears as a teleport destination after this, the bulletproof fallback is overriding `worldgen/structure/plains/0.json` to an empty jigsaw start pool (`minecraft:empty`).

---

### `server_scripts/chocolate_bar_alternates.js` Part 2 — Sweet Delight conversions *(REMOVED 2026-05-08)*

Originally removed and re-registered `compatdelight:sweetdelight/{chocolate_caramel,chocolate_filled_marshmallow}` to use the `forge:bars/chocolate` tag, gated by `compatdelight:compat_enabled key=sweet_delight`. **User confirmed Sweet Delight is permanently out of the pack on 2026-05-08, so the entire Part 2 block was deleted from the script.** Backup at `Novus/backups/20260508_223406_drop_sweetdelight_compat/`.

The remaining `chocolate_bar_alternates.js` (Part 1) only adds bar-based alternates to FD and FDP cocoa-bean recipes — see Part 1 entry below.

### `server_scripts/compatdelight_knife_removals.js` — Caves Delight knife removals *(RESTORED 2026-05-09)*

Removes `compatdelight:cavesdelight/{moss_knife,sculk_vein_knife}` recipes. Pairs with `compatdelight:moss_knife` + `compatdelight:sculk_vein_knife` entries in `kubejs/data/c/tags/items/hidden_from_recipe_viewers.json` to also hide them from EMI.

**History:** removed 2026-05-08 on the assumption that the source recipes were "gated" by Caves Delight mod presence and didn't register without it. That was wrong. The recipes are gated on `compatdelight:compat_enabled key=caves_delight`, which checks compatdelight's OWN `[features]` config flag (default `true`), NOT whether the Caves Delight mod is loaded. Both recipes use vanilla ingredients (`moss_block`/`sculk_vein` + `stick`), so they register and the knives are craftable in-game. User confirmed in-game appearance 2026-05-09; script restored.

**Don't delete this script again** without verifying the recipes actually fail to register (e.g. by setting `caves_delight = false` in `config/compatdelight-common.toml` and confirming the items disappear).

The Deeper-Darker variant `compatdelight:sculk_knife` is intentionally not handled — its recipe needs `deeperdarker:soul_crystal`, which doesn't exist without the Deeper Darker mod (not in pack), so the recipe genuinely doesn't register.

---

## connector / frightsdelight / FarmersDelight — `mineable/knife` tag cycle

### `kubejs/data/forge/tags/blocks/mineable/knife.json` *(Claude-session, 2026-05-23)*

**What**: Redefines `forge:mineable/knife` as a concrete, `replace: true` tag holding the full cross-mod **union** of knife-mineable blocks — 66 entries (60 blocks + 6 tag references) gathered from all 8 contributing mods.

**Why**: The pack is a Connector hybrid (Forge mods use the `forge:` tag namespace, Fabric-via-Connector mods use `c:`). Three of the mods set up a circular tag reference for the knife-mineable block tag:
- FarmersDelight's real list lives in `farmersdelight:mineable/knife`, which ends with `#forge:mineable/knife`.
- frightsdelight's `forge:mineable/knife` is just `["#c:mineable/knife"]`.
- Connector injects `#forge:mineable/knife` into `c:mineable/knife` to bridge the namespaces.

That makes `c:` → `#forge:` → `#c:` a cycle. Minecraft's TagLoader can't resolve a cyclic tag, so it drops **all three** tags — including `farmersdelight:mineable/knife`, which collapses to empty and strips the FD knife of its entire fast-mining set. Symptom in log: three `Couldn't load tag … missing following references` errors.

**Patch shape**: `replace: true` with the concrete union of every knife-mineable block declared across the 8 contributors — FarmersDelight, Farmer's Respite, Frights Delight, Brewin' & Chewin', Create: Central Kitchen, Supplementaries, Supplementaries Squared (all merge into `farmersdelight:mineable/knife`) plus Frights Delight's `c:mineable/knife` set. It contains **no** `#forge:`/`#c:`/`#farmersdelight:` knife references, so the cycle is broken; the only tag refs are safe non-knife ones (`#minecraft:wool`, `#wool_carpets`, `#candle_cakes`, `#farmersdelight:straw_blocks`, `#supplementaries:flags`, `#supplementaries:sacks`). Because `forge:mineable/knife` is now the concrete union, every knife tag resolves to it: `farmersdelight:mineable/knife` and `c:mineable/knife` both pull it via their `#forge:` reference, so **every knife fast-mines every cuttable block in the pack**, full cross-mod coverage restored.

**Resilience**: vanilla entries are plain strings; every modded block and modded tag ref is `{"id": …, "required": false}`, so removing any one contributing mod degrades gracefully instead of re-breaking the whole tag.

**On update — check**:
- This is a hand-built union. If any contributing mod **adds** new knife-mineable blocks in an update, they won't appear until this file is regenerated — re-scan all jars for `tags/blocks/mineable/knife.json` and merge.
- If a future mod ships a *concrete* (non-cyclic) `forge:mineable/knife`, `replace: true` will also wipe that mod's contribution — fold it into this file instead.
- If Connector changes how it bridges `c:`/`forge:` tags, re-check whether the cycle still exists before keeping this.

---

## diagonalfences + diagonalwalls (8.x) — non-diagonal blacklist

### `kubejs/data/diagonalfences/tags/blocks/non_diagonal_fences.json` + `diagonalwalls/.../non_diagonal_walls.json` *(Claude-session, 2026-05-23)*

**What**: Adds blocks to the Diagonal Fences/Walls opt-out tags. On every resource reload, Diagonal Blocks logs `WARN ... is using incompatible model 'MultiVariant' and should be added to the '...non_diagonal_...' block tag` for blocks whose model it can't derive a 45° connector from. The two tag files blacklist exactly the 16 called-out blocks so the warnings — and the malformed-diagonal-render they predict — stop.

`non_diagonal_fences.json` (15, `replace: false`): `create_connected:wrapped_copycat_fence` + the 14 Macaw's Fences `*_grass_topped_wall` blocks (andesite, blackstone, deepslate, deepslate_brick, diorite, end_brick, granite, mud_brick, nether_brick, prismarine, quartz, red_sandstone, sandstone, stone). Note Macaw's grass-topped *walls* go in the **fences** tag — Macaw's Fences registers them as fence-class blocks; Diagonal Blocks sorts by class, and the WARN names that tag explicitly.

`non_diagonal_walls.json` (1, `replace: false`): `create_connected:wrapped_copycat_wall`.

All entries use `{ "id": ..., "required": false }` so they drop silently if mcwfences / create_connected is removed. Trade-off: these 16 blocks lose 45° placement — fine, as none are diagonally-built and the copycats (dynamic-appearance blocks) genuinely can't be diagonal-ified at all.

**On update — check**:
- If a mcwfences / create_connected / diagonal-mod update changes which blocks emit the WARN, re-scan `logs/latest.log` for the `Diagonal Blocks` warnings and resync these two files.
- Purely cosmetic noise-suppression — if the diagonal mods ever handle `MultiVariant` models, this patch becomes redundant and can be deleted.

---

## supplementaries + Create + create_central_kitchen (chocolate bar tags)

### `kubejs/data/supplementaries/tags/items/chocolate_bars.json` *(Claude-session)*
### `kubejs/data/forge/tags/items/bars/chocolate.json` *(Claude-session)*

**What**: Both files add `compatdelight:milk_chocolate_bar` (`required: false`) to existing tags via additive merge. Net result: every "is this a chocolate bar?" tag in the pack agrees on the same set: `create:bar_of_chocolate` + `compatdelight:milk_chocolate_bar`.

**Design note**: `compatdelight:dark_chocolate_bar` and `tgears:bar_of_blazing_chocolate` are intentionally excluded — see `memory/project_novus_chocolate_tiering.md`.

**On any of those mods updating — check**: harmless. Additive merges, both downstream tags accept extras.

### `server_scripts/chocolate_bar_alternates.js` (Part 1) *(Claude-session)*

**What**: Adds three opt-in recipes (originals stay):
- `novus:chocolate_pie_from_bar` — 1 pie_crust + 2 `forge:bars/chocolate` → 1 chocolate_pie
- `novus:chocolate_glazed_chicken_from_bar` — chicken + potato + onion + 1 bar + sugar → 1 chocolate_glazed_chicken (cooking pot)
- `novus:chocolate_pancake_from_bar` — empty_pancake + 1 bar + milk_bottle + sugar → 1 chocolate_pancake

**On FD/FDP update — check**:
- Recipe IDs (`farmersdelight:chocolate_pie`, `farmersdelightplus:chocolate_glazed_chicken`, `farmersdelightplus:chocolate_pancake`) must still exist as result items.
- If FD/FDP adds a tag-based bar recipe natively, ours becomes redundant and can be removed.

---

## Supplementaries (1.20-3.1.43-forge) — quiver drop relocation *(2026-04-25)*

### Why
Supplementaries' default behavior is to roll a 2.5% chance per skeleton spawn to equip a quiver as visible armor. Two problems with that for Novus:

1. **Visual conflict with FA+Quivers resource pack.** FA+Quivers ships custom OptiFine CEM `.jem` models for skeleton/stray that draw the quiver geometry directly on the entity. Supplementaries' native render layer (`render_mode = "THIGH"`) draws a *second* quiver on top, causing clipping / double-quiver artifacts on equipped skeletons. Disabling the native render is awkward because the spawn-equip path still rolls the chance.
2. **Drop economy not under pack control.** Local-difficulty modulation made quivers effectively never drop on easy/normal, which doesn't fit Novus's progression.

### What
**Config edit** — `config/supplementaries-common.toml` `[tools.quiver] quiver_skeleton_spawn_chance = 0.0` (was `0.025`). Short-circuits the spawn-equip code path entirely. `quiver_skeleton_spawn_affected_by_local_difficulty` becomes irrelevant at chance 0.

**Implementation: KubeJS server script** at `kubejs/server_scripts/quiver_drop.js`. Uses `ServerEvents.entityLootTables` → `event.modifyEntity` → `table.addPool` to add a quiver-drop pool directly to `minecraft:skeleton` and `minecraft:stray` entity loot tables.

**Tuned drop economy** (2026-04-25, post-verification):

| Mob | Chance | Conditions | Arrow population |
|---|---|---|---|
| `minecraft:skeleton` | 7% | `random_chance` + `killed_by_player` | `supplementaries:random_arrows` min=3 max=10 (light) |
| `minecraft:stray` | 15% | `random_chance` + `killed_by_player` | `supplementaries:random_arrows` min=4 max=18 (mansion-tier) |

Rationale: stray is a rarer-biome / tougher mob and gets the bigger reward; skeleton is the bread-and-butter combat encounter and gets a lighter, more frequent drop. The `killed_by_player` condition prevents creeper-killed-skeletons and auto-mob-farms from yielding quivers — combat-only economy.

**Reference rates for context:** Supplementaries' default native spawn-equip on Hard difficulty produces ~1 quiver per 800 skeleton kills in realistic play (chunks aged ~1–2 hours), or ~1 per 400 at peak local-difficulty conditions. Our 7% / 15% is ~30–80× that rate, justified by (a) a planned empty-quiver crafting recipe as the primary acquisition path, and (b) the kill drop functioning as a "shortcut to a pre-filled quiver" rather than the only way to obtain one.

**Why not a Forge GLM (incident report, 2026-04-25 16:05):**

The first attempt was a Forge Global Loot Modifier (`moonlight:add_loot_table`) targeting `minecraft:entities/skeleton` and injecting a separate loot table. The very first skeleton tick after deployment crashed the server with `StackOverflowError`. Stack trace was the same 4-line frame repeating:

```
LootTable.getRandomItems → ForgeHooks.modifyLoot →
  ModLootModifiers$AddTableModifier.doApply → LootTable.getRandomItems → ...
```

**Root cause:** the `forge:loot_table_id` condition matches `LootContext.getQueriedLootTableId()`, which returns the *originally requested* loot table — and that ID does NOT change when the modifier injects a sub-table. So when the inject table started rolling under the same LootContext, our condition matched again, the modifier injected again, ad infinitum.

This is a known footgun specifically with `add_table`-style modifiers. `moonlight:add_item` doesn't have it because adding an ItemStack doesn't trigger another loot-table roll. There is **no clean way** to add a recursion guard via condition predicates alone — `getQueriedLootTableId()` is sticky for the entire LootContext lifetime. The fix requires moving outside the GLM mechanism entirely: either (a) modify the entity loot table at load time (KubeJS event, what we use now), (b) wholesale-override the loot table file, or (c) use Mantle's `AddEntryLootModifier` (adds entries instead of tables, also no recursion).

**Important serializer note** (kept for context): Forge 1.20.1 ships the GLM framework but registers no built-in serializer types. `forge:add_table` is NOT a valid type — using it produces `"Unknown registry key in forge:global_loot_modifier_serializers"` warnings and the modifier silently does nothing. Available serializers come from mods. Moonlight provides `moonlight:add_item`, `moonlight:add_loot_table` (registered name; class is `ADD_TABLE` internally), and `moonlight:replace_item`. The `add_loot_table` codec uses field name `loot_table` (not `table`). Mantle, Botania, Petrolpark, etc. also register their own. Knowing this is useful for *future* loot-modifier work, but for the quiver case we deliberately avoid GLMs.

**Orphan files cleaned up 2026-05-08**: the failed-first-attempt artifacts (`forge/loot_modifiers/global_loot_modifiers.json`, `novus/loot_modifiers/{skeleton,stray}_quiver_drop.json`, `novus/loot_tables/inject/quiver_drop.json`) were deleted. They were inert because the master `entries: []` list registered nothing, but lingered as research scaffolding. Backup at `Novus/backups/20260508_224259_drop_quiver_glm_orphans/` if the GLM approach ever needs to be revisited.

### Drop targets
**Skeleton + Stray only.** FA+Quivers also ships textures/JEM for `bogged` (1.21+ entity, doesn't exist in 1.20.1) and `parched` (no mod in this pack registers a `parched` entity — searched all 156 mod jars). Both would be no-ops; included neither.

### Current chance: tuned (7% skeleton / 15% stray)
Final tuned values in the live `quiver_drop.js`. Earlier 1.0-testing iteration referenced in the table above is historical.

### On Supplementaries update — check
- If the mod renames `tools.quiver.quiver_skeleton_spawn_chance` or removes the `[tools.quiver]` section, the config edit silently no-ops and skeletons start spawn-equipping again. Diff `supplementaries-common.toml` after every Supplementaries jar update.
- If the mod renames `supplementaries:random_arrows` loot function, our quiver entry will fail to apply the function (quivers drop empty). Inspect the new jar's `data/.../loot_tables/inject/dungeon_quiver.json` to spot any rename.
- The `supplementaries:flag` recipe condition for the `quiver` flag still works regardless — no impact on this patch.

### On Minecraft entity registry change — check
- If the modset adds a new skeleton variant (e.g. via a mob mod that adds a `parched` or `bogged_1.20` entity), `quiver_drop.js` does NOT cover it automatically. Edit the script to add the new entity ID.
- Entity loot table paths: `minecraft:entities/skeleton`, `minecraft:entities/stray`. The KubeJS event keys on entity ID directly, so retargeting requires a script edit, not a JSON edit.

### Reversion
Revert `quiver_drop.js` (delete or empty the script body), and reset `quiver_skeleton_spawn_chance = 0.025` in supplementaries-common.toml. Native Supplementaries quiver-equip behavior returns; FA+Quivers double-render artifact returns with it.

---

## Forge (`config/fml.toml`)

### `maxThreads = 1` *(2026-04-25)*

**What**: Forces Forge's mod-loading `ForkJoinPool` to a single thread, serializing all `ParallelTransition` and `DeferredWorkQueue` work during the boot stages (`REGISTER → COMMON_SETUP → SIDED_SETUP → ENQUEUE_IMC → PROCESS_IMC → COMPLETE`).

**Why**: Create Enchantment Industry 1.3.3 (the latest 1.20.1-Forge build, released June 2025 for Create 6.0.6) carries a mixin `dragonLibLegacy.CreateAdvancementConstructor` that hijacks `CreateAdvancement.<init>`. On Create 6.0.8, when CEI's setup lambda (`EnchantmentIndustry.lambda$setup$1`) runs in parallel with Create's, `CeiAdvancements.<clinit>` can fire before Create's chocolate fluid bucket is registered. The mixed-in constructor then triggers `AllAdvancements.<clinit>` → registry lookup → `NullPointerException: Registry entry not present: create:chocolate_bucket`. Class-init order under the parallel work queue is non-deterministic, so the crash is intermittent (boot at 12:54 succeeded, 13:28 failed). CEI 1.20.1-Forge has no upgrade path; the line is effectively abandoned upstream.

Serializing the FML pool eliminates the race entirely (and any sibling races we don't yet know about), at the cost of ~5–10s additional cold-boot time. Runtime FPS / TPS / chunk-loading / `/reload` are unaffected — the FML pool is a one-shot, boot-only executor distinct from the render thread, server thread, chunk workers, and ModernFix's `max.bg.threads` pool.

**On Forge update — check**: this is a stock Forge config knob, not an override file, so it survives Forge updates. If Forge ever renames `maxThreads` or relocates it out of `fml.toml`, the comment above will become stale; verify via `cat config/fml.toml` after the update.

**Reversion**: change `maxThreads` back to `-1` in `config/fml.toml`. Reverts to processor-count parallelism. The CEI race returns.

---

## RoadWeaver (forge-2.2.2-1.20.1) — disable player-head graves *(2026-05-06)*

### Why
RoadWeaver scatters five player-head "memorial grave" structures (Notch, Technoblade, Fogg05, Magic_Muggle, plus a generic `easter_egg`) along its procedurally generated roads. Cute as Easter eggs, but in practice they appear as obtrusive scatter that doesn't fit Novus's aesthetic and risks IP-leakage from the use of real-person heads. The user wanted graves disabled while keeping RoadWeaver's other roadside structures (benches, campfires, campsites, maid_house, sakura coffee house).

### What
Five datapack overrides that copy the original structure JSON verbatim and only change `weight: 1` → `weight: 0`. RoadWeaver weights candidates from its `roadweaver:roadside` structure list — a zero weight removes them from the pool without uninstalling the structures or breaking dependent template/loot lookups (so existing-world graves that have already generated still resolve correctly).

- `kubejs/data/roadweaver/worldgen/structure/roadside_grave_easter_egg.json`
- `kubejs/data/roadweaver/worldgen/structure/roadside_grave_fogg05.json`
- `kubejs/data/roadweaver/worldgen/structure/roadside_grave_magic_muggle.json`
- `kubejs/data/roadweaver/worldgen/structure/roadside_grave_notch.json`
- `kubejs/data/roadweaver/worldgen/structure/roadside_grave_technoblade.json`

Originals snapshotted to `Novus/backups/roadweaver_graves_disable_2026-05-06/` for diff/recovery.

### What's NOT touched
- `roadside_bench`, `small_campfire`, `roadside_campsite_{1,2,3}`, `maid_house`, `sakura_coffee_house` — RoadWeaver's other roadside structures keep spawning normally.
- The grave NBT templates and chest loot tables (`data/roadweaver/loot_tables/chests/graves/*.json`) remain in the jar — graves placed before this patch will still load their chests correctly. Only future spawns are suppressed.
- `config/roadweaver/roadweaver.json` is not edited; `roadsideStructure.enabled` stays `true`.

### On RoadWeaver update — check
- If the mod renames `roadside_grave_*` paths or splits them into a structure_set / template_pool, our weight-0 overrides silently no-op and graves return. Re-grep the new jar's `data/roadweaver/worldgen/structure/` for `grave` after each update.
- If the mod adds new grave variants (e.g. `roadside_grave_jeb.json`), they are NOT covered automatically — add a sixth override.
- If RoadWeaver migrates to a structure-pool weighting scheme where `weight: 0` is invalid, the JSON parser will reject our overrides; rewrite to remove the entry from the pool list instead.

### Reversion
Delete the five files in `kubejs/data/roadweaver/worldgen/structure/`. Originals will resume from the jar.

---

## vs_clockwork (clockwork-0.5.6) — disc_wanderlust Amendments compat *(2026-05-19 — RETIRED 2026-06-11: VS suite removed from pack; asset preserved in `optional_modules/valkyrien_skies/kubejs/assets/`; re-apply when the optional module ships)*

### `kubejs/assets/vs_clockwork/textures/item/disc_wanderlust.png` *(Claude-session)*

**What**: Single-file texture override that strips Clockwork's 8-frame disc animation down to one static 16×16 frame (frame 7 of the original 16×128 sprite sheet). The original `.mcmeta` is intentionally NOT copied, so Minecraft treats the override as a non-animated texture.

**Why upstream errors**: Amendments' Moonlight `fromAnimatedImage` palette-mask helper requires the mask and the target disc texture to have matching frame counts. The shared mask at `amendments:block/music_discs/music_disc_mask` is 16×16 single-frame; Clockwork's disc was 16×128 / 8 frames. Result: `[Moonlight ERROR] Palette mask … needs to be at least as large as the target image … and have the same frame count.` Amendments silently skipped generating the jukebox tint overlay for this disc, so the wanderlust disc played fine but had no colorized in-jukebox glow.

**Trade-off accepted**: lose the subtle UFO-halo rotation animation; gain Amendments' colorized jukebox glow. Amendments globally uses ONE mask for every disc, so the only alternatives were (a) animate the global mask (would break every other single-frame disc) or (b) leave the warning. Chose the per-disc strip.

**Verification**: after a `moot>worldgen>closeout` cycle, grep `latest.log` for `Palette mask vs_clockwork:item/disc_wanderlust` — should be gone. Place a wanderlust disc in a jukebox and confirm Amendments' colorized overlay is present.

**On vs_clockwork update — check**:
- If Clockwork repaints `disc_wanderlust.png`, our override silently shadows the new artwork; rerun the frame-extraction step from the new jar.
- If Clockwork drops the animation upstream (16×16, no `.mcmeta`), this patch is redundant and can be deleted.
- If Clockwork renames the texture, the override no-ops and the new texture inherits the upstream behavior (warning returns).

**Sources kept** in `Novus/wanderlust_fix/`:
- `disc_wanderlust_original_16x128.png` — original sheet
- `disc_wanderlust_8_frames.png` — all 8 frames at 320px each, for picking a different frame later
- `frame7_preview.png` — final result at 24× scale
- `Novus_VSClockwork_DiscWanderlust_AmendmentsFix.zip` — alternate deployment vector (standalone resource pack), unused since shipped via KubeJS

### Reversion
Delete `kubejs/assets/vs_clockwork/textures/item/disc_wanderlust.png`. Clockwork's animated texture will resume from the jar; warning returns.

---

## Pre-existing patches (predate 2026-04-24)

These were authored before the patch-survey session. Listed here for completeness; same review-on-update discipline applies.

### moreburners
- `kubejs/data/moreburners/recipes/ember_burner.json` — recipe override
- `kubejs/data/moreburners/recipes/converter_cover.json` — recipe override
- `kubejs/data/moreburners/recipes/item_application/heat_converter.json` — recipe override
- `kubejs/data/moreburners/loot_tables/blocks/ember_burner.json` — loot table
- `kubejs/data/moreburners/loot_tables/blocks/heat_converter.json` — loot table

**On moreburners update — check**: these override the mod's own files. If the mod changes block names, recipe types, or loot table structure, edits are needed.

### dttconstruct (Dynamic Trees / TConstruct integration)

**Slime leaves** — real loot tables (slime leaf with shears/silk-touch, otherwise fortune-weighted seed drop, plus stick fallback):
- `kubejs/data/dttconstruct/loot_tables/blocks/earth_slime_leaves.json`
- `kubejs/data/dttconstruct/loot_tables/blocks/ender_slime_leaves.json`
- `kubejs/data/dttconstruct/loot_tables/blocks/sky_slime_leaves.json`

These three originally used `"condition": "minecraft:alternative"` (singular), which 1.20.1 dropped — fixed to `minecraft:any_of` on 2026-05-08 after `latest.log` flagged "Unknown type 'minecraft:alternative'" parse errors.

**Slime fruits** — empty-pool stubs (`{"type": "minecraft:block", "pools": []}`) added 2026-05-08 to silence chronic `IllegalArgumentException: Can't find block dttconstruct:<x>_slime_fruit` errors:
- `kubejs/data/dttconstruct/loot_tables/blocks/blood_slime_fruit.json`
- `kubejs/data/dttconstruct/loot_tables/blocks/ender_slime_fruit.json`
- `kubejs/data/dttconstruct/loot_tables/blocks/green_slime_fruit.json`
- `kubejs/data/dttconstruct/loot_tables/blocks/sky_slime_fruit.json`

**Why the fruit stubs are zero-impact**: the mod ships orphan loot tables for fruit blocks it never registers (no blockstates, no Java registration). Forge can't resolve the `block_state_property` condition's block reference and bombs each load. Actual in-game fruit drops use Dynamic Trees' native fruit system in `trees/dttconstruct/fruits/<species>.json` (drops `tconstruct:*_slime_ball` directly), wholly separate from vanilla block loot tables. The stubs make the loader find a valid empty table instead of a broken one — no gameplay change, only log cleanliness.

**On dttconstruct update — check**:
- If a future version registers the fruit blocks for real, **delete** the four fruit stubs so the mod's own loot tables take effect.
- If a future version uses different schema in the leaf loot tables (e.g. seed item changes), update the leaf overrides.

### create_hypertube
- `kubejs/data/create_hypertube/advancements/recipes/misc/redstone_detector_tube_attachment.json`

### Quark
- `server_scripts/matrix_enchanting.js` — adds craft recipe for `quark:matrix_enchanter`. Comment in the script notes that Quark's auto-convert is disabled in `quark-common.toml` so this is the player's path to the Matrix Enchanter.

**On Quark update — check**: if the Matrix Enchanter recipe ID or block ID changes, edit. If Quark re-enables auto-convert by default, this becomes redundant.

### createaddition + createdieselgenerators
- `server_scripts/seed_oil.js` — removes `createaddition:compacting/seed_oil` (duplicate of diesel generators' plant oil pipeline). Keeps diesel generators as the sole `forge:plantoil` source.

**On either mod update — check**: if the recipe ID changes in createaddition, the remove silently no-ops and the duplicate returns.

### FarmersDelight + Supplementaries (rope unification)
- `server_scripts/rope_tags.js` — adds `supplementaries:rope` to `farmersdelight:ropes` tag.
- `server_scripts/rope_recipes.js` — removes FD's rope recipe; routes all rope crafting through `supplementaries:rope`; provides 1:1 shapeless conversion both ways.

**Risk re-classified to High on 2026-05-08**: this patch is more sensitive than originally rated. If FD renames the `farmersdelight:rope` recipe ID, the `event.remove` silently no-ops and rope ends up double-craftable. If FD changes the rope item ID, the cross-craft conversion fails silently and players have no path from FD rope to Supplementaries rope. If FD adds new rope variants (e.g. waxed rope), the unification doesn't cover them. **On FD update — check**: tag membership, recipe ID for `farmersdelight:rope`, item ID for `farmersdelight:rope`, and inventory of rope-like items in FD.

### Various dye mods
- `server_scripts/cmyk_dye_mixing.js` — adds subtractive dye mixing recipes (yellow+cyan→lime, etc.)

**On any update**: dye recipes and item IDs are vanilla, low risk.

### Quark (seed_pouch_holdable)
- `kubejs/data/quark/tags/items/seed_pouch_holdable.json` — removes `agricraft:seed` (a template/non-real seed item that Quark's seed pouch incorrectly holds and that has no actionable use in-pouch).

**On Quark or AgriCraft update — check**: if AgriCraft removes the `seed` template item or Quark refactors `seed_pouch_holdable`, this override may become redundant.

### createaddition (charged_snowball)
- `kubejs/data/createaddition/recipes/charging/charged_snowball.json` — charging-recipe injection making `powah:charged_snowball` craftable via createaddition's Tesla Coil at 500kFE / 2k rate. Cross-mod power-economy bridge.

**On createaddition or Powah update — check**: that the charging recipe schema is unchanged and that `powah:charged_snowball` still exists. Additive recipe, fails open.

### Create — seed/organ → fluid compacting bridges *(Pre-existing, renamed to `novus:` namespace 2026-05-08, expanded + retuned 2026-05-09)*

`kubejs/data/novus/recipes/compacting/*.json` — 18 `create:compacting` recipes that bridge tree-species seeds (Dynamic Trees + dtquark + dttconstruct) plus one biomancy organ to thematically appropriate fluids in Create's Mechanical Press / Basin compacting:

**Slime species → matching `tconstruct:*_slime` fluids (250 mB each)**: `greenheart_seed → earth_slime`, `skyroot_seed → sky_slime`, `enderbark_seed → ender_slime`, `bloodshroom_seed → ichor`.

**Hot/nether species → magic fluids (100 mB)**: `crimson_seed → blazing_blood`, `warped_seed → liquid_soul`.

**Mega trees → 500 mB volume tier**: `mega_jungle_seed → plant_oil`, `mega_spruce_seed → plant_oil` (createdieselgenerators), `mega_crimson_seed → blazing_blood`, `mega_warped_seed → liquid_soul` (tconstruct).

**Quark blossoms → experience (100 mB)**: all 5 trumpet trees (`fiery / frosty / serene / sunny / warm`) compact to `create_enchantment_industry:experience`. Uniform XP yield across the family because they're decorative-foliage species without a thematic differentiator.

**Quark ancient → experience (500 mB) — reward tier**: `ancient_seed → 500 mB experience`. Ancient is Quark's rare special tree (perfect_biomes `#forge:is_magical`); 5× the blossom yield gives it a clear "reward for finding/farming" feel without inventing a new amount tier (matches the mega-tree 500 mB convention).

**Quark glow_shroom → supplementaries:lumisene (100 mB)**: thematic match — luminescent fungus species → luminescent fluid. Standard tier amount.

**Biomancy toxin_gland → tconstruct:venom (250 mB)**: thematic match — poison organ → poison fluid. The only non-seed input in the set; uses the slime tier amount because toxin_gland is uncommon (drops at weight 15 in the despoil pool, max 1 per drop). Re-routes the venom economy after ancient_seed moved to experience — venom now sources from organic harvest rather than tree growth, which fits Tinkers' Construct's "organ-derived poison" lore better.

**Amount tier convention**:
- 100 mB — standard tree species (default)
- 250 mB — slime species (special-fluid match, slightly larger yield because slime fluids are higher-value)
- 500 mB — mega trees + ancient (rare/special trees, "reward tier")

**History**:
- Originally lived at `kubejs/data/kubejs/recipes/compacting/*` which gave IDs `kubejs:compacting/<x>`. Moved to `data/novus/recipes/compacting/*` on 2026-05-08 to align with the `novus:` namespace convention. Backups at `Novus/backups/20260508_222041_seed_compacting_rename/`.
- 2026-05-09 retune: `ancient_seed_to_venom.json` (100 mB venom) replaced by `ancient_seed_to_experience.json` (500 mB experience) — venom mapping wasn't earning the "rare ancient tree" feel; XP at reward-tier amount fits the existing fluid economy and Ancient's rarity. Old recipe backup at `Novus/backups/20260509_010354_seed_compacting_retune/`.
- 2026-05-09 expansion: added `glow_shroom_seed_to_lumisene.json`. Glow_shroom was the missing 7th dtquark species — its tree exists, its seed is registered, but no compacting bridge had been written.
- 2026-05-09 expansion: added `toxin_gland_to_venom.json`. Re-establishes the venom path (vacated when ancient moved to XP) using a more thematically grounded source — biomancy's poison organ rather than ancient tree seeds. First non-seed input in the recipe set.

**On Create / Dynamic Trees / Biomancy update — check**: if a referenced input item ID is renamed (e.g. `dtquark:ancient_seed`, `biomancy:toxin_gland`, etc. → other ID), the recipe silently stops matching. If `create:compacting` schema changes (e.g. `ingredients` → `ingredient`, or fluid result wrapping), all 18 break together. If `create_enchantment_industry:experience` is renamed or unregistered (e.g. CEI gets dropped), the 6 XP-output recipes (5 blossoms + ancient) need their fluid swapped to `supplementaries:experience` or another XP fluid. If `biomancy:toxin_gland` is removed from despoil pools (mod refactor), the toxin_gland → venom recipe still works but loses its primary item source.

---

## Biomancy — despoil tables, cradle effect tags, primordial_core

### Despoil loot tables (cross-mod mob coverage) *(Pre-existing)*

`kubejs/data/{minecraft,quark,botania,goblintraders,supplementaries}/loot_tables/biomancy/despoil/*.json` — 16 files registering despoil-tool drop tables for mobs Biomancy doesn't natively cover:

- `minecraft/loot_tables/biomancy/despoil/{zombie,zombie_villager,zombie_horse,husk,drowned,shulker,spider,cave_spider,chicken,parrot}.json`
- `quark/loot_tables/biomancy/despoil/{crab,shiba,stoneling,toretoise}.json`
- `botania/loot_tables/biomancy/despoil/pink_wither.json`
- `goblintraders/loot_tables/biomancy/despoil/{goblin_trader,vein_goblin_trader}.json`
- `supplementaries/loot_tables/biomancy/despoil/red_merchant.json`

These extend Biomancy's flesh-extractor tool to reach mobs added by other mods plus vanilla mobs the mod skipped.

**On update — check**:
- If Biomancy refactors the `loot_tables/biomancy/despoil/` path or namespace structure, all 16 files need migration.
- If a host-mob mod (e.g. Quark) renames a mob ID, that specific despoil file becomes orphaned (silent no-op).

### Cradle effect-source tags *(Pre-existing)*

`kubejs/data/biomancy/tags/mob_effect/cradle/{life_energy_sources,success_sources,disease_sources}.json` — adds cross-mod mob effects (notably `brewinandchewin:sweet_heart`) into Biomancy's Primordial Cradle effect-tribute classification. See `Novus/POTION_PATHS.md` §9 and `Novus/CRADLE_TRIBUTES.md` for the full tribute architecture.

**On update — check**: if Biomancy refactors the cradle tribute tag namespaces, these merge tags need migration. If a referenced source mod renames an effect (e.g. `brewinandchewin:sweet_heart` → other ID), the entry becomes inert; consider `required: false` resilience.

### `primordial_core` recipe *(Pre-existing)*

`kubejs/data/biomancy/recipes/crafting/primordial_core.json` — Novus-specific shaped-craft override for Biomancy's primordial core (pack-tuned ingredient mix).

**On update — check**: if Biomancy changes the primordial_core item ID or its result NBT shape, edit. If a referenced ingredient (raw_meats, bones, ender pearl) changes tag membership, recipe quietly stops matching.

### `kubejs/server_scripts/biomancy_organic_drops.js` *(Claude-session, 2026-05-09)*

Adds biomancy organ drops to the **normal entity loot tables** of every mob covered by the despoil tables — vanilla zombies, husks, drowned, shulkers, spiders, chickens, parrots, etc., plus Quark's crab/shiba/stoneling/toretoise, Botania's pink_wither, GoblinTraders' two trader variants, and Supplementaries' red_merchant. 18 mobs, 52 item entries.

**Mechanic**: each affected mob gets a new pool added to its normal loot via `ServerEvents.entityLootTables` → `event.modifyEntity` → `table.addPool`. The pool fires once per kill (`rolls = 1`), uses the despoil table's item weights verbatim, and applies looting enchant 0-1 mirrored from the despoil tables. **Counts are halved** for "lucky drop" rather than "expected drop" feel: `new_min = 0`, `new_max = max(1, ceil(original_max / 2))` — so a 1-2 despoil entry becomes a 0-1 normal-kill entry, a 1-3 becomes 0-2, etc.

**Stacks with despoil**: original despoil tables are untouched. The despoil tool still gives the full original pool when used on a corpse. Normal kills now also produce organic drops. Both mechanics fire independently.

**Why `ServerEvents.entityLootTables` and NOT a Forge GLM**: per memory `feedback_glm_add_loot_table_recursion.md` and the 2026-04-25 quiver-drop incident (see Supplementaries quiver section), the GLM `add_loot_table` path infinite-recurses when targeting entity loot. KubeJS's entity-loot modify event doesn't trigger ForgeHooks.modifyLoot — no recursion path.

**Why no `killed_by_player` gate**: the despoil tables don't have one, so mirroring them keeps semantics consistent. Side effect: mob farms can yield organs now. If that becomes a problem, add `pool.addCondition({ condition: 'minecraft:killed_by_player' })` inside each pool block — header comment in the script flags this.

**On Biomancy update — check**:
- If Biomancy renames any of the 12 organ items referenced (`mob_marrow`, `withered_mob_marrow`, `mob_sinew`, `mob_fang`, `mob_claw`, `mob_gland`, `toxin_gland`, `volatile_gland`, `mineral_fragment`, `gem_fragments`, `exotic_dust`), the matching entries silently stop dropping. Update the script.
- If a new despoil table is added under `kubejs/data/<ns>/loot_tables/biomancy/despoil/`, the matching mob+items+weights must be added to `ORGANIC_DROPS` in the script by hand. The script's hardcoded inventory does NOT auto-sync with despoil tables.
- If a host-mob mod (Quark, Botania, GoblinTraders, Supplementaries) renames a mob ID, that specific entry becomes a silent no-op. Update the script.

---

## Biomancy — Cradle fluid tributes (startup script)

### `kubejs/startup_scripts/cradle_fluid_tributes.js` *(2026-04-29, v3.7 shipping)*

Registers ~39 BAC + Farmer's Respite drink fluids as Primordial Cradle fluid tributes via lazy-eval per-effect tributes through overlay tags. Apple cider routes through cross-mod `FLUID_TO_ITEM_OVERRIDE` to FD's item form. See user memory `project_novus_cradle_fluid_tributes.md` for the architecture.

**Why startup, not server**: FluidTribute registration must happen during the FluidTribute registry phase, which fires at FMLClientSetupEvent / FMLCommonSetupEvent — that's the startup_scripts lifecycle. Putting this in server_scripts would race the registry and silently fail.

**On Biomancy update — check**: if the FluidTribute API changes (especially the lazy-eval evaluator signature or the FLUID_TO_ITEM_OVERRIDE map), this script breaks. Test by checking that BAC drinks register as expected tributes in-game (cradle UI tooltip).

---

## Biomancy — Withering Ooze Healing→Harming brewing (CraftTweaker)

### `scripts/withering_ooze_brewing.zs` *(2026-05-30, CraftTweaker rewrite)*

Adds two brewing-stand recipes so Biomancy's Withering Ooze also converts Healing potions into Harming — mirroring vanilla Fermented Spider Eye, and matching how Withering Ooze already does Poison→Harming inside Biomancy's own jar:

- Potion of Healing + Withering Ooze → Potion of Harming
- Potion of Healing II + Withering Ooze → Potion of Harming II

```zenscript
brewing.addRecipe(
    <item:minecraft:potion>.withTag({Potion: "minecraft:harming"}),   // output
    <item:biomancy:withering_ooze>,                                   // reagent (top slot)
    <item:minecraft:potion>.withTag({Potion: "minecraft:healing"}));  // base potion (bottles)
```
(+ a `strong_harming`/`strong_healing` pair). **Argument order matters and is non-obvious**: the signature is `brewing.addRecipe(IItemStack output, IIngredient reagent, IIngredient basePotion)` — arg2 is Forge's "ingredient" (the **reagent**, top slot) and arg3 is Forge's "input" (the **base potion**, bottom bottle slots). The first attempt 2026-05-30 passed them as `(output, basePotion, reagent)`; it registered without error but wanted ooze in the bottles and a healing potion as the reagent, so it never fired (caught via `crafttweaker.log`, which prints `input: <...> and ingredient: <...>`). Background and the verified vanilla/Biomancy brewing facts are in user memory `reference_kubejs_brewing_recipes.md`.

**NBT matching**: the input is matched by tag. CraftTweaker wraps a `.withTag(...)` ingredient in its own `IngredientCraftTweaker` (a custom Forge `Ingredient` whose `test()` delegates to CraftTweaker's partial-NBT matching), so the recipe fires only when the bottle's NBT contains `{Potion:"minecraft:healing"}` — i.e. Healing only, not water (`minecraft:water`) and not `strong_healing`. `brewing.addRecipe` builds the exact same Forge `BrewingRecipe` and registers it against the same `BrewingRecipeRegistry` the brewing stand consults for Biomancy's own recipes.

**Why CraftTweaker, not KubeJS (history)**: KubeJS 2001 has no brewing event, so the only KubeJS route was registering against Forge's `BrewingRecipeRegistry` via `Java.loadClass` from a startup script. That proved unusable: KubeJS-Rhino can't resolve the `Ingredient.of` overload — its name-remapper exposes the inherited static `Ingredient.of(ItemLike...)` / `of(ItemStack...)` varargs under the name `of` on *every* Ingredient subclass, so any single-argument `.of(...)` call has multiple applicable candidates and Rhino refuses to pick. Three KubeJS iterations all failed the same way (`ambiguous; candidate methods`), including `StrictNBTIngredient.of(...)` (the inherited varargs are merged in) and even a reflection attempt. CraftTweaker's typed ZenScript API sidesteps the entire problem and reapplies on `/reload` instead of needing a full restart. The KubeJS script `kubejs/startup_scripts/withering_ooze_healing_brewing.js` was retired; backup + its final reflection-based state at `Novus/backups/20260530_125501_withering_ooze_kubejs_to_crafttweaker/`. The Rhino overload trap is written up in user memory `reference_kubejs_api_gotchas.md`.

**Verification**: CraftTweaker brewing recipes reapply on `/reload` (no full restart needed). **Confirmed working in-game 2026-05-30**: Healing + Withering Ooze in a brewing stand yields Harming. `crafttweaker.log` shows both recipes registering cleanly.

**On Biomancy / CraftTweaker update — check**:
- If `biomancy:withering_ooze` is renamed, `crafttweaker.log` will flag the unknown item and the recipe no-ops — update the ID.
- If the vanilla potion IDs (`minecraft:healing` / `strong_healing` / `harming` / `strong_harming`) change (they won't on frozen 1.20.1), update the tags.
- If CraftTweaker renames `brewing.addRecipe` or the global `brewing`, migrate the call.
- If Biomancy adds the Healing→Harming routes itself, this script becomes redundant and can be deleted.

---

## Botania — Lexica Botania recipe

### `kubejs/data/botania/recipes/lexicon.json` *(Claude-session, 2026-05-25)*

Overrides Botania's `data/botania/recipes/lexicon.json`. The stock recipe is shapeless `{ #minecraft:saplings + minecraft:book }`; the `#minecraft:saplings` ingredient collided with Dynamic Trees' sapling-based crafting. Swapped the sapling tag for `#minecraft:flowers` — the Lexica Botania is now crafted from any flower + a book.

`#minecraft:flowers` was chosen because it transitively encompasses every vanilla flower **and** every Botania flower: Botania ships tag-extension files (`data/minecraft/tags/items/{small_flowers,tall_flowers}.json`) that inject its mystical / double-mystical / special flowers into `#minecraft:small_flowers` and `#minecraft:tall_flowers`, both of which are contained in `#minecraft:flowers`. No `forge:flowers` item tag exists in the pack.

Same recipe id (`botania:lexicon`), so this is a true replacement. The other lexicon recipe — `lexicon_elven.json` (`botania:elven_trade_lexicon`) — uses no saplings and was left untouched.

**On update — check**: if Botania renames the `lexicon.json` recipe path/id or restructures the recipe, re-sync. If Botania ever stops extending the vanilla small/tall flower tags, its mystical flowers would drop out of `#minecraft:flowers` — unlikely on the 1.20.1 branch.

---

## tconstruct + BetterCombat — weapon_attributes integration

### `kubejs/data/tconstruct/weapon_attributes/*.json` *(Pre-existing, 19 files)*

One-liner files mapping each TConstruct weapon kind to its BetterCombat parent:

`battlesign, broad_axe, cleaver, dagger, earth_staff, ender_staff, hand_axe, ichor_staff, kama, mattock, melting_pan, pickadze, pickaxe, scythe, sky_staff, sledge_hammer, sword, vein_hammer, war_pick`

Each file declares the BetterCombat moveset/animation parent (e.g. dagger → `bettercombat:dagger`). This is what makes TConstruct weapons feel native in BetterCombat's combo system.

**On TConstruct or BetterCombat update — check**:
- If TConstruct adds a new weapon kind (e.g. a new tier of staff), it won't have a BetterCombat parent — needs a new file.
- If TConstruct renames a weapon kind, the existing file becomes orphaned.
- If BetterCombat renames a parent (e.g. `dagger` → `short_blade`), all referencing files break.

**Style note**: these files use 4-space indentation; the rest of the pack uses 2-space. Cosmetic only, but worth normalizing if anyone touches them.

---

## villagersplus — custom trade economies

### `kubejs/data/villagersplus/villager_trades/{alchemist,horticulturist,occultist,oceanographer}.json` *(Pre-existing, 4 files)*

Custom trade tables for VillagersPlus's added professions, each defining novice→master tier offers tuned for the pack's economy.

**On villagersplus update — check**:
- If villagersplus adds new professions, they ship with default trades that may not match the pack's tuning — consider authoring an override.
- If villagersplus refactors the `villager_trades` path or trade-entry schema, all four files need migration.
- If referenced item IDs in trade offers come from removed mods, those trade tiers go inert silently.

---

## Powah — full recipe disable + selective EMI visibility

The pack now disables every Powah recipe wholesale and rebuilds craft paths Create-style separately. The system has three moving parts.

### `kubejs/server_scripts/powah_tier_lock.js` *(Rewritten 2026-05-09)*

**What**: single `event.remove({ mod: 'powah' })` call wiping every recipe in the `powah:` namespace — crafting, smelting, blasting, all Powah-specific recipe types (energizing, etc.) included. Nothing from Powah is craftable via vanilla mechanisms after this script runs.

**History**: was a curated 130-item ID list 2026-05-01 → 2026-05-09. The user decided to rewrite ALL Powah recipes Create-style, making the curated approach obsolete. Switched to namespace-wide wipe. Backup of the previous script at `Novus/backups/20260509_015919_powah_narrow_unlock_full_disable/`.

**Self-maintaining**: when Powah ships new recipes in a future version, the wipe catches them automatically — no script edits needed.

### `kubejs/client_scripts/powah_tier_emi_hide.js` — JEI hide companion *(REMOVED 2026-05-08)*

Originally a `JEIEvents.hideItems` callback intended to be a belt-and-suspenders hide layer alongside the c-tag. Was inert because the pack runs TMRV+EMI with no JEI — the JEIEvents plugin only fires when JEI is present, so the callback never ran. **User confirmed JEI is permanently out of the pack on 2026-05-08, so the script was deleted.** Backup at `Novus/backups/20260508_223805_drop_jei_hide_script/`. The c-tag below remains the sole and complete hide mechanism.

### `kubejs/data/novus/recipes/{crafting,mechanical_crafting}/*.json` — Powah replacement recipes *(Claude-session, 2026-05-09)*

32 hand-authored recipes that fill the void left by `event.remove({ mod: 'powah' })`. Two families of recipe paths:

**Baseline alternates for C&A** (in `crafting/`, redesigned 2026-05-09 v3):
- `alternator_3x3.json` — pattern `SRS / CBC / SCS` (4 copper_spool + 1 iron_rod + 3 capacitor + 1 iron_block).
- `electric_motor_3x3.json` — same pattern, `create:brass_block` instead of iron_block — mirrors C&A's alternator-vs-motor distinction (their mech_crafting uses iron plates for alternator, brass plates for motor).

| element | C&A mech_crafting | Novus 3×3 v3 |
|---|---|---|
| spool | 3 | **4** (slightly increased — frame corners + sides) |
| iron rod | 1 | **1** (preserved as center rotor) |
| capacitor | 1 | **3** (clustered — emphasizes electrical density) |
| iron/brass plate | 6 | 0 (replaced by single block) |
| iron/brass block | 0 | **1** (= 9 ingots in one slot) |
| andesite_alloy | 1 | 0 (dropped — single-block frame fills the structural role) |
| precision_mechanism | 0 | 0 (gate is now the block + spool combination) |

**Gating asymmetry (deliberate)**: alternator uses `minecraft:iron_block` (vanilla — no Create progression required for the metal), motor uses `create:brass_block` (requires Create's mixer for brass). This makes the alternator the natural "first electrical machine" players can craft via the 3×3 path; motor follows after upgrading to a brass economy. Mirrors C&A's alternator-as-prerequisite-for-motor relationship.

**v3 design changes** vs v2 (`Novus/backups/20260509_194645_alternator_motor_3x3_v2/`): dropped iron/brass plates entirely in favor of a single iron_block / brass_block that represents the bulk metal commitment more compactly. Dropped precision_mechanism — the gate is now natural via spools (require Create rolling mill) + brass_block (requires Create mixer for the motor specifically). Bumped capacitor count from 1 to 3 to emphasize the "this is an electrical machine" identity. Moved spools to corners + sides for a more visually balanced "inductive frame" feel. v2 backups at `Novus/backups/20260509_194645_alternator_motor_3x3_v2/`; v3 backups at `Novus/backups/20260509_194645_alt_motor_v3_cables_yield/`.

**Powah replacement recipes** for the 6 enabled families × 3 tiers (starter/basic/hardened):
- `crafting/battery_{starter,basic,hardened}.json` — 3×3 only (item).
- `crafting/energy_cable_{starter,basic,hardened}.json` — 3×3 only, bulk yield 8 (commodity).
- `crafting/energy_cell_{starter,basic,hardened}.json` + `mechanical_crafting/energy_cell_*.json` — block, dual path.
- `crafting/energy_discharger_*.json` + `mechanical_crafting/energy_discharger_*.json` — block, dual path.
- `crafting/energy_hopper_*.json` + `mechanical_crafting/energy_hopper_*.json` — block, dual path.
- `crafting/solar_panel_*.json` + `mechanical_crafting/solar_panel_*.json` — block, dual path.

**Tier ingredient palette — v2 redesign 2026-05-09** (consistent across all families, sheets-based):

| Component | Starter | Basic | Hardened |
|---|---|---|---|
| sheet (tag) | `#forge:plates/iron` | `#forge:plates/brass` | `createaddition:electrum_sheet` |
| wire | `createaddition:copper_wire` | `createaddition:gold_wire` | `createaddition:electrum_wire` |
| rod (tag) | `#forge:rods/iron` | `#forge:rods/brass` | `createaddition:electrum_rod` |
| spool | `createaddition:copper_spool` | `createaddition:gold_spool` | `createaddition:electrum_spool` |
| storage (all tiers) | `createaddition:capacitor` | `createaddition:capacitor` | `createaddition:capacitor` |

**v2 design changes** vs the original 2026-05-09 set (see backup `Novus/backups/20260509_193725_powah_recipes_v2_redesign/` for v1):
- **No precision_mechanism** anywhere in Powah recipes (felt thematically out of place for energy components).
- **Sheets via `forge:plates/<metal>` tag** instead of raw ingots (PCB/circuit-board feel matching C&A's industrial aesthetic; Create's rolling mill outputs feed the tag automatically).
- **No tier-upgrade chain** — every tier is crafted from scratch with its own materials. Hardened doesn't consume basic; basic doesn't consume starter.
- **Cables are wire-dominant** — 6 wires + 3 sheets → 8 cables. Direct visual+ingredient connection to C&A's wire system.
- **Per-family pattern is consistent across all 3 tiers** — only the *tier* of the ingredient changes between starter/basic/hardened, not the recipe shape. The shape is the family signature.

**Family signatures** (recipe pattern + ingredient mix):

| Family | 3×3 pattern | mechanical_crafting pattern | Theme |
|---|---|---|---|
| battery | `WSW / SCS / WSW` | (3×3 only, no mech) | compact electrical, wire/sheet shell + capacitor core |
| energy_cable | shapeless: 1 wire + 1 minecraft:black_wool → 4 cables | (shapeless only, no mech) | minimum-friction crafting; black wool as insulator (matches real-world cable insulation color); tier varies wire only |
| energy_cell | `SCS / WCW / SCS` | `SSS / SCS / SSS` | dual-capacitor in 3×3 emphasizes block storage |
| energy_discharger | `SRS / RCR / SRS` | `SSS / RCR / SSS` | rod = output channel signature |
| energy_hopper | `SPS / PCP / SPS` | `SSS / PCP / SSS` | spool = transfer mechanism signature |
| solar_panel | `GGG / SCS / WDW` | `GGG / SCS / SDS` | glass top + daylight_detector + wires for "circuitry" |

(Pattern legend: S=sheet, W=wire, R=rod, P=spool, C=capacitor, G=glass, D=daylight_detector)

**Cost differential — 3×3 vs mechanical_crafting** for blocks: the 3×3 versions use more "specialty" components per recipe (4 capacitors/rods/spools instead of 2 — twice as many of the family-signature ingredient). The mechanical_crafting versions are sheet-heavy and lighter on the signature component. The 3×3 path is the resource-intensive route; the mechanical_crafting path is the "automation-friendly" cheaper baseline.

**Capacity/transfer calibration applied to `config/powah.json5` 2026-05-09** (per user, anchored on C&A accumulator):

For storage/transfer families (battery, energy_cell, energy_discharger, energy_hopper):

| tier | capacity (FE) | transfer (FE/t) |
|---|---|---|
| starter | 1,000,000 | 2,500 |
| basic | 2,000,000 (= C&A accumulator) | 5,000 (= C&A accumulator I/O) |
| hardened | 4,000,000 | 10,000 |

For cables (transfer-only):

| tier | transfer (FE/t) |
|---|---|
| starter | 2,500 |
| basic | 5,000 |
| hardened | 10,000 |

**Cable design choice — 1:1 with cell transfer rates** (deliberately NOT Powah's default 0.5× pattern). Powah ships cables at half their matching-tier cell transfer to make cable upgrades a tier-progression decision; Novus runs cables at 1:1 to follow Create's "infrastructure as plumbing" philosophy where connections don't have meaningful tiers — pick the cable adequate for your cell, never worry about tier-mismatch bottlenecks. User-confirmed design call 2026-05-09; see memory `feedback_powah_cables_one_to_one.md` for the rationale.

For solar panels (separate scale because they're generators with small internal buffers, not storage blocks):

| tier | capacity (FE) | transfer (FE/t) | generation (FE/t day) |
|---|---|---|---|
| starter | 40,000 | 2,500 | 30 |
| basic | 80,000 | 5,000 | 60 |
| hardened | 160,000 | 10,000 | 120 |

**Tiers 4–7 (blazing/niotic/spirited/nitro) were left untouched** in `powah.json5` — they're hidden in EMI and have no recipes anyway, so the legacy Powah scaling for those tiers is irrelevant until/unless they're brought into scope. 26 individual numeric edits applied via targeted regex to preserve comments and tier 4–7 values. Backup at `Novus/backups/20260509_183642_powah_capacity_calibration/powah.json5.before`.

**Maintenance**: when Powah ships new content, the wholesale `event.remove({ mod: 'powah' })` in `powah_tier_lock.js` will catch any new recipe; new items will need new recipes here if they're in scope. When createaddition updates, the alternator/electric_motor 3×3 alternatives may need a recipe-shape audit if C&A renames `copper_spool`, `capacitor`, or `brass_casing`.

### `kubejs/data/c/tags/items/hidden_from_recipe_viewers.json` *(120 entries as of 2026-05-09)*

The EMI hide mechanism — `c:hidden_from_recipe_viewers` is the convention EMI honors. Most Powah items are hidden so they don't clutter EMI; the visible exceptions are the work-surface for the upcoming Create-style recipe rewrite:

**Visible in EMI** (intentionally NOT in the hide tag):
- All 5 battery tiers (`battery_hardened`, `battery_blazing`, `battery_niotic`, `battery_spirited`, `battery_nitro`) — battery is the user's prototype family for the Create-recipe rewrite
- 5 other "enabled" device families' hardened items: `energy_cable_hardened`, `energy_cell_hardened`, `energy_discharger_hardened`, `energy_hopper_hardened`, `solar_panel_hardened` — these families have tier 1-2 working today and tier 3 is the next progression rung

**Hidden in EMI**:
- 9 fully-locked machine families' hardened items (ender_cell, ender_gate, energizing_rod, furnator, magmator, player_transmitter, reactor, thermo_generator, capacitor)
- All higher-tier crystal items (blazing/niotic/spirited/nitro × crystals + crystal blocks)
- Higher-tier device family items (blazing/niotic/spirited/nitro for all device families)
- Utility items (wrench, pearls, cards, lens of ender, dielectric components, energized-steel forms, ender core, energizing orb)
- Worldgen items (uraninite + dry ice family)

### `kubejs/data/c/tags/blocks/hidden_from_recipe_viewers.json` *(Pre-existing)*

Block-side companion to the items tag.

**On Powah update — check**:
- If Powah renames any tier-locked recipe ID, the `event.remove` no-ops and the recipe re-appears (hidden from EMI by tag, but craftable). Re-grep recipe IDs vs the lockdown list.
- If Powah renames items, the c-tag entries become inert and items become EMI-visible.
- If the pack moves to a different recipe-viewer (back to JEI, or REI), the c-tag no longer fires; need to write the appropriate hide hook for that viewer.

**Standing rule (per `STYLE_GUIDE.md` §4)**: do NOT use `JEIEvents.hideItems` in this pack. The c-tag is the actionable path.

---

## Dynamic Trees loot economy (dynamictrees, dtquark, dttconstruct)

The pack carries the full DT branch + leaves loot economy as datapack overrides. ~40 files across three namespaces. The system uses DT's custom loot paramsets — `dynamictrees:branches` and `dynamictrees:leaves` — which are NOT the same as `minecraft:block`.

### Branch loot tables (DT-paramset)

- `kubejs/data/dynamictrees/loot_tables/trees/branches/*.json` — 10 files (acacia, birch, cherry, crimson, dark_oak, jungle, mangrove, oak, spruce, warped)
- `kubejs/data/dtquark/loot_tables/trees/branches/*.json` — 4 files (ancient, azalea, blossom, glow_shroom)
- `kubejs/data/dttconstruct/loot_tables/trees/branches/*.json` — 4 files (bloodshroom, enderbark, greenheart, skyroot)

All declare `"type": "dynamictrees:branches"` (the DT paramset) and use DT-specific entries like `dynamictrees:seed_item` and functions like `dynamictrees:multiply_logs_count` / `dynamictrees:multiply_sticks_count`. The dttconstruct files were already correct; the dynamictrees + dtquark files were silently using `"type": "minecraft:block"` until the **2026-05-08 audit** caught it. Per memory `reference_dt_loot_context.md`, the wrong context type means `block_state_property` and `entity_properties` conditions silently fail — the conditions actually used (`survives_explosion`, `match_tool`) work in either context, so there was no live in-game impact, but it was a latent silent-fail trap. Backups for the 14 corrected files at `Novus/backups/20260508_221446_dt_loot_context/`.

### Leaves loot tables (DT-paramset, seasonal-fall)

- `kubejs/data/dynamictrees/loot_tables/trees/leaves/*.json` — 14 files
- `kubejs/data/dtquark/loot_tables/trees/leaves/*.json` — 6 files

These declare `"type": "dynamictrees:leaves"` and use DT's `dynamictrees:seasonal_seed_drop_chance` condition. Same 2026-05-08 fix applied — was `minecraft:block`, now correctly `dynamictrees:leaves`.

### Block-break leaves loot tables (vanilla paramset)

- `kubejs/data/dynamictrees/loot_tables/blocks/*_leaves.json` — 14 files
- `kubejs/data/dtquark/loot_tables/blocks/*_leaves.json` — 6 files

These are different — they're vanilla block-break loot tables, fired when the player chops a leaf block directly. They correctly use `"type": "minecraft:block"` because they're vanilla-paramset. **Don't change these to DT paramsets** — they'd silently break.

### dttconstruct leaves are `loot_tables/blocks/*_slime_leaves.json` only

dttconstruct doesn't have a `trees/leaves/` directory. Its leaves loot tables live at `loot_tables/blocks/{earth,ender,sky}_slime_leaves.json` — vanilla-paramset, with the 2026-05-08 `alternative` → `any_of` fix described in the dttconstruct section above.

**On Dynamic Trees update — check**:
- If DT renames `dynamictrees:branches` / `dynamictrees:leaves` paramsets (unlikely but possible), all DT-paramset files need migration.
- If DT renames any of `dynamictrees:seed_item`, `dynamictrees:multiply_logs_count`, `dynamictrees:multiply_sticks_count`, `dynamictrees:seasonal_seed_drop_chance` — those entries silently stop registering.
- If a vanilla species changes (e.g. cherry trees alter their species ID), the corresponding loot file is orphaned.

When a mod ships a new version:

1. Update the jar.
2. Find that mod in this document's quick index.
3. For each listed patch:
   - Read the patch file.
   - Compare against the new jar's equivalent file (`unzip -p <new.jar> <path>`).
   - If upstream now matches what the patch was achieving, delete the patch.
   - If upstream changed structure, edit the patch.
4. Launch the game and grep `logs/latest.log` for errors mentioning the affected paths.
5. If no errors and behavior holds, commit the change.

When adding a new patch, **add an entry here in the same format** so it stays trackable.
