// Solar Panel base recipe — Create integration
// Replaces the vanilla jar recipe with one requiring Create-processed materials.
// Layout:
//   G G G   (Glass Pane x3)
//   S R S   (Iron Sheet x2, Redstone x1)
//   S D S   (Iron Sheet x2, Daylight Detector x1)
// Iron Sheets gate this behind a mechanical press.
// Daylight Detector is thematic — it already "detects sunlight".
ServerEvents.recipes(event => {

    event.remove({ output: 'solar_panels:solar_panel' })

    event.shaped(
        'solar_panels:solar_panel',
        [
            'GGG',
            'SRS',
            'SDS'
        ],
        {
            G: 'minecraft:glass_pane',
            S: 'create:iron_sheet',
            R: 'minecraft:redstone',
            D: 'minecraft:daylight_detector'
        }
    ).id('novus:solar_panel_create')

    // Tiers 3 and 4 use minecraft:barrier as their upgrade item, which JEI/EMI
    // typically filters out of recipe views automatically. If tier 3 or 4 upgrade
    // recipes still surface in EMI or JEI, uncomment the block below to hide them.
    //
    // event.remove({ id: 'solar_panels:upgrade_tier3' })
    // event.remove({ id: 'solar_panels:upgrade_tier4' })

})
