// Chocolate-bar alternates for cocoa-based recipes +
// compatdelight conversions from hardcoded milk_chocolate_bar to tag.
//
// Part 1 — ADDITIONS (vanilla bean recipes stay, bar-based alternates added):
//   - novus:chocolate_pie_from_bar             -> farmersdelight:chocolate_pie
//   - novus:chocolate_glazed_chicken_from_bar  -> farmersdelightplus:chocolate_glazed_chicken
//   - novus:chocolate_pancake_from_bar         -> farmersdelightplus:chocolate_pancake
// Conversion rule: 1 chocolate bar (forge:bars/chocolate) ≈ 2 cocoa beans.
//
// Part 2 — REPLACEMENTS (originals removed, tag-based versions added):
//   - compatdelight:sweetdelight/chocolate_caramel
//       -> novus:chocolate_caramel_from_bar
//   - compatdelight:sweetdelight/chocolate_filled_marshmallow
//       -> novus:chocolate_filled_marshmallow_from_bar
//   Both replacements preserve the original forge:item_exists +
//   compatdelight:compat_enabled (key: sweet_delight) Forge conditions, so the
//   recipes drop out gracefully if Sweet Delight integration is disabled.
//
// Tag membership is set in kubejs/data/forge/tags/items/bars/chocolate.json.
// Dark chocolate (compatdelight:dark_chocolate_bar) and blazing chocolate
// (tgears:bar_of_blazing_chocolate) are intentionally NOT in that tag — they
// stay in their own lanes. See memory/project_novus_chocolate_tiering.md.

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


    // ── Part 2: compatdelight conversions ──────────────────────────────────
    // The originals hardcode compatdelight:milk_chocolate_bar. Swap to the
    // forge:bars/chocolate tag so Create's bar also satisfies them. Dark bar
    // is intentionally excluded from that tag, so dark still can't be used.

    // chocolate_caramel — cooking pot
    event.remove({ id: 'compatdelight:sweetdelight/chocolate_caramel' })
    event.custom({
        type: 'farmersdelight:cooking',
        cookingtime: 200,
        experience: 1.0,
        ingredients: [
            { tag: 'forge:bars/chocolate' },
            { item: 'compatdelight:caramel' }
        ],
        recipe_book_tab: 'meals',
        result: { item: 'compatdelight:chocolate_caramel' },
        conditions: [
            { type: 'forge:item_exists', item: 'compatdelight:chocolate_caramel' },
            { type: 'compatdelight:compat_enabled', key: 'sweet_delight' }
        ]
    }).id('novus:chocolate_caramel_from_bar')


    // chocolate_filled_marshmallow — cooking pot
    event.remove({ id: 'compatdelight:sweetdelight/chocolate_filled_marshmallow' })
    event.custom({
        type: 'farmersdelight:cooking',
        cookingtime: 200,
        experience: 1.0,
        ingredients: [
            { item: 'compatdelight:marshmallow' },
            { tag: 'forge:bars/chocolate' }
        ],
        recipe_book_tab: 'meals',
        result: { item: 'compatdelight:chocolate_filled_marshmallow' },
        conditions: [
            { type: 'forge:item_exists', item: 'compatdelight:chocolate_filled_marshmallow' },
            { type: 'compatdelight:compat_enabled', key: 'sweet_delight' }
        ]
    }).id('novus:chocolate_filled_marshmallow_from_bar')

})
