// Matrix Enchanting Table — upgrade recipe
// Automatically Convert is disabled in quark-common.toml so the vanilla
// enchanting table is no longer auto-converted. Players craft this explicitly
// as a mid/late game upgrade.
//
// Layout:
//   AAA  — Amethyst Shards (top)
//   QEQ  — Quartz / Enchanting Table / Quartz (middle)
//   OOO  — Crying Obsidian (bottom)

ServerEvents.recipes(event => {

    event.shaped(
        'quark:matrix_enchanter',
        [
            'AAA',
            'QEQ',
            'OOO'
        ],
        {
            A: 'minecraft:amethyst_shard',
            Q: 'minecraft:quartz',
            E: 'minecraft:enchanting_table',
            O: 'minecraft:crying_obsidian'
        }
    ).id('novus:matrix_enchanting_table')

})
