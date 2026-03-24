#modloader forge
/*
 * Author: RebelliousUno
*/
import crafttweaker.forge.api.event.block.fluid.FluidPlaceBlockEvent;

events.register<crafttweaker.forge.api.event.block.fluid.FluidPlaceBlockEvent>(event => {
      event.newState = getNewBlockState(event.liquidPos, event.level, event.newState);		
});
