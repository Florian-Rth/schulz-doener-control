import { CuboidCollider, CylinderCollider, RigidBody } from "@react-three/rapier";
import type { FC } from "react";
import { FLOOR_Y, PLATE_RADIUS, PLATE_Y } from "./pocket";

interface ShowroomProps {
  floorColor: string;
  plateColor: string;
  accentColor: string;
}

const PLATE_HEIGHT = 0.16;

// Car-configurator showroom: a brushed metal plate with a glowing red ring on a
// dark floor. Both have colliders — the floor is where missed throws end up.
export const Showroom: FC<ShowroomProps> = ({ floorColor, plateColor, accentColor }) => (
  <>
    <RigidBody type="fixed" colliders={false} friction={1.2} restitution={0.15}>
      <CylinderCollider
        args={[PLATE_HEIGHT / 2, PLATE_RADIUS]}
        position={[0, PLATE_Y - PLATE_HEIGHT / 2, 0]}
      />
      <CuboidCollider args={[20, 0.25, 20]} position={[0, FLOOR_Y - 0.25, 0]} />
    </RigidBody>
    <mesh position={[0, PLATE_Y - PLATE_HEIGHT / 2, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[PLATE_RADIUS, PLATE_RADIUS + 0.08, PLATE_HEIGHT, 96]} />
      <meshStandardMaterial color={plateColor} metalness={0.85} roughness={0.3} />
    </mesh>
    <mesh position={[0, PLATE_Y + 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[PLATE_RADIUS - 0.14, PLATE_RADIUS - 0.06, 96]} />
      <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={3} />
    </mesh>
    <mesh position={[0, FLOOR_Y, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[30, 64]} />
      <meshStandardMaterial color={floorColor} roughness={0.85} metalness={0.1} />
    </mesh>
  </>
);
