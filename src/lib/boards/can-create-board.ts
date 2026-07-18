/**
 * Free-plan gate for board creation. Returns true for everyone today; the
 * signature is the seam a future billing check plugs into without touching
 * callers.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function canCreateBoard(_userId: string): Promise<boolean> {
  //todo(billing): enforce a free-plan board limit here once plans exist.
  return true;
}
