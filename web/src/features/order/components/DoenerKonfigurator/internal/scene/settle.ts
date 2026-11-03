import type { RapierRigidBody } from "@react-three/rapier";

/** How often resting bodies are checked — not every frame, it costs WASM calls. */
export const SETTLE_CHECK_SECONDS = 0.4;
/** After this, a landed body sleeps no matter what: a jittering pile must not live forever. */
const FORCE_SLEEP_SECONDS = 5;
/** Rapier never steps more than this per frame; clocks that age bodies must match. */
const MAX_PHYSICS_STEP = 0.5;

/**
 * Simulation time that passed this frame. Bodies are aged in simulation time,
 * not wall time: one long frame (shader compile, tab switch) must not make a
 * body that is still in the air look "old" and freeze it mid-flight.
 */
export const physicsDelta = (delta: number): number => Math.min(delta, MAX_PHYSICS_STEP);

// Parked (not yet thrown) bodies sleep from the start: hundreds of awake,
// weightless bodies below the floor still cost a physics step each frame.
// Launching wakes them (setTranslation with wakeUp).
export const parkBodies = (list: readonly (RapierRigidBody | null)[], from: number): void => {
  for (let i = from; i < list.length; i += 1) {
    list[i]?.sleep();
  }
};

// Puts bodies to sleep once they have landed and (nearly) come to rest. A pile of pieces in
// a curved trimesh jitters forever otherwise, which keeps the whole simulation
// awake (lag) and keeps producing contacts (endless wobble).
export const settleBodies = (
  list: readonly (RapierRigidBody | null)[],
  launchedAt: readonly number[],
  count: number,
  now: number,
  /** Only bodies that already touched something may be put to sleep. */
  hasLanded: (index: number) => boolean,
): void => {
  for (let i = 0; i < count; i += 1) {
    const body = list[i];
    const at = launchedAt[i];
    if (
      body === null ||
      body === undefined ||
      at === undefined ||
      body.isSleeping() ||
      !hasLanded(i)
    ) {
      continue;
    }
    const age = now - at;
    if (age < 1) {
      continue;
    }
    const v = body.linvel();
    const w = body.angvel();
    const resting =
      v.x * v.x + v.y * v.y + v.z * v.z < 0.5 && w.x * w.x + w.y * w.y + w.z * w.z < 6;
    if (resting || age > FORCE_SLEEP_SECONDS) {
      body.sleep();
    }
  }
};
