// Scarecrow <-> Macaw's Holidays integration.  2026-05-25.
//
// Scarecrows' Territory ships 16 functional scarecrows (primitive + 15 dye
// colors) but only ONE base craft: `scarecrowsterritory:scarecrow`, a shaped
// recipe (carved pumpkin / hay block / 3 wooden rods) that yields the
// primitive_scarecrow. Every other colour is a shapeless recolor of an
// existing scarecrow + dye.
//
// Macaw's Holidays adds a purely decorative `mcwholidays:scarecrow` with its
// own recipe (carved pumpkin + 2 wheat + hay block).
//
// This script makes Macaw's scarecrow the single gateway into the ST line:
//
//   1. Remove ST's base shaped recipe (scarecrowsterritory:scarecrow).
//   2. Remove Macaw's own scarecrow recipe (mcwholidays:scarecrow) -- per user
//      direction, ST's recipe REPLACES it rather than coexisting.
//   3. Re-add ST's shaped recipe shape verbatim, but output mcwholidays:scarecrow.
//   4. Add 16 shapeless recipes: Macaw's scarecrow + a dye tag -> the matching
//      ST scarecrow. Purple maps to primitive_scarecrow (ST has no "purple"
//      scarecrow -- primitive occupies that slot, exactly as ST's own
//      primitive_scarecrow recolor recipe uses forge:dyes/purple).
//
// ST's 16 native recolor recipes (#scarecrowsterritory:primitive_scarecrows +
// dye) are intentionally LEFT IN PLACE -- once you own one functional ST
// scarecrow you can still recolor it between colours. Those recipes key on the
// primitive_scarecrows tag, which does NOT contain mcwholidays:scarecrow, so
// they never overlap with the Macaw-based recipes added here.
//
// Net flow:  pumpkin + hay + 3 rods -> Macaw scarecrow (decorative)
//            Macaw scarecrow + dye  -> functional ST scarecrow (any colour)
//            ST scarecrow + dye     -> recolor (ST's own recipes, unchanged)

ServerEvents.recipes(event => {

    // --- 1 & 2: drop the two base recipes ----------------------------------
    event.remove({ id: 'scarecrowsterritory:scarecrow' })
    event.remove({ id: 'mcwholidays:scarecrow' })

    // --- 3: ST's base shape now produces Macaw's scarecrow -----------------
    // Pattern and ingredients are ST's original `scarecrow` recipe verbatim:
    // carved pumpkin on top, hay block centre, 3 wooden rods (forge tag).
    event.shaped(
        'mcwholidays:scarecrow',
        [
            ' A ',
            'BCB',
            ' B '
        ],
        {
            A: 'minecraft:carved_pumpkin',
            B: '#forge:rods/wooden',
            C: 'minecraft:hay_block'
        }
    ).id('novus:macaw_scarecrow_from_pumpkin')

    // --- 4: Macaw scarecrow + dye -> the 16 ST scarecrows ------------------
    // Dye colour -> ST scarecrow item id. Purple -> primitive_scarecrow.
    const scarecrowByDye = {
        white:      'white_scarecrow',
        orange:     'orange_scarecrow',
        magenta:    'magenta_scarecrow',
        light_blue: 'light_blue_scarecrow',
        yellow:     'yellow_scarecrow',
        lime:       'lime_scarecrow',
        pink:       'pink_scarecrow',
        gray:       'gray_scarecrow',
        light_gray: 'light_gray_scarecrow',
        cyan:       'cyan_scarecrow',
        purple:     'primitive_scarecrow',
        blue:       'blue_scarecrow',
        brown:      'brown_scarecrow',
        green:      'green_scarecrow',
        red:        'red_scarecrow',
        black:      'black_scarecrow'
    }

    Object.keys(scarecrowByDye).forEach(dye => {
        event.shapeless(
            'scarecrowsterritory:' + scarecrowByDye[dye],
            [
                'mcwholidays:scarecrow',
                '#forge:dyes/' + dye
            ]
        ).id('novus:scarecrow_' + dye + '_from_macaw')
    })

})
