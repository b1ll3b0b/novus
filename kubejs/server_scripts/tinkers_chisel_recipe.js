// Tinker's Things chisel — recipe change
//
// Resolves a recipe-shape collision with Farmer's Delight flint_knife:
//   farmersdelight:flint_knife   — minecraft:flint over minecraft:stick
//   tinkers_things:chisel        — minecraft:flint over #forge:rods/wooden
//                                  (forge:rods/wooden tag resolves to stick;
//                                  the two recipes share an identical shape and
//                                  whichever loaded last silently won the grid)
//
// Source recipe: data/tinkers_things/recipes/chisel/crafting.json (in
//   Tinker-Things-1.20.1-1.3.3.jar).
//
// New shape (chosen 2026-05-28): iron nugget on top, stick on bottom — keeps
// the chisel a cheap starter tool but reads as a forged metal blade rather
// than a knapped flint edge, so it's no longer in competition with the
// flint knife or any other primitive flint+stick recipe.

ServerEvents.recipes(event => {

    event.remove({ id: 'tinkers_things:chisel/crafting' })

    event.shaped(
        'tinkers_things:chisel',
        [
            'N',
            'S'
        ],
        {
            N: 'minecraft:iron_nugget',
            S: '#forge:rods/wooden'
        }
    ).id('tinkers_things:chisel/crafting')

})
