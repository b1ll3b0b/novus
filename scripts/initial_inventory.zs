// Initial Inventory — items given to every new player on first join
// Requires: InitialInventory + CraftTweaker
//
// Hotbar slots 0-8. Slots 0-3 are left empty.
//
// Layout:
//   0: [empty]
//   1: [empty]
//   2: [empty]
//   3: [empty]
//   4: Traveler's Companion (Patchouli book — patchouli:travelers_companion)
//   5: Materials and You
//   6: Lexica Botania
//   7: Compass
//   8: Calendar
//
// History:
//   2026-05-18 — removed Stone Axe
//   2026-05-19 — added Traveler's Companion (slot 2)
//   2026-05-19 — removed Dynamic Trees Guide
//   2026-05-19 — reordered: travelers, agricraft, botania, materials, compass, calendar
//   2026-05-19 — removed Agricraft Journal; Traveler's Companion moved to its slot (4)
//   2026-05-19 — swapped Lexica Botania and Materials and You (slots 5 and 6)

import mods.initialinventory.InvHandler;

InvHandler.addStartingItem("default", <item:patchouli:guide_book>.withTag({"patchouli:book": "patchouli:travelers_companion"}), 4);
InvHandler.addStartingItem("default", <item:tconstruct:materials_and_you>,                                                       5);
InvHandler.addStartingItem("default", <item:botania:lexicon>,                                                                    6);
InvHandler.addStartingItem("default", <item:minecraft:compass>,                                                                  7);
InvHandler.addStartingItem("default", <item:sereneseasons:calendar>,                                                             8);
