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
