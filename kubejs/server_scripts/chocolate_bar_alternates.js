// Chocolate-bar alternates for cocoa-based recipes.
//
// Adds bar-based alternate paths to vanilla-bean chocolate recipes (originals
// stay craftable, the alternates are an opt-in "fancier" route via the
// forge:bars/chocolate tag):
//   - novus:chocolate_pie_from_bar             -> farmersdelight:chocolate_pie
//   - novus:chocolate_glazed_chicken_from_bar  -> farmersdelightplus:chocolate_glazed_chicken
//   - novus:chocolate_pancake_from_bar         -> farmersdelightplus:chocolate_pancake
// Conversion rule: 1 chocolate bar (forge:bars/chocolate) ≈ 2 cocoa beans.
//
// Tag membership is set in kubejs/data/forge/tags/items/bars/chocolate.json.
// Dark chocolate (compatdelight:dark_chocolate_bar) and blazing chocolate
// (tgears:bar_of_blazing_chocolate) are intentionally NOT in that tag — they
// stay in their own lanes. See memory/project_novus_chocolate_tiering.md.
//
// Sweet Delight compatdelight conversions (Part 2 in earlier versions of this
// script) were removed 2026-05-08 after the user confirmed Sweet Delight is
// permanently out of the pack. Backup at
// Novus/backups/20260508_223406_drop_sweetdelight_compat/.

ServerEvents.recipes(event => {

    // FarmersDelight chocolate pie — original uses 3 cocoa beans + 3 milk + 2 sugar.
    // Alternate: 2 bars + 1 pie crust. The bars are the full filling; milk and
    // sugar already live inside each bar, so no extra fillers.
    event.shapeless(
        'farmersdelight:chocolate_pie',
        [
            'farmersdelight:pie_crust',
            '#forge:bars/chocolate',
            '#forge:bars/chocolate'
        ]
    ).id('novus:chocolate_pie_from_bar')


    // FarmersDelightPlus chocolate glazed chicken — cooking pot.
    // Original: 2 cocoa beans + chicken + potato + onion (tag) + sugar.
    // Clean swap: 2 beans -> 1 bar.
    event.custom({
        type: 'farmersdelight:cooking',
        container: { item: 'farmersdelight:cooked_rice' },
        cookingtime: 200,
        experience: 1.0,
        ingredients: [
            { item: 'minecraft:chicken' },
            { item: 'minecraft:potato' },
            { tag: 'forge:crops/onion' },
            { tag: 'forge:bars/chocolate' },
            { item: 'minecraft:sugar' }
        ],
        recipe_book_tab: 'meals',
        result: { item: 'farmersdelightplus:chocolate_glazed_chicken' }
    }).id('novus:chocolate_glazed_chicken_from_bar')


    // FarmersDelightPlus chocolate pancake — shapeless crafting.
    // Original uses 1 cocoa bean; using a whole bar is a slight overpay,
    // which is fine for an opt-in "fancier pancake" path.
    event.shapeless(
        'farmersdelightplus:chocolate_pancake',
        [
            'farmersdelightplus:empty_pancake',
            '#forge:bars/chocolate',
            'farmersdelight:milk_bottle',
            'minecraft:sugar'
        ]
    ).id('novus:chocolate_pancake_from_bar')

})
