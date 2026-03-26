// Rope streamlining: Supplementaries rope is canonical.
//
// - Removes FD's rope recipe entirely
// - Replaces it with the same ingredients outputting supplementaries:rope
// - FD rope is only obtainable via 1:1 shapeless conversion from supplementaries:rope
// - Both directions are available for cosmetic access
ServerEvents.recipes(event => {

    // Remove all recipes that output farmersdelight:rope.
    // FD rope is now only obtainable via the conversion recipe below.
    event.remove({ output: 'farmersdelight:rope' })

    // Restore FD's rope recipe but output supplementaries:rope.
    // Original: 2 straw in a column -> 4 rope
    event.shaped(
        Item.of('supplementaries:rope', 4),
        [
            'S',
            'S'
        ],
        {
            S: 'farmersdelight:straw'
        }
    ).id('novus:straw_to_supplementaries_rope')

    // 1:1 shapeless conversion: supplementaries:rope <-> farmersdelight:rope
    event.shapeless('farmersdelight:rope', ['supplementaries:rope'])
        .id('novus:supplementaries_rope_to_fd_rope')

    event.shapeless('supplementaries:rope', ['farmersdelight:rope'])
        .id('novus:fd_rope_to_supplementaries_rope')

})
