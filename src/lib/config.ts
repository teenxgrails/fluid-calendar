/**
 * Single-user planner feature flags.
 *
 * SaaS surfaces are intentionally disabled in this fork. Keep the exported
 * shape so existing imports continue to compile while the UI is simplified.
 */
export const isSaasEnabled = false;

// Feature flags for specific SAAS features
export const featureFlags = {
  // Core features (always enabled)
  core: {
    basicCalendar: true,
    basicTasks: true,
    googleCalendarSync: true,
    outlookCalendarSync: true,
    caldavSync: true,
  },

  // SaaS-only features are not part of the single-user planner.
  saas: {
    billing: false,
    advancedAnalytics: false,
    aiScheduling: false,
    prioritySupport: false,
  },
};

/**
 * Check if a specific feature is enabled
 * @param feature The feature to check
 * @returns Whether the feature is enabled
 */
export function isFeatureEnabled(feature: string): boolean {
  // Check core features
  if (feature in featureFlags.core) {
    return featureFlags.core[feature as keyof typeof featureFlags.core];
  }

  // Check SAAS features
  if (feature in featureFlags.saas) {
    return featureFlags.saas[feature as keyof typeof featureFlags.saas];
  }

  // Feature not found
  return false;
}
