import { CuboidCollider, CylinderCollider, RigidBody } from "@react-three/rapier";
import { type FC, useEffect, useState } from "react";
import { DoubleSide } from "three";
import { FLOOR_Y } from "@/components/DoenerStage/three";
import type { Bucket as BucketSpec } from "../../../../scoring";
import { BUCKET_LABEL_ASPECT, createBucketLabel } from "./bucket-label";

interface BucketProps {
  bucket: BucketSpec;
  name: string;
  color: string;
}

const WALL_SEGMENTS = 14;
const WALL_THICKNESS = 0.06;
const BOTTOM_THICKNESS = 0.05;
const LABEL_WIDTH = 0.95;

// One target bucket: a fixed physics shell (bottom + a ring of wall slabs, so
// pieces really fall in and stay), a glowing rim and a sign with its points.
export const Bucket: FC<BucketProps> = ({ bucket, name, color }) => {
  const { radius, height } = bucket;
  const [label] = useState(() => createBucketLabel(bucket.points, name, color));
  const segment = ((2 * Math.PI * radius) / WALL_SEGMENTS) * 1.08;

  useEffect(
    () => () => {
      label.dispose();
    },
    [label],
  );

  return (
    <group position={[bucket.x, FLOOR_Y, bucket.z]}>
      <RigidBody type="fixed" colliders={false} friction={0.9} restitution={0.05}>
        <CylinderCollider
          args={[BOTTOM_THICKNESS / 2, radius]}
          position={[0, BOTTOM_THICKNESS / 2, 0]}
        />
        {Array.from({ length: WALL_SEGMENTS }, (_, index) => {
          const angle = (index / WALL_SEGMENTS) * Math.PI * 2;
          const middle = radius + WALL_THICKNESS / 2;
          return (
            <CuboidCollider
              key={angle}
              args={[segment / 2, height / 2, WALL_THICKNESS / 2]}
              position={[Math.cos(angle) * middle, height / 2, Math.sin(angle) * middle]}
              rotation={[0, -angle - Math.PI / 2, 0]}
            />
          );
        })}
      </RigidBody>

      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius + 0.03, radius * 0.9, height, 40, 1, true]} />
        <meshStandardMaterial color={color} metalness={0.55} roughness={0.4} side={DoubleSide} />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[radius * 0.9, 40]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.7} />
      </mesh>
      <mesh position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius + 0.03, 0.035, 10, 48]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.2} />
      </mesh>
      {/* Behind the back rim, so the sign never covers the opening. */}
      <sprite
        position={[0, height + 0.5, -radius * 0.9]}
        scale={[LABEL_WIDTH, LABEL_WIDTH / BUCKET_LABEL_ASPECT, 1]}
      >
        <spriteMaterial map={label} transparent depthWrite={false} fog={false} />
      </sprite>
    </group>
  );
};
