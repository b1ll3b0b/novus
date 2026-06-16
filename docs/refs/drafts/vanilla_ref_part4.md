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

### 9.5 Forge capabilities (briefly)

> **Sourcing note:** the `forge-1.20.1-47.4.20-universal.jar` is not in `refs/`, so the Forge details below are sourced from the published 1.20.1 Forge API surface and observed usage in mods in `novus_dev/minecraft/mods/`. Class names are correct; specific method signatures should be verified against the universal jar before relying on them in code.

The capability system is Forge's answer to "I want to attach an arbitrary handler to a block entity / entity / itemstack without subclassing it." The classes live under `net/minecraftforge/common/capabilities/`:

- `Capability<T>` — the generic key.
- `ICapabilityProvider` — interface implemented by the host object (block entity, entity, itemstack), exposing `getCapability(Capability<T>, Direction)`.
- `CapabilityProvider` — abstract base that mods can extend.
- `ForgeCapabilities` — holds the four standard caps: `ITEM_HANDLER`, `FLUID_HANDLER`, `FLUID_HANDLER_ITEM`, `ENERGY`.

The handler interfaces:
- `net/minecraftforge/items/IItemHandler.class` — slotted item I/O. Used by every chest-like inventory in modded Minecraft.
- `net/minecraftforge/fluids/capability/IFluidHandler.class` — tank I/O, `FluidStack` units.
- `net/minecraftforge/energy/IEnergyStorage.class` — Forge Energy (FE), the de-facto modded energy unit.

You attach a capability to an instance you don't own via `AttachCapabilitiesEvent<T>` (entity, block entity, itemstack, etc.). This is how, e.g., curios slots get added to players: a capability is attached to every `Player` at construction time. The system requires Java; there's no datapack hook.

Mods often expose helpers — Create exposes `LevelAccessor.getCapability` shorthand methods, Cofh has `EnergyHelper`. For Novus's purposes, capabilities mostly matter when KubeJS / CraftTweaker ask "what can this block entity do?" — both have wrappers (`ItemHandlerHelper`, `FluidStackJS`, etc.) that internally call `getCapability`.

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
