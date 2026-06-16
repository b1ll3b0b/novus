# Lost Cities — City Placement Reference

Reference for the **where/how** of city generation in Lost Cities.
- Mod: `lostcities-1.20-7.4.13.jar` (Forge 1.20.1, modid `lostcities`)
- Profile this maps to: `config/lostcities/profiles/novus.json`
- Verified against decompiled source (CFR) on 2026-06-13. Bracketed values `[…]` are the current `novus.json` settings.

---

## Determinism / seed dependence (important)

City generation is a two-stage process:

1. **Candidate centers — seed-independent.** Whether a chunk is a *candidate* city center, and its radius, come from RNG seeded **only by chunk coordinates**, not the world seed:
   ```java
   isCityCenter:  new Random(chunkZ*797003437 + chunkX*295075153)   // no world seed
   getCityRadius: new Random(chunkZ*100001653 + chunkX*295075153)   // no world seed
   ```
   So the candidate lattice is identical in every world for a given `cityChance`.

2. **Realized cities — seed-dependent.** A candidate only becomes a real city if it clears terrain/biome filters that *do* depend on the seed (see `getCityFactor`):
   ```java
   if (heightmap.getHeight() < CITY_MINHEIGHT) return 0;   // terrain too low
   if (heightmap.getHeight() > CITY_MAXHEIGHT) return 0;   // terrain too high
   factor *= worldStyle.getCityChanceMultiplier(...);      // biome/world-style multiplier
   ```

**Consequence:** to compute the *actual* city map you need the seed (to know terrain height per candidate chunk). Without it you can only enumerate the maximal candidate set. `avoidWater` does **not** filter placement — it just replaces water with air; deep-ocean suppression comes from the `cityMinHeight` floor.

Only **building styles, loot, spawners, and city contents** are purely seed-driven cosmetics on top of placement.

---

## 1. Placement mode — the `cityChance` sign

| Mode | Trigger | Character | Key knobs |
|---|---|---|---|
| **Scatter** (current) | `cityChance ≥ 0` | Each chunk independently rolls to be a center; cities are disks of random radius. Evenly-random, isolated cities. | `cityChance` density [0.001], `cityMinRadius`/`cityMaxRadius` [50 / 128], `cityThreshold` [0.2] |
| **Perlin** | `cityChance = -1` | Cities come from a noise field — large *contiguous* urban regions with big empty gaps ("city-continents"). Used by `largecities`. | `cityPerlinScale` [3.0], `cityPerlinOffset` [0.1], `cityPerlinInnerScale` [0.1], `cityThreshold` |

- `cityChance` range is **−1.0 … 1.0**. `0.0` = no random cities. Positive = rarer as it approaches 0 (practical floor ~`1e-6` = one city per world). Negative flips to perlin mode (not "rarer").
- `cityThreshold` — overlapping city circles add their coverage; this is the cutoff for "counts as city." Lower = larger/softer footprints and easier merging of neighbors.

### Spacing math (scatter mode)
- Avg distance to nearest city ≈ **8 / √cityChance** blocks.
- Cities in an area ≈ **chunks × cityChance** (1 chunk = 16×16 blocks), minus a few % for merging.

| cityChance | ~nearest city | ~cities / 4k×4k |
|---|---|---|
| 0.001 (current) | 250 blk | ~50 |
| 0.0005 | 360 blk | ~30 |
| 0.0003 | 460 blk | ~18 |
| 0.0002 | 610 blk | ~12 |
| 0.0001 | 800 blk | ~6 |

---

## 2. Terrain / height gating (seed-dependent)

| Field [current] | Effect |
|---|---|
| `cityMinHeight` [50] / `cityMaxHeight` [150] | Cities only where the **terrain surface** Y is in this band. Excludes deep oceans and high peaks. Main knob for "off mountains / out of oceans" vs "everywhere." |
| `landscapeType` [default] | Vertical context: `default` = on normal terrain · `floating` = sky islands · `cavern` = underground · `space`/spheres = bubbles in void. (Selectable: default, floating, space, cavern.) |
| `cityLevel0Height … cityLevel7Height` [75…131] | Terrain-height tiers that set each city's "level," controlling how it terraces on slopes and its building height range. |
| `cityAvoidVoid` [true] | Floating-mode only — skip void-edge chunks so cities don't overhang island borders. |

---

## 3. Distance-from-spawn shaping

`citySpawnDistance1` / `citySpawnDistance2` (blocks) + `citySpawnMultiplier1` / `citySpawnMultiplier2` (0–1) — scale city density by distance from world spawn. Currently **off** (`citySpawnDistance2 = 0`).

- Example "clean spawn, ruins out in the world": `distance1=0, multiplier1=0, distance2=2000, multiplier2=1` → no cities within ~2000 blocks of spawn, full density beyond, linear ramp between.
- Reverse the multipliers for "cities cluster near spawn, fade out."

---

## 4. Biome-based control (data-driven, not in the profile)

The `worldStyle` city-chance multiplier reads `CityBiomeMultiplier` assets + a `BiomeSelectionStrategy` (e.g. `randomized`). Per-biome multipliers (0 in oceans, boosted in plains, etc.) are the real "cities only in certain biomes" control. Lives in a worldstyle/datapack override, **not** `novus.json`.

---

## 5. Hand-placed / fixed cities (data-driven)

`PredefinedCity` assets pin a specific city at exact chunk coordinates with a chosen layout and size — guaranteed locations independent of the random roll. Use for a designated capital, a spawn showcase city, or seeded server landmarks. `spawnCity` forces the player to start inside a named predefined city.

---

## 6. Player-spawn controls (player start point only — NOT city placement)

`spawnBiome`, `spawnCity`, `spawnSphere`, `spawnNotInBuilding`, `forceSpawnInBuilding`, `forceSpawnBuildings`, `forceSpawnParts`. These steer where the player spawns, not where cities generate.

---

## Perlin mode in depth (`cityChance = -1`)

Instead of rolling each chunk independently (scatter), perlin mode samples one continuous, seeded **noise field** across the world; wherever it rises above a threshold = city. Because noise is smooth and spatially correlated, cities form **large, contiguous, organically-shaped regions** with irregular borders and wide wilderness gaps. This is the `largecities` mode.

**Exact math** (`CityRarityMap.getCityFactor`, per chunk):

```
noise  = fractalSimplex(cx / scale, cz / scale)   // cx,cz in chunks; 4 octaves; seeded by WORLD SEED
factor = noise * innerScale - offset              // clamped to >= 0
city if  factor > cityThreshold                    (then height/biome/spawn-distance filters apply)
```

The fractal (`noiseAt`) sums 4 SimplexNoise octaves weighted **1, 2, 4, 8 toward the broadest** layer, so the field is dominated by a slow, large-amplitude wave (reaches ~±8–15, not ±1) — that broad wave is what makes city *regions* instead of speckle.

**The boolean reduces to one cutoff:** city where `noise > C`, with
```
C = (cityThreshold + offset) / innerScale
```
So `innerScale`, `offset`, `threshold` are partly redundant — only `C` (and `scale`) matter for *where* cities are. Fixing `innerScale = 0.1`, `threshold = 0.1` gives `C = 1 + 10·offset`, i.e. **`offset` alone dials rarity**, **`scale` dials size**.

**Knobs:**

| Field | Role | Direction |
|---|---|---|
| `cityPerlinScale` | **Size** of city regions (divides coords). | Bigger = larger cities + larger gaps; smaller = smaller, more frequent blobs. |
| `cityPerlinOffset` | **Rarity** ("sea level" of the field). | Higher = rarer / smaller patches; lower/negative = more coverage. |
| `cityPerlinInnerScale` | Field **contrast** (amplitude). | Higher = sharper borders, more area past cutoff. |
| `cityThreshold` | City cutoff; pairs with `offset`. | Higher = rarer. |
| `cityChance` | Mode flag — only the **sign** is read (`< 0`). | `-1` by convention; magnitude ignored. |

`cityMinRadius`/`cityMaxRadius` are **not used** in perlin mode (extent comes from the noise field, not disks).

**Seed dependence:** perlin uses `provider.getSeed()`, so regions differ per world (unlike the scatter candidate-lattice).

**Scatter vs perlin:**

| | Scatter (`cityChance ≥ 0`) | Perlin (`cityChance = -1`) |
|---|---|---|
| Shape | Uniform circles (r 50–128) | Organic blobs, irregular borders |
| Distribution | Evenly random, isolated | Clumped — fewer, larger regions |
| Rarity dial | One clean dial (`cityChance`), tidy spacing math | `offset` (+`threshold`); `scale` sets size; no simple distance formula |
| Per-world | Candidate positions identical across seeds | Fully seed-varied |
| Best for | Many small, evenly-spaced ruins | A few large sprawling metropolises |

**Rare + organic:** keep a broad-ish `scale` and push `offset` up so only the rare highest noise peaks qualify — only the "summits" of the broad wave clear the cutoff, giving sparse, well-separated, organically-edged city patches.

**Tuned Novus values (current in `novus.json`):** perlin mode at ~`0.0002`-equivalent rarity.

```
cityChance           = -1.0     # perlin mode
cityPerlinScale      = 7.0      # region size
cityPerlinOffset     = 0.5      # rarity dial (cutoff C = 1 + 10*offset = 6.0)
cityPerlinInnerScale = 0.1
cityThreshold        = 0.1
```

Simulated behavior (fractal field, before the terrain-height filter trims it further): **~11 distinct cities per 4k×4k** (matches `0.0002` scatter's count), **~2.7% city land**, average city ~225 blocks across, organically-edged and **clustered on high ground** with wide wilderness troughs between hill systems (perlin clumps; it doesn't space evenly like scatter). `cityMinHeight`/`cityMaxHeight` [50/150] then removes the ocean-floor and high-peak parts, so in-game count runs a bit lower — i.e. slightly rarer still.

**`offset` is the single rarity dial** (innerScale/threshold fixed): lower = more/larger cities, higher = rarer. Reference points at scale 7.0: `0.40`→~13/4k (6% land), `0.50`→~11/4k (2.7%), `0.55`→~7/4k (1.6%). Bump `cityPerlinScale` for bigger/fewer regions, drop it for smaller/tighter ones. These are simulation estimates (opensimplex stand-in for MC SimplexNoise) — expect in-game to be in the same ballpark, and tune `offset` live if needed.

---

## High-value levers for "rare, isolated cities on vanilla terrain"

- `cityChance` — overall density / spacing.
- `citySpawnDistance1/2` + `citySpawnMultiplier1/2` — keep spawn area clean, push cities outward.
- `cityMinHeight` / `cityMaxHeight` — decide whether peaks and oceans are fair game.
- Biome multipliers (worldstyle datapack) — restrict to flatlands/specific biomes.
- `PredefinedCity` — guaranteed showcase landmark(s).

---

## Novus profile — final settings (`config/lostcities/profiles/novus.json`)

The complete tuned `novus` profile. **Shipped as the overworld default for 1.1.1 (2026-06-15), but player-selectable:** the default is delivered via `selectedProfile = "novus"` in `defaultconfigs/lostcities-server.toml` (seeds every fresh world, SP + server; `getProfileForDimension` reads it server-side → cities overlaid on the unchanged vanilla biome/terrain layout). Singleplayer players can pick "Disabled" in the LC world-creation menu for a pure-vanilla surface. (Supersedes the original "inert / disabled by default" stance, AND an interim `dimensionsWithProfiles=minecraft:overworld=novus` global force that was dropped because it can't be turned off from the menu — see `DECISIONS.md` resolution-order note.) **Parked server variant:** a hard-forced copy (`dimensionsWithProfiles` incl. `minecraft:overworld=novus`, no opt-out) is stashed disabled in `_server_deploy/` for a future dedicated-server build that should force LC for everyone.

**Placement (perlin mode):**

| field | value | note |
|---|---|---|
| `cityChance` | `-1.0` | perlin mode (sign-only flag) |
| `cityPerlinScale` | `7.0` | region size |
| `cityPerlinOffset` | `0.5` | rarity dial (cutoff C = 6.0) → ~11 cities/4k×4k, ~2.7% land |
| `cityPerlinInnerScale` | `0.1` | contrast |
| `cityThreshold` | `0.1` | city cutoff |
| `cityMinHeight` / `cityMaxHeight` | `50` / `150` | trims ocean-floor + high-peak cities (seed-dependent) |
| `cityMinRadius` / `cityMaxRadius` | `50` / `128` | unused in perlin mode |

**Structure / systems:**

| field | value | note |
|---|---|---|
| `landscapeType` | `default` | cities overlaid on vanilla terrain (no spheres) |
| `ruinChance` | `0.0` | no structural floor-chopping — buildings intact |
| `generateSpawners` | `false` | no mob spawners |
| `generateLighting` | `false` | leave lighting to the normal engine (lower gen cost) |
| `highwayDistanceMask` | `0` | highways disabled |
| `railwaysEnabled` / `railwayStationsEnabled` / `railwaySurfaceStationsEnabled` | `true` | subways + stations on |
| `railwaysCanEnd` | `true` | rails stop near cities (no global lattice — by choice; cities not linked) |
| `explosionChance` / `miniExplosionChance` | `0.0` / `0.0` | no craters/holes |

*Lighting + spawners both off is deliberate: with `generateLighting false`, interiors and cellars sit at light level 0, so vanilla **natural** hostile spawning supplies the danger — no need for LC's artificial spawner blocks (`generateSpawners false`). The threat comes from the darkness reclaiming the city, reinforcing the abandoned feel.*

**Overgrowth ("reclaimed by nature"):**

| field | value | note |
|---|---|---|
| `vineChance` | `0.25` | vines draping building facades |
| `randomLeafBlockChance` | `0.14` | leaf/moss overgrowth density + height driver |
| `randomLeafBlockThickness` | `4` | foliage band 4 blocks out from buildings (8/16 of border) |
| `rubbleLayer` | `true` | overgrown ground layer |
| `rubbleDirtScale` / `rubbleLeaveScale` | `2.0` / `3.0` | dirt/leaf ground reclamation (inverse: lower = more) |

**Leaf-overgrowth height mechanics (the part we tuned hardest):** columns stack from the ground via a geometric roll, per-block chance `v = min(0.8, randomLeafBlockChance × (thickness+1 − distanceFromWall))`, **hard-capped at 30 blocks** in code. There's no height field — `randomLeafBlockChance` is the height/density driver, `randomLeafBlockThickness` is horizontal spread (and feeds the height multiplier, so raising it re-tallens). At `0.14 / 4`: typical tallest clump per building ~4–5, ~1% of buildings get a 15+ pillar (the intended "wild but rare towers" look). Lower `chance` to tame the tail (exponentially), raise it for wilder/denser. `0.35 / 4` was the over-dial that produced full-building-height leaf/moss monoliths.
