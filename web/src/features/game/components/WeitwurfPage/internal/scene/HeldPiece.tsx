import { useFrame, useThree } from "@react-three/fiber";
import { type FC, type RefObject, useRef, useState } from "react";
import { Color, DoubleSide, FrontSide, type Group, Vector3 } from "three";
import { createPieceGeometry, surfaceTextures } from "@/components/DoenerStage/three";
import { PIECE_KINDS, type PieceKind } from "../../../../scoring";
import { heldPosition } from "./arena";
import { PIECE_SPECS } from "./piece-specs";

interface HeldPieceProps {
  kind: PieceKind;
  /** performance.now() of the last throw: the next piece pops into the hand. */
  thrownAt: RefObject<number>;
}

const POP_SECONDS = 0.22;
const HELD_SCALE = 0.55;

const middleColor = (kind: PieceKind): Color => {
  const [from, to] = PIECE_SPECS[kind].colors;
  return new Color(from).lerp(new Color(to), 0.5);
};

// The piece that will fly next, held at the bottom of the screen and slowly
// turning — so the Chef always sees what flies next. Every kind is
// mounted once (shaders compile up front); only the current one is visible.
export const HeldPiece: FC<HeldPieceProps> = ({ kind, thrownAt }) => {
  const camera = useThree((state) => state.camera);
  const group = useRef<Group>(null);
  const [scratch] = useState(() => new Vector3());
  const [pieces] = useState(() =>
    PIECE_KINDS.map((pieceKind) => {
      const spec = PIECE_SPECS[pieceKind];
      return {
        kind: pieceKind,
        spec,
        geometry: createPieceGeometry(spec.shape),
        color: middleColor(pieceKind),
        textures: surfaceTextures(spec.surface),
      };
    }),
  );

  useFrame((state) => {
    const node = group.current;
    if (node === null) {
      return;
    }
    heldPosition(camera, scratch);
    node.position.copy(scratch);
    const t = state.clock.elapsedTime;
    node.rotation.set(0.5 + Math.sin(t * 1.3) * 0.25, t * 1.1, Math.sin(t * 0.9) * 0.2);
    const since = (performance.now() - thrownAt.current) / 1000;
    const pop = Math.min(1, Math.max(0, since / POP_SECONDS));
    node.scale.setScalar(HELD_SCALE * (pop < 1 ? pop * (1.6 - 0.6 * pop) : 1));
  });

  return (
    <group ref={group}>
      {pieces.map((piece) => (
        <mesh key={piece.kind} geometry={piece.geometry} visible={piece.kind === kind}>
          <meshStandardMaterial
            color={piece.color}
            map={piece.textures?.map ?? null}
            bumpMap={piece.textures?.bumpMap ?? null}
            bumpScale={1.4}
            roughness={piece.spec.roughness * (1 - piece.spec.wetness * 0.45)}
            side={piece.spec.shape === "leaf" ? DoubleSide : FrontSide}
            fog={false}
          />
        </mesh>
      ))}
    </group>
  );
};
