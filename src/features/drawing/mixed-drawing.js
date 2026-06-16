const REFERENCE_PENALTIES = Object.freeze({
  1: 7,
  2: 5,
  3: 4,
  4: 3,
  5: 2
});

export function normalizeMixedDrawingCount(value) {
  const count = Number.parseInt(value, 10);
  return Number.isFinite(count) ? Math.min(5, Math.max(1, count)) : 2;
}

export function getMixedDrawingPenaltySeconds(roundSeconds, requestedCount) {
  const count = normalizeMixedDrawingCount(requestedCount);
  const duration = Math.min(600, Math.max(10, Number(roundSeconds) || 60));
  const reference = REFERENCE_PENALTIES[count];
  return Math.max(1, Math.round(reference * duration / 60));
}

export function createMixedDrawingPlan(durationMs, requestedCount) {
  const count = normalizeMixedDrawingCount(requestedCount);
  const duration = Math.max(10000, Number(durationMs) || 60000);
  const roundSeconds = duration / 1000;
  const penaltyMs = getMixedDrawingPenaltySeconds(roundSeconds, count) * 1000;

  // En partie libre, les dessins sont répartis dans la zone centrale de la
  // manche et déclenchés après une carte normale. En multijoueur, le parcours
  // explicite des modes peut aussi placer Dessin en première position.
  const safeStartMs = Math.min(9000, duration * 0.18);
  const safeEndMs = Math.min(8000, duration * 0.17);
  const usableMs = Math.max(1000, duration - safeStartMs - safeEndMs);
  const targetElapsedMs = Array.from({ length: count }, (_, index) =>
    Math.round(safeStartMs + usableMs * ((index + 1) / (count + 1)))
  );

  return {
    requestedCount: count,
    targetElapsedMs,
    nextIndex: 0,
    penaltyMs,
    completedCount: 0,
    skippedForTime: 0,
    cancelledCount: 0,
    active: false,
    minimumRemainingMs: penaltyMs + 5000
  };
}


export function getFeasibleMixedDrawingCount(durationMs, requestedCount) {
  const requested = normalizeMixedDrawingCount(requestedCount);
  const duration = Math.max(10000, Number(durationMs) || 60000);
  for (let count = requested; count >= 1; count -= 1) {
    const plan = createMixedDrawingPlan(duration, count);
    const everyTargetFits = plan.targetElapsedMs.every(target =>
      duration - target > plan.minimumRemainingMs
    );
    if (everyTargetFits) return count;
  }
  return 0;
}

export function isMixedDrawingDue(plan, elapsedMs, remainingMs) {
  if (!plan || plan.active || plan.nextIndex >= plan.requestedCount) return false;
  if (remainingMs <= plan.minimumRemainingMs) return false;
  return elapsedMs >= plan.targetElapsedMs[plan.nextIndex];
}

export function markMixedDrawingStarted(plan) {
  if (!plan) return;
  plan.active = true;
}

export function markMixedDrawingCompleted(plan) {
  if (!plan) return;
  plan.active = false;
  plan.completedCount += 1;
  plan.nextIndex += 1;
}

export function closeUnplayableMixedDrawings(plan, remainingMs) {
  if (!plan || plan.active || remainingMs > plan.minimumRemainingMs) return 0;
  const unplayed = Math.max(0, plan.requestedCount - plan.nextIndex);
  plan.skippedForTime += unplayed;
  plan.nextIndex = plan.requestedCount;
  return unplayed;
}
