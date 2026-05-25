// Disable the Dynamic Trees Manual (Patchouli book: dynamictrees:guide).
//
// Two-part suppression, both pack-side (no jar edits):
//   1. kubejs/data/dynamictrees/patchouli_books/guide/book.json overrides DT's
//      book.json with "dont_generate_book": true — Patchouli no longer adds a
//      book item to the creative tab, so it also stops appearing in EMI.
//   2. This script removes the only survival recipe (book + DT seed), so the
//      Manual cannot be crafted either.
//
// Why: the Dynamic Trees Manual still describes mechanics this pack has
// overridden (e.g. the dirt-bucket seed conversion — generateDirtBucketRecipes
// is false here, and seed<->sapling conversion is gated through
// dt_seed_sapling_recipes.js). The Traveler's Companion "Trees & Catalysts"
// entry is the pack-accurate replacement.
//
// NOTE: removal is by recipe id only. Do NOT remove by output —
// patchouli:guide_book is shared by every Patchouli book in the pack
// (Traveler's Companion, Primordial Index), so an output-based remove would
// delete those recipes too.
ServerEvents.recipes(event => {
  event.remove({ id: 'dynamictrees:guide' })
})
