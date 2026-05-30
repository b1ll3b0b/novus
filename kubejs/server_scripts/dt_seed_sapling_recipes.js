// dt_seed_sapling_dirt.js — early-game shapeless recipes converting between
// DT seed items and their sapling counterparts using a thematic catalyst.
// Replaces the dirt-bucket flow for bulk crafting.
//
// Added 2026-05-16, user-requested as a stopgap before deeper DT integration.
// Updated 2026-05-17: per-species catalysts so the reagent matches the
// biome/material the species grows in/on (nether fungi + bloodshroom ->
// netherrack, mushrooms -> mycelium, cacti -> sand/red_sand/gravel).
// Apple oak + cocoa chains are asymmetric.
//
// Ratio: 1 input + 1 catalyst -> 1 output. One-way: seed + catalyst -> sapling
// (the reverse sapling -> seed direction was removed 2026-05-30).
//
// Intentionally NOT generated for these species (no clean 1:1 mapping):
//   dynamictrees:mega_jungle_seed   -> conflicts with jungle_seed <-> jungle_sapling
//   dynamictrees:mega_spruce_seed   -> conflicts with spruce_seed
//   dynamictrees:mega_crimson_seed  -> conflicts with crimson_seed
//   dynamictrees:mega_warped_seed   -> conflicts with warped_seed
//   dynamictreesplus:chorus_seed    -> item is referenced in lang/models but
//                                       never registers in DT+ 1.2.2 (no species JSON)
//
// dynamictrees:cocoa_seed is handled as an asymmetric chain like apple_oak,
// since it's part of the jungle family (parent fallback) and shares no
// equivalent vanilla "sapling" item (cocoa_beans aren't a sapling).
//
// Cactus species all share minecraft:cactus as the "sapling" item, so each
// uses a unique catalyst to keep the reverse direction unambiguous:
//   saguaro -> red_sand (badlands-exclusive, mesa biome in species JSON)
//   pillar  -> sand     (generic desert columnar)
//   pipe    -> gravel   (organ pipe; rocky/gravelly bajada habitat)

const DIRT = 'minecraft:dirt';
const NETHERRACK = 'minecraft:netherrack';
const MYCELIUM = 'minecraft:mycelium';
const SAND = 'minecraft:sand';
const RED_SAND = 'minecraft:red_sand';
const GRAVEL = 'minecraft:gravel';

// [seed_item, sapling_item, catalyst]  — each entry generates one shapeless
// recipe: seed + catalyst -> sapling. (Reverse direction removed 2026-05-30.)
const PAIRS = [
  // dynamictrees (vanilla MC counterparts) — grow on dirt
  ['dynamictrees:oak_seed',       'minecraft:oak_sapling',         DIRT],
  ['dynamictrees:birch_seed',     'minecraft:birch_sapling',       DIRT],
  ['dynamictrees:spruce_seed',    'minecraft:spruce_sapling',      DIRT],
  ['dynamictrees:jungle_seed',    'minecraft:jungle_sapling',      DIRT],
  ['dynamictrees:acacia_seed',    'minecraft:acacia_sapling',      DIRT],
  ['dynamictrees:dark_oak_seed',  'minecraft:dark_oak_sapling',    DIRT],
  ['dynamictrees:cherry_seed',    'minecraft:cherry_sapling',      DIRT],
  ['dynamictrees:mangrove_seed',  'minecraft:mangrove_propagule',  DIRT],
  ['dynamictrees:azalea_seed',    'minecraft:azalea',              DIRT],

  // nether fungi — netherrack is the generic nether-side catalyst
  ['dynamictrees:crimson_seed',   'minecraft:crimson_fungus',      NETHERRACK],
  ['dynamictrees:warped_seed',    'minecraft:warped_fungus',       NETHERRACK],

  // dynamictreesplus mushrooms — grow on mycelium
  ['dynamictreesplus:brown_mushroom_seed', 'minecraft:brown_mushroom', MYCELIUM],
  ['dynamictreesplus:red_mushroom_seed',   'minecraft:red_mushroom',   MYCELIUM],

  // chorus is intentionally skipped: dynamictreesplus:chorus_seed has lang
  // strings + a sapling model but no species JSON or registry entry in DT+
  // 1.2.2 — the item never registers, so any recipe referencing it fails.

  // dynamictreesplus cacti are handled below as one-way (cactus -> seed only),
  // because vanilla cactus is freely obtainable in-world and a seed -> cactus
  // direction is unnecessary detour. See cactus block at end of recipes() body.

  // dtquark (Quark trees) — overworld, dirt
  ['dtquark:fiery_blossom_seed',   'quark:red_blossom_sapling',      DIRT],
  ['dtquark:frosty_blossom_seed',  'quark:blue_blossom_sapling',     DIRT],
  ['dtquark:serene_blossom_seed',  'quark:lavender_blossom_sapling', DIRT],
  ['dtquark:sunny_blossom_seed',   'quark:yellow_blossom_sapling',   DIRT],
  ['dtquark:warm_blossom_seed',    'quark:orange_blossom_sapling',   DIRT],
  ['dtquark:glow_shroom_seed',     'quark:glow_shroom',              DIRT],
  ['dtquark:ancient_seed',         'quark:ancient_sapling',          DIRT],

  // dttconstruct (TC slime trees)
  // bloodshroom is a nether tree -> netherrack (matches the crimson/warped flow)
  // the other three slime trees grow on dirt/regular ground in their dimensions
  ['dttconstruct:bloodshroom_seed', 'tconstruct:blood_slime_sapling', NETHERRACK],
  ['dttconstruct:greenheart_seed',  'tconstruct:earth_slime_sapling', DIRT],
  ['dttconstruct:enderbark_seed',   'tconstruct:ender_slime_sapling', DIRT],
  ['dttconstruct:skyroot_seed',     'tconstruct:sky_slime_sapling',   DIRT],
];

ServerEvents.recipes(event => {
  // Disable the dirt bucket entirely. The mod-side config option
  // `generateDirtBucketRecipes = false` in dynamictrees-common.toml stops DT
  // from generating its seed<->sapling conversion recipes, and this removes
  // the bucket-crafting recipe so no new buckets can be made. These KubeJS
  // shapeless recipes become the only path between seed and sapling items.
  event.remove({ output: 'dynamictrees:dirt_bucket' });

  PAIRS.forEach(([seed, sapling, cat]) => {
    // One-way: seed + catalyst -> sapling. The reverse (sapling -> seed) was
    // removed 2026-05-30 so DT seeds can be spent into vanilla/mod saplings but
    // can't be farmed back from freely-available saplings.
    event.shapeless(sapling, [seed, cat])
         .id(`kubejs:dt_seed_to_sapling/${seed.replace(':', '_')}`);
  });

  // Apple oak — asymmetric chain:
  //   apple                  -> apple_oak_seed         (single-ingredient, no dirt)
  //   apple_oak_seed + dirt  -> oak_sapling
  // Lets apple_oak_seed act as a one-way upgrade step rather than colliding
  // with the oak_seed <-> oak_sapling pair above.
  event.shapeless('dynamictrees:apple_oak_seed', ['minecraft:apple'])
       .id('kubejs:dt_apple_to_apple_oak_seed');
  event.shapeless('minecraft:oak_sapling', ['dynamictrees:apple_oak_seed', DIRT])
       .id('kubejs:dt_apple_oak_seed_to_oak_sapling');

  // Cocoa — asymmetric chain mirroring apple_oak. Cocoa's DT species is part
  // of the jungle family, so the fallback direction goes to jungle_sapling.
  //   3x cocoa_beans       -> cocoa_seed (shown as "Cocoa Pod" in-game)
  //   cocoa_seed + dirt    -> jungle_sapling
  event.shapeless('dynamictrees:cocoa_seed',
                  ['minecraft:cocoa_beans', 'minecraft:cocoa_beans', 'minecraft:cocoa_beans'])
       .id('kubejs:dt_cocoa_beans_to_cocoa_seed');
  event.shapeless('minecraft:jungle_sapling', ['dynamictrees:cocoa_seed', DIRT])
       .id('kubejs:dt_cocoa_seed_to_jungle_sapling');

  // Ashen (Quark "Ancient" tree) — fruit -> seed.
  // ancient_fruit -> dtquark:ancient_seed. The seed -> ancient_sapling
  // conversion lives in the PAIRS array above.
  event.shapeless('dtquark:ancient_seed', ['quark:ancient_fruit'])
       .id('kubejs:dt_ancient_fruit_to_ashen_seed');

  // Cacti — one-way only (cactus + catalyst -> seed). No reverse direction
  // because vanilla cactus is freely available in-world. Catalyst selects
  // which DT cactus species the seed grows into:
  //   red_sand -> saguaro (badlands)
  //   sand     -> pillar  (generic desert)
  //   gravel   -> pipe    (organ pipe; rocky habitat)
  event.shapeless('dynamictreesplus:saguaro_cactus_seed', ['minecraft:cactus', RED_SAND])
       .id('kubejs:dt_cactus_to_saguaro_seed');
  event.shapeless('dynamictreesplus:pillar_cactus_seed', ['minecraft:cactus', SAND])
       .id('kubejs:dt_cactus_to_pillar_seed');
  event.shapeless('dynamictreesplus:pipe_cactus_seed', ['minecraft:cactus', GRAVEL])
       .id('kubejs:dt_cactus_to_pipe_seed');
});
