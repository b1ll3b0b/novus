#modloader forge
/*
 * Forge-side hook for the lava/water generator overrides.
 *
 * Subscribes to FluidPlaceBlockEvent (which has no KubeJS wrapper) and
 * routes the resulting BlockState through getNewBlockState() in
 * deepslate_generator_common.zs for the actual conversion logic.
 *
 * Original Forge subscription pattern: RebelliousUno.
*/
import crafttweaker.forge.api.event.block.fluid.FluidPlaceBlockEvent;

events.register<crafttweaker.forge.api.event.block.fluid.FluidPlaceBlockEvent>(event => {
      event.newState = getNewBlockState(event.liquidPos, event.level, event.newState);
});
