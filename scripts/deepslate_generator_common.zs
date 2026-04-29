/*
 * Lava + water generator overrides — substrate-based conversions.
 *
 * Three rules, evaluated in order. Overworld-only; other dimensions pass
 * through with vanilla behavior.
 *
 *   1. Lava/water on diorite (any Y)     -> andesite
 *   2. Lava/water on sandstone (any Y)   -> tuff
 *   3. Lava/water on stone/cobble (y<1)  -> deepslate / cobbled_deepslate
 *
 * Rules 1 and 2 are surface-accessible Create starter on-ramps that mirror
 * the vanilla diorite+cobble=andesite recipe pattern. Rule 3 is the original
 * deepslate-depth conversion (RebelliousUno's deepslate_generator).
*/

import crafttweaker.api.block.BlockState;
import crafttweaker.api.world.Level;
import crafttweaker.api.util.math.BlockPos;


public function getNewBlockState(liquidPos as BlockPos, level as Level, newState as BlockState) as BlockState {
    // Overworld-only: Nether, End, and modded dimensions pass through with vanilla behavior.
    if (level.dimension != <resource:minecraft:overworld>) {
        return newState;
    }

    var blockBelow = level.getBlockState(liquidPos.below());

    // 1. Andesite trigger — diorite substrate at ANY Y level. Mirrors the
    //    vanilla diorite+cobble=andesite recipe and gives Create starters an
    //    early on-ramp.
    if (blockBelow == <blockstate:minecraft:diorite>
        || blockBelow == <blockstate:minecraft:polished_diorite>) {
        return <block:minecraft:andesite>.getDefaultState();
    }

    // 2. Tuff trigger — sandstone substrate at ANY Y level. Surface-accessible
    //    like the andesite path so players can farm it without digging to
    //    deepslate depth.
    if (blockBelow == <blockstate:minecraft:sandstone>
        || blockBelow == <blockstate:minecraft:cut_sandstone>
        || blockBelow == <blockstate:minecraft:chiseled_sandstone>
        || blockBelow == <blockstate:minecraft:red_sandstone>
        || blockBelow == <blockstate:minecraft:cut_red_sandstone>
        || blockBelow == <blockstate:minecraft:chiseled_red_sandstone>) {
        return <block:minecraft:tuff>.getDefaultState();
    }

    // 3. Deepslate-tier conversions — gated to y < 1 (the script's original
    //    purpose: turning lava+water into deepslate at deepslate depth).
    val yLevel = 1;
    if (liquidPos.y >= yLevel) {
        return newState;
    }

    if (newState == <blockstate:minecraft:cobblestone>) {
        return <block:minecraft:cobbled_deepslate>.getDefaultState();
    }

    if (newState == <blockstate:minecraft:stone>) {
        return <block:minecraft:deepslate>.getDefaultState();
    }

    return newState;
}
