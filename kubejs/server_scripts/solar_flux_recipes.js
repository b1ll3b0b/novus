// Solar Flux Reborn — Create integration
// Keeps tiers 3, 4, 5 only. Removes all other panel and intermediate item recipes.
// Gates panels behind Create materials with upgrade and direct-craft paths.
//
// Upgrade path:   tier 3 → tier 4 → tier 5 (uses previous panel as ingredient)
// Direct craft:   tier 4 and 5 can be built fresh, slightly cheaper than upgrade total
//
// Upgrades kept:   efficiency, transfer_rate, capacity (redesigned with Create materials)
// Upgrades removed: traversal, dispersive, block_charging, furnace
// Intermediates removed: mirror, blazing_coating, emerald_glass, ender_glass,
//                        blank_upgrade, photovoltaic_cell_1-6

ServerEvents.recipes(event => {

    // =========================================================================
    // REMOVE — disabled panels (tiers 1, 2, 6, 7, 8)
    // =========================================================================
    event.remove({ id: 'solarflux:solar_panel_1' })
    event.remove({ id: 'solarflux:solar_panel_2' })
    event.remove({ id: 'solarflux:solar_panel_6' })
    event.remove({ id: 'solarflux:solar_panel_7' })
    event.remove({ id: 'solarflux:solar_panel_8' })

    // =========================================================================
    // REMOVE — disabled upgrade recipes
    // =========================================================================
    event.remove({ id: 'solarflux:traversal_upgrade' })
    event.remove({ id: 'solarflux:dispersive_upgrade' })
    event.remove({ id: 'solarflux:block_charging_upgrade' })
    event.remove({ id: 'solarflux:furnace_upgrade' })

    // =========================================================================
    // REMOVE — intermediate crafting items no longer needed
    // =========================================================================
    event.remove({ id: 'solarflux:mirror' })
    event.remove({ id: 'solarflux:blazing_coating' })
    event.remove({ id: 'solarflux:emerald_glass' })
    event.remove({ id: 'solarflux:ender_glass' })
    event.remove({ id: 'solarflux:blank_upgrade' })
    event.remove({ id: 'solarflux:photovoltaic_cell_1' })
    event.remove({ id: 'solarflux:photovoltaic_cell_2' })
    event.remove({ id: 'solarflux:photovoltaic_cell_3' })
    event.remove({ id: 'solarflux:photovoltaic_cell_4' })
    event.remove({ id: 'solarflux:photovoltaic_cell_5' })
    event.remove({ id: 'solarflux:photovoltaic_cell_6' })

    // =========================================================================
    // REMOVE — existing tier 3, 4, 5 panel recipes (we replace them below)
    // =========================================================================
    event.remove({ id: 'solarflux:solar_panel_3' })
    event.remove({ id: 'solarflux:solar_panel_4' })
    event.remove({ id: 'solarflux:solar_panel_5' })

    // =========================================================================
    // SOLAR PANEL III — entry point, mid Create
    // Layout:
    //   G G G   Glass Pane x3
    //   I R I   Iron Sheet x2, Redstone x1
    //   I D I   Iron Sheet x2, Daylight Detector x1
    // Gates behind mechanical press (iron sheets)
    // =========================================================================
    event.shaped(
        'solarflux:solar_panel_3',
        [
            'GGG',
            'IRI',
            'IDI'
        ],
        {
            G: 'minecraft:glass_pane',
            I: 'create:iron_sheet',
            R: 'minecraft:redstone',
            D: 'minecraft:daylight_detector'
        }
    ).id('novus:solar_panel_3_fresh')

    // =========================================================================
    // SOLAR PANEL IV — upgrade path (tier 3 + brass materials)
    // Layout:
    //   E B E   Electron Tube x2, Brass Ingot x1
    //   B P B   Brass Ingot x2, Solar Panel III x1
    //   E B E   Electron Tube x2, Brass Ingot x1
    // =========================================================================
    event.shaped(
        'solarflux:solar_panel_4',
        [
            'EBE',
            'BPB',
            'EBE'
        ],
        {
            E: 'create:electron_tube',
            B: 'create:brass_ingot',
            P: 'solarflux:solar_panel_3'
        }
    ).id('novus:solar_panel_4_upgrade')

    // Solar Panel IV — direct craft (slightly cheaper than upgrade total)
    // Layout:
    //   G B G   Glass Pane, Brass Ingot, Glass Pane
    //   I E I   Iron Sheet, Electron Tube, Iron Sheet
    //   I D I   Iron Sheet, Daylight Detector, Iron Sheet
    event.shaped(
        'solarflux:solar_panel_4',
        [
            'GBG',
            'IEI',
            'IDI'
        ],
        {
            G: 'minecraft:glass_pane',
            B: 'create:brass_ingot',
            I: 'create:iron_sheet',
            E: 'create:electron_tube',
            D: 'minecraft:daylight_detector'
        }
    ).id('novus:solar_panel_4_fresh')

    // =========================================================================
    // SOLAR PANEL V — upgrade path (tier 4 + refined radiance)
    // Layout:
    //   R T R   Refined Radiance x2, Electron Tube x1
    //   T P T   Electron Tube x2, Solar Panel IV x1
    //   R T R   Refined Radiance x2, Electron Tube x1
    // =========================================================================
    event.shaped(
        'solarflux:solar_panel_5',
        [
            'RTR',
            'TPT',
            'RTR'
        ],
        {
            R: 'create:refined_radiance',
            T: 'create:electron_tube',
            P: 'solarflux:solar_panel_4'
        }
    ).id('novus:solar_panel_5_upgrade')

    // Solar Panel V — direct craft
    // Layout:
    //   R B R   Refined Radiance x2, Brass Block x1
    //   I E I   Iron Sheet x2, Electron Tube x1
    //   I D I   Iron Sheet x2, Daylight Detector x1
    event.shaped(
        'solarflux:solar_panel_5',
        [
            'RBR',
            'IEI',
            'IDI'
        ],
        {
            R: 'create:refined_radiance',
            B: 'create:brass_block',
            I: 'create:iron_sheet',
            E: 'create:electron_tube',
            D: 'minecraft:daylight_detector'
        }
    ).id('novus:solar_panel_5_fresh')

    // =========================================================================
    // UPGRADES — redesigned with Create materials
    // =========================================================================

    // Efficiency Upgrade — andesite alloy + redstone (early Create gate)
    event.shaped(
        'solarflux:efficiency_upgrade',
        [
            'ARA',
            'R R',
            'ARA'
        ],
        {
            A: 'create:andesite_alloy',
            R: 'minecraft:redstone'
        }
    ).id('novus:efficiency_upgrade')

    // Transfer Rate Upgrade — brass ingot + copper wire (mid Create)
    event.shaped(
        'solarflux:transfer_rate_upgrade',
        [
            'BCB',
            'C C',
            'BCB'
        ],
        {
            B: 'create:brass_ingot',
            C: 'createaddition:copper_wire'
        }
    ).id('novus:transfer_rate_upgrade')

    // Capacity Upgrade — electron tube + brass casing (mid-late Create)
    event.shaped(
        'solarflux:capacity_upgrade',
        [
            'EBE',
            'B B',
            'EBE'
        ],
        {
            E: 'create:electron_tube',
            B: 'create:brass_casing'
        }
    ).id('novus:capacity_upgrade')

})
