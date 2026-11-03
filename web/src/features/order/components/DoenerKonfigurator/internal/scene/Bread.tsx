import { useFrame } from "@react-three/fiber";
import { ConvexHullCollider, CuboidCollider, RigidBody } from "@react-three/rapier";
import { type FC, type RefObject, useLayoutEffect, useRef, useState } from "react";
import { Color, DoubleSide, type Group, type InstancedMesh, MathUtils, Object3D } from "three";
import {
  createPaper,
  createSlabHalf,
  createSlabHull,
  PAPER,
  paperWall,
  placeSeeds,
} from "./bread-shape";
import { BREAD_COLORS } from "./food";
import { BREAD, FILLING_FLOOR_Y, PLATE_Y } from "./pocket";
import { createRandom } from "./random";
import { createCrumbTextures, createCrustTextures, createPaperTexture } from "./textures";

export const BREAD_BODY_NAME = "bread";

interface BreadProps {
  /** Raised by every hit; the lid flaps and the value decays. */
  impact: RefObject<number>;
  /** Ink of the paper print. */
  paperInk: string;
}

const SEED_COUNT = 320;
const PAPER_LABEL = "SCHULZ · DÖNER · CONTROL · ";
const HINGE: [number, number, number] = [0, FILLING_FLOOR_Y, -BREAD.halfDepth * 0.96];

// The lying Döner as one fixed physics body: convex colliders for the bottom
// slab and the opened lid, plus the standing paper as a wall behind it. The
// visual lid flaps on its hinge when something slams in; colliders stay put.
export const Bread: FC<BreadProps> = ({ impact, paperInk }) => {
  const lid = useRef<Group>(null);
  const seeds = useRef<InstancedMesh>(null);
  const [lidCrust] = useState(() => createSlabHalf("lid", "crust", 72, 18));
  const [lidCrumb] = useState(() => createSlabHalf("lid", "crumb", 72, 8));
  const [bottomCrust] = useState(() => createSlabHalf("bottom", "crust", 72, 10));
  const [bottomCrumb] = useState(() => createSlabHalf("bottom", "crumb", 72, 8));
  const [lidHull] = useState(() => createSlabHull("lid"));
  const [bottomHull] = useState(() => createSlabHull("bottom"));
  const [paper] = useState(() => createPaper(48, 40));
  const [wall] = useState(paperWall);
  const [crust] = useState(createCrustTextures);
  const [crumb] = useState(createCrumbTextures);
  const [paperMap] = useState(() => createPaperTexture(paperInk, PAPER_LABEL));

  useLayoutEffect(() => {
    const mesh = seeds.current;
    if (mesh === null) {
      return;
    }
    const random = createRandom(7);
    const dummy = new Object3D();
    const sesame = new Color(BREAD_COLORS.sesame);
    const nigella = new Color(BREAD_COLORS.nigella);
    placeSeeds(SEED_COUNT, 13).forEach(({ position, normal }, index) => {
      dummy.position.copy(position);
      dummy.lookAt(position.clone().add(normal));
      dummy.rotateZ(random() * Math.PI);
      // Flat against the crust, slightly elongated like a real seed.
      dummy.scale.set(1, 1.8, 0.5);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      mesh.setColorAt(index, random() < 0.45 ? nigella : sesame);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor !== null) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, []);

  useFrame((_, delta) => {
    const node = lid.current;
    if (node === null) {
      return;
    }
    impact.current = MathUtils.damp(impact.current, 0, 5, delta);
    const flap = Math.min(impact.current, 1);
    // The lid bounces on its hinge: up a bit and a damped flutter.
    node.rotation.x = -flap * (0.06 + 0.04 * Math.sin(performance.now() / 45));
  });

  return (
    <RigidBody type="fixed" colliders={false} name={BREAD_BODY_NAME} position={[0, PLATE_Y, 0]}>
      <ConvexHullCollider args={[bottomHull]} friction={1.2} restitution={0.15} />
      <ConvexHullCollider args={[lidHull]} friction={1.1} restitution={0.3} />
      <CuboidCollider
        args={[PAPER.halfWidth, PAPER.rise / 2, 0.02]}
        position={wall.center}
        rotation={[wall.tilt, 0, 0]}
        friction={0.8}
      />

      <mesh geometry={bottomCrust} castShadow receiveShadow>
        <meshStandardMaterial
          map={crust.map}
          bumpMap={crust.bumpMap}
          bumpScale={1.1}
          roughness={0.8}
        />
      </mesh>
      <mesh geometry={bottomCrumb} receiveShadow>
        <meshStandardMaterial
          map={crumb.map}
          bumpMap={crumb.bumpMap}
          bumpScale={1.6}
          roughness={0.95}
          color={BREAD_COLORS.crumbTint}
        />
      </mesh>

      {/* The lid pivots on its hinge at the back. */}
      <group position={HINGE}>
        <group ref={lid}>
          <group position={[-HINGE[0], -HINGE[1], -HINGE[2]]}>
            <mesh geometry={lidCrust} castShadow receiveShadow>
              <meshStandardMaterial
                map={crust.map}
                bumpMap={crust.bumpMap}
                bumpScale={1.1}
                roughness={0.76}
              />
            </mesh>
            <mesh geometry={lidCrumb} castShadow receiveShadow>
              <meshStandardMaterial
                map={crumb.map}
                bumpMap={crumb.bumpMap}
                bumpScale={1.6}
                roughness={0.95}
                color={BREAD_COLORS.crumbTint}
              />
            </mesh>
            <instancedMesh ref={seeds} args={[undefined, undefined, SEED_COUNT]}>
              <sphereGeometry args={[0.016, 6, 4]} />
              <meshStandardMaterial roughness={0.5} />
            </instancedMesh>
          </group>
        </group>
      </group>

      <mesh geometry={paper} castShadow receiveShadow>
        <meshStandardMaterial map={paperMap} roughness={0.9} side={DoubleSide} />
      </mesh>
    </RigidBody>
  );
};
