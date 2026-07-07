/**
 * Public signup is disabled in the single-user planner fork.
 * @returns {Promise<boolean>} Whether public signup is enabled
 */
export async function isPublicSignupEnabledClient(): Promise<boolean> {
  return false;
}
