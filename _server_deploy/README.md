# _server_deploy — parked server-only overrides

Files here are **server-only and parked**. They live inside the pack repo (so they're
version-controlled on `dev`) but are excluded from the packwiz index via `.packwizignore`
(`/_server_deploy/`), so `packwiz refresh` never indexes them and they never ship to client
installs. Apply them on top of the extracted **dedicated-server** pack (manually for now, or via
a future server-build divergence step). Paths mirror their on-server location, so each one is a
drop-in: copy `_server_deploy/<path>` → `<server>/<path>`.

These three are the deliberate **singleplayer-vs-server behavior splits**: the shipped pack is
tuned for singleplayer (forgiving, player-toggleable), and these swap in the multiplayer balance.

| Override | Shipped (client/SP) | This server variant |
|---|---|---|
| `config/lostcities/common.toml` | LC overworld default-on, player can pick "Disabled" in the menu | `dimensionsWithProfiles` force-includes `minecraft:overworld=novus` → LC guaranteed for everyone, no per-player opt-out |
| `config/sereneseasons/seasons.toml` | `sub_season_duration = 8`, `progress_season_while_offline = false` | `sub_season_duration = 168` + `progress_season_while_offline = true` → 1 season ≈ 1 real week of server uptime, progresses while empty |
| `kubejs/server_scripts/default_gamerules.js` | (not present — SP keeps vanilla sleep / night-skip) | sets `playersSleepingPercentage 101` once per world so night-skip can't fire → `dayTime` never jumps → the Serene Seasons clock stays on wall-clock |

**Status: all PARKED (not wired into the build) as of 2026-06-15.**

## How they fit together
The season override and the sleep-gamerule script are a pair: the 168-tick / offline-progression
season balance assumes the season clock tracks **wall-clock** server uptime. Serene Seasons 9.x
advances its clock from the world's `dayTime` delta, so a slept-through night would jump the season
clock ~10 real minutes. `default_gamerules.js` blocks the night-skip so the wall-clock mapping
holds. Apply both together on a server, or neither.

## To activate (manual, when ready)
1. Deploy/extract the normal server pack.
2. Copy each file above over its counterpart on the server (create
   `kubejs/server_scripts/default_gamerules.js`; overwrite the two configs).
3. Start the server once. (The gamerule then persists in the world's `level.dat`.)
   To revert any one: restore the shipped file / delete `default_gamerules.js`.

When the build gains a real client/server divergence step, fold these in there and delete the
manual note.
