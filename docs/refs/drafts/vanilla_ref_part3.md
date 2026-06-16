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
