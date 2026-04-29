// Subtractive (CMYK-style) dye mixing
//
// Adds the following crafting-table combinations:
//   yellow  + cyan             -> 2 lime
//   yellow  + magenta          -> 2 red
//   magenta + cyan             -> 2 blue
//   yellow  + blue             -> 2 green
//   orange  + black            -> 2 brown
//   yellow  + cyan + magenta   -> 3 black
//
// Output counts follow vanilla convention (2 dyes from 2 ingredients,
// 3 dyes from 3 ingredients), matching how vanilla orange/cyan/magenta
// recipes already behave.
//
// None of these collide with vanilla recipes — vanilla only ever produces
// these colors via different paths (red/blue/green/brown/black are
// "primary" in vanilla and have no mixing recipes; lime comes from
// green+white). So this is purely additive: the existing vanilla paths
// still work alongside these.

ServerEvents.recipes(event => {
    // Two-ingredient mixes
    const pairs = [
        // [result,  a,        b      ]
        ['lime',     'yellow', 'cyan'],
        ['red',      'yellow', 'magenta'],
        ['blue',     'magenta', 'cyan'],
        ['green',    'yellow', 'blue'],
        ['brown',    'orange', 'black'],
    ];

    pairs.forEach(([result, a, b]) => {
        event.shapeless(
            Item.of(`minecraft:${result}_dye`, 2),
            [`minecraft:${a}_dye`, `minecraft:${b}_dye`]
        ).id(`novus:${result}_dye_from_${a}_and_${b}`);
    });

    // Three-ingredient mix: full CMY -> K
    event.shapeless(
        Item.of('minecraft:black_dye', 3),
        ['minecraft:yellow_dye', 'minecraft:cyan_dye', 'minecraft:magenta_dye']
    ).id('novus:black_dye_from_yellow_cyan_magenta');
});
