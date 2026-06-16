# VANILLA_REFERENCE.md — Minecraft 1.20.1 schema and class reference

A grounded reference for the data-driven and class-level systems Novus interacts with. Every schema claim cites either a vanilla example file under `refs/extracted/data/minecraft/` or a class file under `refs/client-1.20.1-20230612.114412-srg.jar`.

**Sources** (in `Novus/refs/`):
- `minecraft-1.20.1-client.jar` — vanilla client jar with `data/` (1,272 advancements, 1,091 loot tables, 1,175 recipes, 413 tags, 844 worldgen JSONs) and `assets/`. The data subset is unpacked at `extracted/data/minecraft/`.
- `client-1.20.1-20230612.114412-srg.jar` — Forge-shipped SRG-mapped class jar; 7,436 classes used as parser ground-truth. Class listing dump at `extracted/class_listing.txt`.
- `forge-1.20.1-47.4.20-universal.jar` — the actual Forge contributions: 1,169 `net.minecraftforge.*` classes (events, registries, capabilities, fluids, items, energy) plus 327 Forge tags (`forge:items` 206, `forge:blocks` 117, `forge:fluids` 2, `forge:entity_types` 2) and a handful of vanilla loot/recipe overrides. Unpacked at `extracted/forge/`. Class listing at `extracted/forge/forge_class_listing.txt`.
- `forge-1.20.1-47.4.20-client.jar` — the Forge-patched MC binary slice; included for completeness but not used as a primary source (no Forge API of its own; just MC classes with binary patches applied).

**How to use this doc**: hit Ctrl-F. The Quick lookup index at §11 lists every named JSON type (loot condition, advancement trigger, recipe type, density-function operation, etc.) with a one-line description and section pointer. For style and convention rules — when to use which tool, how to write defensive patches — see `STYLE_GUIDE.md`.

**Maintenance**: 1.20.1 is frozen — Mojang will not patch it again — so every section grounded in vanilla data or vanilla classes is permanently stable. The only moving target is Forge: §9.5 (capabilities) and any Forge-event references are pinned to **47.4.20** and would need a re-verification pass against a different universal jar if you ever update Forge. Mod updates don't change this reference; they may change Novus's *patches*, in which case this doc is the spec to validate against. If something here is wrong, fix the spec — don't work around it in patches.

## Table of contents

1. [Datapack JSON fundamentals](#1-datapack-json-fundamentals)
2. [Tags](#2-tags)
3. [Loot tables](#3-loot-tables)
4. [Predicates](#4-predicates)
5. [Advancements](#5-advancements)
6. [Recipes](#6-recipes)
7. [Worldgen JSON](#7-worldgen-json)
8. [Other data](#8-other-data)
9. [Block + item + registry mechanics](#9-block--item--registry-mechanics)
10. [Entity + AI internals](#10-entity--ai-internals)
11. [Quick lookup index](#11-quick-lookup-index)

---

## 1. Datapack JSON fundamentals

A 1.20.1 datapack is a folder (or zip) holding `pack.mcmeta` and a `data/` tree. Inside `data/` the first child is a **namespace** (`minecraft`, `forge`, the pack's own id), and below that come **system folders** the resource manager scans by name. The canonical layout is `data/<namespace>/<system>/<path>.json`, where `<system>` is one of `advancements`, `loot_tables`, `recipes`, `tags`, `worldgen`, `predicates`, `item_modifiers`, `functions`, `structures`, `chat_type`, `damage_type`, `dimension`, `dimension_type`, `trim_material`, `trim_pattern`, `datapacks` (the bundled-feature-pack slot). Tags split by registry under `tags/blocks/`, `tags/items/`, `tags/entity_types/`, `tags/damage_type/`, `tags/worldgen/biome/`, etc. The extracted vanilla pack at `refs/extracted/data/minecraft/` confirms exactly these subfolders.

The file path *is* the registry key: `data/minecraft/loot_tables/blocks/oak_leaves.json` registers the loot table `minecraft:blocks/oak_leaves` (namespace = first folder, system folder stripped, remaining path with `.json` removed becomes the ResourceLocation path). `data/minecraft/tags/blocks/logs.json` registers tag `minecraft:logs` in the `blocks` registry. Namespace-and-path collisions are how datapacks override vanilla — most registries (loot tables, advancements, recipes) are last-write-wins, while tags merge by default (see §2).

### `pack.mcmeta`

Vanilla's bundled feature pack at `refs/extracted/data/minecraft/datapacks/bundle/pack.mcmeta` shows the canonical shape:

```json
{
  "features": { "enabled": ["minecraft:bundle"] },
  "pack": {
    "description": { "translate": "dataPack.bundle.description" },
    "pack_format": 15
  }
}
```

`pack_format` for a 1.20.1 *data* pack is `15` (confirmed in `refs/extracted/version.json`: `"pack_version": { "resource": 15, "data": 15 }`). `description` is either a plain string or a Text-Component object. The optional `features` block enables experimental feature flags. A `filter` block (block list of namespaced paths) and `overlays` block also exist but vanilla doesn't ship them.

### Load order, overrides, and `.mcassetsroot`

Layers stack vanilla → enabled datapacks (order shown by `/datapack list`) → mods' built-in datapacks → `world/datapacks/`. Most JSON registries (loot tables, advancements, recipes, item modifiers, predicates) are **last write wins**: a later pack's file fully replaces earlier copies of the same path. Tags are the merge exception (see §2). The empty `data/.mcassetsroot` marker exists only so Mojang's asset-extraction tooling can locate the data root inside the client jar; the runtime ignores it and datapacks need not ship one.

## 2. Tags

A tag JSON has two top-level fields: `replace` (boolean, default `false`) and `values` (array). The codec is `net/minecraft/tags/TagFile.class`. Each `values` entry is parsed by `net/minecraft/tags/TagEntry.class` and is either a bare string (a registry id, or a `#`-prefixed reference to another tag) or an object `{ "id": "...", "required": false }`.

`refs/extracted/data/minecraft/tags/blocks/leaves.json` is the bare-string form — a flat list of block ids. Tag references pull in another tag's resolved contents — `tags/blocks/logs.json` is just `{ "values": ["#minecraft:logs_that_burn", "#minecraft:crimson_stems", "#minecraft:warped_stems"] }`, where each `#`-id resolves at tag-bake time (recursive references flatten, cycles fail-load).

### `replace` and `required`

`replace: true` discards lower-layer contributions to this tag, leaving only the current file's `values`. Vanilla never uses it (zero matches across `refs/extracted/data/minecraft/tags/`), but mod-author and pack-level overrides do — e.g. the user's `kubejs/data/forge/tags/items/stoves.json` sets `"replace": true` to take ownership of `forge:stoves`.

`{ "id": "...", "required": false }` flags a single entry as optional: if the id does not resolve at load (mod not installed), the entry is silently dropped rather than failing the tag. Required-true is the implicit default for bare strings. The user's `kubejs/data/forge/tags/items/bars/chocolate.json` shows the cross-mod compat pattern: `{ "replace": false, "values": [{ "id": "compatdelight:milk_chocolate_bar", "required": false }] }`.

### Vanilla tag inventory by category

413 tag JSONs across `refs/extracted/data/minecraft/tags/`:

- `blocks/` (170) — mining-tool tags (`mineable/axe.json`), wood families (`logs.json`, `leaves.json`), worldgen replaceables, behavior (`climbable`, `dragon_immune`, `fire`, `enderman_holdable`).
- `items/` (99) — recipe-input families (`planks.json`, `wool.json`, `fishes.json`), tool/armor (`swords.json`, `trim_templates.json`), behavior (`creeper_drop_music_discs.json`).
- `worldgen/` (84) — mostly biome tags (`is_overworld.json`, `has_structure/village_plains.json`).
- `damage_type/` (24) — 1.20 damage-type categorization (`is_fire.json`, `bypasses_armor.json`).
- `entity_types/` (13) — `skeletons.json`, `arrows.json`, `raiders.json`, `frog_food.json`.
- `banner_pattern/` (7), `game_events/` (5), `instrument/` (3), `point_of_interest_type/` (3), `cat_variant/` (2), `fluids/` (2), `painting_variant/` (1).

### Common-namespace tags

Forge uses `forge:` for cross-mod ingredient unification (`forge:ingots/iron`, `forge:ores/copper`, `forge:storage_blocks/gold`, `forge:dyes/red`, `forge:tools/swords`); Fabric/Common uses `c:` for the same purpose (`c:ingots/iron`, `c:hidden_from_recipe_viewers`). On 1.20.1 Forge both coexist — the user's pack writes both `kubejs/data/c/tags/...` and `kubejs/data/forge/tags/...`.

## 3. Loot tables

A loot table has three top-level fields: `type`, `pools`, and (optional) `functions`. An optional `random_sequence` string (vanilla sets it on every shipped table — `oak_leaves.json` ends with `"random_sequence": "minecraft:blocks/oak_leaves"`) gives multiple invocations a deterministic per-table RNG seed.

`type` is the loot-context paramset from `LootContextParamSets.class`. Vanilla values: `minecraft:block`, `minecraft:entity`, `minecraft:chest`, `minecraft:fishing`, `minecraft:archaeology`, `minecraft:gift`, `minecraft:advancement_reward`, `minecraft:advancement_entity`, `minecraft:barter`, `minecraft:selector`, `minecraft:command`, `minecraft:generic`, `minecraft:empty`. The type controls available `LootContextParam`s (e.g. `block` exposes `this`, `block_state`, `tool`, `origin`, `explosion_radius`; `entity` exposes `this`, `last_damage_player`, `damage_source`).

Top-level `functions` apply to every item produced (rare; per-pool and per-entry `functions` are the usual placement).

### Pools

Each pool is rolled independently. Fields:

- `rolls` — number of times the pool's entries are picked. Either a number (treated as a constant) or a number-provider object. `simple_dungeon.json` line 68 uses `{ "type": "minecraft:uniform", "min": 1.0, "max": 3.0 }`.
- `bonus_rolls` — additional rolls per point of the player's luck attribute. Same shape as `rolls`. Almost always `0.0` in vanilla.
- `entries` — array of entry objects (see below).
- `conditions` — array of loot conditions; if any fails, the entire pool is skipped. `oak_leaves.json` pool 2 wraps the stick drop in an `inverted` of an `any_of(match_tool: shears, match_tool: silk_touch)` so the stick only appears when neither is used.
- `functions` — applied to every item produced by the pool (less common than per-entry).

### Entry types (8)

`LootPoolEntries.class` registers eight types. Singleton entries (extend `LootPoolSingletonContainer`) accept `weight`, `quality`, `conditions`, `functions` directly: `empty`, `item`, `loot_table`, `dynamic`, `tag`. Composite entries (extend `CompositeEntryBase`) carry a `children` array instead: `alternatives`, `sequence`, `group`.

- **`minecraft:item { name }`** — drops a registered item (every entry in `simple_dungeon.json`).
- **`minecraft:tag { name, expand }`** — picks from an item tag. With `expand: true` each tag member is a weighted entry; `false` rolls one member weighted by position. Vanilla: `creeper.json` line 47.
- **`minecraft:loot_table { name }`** — defers to another table by id. `gameplay/fishing.json` is built entirely from this.
- **`minecraft:empty`** — drops nothing; useful as a weighted miss (`elder_guardian.json` line 81).
- **`minecraft:dynamic { name }`** — emits an item supplied by block/entity code at runtime. The `name` is a key the block looks up. Used for shulker box contents and `decorated_pot.json` line 11.
- **`minecraft:alternatives`** — children tried in order; first whose conditions pass emits, rest skipped. Standard silk-touch-vs-sapling pattern (`oak_leaves.json` line 8).
- **`minecraft:sequence`** — children emit in order until one fails (`SequentialEntry.class`). Zero uses in vanilla data, fully wired in the parser.
- **`minecraft:group`** — all passing children emit (`EntryGroup.class`). Also unused in vanilla data.

Composites can nest arbitrarily; their `conditions` and `functions` apply to all children unless overridden.

### Conditions (18 in registry)

The `<clinit>` of `net/minecraft/world/level/storage/loot/predicates/LootItemConditions.class` registers 18 (the user prompt's "12" is low): `inverted`, `any_of`, `all_of`, `random_chance`, `random_chance_with_looting`, `entity_properties`, `killed_by_player`, `entity_scores`, `block_state_property`, `match_tool`, `table_bonus`, `survives_explosion`, `damage_source_properties`, `location_check`, `weather_check`, `reference`, `time_check`, `value_check`.

`inverted` wraps `term: {...}` and negates (`oak_leaves.json` line 70). `any_of`/`all_of` take `terms: [...]` (`oak_leaves.json` line 13). `random_chance { chance }` is a flat roll; `random_chance_with_looting { chance, looting_multiplier }` scales by Looting (`zombie.json` line 41). `entity_properties { entity, predicate }` applies an `EntityPredicate` to a context slot (`this`, `killer`, `direct_killer`, `killer_player`) — see `zombie.json` line 60 for the on-fire check. `killed_by_player` is the boolean-true check (`zombie.json` line 36). `entity_scores` reads scoreboard values on a context entity. `block_state_property { block, properties }` checks the `block_state` parameter's blockstate (each property either an exact string or `{ min, max }` range). `match_tool { predicate }` applies an `ItemPredicate` to the breaking tool — the canonical pattern uses either `items: [...]` or `enchantments: [{ enchantment, levels }]`. `table_bonus { enchantment, chances: [...] }` rolls by an indexed enchantment level. `survives_explosion` reads the `explosion_radius` parameter. `damage_source_properties { predicate }` applies a `DamageSourcePredicate`. `location_check { predicate, offsetX/Y/Z }` applies a `LocationPredicate`. `weather_check { raining, thundering }`. `reference { name }` defers to a file at `data/<ns>/predicates/<path>.json`. `time_check { value, period }` checks world time. `value_check { value, range }` checks a number provider.

### Functions (26 in registry)

From `net/minecraft/world/level/storage/loot/functions/LootItemFunctions.class` `<clinit>` (the user prompt's "18" is low): `set_count`, `enchant_with_levels`, `enchant_randomly`, `set_enchantments`, `set_nbt`, `furnace_smelt`, `looting_enchant`, `set_damage`, `set_attributes`, `set_name`, `exploration_map`, `set_stew_effect`, `copy_name`, `set_contents`, `limit_count`, `apply_bonus`, `set_loot_table`, `explosion_decay`, `set_lore`, `fill_player_head`, `copy_nbt`, `copy_state`, `set_banner_pattern`, `set_potion`, `set_instrument`, `reference`.

Stack/damage/NBT: `set_count { count: <num>, add }` (`simple_dungeon.json` line 84), `set_damage { damage: <num>, add }`, `set_nbt { tag: "{...}" }`, `limit_count { limit: { min, max } }`. Cosmetic: `set_name { name, entity }`, `set_lore { lore, replace, entity }`, `set_banner_pattern { patterns, append }`, `set_potion { id }`, `set_instrument { options }` (goat horns).

Enchanting: `enchant_randomly` (parameterless = any enchantment, `simple_dungeon.json` line 60), `enchant_with_levels { levels, treasure }`, `set_enchantments { enchantments: { id: <num> }, add }`.

Context copy: `copy_name { source }` for the named source's display name; `copy_nbt { source, ops: [{ source, target, op }] }` (`decorated_pot.json` line 28 copies sherds); `copy_state { block, properties }` preserves blockstate as NBT (`beehive.json` line 41 keeps `honey_level`); `fill_player_head { entity }` populates GameProfile.

Container population: `set_contents { type, entries }` embeds drops into a container's BlockEntityTag; `set_loot_table { name, seed }` defers to a table when the container is opened.

Drop scaling: `looting_enchant { count, limit }` adds drops per Looting level; `apply_bonus` is fortune-scaling with three formulas (`binomial_with_bonus_count` for ores, `uniform_bonus_count`, `ore_drops` for diamond/emerald/lapis); `explosion_decay` re-rolls counts against `explosion_radius` (`oak_leaves.json` line 126); `furnace_smelt` substitutes smelting output (typically gated on `flags.is_on_fire`, `zombie.json` line 56); `set_attributes { modifiers }`; `set_stew_effect { effects }` for suspicious stew; `exploration_map { destination, decoration, zoom, search_radius, skip_existing_chunks }`. `reference { name }` invokes a registered item-modifier file at `data/<ns>/item_modifiers/<path>.json`.

Every function entry may carry its own `conditions: [...]` evaluated against the loot context — `zombie.json` line 56 gates `furnace_smelt` on the on-fire flag this way.

### Number providers

Per `net/minecraft/world/level/storage/loot/providers/number/NumberProviders.class`:

- `minecraft:constant { value: 3.0 }` — the bare number form (`"rolls": 1.0`) is shorthand for this.
- `minecraft:uniform { min: 1.0, max: 4.0 }` — float range.
- `minecraft:binomial { n: <num-provider>, p: <num-provider> }` — binomial distribution.
- `minecraft:score { target, score, scale: 1.0 }` — reads a scoreboard value (target is `{ type: "this" }` or `{ type: "fixed", name: "..." }`).

A `<number-provider>` field accepts either a bare number (parsed as `constant`) or an object with `type`. `simple_dungeon.json` shows both: pool-level `"rolls": 3.0` (constant shorthand) and `"rolls": { "type": "minecraft:uniform", "min": 1.0, "max": 3.0 }`.

## 4. Predicates

"Predicate" is overloaded. Two distinct kinds share the name:

1. **Critereon predicates** (`net/minecraft/advancements/critereon/`) — typed records used as object-valued fields inside triggers and loot conditions. No `condition` discriminator; positional schema.
2. **Loot conditions** (`net/minecraft/world/level/storage/loot/predicates/`) — discriminated by a `condition` string and stored in arrays (covered in §3).

Advancements re-use loot-condition arrays in some slots — that's the `place_feast` gotcha (see the last subsection).

### `ItemPredicate`

Fields (from `ItemPredicate.class` strings): `items` (array of ids), `tag` (single item tag id), `count` and `durability` (`MinMaxBounds.Ints`), `nbt` (raw NBT match), `potion` (potion id), `enchantments` and `stored_enchantments` (arrays of `EnchantmentPredicate`). Used inside `match_tool` and as the `item` slot of triggers like `inventory_changed`. `oak_leaves.json` line 18: `{ "items": ["minecraft:shears"] }`. The older `data: <int>` field is rejected with `Disallowed data tag found`.

### `BlockPredicate`

Fields: `blocks` (array of ids), `tag` (block tag), `state` (`StatePropertiesPredicate`), `nbt` (block-entity NBT). Used inside `block_state_property` and triggers like `enter_block`.

### `LocationPredicate`

Fields: `position { x, y, z }` (each `MinMaxBounds.Doubles`), `biome` (id — vanilla uses tag form via `EntityPredicate.location` filtering), `structure`, `dimension`, `light { light: MinMaxBounds.Ints }`, `smokey` (boolean — campfire below), `block` (`BlockPredicate`), `fluid` (`FluidPredicate`). Used in advancement `location` slots and the `location_check` loot condition.

### `EntityPredicate`

Fields: `type` (entity-type id or `#tag`), `distance` (`DistancePredicate`), `location` and `stepping_on` (`LocationPredicate`), `effects` (`MobEffectsPredicate`), `flags` (`EntityFlagsPredicate` — `is_on_fire`, `is_sneaking`, `is_sprinting`, `is_swimming`, `is_baby`), `equipment` (slot-keyed `ItemPredicate`s), `vehicle`/`passenger`/`targeted_entity` (recursive `EntityPredicate`), `team` (string), `nbt` (`NbtPredicate`), `type_specific` (`EntitySubPredicate` — inner `type` of `fishing_hook`, `lightning`, `cat`, `frog`, `slime`, `player`). `gameplay/fishing.json` line 18: `{ "type_specific": { "type": "fishing_hook", "in_open_water": true } }`.

### `DamageSourcePredicate`

Fields: `tags` (array of `{ id, expected }` damage-type tag matchers), `direct_entity` (`EntityPredicate`), `source_entity` (`EntityPredicate`). The 1.20 damage-type rework moved `is_fire`/`is_explosion`/etc. from boolean fields into datapack-driven tags — see `refs/extracted/data/minecraft/tags/damage_type/`.

### `FluidPredicate`

Fields: `fluid` (id), `tag` (fluid tag), `state` (`StatePropertiesPredicate` for `level`).

### `LightPredicate`, `MobEffectsPredicate`, `NbtPredicate`

`LightPredicate { light: MinMaxBounds.Ints }` — single-field, embedded in `LocationPredicate.light`. `MobEffectsPredicate { effects: { "<id>": { amplifier, duration, ambient, visible } } }` — all per-effect fields live inside the map. `NbtPredicate { nbt: "<SNBT>" }` — partial NBT match (`NbtUtils.partialMatch`) against the source.

### `StatePropertiesPredicate`

List of property matchers, each either exact (`{ "facing": "north" }` shorthand or `{ "name": "facing", "value": "north" }`) or ranged (`{ "name": "age", "min": "3", "max": "7" }`). Values are **strings** — even integer properties serialize as quoted strings. Used inside `BlockPredicate.state` and `FluidPredicate.state`.

### `EnchantmentPredicate`

`{ enchantment, levels: MinMaxBounds.Ints }`. Used inside `ItemPredicate.enchantments`/`.stored_enchantments`. `oak_leaves.json` line 27: `{ "enchantment": "minecraft:silk_touch", "levels": { "min": 1 } }`.

### `DistancePredicate`

Five `MinMaxBounds.Doubles`: `x`, `y`, `z` (signed component deltas), `horizontal` (sqrt(dx²+dz²)), `absolute` (full 3D). Used inside `EntityPredicate.distance`.

### `ContextAwarePredicate` — array-of-loot-conditions idiom

The gotcha. `ContextAwarePredicate.class` wraps a `LootItemCondition[]` (the field is `[Lnet/minecraft/world/level/storage/loot/predicates/LootItemCondition;` in the class signature) and **deserializes from a JSON array, not an object**. Wherever a trigger types its slot as `ContextAwarePredicate`, the JSON must be an array of `{ "condition": "...", ... }` loot-condition objects, even though the slot reads like it should be one predicate.

The `placed_block` trigger's `location` slot is exactly this. Canonical vanilla example, `refs/extracted/data/minecraft/advancements/husbandry/plant_seed.json` lines 6–11:

```json
"location": [
  { "block": "minecraft:beetroots", "condition": "minecraft:block_state_property" }
]
```

This is **not** a `LocationPredicate` — that would be a single object with `position`/`biome`/`block`/etc. keys. It is a `ContextAwarePredicate`, so each array element is a loot condition (here `block_state_property`, whose own fields include `block`). The same idiom appears anywhere you see a slot taking `[{ "condition": ..., ... }]` — `placed_block`'s `location` and `player` slots, the kill triggers, `tick`, and others where the trigger needs context-aware matching the loot system already evaluates.

---

## 5. Advancements

Advancements are JSON files placed under `data/<namespace>/advancements/<path>.json`. The vanilla 1.20.1 set lives at `refs/extracted/data/minecraft/advancements/` and contains 1,272 files split across six top-level folders: `adventure/`, `end/`, `husbandry/`, `nether/`, `story/`, and `recipes/`. The `recipes/` tree is special — every entry is a hidden, telemetry-suppressed advancement whose only purpose is to unlock a vanilla recipe in the recipe book; its files are the canonical pattern for "I want this recipe to appear when X happens." See `recipes/transportation/birch_boat.json` for the prototypical shape.

The parser ground truth for every field below is in `client-1.20.1-20230612.114412-srg.jar` under `net/minecraft/advancements/Advancement.class` (top-level deserializer) plus one class per trigger under `net/minecraft/advancements/critereon/`.

### 5.1 Schema overview

A single advancement is an object with up to seven optional/required keys: `parent`, `criteria` (the only truly required one), `requirements`, `rewards`, `display`, `sends_telemetry_event`, and an undocumented `loot_table_seed`-class field that vanilla never uses. Three things matter most for modpack work: `criteria` defines which game events can complete this advancement, `requirements` defines how those criteria are combined into a pass/fail decision, and `display` controls whether the player ever sees that the advancement exists.

`parent` is a resource location pointing at another advancement. Children inherit the root's tab background and are drawn connected by a line in the advancement screen. A file with no `parent` becomes a new tab if it has a `display.background`; otherwise it is a hidden root used only for grouping (see the `recipes/` tree, where `recipes/root.json` has no display block at all and merely exists so its impossible-to-complete `tick` trigger seeds the ancestry).

`sends_telemetry_event` is a boolean that controls whether Mojang's analytics endpoint is pinged when the advancement is granted. All vanilla recipe-unlock advancements set it to `false`; all story/adventure/end/husbandry/nether ones set it to `true`. For modpack-authored advancements it can usually be omitted (defaults false).

### 5.2 Criteria, requirements, and the AND-of-OR

`criteria` is an object whose keys are arbitrary developer-chosen names and whose values are `{ "trigger": "<id>", "conditions": { ... } }`. Each named criterion is one independent listener. `conditions` is the trigger-specific predicate body — its shape depends entirely on which trigger you picked. An empty `conditions: {}` means "any time this trigger fires," which is how `nether/brew_potion.json` accepts any potion at all.

`requirements` is an array of arrays of criterion names. The outer array is AND, the inner arrays are OR. So `[["a","b"],["c"]]` means `(a OR b) AND c`. If `requirements` is omitted entirely, vanilla auto-generates `[[ "a" ], [ "b" ], ... ]` (one inner array per criterion, i.e. straight AND across everything) — see `Advancement$Builder` in the jar for the autofill. The classic OR pattern shows up in `adventure/root.json`:

```json
"requirements": [["killed_something","killed_by_something"]]
```

That is one inner array, so either criterion satisfies the whole advancement. The classic recipe-unlock pattern, by contrast, is `[["unlock_right_away","has_the_recipe"]]` — visible in `recipes/decorations/crafting_table.json` — where `unlock_right_away` uses the `tick` trigger and is granted on the very first server tick the player exists for, and `has_the_recipe` waits for `recipe_unlocked`. Either path completes the advancement and adds the recipe.

### 5.3 Display

The optional `display` object decides what the player sees in the advancements screen and as a toast. Fields, all optional except where noted:

- `icon` (required if `display` is present): an `ItemStack` reference, typically `{ "item": "<id>" }` plus optional `"nbt": "<SNBT>"` for Damage/CustomModelData. Examples include `{ "item": "minecraft:trident", "nbt": "{Damage:0}" }` in `adventure/very_very_frightening.json`.
- `title` and `description` (both required if `display` is present): chat-component objects, almost always `{ "translate": "advancements.<path>.title" }` so the localization file owns the text.
- `frame`: `"task"` (square outline, the default), `"goal"` (rounded), or `"challenge"` (jagged star with a fanfare sound). The `end/levitate.json` advancement is a `challenge` worth 50 XP.
- `background`: only meaningful on root advancements; it's the texture path for the tab's tiled backdrop. `story/root.json` uses `minecraft:textures/gui/advancements/backgrounds/stone.png`.
- `show_toast`: boolean, default true. False suppresses the corner pop-up.
- `announce_to_chat`: boolean, default true. False suppresses the "<Player> has made the advancement [X]" broadcast.
- `hidden`: boolean, default false. True hides the advancement from the tree until it is granted. Children of a hidden advancement are also hidden until reached.

### 5.4 Rewards

The optional `rewards` object can grant up to four things at completion. `experience` is a flat integer of XP points (not levels). `recipes` is an array of recipe IDs to add to the player's recipe book; this is the entire mechanism behind the `recipes/` advancement tree — see `recipes/transportation/birch_boat.json` granting `["minecraft:birch_boat"]`. `loot` is an array of loot-table IDs, each rolled once with the player as the only context, and the items dumped into their inventory. `function` is a single function ID that runs as the player when the advancement triggers. None of these are mutually exclusive.

### 5.5 Trigger reference

Every trigger is parsed by a class at `net/minecraft/advancements/critereon/<Name>.class`, and each has a `TriggerInstance.fromJson` static method that defines the full conditions schema. The list below covers all triggers actually referenced by vanilla 1.20.1 advancement files plus a handful (`impossible`, `tick`, `used_ender_eye`) that exist in code and are stable enough to use. Every condition field is optional unless noted. Where a field name in the table below is `EntityPredicate` it means the value can be either a JSON object (legacy form) or — and this is what 1.20.1 vanilla uses everywhere — an array of loot conditions (a `ContextAwarePredicate`).

#### Generic / control-flow triggers

**`impossible`** (`ImpossibleTrigger.class`) — never fires on its own. Used as a placeholder so an advancement can only be granted via `/advancement grant`. Conditions are empty. Example: `recipes/root.json`.

**`tick`** (`PlayerTrigger.class`) — fires once per game tick for every online player. Conditions: a single optional `player` ContextAwarePredicate. With empty conditions it fires the very first tick after login, which is the standard "unlock recipe immediately" idiom in `recipes/decorations/crafting_table.json`.

#### Movement / location triggers

**`location`** (`PlayerTrigger.class`) — fires every 20 ticks per online player. The `player` ContextAwarePredicate is the only field, and it carries the actual biome/structure/dimension test inside its `entity_properties → predicate.location` block. Used heavily for biome-discovery advancements — see `adventure/adventuring_time.json` for the 50-biome AND list, or `end/find_end_city.json` for a single-structure check.

```json
"conditions": {
  "player": [{
    "condition": "minecraft:entity_properties",
    "entity": "this",
    "predicate": { "location": { "structure": "minecraft:end_city" } }
  }]
}
```

**`changed_dimension`** (`ChangeDimensionTrigger.class`) — fires when a player crosses a dimension boundary. Conditions: `from` and/or `to` (both dimension resource keys). `story/enter_the_end.json` filters on `to: minecraft:the_end`.

**`enter_block`** (`EnterBlockTrigger.class`) — fires when the player's bounding box enters a block. Conditions: `block` (single block ID) and optional `state` map (block-state property filter). The `recipes/transportation/birch_boat.json` recipe-unlock uses `block: minecraft:water` so the recipe is granted the first time the player swims.

**`placed_block`** (`PlacedBlockTrigger.class`) — fires when the player places any block. Critical detail: **`conditions.location` is a `ContextAwarePredicate` (array of loot conditions), not a `LocationPredicate`.** This is the field that bit Novus on `farmersdelight:place_feast` — passing a bare `LocationPredicate` object silently fails parse. The trigger also accepts a separate `block` (block ID) and `state` (block-state map) at the top level. See `husbandry/plant_seed.json`, where every criterion uses `location: [{ condition: minecraft:block_state_property, block: ... }]` to filter the placed crop.

**`fall_from_height`** (`FallAfterExplosionTrigger.class`/`PlayerTrigger.class` variant) — fires after a fall completes. Conditions: `start_position` (LocationPredicate), `distance` (DistancePredicate with `x`/`y`/`z`/`absolute`/`horizontal`), and a `player` ContextAwarePredicate. `adventure/fall_from_world_height.json` requires `start_position.y >= 319` and `distance.y >= 379` and player ending below y = -59.

**`nether_travel`** (`PlayerTrigger.class` variant) — fires when the player exits the Nether dimension to the Overworld; the trigger compares Overworld start/end positions for the corresponding Nether-distance traveled. Conditions: `start_position`, `distance`, `player`. Used in `nether/fast_travel.json`.

**`ride_entity_in_lava`** (`RideEntityInLavaTrigger.class`) — fires while the player is mounted on an entity that is inside lava. Conditions: `start_position`, `distance`, `player`. Used by `nether/ride_strider_in_overworld_lava.json`.

**`slept_in_bed`** — alias for `PlayerTrigger`. Conditions: `player` ContextAwarePredicate. The bed location lives inside `player → entity_properties → predicate.location`. Used in `adventure/sleep_in_bed.json`.

**`started_riding`** (`StartRidingTrigger.class`) — fires when the player mounts an entity. Conditions: `player` only. The vehicle filter goes inside `player.entity_properties.vehicle`. See `husbandry/ride_a_boat_with_a_goat.json`.

**`avoid_vibration`** (`PlayerTrigger.class`) — fires when the player triggers a Sculk Sensor while wearing wool boots, i.e. moves through a vibration zone without producing one. Conditions: `player` ContextAwarePredicate. Mostly empty in vanilla (`adventure/avoid_vibration.json` has `conditions: {}`); the actual "wearing wool boots" check is implicit in the source mixin and not a JSON field. Use cautiously in modded contexts — any movement that would have produced a vibration but didn't qualifies.

**`slide_down_block`** (`SlideDownBlockTrigger.class`) — fires when the player slides down a sticky block (honey block, slime block). Conditions: `block` (block ID) and `state` (block-state map) and `player`. `adventure/honey_block_slide.json` filters on `block: minecraft:honey_block`. Sliding mechanics are a movement-mixin behavior, so this is honey-block-specific in vanilla.

**`levitation`** (`LevitationTrigger.class`) — fires every tick the player has the levitation effect. Conditions: `distance` (DistancePredicate of net displacement), `duration` (IntRange of effect ticks), `player`. `end/levitate.json` requires `distance.y >= 50`.

#### Combat triggers

**`player_killed_entity`** (`KilledTrigger.class`) — fires when a player is the killing damage source for an entity. Conditions: `entity` ContextAwarePredicate (the victim), `killing_blow` (DamageSourcePredicate), `player`. The `adventure/kill_a_mob.json` advancement has 76 criteria — one per killable entity type — all OR'd in `requirements`.

**`entity_killed_player`** (`KilledByCrossbowTrigger`-family / `KilledTrigger.class`) — fires when the player dies. Conditions: same shape as `player_killed_entity` but `entity` is the killer. Used in `adventure/root.json`.

**`player_hurt_entity`** (`PlayerHurtEntityTrigger.class`) — fires when the player damages an entity (kill not required). Conditions: `damage` (DamagePredicate including `dealt`/`taken`/`source_entity`/`type`/`blocked`), `entity`, `player`. `adventure/throw_trident.json` uses this for trident-hit detection.

**`entity_hurt_player`** (`EntityHurtPlayerTrigger.class`) — fires when the player takes damage. Same conditions as above with the polarity flipped. `story/deflect_arrow.json` uses it to detect a blocked arrow.

**`shot_crossbow`** (`ShotCrossbowTrigger.class`) — fires when the player fires a crossbow bolt. Conditions: `item` (ItemPredicate of the crossbow), `player`. See `adventure/ol_betsy.json`.

**`killed_by_crossbow`** (`KilledByCrossbowTrigger.class`) — fires when one or more entities are killed by a single crossbow shot (multishot relevant). Conditions: `unique_entity_types` (IntRange — distinct mob types in the burst) and `victims` (array of EntityPredicates the burst must include). `adventure/arbalistic.json` requires `unique_entity_types >= 5`.

**`target_hit`** (`TargetBlockTrigger.class`) — fires when an arrow hits a target block. Conditions: `signal_strength` (IntRange of the redstone-output power), `projectile` (EntityPredicate of the arrow), `shooter` (EntityPredicate of the firer), `player`. `adventure/bullseye.json` requires bullseye signal 15 from ≥30 blocks away.

**`channeled_lightning`** (`ChanneledLightningTrigger.class`) — fires when a Trident-summoned lightning strike hits one or more entities. Conditions: `victims` (array of EntityPredicates, all must match). `adventure/very_very_frightening.json` requires the struck entity to be a villager.

**`lightning_strike`** (`LightningStrikeTrigger.class`) — fires when natural lightning strikes near the player. Conditions: `lightning` (EntityPredicate of the bolt — supports `type_specific.lightning.blocks_set_on_fire`), `bystander` (EntityPredicate of any nearby entity), `player`. `adventure/lightning_rod_with_villager_no_fire.json` is the canonical example.

**`used_totem`** (`UsedTotemTrigger.class`) — fires when a Totem of Undying saves the player from death. Conditions: `item` (ItemPredicate, normally pinned to `minecraft:totem_of_undying`), `player`. See `adventure/totem_of_undying.json`.

**`hero_of_the_village`** — alias for `LocationTrigger`/`PlayerTrigger`. Fires when the Hero of the Village effect is bestowed (raid won). Conditions: `player` only; the actual raid context is implicit. `adventure/hero_of_the_village.json`.

**`voluntary_exile`** — note: vanilla `adventure/voluntary_exile.json` uses `player_killed_entity` filtered to a Pillager Captain rather than a dedicated trigger. There is no `voluntary_exile` trigger ID in 1.20.1.

**`kill_mob_near_sculk_catalyst`** (`KillMobNearSculkCatalystTrigger.class`) — fires when a player kill happens within sensing range of a sculk catalyst. Conditions: `entity`, `killing_blow`, `player`. Same shape as `player_killed_entity`. Used in `adventure/kill_mob_near_sculk_catalyst.json`.

#### Item / inventory triggers

**`inventory_changed`** (`InventoryChangeTrigger.class`) — fires every time the player's inventory contents change in any way. Conditions: `items` (array of ItemPredicates, each must match at least one inventory slot), and three IntRanges `slots.occupied`/`slots.full`/`slots.empty`. This is the workhorse for "obtain item X" advancements. `story/upgrade_tools.json` matches a single stone pickaxe; `story/root.json` matches a crafting table. Also used inside recipe-unlock advancements as the "you actually crafted it" half of the OR (see `recipes/transportation/spruce_chest_boat.json`).

**`recipe_unlocked`** (`RecipeUnlockedTrigger.class`) — fires when the named recipe enters the player's recipe book. Conditions: `recipe` (a single recipe resource location, required). Vanilla pairs this with `inventory_changed` or `enter_block` inside `recipes/` advancements so the recipe auto-unlocks under multiple paths. This is the trigger to use when a custom advancement should reward a recipe — the `rewards.recipes` array on the same advancement does the actual unlocking.

**`recipe_crafted`** (`RecipeCraftedTrigger.class`) — fires when the player completes one craft of a specific recipe. Conditions: `recipe_id` (resource location, required) and `ingredients` (array of ItemPredicates). New in 1.20 and used heavily by smithing-trim advancements like `adventure/trim_with_any_armor_pattern.json`.

**`consume_item`** (`ConsumeItemTrigger.class`) — fires when the player finishes eating/drinking an item. Conditions: `item` ItemPredicate, `player`. `husbandry/balanced_diet.json` has 40-odd criteria for each food. Note: `husbandry/root.json` uses an empty-conditions `consume_item`, granting on any food eaten.

**`item_used_on_block`** (`ItemUsedOnBlockTrigger.class`) — fires when the player right-clicks a block with an item. Conditions: `location` (ContextAwarePredicate — same caveat as `placed_block`), `item` (ItemPredicate). The block being clicked goes inside `location` via a `block_state_property` or `location_check` condition. `husbandry/safely_harvest_honey.json`, `husbandry/wax_on.json`, `nether/use_lodestone.json`, `nether/charge_respawn_anchor.json` all use this trigger.

**`item_durability_changed`** (`ItemDurabilityTrigger.class`) — fires when an item the player is holding takes durability damage. Conditions: `item` (ItemPredicate of the damaged tool), `durability` (IntRange of remaining durability), `delta` (IntRange of damage applied this tick), `player`. `nether/ride_strider.json` uses this to detect "used a warped fungus on a stick while riding a strider."

**`using_item`** (`UsingItemTrigger.class`) — fires every tick the player is using-item (right-click held). Conditions: `item` ItemPredicate, `player`. The `looking_at` filter goes inside `player.entity_properties.type_specific.player.looking_at`. See `adventure/spyglass_at_parrot.json`.

**`enchanted_item`** (`EnchantedItemTrigger.class`) — fires when an item gains enchantments at an enchanting table. Conditions: `item` (ItemPredicate of the result), `levels` (IntRange of XP levels spent), `player`. `story/enchant_item.json` uses empty conditions — any enchant counts.

**`filled_bucket`** (`FilledBucketTrigger.class`) — fires when a bucket is filled with water/lava/milk/fish/powder snow. Conditions: `item` ItemPredicate of the resulting filled bucket, `player`. `husbandry/tactical_fishing.json` uses this with item-type filters per fish bucket; `husbandry/tadpole_in_a_bucket.json` filters to `tadpole_bucket`.

**`fishing_rod_hooked`** (`FishingRodHookedTrigger.class`) — fires when the fishing bobber catches an item. Conditions: `rod` (ItemPredicate of the rod used), `entity` (EntityPredicate — the bobber-attached entity, usually an `item` entity), `item` (ItemPredicate of the caught item), `player`. `husbandry/fishy_business.json` filters by caught fish type.

**`thrown_item_picked_up_by_entity`** (`ThrownItemPickedUpByEntityTrigger.class`) — fires when an item the player threw is picked up by an entity. Conditions: `item`, `entity` (the picker-upper), `player`. `nether/distract_piglin.json` uses this for the bartered-gold-flow path.

**`thrown_item_picked_up_by_player`** (`ThrownItemPickedUpByPlayerTrigger.class`) — fires when the player picks up an item that was thrown by another entity (allay deliveries, mostly). Conditions: same shape with polarity flipped. `husbandry/allay_deliver_item_to_player.json`.

**`allay_drop_item_on_block`** (`ItemUsedOnBlockTrigger`-style, dedicated class) — fires when an Allay drops an item onto a target block. Conditions: `location` ContextAwarePredicate (the block the item was dropped on), `item` ItemPredicate (the dropped item). `husbandry/allay_deliver_cake_to_note_block.json`.

#### Container / world-interaction triggers

**`player_generates_container_loot`** (`LootTableTrigger.class`) — fires when a loot table is rolled because the player opened a container, fished, killed a mob, etc. Conditions: `loot_table` (resource location, required), `player`. `adventure/salvage_sherd.json` and `nether/loot_bastion.json` use this for archaeology- and chest-loot detection.

**`player_interacted_with_entity`** (`PlayerInteractTrigger.class`) — fires when the player right-clicks an entity. Conditions: `item` ItemPredicate (held item), `entity` ContextAwarePredicate, `player`. `husbandry/leash_all_frog_variants.json` filters on frog variant per criterion.

**`construct_beacon`** (`ConstructBeaconTrigger.class`) — fires when a beacon's base level changes. Conditions: `level` (IntRange — the new tier 0-4), `player`. `nether/create_beacon.json` requires `level >= 1`; `nether/create_full_beacon.json` requires `level == 4`.

**`brewed_potion`** (`BrewedPotionTrigger.class`) — fires when the player extracts a potion from a brewing stand. Conditions: `potion` (resource location of the potion ID, optional). Used by `nether/brew_potion.json` (any potion) and the `nether/all_potions.json` chain (specific potions).

**`effects_changed`** (`EffectsChangedTrigger.class`) — fires whenever the player's mob-effect list changes (gained, removed, level-changed). Conditions: `effects` (object map of effect-id to MobEffectInstancePredicate with `amplifier`/`duration`), `source` (EntityPredicate of the cause), `player`. `nether/all_effects.json` lists every vanilla effect; `husbandry/kill_axolotl_target.json` watches for the Axolotl regeneration buff with `source` filtered to an axolotl.

**`tame_animal`** (`TameAnimalTrigger.class`) — fires when the player tames an animal. Conditions: `entity` ContextAwarePredicate of the now-tamed mob, `player`. `husbandry/tame_an_animal.json` is empty; `husbandry/complete_catalogue.json` filters by cat variant per criterion.

**`bred_animals`** (`BredAnimalsTrigger.class`) — fires when two animals produce offspring. Conditions: `parent` (EntityPredicate), `partner` (EntityPredicate), `child` (EntityPredicate), `player`. `husbandry/bred_all_animals.json` lists ~24 species OR'd in `requirements`.

**`bee_nest_destroyed`** (`BeeNestDestroyedTrigger.class`) — fires when the player breaks a bee nest or beehive. Conditions: `block` (block ID), `item` ItemPredicate of the breaking tool (used to require Silk Touch), `num_bees_inside` (IntRange), `player`. `husbandry/silk_touch_nest.json` requires `silk_touch >= 1` and `num_bees_inside == 3`.

**`cured_zombie_villager`** (`CuredZombieVillagerTrigger.class`) — fires when a player completes the cure ritual on a Zombie Villager. Conditions: `zombie` (EntityPredicate of the pre-cure mob), `villager` (EntityPredicate of the post-cure villager), `player`. `story/cure_zombie_villager.json`.

**`summoned_entity`** (`SummonedEntityTrigger.class`) — fires when the player summons an entity by placing the right pattern (Wither, Iron Golem, Snow Golem, Ender Dragon respawn). Conditions: `entity` ContextAwarePredicate of the summoned mob, `player`. See `nether/summon_wither.json`, `adventure/summon_iron_golem.json`, `end/respawn_dragon.json`.

**`villager_trade`** (`TradeTrigger.class`, exposed JSON name `villager_trade`) — fires when the player completes a trade with a villager or wandering trader. Conditions: `villager` (EntityPredicate of the trader), `item` (ItemPredicate of the bought item), `player`. `adventure/trade.json` and `adventure/trade_at_world_height.json` use this; the latter filters `player.entity_properties.location.position.y >= 319`.

**`used_ender_eye`** (`UsedEnderEyeTrigger.class`) — exists in code, not referenced by any vanilla 1.20.1 advancement file. Conditions documented in source: `distance` (DoubleRange — distance to the targeted stronghold). Useful for modpack quests but unverified at runtime in this version; vanilla's `story/follow_ender_eye.json` uses `location` with a stronghold structure check instead.

### 5.6 Advancement-defined recipe unlocks

Two triggers are critical when debugging "why won't this recipe show up" in a modpack: `inventory_changed` and `recipe_unlocked`. The convention vanilla uses for every craftable item is one advancement per recipe, parented to `minecraft:recipes/root`, with two criteria — one `inventory_changed` matching the ingredients and one `recipe_unlocked` matching the recipe ID — combined as an OR. The `rewards.recipes` array names the recipe to grant. If a modded recipe never unlocks in JEI/EMI, check whether the mod ships a corresponding advancement; if not, ServerEvents.recipes won't grant the recipe-book entry on its own.

## 6. Recipes

Vanilla recipe files live at `data/<namespace>/recipes/<id>.json`, with the 1.20.1 set extracted to `refs/extracted/data/minecraft/recipes/` (1,175 files). Every file has a top-level `"type"` field that selects a `RecipeSerializer`; the serializer at `net/minecraft/world/item/crafting/<TypeName>$Serializer.class` defines the rest of the schema. Vanilla 1.20.1 exposes the following type IDs:

- `minecraft:crafting_shaped`
- `minecraft:crafting_shapeless`
- `minecraft:smelting`
- `minecraft:blasting`
- `minecraft:smoking`
- `minecraft:campfire_cooking`
- `minecraft:stonecutting`
- `minecraft:smithing_transform`
- `minecraft:smithing_trim`
- `minecraft:crafting_decorated_pot`
- `minecraft:crafting_special_armordye`
- `minecraft:crafting_special_bannerduplicate`
- `minecraft:crafting_special_bookcloning`
- `minecraft:crafting_special_firework_rocket`
- `minecraft:crafting_special_firework_star`
- `minecraft:crafting_special_firework_star_fade`
- `minecraft:crafting_special_mapcloning`
- `minecraft:crafting_special_mapextending`
- `minecraft:crafting_special_repairitem`
- `minecraft:crafting_special_shielddecoration`
- `minecraft:crafting_special_shulkerboxcoloring`
- `minecraft:crafting_special_suspiciousstew`
- `minecraft:crafting_special_tippedarrow`

That is 23 type IDs. (Pre-1.20 also had `minecraft:smithing` and `minecraft:crafting_special_repairitem` was a single legacy serializer; in 1.20.1 the legacy `smithing` type was removed in favor of `smithing_transform`/`smithing_trim`.)

### 6.1 Ingredients

An "ingredient" in vanilla is one of three shapes, parsed by `Ingredient.fromJson` in `net/minecraft/world/item/crafting/Ingredient.class`:

- **Single item**: `{ "item": "minecraft:iron_ingot" }`. Matches that exact item, ignoring NBT.
- **Tag reference**: `{ "tag": "minecraft:planks" }`. Matches anything in the item tag. Used by `barrel.json` (planks + wooden slabs) and every `*_planks.json` that takes a log tag.
- **Choice array**: `[ { "item": "..." }, { "tag": "..." } ]`. Matches if any element matches. Vanilla 1.20.1 ships zero choice-array ingredients in its own recipes — every ingredient resolves to a single object — but the parser still accepts them, and modded packs use them frequently.

Any place this reference says "ingredient" below, all three shapes are accepted. Ingredients never carry NBT match data in vanilla; for NBT-aware ingredients you need Forge's `forge:nbt` ingredient or a CraftTweaker bracket.

### 6.2 Crafting table recipes

**`crafting_shaped`** is the standard 3×3 grid recipe. Schema: `pattern` (array of 1-3 strings, each 1-3 chars wide), `key` (object mapping each pattern character to one ingredient), `result` (an `ItemStack`: `{ "item": "...", "count": N, "nbt": "..." }`), `category` (`"building"` / `"redstone"` / `"equipment"` / `"misc"` — controls the recipe-book tab), optional `group` (string used to merge variants in the recipe book), and optional `show_notification` (bool, default true; controls the recipe-book toast). `birch_stairs.json` is the canonical small example; `anvil.json` shows multiple keys and a top-row-full pattern. `barrel.json` shows tag-based keys.

```json
{
  "type": "minecraft:crafting_shaped",
  "category": "building",
  "key": { "#": { "item": "minecraft:birch_planks" } },
  "pattern": ["#  ", "## ", "###"],
  "result": { "count": 4, "item": "minecraft:birch_stairs" }
}
```

**`crafting_shapeless`** ignores grid position. Schema: `ingredients` (array of 1-9 ingredients, all required), `result`, `category`, optional `group`, optional `show_notification`. `andesite.json` (diorite + cobblestone) and `acacia_planks.json` (one log tag) are minimal examples; `blue_ice.json` shows the maximum 9-ingredient case.

**`crafting_decorated_pot`** is a special shaped-style recipe whose body is empty because its 4-corner-sherd logic is hard-coded in the serializer. The whole file is just `{ "type": "...", "category": "misc" }` — see `decorated_pot.json`. The recipe matches any 4 sherds (or bricks) on the cardinal slots and produces a Decorated Pot with the sherd NBT baked in.

**`crafting_special_*`** are 11 hard-coded crafting table behaviors whose ingredient/result logic is entirely in code. Every one of their JSON files is two lines: type + category. Their bodies are empty because the matching logic and the result construction depend on per-craft state (the dye color used, the map being cloned, the banner being duplicated, etc.) that cannot be expressed in a pattern. The 11 are:

- `crafting_special_armordye` — leather armor + any number of dyes → tinted armor.
- `crafting_special_bannerduplicate` — banner + same-pattern banner → second copy.
- `crafting_special_bookcloning` — written book + writable books → multiple copies.
- `crafting_special_firework_rocket` — gunpowder + paper + 0-7 firework stars → rocket with NBT-encoded effects.
- `crafting_special_firework_star` — gunpowder + dye(s) + optional shape modifiers → firework star NBT.
- `crafting_special_firework_star_fade` — firework star + dye(s) → adds fade colors.
- `crafting_special_mapcloning` — filled map + empty maps → map copies sharing the same map ID.
- `crafting_special_mapextending` — filled map + 8 paper → extended-zoom map.
- `crafting_special_repairitem` — two damaged tools of the same type → combined durability with no enchantments preserved.
- `crafting_special_shielddecoration` — shield + banner → patterned shield.
- `crafting_special_shulkerboxcoloring` — shulker box + dye → recolored shulker box.
- `crafting_special_suspiciousstew` — bowl + brown mushroom + red mushroom + flower → stew with flower-derived effect NBT.
- `crafting_special_tippedarrow` — 8 arrows + lingering potion → 8 tipped arrows with potion NBT.

(That's 13, matching the 13 files in `recipes/` — `book_cloning.json`, `armor_dye.json`, etc.) None of them respect `group`, `show_notification`, or `result` in JSON; only `type` and `category` are read.

### 6.3 Cooking recipes

Four serializers share the cooking schema: `smelting` (200-tick default in furnace), `blasting` (100-tick default in blast furnace, ores/metal-only), `smoking` (100-tick default in smoker, food-only), and `campfire_cooking` (600-tick default on campfire, food-only). All four parse identical JSON: `ingredient` (single ingredient — choice arrays accepted), `result` (a bare item ID string, NOT an ItemStack object — so no count, no NBT), `experience` (float, XP awarded on take-out), `cookingtime` (int ticks; default depends on the type — see above), `group` (optional), `category` (`"food"` / `"blocks"` / `"misc"`).

The four files for baked potato make this concrete: `baked_potato.json` (smelting, 200t), `baked_potato_from_smoking.json` (smoking, 100t), `baked_potato_from_campfire_cooking.json` (campfire, 600t), and there is no blasting variant because potatoes aren't ores. All four share `ingredient: { "item": "minecraft:potato" }` and `result: "minecraft:baked_potato"`. Result-as-string is the gotcha that distinguishes cooking from `crafting_shaped`/`crafting_shapeless`, which want a full ItemStack object.

Note: Forge mods often accept ItemStack objects in the cooking `result` field too, but vanilla's `SimpleCookingSerializer.fromJson` strictly requires a string.

### 6.4 Stonecutter recipes

**`stonecutting`** is a one-input one-output recipe that runs in the Stonecutter UI. Schema: `ingredient` (single ingredient — choice arrays allowed), `result` (a bare item ID string — same shape as cooking), `count` (integer — overrides the default 1, this is how a single block of cobble produces 1 wall but 2 slabs), and optional `group`. There is no `category` field — the stonecutter has no recipe-book categories. `andesite_wall_from_andesite_stonecutting.json` is the minimal form. Vanilla ships hundreds of stonecutter alternates so every variant block can be cut from any other in its set.

### 6.5 Smithing recipes

**`smithing_transform`** rebuilds a base item into a result item using a template + addition. Schema: `template` (ingredient), `base` (ingredient), `addition` (ingredient), `result` (ItemStack object, NBT supported). The result inherits the base item's existing NBT (enchantments, name, damage), then overrides the item ID — that's why a Netherite sword keeps its enchantments. `netherite_sword_smithing.json` uses `netherite_upgrade_smithing_template` + `diamond_sword` + `netherite_ingot` → `netherite_sword`.

**`smithing_trim`** writes trim NBT onto an armor piece without changing the item ID. Schema: `template` (the trim pattern template), `base` (the armor piece — typically `tag: minecraft:trimmable_armor`), `addition` (the trim material — typically `tag: minecraft:trim_materials`). No `result` field at all — the result is the base item with `Trim` NBT baked in, computed by the serializer from the template + addition. See `coast_armor_trim_smithing_template_smithing_trim.json` and the other 15 trim files.

The legacy `minecraft:smithing` type was removed in 1.20; if you find it in a modded data pack it will fail to parse on a vanilla server.

### 6.6 The `category` field

For recipe types that have a recipe book (everything except `stonecutting` and `smithing_*`), `category` is a non-functional UI hint. Crafting categories: `"building"`, `"redstone"`, `"equipment"`, `"misc"`. Cooking categories: `"food"`, `"blocks"`, `"misc"`. The category dictates which sub-tab the recipe appears under and is otherwise inert at runtime. Custom values fall back to `"misc"` silently. The `category` field is required on `crafting_special_*` files even though those recipes never need it for matching, because the deserializer reads it unconditionally — omitting it causes a parse exception on world load.

---

## 7. Worldgen JSON

Worldgen is the densest data-driven system in 1.20.1. Every overworld biome, every cave, every village is a tree of JSON files referencing other JSON files. The system was rebuilt for 1.18 and the layered architecture (density functions feeding noise settings, configured features wrapped by placed features, structure sets as the actual placement layer) is the same architecture you'll see in any modded biome or dimension.

`refs/extracted/data/minecraft/worldgen/` ships 844 vanilla files across 14 registries. The rest of this section walks each registry from the outside in.

### 7.1 Biomes

Biome JSON sits at `worldgen/biome/`. Vanilla ships 64 of them. The schema has six top-level groups: climate, effects, carvers, features, spawners, spawn_costs. The class is `net/minecraft/world/level/biome/Biome` with effects in `BiomeSpecialEffects`, mob settings in `MobSpawnSettings`, and the feature/carver lists in `BiomeGenerationSettings`.

Climate is four flat fields. `temperature` (float, e.g. plains 0.8, soul_sand_valley 2.0, snowy_plains 0.0) drives water-freezing, snow placement, and grass tint. `downfall` (0–1) is the humidity input to grass/foliage tint and rain density. `has_precipitation` (1.20.1+) is the boolean replacement for the old `"precipitation": "none|rain|snow"` string — `precipitation` is now derived from `temperature` (frozen if T < 0.15). `temperature_modifier` is an optional string, only used by frozen oceans, that modulates temperature with a noise mask (`"frozen"`).

`effects` controls everything visual and audio. Every biome must specify `fog_color`, `sky_color`, `water_color`, `water_fog_color` as packed sRGB ints. Optional fields layer on top: `foliage_color` and `grass_color` to override the climate-derived tint, `grass_color_modifier` (`"none"`, `"swamp"`, `"dark_forest"`) for hardcoded post-process, `particle` (`{options, probability}` — soul_sand_valley uses `minecraft:ash` at 0.00625), `ambient_sound` (constant loop, e.g. soul_sand_valley's `ambient.soul_sand_valley.loop`), `mood_sound` (the cave-cricket-style sting, with `block_search_extent`, `offset`, `tick_delay`), `additions_sound` (rare random one-shots, with `tick_chance`), and `music` (`{sound, min_delay, max_delay, replace_current_music}`). See `biome/plains.json` (minimal) vs `biome/soul_sand_valley.json` (every optional effect populated).

`carvers` is keyed by carving step — only `"air"` is used in vanilla; the old `"liquid"` step is gone. Value is either a single carver ID or a list, e.g. `biome/plains.json` lists `cave`, `cave_extra_underground`, `canyon`. Nether biomes substitute `nether_cave`. The carver IDs resolve to `worldgen/configured_carver/`.

`features` is a 10-element array. Each index is a generation step and the engine runs them in order: 0 RAW_GENERATION, 1 LAKES, 2 LOCAL_MODIFICATIONS, 3 UNDERGROUND_STRUCTURES, 4 SURFACE_STRUCTURES, 5 STRONGHOLDS, 6 UNDERGROUND_ORES, 7 UNDERGROUND_DECORATION, 8 FLUID_SPRINGS, 9 VEGETAL_DECORATION, 10 TOP_LAYER_MODIFICATION. Plains for example puts ores in slot 6, springs in slot 8, trees/flowers/grass/pumpkins in slot 9, and `freeze_top_layer` in slot 10 (`biome/plains.json` lines 22–86). Each entry is a placed feature ID. The array length is fixed at 11 in 1.20.1 even though older biomes occasionally show 10; vanilla pads with empty arrays where nothing runs at that step.

`spawners` is the mob spawn table, keyed by **mob category** (the `MobCategory` enum): `monster`, `creature`, `ambient`, `axolotls`, `underground_water_creature`, `water_creature`, `water_ambient`, `misc`. **This is not the same as the spawn-rule split** — mob categories control which weight pool a mob is drawn from (and the per-chunk cap), while a separate registered `SpawnPlacementType` (`ON_GROUND`, `IN_WATER`, `IN_LAVA`, `NO_RESTRICTIONS`) controls *where* it can spawn. A mob category override in a biome JSON only changes weight/min/max; it doesn't bypass the placement type. Each entry is `{type, weight, minCount, maxCount}` (camelCase — note `maxCount`/`minCount`, the only non-snake-case fields in the whole worldgen schema). `spawn_costs` is the secondary "energy budget" system layered on top — see `biome/soul_sand_valley.json` lines 68–85 where ghasts/striders/skeletons/endermen each get `charge: 0.7, energy_budget: 0.15`. Higher charge = more contribution to the local energy field; if total field >= budget, that mob can't spawn there. This is what keeps soul sand valley readable — without it the spawn weights alone would let the area pack with ghasts.

For the supermoon-style "tweak monster spawning under specific conditions" project: the biome JSON is the *baseline* table only. Run-time conditions (moon phase, light level, biome tags, random selectors) require a `LevelEvent.Spawn` mixin or a Forge `LivingSpawnEvent.CheckSpawn` listener — there is no JSON hook for moon phase. (This is roughly why the supermoon project ended up shelved: the data layer doesn't reach that far, and `net/minecraft/world/level/NaturalSpawner.class` does the per-tick work in Java.)

### 7.2 Configured features

`worldgen/configured_feature/` defines *what* generates — the abstract recipe. Schema is `{type, config}`, where `type` is a feature kind from `net/minecraft/world/level/levelgen/feature/Feature.class` and `config` is the feature-specific payload. Vanilla ships ~250 configured features. Common types:

- **`minecraft:tree`** — trunk + foliage placer composite. `configured_feature/oak.json` is the canonical example: `trunk_placer` (here `straight_trunk_placer` with `base_height: 4, height_rand_a: 2, height_rand_b: 0` → trunk is 4–5 blocks), `foliage_placer` (`blob_foliage_placer` with `radius: 2, height: 3`), `trunk_provider`/`foliage_provider`/`dirt_provider` as state providers, `minimum_size` (`two_layers_feature_size`), and `decorators: []` (where you'd attach beehives, cocoa, etc.). Other trunk placers: `forking_trunk_placer`, `mega_jungle_trunk_placer`, `dark_oak_trunk_placer`, `cherry_trunk_placer`, `bending_trunk_placer`. Other foliage placers: `acacia_foliage_placer`, `pine_foliage_placer`, `spruce_foliage_placer`, `mega_pine_foliage_placer`, `dark_oak_foliage_placer`, `cherry_foliage_placer`, `random_spread_foliage_placer`.
- **`minecraft:ore`** — block replacement at a target. `configured_feature/ore_iron.json` shows the dual-stone pattern: `targets` is a list of `{state, target}` pairs where `target` is a block-predicate (`tag_match` here, with `stone_ore_replaceables` for the upper layer and `deepslate_ore_replaceables` for deepslate), and `state` is the resulting block. `size: 9` is the maximum vein blob size; `discard_chance_on_air_exposure: 0.0` controls how aggressively to refuse exposed-to-air placements.
- **`minecraft:disk`** — flat-ish disc of blocks (clay, sand, gravel patches). `disk_clay.json` uses a `state_provider` with rules + fallback, a `target` block-predicate, `radius` IntProvider, and `half_height` for vertical thickness.
- **`minecraft:random_patch` / `minecraft:simple_random_selector` / `minecraft:random_selector`** — wrappers. `random_selector` (`trees_plains.json`) chains a `default` feature with a list of `{chance, feature}` overrides, where the inner `feature` is itself a placed-feature inline (`{feature, placement}`), letting you compose without making a separate placed file.
- **`minecraft:simple_block`** — drops a single state via a `block` provider; useful as a leaf node from a `random_patch`.
- **`minecraft:flower`** / **`minecraft:no_op`** / **`minecraft:block_pile`** — small specialized shapes.
- **`minecraft:geode`** — the amethyst layer system. `amethyst_geode.json` is the most config-heavy vanilla feature: nested layer providers (`outer_layer_provider`, `middle_layer_provider`, `inner_layer_provider`, `alternate_inner_layer_provider`, `filling_provider`), layer thickness scalars, crack params, distribution_points (uniform 3–4), inner_placements list (the bud states), and probability fields like `use_alternate_layer0_chance: 0.083`. If you want to author a custom geode, copy this file wholesale.

State providers (the `..._provider` slots): `simple_state_provider` (one fixed state), `weighted_state_provider` (list of `{weight, data}`), `noise_provider` / `noise_threshold_provider` / `dual_noise_provider` (sample noise to pick a state — used for moss/foliage variation), `randomized_int_state_provider` and `rotated_block_provider` for axis randomization. The `target` slots in ores/disks use block-predicates from `net/minecraft/world/level/levelgen/blockpredicates/`: `tag_match`, `matching_blocks`, `matching_block_tag`, `would_survive`, `solid`, `replaceable`, `not`, `all_of`, `any_of`, `true`.

### 7.3 Placed features

`worldgen/placed_feature/` wraps a configured feature with a list of *placement modifiers* that run sequentially: each modifier takes a stream of positions and returns a stream of positions. The result is the actual block coords the feature is invoked at.

`placed_feature/ore_iron_upper.json` is the textbook ore placement:
```
count: 90 → in_square → height_range (trapezoid 80..384) → biome
```
Read as: emit 90 starting positions per chunk (`count`), randomize each within the chunk's 16x16 footprint (`in_square`), assign a Y from a trapezoidal distribution centered between 80 and 384 (`height_range`), and finally check that the resulting position is still in a biome that lists this feature in its biome JSON (`biome` — the closing modifier on basically every world-decoration placed feature).

`placed_feature/trees_plains.json` is a slightly richer pipeline:
```
count: weighted_list({0:19, 1:1}) → in_square → surface_water_depth_filter(0)
  → heightmap(OCEAN_FLOOR) → block_predicate_filter(would_survive oak_sapling) → biome
```
The weighted_list count means most chunks get 0 trees and ~5% get 1. The `heightmap: OCEAN_FLOOR` modifier snaps Y to the topmost non-fluid solid; `WORLD_SURFACE_WG` is its dry-land cousin used for `OCEAN_FLOOR_WG`, `MOTION_BLOCKING`, `MOTION_BLOCKING_NO_LEAVES` siblings. The `block_predicate_filter` with `would_survive oak_sapling` is the elegant hack that makes trees only generate where a sapling would actually be plantable — checks the block-below tag list. The terminating `biome` filter is what makes the same placed feature reusable across biomes that share the same trees_plains entry without re-registering.

Modifier reference (from `net/minecraft/world/level/levelgen/placement/PlacementModifier.class` subclasses): `count` (fixed or IntProvider), `count_on_every_layer` (count per Y-layer in caves), `rarity_filter` (`{chance: int}` 1-in-N keep), `noise_threshold_count` (count varies with noise), `biome` (in-biome check), `in_square` (random XZ 0..15 offset), `square` (alias), `random_offset` (random XYZ offset with IntProviders), `surface_relative_threshold_filter`, `surface_water_depth_filter`, `heightmap` and `heightmap_world_surface`, `height_range` (HeightProvider — can be `uniform`, `trapezoid`, `biased_to_bottom`, `very_biased_to_bottom`, `weighted_list`), `block_predicate_filter`, `carving_mask`, `environment_scan`. Order matters: a `biome` filter before `in_square` will check the chunk-corner biome, not the per-position biome.

### 7.4 Density functions

The 1.18 caves-and-cliffs rewrite turned terrain shape into a graph of `DensityFunction` objects. Each function maps `(x, y, z) -> double`. `worldgen/density_function/` ships 35 vanilla files, organized into subdirectories: `overworld/`, `overworld_amplified/`, `overworld_large_biomes/`, `nether/`, `end/`, plus loose `shift_x.json`, `shift_z.json`, `y.json`, `zero.json`. The class hierarchy is `net/minecraft/world/level/levelgen/DensityFunction.class` with the operation namespace in `net/minecraft/world/level/levelgen/DensityFunctions.class`.

A density-function JSON is either a literal number (e.g. `density_function/zero.json` is just `0.0`), a string ID referencing another density function, or an object with `type` and operation-specific arguments.

**Operations** (from `DensityFunctions`):
- Pure arithmetic: `add`, `mul`, `min`, `max`, `clamp` (`{input, min, max}`), `abs`, `cube`, `square`, `half_negative` (returns x if x>=0, x/2 otherwise), `quarter_negative` (returns x if x>=0, x/4 otherwise), `squeeze` (s-curve, x/2 + clamp magnitude reduction).
- Caching: `cache_2d` (memoize per XZ column — only valid if the function is Y-independent), `cache_once` (memoize per evaluation), `cache_all_in_cell`, `flat_cache` (sparse 2d sample, cheaper than `cache_2d` for slowly-varying functions). These don't change values, only cost; misuse causes wrong results (`cache_2d` over a Y-dependent func will lock to whatever Y was sampled first).
- Interpolation: `interpolated` wraps a function so the chunk generator samples it on the cell grid (1 sample per 8 vertical, per noise-cell horizontal) and tri-linearly fills between. Cheap-to-evaluate functions don't need this; expensive ones do.
- Sampling: `noise` (`{noise, xz_scale, y_scale}` — references a `worldgen/noise/` parameter), `shifted_noise` (adds `shift_x`/`shift_y`/`shift_z` density-function offsets — used for biome temperature/vegetation jitter), `weird_scaled_sampler` (`type_1` or `type_2` rarity mapping — used by spaghetti caves), `old_blended_noise` (the legacy 2D-perlin terrain backbone used inside `base_3d_noise.json`), `blend_alpha` / `blend_offset` / `blend_density` (engine-injected functions used to merge with old chunk borders during world conversion — don't author from scratch).
- Control flow: `range_choice` (`{input, min_inclusive, max_exclusive, when_in_range, when_out_of_range}`), `y_clamped_gradient` (`{from_y, from_value, to_y, to_value}` linear ramp clamped to ends), `constant`, `spline` (Mojang's interpolated cubic spline — `{coordinate, points}` where each point has `{location, value, derivative}` and value can recursively be another spline keyed on a different coordinate).

**End-to-end walkthrough** — `density_function/overworld/sloped_cheese.json`. This is the function that decides "should this voxel be solid?" before caves carve it. Reading the file:

```
add(
  mul(4.0, quarter_negative(
    mul(
      add(overworld/depth, mul(overworld/jaggedness, half_negative(noise jagged xz=1500))),
      overworld/factor
    )
  )),
  overworld/base_3d_noise
)
```

Unpacking:

1. `overworld/base_3d_noise` is the legacy 3D smear of perlin (`old_blended_noise` with xz_scale 0.25, y_scale 0.125) — this is the chaotic high-frequency "rocky" component.
2. `overworld/depth` (`density_function/overworld/depth.json`) is `y_clamped_gradient(from y=-64 value=1.5, to y=320 value=-1.5) + overworld/offset`. The gradient term means "deep underground is positive (solid), high in the sky is negative (air)" with a smooth ramp. `overworld/offset` is a `flat_cache` of a giant continental-scale spline keyed on `overworld/continents` (offset.json lines 1–60+). The spline turns a continentalness float (-1..1, sampled from the 2D `continentalness` perlin) into a vertical bias — deep ocean is biased downward, inland is biased upward.
3. `overworld/jaggedness` (`density_function/overworld/jaggedness.json`) is another `flat_cache`+`spline` keyed on `continents`/`erosion`/`ridges` — it's zero almost everywhere and ramps up only in mountain biomes.
4. `noise jagged` at xz_scale 1500 is a slow large-scale noise that, when fed through `half_negative`, masks jaggedness so it only kicks in on half the surface (creating ridge lines instead of uniform noise).
5. `overworld/factor` (`density_function/overworld/factor.json`) is the third huge spline — it controls how *fast* depth transitions from positive to negative around sea level. High factor = sharp cliff edges, low factor = soft rolling hills. Mountain biomes peak here at ~6.3, plains sit around 3-5.

So the inner expression `(depth + jaggedness * jagged_noise) * factor` is "the smoothed terrain target", `quarter_negative` softens negative (sky) values so air doesn't get exaggerated, the `mul(4.0, ...)` boosts the entire shape, and `+ base_3d_noise` adds the small-scale chaos.

`sloped_cheese` is then consumed by `noise_settings/overworld.json`'s `final_density` field, which gates it through cave systems (`overworld/caves/entrances`, `overworld/caves/spaghetti_2d`, `overworld/caves/noodle`, `overworld/caves/pillars`) using `range_choice` and `min`/`max` operations to subtract caves from the solid mass. The final value > 0 means "place stone here", value <= 0 means "place water (below sea level) or air". `density_function/overworld/caves/spaghetti_2d.json` is the cleanest example of using `weird_scaled_sampler` and `cube` to make worm-like cave shapes.

Authoring tip: the spline-heavy files (`offset`, `factor`, `jaggedness`, and the per-variant overrides under `overworld_amplified/`) are the right place to retune overall terrain. The `amplified` variant for example is just *these three files* swapped — `overworld_amplified/factor.json` outputs much higher peaks, and the noise_settings/density functions otherwise share the overworld ones.

### 7.5 Noise settings

`worldgen/noise_settings/` has 7 files: `overworld`, `overworld_large_biomes` (uses different `continents` density func), `amplified` (different `depth/factor/jaggedness/sloped_cheese`), `nether`, `end`, `caves`, `floating_islands`. Each combines a **height envelope** (`{height, min_y, size_horizontal, size_vertical}` — overworld is 384 tall starting at y=-64, with cells 4-wide horizontal and 8-tall vertical), a **default block** and **default fluid**, the **noise router** (`final_density`, `initial_density_without_jaggedness`, `barrier`, `fluid_level_floodedness`, `fluid_level_spread`, `lava`, `temperature`, `vegetation`, `continents`, `erosion`, `depth`, `ridges`, `vein_toggle`, `vein_ridged`, `vein_gap` — 15 named slots that the chunk generator queries by name), the **surface rule** (a separate tree of conditions/sequences that paint the top blocks — see surface rule classes), the **spawn target** (used by `/locate biome`), and flags like `aquifers_enabled`, `ore_veins_enabled`, `legacy_random_source`, `disable_mob_generation`. See `noise_settings/overworld.json` for the full vein/cave assembly inlined into `final_density`.

### 7.6 Structures and structure sets

The structure system has two layers: the **structure** (what the building looks like, where it can spawn biome-wise, what step it generates at) and the **structure set** (where in the world it spawns spatially).

`worldgen/structure/` has 33 vanilla entries. Schema fields common to all:
- `type` — the structure kind: `jigsaw` (villages, pillager outpost, bastion remnant, ancient city, trail ruins, ruined portal), `buried_treasure`, `desert_pyramid`, `end_city`, `fortress`, `igloo`, `jungle_temple`, `mineshaft`, `nether_fossil`, `ocean_monument`, `ocean_ruin`, `shipwreck`, `stronghold`, `swamp_hut`, `woodland_mansion`. Of these, only `jigsaw` and `mineshaft` actually take config beyond the wrapper fields.
- `biomes` — biome ID list or `#tag`. `village_plains.json` uses `#minecraft:has_structure/village_plains`.
- `step` — generation step (`surface_structures`, `underground_structures`, `underground_decoration`, `strongholds`).
- `spawn_overrides` — per-mob-category overrides, e.g. fortress uses this to inject pigman spawning.
- `terrain_adaptation` — how the engine treats the terrain around the structure: `none`, `beard_thin` (gentle skirt — used for villages), `beard_box`, `bury` (igloo/buried treasure), `encapsulate` (ancient city).

For jigsaw structures additionally: `start_pool` (the entry template pool), `size` (recursion depth — village plains is 6, pillager outpost is 7, bastion is 6, ancient city is 7), `start_height` (Y constraint — `{absolute: int}` or `{above_bottom: int}`), `max_distance_from_center`, `project_start_to_heightmap` (Y-snap to a heightmap, e.g. `WORLD_SURFACE_WG`), `use_expansion_hack` (the dirty hack that lets large jigsaw structures route around chunk boundaries — leave at `true`).

`worldgen/structure_set/` is the placement layer. `villages.json` shows the `random_spread` placement: `{type, salt, separation, spacing}` — a chunk is a structure-candidate if `(chunkX % spacing, chunkZ % spacing)` lies within `[0, spacing - separation)` of the seeded grid origin. Spacing 34 / separation 8 means villages average 34 chunks apart with at least 8 chunks of guaranteed clearance. `salt` is the per-set chunk-hash seed — **never duplicate salts between sets** or you'll get correlated placements (this is why every vanilla set uses a different value: 10387312, 14357617, 0, etc.).

`structure_set/strongholds.json` uses the alternate placement type `concentric_rings`: `{count: 128, distance: 32, spread: 3, preferred_biomes: "#minecraft:stronghold_biased_to"}`. This is the ring-of-strongholds-around-spawn behavior — only used by strongholds in vanilla.

`structure_set/buried_treasures.json` shows the `frequency` field — when present, it's a 0..1 keep-probability applied after the spacing grid hits, and `frequency_reduction_method` (`"default"`, `"legacy_type_1"`, `"legacy_type_2"`, `"legacy_type_3"`) selects the rolling algorithm. `legacy_type_2` matches pre-1.18 behavior. `locate_offset` is the per-piece XZ offset applied so `/locate structure` doesn't always point you to the corner.

A structure set can list multiple structures with weights (`structure_set/villages.json` lists all 5 village biome-variants at weight 1) — the placement grid is shared, and at each successful candidate the engine picks one structure by weight. This is how the engine guarantees village-style structures don't overlap themselves: same set, same grid.

### 7.7 Template pools, jigsaw pieces, processor lists

Jigsaw structures recursively glue together pieces from `worldgen/template_pool/`. A template pool JSON lists `elements`, each `{element: {element_type, location, processors, projection}, weight: int}`. `element_type` is one of `legacy_single_pool_element` (the common case, references an NBT structure), `single_pool_element`, `feature_pool_element` (places a configured feature), `list_pool_element` (chains multiple), or `empty_pool_element`. `location` is the NBT structure path (e.g. `village/plains/town_centers/plains_fountain_01` resolves to `data/minecraft/structures/village/plains/town_centers/plains_fountain_01.nbt`). `projection` is `rigid` (no Y-snap, used for surface buildings) or `terrain_matching` (each block independently snaps to terrain — used for paths). `processors` references a processor list ID or inlines `{processors: [...]}`.

Pieces connect via "jigsaw" blocks placed inside the NBT — each jigsaw block has a target name and a target pool, and during generation the engine matches up jigsaw blocks across pieces by name and recurses into the target pool. `template_pool/village/plains/town_centers.json` is the entry point for plains villages; from a fountain or meeting point its jigsaw blocks reach into `village/plains/streets` and `village/plains/houses`. The structure's `size` field caps recursion depth.

`worldgen/processor_list/` has 38 vanilla entries. A processor runs over each block in a pasted NBT structure and can replace, drop, or transform blocks. Each list has `{processors: [...]}` where each processor has `processor_type` and type-specific config. Common types:
- `minecraft:rule` — pattern-match a block, optionally check a location predicate, and emit an output state. `processor_list/mossify_20_percent.json`: a single rule that catches cobblestone with a 20% random_block_match probability and emits mossy_cobblestone.
- `minecraft:rule` with `tag_match` input — `processor_list/zombie_plains.json` chains rules: 80% mossify cobblestone, then strip doors (output air) for the abandoned-village zombie variant.
- `minecraft:block_rot`, `minecraft:capped` (caps how many transformations the list will perform — used in some farm/road processors), `minecraft:protected_blocks`, `minecraft:block_age` (used by ruined portals), `minecraft:lava_submerged_block`, `minecraft:block_ignore`, `minecraft:gravity` (used in trail ruins).

Honest uncertainty flag: the jigsaw block-ID system, the `pool_alias_binding` field (it appears on some 1.20.1 structure-set placements but isn't documented in vanilla files), and how `liquid_settings`/`projection` interact with biome-derived terrain are the spots where vanilla data and class names disagree most. If you're authoring custom jigsaw structures, prefer to clone an existing pool tree wholesale and edit names — building one from scratch from spec is brittle.

### 7.8 Configured carvers

`worldgen/configured_carver/` has 4 entries: `cave`, `cave_extra_underground` (deeper-only variant), `canyon` (ravines), `nether_cave`. The class is `net/minecraft/world/level/levelgen/carver/`. Schema is `{type, config}`.

Cave config (`configured_carver/cave.json`): `probability` (0.15 = ~15% of chunk-candidates carve a cave), `y` (HeightProvider for start altitude), `yScale` (vertical stretch), `lava_level` (where lava floors form), `replaceable` (the block tag that may be replaced — `#minecraft:overworld_carver_replaceables`), and shape multipliers (`horizontal_radius_multiplier`, `vertical_radius_multiplier`, `floor_level`).

Canyon (ravine) config adds a `shape` block with `thickness` (trapezoid), `width_smoothness`, `distance_factor`, `horizontal_radius_factor`, `vertical_radius_default_factor`, `vertical_radius_center_factor` — the geometry of the ravine slice. Plus `vertical_rotation` for the gentle Y-snake of long ravines. `debug_settings` is a development-only block that lets you visualize what the carver did (stained glass for water, buttons for air) — every vanilla file ships these populated but they're inert at runtime.

### 7.9 Multi-noise biome source and presets

`worldgen/multi_noise_biome_source_parameter_list/` has just two files: `overworld.json` and `nether.json`. Both are one-line redirects: `{"preset": "minecraft:overworld"}`. The actual climate-to-biome table lives in code (`net/minecraft/world/level/biome/MultiNoiseBiomeSourceParameterList`'s preset constants). The biome source samples six climate noises — temperature, humidity, continentalness, erosion, depth, weirdness — and each biome occupies a multi-dimensional rectangle in that 6D space. To override, you'd use a non-preset multi-noise source spec inline in a dimension generator, with full `biomes: [{biome, parameters: {...}}, ...]` tables. Modded biome packs like Terralith or Biomes O' Plenty bypass the preset entirely and ship their own list.

### 7.10 World presets and flat presets

`worldgen/world_preset/` has 6 files: `normal`, `large_biomes`, `amplified`, `flat`, `single_biome_surface`, `debug_all_block_states`. Each defines the three dimensions (`overworld`, `the_nether`, `the_end`) with `{type, generator: {type, biome_source, settings}}` blocks. `world_preset/normal.json` is the canonical wiring: overworld uses `multi_noise` biome source with `preset: minecraft:overworld` and `settings: minecraft:overworld`; nether mirrors that with the nether preset; the_end uses the special `the_end` biome source and `settings: minecraft:end`.

`worldgen/flat_level_generator_preset/` has 9 files (`classic_flat`, `desert`, `redstone_ready`, `tunnelers_dream`, `bottomless_pit`, `the_void`, `water_world`, `overworld`, `snowy_kingdom`). Schema is small: `{display, settings: {biome, layers: [{block, height}], features, lakes, structure_overrides}}`. `classic_flat.json` is bedrock-1, dirt-2, grass-1, biome plains, features off, lakes off, structures villages-only.

### 7.11 Misc worldgen registries (brief)

- `worldgen/noise/` — named noise parameter sets (`{firstOctave, amplitudes}`) referenced by density functions.
- `worldgen/configured_world_carver/` — alias of configured_carver in older snapshots; not present here.
- `worldgen/density_function/` and `worldgen/noise_settings/` are the only worldgen registries the engine reads at generator-construction time; everything else is read lazily as needed.

---

## 8. Other data

### 8.1 chat_type

`data/minecraft/chat_type/` has 7 files defining how messages are styled and narrated. Each has `chat` (the visible rendering) and optionally `narration` (TTS), each with `parameters` (which of `sender`, `target`, `content` to substitute) and `translation_key` (the lang-file format string). `chat_type/chat.json` is the player-to-player chat format using `chat.type.text`. `say_command.json`, `emote_command.json`, `msg_command_incoming/outgoing.json`, and the team variants are the other 6. Style overrides go through the `style` field (a `Style` JSON: color, formatting, hover/click events), absent in vanilla. Adding a custom chat type is rare in modding — most chat customization happens through Forge events on `ServerChatEvent`.

### 8.2 damage_type

`data/minecraft/damage_type/` has 44 files. The 1.19.4+ damage system replaced a hardcoded `DamageSource` enum with this datapack registry. Schema:

- `message_id` (string, required) — joins with `death.attack.<message_id>` for the death message lang key.
- `exhaustion` (float) — hunger drain when this damage is taken (0.1 for lava/most physical, 0.0 for environment damage like `fall`/`sonic_boom`).
- `scaling` (enum) — `never`, `always`, or `when_caused_by_living_non_player`. Controls whether difficulty scales the damage. Most damage uses `when_caused_by_living_non_player` so peaceful creatures still take it but mobs hit harder on hard.
- `effects` (optional enum) — vanilla supports `hurt`, `thorns`, `drowning`, `burning`, `poking`, `freezing`. Picks the camera shake / visual / audio cue. `damage_type/lava.json` uses `"burning"` to apply the fire effect.
- `death_message_type` (optional enum) — `default`, `fall_variants`, `intentional_game_design`. `fall_variants` swaps in the climbed-too-high/ladder/vines/etc. messages; only `damage_type/fall.json` uses it. `intentional_game_design` is the bed-explosion easter egg.

Damage type *tags* (`data/minecraft/tags/damage_type/`) are the actual gameplay hooks — `bypasses_armor`, `bypasses_invulnerability`, `is_fire`, `is_freezing`, `is_projectile`, `damages_helmet`, `witch_resistant_to`, etc. The damage_type JSON is just metadata; the tags drive resistance and immunity calculations.

### 8.3 dimension_type

`data/minecraft/dimension_type/` has 4 files. The dimension type controls everything about a dimension *except* terrain shape (which lives in noise_settings). Fields in `dimension_type/overworld.json`:

- `min_y` (-64), `height` (384), `logical_height` (384) — vertical extent. `logical_height` caps things like nether portals and pearl-throwing teleport bounds; can be smaller than `height`.
- `coordinate_scale` (1.0 overworld, 8.0 nether — the portal ratio).
- `bed_works`, `respawn_anchor_works`, `piglin_safe`, `has_raids`, `natural` (controls compass spinning, water evaporation), `ultrawarm` (water evaporates, sponge dries instantly — `the_nether.json` is the only ultrawarm dim), `has_skylight`, `has_ceiling`.
- `ambient_light` (0.0 overworld, 0.1 nether — base lightmap floor).
- `fixed_time` (optional — nether locks to 18000, the_end to 6000; overworld omits it for day/night).
- `monster_spawn_light_level` — IntProvider (overworld is `uniform 0..7`, nether is just `7`). The new pack-mob-spawn-light system replacing the old `<= 7` hardcode.
- `monster_spawn_block_light_limit` — int (0 overworld, 15 nether) — the per-block light ceiling above which monsters can't spawn.
- `infiniburn` — block tag for the "burns forever" bedrock-fire blocks at the bottom of the world.
- `effects` — string ID picking the sky renderer: `minecraft:overworld`, `minecraft:the_nether`, `minecraft:the_end`. This is hardcoded in client; a custom dimension can only choose one of these three skyboxes.

### 8.4 trim_material and trim_pattern

The 1.20 armor trim system is split across two registries.

`data/minecraft/trim_material/` has 10 files (one per ingredient: amethyst, copper, diamond, emerald, gold, iron, lapis, netherite, quartz, redstone). Each defines: `asset_name` (the texture suffix used to look up `assets/minecraft/textures/trims/items/<pattern>_<asset_name>.png`), `description` (a JSON text component — `diamond.json` has `{color: "#6EECD2", translate: "trim_material.minecraft.diamond"}`), `ingredient` (the item that makes this trim), `item_model_index` (the `trim_type` model predicate threshold — diamond is 0.8, gold 0.5, etc.), and `override_armor_materials` (per-armor-material color override map — diamond on diamond armor uses the "diamond_darker" suffix to stay readable, every other material doesn't override).

`data/minecraft/trim_pattern/` has 16 files, one per template. Each has `asset_id` (the texture base name — `coast.json` is `minecraft:coast`, resolves to `textures/trims/models/armor/coast.png`), `description` (JSON text component for the tooltip), `template_item` (the smithing template item that applies this pattern). Decoupling pattern from material lets the smithing crafting recipe combine any pattern with any material.

### 8.5 datapacks (built-in)

`data/minecraft/datapacks/` has two built-in datapacks, both shipped inside the vanilla jar and toggled via the world-creation feature flags / `/datapack` commands.

- `bundle/` — gates the bundle item behind the experimental feature flag. `bundle/pack.mcmeta` declares `pack_format: 15` and `features.enabled: ["minecraft:bundle"]`. The pack contains the bundle recipe and recipe-advancement so they only register when the flag is on. This is the standard way Mojang ships unfinished features in 1.20.x.
- `update_1_20/` — the 1.20 update pack pattern (cherry blocks, archaeology, sniffer, trim system) was built-in during 1.19.4 betas and ships empty/absent in extracted 1.20.1 since the features have shipped to the base game. If you see `update_1_20/` referenced in mod code, that mod is targeting 1.19.4-snapshot behavior.

For modpack authoring this means: the `enabled_features` list in `level.dat` (or world creation flags) determines whether bundle/etc. are usable — toggling them ships extra recipes/items into the game without changing data files, by activating a built-in datapack.

---

## 9. Block + item + registry mechanics

This section is a class-level summary of the substrate that everything else in the game (loot, recipes, worldgen, AI) ultimately points at. None of this is data-driven from a datapack alone — registry contents come from Java code (vanilla, Forge, or a mod) and only the *modifications* to default behavior (tags, loot tables, recipes) are JSON. Where Forge gives you a hook to extend without a mixin, that's called out.

### 9.1 The vanilla registry tree

`net/minecraft/core/registries/Registries.class` holds a `ResourceKey<Registry<T>>` for every vanilla registry. `BuiltInRegistries` (in the same package) holds the static registries — the ones populated at class-load time, like blocks and items. Dynamic / data-driven registries (biomes, dimension types, configured features, density functions, etc.) are the worldgen and synced datapack stuff; they are loaded from `data/<namespace>/worldgen/...`, `data/<namespace>/dimension_type/`, and so on, into a `RegistryAccess` per-server.

The full vanilla registry list, exactly as named in `Registries.class`:

**Static (built-in, code-defined, registered at startup):**
`activity`, `attribute`, `banner_pattern`, `block`, `block_entity_type`, `block_predicate_type`, `cat_variant`, `chunk_status`, `command_argument_type`, `creative_mode_tab`, `custom_stat`, `decorated_pot_patterns`, `entity_type`, `float_provider_type`, `fluid`, `frog_variant`, `game_event`, `height_provider_type`, `instrument`, `int_provider_type`, `item`, `loot_condition_type`, `loot_function_type`, `loot_nbt_provider_type`, `loot_number_provider_type`, `loot_pool_entry_type`, `loot_score_provider_type`, `memory_module_type`, `menu`, `mob_effect`, `painting_variant`, `particle_type`, `point_of_interest_type`, `position_source_type`, `pos_rule_test`, `potion`, `recipe_serializer`, `recipe_type`, `rule_block_entity_modifier`, `rule_test`, `schedule`, `sensor_type`, `sound_event`, `stat_type`, `villager_profession`, `villager_type`.

**Worldgen (mostly static type-registries, some dynamic content):**
`worldgen/biome_source`, `worldgen/block_state_provider_type`, `worldgen/carver`, `worldgen/chunk_generator`, `worldgen/density_function_type`, `worldgen/feature`, `worldgen/feature_size_type`, `worldgen/foliage_placer_type`, `worldgen/material_condition`, `worldgen/material_rule`, `worldgen/placement_modifier_type`, `worldgen/root_placer_type`, `worldgen/structure_piece`, `worldgen/structure_placement`, `worldgen/structure_pool_element`, `worldgen/structure_processor`, `worldgen/structure_type`, `worldgen/tree_decorator_type`, `worldgen/trunk_placer_type`.

**Dynamic (datapack-loaded `RegistryAccess` registries — these you can override with JSON):**
`worldgen/biome`, `chat_type`, `worldgen/configured_carver`, `worldgen/configured_feature`, `worldgen/density_function`, `damage_type`, `dimension_type`, `dimension`, `worldgen/flat_level_generator_preset`, `worldgen/noise_settings`, `worldgen/noise`, `worldgen/placed_feature`, `worldgen/structure`, `worldgen/processor_list`, `worldgen/structure_set`, `worldgen/template_pool`, `trim_material`, `trim_pattern`, `worldgen/world_preset`, `worldgen/multi_noise_biome_source_parameter_list`, `enchantment`.

The split matters: dynamic registries are reloadable from datapacks and ship as JSON files at the listed paths. Static registries are only modifiable from Java (mods register into them at `RegisterEvent` time) — but you can still tag and reference their entries from JSON.

### 9.2 Block properties and BlockState

Every block instance is a `Block` (`net/minecraft/world/level/block/Block.class`) constructed with `BlockBehaviour.Properties` — the immutable "this is what this block is" object. Properties include:

- **Material/sound** — `Properties.of(...)` once took a `Material`; in 1.20.1 the `Material` class is gone and you instead set `mapColor`, `pushReaction`, `instrument`, `replaceable`, and `liquid` directly. `sound(SoundType)` sets break/place/step sounds.
- **Hardness/resistance** — `strength(hardness, resistance)`. Hardness is mining time multiplier, resistance is blast resistance.
- **Light/transparency** — `lightLevel(state -> int)` is per-state, `noOcclusion()` opts out of occlusion culling, `isViewBlocking`/`isSuffocating` are predicate-driven.
- **Friction/slipperiness** — `friction(float)`. Default 0.6, ice is ~0.98.
- **Special** — `noLootTable()`, `dropsLike(Block)`, `randomTicks()`, `requiresCorrectToolForDrops()`, `noCollission()`, `dynamicShape()`, `air()`.

The state machinery is in `net/minecraft/world/level/block/state/`:

- `BlockState` is the immutable `<block, property->value>` tuple. Vanilla compresses these into a flat array of `BlockState` objects so reference equality works.
- `Property<T>` (and concrete `BooleanProperty`, `EnumProperty<E>`, `IntegerProperty`, `DirectionProperty`) is registered in the block's `createBlockStateDefinition(Builder)` override. The properties become the dropdown of a blockstate JSON file's `variants` keys (`facing=north,powered=true`).
- The blockstate JSON in `assets/<ns>/blockstates/<id>.json` is purely *visual* — it maps BlockState combinations to model files. The state list itself is fixed in Java; you cannot add a property from JSON.

Behavior overrides live on the block class: `use`, `tick`, `randomTick`, `getDrops`, `playerWillDestroy`, `neighborChanged`. None of these are data-driven by default; mods must subclass or use the very limited `BlockEvent` family on the Forge bus.

### 9.3 BlockEntity (the per-position state container)

When a block has to remember more than its blockstate fits, it gets a `BlockEntity` (`net/minecraft/world/level/block/entity/BlockEntity.class`). The `BlockEntityType<T>` (`BlockEntityType.class`) is registered in `Registries.BLOCK_ENTITY_TYPE` and lists the blocks it's allowed to attach to.

Ticking is opt-in: implement `EntityBlock.getTicker(level, state, type)` on the block class to return a `BlockEntityTicker<T>` (`net/minecraft/world/level/block/entity/BlockEntityTicker.class`). The ticker runs once per game tick on whatever side it was registered for (`BaseEntityBlock.createTickerHelper` is the standard helper).

NBT serialization happens in `load(CompoundTag)` and `saveAdditional(CompoundTag)`. There's no JSON-level extension here; new block entities require Java.

### 9.4 Item properties and food

`Item.Properties` (`net/minecraft/world/item/Item$Properties.class`) is the item equivalent of `BlockBehaviour.Properties`:

- `stacksTo(int)` — stack size, default 64.
- `durability(int)` / `defaultDurability(int)` — also implies `stacksTo(1)`.
- `rarity(Rarity)` — `COMMON`, `UNCOMMON`, `RARE`, `EPIC`. Drives name color in tooltips.
- `food(FoodProperties)` — see below.
- `craftRemainder(Item)` — what gets left in the crafting grid (buckets, bottles).
- `fireResistant()` — won't burn as a dropped `ItemEntity` (different from the wearer-burn protection on Netherite armor, which is hardcoded).
- `tab(CreativeModeTab)` — *removed* in 1.19.3+; in 1.20.1 you register items into tabs via `BuildCreativeModeTabContentsEvent` (Forge) instead.

`FoodProperties` (`net/minecraft/world/food/FoodProperties.class`) is built via `FoodProperties.Builder`: `nutrition(int)`, `saturationMod(float)`, `meat()` (predator AI bait), `alwaysEat()`, `fast()`, `effect(Supplier<MobEffectInstance>, float chance)`. The effect supplier is per-bite, not per-item, and the chance is rolled when the bite finishes.

Behavior overrides (`use`, `useOn`, `releaseUsing`, `finishUsingItem`, `getUseDuration`, `getUseAnimation`, `inventoryTick`) are again Java-side.

### 9.5 Forge capabilities

The capability system is Forge's answer to "I want to attach an arbitrary handler to a block entity / entity / itemstack without subclassing it." All paths and method signatures below were verified against `refs/forge-1.20.1-47.4.20-universal.jar` (extracted to `refs/extracted/forge/`).

**Core types** (in `net/minecraftforge/common/capabilities/`):

- `Capability<T>` (`Capability.class`) — the generic key. Instances aren't constructed by mods; they're obtained from `CapabilityManager.get(CapabilityToken<T>)` (`CapabilityManager.class`, `CapabilityToken.class`). The `CapabilityToken<T>` is an anonymous inner class — `new CapabilityToken<MyHandler>() {}` — Forge reflects on its generic supertype to derive the concrete `T` at registration time. This is why every cap site uses that trick instead of a plain class literal.
- `ICapabilityProvider` (`ICapabilityProvider.class`) — interface implemented by the host object. Single method: `getCapability(Capability<T>, Direction)` returns **`LazyOptional<T>`** (`net/minecraftforge/common/util/LazyOptional.class`), **not the handler directly**. Callers have to `.resolve().ifPresent(...)` or `.orElse(default)`. The lazy-optional layer is what lets caps be invalidated when the host object goes away (block broken, entity unloaded) without breaking holders of the reference.
- `CapabilityProvider<O>` (`CapabilityProvider.class`) — abstract base that mods can extend on their own block entities or entities, providing convenience plumbing.
- `ForgeCapabilities` (`ForgeCapabilities.class`) — holds the four built-in standard caps as `public static final Capability<...>` fields: `ITEM_HANDLER`, `FLUID_HANDLER`, `FLUID_HANDLER_ITEM`, `ENERGY`. Initialized via `CapabilityManager.get(new CapabilityToken<...>(){})`.

**Standard handler interfaces** (verified method lists):

- `net/minecraftforge/items/IItemHandler.class` — slotted item I/O. Methods: `getSlots()`, `getStackInSlot(int)`, `insertItem(int, ItemStack, boolean simulate)`, `extractItem(int, int amount, boolean simulate)`, `getSlotLimit(int)`, `isItemValid(int, ItemStack)`. Used by every chest-like inventory in modded Minecraft.
- `net/minecraftforge/fluids/capability/IFluidHandler.class` — tank I/O, `FluidStack` units. Methods: `getTanks()`, `getFluidInTank(int)`, `getTankCapacity(int)`, `isFluidValid(int, FluidStack)`, `fill(FluidStack, FluidAction)`, `drain(FluidStack | int, FluidAction)`.
- `net/minecraftforge/energy/IEnergyStorage.class` — Forge Energy (FE), the de-facto modded energy unit. Methods: `receiveEnergy(int, boolean simulate)`, `extractEnergy(int, boolean simulate)`, `getEnergyStored()`, `getMaxEnergyStored()`, `canExtract()`, `canReceive()`. Default implementation at `net/minecraftforge/energy/EnergyStorage.class`; sentinel empty implementation at `EmptyEnergyStorage.class`.

**Attaching caps to instances you don't own** uses `AttachCapabilitiesEvent<T>` (`net/minecraftforge/event/AttachCapabilitiesEvent.class`). The event is generic on the host type — `<Entity>`, `<BlockEntity>`, `<ItemStack>`, `<Level>`, `<Chunk>` are the common parameterizations. Methods: `getObject()` (the host being attached to), `addCapability(ResourceLocation, ICapabilityProvider)`, `getCapabilities()`. This is how, e.g., curios slots get added to players: a capability is attached to every `Player` at construction time. Datapacks cannot hook this — it's Java-only.

**Registering new caps** (your own custom interfaces) uses `RegisterCapabilitiesEvent` (`net/minecraftforge/common/capabilities/RegisterCapabilitiesEvent.class`), which exposes `register(Class<?>)` / `register(Class<?>, IStorage<?>)`-style methods that route into `CapabilityManager`. Built-in caps register themselves; mods only need this event for their own.

**Helpers worth knowing**:
- `net/minecraftforge/items/ItemHandlerHelper.class` — static utilities: `insertItem(IItemHandler, ItemStack, boolean)`, `copyStackWithSize(...)`, `canItemStacksStack(...)`, etc.
- `net/minecraftforge/fluids/FluidUtil.class` — fill/drain bucket helpers, container-to-tank transfer, etc.

**For Novus's purposes**, capabilities mostly matter when KubeJS / CraftTweaker ask "what can this block entity do?" Both have wrappers that internally call `getCapability` and unwrap the `LazyOptional`. Pure-data patches don't touch caps at all.

---

## 10. Entity + AI internals

Vanilla mob AI ships in two parallel systems. Older mobs (zombies, cows, creepers, ~85% of the bestiary) use the `GoalSelector` system. Newer mobs (villager, axolotl, frog, allay, sniffer, warden, piglin family) use `Brain`. They coexist on the same entity — `Mob` carries both — but each species typically uses only one. From a modder's perspective, hooks for the goal system are easy to add at runtime; hooks for the brain system are mostly Java-only.

### 10.1 Goals and the GoalSelector

Each `Mob` owns two `GoalSelector`s (`net/minecraft/world/entity/ai/goal/GoalSelector.class`): `goalSelector` (general behavior) and `targetSelector` (acquire-attack-target behavior). Both are keyed by integer priority — *lower is higher*. The selector ticks every game tick and runs the highest-priority compatible goals.

A `Goal` (`Goal.class`) has:
- `canUse()` — start condition.
- `canContinueToUse()` — continue condition (checked each tick after start).
- `start()`, `tick()`, `stop()` — lifecycle.
- `getFlags()` — a `Set<Goal.Flag>`: `MOVE`, `LOOK`, `JUMP`, `TARGET`. Two goals with overlapping flag sets are mutually exclusive at the same tick — that's the **mutex system**. So `MeleeAttackGoal` (MOVE, LOOK) blocks `RandomStrollGoal` (MOVE) but not `LookAtPlayerGoal` (LOOK only — they share LOOK and so are mutex too actually).

Major goal classes (under `net/minecraft/world/entity/ai/goal/`):

- **Movement / idle** — `RandomStrollGoal`, `WaterAvoidingRandomStrollGoal`, `WaterAvoidingRandomFlyingGoal`, `RandomSwimmingGoal`, `RandomLookAroundGoal`, `LookAtPlayerGoal`, `FloatGoal` (swim up out of water), `JumpGoal`, `RandomStandGoal`, `ClimbOnTopOfPowderSnowGoal`.
- **Combat / target acquisition** — `MeleeAttackGoal`, `RangedAttackGoal`, `RangedBowAttackGoal`, `RangedCrossbowAttackGoal`, `LeapAtTargetGoal`, `ZombieAttackGoal`, `OcelotAttackGoal`, `AvoidEntityGoal<T>` (the universal "run from"), `PanicGoal`. Target acquisition uses `NearestAttackableTargetGoal`, `HurtByTargetGoal` (lives in `target/` subpackage), `OwnerHurtByTargetGoal`, etc.
- **Sun-aware** — `FleeSunGoal` (zombie/skeleton — find shade when daylight burns), `RestrictSunGoal` (don't stroll into sun in the first place).
- **Animal/breeding** — `BreedGoal`, `FollowParentGoal`, `TemptGoal`, `EatBlockGoal` (sheep grazing).
- **Path/villager** — `MoveTowardsRestrictionGoal`, `MoveBackToVillageGoal`, `MoveThroughVillageGoal`, `StrollThroughVillageGoal`, `GolemRandomStrollInVillageGoal`, `OpenDoorGoal`, `BreakDoorGoal`, `DoorInteractGoal`.
- **Block-targeted** — `MoveToBlockGoal`, `RemoveBlockGoal`, `TryFindWaterGoal`.
- **Flock / social** — `FollowMobGoal`, `FollowFlockLeaderGoal`, `FollowOwnerGoal`, `FollowBoatGoal`, `LandOnOwnersShoulderGoal`, `OfferFlowerGoal` (iron golem), `BegGoal` (wolf), `TradeWithPlayerGoal`, `LookAtTradingPlayerGoal`.
- **Mob-specific** — `SwellGoal` (creeper), `LlamaFollowCaravanGoal`, `RunAroundLikeCrazyGoal` (untamed horse), `DolphinJumpGoal`, `PathfindToRaidGoal`, `CatLieOnBedGoal`, `CatSitOnBlockGoal`, `SitWhenOrderedToGoal`, `UseItemGoal`.

`net/minecraft/world/entity/ai/goal/target/` has the target-selection counterparts: `NearestAttackableTargetGoal`, `NearestHealableRaiderTargetGoal`, `DefendVillageTargetGoal`, `HurtByTargetGoal`, etc.

**Forge data-driven hook**: you can add or remove goals at runtime via the `EntityJoinLevelEvent` (`net/minecraftforge/event/entity/EntityJoinLevelEvent.class`) on the Forge bus. Every mob spawning into a level fires this event, and at that point its goal selectors are mutable. KubeJS exposes this as `EntityEvents.spawned`; this is the primary lever Novus has for retuning vanilla mob AI.

### 10.2 Brain, memories, sensors, and schedules

The `Brain<E>` system (`net/minecraft/world/entity/ai/Brain.class`) is fundamentally different. Instead of polling `canUse()` on every goal every tick, it:

1. **Sensors** populate **memories** at fixed intervals.
2. The current **activity** dictates which **behaviors** are eligible.
3. Each behavior (also called a "task") reads from the memory map and writes back to it.

The whole thing is data-flow rather than control-flow. Behaviors live in `net/minecraft/world/entity/ai/behavior/` and there are over a hundred — most are species-specific. Examples: `MoveToTargetSink`, `LookAtTargetSink`, `MeleeAttack`, `RunOne`, `OneShot`, `SetWalkTargetFromAttackTargetIfTargetOutOfReach`. `BehaviorControl` is the runtime interface; `OneShot.create(...)` and the `BehaviorBuilder` DSL are the construction front-ends.

**Sensors** (`net/minecraft/world/entity/ai/sensing/SensorType.class` registers them):

`dummy`, `nearest_items`, `nearest_living_entities`, `nearest_players`, `nearest_bed`, `hurt_by`, `villager_hostiles`, `villager_babies`, `secondary_pois`, `golem_detected`, `piglin_specific_sensor`, `piglin_brute_specific_sensor`, `hoglin_specific_sensor`, `nearest_adult`, `axolotl_attackables`, `axolotl_temptations`, `goat_temptations`, `frog_temptations`, `camel_temptations`, `frog_attackables`, `is_in_water`, `warden_entity_sensor`, `sniffer_temptations`.

**Memory module types** (sample from `MemoryModuleType.class` — there are over 80; the list below covers the structural ones):

`home`, `job_site`, `potential_job_site`, `meeting_point`, `secondary_job_site`, `mobs`, `visible_mobs`, `nearest_players`, `nearest_visible_player`, `nearest_visible_targetable_player`, `walk_target`, `look_target`, `attack_target`, `attack_cooling_down`, `interaction_target`, `breed_target`, `ride_target`, `path`, `interactable_doors`, `doors_to_close`, `nearest_bed`, `hurt_by`, `hurt_by_entity`, `avoid_target`, `nearest_hostile`, `nearest_attackable`, `hiding_place`, `heard_bell_time`, `last_slept`, `last_woken`, `last_worked_at_poi`, `nearest_visible_adult`, `nearest_visible_wanted_item`, `nearest_visible_nemesis`, `is_tempted`, `tempting_player`, `temptation_cooldown_ticks`, `is_pregnant`, `is_panicking`, `angry_at`, `universal_anger`, `admiring_item`, `hunted_recently`, `celebrate_location`, `dancing`, `nearby_adult_piglins`, `nearest_repellent`, `pacified`, `roar_target`, `disturbance_location`, `recent_projectile`, `is_sniffing`, `is_emerging`, `liked_player`, `liked_noteblock`, `sniffer_explored_positions`, `sniffer_sniffing_target`, `sniffer_digging`, `sniffer_happy`. (Many more; the specific ones for piglin/warden/sniffer are species-named.)

Memories are typed (`MemoryModuleType<T>`) and have an `ExpirableValue<T>` wrapper that supports time-to-live in ticks; this is how a sensor can write "I saw a wolf 60 ticks ago" and have it auto-clear.

**Activities** (`net/minecraft/world/entity/schedule/Activity.class`): `CORE`, `IDLE`, `WORK`, `PLAY`, `REST`, `MEET`, `PANIC`, `RAID`, `PRE_RAID`, `HIDE`, `FIGHT`, `CELEBRATE`, `ADMIRE_ITEM`, `AVOID`, `RIDE`, `PLAY_DEAD`, `LONG_JUMP`, `RAM`, `TEMPT`, `DIG`, `EMERGE`, `ROAR`, `SNIFF`, `INVESTIGATE`. A villager's `Schedule` (`Schedule.class`) maps time-of-day → activity.

You cannot add a new memory type, sensor, or activity from a datapack — these are static-registry entries created at code-load time. The only data-driven knobs are the schedule files and (less directly) gameplay flags. Forge gives you no general "modify a brain at runtime" event; mods that retune brain mobs ship mixins into the species-specific `brain.class`.

### 10.3 Pathfinding

`net/minecraft/world/entity/ai/navigation/PathNavigation.class` is the abstract base. Concrete navigators:

- **`GroundPathNavigation`** — default for terrestrial mobs; respects gravity, can do 1-block jumps.
- **`FlyingPathNavigation`** — used by parrots, allays, bees, ghasts (somewhat); ignores gravity, paths through 3D space.
- **`WaterBoundPathNavigation`** — for fish/squid; cannot leave water.
- **`AmphibiousPathNavigation`** — frogs, axolotls, drowned; can path in and out of water.
- **`WallClimberNavigation`** — spiders; ignores wall normals.

The pathfinder builds a `Path` of `Node`s (`net/minecraft/world/level/pathfinder/`) using `NodeEvaluator`s — `WalkNodeEvaluator`, `FlyNodeEvaluator`, `SwimNodeEvaluator`, `AmphibiousNodeEvaluator`. Each evaluator decides what counts as a valid step. To make a custom block traversable for AI, you can override `Block.getPathfindingMalus` or use Forge's `BlockPathTypes` system.

### 10.4 Attributes

`net/minecraft/world/entity/ai/attributes/Attributes.class` holds the static `Attribute` instances. The vanilla 18:

`generic.max_health`, `generic.follow_range`, `generic.knockback_resistance`, `generic.movement_speed`, `generic.flying_speed`, `generic.attack_damage`, `generic.attack_knockback`, `generic.attack_speed`, `generic.armor`, `generic.armor_toughness`, `generic.luck`, `horse.jump_strength`, `zombie.spawn_reinforcements`. (The 18 figure includes a handful of internal/unused ones plus the player's reach modifiers added by Forge — vanilla's user-facing list is 13 in 1.20.1.)

The model:
- `Attribute` is the type. `RangedAttribute` adds min/max bounds. Registered in `Registries.ATTRIBUTE`.
- `AttributeMap` is the per-entity store.
- `AttributeInstance` is a single attribute on a single entity, with a base value plus a list of `AttributeModifier`s.
- `AttributeModifier` has an `Operation`: `ADDITION`, `MULTIPLY_BASE`, `MULTIPLY_TOTAL`. They apply in that order.
- `DefaultAttributes` (`DefaultAttributes.class`) is the registry of "what attributes does each EntityType start with, and at what value"; mods register theirs via `EntityAttributeCreationEvent` for new mob types and `EntityAttributeModificationEvent` to adjust existing ones (both in `net/minecraftforge/event/entity/`).

Modifiers from equipment (armor, attribute modifiers on tools), potions, and enchantments are all `AttributeModifier`s under the hood. Datapacks can't add attributes, but the `attribute` command can read/write them at runtime, and the `set_attributes` loot function can put modifiers on item drops directly.

### 10.5 Spawn rules: two layers, often confused

**Layer 1 — `MobSpawnSettings` (the biome's `spawners` list):**
Defined in `data/<ns>/worldgen/biome/<id>.json` at `spawners.<category>.[]`, each entry is `{type, weight, minCount, maxCount}`. This is the **weighted random pick** — when a chunk decides to try spawning, it picks the category by the global cap, then picks a `SpawnerData` entry by weight, then tries to spawn `[minCount,maxCount]` mobs of that type. Adjustable via Forge's `BiomeModifier` JSON (datapack-driven) — Novus uses this extensively.

**Layer 2 — `SpawnPlacements` (Java-side position validity):**
`net/minecraft/world/entity/SpawnPlacements.class` registers, per `EntityType`, a placement rule: `(SpawnPlacements.Type, Heightmap.Types, SpawnPredicate)`. The `Type` is one of `ON_GROUND`, `IN_WATER`, `IN_LAVA`, `NO_RESTRICTIONS`. The predicate is the "can a zombie actually be here right now?" check — sky light level, block underneath, distance from player, etc. **This runs *after* the biome picks a mob; if the predicate fails, the spawn attempt is silently dropped.** A mob with no `SpawnPlacements` registration *cannot spawn naturally*, even if a biome lists it.

This is where mob-spawn-rule tuning bites: adding a mob to a biome's `spawners` is necessary but not sufficient. If the species' `SpawnPlacements` predicate requires sky-light ≤ 7 and the biome is bright, you'll get zero spawns. Forge's `SpawnPlacementRegisterEvent` is the only modification hook; datapacks cannot change `SpawnPlacements`.

**Mob categories** (`net/minecraft/world/entity/MobCategory.class`):
`MONSTER`, `CREATURE`, `AMBIENT`, `AXOLOTLS`, `UNDERGROUND_WATER_CREATURE`, `WATER_CREATURE`, `WATER_AMBIENT`, `MISC`. Each has a global cap (default: monster=70, creature=10, ambient=15, water_creature=5, water_ambient=20, axolotl=5, underground_water=5) — `MISC` does not natural-spawn at all; it's used for things like ender pearls and falling blocks. The cap is per-player and per-loaded-chunks; once a category fills it, no more of *any* mob in that category will spawn until something despawns.

Spawn tick math: every tick, every loaded chunk in a 17×17 chunk box around each player tests for spawning. The `naturalSpawnChance` on the biome is the per-attempt probability. Most chunks fail every tick.

---

## 11. Quick lookup index

Alphabetical cross-reference. Format: `**name** — description. See §X.Y.` Section pointers reference parts 1–4 of this document.

### Loot conditions (`loot_condition_type`)

- **all_of** — boolean AND of subconditions. See §3.4.
- **alternative** — alias of `any_of` (legacy). See §3.4.
- **any_of** — boolean OR of subconditions. See §3.4.
- **block_state_property** — match a block's blockstate (e.g. `age=7`). See §3.4.
- **damage_source_properties** — predicate on the kill's damage source (fire, projectile, player, etc.). See §3.4 + §4.
- **entity_properties** — predicate on a contextual entity (`this`, `killer`, `direct_killer`, `killer_player`). See §3.4 + §4.
- **entity_scores** — scoreboard score range check on a contextual entity. See §3.4.
- **inverted** — negate a subcondition. See §3.4.
- **killed_by_player** — true if a player landed the killing blow. See §3.4.
- **location_check** — wraps a location predicate (biome/structure/light/fluid). See §3.4 + §4.
- **match_tool** — predicate on the tool used to break the block / kill the entity. See §3.4.
- **random_chance** — flat probability roll. See §3.4.
- **random_chance_with_looting** — chance scaled by Looting level on the killer's weapon. See §3.4.
- **reference** — pull a condition list from `data/<ns>/predicates/<id>.json`. See §3.4 + §4.
- **survives_explosion** — pass-through unless this is an explosion drop and the random roll fails. See §3.4.
- **table_bonus** — fortune-style chance table (level → probability). See §3.4.
- **time_check** — game time / day-of-cycle range. See §3.4.
- **value_check** — number-provider matches a range (used with score / count loot). See §3.4.
- **weather_check** — raining/thundering predicate. See §3.4.

### Loot functions (`loot_function_type`)

- **apply_bonus** — fortune-aware bonus rolls (3 formulas: uniform, binomial, ore_drops). See §3.5.
- **copy_name** — copy a contextual entity/block-entity name onto the dropped item. See §3.5.
- **copy_nbt** — copy NBT path from a context source onto the drop. See §3.5.
- **copy_state** — copy blockstate property values onto the drop's blockstate tag. See §3.5.
- **enchant_randomly** — apply one random allowed enchantment. See §3.5.
- **enchant_with_levels** — vanilla enchanting-table style enchant at given XP cost. See §3.5.
- **exploration_map** — generate a treasure-map item pointing at a structure. See §3.5.
- **explosion_decay** — used by block loot to handle explosion fall-off. See §3.5.
- **fill_player_head** — set the GameProfile NBT on a player_head. See §3.5.
- **furnace_smelt** — auto-smelt the result if the entity was on fire. See §3.5.
- **limit_count** — clamp the stack count to a range. See §3.5.
- **looting_enchant** — additive count bonus per Looting level. See §3.5.
- **set_attributes** — attach AttributeModifier NBT. See §3.5.
- **set_banner_pattern** — patterned banner output. See §3.5.
- **set_contents** — fill a container item (shulker box, bundle) with sub-rolls. See §3.5.
- **set_count** — set/add the stack count via a number provider. See §3.5.
- **set_damage** — set durability damage. See §3.5.
- **set_enchantments** — explicit enchantment list. See §3.5.
- **set_instrument** — pick from a goat-horn instrument tag. See §3.5.
- **set_loot_table** — embed a loot table reference inside the item NBT. See §3.5.
- **set_lore** — set the `display.Lore` NBT. See §3.5.
- **set_name** — set the `display.Name` NBT. See §3.5.
- **set_nbt** — raw NBT merge. See §3.5.
- **set_potion** — set the `Potion` NBT for tipped arrows / potion items. See §3.5.
- **set_stew_effect** — random effect from a tag onto a suspicious-stew. See §3.5.

### Loot pool entry types (`loot_pool_entry_type`)

- **alternatives** — first child whose conditions pass. See §3.6.
- **dynamic** — runtime-injected drop (block contents, sheep wool color). See §3.6.
- **empty** — explicit no-drop slot. See §3.6.
- **group** — sequence-with-shared-conditions. See §3.6.
- **item** — single item. See §3.6.
- **loot_table** — invoke another loot table. See §3.6.
- **sequence** — all children, stop on first failure. See §3.6.
- **tag** — pick by item tag (weighted across tag members). See §3.6.

### Number providers (`loot_number_provider_type`)

- **constant** — fixed value. See §3.7.
- **uniform** — uniform float between min/max. See §3.7.
- **binomial** — N coin flips at probability p. See §3.7.
- **score** — read from scoreboard. See §3.7.

### Loot NBT / score providers

- **storage** (nbt) — read NBT from `data/<ns>/storage/`. See §3.7.
- **context** (nbt) — read from contextual entity / block. See §3.7.
- **fixed** (score) — score of a literal name. See §3.7.
- **context** (score) — score of a contextual entity. See §3.7.

### Recipe types (`recipe_type`)

- **crafting** — shaped + shapeless workbench recipes. See §6.1.
- **smelting** — furnace. See §6.1.
- **blasting** — blast furnace (faster, ores/metals only). See §6.1.
- **smoking** — smoker (faster, food only). See §6.1.
- **campfire_cooking** — campfire passive cooking. See §6.1.
- **stonecutting** — stonecutter (single input, multiple outputs). See §6.1.
- **smithing** — smithing-table recipes (template+base+addition). See §6.1.

### Recipe serializers (`recipe_serializer`)

- **crafting_shaped** — pattern + key map. See §6.2.
- **crafting_shapeless** — ingredient list. See §6.2.
- **crafting_special_armordye / bookcloning / firework_star / mapcloning / mapextending / repairitem / suspiciousstew / tippedarrow** — the seven hardcoded crafting routines that need code-driven inputs. See §6.2.
- **crafting_decorated_pot** — decorated pot assembly (sherds). See §6.2.
- **smelting / blasting / smoking / campfire_cooking** — single-ingredient cooking serializer (one per type). See §6.2.
- **stonecutting** — stonecutter serializer. See §6.2.
- **smithing_transform** — apply addition + template, replace base. See §6.2.
- **smithing_trim** — apply trim pattern + material, keep base item. See §6.2.

### Advancement triggers (`net/minecraft/advancements/critereon/`)

- **allay_drop_item_on_block** — allay drops a held item onto a target block. See §5.3.
- **avoid_vibration** — sneak-near-skulk-sensor. See §5.3.
- **bee_nest_destroyed** — break a populated bee nest. See §5.3.
- **bred_animals** — successful breeding. See §5.3.
- **brewed_potion** — finish brewing. See §5.3.
- **changed_dimension** — cross a dimension boundary. See §5.3.
- **channeled_lightning** — Channeling trident strike. See §5.3.
- **construct_beacon** — beacon assembled. See §5.3.
- **consume_item** — eat/drink an item. See §5.3.
- **cured_zombie_villager** — golden-apple+weakness cure. See §5.3.
- **distance** — distance traveled / fallen. See §5.3.
- **effects_changed** — gain/lose a status effect. See §5.3.
- **enchanted_item** — finish an enchanting-table use. See §5.3.
- **enter_block** — stand inside a block / blockstate. See §5.3.
- **entity_hurt_player** — entity damaged the player. See §5.3.
- **entity_killed_player** — alias of `entity_killed_player`; rare. See §5.3.
- **fall_from_height** — survived a calibrated fall. See §5.3.
- **filled_bucket** — pick up a fluid in a bucket. See §5.3.
- **fishing_rod_hooked** — reeled something. See §5.3.
- **hero_of_the_village** — won a raid. See §5.3.
- **impossible** — never fires; used as a manual gate. See §5.3.
- **inventory_changed** — inventory matches a predicate. See §5.3.
- **item_durability_changed** — durability damage event. See §5.3.
- **item_used_on_block** — right-clicked a block with an item. See §5.3.
- **kill_mob_near_sculk_catalyst** — a sculk-charge spawn condition. See §5.3.
- **killed_by_crossbow** — multikill with one crossbow shot. See §5.3.
- **levitation** — distance traveled while levitating. See §5.3.
- **lightning_strike** — struck or near a strike. See §5.3.
- **location** — periodic poll of player location predicate. See §5.3.
- **nether_travel** — total Nether-equivalent distance. See §5.3.
- **placed_block** — placed a block matching predicate. See §5.3.
- **player_generates_container_loot** — opens a chest/loot context. See §5.3.
- **player_hurt_entity** — player damaged an entity. See §5.3.
- **player_interacted_with_entity** — right-click / use on entity. See §5.3.
- **player_killed_entity** — player landed killing blow. See §5.3.
- **recipe_crafted** — finished a crafting recipe. See §5.3.
- **recipe_unlocked** — recipe book unlock. See §5.3.
- **ride_entity_in_lava** — strider riding in lava. See §5.3.
- **shot_crossbow** — fired a crossbow. See §5.3.
- **slept_in_bed** — bed sleep success. See §5.3.
- **slide_down_block** — honey-block slide. See §5.3.
- **started_riding** — mounted any vehicle. See §5.3.
- **summoned_entity** — spawned via egg / spawner. See §5.3.
- **tame_animal** — tame action. See §5.3.
- **target_hit** — target block hit. See §5.3.
- **thrown_item_picked_up_by_entity** — mob picked up your dropped item. See §5.3.
- **thrown_item_picked_up_by_player** — you picked up someone else's dropped item. See §5.3.
- **tick** — fires every tick (for cumulative criteria). See §5.3.
- **used_ender_eye** — threw an ender eye. See §5.3.
- **used_totem** — totem of undying activation. See §5.3.
- **using_item** — start of a use-action (eating, drawing bow). See §5.3.
- **villager_trade** — completed a trade. See §5.3.
- **voluntary_exile** — pillager-flag-related, leave village. See §5.3.

### Predicate types (`block_predicate_type`)

- **all_of** — AND. See §1.7.
- **any_of** — OR. See §1.7.
- **has_sturdy_face** — block at offset has sturdy face on direction. See §1.7.
- **inside_world_bounds** — position is inside the buildable world height. See §1.7.
- **matching_blocks** — blockstate is one of N. See §1.7.
- **matching_block_tag** — block belongs to tag. See §1.7.
- **matching_fluids** — fluid is one of N. See §1.7.
- **not** — invert (also `inverted`). See §1.7.
- **replaceable** — block is `Material.REPLACEABLE` (grass, snow_layer, fluid). See §1.7.
- **solid** — block has a solid collision face. See §1.7.
- **true** — always true (placeholder). See §1.7.
- **would_survive** — block at offset would survive if a given block were placed there. See §1.7.

### Block state providers (`worldgen/block_state_provider_type`)

- **simple_state_provider** — single fixed state. See §7.4.
- **rotated_block_provider** — random rotation of one block (logs). See §7.4.
- **weighted_state_provider** — weighted pick from a list. See §7.4.
- **noise_provider** — Perlin-driven pick from a list. See §7.4.
- **dual_noise_provider** — two-axis Perlin-driven pick. See §7.4.
- **noise_threshold_provider** — threshold-bucketed pick. See §7.4.
- **randomized_int_state_provider** — provider that randomizes one int property of an inner provider's output. See §7.4.

### Worldgen feature types (`worldgen/feature` — the registered Feature classes)

- **bamboo, bamboo_vegetation** — bamboo clusters. See §7.5.
- **basalt_columns, basalt_pillar, delta_feature** — Nether basalt deltas. See §7.5.
- **block_column** — vertical column of one block. See §7.5.
- **block_pile** — clustered piles (e.g. melons, pumpkins, snow). See §7.5.
- **blue_ice** — blue-ice patches. See §7.5.
- **bonus_chest** — starter chest. See §7.5.
- **chorus_plant** — End chorus tree. See §7.5.
- **coral_claw, coral_mushroom, coral_tree** — three coral shapes. See §7.5.
- **desert_well** — desert structure. See §7.5.
- **disk** — flat disk of one block (sand, gravel, mud). See §7.5.
- **dripstone_cluster, large_dripstone, pointed_dripstone** — dripstone family. See §7.5.
- **end_gateway, end_island** — End-specific. See §7.5.
- **fill_layer** — flat layer of a block (used for bedrock floor). See §7.5.
- **flower** — random patch of flowers (uses a custom decoration). See §7.5.
- **forest_rock** — mossy cobblestone boulders. See §7.5.
- **fossil** — bone-block + coal-ore underground fossils. See §7.5.
- **freeze_top_layer** — adds snow / ice cover. See §7.5.
- **geode** — amethyst + calcite + smooth_basalt geodes. See §7.5.
- **glowstone_blob** — Nether glowstone clusters. See §7.5.
- **huge_brown_mushroom, huge_red_mushroom** — mushroom-island mushrooms. See §7.5.
- **huge_fungus** — Nether fungus. See §7.5.
- **iceberg** — frozen-ocean iceberg. See §7.5.
- **kelp, seagrass** — underwater plant features. See §7.5.
- **lake** — water/lava lake. See §7.5.
- **monster_room** — dungeon (mossy cobble + spawner). See §7.5.
- **multiface_growth** — glow lichen, sculk vein. See §7.5.
- **nether_forest_vegetation** — Nether-forest grass equivalents. See §7.5.
- **netherrack_replace_blobs** — replace netherrack with another block in blobs. See §7.5.
- **no_bonemeal_flower** — flower variant that ignores bonemeal. See §7.5.
- **no_op** — does nothing (used as a placeholder). See §7.5.
- **random_boolean_selector** — 50/50 between two children. See §7.5.
- **random_patch** — random spread of a `simple_block` (grass, flowers). See §7.5.
- **random_selector** — weighted-pick wrapper. See §7.5.
- **replace_single_block** — swap a single block. See §7.5.
- **root_system** — azalea root system. See §7.5.
- **scattered_ore** — sparse single-block scatter. See §7.5.
- **sculk_patch** — sculk + sensor + shrieker. See §7.5.
- **sea_pickle** — sea-pickle clusters. See §7.5.
- **simple_block** — place one block (used inside random_patch). See §7.5.
- **simple_random_selector** — uniform-weight version of random_selector. See §7.5.
- **spring_feature** — water/lava spring. See §7.5.
- **tree** — vanilla tree (uses trunk + foliage placers). See §7.5.
- **twisting_vines, weeping_vines, vines** — climbing-plant features. See §7.5.
- **underwater_magma** — magma blocks under deep ocean. See §7.5.
- **vegetation_patch, waterlogged_vegetation_patch** — surface vegetation patches (azalea, mangrove). See §7.5.
- **void_start_platform** — End spawn obsidian. See §7.5.

### Density function operations (`worldgen/density_function_type`)

Binary (`TwoArgumentSimpleFunction.Type`):
- **add** — a + b. See §7.7.
- **mul** — a * b. See §7.7.
- **max** — max(a, b). See §7.7.
- **min** — min(a, b). See §7.7.

Unary (`Mapped.Type`):
- **abs** — |x|. See §7.7.
- **square** — x². See §7.7.
- **cube** — x³. See §7.7.
- **half_negative** — clamp negatives to half magnitude. See §7.7.
- **quarter_negative** — clamp negatives to quarter magnitude. See §7.7.
- **squeeze** — squash extremes toward 0. See §7.7.

Other operations:
- **constant** — fixed value. See §7.7.
- **clamp** — bound to [min, max]. See §7.7.
- **interpolated, flat_cache, cache_2d, cache_once, cache_all_in_cell** — caching/interp markers (no math, just memoization). See §7.7.
- **noise, shifted_noise, old_blended_noise** — Perlin-style sample. See §7.7.
- **shift, shift_a, shift_b** — coordinate-shift helpers for noise. See §7.7.
- **range_choice** — branch based on whether input lies in a range. See §7.7.
- **spline** — cubic-spline-driven shape. See §7.7.
- **weird_scaled_sampler** — terrain-height blend used by main chunk gen. See §7.7.
- **y_clamped_gradient** — vertical linear ramp between two Y values. See §7.7.
- **blend_alpha, blend_density, blend_offset** — chunk-edge blending for old chunks. See §7.7.
- **end_islands** — End terrain generator. See §7.7.
- **beardifier** — shape carver for structure pieces. See §7.7.

### Mob categories

- **MONSTER, CREATURE, AMBIENT, AXOLOTLS, UNDERGROUND_WATER_CREATURE, WATER_CREATURE, WATER_AMBIENT, MISC** — see §10.5.

### Spawn placement types

- **ON_GROUND, IN_WATER, IN_LAVA, NO_RESTRICTIONS** — see §10.5.

### Goal flags

- **MOVE, LOOK, JUMP, TARGET** — mutex axes for `GoalSelector`. See §10.1.

### Forge capabilities (the four standard)

- **ITEM_HANDLER** — slotted item I/O. See §9.5.
- **FLUID_HANDLER** — block/entity fluid I/O. See §9.5.
- **FLUID_HANDLER_ITEM** — fluid I/O on an itemstack (buckets, tanks-as-items). See §9.5.
- **ENERGY** — Forge Energy storage. See §9.5.
