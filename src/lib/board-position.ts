/**
 * Fractional ordering for board columns and cards.
 *
 * Columns and cards store a float `position`. Inserting between two neighbours
 * takes the midpoint of their positions, so a move only rewrites the one moved
 * row instead of renumbering the whole list. Pure functions — unit-tested and
 * shared by the API and the drag handlers.
 */

export const POSITION_STEP = 1024;

/**
 * A position that sorts between `before` and `after`. Pass null for an open
 * end (moving to the very start or very end of a list, or into an empty list).
 */
export function positionBetween(
  before: number | null,
  after: number | null
): number {
  if (before == null && after == null) return POSITION_STEP;
  if (before == null) return after! - POSITION_STEP;
  if (after == null) return before + POSITION_STEP;
  return (before + after) / 2;
}

/**
 * Position for inserting an item at `toIndex` within `neighbors` — the ordered
 * positions of the items that will surround it (i.e. the list WITHOUT the moved
 * item). `toIndex` is clamped to [0, neighbors.length].
 */
export function movePosition(neighbors: number[], toIndex: number): number {
  const index = Math.max(0, Math.min(toIndex, neighbors.length));
  const before = index > 0 ? neighbors[index - 1] : null;
  const after = index < neighbors.length ? neighbors[index] : null;
  return positionBetween(before, after);
}

/** Evenly spaced positions for seeding a fresh list of `count` items. */
export function initialPositions(count: number): number[] {
  return Array.from({ length: count }, (_, index) => (index + 1) * POSITION_STEP);
}

/**
 * True when neighbouring positions have collapsed too close to place a stable
 * midpoint between them — a signal the list should be renormalised with
 * `initialPositions`. Float precision starts to bite well before this, but a
 * sub-1e-6 gap is a safe, conservative trigger.
 */
export function needsRebalance(sortedPositions: number[]): boolean {
  for (let i = 1; i < sortedPositions.length; i += 1) {
    if (Math.abs(sortedPositions[i] - sortedPositions[i - 1]) < 1e-6) {
      return true;
    }
  }
  return false;
}
