#!/usr/bin/env bash
# =============================================================================
# Novus pack build script
#
# Turns the Prism dev instance (this folder) into a distributable packwiz pack:
#   - flattens Prism's mods/.index/*.pw.toml  ->  mods/*.pw.toml  so that
#     packwiz-installer drops jars into mods/ (where Forge actually loads them)
#   - MIRRORS every git-tracked file (config, kubejs, datapacks, resourcepacks,
#     ...) minus a short explicit denylist -> what ships == what you committed,
#     so there is no allowlist to forget and no "works on my machine" drift
#   - rebuilds the index and exports a client .mrpack
#   - lays down a tiny metadata-clean server bootstrap
#
# Anti-ghost rule: the distributed pack matches your instance. The ONLY
# divergences are (a) mods shipped as metadata+hash (byte-identical jars), the 3
# self-hosted CF jars, (b) the EXCLUDE_SLUGS dev-only mods, (c) personal client
# settings in the denylist below. Your .gitignore is the single knob for
# personal-vs-shipped: untracked = not shipped, tracked = shipped.
#
# Runs identically locally and in CI — .github/workflows/publish.yml builds this
# from master and deploys to GitHub Pages on every push.
#
# Usage:
#   ./build.sh              # build the gh-pages pack + .mrpack into ./dist
#   ./build.sh --release    # ALSO build standalone zips: complete (client/SP) + server
#   ./build.sh --publish    # local fallback: force-push dist/pack to gh-pages
#                           # (CI is the primary publish path; see workflows)
#
# packwiz resolution order: $PACKWIZ env  ->  ./tools/packwiz  ->  packwiz on PATH
# =============================================================================
set -euo pipefail

# ---- config ----------------------------------------------------------------
PACK_SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"   # this script lives in the instance root
DIST="${PACK_SRC}/dist"
PUB="${DIST}/pack"                                          # flattened tree -> gh-pages
# Everything git-tracked is mirrored EXCEPT these paths (the only build-level
# divergences). Edit your .gitignore for the personal-vs-shipped line; edit this
# only for build artifacts / tooling that must never ship.
SHIP_DENYLIST=(
  "pack.toml" "index.toml"                 # regenerated in the publish tree
  "build.sh" "make-prism-instance.sh"      # build tooling
  ".gitignore" ".gitattributes" ".packwizignore"
  "tools" "dist" "docs" ".githooks"                           # vendored binary / build output
  "options.txt"                            # personal client settings (tracked, but not shipped)
  "mmc-pack.json"                          # Prism instance metadata (for make-prism-instance.sh; not pack content)
)                                          # ('.github' and 'mods' handled in code)
# Note: rhino.local.properties is now handled by .gitignore (untracked => not
# shipped), so it doesn't need a denylist entry. Gitignore is the single knob.
# CurseForge mods: packwiz-installer cannot resolve `mode = "metadata:curseforge"`
# entries (they carry an empty download url), so the self-updating Prism instance
# crashes on them. Fix: self-host the actual jar inside the pack (served from
# gh-pages) and drop the un-fetchable metafile; `packwiz refresh` then indexes the
# jar as a plain file with a direct Pages url that any installer can fetch. This is
# ALL 20 CurseForge mods (the .mrpack already bundles them as overrides too).
# List by metafile slug; keep in sync with `grep -l "metadata:curseforge" mods/.index/*`.
BUNDLED_SLUGS=(
  backpacked balm catalogue configured controllable
  create-recycle-everything dynamic-trees-tinkers-construct farmers-respite
  framework goblin-traders initial-inventory json-things kubejs-delight
  placebo quark-delight terrablender toast-control trackwork
  villagers-sell-animals waystones
)
# Mods to keep in YOUR dev instance but NOT ship (e.g. profilers). Dropped from
# the published tree + .mrpack, including a matching config/<slug> folder.
# List by metafile slug. Empty now (spark was uninstalled); e.g. =(spark).
EXCLUDE_SLUGS=()
# Public URL where the gh-pages tree is served (used by the server bootstrap):
PACK_URL="https://b1ll3b0b.github.io/novus/pack.toml"
GHPAGES_BRANCH="gh-pages"
FORGE_VERSION="1.20.1-47.4.20"
FORGE_INSTALLER_URL="https://maven.minecraftforge.net/net/minecraftforge/forge/${FORGE_VERSION}/forge-${FORGE_VERSION}-installer.jar"
# Server zip ships these override folders (gameplay/config). Pure-client dirs
# (resourcepacks, shaderpacks, patchouli_books, controllable_natives, icons) are omitted.
SERVER_OVERRIDES=(config kubejs defaultconfigs data scripts trees modernfix)

# ---- args -------------------------------------------------------------------
RELEASE=0; PUBLISH=0
for a in "$@"; do case "$a" in
  --release) RELEASE=1 ;;
  --publish) PUBLISH=1 ;;
esac; done

# ---- locate packwiz ---------------------------------------------------------
if [ -n "${PACKWIZ:-}" ]; then :;
elif [ -x "${PACK_SRC}/tools/packwiz" ]; then PACKWIZ="${PACK_SRC}/tools/packwiz";
elif command -v packwiz >/dev/null 2>&1; then PACKWIZ="packwiz";
else
  echo "ERROR: packwiz not found. Put the binary at ./tools/packwiz, set PACKWIZ=/path, or 'go install github.com/packwiz/packwiz@latest'." >&2
  exit 1
fi
echo ">> using packwiz: $PACKWIZ"

VERSION="$(grep -m1 '^version' "${PACK_SRC}/pack.toml" | cut -d'"' -f2)"
echo ">> building Novus v${VERSION}"

# ---- 1. clean + scaffold the publish tree -----------------------------------
rm -rf "$PUB"
mkdir -p "$PUB/mods"

# ---- 2. flatten metafiles: mods/.index/*.pw.toml -> mods/*.pw.toml -----------
cp "$PACK_SRC"/mods/.index/*.pw.toml "$PUB/mods/"
echo ">> flattened $(ls "$PUB"/mods/*.pw.toml | wc -l) mod metafiles into mods/"

# ---- 2b. self-host un-fetchable mods: bundle the real jar, drop its metafile --
for slug in "${BUNDLED_SLUGS[@]}"; do
  meta="$PACK_SRC/mods/.index/${slug}.pw.toml"
  [ -f "$meta" ] || { echo "   ! bundled slug '$slug' has no metafile, skipping"; continue; }
  fn=$(sed -n "s/^filename = [\"']\(.*\)[\"']\$/\1/p" "$meta")
  if [ -n "$fn" ] && [ -f "$PACK_SRC/mods/$fn" ]; then
    cp "$PACK_SRC/mods/$fn" "$PUB/mods/$fn"
    rm -f "$PUB/mods/${slug}.pw.toml"
    echo "   ~ self-hosted jar bundled: $fn"
  else
    echo "   ! could not bundle '$slug' (jar '$fn' missing); leaving metafile in place"
  fi
done

# ---- 3. pack.toml ------------------------------------------------------------
cp "$PACK_SRC/pack.toml" "$PUB/pack.toml"

# ---- 4. mirror every git-tracked file minus the denylist --------------------
# "What ships == what you committed." No allowlist to forget; .gitignore already
# filtered runtime/personal junk, so git ls-files == your pack content.
echo ">> mirroring git-tracked pack files..."
denylisted() { local p="$1"; for d in "${SHIP_DENYLIST[@]}"; do [ "$p" = "$d" ] || [ "$p" = "${d%/}" ] && return 0; [[ "$p" == "$d"/* ]] && return 0; done; return 1; }
mirrored=0
while IFS= read -r -d '' f; do
  case "$f" in
    mods/*|.github/*) continue ;;            # mods handled above; CI workflow never ships
  esac
  top="${f%%/*}"
  denylisted "$f" && continue
  denylisted "$top" && continue
  mkdir -p "$PUB/$(dirname "$f")"
  cp "$PACK_SRC/$f" "$PUB/$f"
  mirrored=$((mirrored+1))
done < <(git -C "$PACK_SRC" ls-files -z)
echo "   mirrored ${mirrored} git-tracked files (config, kubejs, datapacks, resourcepacks, ...)"

# ---- 4b. drop dev-only mods from the distribution (kept in the dev instance) --
for slug in "${EXCLUDE_SLUGS[@]}"; do
  removed=""
  [ -f "$PUB/mods/${slug}.pw.toml" ] && { rm -f "$PUB/mods/${slug}.pw.toml"; removed="metafile"; }
  [ -e "$PUB/config/${slug}" ] && { rm -rf "$PUB/config/${slug}"; removed="${removed:+$removed+}config"; }
  echo "   - excluded from build (still in dev instance): ${slug} (${removed:-nothing found})"
done

# ---- 5. rebuild the index for the flattened layout --------------------------
# packwiz refresh updates an *existing* index; seed a minimal one first so it
# rebuilds against the flattened mods/ layout.
printf 'hash-format = "sha256"\n' > "$PUB/index.toml"
( cd "$PUB" && "$PACKWIZ" refresh )

# ---- 6. GitHub Pages: disable Jekyll so dotfiles/_folders are served as-is ---
touch "$PUB/.nojekyll"

# ---- 7. client export (.mrpack) ---------------------------------------------
mkdir -p "$DIST"
if ( cd "$PUB" && "$PACKWIZ" modrinth export -o "${DIST}/novus-${VERSION}.mrpack" ); then
  echo ">> client .mrpack: dist/novus-${VERSION}.mrpack"
else
  echo "!! .mrpack export incomplete: some CurseForge mods block 3rd-party redistribution (see list above)."
  echo "   This only affects an optional Modrinth release. The gh-pages packwiz tree (dist/pack)"
  echo "   is the primary friend-install source and is fully built."
fi

# ---- 8. standalone release zips (--release): complete + server --------------
# These bundle the ACTUAL jars from your instance (the exact tested files, byte
# for byte) so they're self-contained — no Pages dependency. Heavy (~300 MB), so
# they're built only for tagged releases, not every push.
if [ "$RELEASE" = 1 ]; then
  echo ">> building standalone release zips..."
  # map each jar filename -> side, from the metafiles
  declare -A SIDE
  for m in "$PACK_SRC"/mods/.index/*.pw.toml; do
    fn=$(sed -n "s/^filename = [\"']\(.*\)[\"']\$/\1/p" "$m")
    sd=$(sed -n "s/^side = '\([^']*\)'.*/\1/p" "$m" | head -1)
    [ -n "$fn" ] && SIDE["$fn"]="${sd:-both}"
  done

  # --- complete (client / singleplayer): ALL jars + ALL overrides ---
  # Overrides staged; jars added in place from the instance (no 310 MB copy),
  # store-mode (-0) since jars are already compressed -> fast.
  CPL="${DIST}/_complete"; rm -rf "$CPL"; mkdir -p "$CPL"
  for o in "$PUB"/*; do
    case "$(basename "$o")" in pack.toml|index.toml|mods) continue ;; esac
    cp -r "$o" "$CPL/"
  done
  printf 'Novus %s - complete pack (client / singleplayer)\nForge 1.20.1-47.4.20, Java 17. Extract these contents into your instance .minecraft (game) folder.\n' "$VERSION" > "$CPL/README.txt"
  CZIP="${DIST}/novus-${VERSION}-complete.zip"; rm -f "$CZIP"
  ( cd "$CPL" && zip -qr0 "$CZIP" . )
  ( cd "$PACK_SRC" && zip -qg0 "$CZIP" mods/*.jar )
  echo "   + dist/novus-${VERSION}-complete.zip ($(ls "$PACK_SRC"/mods/*.jar | wc -l) jars)"

  # --- server: both+server jars + server overrides + Forge installer + scripts ---
  SRVZ="${DIST}/_server"; rm -rf "$SRVZ"; mkdir -p "$SRVZ"
  for o in "${SERVER_OVERRIDES[@]}"; do [ -e "$PUB/$o" ] && cp -r "$PUB/$o" "$SRVZ/"; done
  if ! curl -sfL --max-time 120 -o "$SRVZ/forge-${FORGE_VERSION}-installer.jar" "$FORGE_INSTALLER_URL"; then
    echo "   ! Forge installer download failed; server zip will lack it" >&2
  fi
  printf 'eula=false\n' > "$SRVZ/eula.txt"
  cat > "$SRVZ/start.sh" <<EOS
#!/usr/bin/env bash
set -e
cd "\$(dirname "\$0")"
if [ ! -f run.sh ]; then
  echo "First run: installing Forge ${FORGE_VERSION} server files..."
  java -jar forge-${FORGE_VERSION}-installer.jar --installServer
fi
grep -q '^eula=true' eula.txt 2>/dev/null || { echo "Set eula=true in eula.txt (Mojang EULA) before starting."; exit 1; }
exec ./run.sh nogui
EOS
  cat > "$SRVZ/start.bat" <<EOB
@echo off
cd /d "%~dp0"
if not exist run.bat (
  echo First run: installing Forge ${FORGE_VERSION} server files...
  java -jar forge-${FORGE_VERSION}-installer.jar --installServer
)
findstr /b /c:"eula=true" eula.txt >nul 2>&1 || (echo Set eula=true in eula.txt first & pause & exit /b 1)
call run.bat nogui
EOB
  chmod +x "$SRVZ/start.sh"
  cat > "$SRVZ/README.txt" <<EOR
Novus ${VERSION} — dedicated server
Requires Java 17. Steps:
 1) Set eula=true in eula.txt (accepts the Mojang EULA).
 2) Run start.sh (Linux/Mac) or start.bat (Windows).
First run installs Forge ${FORGE_VERSION}, then launches. Mods = server-side set
(client-only mods are excluded). Configs match the client pack.
EOR
  SZIP="${DIST}/novus-${VERSION}-server.zip"; rm -f "$SZIP"
  ( cd "$SRVZ" && zip -qr0 "$SZIP" . )
  # add both+server jars in place (exclude client-only), store-mode
  srvjars=()
  for jar in "$PACK_SRC"/mods/*.jar; do
    [ "${SIDE[$(basename "$jar")]:-both}" = "client" ] && continue
    srvjars+=("mods/$(basename "$jar")")
  done
  ( cd "$PACK_SRC" && zip -qg0 "$SZIP" "${srvjars[@]}" )
  echo "   + dist/novus-${VERSION}-server.zip (${#srvjars[@]} jars + Forge installer)"
  rm -rf "$CPL" "$SRVZ"
fi

# ---- 9. optional: publish the flattened tree to the gh-pages branch ----------
if [ "$PUBLISH" = 1 ]; then
  echo ">> publishing $PUB to branch '$GHPAGES_BRANCH'..."
  TMP="$(mktemp -d)"
  git -C "$PACK_SRC" worktree add --force "$TMP" "$GHPAGES_BRANCH" 2>/dev/null \
    || git -C "$PACK_SRC" worktree add --force -b "$GHPAGES_BRANCH" "$TMP"
  # wipe old contents, copy the freshly built tree
  find "$TMP" -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +
  cp -r "$PUB"/. "$TMP"/
  git -C "$TMP" add -A
  git -C "$TMP" commit -m "Publish Novus v${VERSION}" || echo "   (nothing changed)"
  git -C "$TMP" push origin "$GHPAGES_BRANCH"
  git -C "$PACK_SRC" worktree remove --force "$TMP"
  echo ">> published. Pages URL: ${PACK_URL}"
fi

echo ">> done."
