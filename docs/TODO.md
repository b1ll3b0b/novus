# Novus — Outstanding Issues / To-Do

Running backlog of known bugs and pending work for the Novus pack. Each item should carry enough context (root cause, impact, fix options) to be actioned without re-investigating. Move completed items to a struck-through "Done" note or delete once shipped. Patches already in place live in `PATCHES.md`, not here.

---

## Open

### Antique Atlas — teleport-destination gateways don't auto-mark (dev instance)
- **Status:** Open · low priority · diagnosed + confirmed in-game 2026-06-14. Dev-instance only (antique-atlas / surveyor / immersive_gateways aren't in the main build).
- **Symptom:** Stepping through an Immersive Gateway marks the *source* gateway on the atlas but not the *destination* you arrive at. The marker appears after you leave render distance and return (confirmed).
- **Root cause (verified by jar inspection):** Antique Atlas reads **Surveyor**, not its own detector. Surveyor records a structure into the world summary when vanilla `StructureStart.placeInChunk` runs (`MixinStructureStart`), and reveals it to a player only when the chunk holding it is streamed to that client (`MixinThreadedAnvilChunkStorage.sendChunkDataPackets` → `addStructure`). Immersive Gateways' `PortalDataManager` **synthesizes the destination structure on the fly at teleport time** (`Structure.generate` → `placeInChunk` per chunk). The world summary gets it, but the per-player push is missed — the destination chunks reach the client at/before the tick the structure is written, so `addStructure` runs against a chunk with no structure recorded yet. A later chunk re-send (relog / leave+return) replays the hook → marker appears. Source gateways are fine because they're found through ordinary worldgen + walking. The custom marker pack (`atlas_pack`, shipped via `kubejs/assets`) is correct and not at fault — all 25 IG pieces map to the gateway icon.
- **Workaround (current):** leave render distance and come back; the destination marker then appears.
- **Fix options:**
  1. **Accept + document** the workaround (cheapest; it's a cosmetic auto-mark delay).
  2. **KubeJS server hook** to replay the missed per-player push after a long-range teleport — scan structure starts in nearby chunks and call `SurveyorExploration.of(player).addStructure(...)` + `updateClientForAddStructure(...)`. A first attempt (`gateway_atlas_marker_fix.js`, 2026-06-14) was **broken in-game and removed** — KubeJS/Rhino interop or `PlayerEvents.tick` usage, not the Surveyor API (all Surveyor names/signatures were verified against `surveyor-1.2.4` class files: `WorldSummary.of(Level)`→`.structures()`, `WorldStructures.of(Level)`, `SurveyorExploration.of(ServerPlayer)`, `addStructure(worldKey, structKey, chunkPos)`, `updateClientForAddStructure(summary, structKey, chunkPos)`, `exploredStructure(...)`). If revisited, debug the Rhino side (event name, Optional/iterator/bean access) — keep verified Surveyor calls.
  3. Report upstream to Immersive Gateways (placement ordering vs. Surveyor) — out of pack scope.

### Lost Cities — add to pack (scoped for 1.1.1)
- **Status (final 2026-06-15):** ADDED, DONE. **Client/singleplayer: LC off by default** (`selectedProfile=""`, no overworld force) — players opt into `novus` via the LC world-creation menu (which is hardcoded to "Disabled"; no config can change that default — decompiled). **Dedicated server: `novus` forced on** via the `_server_deploy` overlay, which `build.sh` now applies to the `--release` server zip (`config/lostcities/common.toml` force + season balance + sleep gamerule); `_server_deploy` is `SHIP_DENYLIST`'d so it never reaches the client. Side flag `both`. Mentioned on the README. **Remaining open:** only Hurdle 2 (Create track in subways) — deferred per option (d) below.
- **Mandate check (historical):** prior stance kept vanilla worldgen fully selectable and ran LC dimension-only (`lostcities:lostcity=biosphere`). Superseded 2026-06-15 by the overworld-default decision above; `novus` is `landscapeType: default` so vanilla biomes/terrain layout are unchanged.
- **Hurdle 1 — disable dimension:** controlled by the `dimensionsWithProfiles` config. Remove the `lostcities:lostcity` mapping to stop dimension gen; to fully remove the dimension, override `data/lostcities/dimension/lostcity.json` via a higher-priority datapack. ⚠️ Mapping `minecraft:overworld=<profile>` instead = **global injection** (every overworld becomes/contains cities) → breaks the mandate unless shipped as a **packwiz-optional module** (vanilla default; LC-overworld opt-in), mirroring the BOP/BYG/VS-optional precedent. LC 7.x registers no selectable MC world-type in this build (checked — no `world_preset`).
- **Hurdle 2 — Create track in subways:** rails are an isolated, overridable palette (`palettes/rails.json` → `minecraft:rail`/`powered_rail`; all subway parts use `"refpalette": "rails"`). BUT `create:track` is **not** a drop-in swap (verified vs Create 6.0.8): track is graph-based — `TrackBlockEntity` + `BezierConnection` (serialized to NBT), built via `TrackPropagator.connectNodes`. LC places raw blockstates via worldgen (no BE/graph). Plus a geometry mismatch — rail packs 90° curves/slopes into 1 block; Create uses multi-block beziers/ramps — so the subway **part set would need redesign**. Functional auto track = custom compat-mod + Create-geometry part pack; not config/KubeJS-only.
- **Prior art:** NO published pack integrates Create track into LC subways — Technomagical Apocalypse, DeceasedCraft, ZombieCraft, ChaosZPack all run vanilla-rail subways + player-built Create trains. The procedural-functional-Create-track problem **is** solved standalone by **Railways Untold** (1.20.1 Forge; generates its own network w/ stations, not LC subways; currently **beta + ARR**, author says GPL/open-source on release). NB: Railways Untold already referenced in glue-mod candidate #1 (anvil-on-contraption) below.
- **Options for 1.1.1:** (a) ship LC **dimension-only** — mandate-safe, zero custom work; (b) palette/part override to **clear subway tunnels** for player-laid Create track — low effort, gets rideable subways; (c) decorative rail swap (non-functional); (d) functional auto Create track = mod-dev project, defer long-term, Railways Untold as reference once open-source.
- **Next step:** decide generation mode (dimension-only vs optional overworld module) + rails approach; if adding, check dependency graph + 1.20.1 Forge libs and log the license (LC modpack policy is permissive).

### Farmer's Respite — unregistered loot function + advancement trigger
- **Status:** Open · diagnosed 2026-06-04 (from server log review)
- **Mod:** `farmersrespite-1.20.1-2.1.2.jar` (displayName version `1.20.1-2.1`)
- **Symptoms (server log, non-fatal — no crash):**
  - `Couldn't parse element loot_tables:farmersrespite:blocks/kettle` → `Unknown type 'farmersrespite:copy_meal'`
  - `Invalid criterion trigger: farmersrespite:stunt_tea_bush` (advancement `farmersrespite:main/stunt_tea_bush` dropped)
- **Root cause:** Upstream registration gap. The jar ships the classes (`FRCopyMealFunction` + its `$Serializer`, and `StuntTeaTrigger`) and the data files that reference them, but neither type is registered at runtime — the registry package has registrars for fluids/effects/items/etc. but no loot-function registrar. Not a Novus packaging fault.
- **Impact:**
  - Kettle, when broken, drops an empty kettle and loses its brewed contents/NBT. (Minor gameplay bug, the noticeable one.)
  - The "stunt tea bush" advancement never loads. (Cosmetic.)
- **Fix options:**
  1. Check for a newer Farmer's Respite build that registers the type / dependency fix.
  2. Local patch: KubeJS/datapack override of `data/farmersrespite/loot_tables/blocks/kettle.json` to use `farmersdelight:copy_meal` (FD registers it) instead of the unregistered `farmersrespite:copy_meal`, or fall back to `minecraft:copy_name` only. Stops the loot error and restores kettle drops. Log the patch in `PATCHES.md` if taken.
  3. (Optional) override or drop the `stunt_tea_bush` advancement to silence the second error.

### Mod wishlist — candidate jars to consider adding
- **Status:** Open · ongoing curation
- **Source:** `MOD_RECOMMENDATIONS.md` (2026-04-24) — curated survey of 28 source-available mod candidates across the 8 gaps from `SYNOPSIS.md`, each with a fit score (1–5) and license.
- **Note:** This is a wishlist to draw from, not a committed list — framed as "filter heavily" so the pack keeps its Create-anchored, decoration-rich, combat-light identity. Consult before pitching any new mod; respect the "less is more" curation phase.
- **Next step:** when adding from it, pick high-fit (4–5) entries one at a time and check the dependency graph / 1.20.1 Forge availability before committing.

### Entity-model animation (CEM/EMF authoring)
- **Status:** Open · tooling ready, art/authoring work ongoing
- **Build target:** EMF (Entity Model Features). Tooling in place: `refs/CEM_EMF_REFERENCE.md` (full OptiFine CEM + EMF spec) and `refs/jem_validator.py` (`python3 refs/jem_validator.py <file-or-folder>`; validated clean against all 211 Fresh Animations files). Fresh Animations v1.10.4 is the gold-standard reference for rigging/animation idioms.
- **Related initiative — FA decomposition** (started 2026-05-29, ongoing): break monolithic FreshAnimations into standalone per-entity `FA+<Mob>` packs so animations can be curated/toggled individually. FA stack stays topmost in Paxi load order.
- **Next step:** identify which entity model(s) to hand-animate next; author `.jem` + `_animations.jpm`, validate with `jem_validator.py`, slot into the FA stack.

### Glue-mod candidates — batch small Java-only fixes into one Novus companion mod
- **Status:** Open · 3 candidates logged — the "3+" revisit threshold is reached
- **Decision rule:** if KubeJS/CraftTweaker/data/config can solve it, do that first; only Java-level problems land here. Don't scaffold one-off mods — accumulate, then build one.
- **Candidates** (full technical sketches in `_archive/memory_snapshot/snapshot_part04.md`, block `project_novus_glue_mod_candidates`):
  1. **Anvil-on-contraption** (2026-05-09) — Create Connected registers workstation interactions but skips anvils; Railways Untold would fix it but hard-skips when Steam 'n' Rails is present. ~30-line mod: register `MenuBlockInteractionBehaviour(AnvilMenu::new, …)` for the 3 anvil blocks at FMLCommonSetup, soft-dep `create_connected`.
  2. **Bed-on-contraption + respawn binding** (2026-05-09) — sleep in beds on moving Create contraptions; salvaged concept from rejected Railways Untold (ARR license — reimplement, don't lift). Needs `MovingInteractionBehaviour` on all 16 beds + BedBlock mixin + SavedData respawn tracking; ~200–400 lines.
  3. **Matrix enchanter unique name in Jade** (2026-05-24) — Quark's `MatrixEnchantingTableBlock` reports vanilla "Enchanting Table" to Jade; lang override can't separate the shared key. ~5-line mixin overriding the name method to `Component.translatable(getDescriptionId())`; confirm exact method via decompile at build time.
- **Next step:** evaluate whether to scaffold the glue mod now that the list has critical mass.

### Valkyrien Skies suite removal — COMMITTED to dev 2026-06-12
- **Status:** Removed, boot-cycle verified (clean log review), committed as `8d947f3` plus config commits `cd86706`/`df27032`/`0aaec65` (Collective update checker off; shipped memory 2048/8192 no-pretouch; Embeddium compact vertex format off — deliberate artifact fix). Set-aside bundle + restore manifest: `optional_modules/valkyrien_skies/RESTORE.md`. Backups: `backups/vs-removal-2026-06-11/`. User running an update check before next deploy/release.
- **Note:** instance bundles its own packwiz at `tools/packwiz` (Linux x86-64) — use `./tools/packwiz refresh` after file edits; don't hand-edit index.toml. (Refresh run + verified stable 2026-06-12.)
- **Remaining:** (a) user smoke test — moot > worldgen > closeout + villager check with Canary POI mixin re-enabled; (b) confirm no world (esp. PebbleHost server) has assembled ships before this propagates to builds; (c) regen README credits (`tools/readme/build_readme_credits.py`) when committing; (d) optional-module design when revived — see RESTORE.md §"Making it optional" (Canary toggle is the blocker). Observation: Compendium shelf blurb still says "(Valkyrien Skies add-ons are intentionally absent.)" — true but now odd; tweak at next guide rebuild.
- Original scoping detail below (kept for reference):
- **Motivation:** **performance** (established — months of build/log experience; consistent with the GC investigation's root cause of old-gen fill from entity allocation) + mixin maintenance tax + multiplayer stability/grief worry before 1.0.5.
- **Stack composition (verified 2026-06-11 via git + jar inspection):** the add was commit `23b79d6` "Update - Ships" (2026-05-20). Exactly **three installed mods**: `valkyrienskies-120-2.4.11`, `clockwork-0.5.6`, `trackwork-1.20.1-1.2.4`. The "fourth component" is **Kelvin** (`kelvin-forge-1.20.1-0.5.0`) — JIJ inside the Clockwork jar, never separately installed, leaves automatically (as does JIJ `architectury-forge-9.1.12`, used by nothing else top-level). All three jars are **Forge-native builds** — Sinytra Connector is NOT part of this stack (it serves Antique Atlas / the Fabric map mods) and stays. SYNOPSIS §438 misattributes the VS suite to Connector; correct it during removal.
- **Gate — world compat:** assembled ships live in VS ship-space chunks; removal orphans them (builds lost). Server is live on PebbleHost — removal is clean only if no worlds (local or server) contain assembled ships. Check before, not after.
- **Removal checklist (dev only, backups first; no master/deploy):**
  1. `backups/vs-removal-<date>/` — copy `.pw.toml`s, `config/valkyrienskies/`, `trackwork-client.toml`, `canary.properties`, `config/defaultoptions/keybindings.txt`, `config/paxi/resourcepack_load_order.json`, affected kubejs files.
  2. Remove jars + metafiles: `valkyrien-skies`, `create-clockwork`, `trackwork`; `packwiz refresh`. Do NOT touch Connector / forgified-fabric-api.
  3. Configs: delete `config/valkyrienskies/` (incl. `clockwork/client.toml`), `trackwork-client.toml`.
  4. `canary.properties`: restore `mixin.ai.poi=true` (SYNOPSIS promises this on VS removal); leave `mixin.world.chunk_tickets=false` (pre-existing).
  5. KubeJS: delete `kubejs/assets/vs_clockwork/` entirely (triode model + `disc_wanderlust.png` texture); strip 2× `vs_clockwork:*` entries each from `data/c/tags/blocks|items/hidden_from_recipe_viewers.json`; delete `data/novus/recipes/charging/wanderlite_crystal.json`.
  6. Paxi (⚠ explicit-permission zone): remove `config/paxi/resourcepacks/Novus_DiscRedstone_VSClockwork.zip` + its loadOrder entry (line 11) — pack-owned disc-redstone family member, dead without `vs_clockwork`.
  7. Sound Physics Remastered: the Ships commit added 58 lines to `config/sound_physics_remastered/sound_rates.properties` — review and strip the VS/clockwork sound entries (don't wholesale revert; later edits may interleave).
  8. Keybinds: remove 4 VS/Clockwork lines from `config/defaultoptions/keybindings.txt` AND instance `options.txt` (V/C/G/L on dev; PgUp/PgDn/Home in the snapshot); re-sync DefaultOptions; regenerate keybind-layout doc (frees V, C, G, L — partially undoes the 2026-06-05 keybind-vs-nav layout).
  9. Guide book: rebuild Create Compendium (`build_create_compendium.py` references Clockwork/Trackwork) and redeploy output.
  10. Ledgers in same change: DECISIONS.md (move to Removed, with reason + revisit condition), SYNOPSIS.md (mod count, integration tables §118-125/§358-359, Canary note §393/§423, fix Connector §438), README credits regen (`tools/readme/build_readme_credits.py`).
  11. Smoke test: moot > worldgen > closeout, plus load a pre-removal test world WITHOUT ships to confirm clean migration; verify villager behavior with the Canary POI mixin restored.

### Quark corundum — per-color custom animations (all 9 colors)
- **Status:** Open · POC validated, awaiting art direction
- **Context:** Hybrid base + special-effect overlay + `.png.mcmeta` animation-strip approach confirmed working in-game (`Novus_QuarkCorundum_WhiteBlack_Special_v1.zip` POC, archived at `templates/crystal_3d/examples/`, NOT installed in `resourcepacks/`).
- **Scope:** expand from white+black to all 9 corundum colors, each with its own per-color creative effect (radial darkening, fleck overlay, gradient, etc.).
- **Next step:** decide per-color creative vision, then build one color at a time per the established per-stone iteration pattern.
