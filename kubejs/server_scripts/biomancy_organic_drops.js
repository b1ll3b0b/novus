// biomancy_organic_drops.js — adds biomancy organ drops to normal mob kills.
// 2026-05-09.
//
// Mirrors the despoil pool of every mob covered by `kubejs/data/<ns>/loot_tables/
// biomancy/despoil/*.json` into the same mob's *normal* entity loot table. The
// despoil mechanic is left UNTOUCHED — original despoil tables still fire when the
// player uses the despoil tool on a corpse. This script just makes regular kills
// also produce organic drops, so the two mechanics stack.
//
// === Design (per user direction 2026-05-09) ===
//
// Pool fires 100% on every kill (rolls = 1) — guaranteed pick.
// Weights mirror the despoil tables EXACTLY (no rebalancing).
// Counts are HALVED so casual kills feel "lucky" rather than "expected":
//   new_min = 0
//   new_max = max(1, ceil(original_max / 2))
//
//   1-1  →  0-1   (50% expected count)
//   1-2  →  0-1   (33% expected count)
//   1-3  →  0-2   (50% expected count)
//   0-1  →  0-1   (already minimal, unchanged)
//
// Looting enchant 0-1 is mirrored from the despoil tables verbatim.
//
// === Why ServerEvents.entityLootTables instead of a Forge GLM ===
//
// The GLM `add_loot_table` path causes infinite recursion on entity loot tables
// (the 2026-04-25 quiver-drop incident, see PATCHES.md and memory
// `feedback_glm_add_loot_table_recursion.md`). KubeJS's entity-loot modify event
// is safe because it doesn't trigger ForgeHooks.modifyLoot — no recursion path.
//
// === Why no killed_by_player gate ===
//
// The despoil tables don't have one, so mirroring them keeps farms able to yield
// organs (matching vanilla normal-loot semantics, which mostly don't gate on
// player kill either). If farm-yield becomes a problem, the simplest fix is to
// add `pool.addCondition({ condition: 'minecraft:killed_by_player' })` inside
// each pool block — but that should be a deliberate decision, not a default.
//
// === Maintenance notes ===
//
// The despoil table inventory is hardcoded below for clarity. If a new despoil
// table is added under `kubejs/data/<ns>/loot_tables/biomancy/despoil/` the
// matching mob+items+weights need to be added to ORGANIC_DROPS by hand. The
// despoil tables themselves are the canonical source — when they change,
// update this list. See PATCHES.md "Biomancy — despoil tables" section for the
// authoritative list.

ServerEvents.entityLootTables(event => {

    // Format per entry: [item, weight, original_min, original_max]
    // The script halves the count automatically.
    const ORGANIC_DROPS = {

        // === Vanilla mobs (10) ===
        'minecraft:zombie': [
            ['biomancy:mob_marrow',  45, 1, 2],
            ['biomancy:mob_sinew',   70, 1, 2],
            ['biomancy:mob_gland',   40, 0, 1],
        ],
        'minecraft:zombie_villager': [
            ['biomancy:mob_marrow',  45, 1, 2],
            ['biomancy:mob_sinew',   70, 1, 2],
            ['biomancy:mob_gland',   40, 0, 1],
        ],
        'minecraft:zombie_horse': [
            ['biomancy:mob_marrow',  45, 1, 3],
            ['biomancy:mob_sinew',   70, 1, 2],
        ],
        'minecraft:husk': [
            ['biomancy:mob_marrow',  60, 1, 2],
            ['biomancy:mob_sinew',   50, 1, 2],
            ['biomancy:toxin_gland', 15, 0, 1],
        ],
        'minecraft:drowned': [
            ['biomancy:mob_marrow',  45, 1, 2],
            ['biomancy:mob_sinew',   70, 1, 2],
            ['biomancy:mob_gland',   30, 0, 1],
        ],
        'minecraft:shulker': [
            ['biomancy:mob_gland',   40, 0, 1],
            ['biomancy:toxin_gland', 20, 0, 1],
            ['biomancy:exotic_dust', 15, 0, 1],
        ],
        'minecraft:spider': [
            ['biomancy:mob_sinew',   70, 1, 3],
            ['biomancy:mob_gland',   40, 0, 1],
            ['biomancy:mob_fang',    30, 1, 1],
        ],
        'minecraft:cave_spider': [
            ['biomancy:mob_sinew',   70, 1, 1],
            ['biomancy:mob_fang',    30, 1, 1],
            ['biomancy:toxin_gland', 75, 1, 1],
        ],
        'minecraft:chicken': [
            ['biomancy:mob_sinew',   70, 1, 1],
            ['biomancy:mob_claw',    80, 0, 1],
            ['biomancy:mob_gland',   20, 0, 1],
        ],
        'minecraft:parrot': [
            ['biomancy:mob_claw',   150, 1, 1],
            ['biomancy:mob_sinew',   70, 1, 1],
            ['biomancy:mob_gland',   20, 0, 1],
        ],

        // === Quark mobs (4) ===
        'quark:crab': [
            ['biomancy:mob_claw',    80, 1, 1],
            ['biomancy:mob_sinew',   60, 1, 1],
            ['biomancy:mob_gland',   20, 0, 1],
        ],
        'quark:shiba': [
            ['biomancy:mob_fang',   100, 1, 1],
            ['biomancy:mob_claw',   100, 1, 2],
            ['biomancy:mob_sinew',   70, 1, 2],
            ['biomancy:mob_gland',   40, 0, 1],
        ],
        'quark:stoneling': [
            ['biomancy:mineral_fragment',  80, 1, 2],
            ['biomancy:exotic_dust',       20, 0, 1],
            ['biomancy:gem_fragments',     10, 1, 1],
        ],
        'quark:toretoise': [
            ['biomancy:mineral_fragment', 100, 1, 2],
            ['biomancy:mob_sinew',         20, 0, 1],
            ['biomancy:gem_fragments',     15, 0, 1],
        ],

        // === Botania (1) ===
        'botania:pink_wither': [
            ['biomancy:volatile_gland',      30, 1, 2],
            ['biomancy:withered_mob_marrow', 40, 1, 2],
        ],

        // === GoblinTraders (2) ===
        'goblintraders:goblin_trader': [
            ['biomancy:mob_sinew',   70, 1, 2],
            ['biomancy:mob_gland',   50, 0, 1],
            ['biomancy:toxin_gland', 20, 0, 1],
        ],
        'goblintraders:vein_goblin_trader': [
            ['biomancy:mob_sinew',   70, 1, 2],
            ['biomancy:mob_gland',   50, 0, 1],
            ['biomancy:toxin_gland', 20, 0, 1],
        ],

        // === Supplementaries (1) ===
        'supplementaries:red_merchant': [
            ['biomancy:mob_sinew',   70, 1, 2],
            ['biomancy:mob_gland',   50, 0, 1],
        ],
    }

    let mobsModified = 0
    let entriesAdded = 0

    Object.keys(ORGANIC_DROPS).forEach(mobId => {
        const entries = ORGANIC_DROPS[mobId]
        event.modifyEntity(mobId, table => {
            table.addPool(pool => {
                pool.rolls = 1
                entries.forEach(entry => {
                    const item = entry[0]
                    const weight = entry[1]
                    const origMax = entry[3]
                    const newMax = Math.max(1, Math.ceil(origMax / 2))
                    pool.addItem(item)
                        .weight(weight)
                        .addFunction({
                            function: 'minecraft:set_count',
                            add: false,
                            count: { type: 'minecraft:uniform', min: 0.0, max: newMax * 1.0 }
                        })
                        .addFunction({
                            function: 'minecraft:looting_enchant',
                            count: { type: 'minecraft:uniform', min: 0.0, max: 1.0 }
                        })
                    entriesAdded++
                })
            })
        })
        mobsModified++
    })

    console.log('[biomancy_organic_drops] Added organic drop pools to ' +
                mobsModified + ' mobs (' + entriesAdded + ' entries total)')
})
