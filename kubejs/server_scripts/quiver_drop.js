// Quiver loot drop for Skeleton + Stray.
//
// Replaces Supplementaries' native skeleton-spawn-equip behavior, which is
// disabled in `supplementaries-common.toml` (quiver_skeleton_spawn_chance = 0.0).
//
// Why a server script instead of a Forge GLM:
//   The GLM approach (`moonlight:add_loot_table` targeting the entity tables)
//   infinite-recurses and crashes the server with StackOverflowError. The
//   `forge:loot_table_id` condition matches via `LootContext.getQueriedLootTableId()`
//   which does NOT change when the modifier injects a sub-table — so the inject
//   table also satisfies the condition, the modifier injects again, and the stack
//   blows out. Adding a pool to the entity loot table directly via
//   `ServerEvents.entityLootTables` doesn't trigger ForgeHooks.modifyLoot, so no
//   recursion path exists. See PATCHES.md for the full incident.
//
// Drop economy (base rates at Looting 0; per-pool comments below have the
// full Looting curve):
//
//   Skeleton — 7% base + 2%/Looting, killed_by_player only, arrows 3–10.
//     Common mob, frequent drops, lighter arrow population so quivers don't
//     flood inventory with arrows. Roughly 1 quiver per 14 skeleton kills at
//     L0 (50% chance within 10 kills).
//
//   Stray  — 15% base + 4%/Looting, killed_by_player only, arrows 4–18
//   (mansion-tier).
//     Rarer biome (icy), tougher progression mob; bigger reward justifies the
//     kill. Roughly 1 quiver per 7 stray kills at L0.
//
//   Both pools use `random_chance_with_looting` + `killed_by_player`. The
//   killed_by_player gate prevents creeper-killed-skeletons and auto-mob-farms
//   from yielding quivers — drops are reserved for player-driven combat.
//
// Reference rates for context:
//   Supplementaries' default native spawn-equip on Hard difficulty produces
//   roughly 1 quiver per 800 skeleton kills in realistic play (chunks aged
//   ~1–2 hours), or 1 per 400 at peak local-difficulty conditions. Our 7%
//   base is ~30–60× that rate, justified because:
//     (a) we plan a crafting recipe for empty quivers (primary acquisition path)
//     (b) the kill drop is a "shortcut to a pre-loaded quiver," not the only
//         way to obtain one — so it competes with "craft empty + fill manually"
//         not with "raid Mansion."

ServerEvents.entityLootTables(event => {

    // Regular Skeleton — 7% base, light arrows, Looting-scaled
    // chance(L) = 0.07 + 0.02 * L  →  L0 7%, L1 9%, L2 11%, L3 13%
    event.modifyEntity('minecraft:skeleton', table => {
        table.addPool(pool => {
            pool.rolls = 1
            pool.addCondition({
                condition: 'minecraft:random_chance_with_looting',
                chance: 0.07,
                looting_multiplier: 0.02
            })
            pool.addCondition({ condition: 'minecraft:killed_by_player' })
            pool.addItem('supplementaries:quiver').addFunction({
                function: 'supplementaries:random_arrows',
                min: 3,
                max: 10
            })
        })
    })

    // Stray — 15% base, mansion-tier arrows, steeper Looting scaling (rarer mob)
    // chance(L) = 0.15 + 0.04 * L  →  L0 15%, L1 19%, L2 23%, L3 27%
    event.modifyEntity('minecraft:stray', table => {
        table.addPool(pool => {
            pool.rolls = 1
            pool.addCondition({
                condition: 'minecraft:random_chance_with_looting',
                chance: 0.15,
                looting_multiplier: 0.04
            })
            pool.addCondition({ condition: 'minecraft:killed_by_player' })
            pool.addItem('supplementaries:quiver').addFunction({
                function: 'supplementaries:random_arrows',
                min: 4,
                max: 18
            })
        })
    })

})
