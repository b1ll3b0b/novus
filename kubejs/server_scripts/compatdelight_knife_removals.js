// Compatdelight knife removals
//
// Removes crafting recipes for two FD-style knives that have no place in the pack:
//   compatdelight:moss_knife       — moss_block + stick
//   compatdelight:sculk_vein_knife — sculk_vein + stick
//
// Source recipes: data/compatdelight/recipes/cavesdelight/{moss_knife,sculk_vein_knife}.json
//
// Why these recipes register without Caves Delight installed:
//   The recipes are gated on `compatdelight:compat_enabled key=caves_delight`,
//   which checks compatdelight's OWN [features] config flag (default: true) —
//   NOT whether the Caves Delight mod is loaded. compatdelight ships its own
//   caves-themed knives that use vanilla moss_block + sculk_vein, so the
//   ingredients always resolve. Confirmed 2026-05-09 after a previous removal
//   script was deleted on the false assumption that gating handled this.
//
// The items remain registered (full removal would need a coremod) but become
// uncraftable. They're hidden from EMI via
// `kubejs/data/c/tags/items/hidden_from_recipe_viewers.json`.
//
// The Deeper-Darker variant `compatdelight:sculk_knife` is left alone because
// its recipe requires `deeperdarker:soul_crystal`, which doesn't exist without
// the Deeper Darker mod installed (not in pack), so the recipe never registers.

ServerEvents.recipes(event => {

    event.remove({ id: 'compatdelight:cavesdelight/moss_knife' })
    event.remove({ id: 'compatdelight:cavesdelight/sculk_vein_knife' })

})
