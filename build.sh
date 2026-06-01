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
#   ./build.sh              # build everything into ./dist
#   ./build.sh --publish    # local fallback: force-push dist/pack to gh-pages
#                           # (CI is the primary publish path; see workflow)
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
  "tools" "dist"                           # vendored binary / build output
  "options.txt"                            # personal client settings (tracked, but not shipped)
)                                          # ('.github' and 'mods' handled in code)
# Note: rhino.local.properties is now handled by .gitignore (untracked => not
# shipped), so it doesn't need a denylist entry. Gitignore is the single knob.
# CurseForge mods whose authors disabled 3rd-party API distribution: no installer
# can auto-fetch them, so we self-host the actual jar inside the pack (served from
# gh-pages) and drop the un-fetchable metafile. List by metafile slug. This is the
# same mechanism you'd use to self-host the whole pack if ever needed.
BUNDLED_SLUGS=(create-recycle-everything villagers-sell-animals quark-delight)
# Mods to keep in YOUR dev instance but NOT ship (e.g. profilers). Dropped from
# the published tree + .mrpack, including a matching config/<slug> folder.
# List by metafile slug. Empty now (spark was uninstalled); e.g. =(spark).
EXCLUDE_SLUGS=()
# Public URL where the gh-pages tree is served (used by the server bootstrap):
PACK_URL="https://b1ll3b0b.github.io/novus/pack.toml"
GHPAGES_BRANCH="gh-pages"

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

# ---- 8. server bootstrap (metadata-clean; no jars bundled) ------------------
# Ships a tiny zip: packwiz-installer-bootstrap.jar + start scripts that pull
# the server-side mod set (side = both|server) from the Pages URL on first run.
SRV="${DIST}/server-bootstrap"
rm -rf "$SRV"; mkdir -p "$SRV"
BOOT_URL="https://github.com/packwiz/packwiz-installer-bootstrap/releases/latest/download/packwiz-installer-bootstrap.jar"
if curl -sfL --max-time 60 -o "$SRV/packwiz-installer-bootstrap.jar" "$BOOT_URL"; then
  cat > "$SRV/start.sh" <<EOF
#!/usr/bin/env bash
set -e
# 1. sync the server-side mod set + configs from the published pack
java -jar packwiz-installer-bootstrap.jar -s server "${PACK_URL}"
# 2. launch the Forge server (place the Forge 47.4.20 server files here first;
#    e.g. run the Forge installer with --installServer in this directory).
#    Adjust the line below to your host's run command if needed:
exec ./run.sh nogui
EOF
  cat > "$SRV/start.bat" <<EOF
@echo off
java -jar packwiz-installer-bootstrap.jar -s server "${PACK_URL}"
call run.bat nogui
EOF
  chmod +x "$SRV/start.sh"
  echo ">> server bootstrap: dist/server-bootstrap/ (foundation; finish Forge install per README)"
else
  echo "!! could not fetch packwiz-installer-bootstrap.jar; skipped server bootstrap" >&2
fi

# ---- 9. optional: publish the flattened tree to the gh-pages branch ----------
if [ "${1:-}" = "--publish" ]; then
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
