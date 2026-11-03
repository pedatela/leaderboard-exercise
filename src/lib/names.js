/**
 * Canonical learner display name.
 * Used by admin-facing endpoints (roster, reports).
 */
function learnerDisplayName(learner) {
  return `${learner.first_name} ${learner.last_name}`;
}

export { learnerDisplayName };
