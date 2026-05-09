// powah_tier_lock.js — server-side full Powah recipe wipe.
// Originally 2026-05-01 as a curated tier-lockdown ID list.
// Rewritten 2026-05-09 to wipe ALL Powah recipes wholesale, in preparation for
// Create-style replacement recipes the user is authoring separately.
//
// === Current behavior ===
//
// Removes every recipe whose ID lives in the `powah:` namespace via
// `event.remove({mod: 'powah'})`. That covers crafting, smelting, blasting,
// AND every Powah-specific recipe type (energizing, etc.) in one sweep.
// Nothing from Powah is craftable via vanilla mechanisms after this script
// runs — the items remain registered, but they have no obtainable recipe
// path until the user ships replacement recipes (planned: Create-style
// compacting / pressing / mixing / mechanical_crafting).
//
// === Why a wholesale wipe instead of the previous ID list ===
//
// The earlier curated 130-item lockdown was scoped to "tier 3+ devices stay
// blocked while tier 1-2 craftable" and required hand-maintenance every time
// Powah added or renamed something. The user has now decided to rewrite ALL
// Powah recipes in Create's style, so the ID-list approach is obsolete:
// every Powah recipe gets removed regardless of tier, and the new craft path
// will replace them via separate `kubejs/data/<mod>/recipes/...` files
// authored by the user.
//
// === EMI visibility (companion files, NOT this script) ===
//
// `kubejs/data/c/tags/{items,blocks}/hidden_from_recipe_viewers.json` control
// which Powah items appear in EMI's browser. As of 2026-05-09:
//   - All 5 battery tiers are visible (battery is the user's prototype family)
//   - 6 "enabled" device families' hardened items are visible: battery,
//     energy_cable, energy_cell, energy_discharger, energy_hopper, solar_panel
//   - All other Powah items (9 fully-locked machine families + 4 higher
//     crystal tiers + utility items + worldgen items) remain EMI-hidden
//
// The asymmetry is deliberate: visible items are the work-surface for the
// upcoming Create-recipe authoring; hidden items are the longer-term
// expansion zone the user hasn't started designing yet.
//
// === Side effects ===
//
// - The createaddition charged_snowball recipe at
//   `kubejs/data/createaddition/recipes/charging/charged_snowball.json`
//   remains the only path to charged_snowball (it was a replacement for
//   Powah's energizing recipe, which is now part of the wipe — replacement
//   already in place).
// - Worldgen disable still controlled by `config/powah.json5`
//   (worldgen.disable_all = true) — separate from this script.
// - Mob farms, Powah's solar regen, etc. are gameplay mechanics not affected
//   by recipe removal; only craftability is touched.
//
// === Maintenance ===
//
// When Powah updates: nothing to do here. The wholesale wipe handles new
// recipes automatically. EMI visibility for any new items will need a
// separate decision (add to the hide tag, or leave visible).
//
// Source-of-truth doc for which items are visible vs hidden:
// Novus/DISABLED_ITEMS.md (legacy from the curated-list era; verify against
// the actual c-tag files when in doubt).

ServerEvents.recipes(event => {

    // Wipe every recipe in the powah: namespace.
    // KubeJS counts internally; we just trigger the removal.
    event.remove({ mod: 'powah' })

    console.log('[powah_tier_lock] Wiped all powah:* recipes via mod-namespace filter')
})
