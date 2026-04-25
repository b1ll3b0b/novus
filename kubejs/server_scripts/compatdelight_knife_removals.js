// Compatdelight knife removals
// Removes crafting recipes for two FD-style knives that have no place in the pack:
//   compatdelight:moss_knife        — moss block + stick
//   compatdelight:sculk_vein_knife  — sculk vein + stick
// Source recipes: data/compatdelight/recipes/cavesdelight/{moss_knife,sculk_vein_knife}.json
// Items remain registered (registry deletion requires a coremod); they're just
// uncraftable. They will still appear in JEI as recipe-less items.

ServerEvents.recipes(event => {

    event.remove({ id: 'compatdelight:cavesdelight/moss_knife' })
    event.remove({ id: 'compatdelight:cavesdelight/sculk_vein_knife' })

})
