// Initial Inventory — items given to every new player on first join
// Requires: InitialInventory + CraftTweaker
//
// Hotbar slots 0-8. Slots 0, 1, and 2 are left empty (selected slot at launch).
//
// Layout:
//   0: [empty]
//   1: [empty]
//   2: [empty]  — was Stone Axe, removed 2026-05-18
//   3: Materials and You
//   4: Dynamic Trees Guide
//   5: Lexica Botania
//   6: Agricraft Journal
//   7: Compass
//   8: Calendar

import mods.initialinventory.InvHandler;

InvHandler.addStartingItem("default", <item:tconstruct:materials_and_you>,                                             3);
InvHandler.addStartingItem("default", <item:patchouli:guide_book>.withTag({"patchouli:book": "dynamictrees:guide"}),   4);
InvHandler.addStartingItem("default", <item:botania:lexicon>,                                                          5);
InvHandler.addStartingItem("default", <item:agricraft:journal>,                                                        6);
InvHandler.addStartingItem("default", <item:minecraft:compass>,                                                        7);
InvHandler.addStartingItem("default", <item:sereneseasons:calendar>,                                                   8);
