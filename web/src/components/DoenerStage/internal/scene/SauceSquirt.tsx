import { useFrame } from "@react-three/fiber";
import {
  BallCollider,
  type CollisionEnterPayload,
  InstancedRigidBodies,
  type InstancedRigidBodyProps,
  interactionGroups,
  type RapierRigidBody,
  useRapier,
} from "@react-three/rapier";
import { type FC, useRef, useState } from "react";
import { type InstancedMesh, Matrix4, Quaternion, Vector3 } from "three";
import { BREAD_BODY_NAME } from "./Bread";
import { GRAVITY, parkingSpot } from "./physics";
import { BREAD, breadToWorld, gapMiddleY } from "./pocket";
import { createRandom } from "./random";
import { parkBodies, physicsDelta, SETTLE_CHECK_SECONDS, settleBodies } from "./settle";

interface SauceSquirtProps {
  /** False: mounted but never fired (shader warm-up). */
  armed: boolean;
  color: string;
  seed: number;
  onHit: (strength: number) => void;
  gentle: boolean;
}

const DROPLETS = 48;
const SQUIRT_SECONDS = 1.1;
const DROPLET_RADIUS = 0.05;

// Droplets never collide with each other (no mid-air clumps), only with
// everything else — membership group 1, colliding with group 0 only.
const DROPLET_GROUPS = interactionGroups(1, [0]);

const UP = new Vector3(0, 1, 0);

interface Droplet {
  delay: number;
  from: [number, number, number];
  to: [number, number, number];
  flight: number;
  /** Size of the splat it leaves behind. */
  splat: number;
}

// A zig-zag squirt into the open front, like the Soßenflasche at the counter —
// only faster and with more feeling.
const planDroplets = (seed: number): Droplet[] => {
  const random = createRandom(seed);
  return Array.from({ length: DROPLETS }, (_, index): Droplet => {
    const t = index / DROPLETS;
    const x = (t * 2 - 1) * BREAD.halfLength * 0.75 + (random() - 0.5) * 0.12;
    const z = BREAD.halfDepth * (0.5 + Math.sin(t * Math.PI * 7) * 0.32);
    return {
      delay: t * SQUIRT_SECONDS,
      from: [x * 0.6, 1.9, BREAD.halfDepth + 1.5],
      to: [x, gapMiddleY(z) + random() * 0.12, z],
      flight: 0.16 + random() * 0.05,
      splat: 0.8 + random() * 0.8,
    };
  });
};

interface Splat {
  stuck: boolean;
  /** Stuck and its splat matrix written; skipped while the body sleeps. */
  placed: boolean;
  normal: Vector3;
}

// One sauce: droplets fired at the filling. Each droplet sticks where it lands
// — on the meat, on the crust, on the plate. The physics bodies are invisible
// spheres; what you see is a separate mesh: streaks in flight, flat splats
// once stuck.
export const SauceSquirt: FC<SauceSquirtProps> = ({ armed, color, seed, onHit, gentle }) => {
  const bodies = useRef<(RapierRigidBody | null)[] | null>(null);
  const visual = useRef<InstancedMesh>(null);
  const [droplets] = useState(() => planDroplets(seed));
  const [instances] = useState((): InstancedRigidBodyProps[] =>
    droplets.map((_, index) => ({
      key: index,
      position: parkingSpot(index + 200),
      gravityScale: 0,
    })),
  );
  const [splats] = useState((): Splat[] =>
    droplets.map(() => ({ stuck: false, placed: false, normal: new Vector3(0, 1, 0) })),
  );
  const [scratch] = useState(() => ({
    from: new Vector3(),
    to: new Vector3(),
    velocity: new Vector3(),
    position: new Vector3(),
    scale: new Vector3(),
    direction: new Vector3(),
    rotation: new Quaternion(),
    matrix: new Matrix4(),
  }));
  const elapsed = useRef(0);
  const launched = useRef(0);
  const { rapier } = useRapier();
  const settleTimer = useRef(0);
  const launchedAt = useRef<number[]>([]);
  // Unlaunched droplets only need hiding once, not every frame.
  const hidden = useRef(false);

  useFrame((_, delta) => {
    const list = bodies.current;
    const mesh = visual.current;
    if (list === null || mesh === null) {
      return;
    }
    elapsed.current += physicsDelta(delta);
    settleTimer.current += delta;
    if (settleTimer.current >= SETTLE_CHECK_SECONDS) {
      settleTimer.current = 0;
      // Re-park every check: applying instance props after mount wakes them again.
      parkBodies(list, launched.current);
      settleBodies(
        list,
        launchedAt.current,
        launched.current,
        elapsed.current,
        (index) => splats[index]?.stuck === true,
      );
    }
    const { from, to, velocity, position, scale, direction, rotation, matrix } = scratch;

    while (armed && launched.current < droplets.length) {
      const droplet = droplets[launched.current];
      const body = list[launched.current];
      if (droplet === undefined || droplet.delay > elapsed.current) {
        break;
      }
      launched.current += 1;
      if (body === null || body === undefined) {
        continue;
      }
      breadToWorld(droplet.to[0], droplet.to[1], droplet.to[2], to);
      if (gentle) {
        from.copy(to).setY(to.y + 1.2);
        velocity.set(0, 0, 0);
      } else {
        breadToWorld(droplet.from[0], droplet.from[1], droplet.from[2], from);
        velocity
          .subVectors(to, from)
          .divideScalar(droplet.flight)
          .setY((to.y - from.y) / droplet.flight + 0.5 * GRAVITY * droplet.flight);
      }
      body.setTranslation(from, true);
      body.setLinvel(velocity, true);
      body.setGravityScale(1, true);
      launchedAt.current[launched.current - 1] = elapsed.current;
    }

    let changed = false;
    for (let i = 0; i < droplets.length; i += 1) {
      const body = list[i];
      const splat = splats[i];
      const droplet = droplets[i];
      if (i >= launched.current || body === null || body === undefined || splat === undefined) {
        if (!hidden.current) {
          matrix.makeScale(0, 0, 0);
          mesh.setMatrixAt(i, matrix);
          changed = true;
        }
        continue;
      }
      // Asleep splats do not move: their matrix is already right.
      if (splat.placed && body.isSleeping()) {
        continue;
      }
      changed = true;
      position.copy(body.translation());
      if (splat.stuck) {
        // Flat blob hugging the surface it hit.
        rotation.setFromUnitVectors(UP, splat.normal);
        scale.set(1.6, 0.3, 1.6).multiplyScalar(droplet?.splat ?? 1);
        splat.placed = true;
      } else {
        // Stretched along its flight direction: a streak, not a pearl.
        direction.copy(body.linvel());
        const speed = direction.length();
        rotation.setFromUnitVectors(UP, speed > 0.001 ? direction.normalize() : UP);
        scale.set(0.8, 1 + Math.min(speed * 0.12, 2.2), 0.8);
      }
      matrix.compose(position, rotation, scale);
      mesh.setMatrixAt(i, matrix);
    }
    hidden.current = true;
    if (changed) {
      mesh.instanceMatrix.needsUpdate = true;
    }
  });

  // Sticky: on first contact the droplet loses its momentum and clings on.
  const handleCollision = (payload: CollisionEnterPayload): void => {
    const body = payload.target.rigidBody;
    const index = body === undefined ? -1 : (bodies.current?.indexOf(body) ?? -1);
    const splat = splats[index];
    if (body === undefined || splat === undefined || splat.stuck) {
      return;
    }
    // Sticky, not frozen: no bounce, barely slides, but still sinks along with
    // the filling as it settles (frozen drops were left hovering in mid-air).
    body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    body.setLinearDamping(14);
    body.setAngularDamping(30);
    // One contact is all a droplet ever needs to report.
    payload.target.collider.setActiveEvents(rapier.ActiveEvents.NONE);
    const normal = payload.manifold.normal();
    splat.normal.set(normal.x, normal.y, normal.z).normalize();
    // The contact normal's sign depends on collider order; sauce lies on top.
    if (splat.normal.y < 0) {
      splat.normal.negate();
    }
    splat.stuck = true;
    if (payload.other.rigidBodyObject?.name === BREAD_BODY_NAME) {
      onHit(0.012);
    }
  };

  return (
    <>
      <InstancedRigidBodies
        ref={bodies}
        instances={instances}
        colliders={false}
        colliderNodes={[
          <BallCollider key="droplet" args={[DROPLET_RADIUS]} collisionGroups={DROPLET_GROUPS} />,
        ]}
        ccd
        collisionGroups={DROPLET_GROUPS}
        onCollisionEnter={handleCollision}
      >
        <instancedMesh args={[undefined, undefined, droplets.length]} visible={false}>
          <sphereGeometry args={[DROPLET_RADIUS, 4, 3]} />
          <meshBasicMaterial />
        </instancedMesh>
      </InstancedRigidBodies>
      <instancedMesh
        ref={visual}
        args={[undefined, undefined, droplets.length]}
        frustumCulled={false}
        castShadow
      >
        <sphereGeometry args={[DROPLET_RADIUS, 14, 10]} />
        <meshStandardMaterial color={color} roughness={0.12} />
      </instancedMesh>
    </>
  );
};
