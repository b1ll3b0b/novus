// Initial Inventory — items given to every new player on first join
// Requires: InitialInventory + CraftTweaker
//
// Hotbar slots 0-8. Slot 0 is left empty (selected slot at launch).
//
// Layout:
//   0: [empty]
//   1: Stone Axe
//   2: Stone Pickaxe
//   3: Stone Shovel
//   4: Materials and You
//   5: Lexica Botania
//   6: Compass
//   7: Clock
//   8: Calendar

import mods.initialinventory.InvHandler;

InvHandler.addStartingItem("default", <item:minecraft:stone_axe>,          1);
InvHandler.addStartingItem("default", <item:minecraft:stone_pickaxe>,      2);
InvHandler.addStartingItem("default", <item:minecraft:stone_shovel>,       3);
InvHandler.addStartingItem("default", <item:tconstruct:materials_and_you>, 4);
InvHandler.addStartingItem("default", <item:botania:lexicon>,              5);
InvHandler.addStartingItem("default", <item:minecraft:compass>,            6);
InvHandler.addStartingItem("default", <item:minecraft:clock>,              7);
InvHandler.addStartingItem("default", <item:sereneseasons:calendar>,       8);
