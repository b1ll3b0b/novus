#!/usr/bin/env bash
# =============================================================================
# Builds the self-updating Prism/MultiMC instance that you hand to friends.
#
# They import it once (Add Instance -> Import from zip). On every launch a
# pre-launch hook runs packwiz-installer-bootstrap, which pulls the latest pack
# (mods + configs) from the gh-pages URL — so they never reinstall or manually
# update.
#
# What gets shipped (deliberately minimal — ALL other tuning stays personal):
#   - 8 GB min/max heap (testers all have 16 GB+; comfortable headroom over the
#     pack's ~3.5-4 GB live set)
#   - only the 4 safe baseline GC flags (UseG1GC, DisableExplicitGC,
#     PerfDisableSharedMem, AlwaysPreTouch). No JIT/code-cache/node-limit flags,
#     no ConcGCThreads/UseVectorCmov — those are personal/testing tweaks.
#   - Prism auto-picks Java (no hard-coded JavaPath)
#   - no options.txt, no other Prism tweaks
#
# Usage:  ./make-prism-instance.sh [output-dir]   (default: ./dist)
# =============================================================================
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT="${1:-$HERE/dist}"
PACK_URL="https://b1ll3b0b.github.io/novus/pack.toml"
BOOT_URL="https://github.com/packwiz/packwiz-installer-bootstrap/releases/latest/download/packwiz-installer-bootstrap.jar"

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$STAGE/minecraft"

# loader + MC version come straight from your dev instance (Forge 47.4.20 / 1.20.1)
cp "$HERE/../mmc-pack.json" "$STAGE/mmc-pack.json"

# the self-updater
curl -sfL --max-time 60 -o "$STAGE/minecraft/packwiz-installer-bootstrap.jar" "$BOOT_URL"

# shipped instance config (note: $INST_JAVA is a Prism runtime variable -> keep literal)
cat > "$STAGE/instance.cfg" <<EOF
[General]
ConfigVersion=1.3
InstanceType=OneSix
name=Novus
iconKey=default
OverrideCommands=true
PreLaunchCommand="\$INST_JAVA" -jar packwiz-installer-bootstrap.jar ${PACK_URL}
OverrideMemory=true
MinMemAlloc=8192
MaxMemAlloc=8192
OverrideJavaArgs=true
JvmArgs="-XX:+UseG1GC -XX:+DisableExplicitGC -XX:+PerfDisableSharedMem -XX:+AlwaysPreTouch"
AutomaticJava=true
EOF

mkdir -p "$OUT"
( cd "$STAGE" && zip -qr "$OUT/Novus.zip" . )
echo ">> built $OUT/Novus.zip"
echo "   friends: Add Instance -> Import from zip -> select Novus.zip -> Launch"
