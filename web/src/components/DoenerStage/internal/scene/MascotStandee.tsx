import { useTheme } from "@mui/material/styles";
import { useFrame } from "@react-three/fiber";
import {
  type CollisionEnterPayload,
  CuboidCollider,
  type RapierRigidBody,
  RigidBody,
  useRapier,
} from "@react-three/rapier";
import { type FC, useEffect, useRef, useState } from "react";
import {
  BackSide,
  DoubleSide,
  FrontSide,
  type Group,
  MathUtils,
  PlaneGeometry,
  Quaternion,
  type Sprite,
  Vector3,
} from "three";
import { pickLine } from "@/lib/funny-lines";
import { type DoenerMascotProps, isKnockedOver, mascotCopy, mascotPlacement } from "../../mascot";
import {
  BUBBLE_HEIGHT,
  BUBBLE_WIDTH,
  CARD_HEIGHT,
  CARD_WIDTH,
  CARDBOARD,
  createBubbleTexture,
  createStandeeTextures,
} from "./mascot-textures";
import { FLOOR_Y, PLATE_Y } from "./pocket";
import { physicsDelta, SETTLE_CHECK_SECONDS } from "./settle";
import { useShadowPoke } from "./shadow-poke-context";

const HEIGHT = 1;
const WIDTH = (HEIGHT * CARD_WIDTH) / CARD_HEIGHT;
const FOOT = { halfWidth: WIDTH * 0.28, halfHeight: 0.03, halfDepth: 0.16 } as const;
// The strut behind the card (visual only; the foot collider does the standing).
const STRUT = { width: WIDTH * 0.22, length: 0.62, tilt: 0.42 } as const;

/** Slower pieces only bump into it; they do not count as hits. */
const HIT_SPEED = 2.2;
const BUBBLE_SECONDS = 1.3;
const BUBBLE_COOLDOWN = 0.7;
const BUBBLE_SCALE = 0.95;
/** How long it lies there before it stands back up. */
const DOWN_SECONDS = 2.2;
const RISE_SECONDS = 0.75;
const HOP_HEIGHT = 0.6;
/** Pushed further than this from its spot, it walks (hops) back. */
const MAX_DRIFT = 0.5;

type Pose = "standing" | "down" | "rising";

const speedOf = (body: RapierRigidBody): number => {
  const v = body.linvel();
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
};

// The user's Döner-Tier as a cardboard standee next to the Döner — a real
// dynamic body: stray ingredients make it wobble, a sloppy throw knocks it
// over. Its heavy foot rights it after small hits; lying down it complains,
// waits a moment and hops back onto its spot.
export const MascotStandee: FC<DoenerMascotProps> = ({
  emoji,
  name,
  side = "right",
  position,
  seed = 0,
  speech = true,
  onHit,
}) => {
  const theme = useTheme();
  const { rapier } = useRapier();
  const pokeShadow = useShadowPoke();
  const body = useRef<RapierRigidBody>(null);
  const figure = useRef<Group>(null);
  const bubble = useRef<Sprite>(null);
  const placement = mascotPlacement(side, position);

  const [geometry] = useState(() => new PlaneGeometry(WIDTH, HEIGHT).translate(0, HEIGHT / 2, 0));
  const [textures] = useState(() =>
    createStandeeTextures({
      emoji,
      name,
      ink: theme.palette.primary.main,
      inkText: theme.palette.primary.contrastText,
      fontFamily: theme.typography.fontFamily ?? "sans-serif",
    }),
  );
  const [speechBubble] = useState(() =>
    createBubbleTexture({
      ink: theme.palette.primary.main,
      outline: theme.palette.navy.main,
      fontFamily: theme.typography.fontFamily ?? "sans-serif",
    }),
  );
  const [scratch] = useState(() => ({
    home: new Vector3(placement.x, PLATE_Y, placement.z),
    homeRotation: new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), placement.yaw),
    from: new Vector3(),
    fromRotation: new Quaternion(),
    position: new Vector3(),
    rotation: new Quaternion(),
    world: new Vector3(),
  }));

  // Animation state lives in refs: it changes every frame, React never needs it.
  const pose = useRef<Pose>("standing");
  const poseTime = useRef(0);
  const checkTimer = useRef(0);
  const clock = useRef(0);
  const squash = useRef({ value: 0, velocity: 0 });
  const bubbleShownAt = useRef(Number.NEGATIVE_INFINITY);
  const said = useRef(0);

  // The canvas font may not be loaded yet on first paint.
  useEffect(() => {
    const family = theme.typography.fontFamily ?? "sans-serif";
    if (typeof document.fonts?.load !== "function") {
      return;
    }
    void document.fonts.load(`800 40px ${family}`).then(() => {
      textures.repaint();
    });
  }, [textures, theme.typography.fontFamily]);

  // Mounted lazily, maybe long after the last throw froze the shadow map. It
  // starts asleep: it is placed exactly on the plate, and its first frame may be
  // a long one (shader compile) that a falling body would tunnel through.
  useEffect(() => {
    body.current?.sleep();
    pokeShadow();
  }, [pokeShadow]);

  const say = (pool: readonly string[]): void => {
    if (!speech || clock.current - bubbleShownAt.current < BUBBLE_COOLDOWN) {
      return;
    }
    said.current += 1;
    speechBubble.say(pickLine(pool, seed + said.current * 7));
    bubbleShownAt.current = clock.current;
  };

  const handleCollision = (payload: CollisionEnterPayload): void => {
    const other = payload.other.rigidBody;
    if (other === undefined || !other.isDynamic() || pose.current === "rising") {
      return;
    }
    const speed = speedOf(other);
    if (speed < HIT_SPEED) {
      return;
    }
    const strength = Math.min(1, speed / 12);
    squash.current.velocity = Math.max(-6, squash.current.velocity - 1 - strength * 3);
    onHit?.(strength);
    say(mascotCopy.ouch);
  };

  const startRising = (current: RapierRigidBody): void => {
    const at = current.translation();
    const turned = current.rotation();
    if (at.y < FLOOR_Y - 0.5) {
      // Fell out of the world: it drops back in from above instead.
      scratch.from.copy(scratch.home).setY(PLATE_Y + 2.5);
    } else {
      scratch.from.set(at.x, at.y, at.z);
    }
    scratch.fromRotation.set(turned.x, turned.y, turned.z, turned.w);
    current.setBodyType(rapier.RigidBodyType.KinematicPositionBased, true);
    pose.current = "rising";
    poseTime.current = 0;
  };

  // Every check (not every frame — WASM calls cost): has it fallen, drifted
  // away or come to rest lying down?
  const checkPose = (current: RapierRigidBody): void => {
    const at = current.translation();
    const sleeping = current.isSleeping();
    const resting = sleeping || speedOf(current) < 0.3;
    if (!sleeping) {
      pokeShadow();
    }
    if (pose.current === "standing") {
      const drift = Math.hypot(at.x - scratch.home.x, at.z - scratch.home.z);
      if (at.y < FLOOR_Y - 0.5) {
        startRising(current);
      } else if (isKnockedOver(current.rotation()) || at.y < PLATE_Y - 0.1) {
        pose.current = "down";
        poseTime.current = 0;
        say(mascotCopy.down);
      } else if (drift > MAX_DRIFT && resting) {
        startRising(current);
      }
    } else if (
      pose.current === "down" &&
      ((poseTime.current > DOWN_SECONDS && resting) || at.y < FLOOR_Y - 0.5)
    ) {
      startRising(current);
      bubbleShownAt.current = Number.NEGATIVE_INFINITY;
      say(mascotCopy.up);
    }
  };

  const rise = (current: RapierRigidBody): void => {
    const t = Math.min(1, poseTime.current / RISE_SECONDS);
    const eased = t * t * (3 - 2 * t);
    scratch.position.lerpVectors(scratch.from, scratch.home, eased);
    scratch.position.y += Math.sin(t * Math.PI) * HOP_HEIGHT;
    scratch.rotation.slerpQuaternions(scratch.fromRotation, scratch.homeRotation, eased);
    current.setNextKinematicTranslation(scratch.position);
    current.setNextKinematicRotation(scratch.rotation);
    if (t >= 1) {
      current.setBodyType(rapier.RigidBodyType.Dynamic, true);
      current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      // A little rock on landing.
      current.setAngvel({ x: 1.6, y: 0, z: 0 }, true);
      squash.current.velocity -= 3;
      pose.current = "standing";
      poseTime.current = 0;
    }
  };

  useFrame((_, delta) => {
    const current = body.current;
    if (current === null) {
      return;
    }
    const step = physicsDelta(delta);
    clock.current += step;
    poseTime.current += step;
    checkTimer.current += step;
    if (pose.current === "rising") {
      rise(current);
      pokeShadow();
    } else if (checkTimer.current >= SETTLE_CHECK_SECONDS) {
      checkTimer.current = 0;
      checkPose(current);
    }

    // Squash and stretch: a damped spring on the figure's scale.
    const spring = squash.current;
    const node = figure.current;
    if (node !== null && (Math.abs(spring.value) > 1e-3 || Math.abs(spring.velocity) > 1e-3)) {
      const dt = Math.min(step, 1 / 30);
      spring.velocity += (-260 * spring.value - 14 * spring.velocity) * dt;
      spring.value += spring.velocity * dt;
      node.scale.set(1 - spring.value * 0.45, 1 + spring.value, 1);
      pokeShadow();
    }

    // The speech bubble follows the figure without tilting with it.
    const sprite = bubble.current;
    if (sprite === null || node === null) {
      return;
    }
    const age = clock.current - bubbleShownAt.current;
    if (age > BUBBLE_SECONDS) {
      if (sprite.material.opacity !== 0) {
        sprite.material.opacity = 0;
      }
      return;
    }
    node.getWorldPosition(scratch.world);
    const pop = age < 0.18 ? MathUtils.lerp(0.4, 1.12, age / 0.18) : 1;
    sprite.scale.set(BUBBLE_SCALE * pop, ((BUBBLE_SCALE * BUBBLE_HEIGHT) / BUBBLE_WIDTH) * pop, 1);
    // Nudged towards the middle, so it is not cut off at the edge of a phone.
    sprite.position.set(scratch.world.x * 0.82, scratch.world.y + HEIGHT + 0.32, scratch.world.z);
    sprite.material.opacity = age > BUBBLE_SECONDS - 0.3 ? (BUBBLE_SECONDS - age) / 0.3 : 1;
  });

  return (
    <>
      <RigidBody
        ref={body}
        type="dynamic"
        colliders={false}
        position={[placement.x, PLATE_Y, placement.z]}
        rotation={[0, placement.yaw, 0]}
        ccd
        linearDamping={0.3}
        angularDamping={1.2}
        onCollisionEnter={handleCollision}
      >
        {/* Light card, heavy foot: it rocks back up like a Stehaufmännchen. */}
        <CuboidCollider
          args={[WIDTH * 0.4, HEIGHT / 2, 0.02]}
          position={[0, HEIGHT / 2, 0]}
          density={0.4}
          friction={0.7}
          restitution={0.2}
        />
        <CuboidCollider
          args={[FOOT.halfWidth, FOOT.halfHeight, FOOT.halfDepth]}
          position={[0, FOOT.halfHeight, -0.05]}
          density={6}
          friction={1.1}
          restitution={0.05}
        />
        <group ref={figure}>
          <mesh geometry={geometry} castShadow receiveShadow>
            <meshStandardMaterial
              map={textures.front}
              alphaTest={0.5}
              roughness={0.75}
              side={FrontSide}
              shadowSide={DoubleSide}
            />
          </mesh>
          <mesh geometry={geometry} receiveShadow>
            <meshStandardMaterial
              map={textures.back}
              alphaTest={0.5}
              roughness={0.95}
              side={BackSide}
            />
          </mesh>
          <mesh
            position={[
              0,
              (Math.cos(STRUT.tilt) * STRUT.length) / 2,
              -(Math.sin(STRUT.tilt) * STRUT.length) / 2 - 0.01,
            ]}
            rotation={[STRUT.tilt, 0, 0]}
            castShadow
          >
            <boxGeometry args={[STRUT.width, STRUT.length, 0.012]} />
            <meshStandardMaterial color={CARDBOARD.kraft} roughness={0.95} />
          </mesh>
        </group>
      </RigidBody>
      <sprite ref={bubble} frustumCulled={false} renderOrder={10}>
        <spriteMaterial
          map={speechBubble.texture}
          transparent
          opacity={0}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </sprite>
    </>
  );
};
