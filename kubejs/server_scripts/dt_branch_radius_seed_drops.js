// dt_branch_radius_seed_drops.js — radius-gated branch seed drops.
//
// Replaces the two unconditional seed pools (previously in every branch
// loot table, now stripped) with a per-block radius gate:
//   radius 1 or 2 -> drop 1 species-appropriate seed
//   radius 3+     -> drop nothing
//
// IMPORTANT BEHAVIORAL NOTE: DT's chop cascade silently clears connected
// branches via Level.setBlock(AIR), which does NOT fire Forge's BreakEvent.
// So only the *initially player-struck branch* fires BlockEvents.broken
// and is eligible for a seed drop. Cascade blocks are invisible to this hook.
// Net effect: striking a thin/leafy branch -> 1 seed. Striking a trunk
// section -> 0 seeds, regardless of how many small branches fall with it.
// Combine with the leaves loot (which still drops seeds correctly during
// the cascade) for total seed flow.
//
// Added 2026-05-16.

const DT_NAMESPACES = new Set([
  'dynamictrees',
  'dtquark',
  'dttconstruct',
  'dynamictreesplus',
]);

BlockEvents.broken(event => {
  const block = event.block;
  const id = block.id;
  if (!id.endsWith('_branch')) return;
  const colon = id.indexOf(':');
  if (colon < 0) return;
  const ns = id.substring(0, colon);
  if (!DT_NAMESPACES.has(ns)) return;

  // Read radius blockstate. Some DT branch variants may not expose 'radius'
  // (e.g. dynamictreesplus mushroom branches); bail safely if absent.
  const rStr = block.properties.get('radius');
  if (rStr === null || rStr === undefined) return;
  const radius = parseInt(rStr);
  if (radius !== 1 && radius !== 2) return;

  // Map <namespace>:<species>_branch -> <namespace>:<species>_seed
  const seedId = id.replace(/_branch$/, '_seed');
  block.popItem(Item.of(seedId));
});
