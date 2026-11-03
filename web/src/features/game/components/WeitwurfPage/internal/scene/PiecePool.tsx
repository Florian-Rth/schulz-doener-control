import { useFrame } from "@react-three/fiber";
import {
  type CollisionEnterPayload,
  InstancedRigidBodies,
  type InstancedRigidBodyProps,
  type RapierRigidBody,
  useRapier,
} from "@react-three/rapier";
import { type FC, useLayoutEffect, useRef, useState } from "react";
import { Color, DoubleSide, FrontSide, type InstancedMesh } from "three";
import {
  createPieceGeometry,
  createRandom,
  type IngredientSpec,
  physicsDelta,
  SETTLE_CHECK_SECONDS,
  surfaceTextures,
} from "@/components/DoenerStage/three";
import type { PieceKind } from "../../../../scoring";
import { isInBread, verdictFor } from "./landing";
import type { PendingThrow } from "./throw-queue";

interface PiecePoolProps {
  kind: PieceKind;
  spec: IngredientSpec;
  /** Position of this pool among all pools: keeps their parking spots apart. */
  poolIndex: number;
  /** Throws to launch on the next frame; filled by the ThrowController. */
  queue: PendingThrow[];
  onLanded: (kind: PieceKind, inBread: boolean) => void;
}

/** Bodies per ingredient. Six pools of five: never more than 30 live bodies. */
export const POOL_SIZE = 5;
/** After this, a thrown body sleeps no matter what: a jittering pile must not live forever. */
const FORCE_SLEEP_SECONDS = 6;

interface SlotState {
  next: number;
  launchedAt: Float64Array;
  /** Time of the first contact, NaN while still in the air. */
  contactAt: Float64Array;
  /** 1 while thrown and not judged yet. */
  flying: Uint8Array;
  /** 1 once thrown at least once (parked bodies are kept asleep). */
  used: Uint8Array;
}

const createSlots = (): SlotState => ({
  next: 0,
  launchedAt: new Float64Array(POOL_SIZE),
  contactAt: new Float64Array(POOL_SIZE).fill(Number.NaN),
  flying: new Uint8Array(POOL_SIZE),
  used: new Uint8Array(POOL_SIZE),
});

const isResting = (body: RapierRigidBody): boolean => {
  const v = body.linvel();
  const w = body.angvel();
  return v.x * v.x + v.y * v.y + v.z * v.z < 0.4 && w.x * w.x + w.y * w.y + w.z * w.z < 5;
};

// A small recycled set of one ingredient's pieces. Bodies wait weightless and
// asleep far below the floor; a throw teleports the oldest one to the spawn
// point. Once a piece has landed and settled it is judged (in the bread or
// Sauerei) and put to sleep, so the pile costs nothing.
export const PiecePool: FC<PiecePoolProps> = ({ kind, spec, poolIndex, queue, onLanded }) => {
  const bodies = useRef<(RapierRigidBody | null)[] | null>(null);
  const mesh = useRef<InstancedMesh>(null);
  const [geometry] = useState(() => createPieceGeometry(spec.shape));
  const [instances] = useState((): InstancedRigidBodyProps[] =>
    Array.from({ length: POOL_SIZE }, (_, index) => ({
      key: index,
      position: [30 + index * 0.9, -60 - poolIndex * 1.5, 0],
      gravityScale: 0,
    })),
  );
  const [slots] = useState(createSlots);
  const { rapier } = useRapier();
  const clock = useRef(0);
  const settleTimer = useRef(0);
  const textures = surfaceTextures(spec.surface);

  useLayoutEffect(() => {
    const node = mesh.current;
    if (node === null) {
      return;
    }
    const random = createRandom(poolIndex * 131 + 7);
    const from = new Color(spec.colors[0]);
    const to = new Color(spec.colors[1]);
    const color = new Color();
    for (let i = 0; i < POOL_SIZE; i += 1) {
      node.setColorAt(i, color.copy(from).lerp(to, random()));
    }
    if (node.instanceColor !== null) {
      node.instanceColor.needsUpdate = true;
    }
  }, [poolIndex, spec.colors]);

  const judge = (slot: number, body: RapierRigidBody): void => {
    slots.flying[slot] = 0;
    const position = body.translation();
    onLanded(kind, isInBread(position.x, position.y, position.z));
  };

  const launch = (slot: number, body: RapierRigidBody, shot: PendingThrow): void => {
    body.setTranslation(shot.spawn, true);
    body.setLinvel(shot.velocity, true);
    body.setAngvel(shot.spin, true);
    body.setGravityScale(1, true);
    body.setLinearDamping(0.05);
    body.setAngularDamping(0.8);
    body.collider(0).setActiveEvents(rapier.ActiveEvents.COLLISION_EVENTS);
    slots.launchedAt[slot] = clock.current;
    slots.contactAt[slot] = Number.NaN;
    slots.flying[slot] = 1;
    slots.used[slot] = 1;
  };

  const check = (list: readonly (RapierRigidBody | null)[]): void => {
    const now = clock.current;
    for (let i = 0; i < POOL_SIZE; i += 1) {
      const body = list[i];
      if (body === null || body === undefined || body.isSleeping()) {
        continue;
      }
      if (slots.used[i] === 0) {
        body.sleep();
        continue;
      }
      const sinceLaunch = now - (slots.launchedAt[i] ?? now);
      const contact = slots.contactAt[i] ?? Number.NaN;
      const resting = isResting(body);
      if (slots.flying[i] === 1) {
        const sinceContact = Number.isNaN(contact) ? null : now - contact;
        if (verdictFor(sinceLaunch, sinceContact, resting) === "judge") {
          judge(i, body);
        }
      } else if (resting || sinceLaunch > FORCE_SLEEP_SECONDS) {
        body.sleep();
      }
    }
  };

  useFrame((_, delta) => {
    const list = bodies.current;
    if (list === null) {
      return;
    }
    clock.current += physicsDelta(delta);
    let shot = queue.shift();
    while (shot !== undefined) {
      const slot = slots.next;
      slots.next = (slot + 1) % POOL_SIZE;
      const body = list[slot];
      if (body !== null && body !== undefined) {
        // Recycling a piece that is still in the air: judge it where it is.
        if (slots.flying[slot] === 1) {
          judge(slot, body);
        }
        launch(slot, body, shot);
      }
      shot = queue.shift();
    }
    settleTimer.current += delta;
    if (settleTimer.current >= SETTLE_CHECK_SECONDS) {
      settleTimer.current = 0;
      check(list);
    }
  });

  // Only the first contact of a throw counts; afterwards the collider stops
  // reporting (resting pieces jitter and would "land" forever).
  const handleCollision = (payload: CollisionEnterPayload): void => {
    const body = payload.target.rigidBody;
    const list = bodies.current;
    if (body === undefined || list === null) {
      return;
    }
    const slot = list.findIndex((candidate) => candidate?.handle === body.handle);
    if (slot < 0 || slots.flying[slot] !== 1 || !Number.isNaN(slots.contactAt[slot] ?? 0)) {
      return;
    }
    slots.contactAt[slot] = clock.current;
    payload.target.collider.setActiveEvents(rapier.ActiveEvents.NONE);
    body.setLinearDamping(0.9);
    body.setAngularDamping(3);
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
        args={[geometry, undefined, POOL_SIZE]}
        frustumCulled={false}
        castShadow
        receiveShadow
      >
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
