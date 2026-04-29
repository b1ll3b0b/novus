// Matrix Enchanting Table — explicit upgrade recipe
//
// Quark's "automatically convert" behavior is disabled in quark-common.toml,
// so the vanilla enchanting table is no longer silently swapped. Players
// instead craft the Matrix Enchanter explicitly as a mid/late-game upgrade
// using this recipe.
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
