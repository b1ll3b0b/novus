// Seed Oil — recipe cleanup
// Removes:
//   createaddition:compacting/seed_oil — duplicate plant oil; diesel generators fills this niche

ServerEvents.recipes(event => {

    // CreateAddition seed oil compacting — redundant with diesel generators plant oil.
    // Both register under forge:plantoil. Keep diesel generators as the sole source.
    event.remove({ id: 'createaddition:compacting/seed_oil' })

})
