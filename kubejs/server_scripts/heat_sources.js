// Heat Sources — recipe cleanup
// Removes:
//   moreburners:ember_burner  — Dwarven Burner, requires Embers mod items not in pack
//   createaddition:compacting/seed_oil — duplicate plant oil; diesel generators fills this niche

ServerEvents.recipes(event => {

    // Dwarven Burner — requires embers:mechanical_core + forge:plates/dawnstone,
    // neither of which have production routes in this pack
    event.remove({ id: 'moreburners:ember_burner' })

    // CreateAddition seed oil compacting — redundant with diesel generators plant oil.
    // Both register under forge:plantoil. Keep diesel generators as the sole source.
    event.remove({ id: 'createaddition:compacting/seed_oil' })

})
