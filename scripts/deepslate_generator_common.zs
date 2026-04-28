/*
 * Author: RebelliousUno
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

    // Andesite trigger: diorite substrate at ANY Y level. Mirrors the vanilla
    // diorite+cobble=andesite recipe and gives Create starters an early on-ramp.
    if (blockBelow == <blockstate:minecraft:diorite>
        || blockBelow == <blockstate:minecraft:polished_diorite>) {
        return <block:minecraft:andesite>.getDefaultState();
    }

    // Tuff trigger: sandstone substrate at ANY Y level. Surface-accessible like
    // the andesite path so players can farm it without digging to deepslate depth.
    if (blockBelow == <blockstate:minecraft:sandstone>
        || blockBelow == <blockstate:minecraft:cut_sandstone>
        || blockBelow == <blockstate:minecraft:chiseled_sandstone>
        || blockBelow == <blockstate:minecraft:red_sandstone>
        || blockBelow == <blockstate:minecraft:cut_red_sandstone>
        || blockBelow == <blockstate:minecraft:chiseled_red_sandstone>) {
        return <block:minecraft:tuff>.getDefaultState();
    }

    // Below this point: deepslate-tier conversions, gated to y < 1 (the script's
    // original purpose — turning lava+water into deepslate at deepslate depth).
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
