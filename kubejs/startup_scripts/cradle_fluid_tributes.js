// Registers BAC drink and FR tea/cider fluids as Primordial Cradle fluid tributes.
// Mirrors Biofactory's pattern for Create's potion/tea/honey fluids. Each fluid's
// per-mB tribute is derived from the corresponding drinkable item's Tribute, scaled to
// a 250 mB tankard — identical economics to dropping the keg/bottle into the cradle.
//
// Architecture (two-stage tribute build):
//   Stage 1 (registration-time, this script): for every fluid in DRINKS, look up the
//   item form via FLUID_TO_ITEM_OVERRIDE (or same-modid by default), call
//   Tributes.getTribute(itemStack), and precompute a no-regress fallback FluidTribute.
//   For our drinks this resolves to biomancy's WRONG_ITEM constant (uniform junk
//   values: success=-396, disease=20, hostile=80) — but it's NON-EMPTY, so the
//   conversion registration sticks and the cradle's consumer always has a valid
//   tribute object to call .isEmpty() on.
//
//   Stage 2 (cradle-tick-time, lazy): on the FIRST call into the SAM lambda for a
//   given fluid, query the item's FoodProperties → effects list, build a
//   MobEffectTribute via biomancy's builder (which consults the cradle category
//   tags from kubejs/data/biomancy/tags/mob_effect/cradle/), and cache the result.
//   This has to be deferred because tags are bound at world-load — AFTER our
//   postInit fires. Any failure inside the lambda falls back to the stage-1 value
//   so the cradle never sees null.
//
// Why KubeJS (the CrT port is .disabled): biomancy 1.20.1 ships zero @ZenRegister
// bindings, so ZenScript can't import com.github.elenterius.biomancy.api.tribute.*
// at all. KubeJS-Rhino reaches raw JVM via Java.loadClass.
//
// CRITICAL TIMING: all Java.loadClass calls MUST be deferred into postInit, NOT at
// script top level. Top-level loadClass runs during KubeJS' construction phase
// inside FMLModContainer.constructMod — that's BEFORE RegisterEvent fires. Forcing
// biomancy's FluidTributes/Tributes <clinit> there triggers RegistryObject.get() on
// an unpopulated CREATOR_MIX item, throwing ExceptionInInitializerError. The class
// is then permanently INITIALIZATION_FAILED in this JVM, biofactory's
// BiomancyIntegration can't initialize, and the script-load exception escapes
// constructMod — which makes Forge skip FMLClientSetupEvent for ALL mods, taking
// down anything that initializes its singleton there (notably SodiumDynamicLights →
// NPE on world load). One bug, game-wide cascade. The outer try/catch around the
// postInit body is the second line of defense.
//
// Two Rhino traps inside the postInit body:
//   1. FluidTributes.register has 3 overloads (Fluid / RegistryObject / ResourceLocation)
//      with the same second arg → Rhino's overload picker can be ambiguous. We bypass
//      it by naming the exact JVM signature with bracket-syntax method access
//      (REGISTER_SIG below).
//   2. FluidToTributeConversion is a SAM interface. Rhino's auto-SAM-on-call coercion
//      is finicky; we build the impl explicitly via `new Iface({ methodName: fn })`.

const TANKARD_AMOUNT = 250

// Override map for fluids whose item form lives in a different mod's namespace.
// Keys are fluid IDs, values are the item ID to use for tribute lookup.
// Apple cider: FR ships the fluid (`farmersrespite:apple_cider`) but the bottled
// item lives in Farmer's Delight (`farmersdelight:apple_cider`) — verified via
// the `data/farmersrespite/recipes/filling/apple_cider.json` filling recipe.
// Most drinks (BAC + FR teas + FR's own long/strong cider variants) keep the
// same modid for fluid and item, so they don't need an entry here.
const FLUID_TO_ITEM_OVERRIDE = {
    'farmersrespite:apple_cider': 'farmersdelight:apple_cider',
}

const DRINKS = [
    // BAC keg drinks (mead/saccharine_rum carry Sweet Heart, routed into life_energy via
    // tag overlay; Tipsy/Intoxication-bearers contribute disease).
    'brewinandchewin:mead',
    'brewinandchewin:saccharine_rum',
    'brewinandchewin:beer',
    'brewinandchewin:vodka',
    'brewinandchewin:rice_wine',
    'brewinandchewin:bloody_mary',
    'brewinandchewin:red_rum',
    'brewinandchewin:salty_folly',
    'brewinandchewin:strongroot_ale',
    'brewinandchewin:steel_toe_stout',
    'brewinandchewin:dread_nog',
    'brewinandchewin:egg_grog',
    'brewinandchewin:pale_jane',
    'brewinandchewin:glittering_grenadine',
    'brewinandchewin:kombucha',
    'brewinandchewin:withering_dross',
    // FR kettle drinks
    'farmersrespite:green_tea',
    'farmersrespite:yellow_tea',
    'farmersrespite:black_tea',
    'farmersrespite:rose_hip_tea',
    'farmersrespite:dandelion_tea',
    'farmersrespite:purulent_tea',
    'farmersrespite:coffee',
    'farmersrespite:apple_cider',
    'farmersrespite:long_green_tea',
    'farmersrespite:long_yellow_tea',
    'farmersrespite:long_black_tea',
    'farmersrespite:long_rose_hip_tea',
    'farmersrespite:long_dandelion_tea',
    'farmersrespite:long_purulent_tea',
    'farmersrespite:long_coffee',
    'farmersrespite:long_apple_cider',
    'farmersrespite:strong_green_tea',
    'farmersrespite:strong_yellow_tea',
    'farmersrespite:strong_black_tea',
    'farmersrespite:strong_rose_hip_tea',
    'farmersrespite:strong_purulent_tea',
    'farmersrespite:strong_coffee',
    'farmersrespite:strong_apple_cider',
]

// Bracket-signature method picker — names the exact register(Fluid, FluidToTributeConversion)
// overload so Rhino doesn't have to guess between the 3 overloads.
const REGISTER_SIG = 'register(net.minecraft.world.level.material.Fluid,com.github.elenterius.biomancy.api.tribute.fluid.FluidToTributeConversion)'

StartupEvents.postInit(event => {
    // Outer try/catch: a script-load exception escaping back to FMLModContainer.constructMod
    // would stall the ModLoader state machine and skip FMLClientSetupEvent for every mod.
    // Anything that goes wrong below stays here.
    try {
        // Defer all Java.loadClass calls until postInit (FMLLoadCompleteEvent), which fires
        // after RegisterEvent has populated every RegistryObject. Forcing biomancy's
        // <clinit> chain at this point is safe.
        //
        // `var` (not `const`/`let`) on the locals: in this Rhino flavour, declaring
        // `const X = Java.loadClass(...)` inside a try block trips
        // `InternalError: TypeError: redeclaration of var X` even on first run — Rhino's
        // const lowering interacts badly with the Java.loadClass return path. `var` is
        // forgiving (no error on re-declaration) and works fine. Dollar-prefix is
        // cosmetic — keeps the locals visually distinct from the simple class name.
        var $FluidTributes            = Java.loadClass('com.github.elenterius.biomancy.api.tribute.fluid.FluidTributes')
        var $FluidTribute             = Java.loadClass('com.github.elenterius.biomancy.api.tribute.fluid.FluidTribute')
        var $FluidToTributeConversion = Java.loadClass('com.github.elenterius.biomancy.api.tribute.fluid.FluidToTributeConversion')
        var $MobEffectTribute         = Java.loadClass('com.github.elenterius.biomancy.api.tribute.MobEffectTribute')
        var $Tributes                 = Java.loadClass('com.github.elenterius.biomancy.api.tribute.Tributes')
        var $ForgeRegistries          = Java.loadClass('net.minecraftforge.registries.ForgeRegistries')
        var $ResourceLocation         = Java.loadClass('net.minecraft.resources.ResourceLocation')
        var $ItemStack                = Java.loadClass('net.minecraft.world.item.ItemStack')

        let registered = 0
        let skipped_no_fluid = 0
        let skipped_no_item = 0
        let skipped_empty_tribute = 0
        let errors = 0

        DRINKS.forEach(id => {
            try {
                var rl = $ResourceLocation.tryParse(id)
                if (rl === null) {
                    console.warn(`[cradle_fluid_tributes] Bad resource id: ${id}`)
                    errors++
                    return
                }
                var fluid = $ForgeRegistries.FLUIDS.getValue(rl)
                if (fluid === null) { skipped_no_fluid++; return }

                // Route the item lookup through FLUID_TO_ITEM_OVERRIDE if needed.
                // For apple_cider this swaps farmersrespite → farmersdelight namespace.
                var resolvedItemId = FLUID_TO_ITEM_OVERRIDE[id] || id
                var itemRl = (resolvedItemId === id) ? rl : $ResourceLocation.tryParse(resolvedItemId)
                var item = $ForgeRegistries.ITEMS.getValue(itemRl)
                if (item === null) { skipped_no_item++; return }

                // Stage 1 — startup-time fallback: precompute via Tributes.getTribute →
                // FluidTribute.of. For our drinks this resolves to biomancy's WRONG_ITEM
                // constant (uniform junk values), but it's NON-EMPTY which is all we need
                // to make registration stick so the cradle's consumer accepts the fluid.
                // No-regress floor — even if the stage-2 runtime build below fails or
                // finds nothing, we land here.
                var itemStack = new $ItemStack(item, 1)
                var fallbackItemTribute = $Tributes.getTribute(itemStack)
                if (fallbackItemTribute === null || fallbackItemTribute.isEmpty()) {
                    skipped_empty_tribute++
                    return
                }
                var fallbackMilli = $FluidTribute.of(fallbackItemTribute, TANKARD_AMOUNT)

                // Stage 2 — runtime-lazy, tag-aware tribute. addEffect queries
                // ModMobEffectTags.isCradleXxxSource(effect), which requires the user's
                // overlay tags (kubejs/data/biomancy/tags/mob_effect/cradle/*) to be
                // bound — and they're loaded at world-start via KubeJS' datapack, AFTER
                // our postInit fires. So we build the real tribute at FIRST call inside
                // the SAM lambda (cradle-tick time, tags are bound by then), cache it,
                // and reuse the cache for all subsequent ticks. Any failure inside this
                // lambda falls back to the stage-1 fallback so the cradle never sees
                // null and never crashes its tick.
                var ADD_EFFECT_SIG = 'addEffect(net.minecraft.world.effect.MobEffectInstance)'
                var cachedMilli = null

                var conversion = new $FluidToTributeConversion({
                    getTributePerUnit: function (resource) {
                        if (cachedMilli !== null) return cachedMilli
                        try {
                            var foodProps = item.getFoodProperties()
                            if (foodProps === null) {
                                cachedMilli = fallbackMilli
                                return cachedMilli
                            }
                            var effects = foodProps.getEffects()
                            if (effects === null || effects.isEmpty()) {
                                cachedMilli = fallbackMilli
                                return cachedMilli
                            }
                            var b = $MobEffectTribute.builder()
                            for (var i = 0; i < effects.size(); i++) {
                                b[ADD_EFFECT_SIG](effects.get(i).getFirst())
                            }
                            var built = b.build()
                            if (built.isEmpty()) {
                                cachedMilli = fallbackMilli
                                return cachedMilli
                            }
                            cachedMilli = $FluidTribute.of(built, TANKARD_AMOUNT)
                            return cachedMilli
                        } catch (e) {
                            console.warn(`[cradle_fluid_tributes] runtime build failed for ${id}, using fallback: ${e}`)
                            cachedMilli = fallbackMilli
                            return cachedMilli
                        }
                    },
                })
                $FluidTributes[REGISTER_SIG](fluid, conversion)
                registered++
            } catch (e) {
                errors++
                console.warn(`[cradle_fluid_tributes] Failed for ${id}: ${e}`)
            }
        })

        console.log(`[cradle_fluid_tributes] Registered=${registered}, ` +
                    `skipped(no_fluid=${skipped_no_fluid}, no_item=${skipped_no_item}, ` +
                    `empty_tribute=${skipped_empty_tribute}), errors=${errors}`)
    } catch (e) {
        // Last-resort containment — log and swallow so we don't take down ModLoader.
        console.error(`[cradle_fluid_tributes] FATAL setup error (contained): ${e}`)
    }
})
