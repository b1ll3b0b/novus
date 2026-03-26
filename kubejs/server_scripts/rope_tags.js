// Adds supplementaries:rope to the farmersdelight:ropes tag.
// This makes all FD recipes that consume rope via tag automatically
// accept Supplementaries rope as an ingredient.
ServerEvents.tags('item', event => {
    event.add('farmersdelight:ropes', 'supplementaries:rope')
})
