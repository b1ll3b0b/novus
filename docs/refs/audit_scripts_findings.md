# audit_scripts_findings.md — Novus KubeJS + CraftTweaker script audit

**Date:** 2026-05-08
**Scope:** 9 KubeJS server scripts, 2 KubeJS client scripts, 2 KubeJS startup scripts, 3 CraftTweaker scripts (15 total).
**Reference docs:** STYLE_GUIDE.md, VANILLA_REFERENCE.md, scripting-tools-catalog.md.

## Overall script-side health

The script set is in **very good** shape. Every non-stub file has a real purpose, the tool split between KubeJS and CraftTweaker matches the catalog's decision tree exactly (KubeJS for recipes/tags/loot, CT only for the two capability gaps — `FluidPlaceBlockEvent` and `mods.initialinventory.*`), and the heavyweight scripts (`cradle_fluid_tributes.js`, `quiver_drop.js`, `powah_tier_lock.js`) all carry detailed authorial-intent headers that explain not just what but **why**, including the lessons-learned bits about recursion, phase-mismatch, and Rhino quirks. No stale references to the removed `solarflux`, `hammerlib`, `tgears`, `tponder`, `dataanchor`, `corgilib`, `enhancedcelestials`, or `entity_sound_features` appear in any script body (the only `tgears` mention is in a comment in `chocolate_bar_alternates.js` documenting the exclusion from the chocolate-bar tag — that's expected). No `add_loot_table` GLM patterns. No `is null` in CT. No `.location()` reach-through on `level.dimension`. The two `example.js` stubs are KubeJS-template-default and explicitly exempt from this audit.

Findings below are a small list of quibbles, not breakages — the worst is a misleading comment block, the most concrete is a doc-out-of-sync issue between a script's inline rationale and the canonical memory file.

---

### [MEDIUM] Inline comment in `powah_tier_emi_hide.js` contradicts the canonical memory

**File:** `kubejs/client_scripts/powah_tier_emi_hide.js` (lines 4-7, also 38-40)
**Category:** C (convention / documentation accuracy)
**Refs section violated:** STYLE_GUIDE §4 Pack-specific KubeJS standing rules; memory `reference_emi_hide_items.md`
**Issue:** The header comment claims:

> EMI honors JEI's hide events through its bundled JEI compatibility layer (visible in EMI startup logs as "jei:internal" plugin), so a single JEIEvents.hideItems call covers both viewers in this pack.

This contradicts the standing memory and the STYLE_GUIDE, both of which state that `JEIEvents.hideItems` is **inert** in this pack. The pack ships **TooManyRecipeViewers** (a JEI-shim plugin for EMI), not real JEI — and per the style guide, "TooManyRecipeViewers ships a stub plugin but doesn't bridge JEI hides into EMI's stack list." The actionable hide path is `c:hidden_from_recipe_viewers` (which the pack already uses via the companion JSON files at `kubejs/data/c/tags/{items,blocks}/hidden_from_recipe_viewers.json`).

The script itself is fine to keep — the style guide explicitly says to retain it as documented intent against a future JEI install — but its comment is misleading future-readers about how the hide actually works in this pack. Inline comment block at lines 38-40 echoes the same misconception ("event.hide(string) is a silent no-op... Item.of(id) produces an ItemStack which matches the expected hide(ItemStack) signature") which is true bytecode-wise but irrelevant because the entire callback doesn't reach EMI.

**Suggested fix:** leave alone — flagging only. (If touched: rewrite header to say "this call is inert in the current modset; the actionable hide path is the c:hidden_from_recipe_viewers tag at kubejs/data/c/tags/...; this script is retained for forward-compat against a future real-JEI install.")

---

### [LOW] `powah_tier_lock.js` bookkeeping variable is misleading

**File:** `kubejs/server_scripts/powah_tier_lock.js` (lines 45-47)
**Category:** F (structural)
**Refs section violated:** STYLE_GUIDE §4 (clarity / authorial intent)
**Issue:**

```js
let energizingRemoved = 0
event.remove({type: 'powah:energizing'})
energizingRemoved++  // we issue 1 type-filter call; KubeJS handles the multi-removal internally
```

The variable is incremented exactly once regardless of how many recipes are actually removed (the comment admits as much). It's then never used in the final log line — only `removeCount` and the energizing reference get logged. Dead state; misleading name (`energizingRemoved` reads like a count of recipes when it's a count of API calls).

**Suggested fix:** leave alone — flagging only.

---

### [LOW] `powah_tier_lock.js` doesn't sanity-check that Powah is loaded

**File:** `kubejs/server_scripts/powah_tier_lock.js` (entire script)
**Category:** F (structural; defensive)
**Refs section violated:** STYLE_GUIDE §3 "Required vs. optional fields"
**Issue:** `event.remove({output: 'powah:...'})` and `event.remove({type: 'powah:energizing'})` will silently no-op if Powah is uninstalled (KubeJS just doesn't find any matches), so it's not a crasher. But the script has 130 IDs hardcoded — if Powah is removed in the future, all those calls become noise and the `console.log` reports a misleading "Removed recipes for 130 Powah items." There is no `if (Platform.isLoaded('powah')) { ... }` style guard. Per memory `project_powah_added.md`, Powah is the SolarFlux replacement and Novus's chosen FE backbone — likely permanent — so this is genuinely low-priority.

**Suggested fix:** leave alone — flagging only. (If touched: wrap in `if (Platform.isLoaded('powah'))` for resilience against future mod removal.)

---

### [LOW] `chocolate_bar_alternates.js` removes recipes that may already not exist

**File:** `kubejs/server_scripts/chocolate_bar_alternates.js` (lines 79, 98)
**Category:** F (structural)
**Refs section violated:** none directly — observation
**Issue:** The `compatdelight:sweetdelight/chocolate_caramel` and `compatdelight:sweetdelight/chocolate_filled_marshmallow` recipes are gated on Sweet Delight being installed. **Sweet Delight is NOT installed** in the current modset (`/mods/` glob shows no `sweet_delight*.jar`). compatdelight's `compat_enabled` condition will already prevent those recipes from loading, so the `event.remove({id: ...})` calls are removing recipes that aren't there. The replacement recipes carry the same conditions, so they too won't load. Functionally inert — no harm, no foul — but the script is doing 4 lines of work for zero effect under the current modset.

This is the design — the conditions ride along as forward-compat in case Sweet Delight is later added — so flagging only.

**Suggested fix:** leave alone — flagging only.

---

### [LOW] `cradle_fluid_tributes.js` console.log uses ES6 template literals

**File:** `kubejs/startup_scripts/cradle_fluid_tributes.js` (lines 143, 172-175, 216-219, 222, 232, 236-238, 241)
**Category:** F (structural; Rhino dialect)
**Refs section violated:** STYLE_GUIDE §4 "Rhino + try/block + const = redeclaration error" (related — Rhino dialect awareness)
**Issue:** The script's body uses backtick-string template literals (`\`[cradle_fluid_tributes] ${id}: ...\``). KubeJS-Rhino 2001.2.3-build.10 does support template literals (this script clearly loads and runs based on the v3.7 shipping memory), but the rest of the pack's scripts uniformly use string concatenation (`'[powah_tier_emi_hide] Hid ' + hideCount + ...`). This is a stylistic inconsistency only — Rhino-Forge has handled template literals since at least 2001.2.0 — but worth noting given the script's other Rhino-defensive patterns (`var`-only inside try blocks, explicit method-signature picker, explicit SAM construction).

**Suggested fix:** leave alone — flagging only. (Per memory `project_novus_cradle_fluid_tributes.md` the script is shipping and confirmed working at v3.7.)

---

### [LOW] `cradle_fluid_tributes.js` mixes `let` and `var` inside the try block

**File:** `kubejs/startup_scripts/cradle_fluid_tributes.js` (lines 133-137 vs. lines 124-131, 141, 147, 152-154, 163, 169, 187-188)
**Category:** F (structural; Rhino dialect)
**Refs section violated:** STYLE_GUIDE §4 "Rhino + try/block + const = redeclaration error"
**Issue:** The header comment (lines 119-123) explains exactly why the `Java.loadClass` results use `var` not `const`/`let` — Rhino's lowering trips a redeclaration error. **But** counters declared further down in the same try use `let` (`let registered = 0`, `let skipped_no_fluid = 0`, etc., lines 133-137). The Rhino-redeclaration concern applies symmetrically to all `try`-scoped bindings — the trap doesn't care whether the value comes from `Java.loadClass` or `0`. If the script loads cleanly today, it's because Rhino's redeclaration trap is specific to certain initialization patterns (likely the `Java.loadClass` return path the comment calls out), not all `let` uses. Still, applying the rule consistently would be safer per the comment's own logic.

**Suggested fix:** leave alone — flagging only. (Memory says the script is shipping at v3.7 and confirmed good; don't touch a working file for stylistic uniformity.)

---

### [LOW] `cmyk_dye_mixing.js` uses semicolons; rest of pack inconsistent

**File:** `kubejs/server_scripts/cmyk_dye_mixing.js` (entire file)
**Category:** C (convention adherence)
**Refs section violated:** none — observation
**Issue:** This file is the only one in `server_scripts/` that consistently uses statement-terminating semicolons. `rope_recipes.js`, `seed_oil.js`, `chocolate_bar_alternates.js`, `compatdelight_knife_removals.js`, `matrix_enchanting.js`, `quiver_drop.js`, `rope_tags.js` all omit them; `powah_tier_lock.js` is mixed. JavaScript ASI handles either style; no runtime impact.

**Suggested fix:** leave alone — flagging only.

---

### [LOW] `seed_oil.js` filename understates scope

**File:** `kubejs/server_scripts/seed_oil.js`
**Category:** C (convention adherence — file naming)
**Refs section violated:** STYLE_GUIDE §4 (file naming defaults)
**Issue:** The filename is `seed_oil.js` but the script is a one-line removal of `createaddition:compacting/seed_oil`. Currently fine since there's only one operation, but if more "plant oil cleanup" or "createaddition recipe pruning" lands here the name will be confusing. Compare to the pack's other narrowly-named scripts (`rope_recipes.js`, `compatdelight_knife_removals.js`) which describe the operation, not just a noun.

**Suggested fix:** leave alone — flagging only.

---

### [LOW] `deepslate_generator_common.zs` — `val yLevel = 1` is constant; could be top-level

**File:** `scripts/deepslate_generator_common.zs` (line 51)
**Category:** F (structural; minor)
**Refs section violated:** none
**Issue:** `val yLevel = 1;` is declared inside the function body but is a compile-time constant. ZS allows top-level constants; promoting it would group all magic numbers in one place. Tiny ergonomics nit; not a bug.

**Suggested fix:** leave alone — flagging only.

---

### [LOW] `deepslate_generator_forge.zs` — duplicate fully-qualified type name

**File:** `scripts/deepslate_generator_forge.zs` (lines 11, 13)
**Category:** C (convention adherence)
**Refs section violated:** STYLE_GUIDE §5 "Import patterns"
**Issue:** Line 11 imports `crafttweaker.forge.api.event.block.fluid.FluidPlaceBlockEvent`, but line 13 still uses the fully-qualified path inside `events.register<...>`:

```zs
events.register<crafttweaker.forge.api.event.block.fluid.FluidPlaceBlockEvent>(event => {
```

The import is unused — ZenScript's generic-arg slot doesn't auto-resolve from imports the way Java does. Could be either the import or the FQCN — the current state has both. Cosmetic only.

**Suggested fix:** leave alone — flagging only.

---

## Items checked and CLEAN (no findings)

For the avoidance of doubt, the following deliberate audit checks all came back clean:

- **No GLM `add_loot_table`-style recursion patterns** in any script. `quiver_drop.js` explicitly documents why it uses `ServerEvents.entityLootTables` instead, citing the recursion incident.
- **No stale references to removed mods** (solarflux, hammerlib, tgears, tponder, dataanchor, corgilib, enhancedcelestials, entity_sound_features). The only `tgears` token in the whole script tree is a comment in `chocolate_bar_alternates.js` documenting the deliberate exclusion of `tgears:bar_of_blazing_chocolate` from the chocolate-bar tag — that's expected and correct per memory `project_novus_chocolate_tiering.md`.
- **No `level.dimension.location()` misuse** in CT. `deepslate_generator_common.zs` line 23 uses the correct `level.dimension != <resource:minecraft:overworld>` form per memory `reference_crafttweaker_api_gotchas.md`.
- **No `is null` in CT**. Both `==` checks in the .zs files use `==`/`!=` correctly.
- **Tool split is correct**. The two CT scripts use capabilities KubeJS lacks (Forge `FluidPlaceBlockEvent` event subscription, `mods.initialinventory.InvHandler.addStartingItem`). Neither would gain anything from porting to KubeJS, and per memory `project_novus_kubejs_vs_crafttweaker.md` they shouldn't be touched. KubeJS scripts in turn use no Forge events and no mod-specific scripting APIs — they all fit cleanly within KubeJS's curated event set.
- **All recipe IDs use `novus:` namespace** for pack-authored recipes per STYLE_GUIDE §4.3.
- **`event.remove({id: ...})` vs `event.remove({output: ...})` choice is intentional and correct.** Rope script uses output-remove (intentional wipe of all FD-rope-producing recipes); seed_oil and compatdelight knife removals use ID-remove (single specific recipe).
- **`cradle_fluid_tributes.js` correctly defers `Java.loadClass` into postInit**, with outer try/catch as the second line of defense, exactly as STYLE_GUIDE §4 prescribes. The header comment is the most thorough authorial-intent block in the pack.
- **`quiver_drop.js` is the gold-standard server script** the style guide already cites — header explains the GLM-vs-event decision, drop math, and design rationale.
- **`example.js` stubs are excluded per audit scope** — both files contain only the KubeJS template `console.info('Hello, World!')` greeting.
- **No Paxi-related work** in any script (per memory `feedback_paxi_off_limits.md`).
- **No destructive in-pack work without obvious safety** — the only data-mutating script is `powah_tier_lock.js`, which is recipe removals only and has its own backout via deleting/disabling the script + reload.

---

## Sorted punch list

| Severity | File | Issue |
|---|---|---|
| MEDIUM | `kubejs/client_scripts/powah_tier_emi_hide.js` | Header comment claims EMI honors JEI hide events via TMRV; per memory and STYLE_GUIDE that's wrong (call is inert). Script is correctly retained for forward-compat — only the comment misleads. |
| LOW | `kubejs/server_scripts/powah_tier_lock.js` | `energizingRemoved` counter is dead state, never logged. |
| LOW | `kubejs/server_scripts/powah_tier_lock.js` | No `Platform.isLoaded('powah')` guard — silently no-ops if Powah is removed. |
| LOW | `kubejs/server_scripts/chocolate_bar_alternates.js` | Removes/replaces compatdelight recipes that don't load without Sweet Delight; intentional forward-compat, no actual effect under current modset. |
| LOW | `kubejs/startup_scripts/cradle_fluid_tributes.js` | Mixes `let` and `var` in try-block; header explains the `var`-only rule but counters use `let`. Working today; flagged for consistency. |
| LOW | `kubejs/startup_scripts/cradle_fluid_tributes.js` | Uses ES6 template literals; rest of pack uses string concatenation. Stylistic only. |
| LOW | `kubejs/server_scripts/cmyk_dye_mixing.js` | Only server script using semicolons consistently — rest of pack omits them. |
| LOW | `kubejs/server_scripts/seed_oil.js` | Filename understates scope; fine for now, will get confusing if file grows. |
| LOW | `scripts/deepslate_generator_common.zs` | `val yLevel = 1` is a constant inside the function body; could be top-level. |
| LOW | `scripts/deepslate_generator_forge.zs` | Imports `FluidPlaceBlockEvent` then uses FQCN in generic arg — duplicate naming. |

**Severity counts:** 0 HIGH, 1 MEDIUM, 9 LOW.
