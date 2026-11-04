import { useFrame, useThree } from "@react-three/fiber";
import {
  type CollisionEnterPayload,
  InstancedRigidBodies,
  type InstancedRigidBodyProps,
  type RapierRigidBody,
  useRapier,
} from "@react-three/rapier";
import { type FC, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Color, DoubleSide, FrontSide, type InstancedMesh, Vector3 } from "three";
import { BREAD_BODY_NAME } from "./Bread";
import type { IngredientSpec } from "./food";
import { createPieceGeometry } from "./geometries";
import { GRAVITY, parkingSpot } from "./physics";
import { BREAD, breadToWorld, gapMiddleY } from "./pocket";
import { createRandom } from "./random";
import { parkBodies, physicsDelta, SETTLE_CHECK_SECONDS, settleBodies } from "./settle";
import { surfaceTextures } from "./surfaces";

interface PieceVolleyProps {
  spec: IngredientSpec;
  seed: number;
  /** False = the ingredient was taken back out: everything gets yeeted away. */
  active: boolean;
  onHit: (strength: number) => void;
  /** prefers-reduced-motion: drop pieces in from above instead of firing them. */
  gentle: boolean;
}

interface Shot {
  delay: number;
  side: number;
  /** Aim point in the untilted bread frame. */
  aim: [number, number, number];
  lift: number;
  depth: number;
  distance: number;
  flight: number;
  spin: { x: number; y: number; z: number };
}

// Thrown like a machine gun, alternating left / right of the camera. About one
// in nine throws is sloppy on purpose — that is where the mess comes from.
const planShots = (spec: IngredientSpec, seed: number): Shot[] => {
  const random = createRandom(seed);
  const window = Math.min(0.9, spec.count * 0.028);
  const step = window / spec.count;
  return Array.from({ length: spec.count }, (_, index): Shot => {
    const sloppy = random() < 0.11;
    // Into the gap between bottom slab and lid, front half (where you can see it).
    const z = BREAD.halfDepth * (sloppy ? 0.4 + random() * 1.1 : -0.75 + random() * 0.85);
    return {
      delay: index * step + random() * step * 0.9,
      side: index % 2 === 0 ? -1 : 1,
      aim: [
        (random() * 2 - 1) * BREAD.halfLength * (sloppy ? 1.1 : 0.7),
        gapMiddleY(z) + (sloppy ? 0.25 + random() * 0.4 : (random() - 0.5) * 0.12),
        z,
      ],
      // Diagonal throws from front-left / front-right into the open front: they
      // fly towards the closed hinge at the back and pile up in the gap. (Pure
      // sideways throws shot straight through and out the other open side.)
      lift: 0.15 + random() * 0.5,
      depth: 2.2 + random() * 1.6,
      distance: 2.2 + random() * 1.6,
      flight: 0.3 + random() * 0.16,
      spin: {
        x: (random() - 0.5) * 44,
        y: (random() - 0.5) * 44,
        z: (random() - 0.5) * 44,
      },
    };
  });
};

// One throw of one ingredient: an InstancedMesh of rigid bodies. They wait
// weightless below the floor, then each is teleported next to the camera and
// fired at the bread with a ballistic velocity that hits its aim point.
export const PieceVolley: FC<PieceVolleyProps> = ({ spec, seed, active, onHit, gentle }) => {
  const camera = useThree((state) => state.camera);
  const bodies = useRef<(RapierRigidBody | null)[] | null>(null);
  const mesh = useRef<InstancedMesh>(null);
  const [geometry] = useState(() => createPieceGeometry(spec.shape));
  const [shots] = useState(() => planShots(spec, seed));
  const [instances] = useState((): InstancedRigidBodyProps[] =>
    shots.map((_, index) => ({ key: index, position: parkingSpot(index), gravityScale: 0 })),
  );
  const [scratch] = useState(() => ({
    right: new Vector3(),
    forward: new Vector3(),
    target: new Vector3(),
    spawn: new Vector3(),
    velocity: new Vector3(),
  }));
  const { rapier } = useRapier();
  const elapsed = useRef(0);
  const launched = useRef(0);
  // Wall clock of this volley (runs even after it was yeeted) + per-piece launch time.
  const clock = useRef(0);
  const settleTimer = useRef(0);
  const launchedAt = useRef<number[]>([]);
  // Pieces that already had their first contact: they never report again.
  const [landed] = useState(() => new Set<number>());
  const textures = surfaceTextures(spec.surface);

  useLayoutEffect(() => {
    const node = mesh.current;
    if (node === null) {
      return;
    }
    const random = createRandom(seed + 991);
    const from = new Color(spec.colors[0]);
    const to = new Color(spec.colors[1]);
    const color = new Color();
    for (let i = 0; i < shots.length; i += 1) {
      node.setColorAt(i, color.copy(from).lerp(to, random()));
    }
    if (node.instanceColor !== null) {
      node.instanceColor.needsUpdate = true;
    }
  }, [seed, spec.colors, shots.length]);

  useFrame((_, delta) => {
    const list = bodies.current;
    if (list === null) {
      return;
    }
    clock.current += physicsDelta(delta);
    settleTimer.current += delta;
    if (settleTimer.current >= SETTLE_CHECK_SECONDS) {
      settleTimer.current = 0;
      // Re-park every check: applying instance props after mount wakes them again.
      parkBodies(list, launched.current);
      settleBodies(list, launchedAt.current, launched.current, clock.current, (index) => {
        const body = list[index];
        return body !== null && body !== undefined && landed.has(body.handle);
      });
    }
    if (!active) {
      return;
    }
    elapsed.current += physicsDelta(delta);
    const { right, forward, target, spawn, velocity } = scratch;
    right.setFromMatrixColumn(camera.matrixWorld, 0).setY(0).normalize();
    forward.copy(camera.position).setY(0).normalize();

    while (launched.current < shots.length) {
      const shot = shots[launched.current];
      const body = list[launched.current];
      if (shot === undefined || shot.delay > elapsed.current) {
        break;
      }
      launched.current += 1;
      if (body === null || body === undefined) {
        continue;
      }
      breadToWorld(shot.aim[0], shot.aim[1], shot.aim[2], target);
      if (gentle) {
        spawn.copy(target).setY(target.y + 2.2);
        velocity.set(0, 0, 0);
      } else {
        spawn
          .copy(target)
          .addScaledVector(right, shot.side * shot.distance)
          .addScaledVector(forward, shot.depth);
        spawn.y += shot.lift;
        // Ballistic aim: straight line over the flight time, plus what gravity takes away.
        velocity
          .subVectors(target, spawn)
          .divideScalar(shot.flight)
          .setY((target.y - spawn.y) / shot.flight + 0.5 * GRAVITY * shot.flight);
      }
      body.setTranslation(spawn, true);
      body.setLinvel(velocity, true);
      body.setAngvel(gentle ? { x: 0, y: 0, z: 0 } : shot.spin, true);
      body.setGravityScale(1, true);
      launchedAt.current[launched.current - 1] = clock.current;
    }
  });

  // Taken back out: whatever already flew in gets thrown out again, in anger.
  useEffect(() => {
    if (active) {
      return;
    }
    const list = bodies.current ?? [];
    for (let i = 0; i < launched.current; i += 1) {
      const body = list[i];
      if (body === null || body === undefined) {
        continue;
      }
      // Fresh lifetime, so the settle check lets it fly before putting it to sleep.
      launchedAt.current[i] = clock.current;
      const position = body.translation();
      const away = position.x >= 0 ? 1 : -1;
      body.setLinvel(
        {
          x: away * (4 + Math.random() * 5),
          y: 7 + Math.random() * 5,
          z: (Math.random() - 0.3) * 5,
        },
        true,
      );
      body.setAngvel(
        {
          x: (Math.random() - 0.5) * 30,
          y: (Math.random() - 0.5) * 30,
          z: (Math.random() - 0.5) * 30,
        },
        true,
      );
    }
  }, [active]);

  // Only the very first contact of a piece counts. Afterwards its collider stops
  // reporting: resting pieces jitter and would "hit" the bread forever.
  const handleCollision = (payload: CollisionEnterPayload): void => {
    const body = payload.target.rigidBody;
    if (body === undefined || landed.has(body.handle)) {
      return;
    }
    landed.add(body.handle);
    payload.target.collider.setActiveEvents(rapier.ActiveEvents.NONE);
    // Calm it down once it has landed, so the pile settles quickly.
    body.setLinearDamping(0.9);
    body.setAngularDamping(3);
    if (payload.other.rigidBodyObject?.name === BREAD_BODY_NAME) {
      onHit(spec.punch);
    }
  };

  return (
    <InstancedRigidBodies
      ref={bodies}
      instances={instances}
      colliders="cuboid"
      ccd
      friction={1}
      restitution={0.18}
      angularDamping={0.8}
      linearDamping={0.05}
      onCollisionEnter={handleCollision}
    >
      <instancedMesh
        ref={mesh}
        args={[geometry, undefined, shots.length]}
        frustumCulled={false}
        castShadow
        receiveShadow
      >
        {/* Standard, not physical: clearcoat/sheen on every piece was the most
            expensive shader in the scene. Wetness comes from low roughness. */}
        <meshStandardMaterial
          map={textures?.map ?? null}
          bumpMap={textures?.bumpMap ?? null}
          bumpScale={1.4}
          roughness={spec.roughness * (1 - spec.wetness * 0.45)}
          side={spec.shape === "leaf" ? DoubleSide : FrontSide}
        />
      </instancedMesh>
    </InstancedRigidBodies>
  );
};
