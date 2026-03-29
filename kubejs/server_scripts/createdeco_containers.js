// CreateDeco — remove shipping container recipes
// Decorative shipping containers conflict by name with Vibrant Vaults' functional ones.
// 16 colours × 2 recipe paths (direct craft + dye-from-vault) = 32 removals.

ServerEvents.recipes(event => {
    const colors = [
        'black', 'blue', 'brown', 'cyan', 'gray', 'green',
        'light_blue', 'light_gray', 'lime', 'magenta',
        'orange', 'pink', 'purple', 'red', 'white', 'yellow'
    ]

    colors.forEach(color => {
        event.remove({ id: `createdeco:${color}_shipping_container` })
        event.remove({ id: `createdeco:${color}_shipping_container_from_dyeing_vaults` })
    })
})
