// Matrix Enchanting Table — upgrade recipe
// Automatically Convert is disabled in quark-common.toml so the vanilla
// enchanting table is no longer auto-converted. Players craft this explicitly
// as a mid/late game upgrade.
//
// Layout:
//   RQR  — Redstone / Quartz / Redstone
//   QEQ  — Quartz / Enchanting Table / Quartz
//   ODO  — Crying Obsidian / Diamond / Crying Obsidian

ServerEvents.recipes(event => {

    event.shaped(
        'quark:matrix_enchanter',
        [
            'RQR',
            'QEQ',
            'ODO'
        ],
        {
            R: 'minecraft:redstone',
            Q: 'minecraft:quartz',
            E: 'minecraft:enchanting_table',
            O: 'minecraft:crying_obsidian',
            D: 'minecraft:diamond'
        }
    ).id('novus:matrix_enchanting_table')

})
