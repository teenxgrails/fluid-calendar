/**
 * Public signup is disabled in the single-user planner fork.
 * @returns {Promise<boolean>} Whether public signup is enabled
 */
export async function isPublicSignupEnabled(): Promise<boolean> {
  return false;
}
