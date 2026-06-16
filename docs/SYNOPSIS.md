# Novus — Pack Technical Synopsis

**Snapshot date:** 2026-05-19
**Minecraft:** 1.20.1
**Loader:** Forge 47.4.20
**Java:** 17.0.19 (Eclipse Adoptium)
**Mod count:** 191 (175 top-level, 16 nested JarJar) — Valkyrien Skies suite (VS + Clockwork + Trackwork + JIJ Kelvin) removed 2026-06-11, set aside as optional module (`optional_modules/valkyrien_skies/`)
**Active dev instance:** `/home/zonbi/.var/app/org.prismlauncher.PrismLauncher/data/PrismLauncher/instances/novus_dev/`

This is a maintenance-oriented technical audit. For per-patch review see `PATCHES.md`. For design decisions captured during work see the memory entries (`project_novus_chocolate_tiering.md`, `project_novus_patches.md`).

---

## 1. Identity & design pillars

Novus is a **Create-anchored progression pack** that grafts Tinkers' Construct material progression onto Create's automation chassis, then layers FarmersDelight food complexity and Quark/Supplementaries QoL on top. It is not a "kitchen sink" pack — domain coverage is uneven and intentional.

**Five anchor ecosystems:**

1. **Create + addons** (≈22 mods) — the central tech identity. Steam, kinetics, contraptions, fluid networks, automated logistics. Heavy use of compat addons (railways, hypertube, contraption terminals, deco, armory, vibrant vaults).
2. **Tinkers' Construct + addons** (≈6 mods) — material/tool tiering layer. Bridged into Create via `tgears` (single-block heat from Create burners → TC Melter/Alloyer).
3. **FarmersDelight family** (6 content + 5 bridges) — cooking, beverages, regional addons. Compat aggregator (`compatdelight`) keeps third-party FD addons consistent.
4. **Quark + Supplementaries + Macaw's** (≈14 mods) — block diversity, decoration, vanilla++ feel. Diagonal connection mods extend this aesthetic.
5. **Botania + Biomancy** (2 mods, intentionally distinct) — two full magic paths that branch in different directions. **Botania ties into the agriculture stack** (AgriCraft, Dynamic Trees, FarmersDelight crops) — a flora-magic path that grows alongside the farming layer. **Biomancy ties into Create** via `biofactory` — a flesh-magic path with a tech bridge for bulk processing. This is intentional design: pick a magic, get a different adjacent specialty.

**What this pack is _not_:**
- Not combat-focused (no Battle Towers, no Bosses of Mass Destruction, no Spice of Life-style RPG progression)
- Not exploration-driven beyond YUNG's API utilities and Repurposed Structures
- Not RPG/quest-driven (no FTB Quests, no SkillTree)
- Not a "tech endgame" pack (no AE2, no Mekanism, no IE)
- Not multiplayer-focused (FTB Chunks/Teams present but single-player tuning dominates)

**Hard mandates (gate every relevant mod evaluation):**
- **Vanilla overworld is the singleplayer default; Lost Cities is opt-in client / forced server (1.1.1).** The pack bundles **The Lost Cities** with a custom `novus` profile that overlays abandoned cities on the **unchanged vanilla biome/terrain layout** (`landscapeType: default`; no sphere/void regeneration — vanilla biome placement and seed mapping stay intact, `project_novus_worldgen_vanilla_parity` still holds). **Singleplayer ships with LC OFF by default** (vanilla overworld); players opt in by selecting "novus" in the LC world-creation menu — so the vanilla-default mandate is intact for solo play. The **dedicated server forces `novus` on for everyone** (via the `_server_deploy` build overlay). The hard line for biome mods is unchanged: mods that *replace or inject biomes* (TerraBlender-based BOP/BYG) remain excluded — they alter the biome layout rather than overlay structures on it (see `DECISIONS.md`), and any such mod must still ship as a true packwiz-optional module, not a global injection.

The progression arc is implicit: vanilla → FarmersDelight food chain → Tinkers tool tiers → Create automation → Botania (agriculture-side magic) and/or Biomancy (Create-side magic) as branching specialties → late-Create logistics with Vibrant Vaults, Power Loaders, Petrol Park.

---

## 2. Mod inventory by domain

### Compatibility / Bridge / Integration mods (15)

The pack is **bridge-heavy by design**. These mods exist primarily or substantially to make ecosystems interoperate. Each is also referenced as a cross-ref (→) in its host domain section below.

| Mod | Connects | Notes |
|---|---|---|
| `compatdelight 1.0.1.1` | FarmersDelight ↔ many FD addons | Aggregator: conditional FD recipes per addon, toggleable via `compatdelight:compat_enabled` Forge condition |
| `create_central_kitchen 1.4.3b` | Create ↔ FarmersDelight | Create automation drives FD cooking pipeline |
| `tgears 0.5.1` | Create ↔ TConstruct | Create burners → TC Melter/Alloyer single-block heat. Hardcoded compat list (Create, moreburners, createaddition; CDG not supported) |
| `biofactory 0.6.0` | Create ↔ Biomancy | Lets Create machinery handle Biomancy bulk processing — the bridge that gives Biomancy a tech-side outlet |
| `bio_delight 1.0.1` | Biomancy ↔ FarmersDelight | Biomancy outputs as FD ingredients |
| `tinkersdelight 1.2.0` | TConstruct ↔ FarmersDelight | TC knife as FD knife; adds dishes that use TC tools |
| `dttconstruct 1.20.1-1.5.0` | Dynamic Trees ↔ TConstruct | Slime tree wood as TC tool material |
| `dtquark 1.20.1-2.5.3` | Dynamic Trees ↔ Quark | Quark tree species as DT-grown |
| `quarkdelight 1.0.0` | Quark ↔ FarmersDelight | Quark items as FD ingredients |
| `kubejsdelight 1.1.5` | KubeJS ↔ FarmersDelight | Exposes FD recipe types to KubeJS scripting |
| `kubejs_create 2001.3.0` | KubeJS ↔ Create | Exposes Create recipe types to KubeJS |
| `kubejsadditions 4.3.4` | KubeJS ↔ multi-mod | General KubeJS extensions across mods |
| `sawmill 1.20-1.4.10` | Dynamic Trees ↔ Create/vanilla wood | Log→planks pipeline so DT-grown logs plug into Create and vanilla wood recipes |
| `everycomp 1.20-2.9.20` | All block-adding mods ↔ Quark/Supplementaries verticals | Auto-generates slabs/stairs/walls/fences/etc. for blocks from any installed mod (the pack's wood/stone-gen mod) |
| `toomanyrecipeviewers 0.7.2` | EMI ↔ JEI | EMI as frontend, JEI plugins still register through TMRV. Bundles JEI 15.20.0.129 |

For deeper how-the-bridge-works detail, see Section 3 (integration architecture).

### Core Tech: Create + addons (~17 content + 4 bridges)

| Mod | Role |
|---|---|
| `create 6.0.8` | Anchor — kinetics, fluids, contraptions |
| `create_blaze_burner_fuels 1.0.2` | Custom blaze burner fuel definitions |
| `create_connected 1.1.13` | Additional kinetic blocks/mechanics |
| `create_crush_everything 1.0.2` | Generalizes crushing wheel acceptance |
| `create_enchantment_industry 1.3.3-for-create-6.0.6` | Automated enchanting/disenchanting via XP fluid |
| `create_hypertube 0.4.0` | Pneumatic-style item transport |
| `create_jetpack 4.4.6` | Mech jetpack with Create energy |
| `create_power_loader 2.0.3` | In-world chunkloading via Create blocks |
| `create_vibrant_vaults 0.3.2` | Decorative vault blocks |
| `createaddition 1.20.1-1.3.3` | FE↔SU bridge, electrical machinery |
| `createarmory 0.5` | Create-themed weapons (RPG, etc.) |
| `createcontraptionterminals 1.2.0` | Contraption command terminals |
| `createdeco 2.0.3` | Decorative Create-themed blocks |
| `createdieselgenerators 1.20.1-1.3.12` | Diesel/petroleum power chain |
| `copycats 3.0.7` | Copycat block disguises |
| `petrolpark 1.4.27` | Oil/petroleum content |
| `petrolsparts 1.2.3` | PetrolPark addon |
| `railways 1.7.2` | Create: Steam 'n' Rails |
| `tponder 1.1` | Ponder support for Tinkers content |
| → `create_central_kitchen` | Bridge to FarmersDelight — see Compatibility section |
| → `tgears` | Bridge to TConstruct (Melter/Alloyer heat) — see Compatibility section |
| → `biofactory` | Bridge to Biomancy (bulk processing) — see Compatibility section |
| → `sawmill` | Bridge to Dynamic Trees + vanilla wood — see Compatibility section |
| → `kubejs_create` | KubeJS scripting bindings — see Compatibility section |

**Version-locked**: `create_enchantment_industry` and `tgears` filename-pin to specific Create patch versions (6.0.6 / 6.0.8). Bumping Create requires verifying both before pulling the update.

### Tinkers' Construct + addons (3 content + 3 bridges)

| Mod | Role |
|---|---|
| `tconstruct 3.11.2.166` | Anchor — materials, modifiers, tools |
| `mantle 1.11.104` | TC dependency lib |
| `tinkers_things 1.3.3` | Modifiers and additional tools |
| → `tinkersdelight` | Bridge to FarmersDelight (knife) — see Compatibility section |
| → `dttconstruct` | Bridge to Dynamic Trees (slime tree materials) — see Compatibility section |
| → `tgears` | Bridge to Create (Melter/Alloyer heat from burners) — see Compatibility section |

### Magic / Mystical (2)

Two magic mods, intentionally distinct in how they connect to the rest of the pack. Both are full magical paths — neither is a side mod.

| Mod | Role |
|---|---|
| `botania 1.20.1-452-FORGE` | Flora-driven magic, mana network. **Ties into the agriculture stack** (AgriCraft, Dynamic Trees, FarmersDelight crops) thematically — flowers, mana plants, and growing-driven progression sit alongside the pack's farming layer. No tech bridge to Create. |
| `biomancy 2.8.19.0` | Bio/flesh-driven magic and automation. **Ties into Create** via `biofactory` (see Compatibility section), giving Biomancy outputs a path into Create logistics for bulk processing. Modonomicon book scaffolding present but unimplemented. |

**Design statement:** the two magic paths branch in opposite directions — Botania toward agriculture/biology of plants, Biomancy toward tech-bridged biology of flesh. Players choosing one tend to invest in the adjacent (agriculture-heavy or Create-heavy) playstyle.

### Physics / Ship simulation — REMOVED 2026-06-11 (set aside as optional module)

The Valkyrien Skies suite (`valkyrienskies 2.4.11` + `vs_clockwork 0.5.6` + `trackwork 1.20.1-1.2.4`, with `kelvin` JIJ inside Clockwork) was added 2026-05-19 and removed 2026-06-11 for established performance cost, mixin maintenance tax, and pre-1.0.5 multiplayer concerns. Full set-aside bundle + restore manifest + optionality plan: `optional_modules/valkyrien_skies/RESTORE.md`. Intent is to reintroduce it as a packwiz-optional module.

**Correction (2026-06-11):** earlier versions of this doc claimed the suite ran via Sinytra Connector. Jar inspection shows all three are Forge-native builds (Forge JIJ deps, no fabric.mod.json) — Connector serves the Fabric map mods (Antique Atlas/Surveyor family) and stays. The Canary POI collision was a plain Forge-mixin conflict, not Connector-induced.

### FarmersDelight family (6 content + 5 bridges)

| Mod | Role |
|---|---|
| `farmersdelight 1.20.1-1.2.11a` | Anchor — cooking pot, knife, skillet |
| `farmersdelightplus 1.20.1-1.3.1` | Major addon (more dishes, master chef chain) |
| `farmersrespite 1.20.1-2.1` | Beverages, kettles, brewing |
| `brewinandchewin 1.20.1-3.2.1` | Alcohol, fermenting |
| `chefsdelight 1.0.4-forge-1.20.1` | More dishes |
| `frightsdelight 1.4.6` | Halloween-themed FD content |
| `miners_delight 1.20.1-1.2.3` | Mining-themed food + loot modifiers |
| → `compatdelight` | Aggregator for FD-addon compat — see Compatibility section |
| → `bio_delight` | Bridge to Biomancy — see Compatibility section |
| → `tinkersdelight` | Bridge to TConstruct (knife) — see Compatibility section |
| → `quarkdelight` | Bridge to Quark — see Compatibility section |
| → `kubejsdelight` | Bridge to KubeJS — see Compatibility section |
| → `create_central_kitchen` | Bridge to Create automation — see Compatibility section |

### Farming / Crops / Trees (3 content + 3 bridges)

| Mod | Role |
|---|---|
| `agricraft 4.0.6` | Crop genetics, breeding |
| `dynamictrees 1.20.1-1.4.10` | Animated tree growth |
| `dynamictreesplus 1.20.1-1.2.2` | Mushroom/cactus/jungle tree forms |
| → `dtquark` | Bridge to Quark trees — see Compatibility section |
| → `dttconstruct` | Bridge to TConstruct (slime trees as TC material) — see Compatibility section |
| → `sawmill` | Bridge to Create/vanilla wood (log→planks) — see Compatibility section |

### Exploration / Worldgen / Structures (10)

| Mod | Role |
|---|---|
| `bountiful 6.0.4` | Bounty board quests |
| `enhancedcelestials 1.20.1-5.0.3.2` | Lunar events (blood moon, etc.) |
| `explorerscompass 1.20.1-1.4.0` | Locate structures |
| `immersive_gateways 0.0.5` | Custom portal generation |
| `naturescompass 1.20.1-1.12.0` | Locate biomes |
| `repurposed_structures 7.1.23` | Additional structures |
| `sereneseasons 9.1.0.2` | Seasonal cycles |
| `sereneseasonsplus 4.2.4` | Addon to SereneSeasons — extended seasonal mechanics |
| `terrablender 3.0.1.10` | Biome blending lib |
| `yungsapi 1.20-Forge-4.0.6` | YUNG framework (no YUNG content mods loaded — present as transitive dep) |

`roadweaver` was removed 2026-05-16 — H2 corruption + Iris Xe bandwidth contention; see memory entry.

**Note:** `yungsapi` is loaded but no YUNG content mods (Better Dungeons / Strongholds / Mineshafts / Caves) are installed. It's pulled as a dep by something — possibly bountiful or repurposed_structures.

### Storage (3)

| Mod | Role |
|---|---|
| `backpacked 3.0.9` | Backpack curio |
| `storagedrawers 12.14.3` | Drawer-style storage |
| `toms_storage 1.7.1` | RS-style storage terminal |

**No FTB stack loaded** (verified 2026-05-18 against `mods/`): `ftbchunks`, `ftblibrary`, `ftbteams` are not present. There is no chunk-claim mod or team-management mod in the pack. `ftbbackups2` is also absent (see `memory/project_ftb_backups_removed.md`).

### Decoration / Building / Aesthetic (~22 content + 1 bridge)

| Mod | Role |
|---|---|
| `amendments 1.20-2.2.5` | Vanilla amendments (tweaks) |
| `another_furniture 1.20.1-3.0.4` | Furniture |
| `bellsandwhistles 0.4.3` | Bells, lamps |
| `ceramics 1.8.0` | Kiln, ceramic decoration |
| `chalk 1.6.7` | Surface markers |
| `comforts 6.4.0` | Sleeping bags, hammocks |
| `diagonalfences 8.1.5` | Diagonal connection fences |
| `diagonalwalls 8.0.4` | Same for walls |
| `diagonalwindows 8.1.5` | Same for windows |
| `escalated 1.2.1` | Escalators |
| `exposure 1.9.20` | Cameras + photographs |
| `exposure_polaroid 1.1.4` | Polaroid camera variant |
| `mcwbridges` / `mcwdoors` / `mcwfences` / `mcwholidays` / `mcwlights` / `mcwpaths` / `mcwroofs` / `mcwstairs` / `mcwtrpdoors` / `mcwwindows` | Macaw's full deco suite |
| `pipeorgans 0.8.2` | Playable pipe organ blocks |
| `supplementaries 1.20-3.1.43` | Supplementaries deco mod |
| `suppsquared 1.20-1.1.29` | Supplementaries Squared addon |
| → `everycomp` | Auto-generates slabs/stairs/walls/fences for blocks from any installed mod — see Compatibility section |

(Note: `createdeco` and `create_vibrant_vaults` are content from the Create section but also fill a decoration role.)

**Density signal**: 10 Macaw's mods + Supplementaries + Quark + diagonals + `everycomp`'s auto-generation = the pack is heavily decoration-rich. Build-focused players get a lot here.

### Recipe viewers / In-game info (7 content + 1 bridge)

| Mod | Role |
|---|---|
| `emi 1.1.24` | Primary recipe viewer (frontend) |
| `jade 11.13.2` | Block info HUD |
| `jadeaddons 5.5.0` | Jade extensions |
| `jeed 1.20-2.2.5` | Just Enough Effects Descriptions |
| `jeresources 1.4.0.247` | Drop info, villager trades |
| `justenoughbreeding 3.0.1` | Animal breeding info |
| `justenoughprofessions 3.0.1` | Villager profession info |
| → `toomanyrecipeviewers` | EMI ↔ JEI bridge (bundles JEI) — see Compatibility section |

### QoL / UI / Player Convenience (~16)

| Mod | Role |
|---|---|
| `appleskin 2.5.1` | Food/saturation HUD |
| `betterdays 3.3.4.5` | Day/night cycle length modifier |
| `betterthirdperson 1.9.0` | Third-person camera improvements |
| `catalogue 1.8.0` | Mod menu |
| `cherishedworlds 6.1.7` | Favorite worlds |
| `chunky 1.3.146` | Pre-generation tool |
| `collective 8.22` | Serilum's lib + QoL features |
| `configured 2.2.3` | In-game config GUI |
| `controllable 0.21.9` | Gamepad support |
| `controlling 12.0.2` | Keybind manager |
| `enchdesc 17.1.21` | Enchantment tooltip descriptions |
| `freecam 1.2.1` | Debug freecam |
| `hideexperimentalwarning 1.2` | Removes the experimental world warning |
| `initialinventory 11.0.2` | Configurable starter items |
| `leavesbegone 8.0.0` | Faster decay for non-DT leaves (5-20 tick) |
| `searchables 1.0.3` | Search lib |

### Performance / Optimization (10)

| Mod | Role |
|---|---|
| `canary 0.3.3` | Lithium fork (server tick perf) |
| `embeddium 0.3.31` | Sodium fork (rendering) — currently tainted by sodiumoptionsapi |
| `entityculling 1.10.2` | Entity render culling |
| `ferritecore 6.0.1` | BlockState/memory dedup |
| `immediatelyfast 1.5.4` | Immediate-mode rendering perf |
| `lighty 2.1.3` | Light engine perf |
| `modernfix 5.27.33` | Comprehensive perf patches + bug fixes |
| `saturn 0.1.3` | Misc micro-optimizations |
| `sodiumdynamiclights 1.0.9` | Performant dynamic lights (note: registers reload listener on wrong thread; ModernFix catches) |
| `sodiumoptionsapi 1.0.10` | Embeddium settings UI |

### Visual / Atmosphere (8)

| Mod | Role |
|---|---|
| `auroras 1.6.2` | Northern lights in cold biomes at night |
| `entity_model_features 3.2.4` | Custom entity models from resourcepacks |
| `entity_texture_features 7.1` | Custom entity textures |
| `particlerain 4.0.0-beta.10` | Rain/snow particle replacements; owns weather audio |
| `rainbows 1.5` | Post-rain rainbow rendering |
| `simpleclouds 0.7.3` | Cloud overhaul. Per-world `serverconfig/simpleclouds-server.toml` sets `cloudMode = "DEFAULT"` (all four save worlds verified 2026-05-18) — the integrated server in single-player drives mode, so the `simpleclouds-client.toml` `clientSideCloudMode = "AMBIENT"` line is dead code here. DEFAULT means SC uses all its cloud types with its own localized weather. SC-owned rain audio/rendering and storm fog are disabled in client.toml so ParticleRain owns weather audio/particles. |
| `sound_physics_remastered 1.20.1-1.5.1` | Reverberation, occlusion |
| `subtle_effects 1.14.3` | Polish effects (footsteps, etc.) |

`entity_sound_features` and `immersivesnow` were removed since the previous snapshot — ESF was incompatible with EMF 3.2.2, ImmersiveSnow was dropped during a pack update.

### Modifiers / Curios / Items (4)

| Mod | Role |
|---|---|
| `curios 5.14.1` | Slot framework |
| `pehkui 3.8.2` | Entity scaling |
| `polymorph 0.49.10` | Recipe disambiguation UI |
| `solarflux 20.1.11` | Solar panels (FE) |

### Villagers & Trading (5)

| Mod | Role |
|---|---|
| `barteringstation 8.0.0` | Automated piglin bartering |
| `bountiful 6.0.4` | Bounty quests |
| `tradingpost 8.0.2` | Multi-villager trading |
| `villagersellanimals 1.2.1` | Villagers sell animals |
| `villagersplus 3.1` | Custom professions |

### Redstone / Logic

| Mod | Role |
|---|---|
| `morered 4.0.0.4` | Redstone logic gates / wires |

### Combat / Training

| Mod | Role |
|---|---|
| `dummmmmmy 1.20-2.0.11` | Combat training dummy |

### Scripting / Datapack tooling (4 content + 3 bridges)

| Mod | Role |
|---|---|
| `crafttweaker 14.0.60` | Recipe scripting (.zs) |
| `jsonthings 0.9.13` | JSON-defined content framework. **Hard-required by `tinkers_things`** (which uses it to register custom modifiers/content via JSON), and used optionally by TConstruct itself (`slimeknights/tconstruct/plugin/jsonthings/` plugin registers FlexBlock/FlexItem types). Library-role here — not directly authored against in this pack. |
| `kubejs 2001.6.5` | JS-based scripting (anchor) |
| `paxi 1.20-Forge-4.0` | Global datapack/resourcepack loader |
| → `kubejs_create` | KubeJS bindings for Create — see Compatibility section |
| → `kubejsadditions` | KubeJS multi-mod extensions — see Compatibility section |
| → `kubejsdelight` | KubeJS bindings for FarmersDelight — see Compatibility section |

### Diagnostics

| Mod | Role |
|---|---|
| `spark 1.10.53` | Profiler |

### Libraries / API (~22)

`architectury`, `bookshelf`, `cloth_config`, `framework`, `fzzy_config`, `gaboulibs`, `geckolib`, `glitchcore`, `kambrik`, `kotlinforforge`, `mantle`, `moonlight`, `patchouli`, `polylib`, `ponderjs` (+ bundled `ponder`), `puzzleslib` (+ `puzzlesaccessapi`), `resourcefulconfig`, `rhino`, `yungsapi`, `zeta`, plus bundled `flightlib`, `mixinsquared`, `midnightlib`, `spectrelib`, `useitemonblockevent`, `flywheel`, `fabric_api_base`, `trender`.

`corgilib`, `dataanchor`, and `hammerlib` were in the previous snapshot but are no longer loaded — `hammerlib` was disabled with SolarFluxReborn (ModernFix incompat); others fell off when their host mods were removed.

Library count is high — about a third of the pack is non-content support code. Common in 1.20.1 Forge.

---

## 3. Integration architecture

The pack relies heavily on bridge mods to make ecosystems talk to each other:

| Bridge | Connects | Mechanism |
|---|---|---|
| `create_central_kitchen` | Create ↔ FarmersDelight | Create-based cooking automation |
| `tgears` | Create ↔ TConstruct | Mixin into Create's BlazeBurnerBlock + TC's MelterBlockEntity/AlloyerBlockEntity |
| `tinkersdelight` | TConstruct ↔ FarmersDelight | TC knife as FD knife |
| `dttconstruct` | DynamicTrees ↔ TConstruct | Slime trees as TC tool materials |
| `compatdelight` | FarmersDelight ↔ N other FD addons | Conditional recipes guarded by `compatdelight:compat_enabled` per addon |
| `bio_delight` | Biomancy ↔ FarmersDelight | Brings biomancy outputs into FD ingredient streams |
| `biofactory` | Create ↔ Biomancy | Lets Create machinery handle Biomancy processing / bulk production |
| `kubejsdelight`, `kubejs_create`, `kubejsadditions` | KubeJS ↔ Create/FD | Extends KubeJS with mod-aware recipe types |
| `quarkdelight` | Quark ↔ FarmersDelight | Quark items as FD ingredients |
| `dtquark` | DynamicTrees ↔ Quark | Quark tree blocks as DT-grown |
| `sawmill` | DynamicTrees ↔ Create/vanilla | Log → planks pipeline |
| `everycomp` | Any block-adding mod ↔ Quark/Supplementaries verticals | Auto-generates slabs/stairs/etc. |
| `toomanyrecipeviewers` | EMI ↔ JEI | EMI as frontend, JEI plugins still register |
| `kubejs` (assets/data) + `paxi` | Pack-wide patches | Author-maintained datapacks ship via these |

**Compat-broken or partial:**
- `petrolpark` JEI integration silently disabled under TMRV (mixin target `mezz.jei.forge.JustEnoughItemsClient` no longer resolvable since JEI is now JarJar-bundled).
- `tgears` does not support CDG (Create Diesel Generators) burners — hardcoded compat list. Filed as known limitation.
- `biomancy` Modonomicon integration scaffolded but ships no book content.

---

## 4. Progression layers

The pack does not enforce a quest-driven progression but supports an implicit arc:

**Tier 0 — Vanilla survival:** standard MC start. AppleSkin, Comforts, InitialInventory, FTB Chunks for spatial planning.

**Tier 1 — FarmersDelight cooking + Tinkers tools:** stove, cooking pot, knife. TC tool tables with overworld materials (copper, iron, slime).

**Tier 2 — Create kinetics:** windmills, water wheels, encased fans, blaze burners. Create Central Kitchen brings cooking into automation. Botania (agriculture-anchored) and Biomancy (Create-bridged via biofactory) can be entered here as branching magic specialties — pick one and it shapes the adjacent playstyle.

**Tier 3 — Create electrical + diesel:** CreateAddition (FE bridge), Create Diesel Generators (combustion engines, oil chunks). Petrol Park content unlocks oil refining. Tinkers' Construct alloying via Create blaze burners (tgears).

**Tier 4 — Logistics endgame:** Create: Steam 'n' Rails (logistics network), Hypertube, Power Loaders (chunkloading), Vibrant Vaults (storage). Tom's Storage / Storage Drawers as warehouse layer. CreateContraptionTerminals for remote control.

**Magic branches** (chosen, not necessarily sequenced):
- **Botania** — mana network → flower-driven crafting → endgame items. Sits *alongside* the agriculture stack (Dynamic Trees, AgriCraft, FD crops) thematically; not bridged into Create.
- **Biomancy** — flesh automation → modular weaponry → bulk processing via `biofactory`'s Create bridge. Sits *adjacent* to Create rather than parallel; can feed Biomancy outputs into Create logistics.

**No definitive endgame.** No Mekanism reactor, no AE2 ME network, no boss-driven completion. The "endgame" is whatever automation the player decides to build.

---

## 5. Performance profile

**Optimization stack is comprehensive:**
- Server tick: `canary` — POI mixin **re-enabled 2026-06-11** (`mixin.ai.poi=true`) with the VS suite removal; villager-scan optimizations restored. It was disabled 2026-05-19 for a hard boot crash against VS's `MixinPOIManager` (both targeted `PoiManager.getInRange`; Canary's merge eliminated the INVOKE target VS's `@WrapOperation` needed). **Must go back to `false` if the VS optional module returns.** Chunk-tickets mixin remains off (pre-existing).
- Rendering: `embeddium` + `immediatelyfast` + `entityculling` + `lighty` + `sodiumdynamiclights`
- Memory: `ferritecore`
- Bug fixes: `modernfix` (also catches third-party correctness issues)
- Misc: `saturn`

**Observed numbers (2026-04-24, Intel Iris Xe iGPU):**
- Menu→ingame: ~100–130 s (variance)
- Total launch: ~170–205 s
- World-entry tick stall: 2–6 s typical, 14 s worst-case in one outlier
- EMI bake: 2–3 s
- Total recipe count indexed by EMI: ~45,500

**Embeddium currently tainted** by `sodiumoptionsapi` modifying `SodiumOptionsGUI`. Unsupported for issue triage but stable in observation.

**Hardware target**: anything roughly Iris Xe iGPU class or better runs cleanly. The pack is not lightweight (183 mods) but optimization keeps it serviceable on integrated graphics.

---

## 6. Documented design decisions

(See referenced memory/doc files for canonical statements.)

- **Chocolate-bar tiering** — `forge:bars/chocolate` = Create bar + compatdelight milk bar only. Dark chocolate and blazing chocolate are kept in their own lanes deliberately. Mirrored across `compatdelight:chocolate` and `supplementaries:chocolate_bars`. (`memory/project_novus_chocolate_tiering.md`)
- **Rope canonicalization** — `supplementaries:rope` is the canonical rope item; FD's rope is a 1:1 cosmetic conversion. (`kubejs/server_scripts/rope_*.js`)
- **Plant oil canonical source** — Create Diesel Generators is the only `forge:plantoil` source; CreateAddition's seed_oil compacting recipe was removed as redundant. (`kubejs/server_scripts/seed_oil.js`)
- **Matrix Enchanter explicit unlock** — Quark's auto-convert disabled; player crafts the Matrix Enchanter explicitly via a defined recipe. (`kubejs/server_scripts/matrix_enchanting.js`)
- **CMYK dye mixing** — additional subtractive dye-mixing crafting recipes added. (`kubejs/server_scripts/cmyk_dye_mixing.js`)
- **EMI as primary recipe viewer** — JEI is bundled inside TMRV but never the front-end. JEI plugins register through TMRV.
- **Biomancy Modonomicon integration** — left in place even though biomancy ships no book content; modonomicon mod itself was removed from the pack since adding it produced no visible effect.
- **Canary POI mixin toggle tracks VS presence** — disabled 2026-05-19 for the VS suite (priority-swap not viable: Canary's mixin priority isn't user-configurable and it merges the target method's bytecode regardless of order); re-enabled 2026-06-11 when the suite was set aside. The toggle is the supported path and must flip back if the VS optional module returns.

For full per-patch detail, see `PATCHES.md`.

---

## 7. Maintenance posture

**Brittle update points (high churn risk):**

- **Create** version bumps. `tgears` ships per-Create-patch jars (filename includes `for-create-6.0.8`). `create_enchantment_industry` similarly version-pinned. Bumping Create requires verifying compatible builds of both before pulling.
- **Tinkers' Construct** version bumps. `tgears` mixin targets TC internals (`MelterBlockEntity`, `AlloyerBlockEntity`); refactor risk on TC updates.
- **FarmersDelight** version bumps. Local `place_feast` advancement override may go stale; FD rope recipe override may need refreshing.
- **Biomancy** version bumps. EMI `biomancy:withdrawal` schema has changed before — pinned sidebar entries may break again.
- **JEI** under TMRV. The bundled JEI version is `15.20.0.129`. If a third-party mod ships compat for newer JEI, mismatch risk.

**Stable update points:**

- All decoration mods (Macaw's, Supplementaries, ceramics, etc.). Block-only mods rarely break across minor versions.
- Performance mods. ModernFix in particular is conservative.
- Library mods. Forge-tracked deps don't typically break minor.

**Open known issues (carryover, not fixed):**

- `moreburners` and `pipeorgans` mixin configs lack `minVersion` (upstream loose mixin configs).
- `HammerLib` ships a test class registered as a recipe extension (upstream debug fixture).
- `farmersdelight:cake_from_milk_bottle` advancement parse error (cosmetic; Quark removes the advancement).
- `jeresources` villager + wandering trader registration NPE (cosmetic; loses two JER entries).
- `petrolpark` JEI mixin compat broken under TMRV (silent loss of JEI integration).
- `createarmory:rpg_rocket` and `petrolsparts:block/chain_link` model-not-found warnings (validate in-game before action — known false-positive class per pack convention).

---

## 8. Gap analysis (preview for recommendations)

Underserved or absent domains, in rough priority order for a recommendations pass:

1. **Combat depth.** Only `dummmmmmy` (training) and `createarmory` (themed weapons). No new weapon tiers, no enemy variety, no mob combat overhauls.
2. **Mob diversity.** No Alex's Mobs, no Born in Chaos, no biome-specific creature mods. The pack's worldspace can feel sparse outside structures.
3. **Bosses / endgame antagonists.** Nothing targets late-game progression with a goal beyond automation.
4. **Quests / progression direction.** No FTB Quests, Heracles, or similar guidance layer. New players have no signpost from "I crafted a stove" to "I should look at Botania next."
5. **Aquatic content.** Vanilla aquatic survives largely untouched. Upgrade Aquatic, Aquaculture, etc. unrepresented.
6. **Nether / End enrichment.** No Better Nether, Endrem, or similar dimension content beyond vanilla + repurposed structures.
7. **Backups.** `ftbbackups2` previously appeared in test instance but not in dev; backup story is unclear.
8. **Server-friendly playstyle add-ons.** If multiplayer is on the roadmap, Argonauts, Curios networking, and similar may be needed.

These are fed into `MOD_RECOMMENDATIONS.md` as the basis for the candidate search.

---

## 9. References

- `PATCHES.md` — per-mod patch registry (in this same project folder)
- `memory/MEMORY.md` — index of project memories (in Claude memory store)
- `memory/project_novus_chocolate_tiering.md` — chocolate design decisions
- `memory/project_novus_patches.md` — patches summary
- `memory/feedback_false_positive_log_warnings.md` — log-noise conventions
