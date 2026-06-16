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
