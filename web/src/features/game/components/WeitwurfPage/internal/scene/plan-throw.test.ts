import { PerspectiveCamera, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { FLOOR_Y } from "@/components/DoenerStage/three";
import { BUCKETS, type Bucket, MAX_POWER, MIN_POWER, powerForDistance } from "../../../../scoring";
import { ARENA_FIELD_OF_VIEW, ARENA_TARGET, arenaCameraPosition, HELD_NDC } from "./arena";
import { planThrow, THROW_LINE_Z, type ThrowScratch } from "./plan-throw";

const PHONE_ASPECT = 390 / 780;

const arenaCamera = (aspect: number): PerspectiveCamera => {
  const camera = new PerspectiveCamera(ARENA_FIELD_OF_VIEW, aspect, 0.1, 100);
  camera.position.copy(arenaCameraPosition(aspect, new Vector3()));
  camera.lookAt(ARENA_TARGET);
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();
  return camera;
};

const createScratch = (): ThrowScratch => ({
  from: new Vector3(),
  toward: new Vector3(),
  target: new Vector3(),
  spawn: new Vector3(),
});

// The swipe a player makes towards a bucket: from the held piece to where the
// bucket is drawn, in canvas heights (y down), as unit direction.
const swipeTowards = (
  camera: PerspectiveCamera,
  aspect: number,
  bucket: Bucket,
): { dx: number; dy: number } => {
  const onScreen = new Vector3(bucket.x, FLOOR_Y, bucket.z).project(camera);
  const dx = ((onScreen.x - HELD_NDC.x) / 2) * aspect;
  const dy = -(onScreen.y - HELD_NDC.y) / 2;
  const length = Math.hypot(dx, dy);
  return { dx: dx / length, dy: dy / length };
};

const powerFor = (camera: PerspectiveCamera, aspect: number, bucket: Bucket): number => {
  const scratch = createScratch();
  const probe = planThrow(
    camera,
    { power: 1, ...swipeTowards(camera, aspect, bucket) },
    aspect,
    scratch,
    () => 0.5,
  );
  expect(probe).toBeDefined();
  const reach = Math.hypot(bucket.x - scratch.from.x, bucket.z - scratch.from.z);
  return powerForDistance(reach + (THROW_LINE_Z - scratch.from.z));
};

describe("planThrow", () => {
  it.each([
    PHONE_ASPECT,
    16 / 9,
  ])("lands a swipe pointed at a bucket in that bucket (aspect %f)", (aspect) => {
    const camera = arenaCamera(aspect);
    for (const bucket of BUCKETS) {
      const scratch = createScratch();
      const aim = {
        power: powerFor(camera, aspect, bucket),
        ...swipeTowards(camera, aspect, bucket),
      };
      planThrow(camera, aim, aspect, scratch, () => 0.5);
      const miss = Math.hypot(scratch.target.x - bucket.x, scratch.target.z - bucket.z);
      expect(miss).toBeLessThan(bucket.radius * 0.25);
    }
  });

  it("needs a harder swipe the further the bucket, all within reach", () => {
    const camera = arenaCamera(PHONE_ASPECT);
    const powers = BUCKETS.map((bucket) => powerFor(camera, PHONE_ASPECT, bucket));
    expect(powers).toEqual([...powers].sort((a, b) => a - b));
    expect(Math.min(...powers)).toBeGreaterThan(MIN_POWER);
    expect(Math.max(...powers)).toBeLessThan(MAX_POWER * 0.8);
  });

  it("throws from the held piece and arrives on a falling arc", () => {
    const camera = arenaCamera(PHONE_ASPECT);
    const scratch = createScratch();
    const shot = planThrow(camera, { power: 1, dx: 0, dy: -1 }, PHONE_ASPECT, scratch, () => 0.5);
    expect(shot.spawn.y).toBeGreaterThan(scratch.target.y);
    expect(shot.velocity.z).toBeLessThan(0);
    expect(scratch.target.x).toBeCloseTo(0, 5);
  });
});
