// Compatdelight knife removals
//
// Removes the crafting recipes for two FD-style knives that have no place in the pack:
//   compatdelight:moss_knife        — moss block + stick
//   compatdelight:sculk_vein_knife  — sculk vein + stick
//
// Source recipes: data/compatdelight/recipes/cavesdelight/{moss_knife,sculk_vein_knife}.json
//
// The items remain registered (full removal would require a coremod) — they
// just have no obtainable craft and will appear in EMI as recipe-less items.
// The sibling Deeper-Darker `compatdelight:sculk_knife` (soul-crystal-based) is
// intentionally left alone.

ServerEvents.recipes(event => {

    event.remove({ id: 'compatdelight:cavesdelight/moss_knife' })
    event.remove({ id: 'compatdelight:cavesdelight/sculk_vein_knife' })

})
