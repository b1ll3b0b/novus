# STYLE_GUIDE.md — Novus code and patch conventions

This is a rules-level reference for how Novus's patches, scripts, and pack-side data are written. It encodes the user's standing feedback (from `memory/feedback_*.md`) and patterns observed across the existing pack so future work stays consistent and avoids repeating known incidents.

**Audience**: future-me, future-Claude-session, or anyone else writing patches into this pack.

**Companion doc**: `VANILLA_REFERENCE.md` is the schema spec — what the parser will accept. This doc is the *style guide* — what Novus *should* write within that spec, given its history and the user's preferences. The two are designed to be read together: whenever this guide says "use the canonical form," it points at a specific section of `VANILLA_REFERENCE.md`.

**Authority**: rules grounded in `memory/feedback_*.md` are non-negotiable user-set rules. Rules grounded in `memory/reference_*.md` are factual constraints (parser limits, mod-API gotchas). Rules grounded in observed pack patterns are defaults — break them only with a reason.

## Table of contents

1. [Authority hierarchy](#1-authority-hierarchy)
2. [Datapack JSON conventions](#2-datapack-json-conventions)
3. [Defensive patterns](#3-defensive-patterns)
4. [KubeJS conventions](#4-kubejs-conventions)
5. [CraftTweaker conventions](#5-crafttweaker-conventions)
6. [Cross-tool decision tree](#6-cross-tool-decision-tree)
7. [Patches — the override system](#7-patches--the-override-system)
8. [Backups, snapshots, rollback](#8-backups-snapshots-rollback)
9. [Log triage](#9-log-triage)

---

## 1. Authority hierarchy

When a claim about a Minecraft schema, mod API, or runtime behavior conflicts between sources, the order of authority is **vanilla example files > parser source code (decompiled .class) > mod-shipped JSON > training knowledge**. Training-era memory of "how 1.16 advancements look" or "how 1.18 loot conditions are named" is the lowest-authority source — it is not safe to cite without grounding against one of the three above.

**Why:** The `place_feast` incident (recorded in `PATCHES.md` under FarmersDelight). FD ships a broken `place_feast.json` advancement; my first instinct was to declare "this `location` array is 1.18-style, the schema changed in 1.20." That assertion was wrong on inspection — `data/minecraft/advancements/husbandry/plant_seed.json` (vanilla 1.20.1) uses exactly the same `"location": [{ "block": "...", "condition": "minecraft:block_state_property" }]` shape, and FD's sister advancement `place_skillet` parses fine with that shape too. The bug was specific to FD's 5-criterion structure interaction, not the schema family. Asserting "wrong era" without comparing to a real vanilla file would have produced a "fix" that was no fix at all.

**How to apply:** Before declaring a JSON shape wrong, find a vanilla example that uses the same trigger/condition family. The canonical extraction lives at `/home/zonbi/Documents/Claude/Projects/Novus/refs/extracted/data/minecraft/`. If the shape matches a vanilla example and still fails to parse, the cause is something else — a sibling field, a registry miss, a parent advancement, or a Forge-specific deserializer. Don't shortcut through "this looks like the old format."

For mod APIs (CraftTweaker, KubeJS, Forge events), grounding goes through `unzip -p <jar> <class>.class | strings` or the mod's `META-INF/mods.toml`, not memory. The CraftTweaker gotchas memory at `feedback memory reference_crafttweaker_api_gotchas.md` codifies this — every "No such member" error has been resolved by reading the matching `Expand<Type>.class` file from the CrT jar.

### When to assert vs. when to verify

If a claim drives an action — a write, a recipe removal, a config edit, a "delete this" recommendation — verify first. If the claim is conversational ("I think Forge GLM has..."), it's fine to be tentative and verify on demand. The mistake to avoid is asserting confidently and then editing.

---

## 2. Datapack JSON conventions

### File paths

Datapack overrides for any third-party mod live under `kubejs/data/<namespace>/<system>/<path>`. The namespace is the **target mod's** ID, not `novus`. So an override of FD's `place_feast` advancement goes at `kubejs/data/farmersdelight/advancements/main/place_feast.json` — mirroring exactly the path inside FD's jar. Pack-local content (recipes the user wrote, novel loot tables) goes under the `novus` namespace at `kubejs/data/novus/...`.

Tag merges follow the same principle: to extend `forge:bars/chocolate`, the file is `kubejs/data/forge/tags/items/bars/chocolate.json`. The directory structure mirrors the destination tag's resource location.

### Naming and indentation

- Filenames: `snake_case`, lowercase. No spaces, no hyphens (vanilla is consistent on this).
- Directory names: `snake_case`, plural where the registry is plural (`recipes/`, `loot_tables/`, `advancements/`, `tags/items/`).
- Indentation: 2 spaces. Vanilla MC and Forge data both use 2-space indent. Some existing files in the pack use 4-space (FD's `place_feast` patch) or tabs (`miners_delight` loot modifier overrides) — that's tolerable since JSON parsers don't care, but new files should default to 2-space to match vanilla style.
- Trailing newline at end of file. Editors do this by default; don't fight it.

### Key order

Match vanilla's order when authoring. Vanilla `plant_seed.json` orders top-level keys as `parent, criteria, display, requirements, sends_telemetry_event`. Inside a criterion it's `trigger` then `conditions`. The `place_feast` patch in this pack follows this order. Don't reorder for personal preference — diffs against upstream become unreadable.

### Schema-correctness checklist

Before shipping a datapack JSON, walk the checklist:

1. **Does every block/item ID referenced exist in the loaded modset?** Run `grep -r "<id>" novus_dev/minecraft/mods/` over the jars, or check JEI/EMI in-game. The dttconstruct slime-fruit stubs (`PATCHES.md`) exist precisely because the mod's jar shipped loot tables for blocks it never registered — the loader bombed each load until we replaced them with empty stubs.
2. **Does the predicate shape match a vanilla example?** Find the closest vanilla file using the same trigger; diff structure. If the vanilla file uses `{"block": "id", "condition": "..."}` and your override uses `{"block": {"blocks": ["id"]}}`, one of them is canonical and the other is a Forge/mod extension — verify which the parser expects.
3. **Tags: `replace: false` unless you mean to wipe.** Default to additive merges (`forge:tags/items/bars/chocolate.json` adds `compatdelight:milk_chocolate_bar` with `replace: false`). The `forge:stoves` patch (`PATCHES.md`) uses `replace: true` deliberately — to evict an unsatisfiable hard-required entry — and that's the exception that proves the rule.
4. **Optional vs required tag entries:** `{ "id": "modid:thing", "required": false }` is the shape for entries that may not exist in the current modset. Plain string entries are required. Mixing them in one file is fine; the FD stoves patch does this.

### Parser silence vs. verbosity

When a datapack JSON is malformed, MC's parser is **selectively** verbose. Some classes of error log loudly, others fail silently:

- Malformed top-level recipe / advancement JSON → loud error in `latest.log` with file path.
- Malformed *nested* predicate (e.g. a wrong `location` field inside a `placed_block` trigger) → "Failed to parse condition for criterion X" — and the rest of the advancement is dropped silently, often cascading into "advancement Y failed because parent X is missing."
- Tag entry referencing a nonexistent ID with `required: true` → loud error; tag fails to load.
- Tag entry referencing a nonexistent ID with `required: false` → silently skipped.
- GLM modifier with unknown serializer type → warning ("Unknown registry key in `forge:global_loot_modifier_serializers`"), modifier silently does nothing.
- Loot table with unknown loot function → silent drop of that function in that pool, table otherwise loads.

The lesson: a clean log is not proof of a working file. Verify in-game (the item drops, the advancement triggers, the tag membership tests true).

---

## 3. Defensive patterns

### Verify ID existence before referencing

Before writing any JSON or script that references `modid:thing`, confirm the ID is real in the current modset. Two cheap checks:

- `grep -rl "thing" $DEV/minecraft/mods/*.jar` (works on any text-bearing entry — recipes, lang, registry strings).
- In-game: F3+H (advanced tooltips) shows the registry ID on hover; or search EMI.

The dttconstruct stubs exist because somebody — not us — referenced `dttconstruct:blood_slime_fruit` etc. without checking; the block was never registered, and Forge has been bombing each world load for months until we shipped empty stubs (per `PATCHES.md`).

### Required vs. optional fields

When patching a tag that may or may not have its target installed, prefer optional. Standard form:

```json
{
  "replace": false,
  "values": [
    { "id": "modid:thing", "required": false }
  ]
}
```

`required: false` makes the file resilient to mod removal — if the user ever uninstalls `modid`, the tag still loads instead of erroring. Only use `required: true` (the implicit default for plain string entries) when the target mod is a hard dependency of this pack — i.e. it's not going away.

### Version-skew gotchas

The big one in 1.20.1 land is the loot-condition rename:

- `minecraft:alternative` (1.18-era) → `minecraft:any_of` (1.20.1).

Any modded loot file still using `minecraft:alternative` will silently fail to load in 1.20.1. Two patches in this pack exist for exactly this reason: `miners_delight/loot_modifiers/scavenging_*.json` and the `dttconstruct/loot_tables/blocks/*_slime_leaves.json` set (per `PATCHES.md`).

When auditing a third-party mod's JSON files, search them for legacy condition names: `unzip -p <jar.jar> '*.json' | grep -E '"alternative"|"alternatives"'`. Other lurking renames in 1.20.1 to be aware of:

- `minecraft:entity_scores` → still valid but the predicate shape changed (now expects `entity` + `scores` map, not the older flat `objective` + `value`).
- Forge `forge:and` / `forge:or` recipe conditions still work; advancement conditions don't have `forge:and` — that confusion has caused several "why doesn't my recipe condition work" loops.

### Parse error decoding

When you see a parse error in `latest.log`, the error message often points at the *outermost* field, not the actual culprit. Specifically, "Failed to parse 'location' field" is *usually* a problem with the predicate inside `location`, not the field itself. Standard decode procedure:

1. Read the failing JSON file end-to-end.
2. Find the named field. If it's an array of predicates (e.g. `"location": [...]`), focus on the array contents.
3. Compare each predicate to the closest vanilla example.
4. If `entity_properties` is involved, double-check that `entity: "this"` predicates are valid for the trigger context (they're rejected in some contexts — branch loot, GLM-injected sub-tables — per the DT loot-context memory at `reference_dt_loot_context.md`).

### Don't re-introduce known recursion patterns

The `moonlight:add_loot_table` GLM is recursion-unsafe on entity loot (per memory `feedback_glm_add_loot_table_recursion.md`). Decision tree for new loot work:

- KubeJS `ServerEvents.entityLootTables` → first choice. Doesn't fire `ForgeHooks.modifyLoot`, no recursion path.
- `mantle:add_entry` → recursion-safe GLM fallback.
- `moonlight:add_item` → recursion-safe but no loot functions (e.g. no `supplementaries:random_arrows` rolling).
- `moonlight:add_loot_table` → **never** for entity loot. Not even with conditions; the conditions don't break recursion because `getQueriedLootTableId()` is sticky for the entire `LootContext` lifetime.

---

## 4. KubeJS conventions

### Folder layout (1.20.1)

```
kubejs/
  startup_scripts/   # Run inside FMLModContainer.constructMod — MOD CONSTRUCTION phase.
                     # Registry events go here. CANNOT touch RegistryObjects yet.
  server_scripts/    # Run on world load + reload. Recipes, tags, loot, server events.
  client_scripts/    # Run client-side. JEI, REI, Jade, painters, asset generation.
  data/              # Virtual datapack — drop JSON files here, mirroring data/<ns>/<path>.
  assets/            # Virtual resource pack — drop assets the same way.
  config/            # KubeJS's own configuration (web console, debug toggles).
```

Phase mismatch is a real bug class (per the CrT API gotchas memory): putting a `Java.loadClass(...)` call at the **top level** of a startup script triggers the target class's `<clinit>` during `KubeJS.<init>`, which runs inside `FMLModContainer.constructMod`. That's BEFORE `RegisterEvent` fires for vanilla registries. If the loaded class touches a `RegistryObject` in its initializer, you get an `ExceptionInInitializerError`, the class permanently lands in `INITIALIZATION_FAILED` state for the JVM, the script-load exception escapes `constructMod`, and Forge skips `FMLClientSetupEvent` for the entire game. This took down SodiumDynamicLights mid-investigation 2026-04-27.

**Rule:** all `Java.loadClass`, `Java.type`, and any other top-level action that may force a third-party class's `<clinit>` goes inside `StartupEvents.postInit(event => { ... })`. postInit fires at `FMLLoadCompleteEvent` — by then registries are populated and most class-init fragility is past. Wrap the body in a try/catch as a second line of defense; an uncaught throw still escapes if you don't.

### Event API patterns

The pack's existing scripts use a consistent shape: top-of-file comment block describing what / why / drop economy / migration notes; then a single `<X>Events.<event>(event => { ... })` callback. Look at `quiver_drop.js` as the gold standard — comment block covers the GLM-vs-event decision, the drop math, the design rationale; the script body is short and clean. Match this style for new server scripts.

Common event handlers in active use:

- `ServerEvents.recipes(event => ...)` — `event.shaped`, `event.shapeless`, `event.smelting`, `event.custom({ type: '...', ...})`, `event.remove({ id|output|type: ... })`.
- `ServerEvents.entityLootTables(event => ...)` — `event.modifyEntity(id, table => table.addPool(pool => ...))`.
- `ServerEvents.tags('item', event => ...)` — `event.add('tag_id', 'item_id')` / `.remove`.
- `ItemEvents.tooltip(event => ...)` — `event.add(item, [Text.of(...)])`.
- `BlockEvents.broken(event => ...)`, `BlockEvents.placed(event => ...)` — gameplay reactivity.

### Recipe ID convention

Pack-authored recipes get `novus:<descriptive_name>` IDs. The `_from_bar` / `_from_seed` style suffix in `chocolate_bar_alternates.js` (`novus:chocolate_pie_from_bar`) is established convention — descriptive of the variant relative to the canonical. Single-output, single-context recipes can omit the suffix.

For removals, prefer `event.remove({ id: '...' })` over `event.remove({ output: '...' })` when a specific recipe is the target. Output-removes wipe every recipe producing that item, which is the desired behavior for the rope unification (`event.remove({ output: 'farmersdelight:rope' })` in `rope_recipes.js`) but undesirable when a single redundant recipe is the goal.

### KubeJS shadows mod data; doesn't merge

KubeJS's `kubejs/data/` folder is a virtual datapack, loaded after the mod-shipped datapacks (well, after most of them — see `scripting-tools-catalog.md` "Datapack JSON is virtual but not authoritative" footnote). For any single file, the virtual datapack version replaces the jar version wholesale. There's no automatic key-level merge for JSON. If you want to *add* to a tag that the mod already populated, use `replace: false` — this is the file-level merge mechanism, not a key-level one.

### Reload semantics

- `ServerEvents.recipes`, `tags`, `entityLootTables`, etc. — reloaded by `/reload`.
- Event handlers (`BlockEvents`, `ItemEvents`, etc.) — reloaded by `/kubejs reload server_scripts`.
- `StartupEvents.registry` — **requires full game restart**. Cannot be reloaded; the registry is locked after init.
- EMI hide tags (`c:hidden_from_recipe_viewers`) — written by `/reload`, but EMI rebuilds its hidden-stack list on **world join**, so you must quit-to-title and re-enter the world before the hide takes effect (per memory `reference_emi_hide_items.md`).

### Pack-specific KubeJS standing rules

- **`JEIEvents.hideItems` is inert in this pack.** No actual JEI is installed; TooManyRecipeViewers ships a stub plugin but doesn't bridge JEI hides into EMI's stack list. Despite this, `client_scripts/powah_tier_emi_hide.js` keeps the call as documented intent — it costs nothing and survives a future JEI install.
- **The actionable EMI-hide path is the `c:hidden_from_recipe_viewers` tag** at `kubejs/data/c/tags/items/hidden_from_recipe_viewers.json` (and the parallel `blocks/` file). This is the convention tag EMI 1.1.22 reads. Pair with `ServerEvents.recipes` event.remove for full lockdown — the Powah tier-lock is the canonical pattern (per memory `reference_emi_hide_items.md`).
- **Rhino + try/block + const = redeclaration error.** Inside any `try` block in a startup script, use `var` for every binding. `const` and `let` inside `try` trip Rhino's lowering into a "redeclaration of var" error on first run. (Per CrT/KubeJS gotchas memory.)
- **`function` declarations don't hoist out of `try` blocks** in Rhino. If a forEach lambda inside the try refers to a function declared above it inside the same try, the lambda sees `undefined`. Workarounds: hoist the function declaration above the try, or use `var name = function () { ... }` form.

---

## 5. CraftTweaker conventions

### When ZS wins over KubeJS

CraftTweaker stays installed in this pack despite KubeJS's broader coverage because of two specific gaps:

1. **Forge event subscription via `events.register<EventClass>(...)`** — KubeJS exposes ~40 curated wrappers; Forge's event bus has hundreds. `deepslate_generator_forge.zs` uses this for `FluidPlaceBlockEvent`, which has no KubeJS equivalent.
2. **Mod-specific scripting APIs published as `mods.<modid>.<X>`** — `initial_inventory.zs` uses `mods.initialinventory.InvHandler.addStartingItem(...)`. There's no KubeJS bridge to InitialInventory.

Anything else — recipes, tags, loot, item modifications — should default to KubeJS in this pack. Don't migrate KubeJS to CT just because CT *can* do it (per memory `project_novus_kubejs_vs_crafttweaker.md`). Equally, don't migrate CT scripts to KubeJS even if KubeJS could *almost* do the same thing — the two ZS scripts in the pack are there because they're the only paths.

### Signature discovery via jar inspection

Before writing CT against a wrapped MC type, verify the actual signature. Procedure (codified in memory `reference_crafttweaker_api_gotchas.md`):

```
unzip -p CraftTweaker-forge-1.20.1-14.0.60.jar \
  com/blamejared/crafttweaker/natives/world/ExpandLevel.class \
  | strings | grep -E 'Getter|Setter|Method'
```

The bytecode strings show what getters and setters CrT exposes, with their actual return types. This is faster than guessing or trawling docs, and it's the only authoritative source for CrT's idiomatic-vs-raw API.

For mod-specific APIs, check whether the mod even exposes a ZenScript surface:

```
unzip -p <mod.jar> '*.class' | grep -l 'ZenRegister\|ZenCodeType'
```

Empty result = no ZS surface = CT port is dead on arrival. The 2026-04-27 cradle-fluid-tributes investigation tried to port a KubeJS script to CT for "cleaner" syntax, and discovered biomancy ships zero ZenRegister bindings — only KubeJS-Rhino's `Java.loadClass` could reach the API. The KubeJS path was the right answer all along.

### Import patterns

```
import crafttweaker.api.<X>;                                  // CrT-native types
import crafttweaker.forge.api.event.<package>.<EventClass>;   // Forge events
import mods.<modid>.<api>;                                    // Mod ZenScript APIs
```

ZenScript `import` only resolves `@ZenRegister`-tagged classes — not arbitrary JVM classpath. Even raw vanilla `import net.minecraft.resources.ResourceLocation` fails because CrT exposes `ResourceLocation` via the `<resource:foo:bar>` bracket handler under its own type namespace. The diagnostic when you see "Could not find type" at an import line: the FQCN is wrong, or the target has no ZS bindings.

### The `level.dimension` gotcha

`level.dimension` in CrT 1.20.1 returns `ResourceLocation` directly — not `ResourceKey<Level>`. Compare against `<resource:minecraft:overworld>` directly:

```
if (level.dimension != <resource:minecraft:overworld>) { ... }
```

Writing `level.dimension.location()` errors with `No such member: location` because `ResourceLocation` has no such getter. Verified by inspecting `com/blamejared/crafttweaker/natives/world/ExpandLevel.class` — the getter signature is `(Level)Lnet/minecraft/resources/ResourceLocation`. Per memory `reference_crafttweaker_api_gotchas.md`. CrT pre-unwraps many Mojang types like this, so don't reach for `.location()`/`.value()`/etc. on the result of a CrT getter without checking the wrapper first.

### `is null` is invalid

ZenScript's `is` operator is a type-check. `if (foo is null)` errors because `null` is not a type — the parser halts and the entire script file fails to load. Use `== null` / `!= null`.

### File-mode declarations

`#modloader forge` at the top of a `.zs` file restricts script execution to Forge. Used in `deepslate_generator_forge.zs` because the event class lives in the Forge-only namespace `crafttweaker.forge.api.event`. Same script split into a `_common.zs` (loader-agnostic helpers) + `_forge.zs` (event subscription) is the canonical pattern when the script is partly cross-platform.

---

## 6. Cross-tool decision tree

The full decision tree lives in `scripting-tools-catalog.md` (read it first for any nontrivial scripting work — covers KubeJS / CraftTweaker / raw JSON / Forge GLM coverage with the recipe/loot/tag/event/registry capability matrix). This section adds the pack-specific anti-patterns and quick-pick rules learned from incidents, but does not duplicate the catalog.

### Quick-pick rules (Novus context)

- **Recipes (vanilla, Create, FD, common modded):** KubeJS `ServerEvents.recipes`. CT only if you specifically want imperative-style recipe management — but no CT addons are installed, so most modded recipe types route through KubeJS auto-schemas anyway.
- **Entity loot drops:** KubeJS `ServerEvents.entityLootTables` only. Never Forge GLMs targeting entity tables.
- **Other loot tables (chest, fishing, gift):** KubeJS first; `mantle:add_entry` GLM if you want declarative JSON instead.
- **Tags (additive merge):** raw JSON in `kubejs/data/<ns>/tags/...` for static merges; `ServerEvents.tags` for computed/conditional merges. The chocolate-bar tag set uses raw JSON; nothing in the pack currently uses the script form.
- **Forge events not exposed by KubeJS:** CraftTweaker `events.register<...>`. Confirmed safe pattern: `FluidPlaceBlockEvent` for the deepslate generator.
- **Mod scripting APIs as `mods.<modid>.<X>`:** CraftTweaker. Currently only `mods.initialinventory.*` is in active use.
- **New items / blocks / fluids / tool tiers:** KubeJS `StartupEvents.registry`. CT cannot create registry entries.
- **Asset overrides (textures, models, lang):** `kubejs/assets/<ns>/...` — no scripting needed. Note Paxi is off-limits for arbitrary asset packs (see Section 7).
- **EMI hides:** `c:hidden_from_recipe_viewers` tag in `kubejs/data/c/tags/{items,blocks}/`. `JEIEvents.hideItems` is inert. Pair with recipe removal.
- **Worldgen JSON (biomes, structures, density functions):** raw datapack JSON in `kubejs/data/<ns>/worldgen/...`. No scripting wrapper.

### Anti-patterns observed

- **Don't migrate CT scripts to KubeJS** "because KubeJS is the cornerstone." The two ZS files are there for capabilities KubeJS lacks, full stop. Moving them produces non-equivalent behavior or doesn't compile (per memory `project_novus_kubejs_vs_crafttweaker.md`).
- **Don't use `moonlight:add_loot_table` on entity loot** — recursion. Document covered in Section 3.
- **Don't `Java.loadClass` at the top level of a startup script** — covered in Section 4.
- **Don't add to `c:hidden_from_recipe_viewers` without also removing the craft.** EMI hides hide the icon; they don't gate crafting. Visible-in-EMI-but-craftable is a worse state than invisible-in-EMI-but-uncraftable. The Powah tier-lock pairs both intentionally.
- **Don't proactively add Cradle tributes** for "completeness" — fluid registrations are gameplay-driven, not theoretical (per memory `feedback_cradle_scope_gameplay_first.md`). If a fluid type isn't registered yet but isn't surfacing as a gameplay problem, leave it alone.
- **Don't propose brightness normalization** for Create's natural stone variants. Per memory `feedback_variation_pack_no_brightness_normalize.md` — the user has judged the trade-off, constant-offset shifts wash out speckles.

---

## 7. Patches — the override system

This section governs what goes in `kubejs/data/<modid>/...` (the override layer) and how to track it. It is a contract: every patch ships with a `PATCHES.md` entry, and `PATCHES.md` is the source-of-truth registry. If the patch isn't listed there, it doesn't exist as far as future-me is concerned.

### When to patch vs. when to script

- **Patch (`kubejs/data/<modid>/.../<file>.json`):** when you want to *override* a specific JSON the mod ships — a recipe, advancement, loot table, tag, GLM file, structure JSON. The patch wholesale replaces the jar's file; no key-level merging.
- **Script (`kubejs/server_scripts/<name>.js`):** when behavior is computed, conditional, multi-target, or needs Forge conditions that don't survive virtual-datapack overlay. The chocolate bar alternates are scripts because they're additive new recipes plus conditional removals. The slime-leaf seed drops are patches because they replace the jar's specific file.

A useful test: if your fix is "edit one JSON value in one file," it's almost always a patch. If your fix is "loop over N item IDs to do X," it's a script.

### `PATCHES.md` entry format (read it; follow it)

The existing `PATCHES.md` (at `/home/zonbi/Documents/Claude/Projects/Novus/PATCHES.md`) has a stable format that every entry must follow. Reading order: **quick index** (the table at the top) → **per-mod section** → **per-patch sub-entry**. Each sub-entry has these required parts:

- File path (`kubejs/data/<modid>/.../<file>.json` or `kubejs/server_scripts/<name>.js`).
- Authorship tag in italics: `*(Claude-session)*`, `*(Pre-existing)*`, or `*(YYYY-MM-DD)*`.
- **What:** the surface change in 1–2 sentences.
- **Why:** the upstream bug, design choice, or compat issue motivating the patch.
- **Patch shape:** the actual JSON or call signature, when small enough to inline.
- **On `<mod>` update — check:** the diff-against-new-jar workflow for staying current.
- **Reversion:** how to undo the patch cleanly. Optional but standard for high-risk patches.

When adding a patch, add the `PATCHES.md` entry in the same commit. The "Recommended update workflow" at the end of `PATCHES.md` describes the diff-against-new-jar pass; that pass works only if every patch is registered.

### Risk classes

The quick-index table lists each mod's patches with a "Risk if mod updates" rating:
- **Low** — additive merge tags, well-isolated overrides, decorative-only impact.
- **Medium** — recipe ID overrides, recipes that depend on specific tags, configs that the mod might rename keys for.
- **High** — overrides of vanilla advancement file paths, schema-dependent overrides where the mod restructuring breaks the patch silently.

Higher-risk patches should have a `grep latest.log` step in their "On update — check" subsection — silent failure mode is the worst class.

### Override scope: the user's reserved zones

- **Paxi is off-limits** without explicit permission (per memory `feedback_paxi_off_limits.md`). Don't write to `config/paxi/resourcepacks/` or `config/paxi/datapacks/`, don't edit `resourcepack_load_order.json`, don't surface "should this go in Paxi?" as a default suggestion. Standing exceptions are listed in the memory; the only one is `config/paxi/resourcepacks/AL+Azu_Zombies.zip`. New resource packs go to the regular `resourcepacks/` folder for the user to enable manually.
- **Don't call a mod "unused" without a dependency scan.** Library mods are silently load-bearing — `jsonthings` was almost-removed because there were no `kubejs/data/jsonthings/` overrides, but `tinkers_things` declares it `mandatory=true`. Per memory `feedback_check_dependency_graph.md`, the procedure is: scan all `mods.toml` files for declared deps + grep mod jars for code references. Only then is "unused" defensible.

---

## 8. Backups, snapshots, rollback

Always backup before non-trivial edits. This is a standing user rule (per memory `feedback_always_backup_before_edits.md`) — non-negotiable for config files, `.pw.toml`, `kubejs/data/*`, and any file the user has hand-touched.

### Backup locations and naming

The pack uses three named archive folders, each with its own role:

- **`Novus/backups/<context>_<YYYY-MM-DD>/`** — arbitrary file snapshots taken before a multi-file edit. The RoadWeaver graves disable patch (per `PATCHES.md`) snapshotted originals to `Novus/backups/roadweaver_graves_disable_2026-05-06/` before editing. The folder name describes what's being changed; the date disambiguates from prior sessions.
- **`Novus/backups/<relative-path>/<filename>.<YYYYMMDD-HHMM>.bak`** — single-file snapshots when changing one file. Use this form for repeated edits to the same file (the timestamp prevents overwrites).
- **`Novus/zombie_merge/<pack>_v1.X.zip`** — versioned snapshots for the AL+Azu zombie pack. Per memory `feedback_zombie_pack_versioned_snapshots.md`, every iteration is saved both as a **versioned** snapshot AND an **unversioned working copy** of the same content. The unversioned copy mirrors what's deployed; the versioned snapshots are the rollback breadcrumb trail.
- **`Novus/datapack_archive/`** — for migrated-pack archives. When converting a Paxi datapack to a `kubejs/data/` overlay, the original is archived here before deletion.

### Build flow for pack-level work (zombie pack pattern)

The standing flow for pack iterations:

1. Edit pack contents in source folder.
2. Rebuild the working zip (`AL+Azu_Zombies.zip` — unversioned).
3. Snapshot to versioned form (`AL+Azu_Zombies_v1.X.zip`).
4. Copy the unversioned working copy to its deployment location.

Both copies live in `Novus/zombie_merge/`. Versioned snapshots stay until the user signals the work is done; don't auto-clean them. This is the same pattern any future pack iteration should adopt — versioned snapshots in a project subfolder, working copy alongside, deployment via copy-to-destination.

### Migration deletes need archiving first

When migrating files between systems (Paxi → `kubejs/data/`, one mod's data → another's, etc.), archive the originals to `Novus/backups/` (or `Novus/datapack_archive/` if it's pack-level) BEFORE deleting them from the source location. The 2026-05-01 incident behind the backup memory came from migrating without archiving — the only surviving record was conversation context, which doesn't survive across sessions.

### What does NOT need a backup

Regenerable artifacts where the source is preserved. Build outputs from a script you wrote, derived files where rebuilding is trivial, anything explicitly listed as "build artifact" in the source. Don't waste backup-folder space on things you can regenerate from the user's authored source.

---

## 9. Log triage

`latest.log` for this pack is loud — 184 mods, ~5 perf mods, several modded interactions that legitimately warn at boot. The investigation discipline is to ground-truth every warning before declaring it actionable.

### Known-noise warnings (silent skip)

These are confirmed cosmetic by the user; do not propose fixes for them, do not surface them in maintenance-pass reports unless the user asks (per memories `feedback_false_positive_log_warnings.md` and `feedback_log_warnings_dont_fix.md`):

- `ModelBakery: Unable to load model 'minecraft:rocketitem' referenced from: createarmory:rpg_rocket#inventory` — custom renderer, no JSON.
- `ModelBakery: Unable to load model 'petrolsparts:block/chain_link' referenced from: petrolsparts:block/chain_link` — custom renderer, no JSON.
- `Couldn't load pack metadata` / `Missing pack_format` for any `VanillaTweaks_*.zip` — VT zips load and apply correctly despite the overlay-parse warning under `pack_format: 15`.
- `SoundEngine: Missing sound for event` for goat horn / amendment instruments — registered programmatically; second resource-reload pass populates them. Horns work in-game.

### Suspect-only classes (verify in-game first)

Don't flag without in-game confirmation:

- **`ModelBakery: Unable to load model ...`** — for ANY modid using custom renderers (block entity renderers, IUnbakedGeometry loaders, baked model providers). The JSON lookup misses, the rendering path runs anyway. Confirm in-game before declaring a real issue.
- **`SoundEngine: Missing sound for event ...`** — covered by the above; some mods register late.
- **"Missing texture in model"** for inventory views — modders often handle icons via baked overrides.

### Real-signal classes (act on these)

- `ResourceManager: Failed to load resource 'minecraft:advancements/...'` — advancement parse error. Real. Trace the named field per Section 3 parse-error decoding.
- `IllegalArgumentException: Can't find block <id>` — orphan loot table reference. Real (the dttconstruct slime-fruit set is exactly this).
- `Unknown registry key in forge:global_loot_modifier_serializers` — GLM type unknown. Real. The modifier silently does nothing; check what mod was supposed to provide the serializer.
- `NoClassDefFoundError`, `ExceptionInInitializerError` — class-init failure. Real. Often cascades into broader load failure (per the `Java.loadClass` cascade memory) — investigate immediately.
- `StackOverflowError` in loot context — almost always GLM recursion (per memory `feedback_glm_add_loot_table_recursion.md`). Identify the modifier; replace with a non-recursive form.

### Audio investigation order

When the user reports a strange ambient or cycling sound, **identify the entity first** (per memory `feedback_check_entities_before_audio_configs.md`). Hours were lost on 2026-05-01 chasing ParticleRain / SubtleEffects / Sound Physics Remastered configs when the sound was a guardian's beam attack. Procedure:

1. What does the sound actually sound like — instrumental, laser-like, droning, hissing, build-then-fire?
2. Does it correlate with proximity (water, caves, dim areas)?
3. Are there nearby entities that could be the source — guardian, ghast, warden, drowned, custom mod mob with looping ambient?

Use `/data get entity @e[type=<suspect>,sort=nearest,limit=1]` or F3 entity list to confirm. Only after entities are ruled out should attention move to weather/audio mod configs.

Specific guardian signature: ~3.5 s buildup, brief fire, ~2 s cooldown. With Sound Physics Remastered active, reverb adds an apparent "echo cycle" on top.

### Mods that AMPLIFY but don't CAUSE strange sounds

Don't reach for these as first hypothesis:

- Sound Physics Remastered — reverb / occlusion processing only.
- ParticleRain — only adds weather audio when `level.getRainLevel() > 0`. If the user reports a cyclic sound during clear weather, that immediately rules out ParticleRain.
- SubtleEffects — drip / splash sounds for specific events (and one known cycling rain-near-water bug per memory `reference_subtle_effects_drop_sounds.md`, which has a documented config fix: `dropLandSoundVolume=0`).

### Triage workflow summary

1. **Read the timestamp.** Boot warnings vs. play-session warnings are different beasts.
2. **Classify by message family.** Match against the known-noise list above; skip if it's there.
3. **For unknown messages:** verify in-game before acting. Does the affected feature work? If yes, treat as suspect-only and log it for later.
4. **For real-signal messages:** apply the relevant parse-error / dependency / recursion playbook from Sections 3–4.
5. **For audio reports:** identify the entity first; mod configs are last on the list.
