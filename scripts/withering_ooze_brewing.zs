// withering_ooze_brewing.zs
//
// Adds brewing-stand recipes so Biomancy's Withering Ooze also converts Healing
// potions into Harming -- mirroring vanilla Fermented Spider Eye, and matching how
// Withering Ooze already does Poison -> Harming inside Biomancy's own jar.
//
//   Potion of Healing    + Withering Ooze -> Potion of Harming
//   Potion of Healing II + Withering Ooze -> Potion of Harming II   (strong -> strong)
//
// WHY CRAFTTWEAKER (not KubeJS): KubeJS 2001 has no brewing event, so the only KubeJS
// route was registering against Forge's BrewingRecipeRegistry via Java.loadClass from a
// startup script -- which is unusable here because KubeJS-Rhino can't resolve the
// Ingredient.of overload (its of(ItemLike...) / of(ItemStack...) varargs are both
// applicable to a single arg, and the ambiguity is inherited onto StrictNBTIngredient
// too). CraftTweaker 14.0.60 ships a first-class, typed brewing API that builds the
// exact same Forge BrewingRecipe against the same registry, with none of the Rhino
// overload trouble -- and it reapplies on /reload instead of needing a full restart.
//
// NBT MATCHING: the input is matched by tag. CraftTweaker wraps a .withTag(...) ingredient
// in its own IngredientCraftTweaker (a custom Forge Ingredient that delegates test() to
// CraftTweaker's partial-NBT matching), so the recipe fires only when the bottle's NBT
// contains {Potion:"minecraft:healing"} -- i.e. Healing only (not water, not strong_healing).
//
// Signature (arg order matters -- confirmed from crafttweaker.log):
//   brewing.addRecipe(IItemStack output, IIngredient reagent, IIngredient basePotion)
// CraftTweaker maps arg2 -> Forge "ingredient" = the REAGENT (top slot) and arg3 ->
// Forge "input" = the BASE POTION (bottom bottle slots). Getting these reversed
// registers a recipe that wants ooze in the bottles and a healing potion as the
// reagent -- it parses fine but never fires in normal use.

brewing.addRecipe(
    <item:minecraft:potion>.withTag({Potion: "minecraft:harming"}),   // output
    <item:biomancy:withering_ooze>,                                   // reagent  (top slot)
    <item:minecraft:potion>.withTag({Potion: "minecraft:healing"}));  // base     (bottle slots)

brewing.addRecipe(
    <item:minecraft:potion>.withTag({Potion: "minecraft:strong_harming"}),
    <item:biomancy:withering_ooze>,
    <item:minecraft:potion>.withTag({Potion: "minecraft:strong_healing"}));
