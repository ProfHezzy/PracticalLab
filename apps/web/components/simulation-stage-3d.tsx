"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import type {
  ExperimentAction,
  ExperimentDefinition,
} from "@practicallab/experiment-schemas";
import type { EngineState } from "@practicallab/simulation-engine";

type Props = {
  definition: ExperimentDefinition;
  state: EngineState;
  onAction: (action: ExperimentAction) => void;
};

// Colors matching Master UI Guide (§2.1)
const TOKENS = {
  violetBrand: "#6C4DF6",
  violetLight: "#8A74FA",
  tealBrand: "#19D3C5",
  tealSoft: "#C2F7F3",
  orangeBrand: "#FF8A3D",
  paperCream: "#FFF4EC",
  woodBench: "#2A2845",
  woodBorder: "#3F3D5A",
  glassColor: "#E3DDFF",
  liquidMixture: "#6C4DF6",
  liquidFiltrate: "#19D3C5",
  metalStand: "#5B5878",
  metalRod: "#9A96BA",
};

// Web Audio sound synthesizer for instant zero-latency feedback
function playSound(type: "snap" | "pour" | "click") {
  try {
    const ctx = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    )();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "snap") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === "pour") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else {
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    }
  } catch {
    // AudioContext blocked or unsupported
  }
}

function triggerHaptic(duration = 25) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate(duration);
    } catch {
      // Ignored if vibration not permitted
    }
  }
}

// 3D Laboratory Benchtop
function LabBench() {
  return (
    <group position={[0, -1.2, 0]}>
      {/* Bench surface */}
      <mesh receiveShadow position={[0, -0.1, 0]}>
        <boxGeometry args={[14, 0.2, 8]} />
        <meshStandardMaterial
          color={TOKENS.woodBench}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>
      {/* Bench edge trim with brand accent */}
      <mesh position={[0, -0.1, 4]}>
        <boxGeometry args={[14.05, 0.22, 0.05]} />
        <meshStandardMaterial color={TOKENS.violetBrand} roughness={0.4} />
      </mesh>
      {/* Target snap ring indicator on bench for flask */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.2, 0.01, 0]}>
        <ringGeometry args={[0.7, 0.82, 32]} />
        <meshBasicMaterial
          color={TOKENS.tealBrand}
          transparent
          opacity={0.65}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// 3D Retort Stand with Ring Clamp
function RetortStand() {
  return (
    <group position={[-2.4, -1.1, -0.4]}>
      {/* Heavy Rectangular Base */}
      <mesh castShadow receiveShadow position={[0, 0.08, 0]}>
        <boxGeometry args={[1.2, 0.16, 1.6]} />
        <meshStandardMaterial
          color={TOKENS.metalStand}
          roughness={0.5}
          metalness={0.8}
        />
      </mesh>
      {/* Vertical Support Rod */}
      <mesh castShadow position={[0.4, 2.2, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 4.2, 16]} />
        <meshStandardMaterial
          color={TOKENS.metalRod}
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>
      {/* Clamp Bosshead */}
      <mesh castShadow position={[0.4, 2.1, 0]}>
        <boxGeometry args={[0.22, 0.24, 0.22]} />
        <meshStandardMaterial color={TOKENS.metalStand} metalness={0.7} />
      </mesh>
      {/* Horizontal Clamp Arm extending towards flask */}
      <mesh
        castShadow
        position={[0.85, 2.1, 0.35]}
        rotation={[0, -0.35, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.04, 0.04, 1.1, 12]} />
        <meshStandardMaterial color={TOKENS.metalRod} metalness={0.85} />
      </mesh>
      {/* Circular Ring Clamp holding the funnel */}
      <mesh position={[1.2, 2.1, 0.48]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.45, 0.035, 12, 32]} />
        <meshStandardMaterial color={TOKENS.metalStand} metalness={0.75} />
      </mesh>
    </group>
  );
}

// 3D Conical Receiving Flask (Erlenmeyer)
function ConicalFlask({
  placed,
  hasFiltrate,
  onClick,
}: {
  placed: boolean;
  hasFiltrate: boolean;
  onClick: () => void;
}) {
  const position: [number, number, number] = placed
    ? [-1.2, -0.65, 0]
    : [-3.8, -0.65, 2.0];

  return (
    <group position={position} onClick={onClick}>
      {/* Conical body */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[0.26, 0.85, 1.1, 24]} />
        <meshPhysicalMaterial
          color={TOKENS.glassColor}
          transparent
          opacity={0.45}
          roughness={0.1}
          metalness={0.1}
          transmission={0.85}
          ior={1.45}
        />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.26, 0.26, 0.44, 24, 1, true]} />
        <meshPhysicalMaterial
          color={TOKENS.glassColor}
          transparent
          opacity={0.45}
          roughness={0.1}
          transmission={0.85}
        />
      </mesh>
      {/* Flask rim */}
      <mesh position={[0, 0.94, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.26, 0.03, 12, 24]} />
        <meshStandardMaterial color={TOKENS.glassColor} roughness={0.2} />
      </mesh>

      {/* Filtrate liquid inside flask */}
      {hasFiltrate && (
        <mesh position={[0, -0.32, 0]}>
          <cylinderGeometry args={[0.48, 0.78, 0.42, 24]} />
          <meshStandardMaterial
            color={TOKENS.liquidFiltrate}
            transparent
            opacity={0.78}
            roughness={0.2}
          />
        </mesh>
      )}

      {/* Snap ring if not placed */}
      {!placed && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.54, 0]}>
          <ringGeometry args={[0.75, 0.88, 24]} />
          <meshBasicMaterial color={TOKENS.tealBrand} />
        </mesh>
      )}
    </group>
  );
}

// 3D Funnel with optional fitted filter paper
function Funnel({
  placed,
  flaskPlaced,
  paperFitted,
  onClick,
}: {
  placed: boolean;
  flaskPlaced: boolean;
  paperFitted: boolean;
  onClick: () => void;
}) {
  const position: [number, number, number] = placed
    ? [-1.2, 0.75, 0]
    : [0.2, -0.5, 2.0];

  return (
    <group position={position} onClick={onClick}>
      {/* Conical funnel body */}
      <mesh castShadow position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.62, 0.09, 0.75, 24, 1, true]} />
        <meshPhysicalMaterial
          color={TOKENS.glassColor}
          transparent
          opacity={0.55}
          roughness={0.1}
          transmission={0.8}
        />
      </mesh>
      {/* Funnel stem */}
      <mesh position={[0, -0.38, 0]}>
        <cylinderGeometry args={[0.08, 0.07, 0.72, 16, 1, true]} />
        <meshPhysicalMaterial
          color={TOKENS.glassColor}
          transparent
          opacity={0.55}
          roughness={0.1}
          transmission={0.8}
        />
      </mesh>

      {/* Fitted Filter Paper inside funnel */}
      {paperFitted && (
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.58, 0.085, 0.68, 24, 1, true]} />
          <meshStandardMaterial
            color={TOKENS.paperCream}
            roughness={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Highlight snap ring when flask is ready for funnel */}
      {flaskPlaced && !placed && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.54, 0]}>
          <ringGeometry args={[0.55, 0.68, 24]} />
          <meshBasicMaterial color={TOKENS.tealBrand} />
        </mesh>
      )}
    </group>
  );
}

// 3D Filter Paper on Tray
function FilterPaperItem({
  paperFitted,
  funnelPlaced,
  onClick,
}: {
  paperFitted: boolean;
  funnelPlaced: boolean;
  onClick: () => void;
}) {
  if (paperFitted) return null;

  return (
    <group position={[2.4, -1.02, 1.8]} onClick={onClick}>
      {/* Folded paper cone thumbnail */}
      <mesh castShadow rotation={[0.2, 0.4, 0]}>
        <coneGeometry args={[0.48, 0.52, 24, 1, true]} />
        <meshStandardMaterial
          color={TOKENS.paperCream}
          roughness={0.85}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Ring base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <ringGeometry args={[0.42, 0.52, 24]} />
        <meshBasicMaterial
          color={funnelPlaced ? TOKENS.tealBrand : TOKENS.orangeBrand}
        />
      </mesh>
    </group>
  );
}

// 3D Mixture Beaker (tilts when poured)
function MixtureBeaker({
  poured,
  canPour,
  onClick,
}: {
  poured: boolean;
  canPour: boolean;
  onClick: () => void;
}) {
  const position: [number, number, number] = poured
    ? [-0.5, 1.35, 0.2]
    : [3.8, -0.65, 0.2];

  const rotation: [number, number, number] = poured
    ? [0.2, 0, -0.85]
    : [0, 0, 0];

  return (
    <group position={position} rotation={rotation} onClick={onClick}>
      {/* Beaker cylindrical wall */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[0.44, 0.44, 0.95, 24, 1, true]} />
        <meshPhysicalMaterial
          color={TOKENS.glassColor}
          transparent
          opacity={0.45}
          roughness={0.15}
          transmission={0.8}
        />
      </mesh>
      {/* Beaker base */}
      <mesh position={[0, -0.46, 0]}>
        <cylinderGeometry args={[0.44, 0.44, 0.04, 24]} />
        <meshStandardMaterial color={TOKENS.glassColor} roughness={0.2} />
      </mesh>
      {/* Beaker rim with spout */}
      <mesh position={[0, 0.47, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.44, 0.025, 12, 24]} />
        <meshStandardMaterial color={TOKENS.glassColor} roughness={0.2} />
      </mesh>

      {/* Mixture liquid inside beaker */}
      <mesh position={[0, poured ? -0.2 : -0.08, 0]}>
        <cylinderGeometry args={[0.41, 0.41, poured ? 0.35 : 0.65, 24]} />
        <meshStandardMaterial
          color={TOKENS.liquidMixture}
          transparent
          opacity={0.75}
          roughness={0.3}
        />
      </mesh>

      {/* Glowing ring if ready to pour */}
      {canPour && !poured && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
          <ringGeometry args={[0.5, 0.62, 24]} />
          <meshBasicMaterial color={TOKENS.tealBrand} />
        </mesh>
      )}
    </group>
  );
}

// Falling filtrate droplets animation
function FiltrateDrips({ active }: { active: boolean }) {
  const dripRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!active || !dripRef.current) return;
    dripRef.current.position.y -= delta * 1.8;
    if (dripRef.current.position.y < -0.38) {
      dripRef.current.position.y = 0.35;
    }
  });

  if (!active) return null;

  return (
    <mesh ref={dripRef} position={[-1.2, 0.2, 0]}>
      <sphereGeometry args={[0.045, 12, 12]} />
      <meshStandardMaterial color={TOKENS.liquidFiltrate} roughness={0.1} />
    </mesh>
  );
}

export function SimulationStage3D({ definition: _definition, state, onAction }: Props) {
  const [cameraView, setCameraView] = useState<"front" | "top" | "close">(
    "front",
  );
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const flaskPlaced =
    state.apparatusState["receiving-flask"]?.location === "workbench-left";
  const funnelPlaced =
    state.apparatusState.funnel?.location === "receiving-flask";
  const paperFitted =
    state.apparatusState["filter-paper"]?.location === "funnel";
  const poured = state.history.some((action) => action.type === "pour");

  // Camera presets
  const setPreset = (view: "front" | "top" | "close") => {
    setCameraView(view);
    playSound("click");
    if (!controlsRef.current) return;
    if (view === "front") {
      controlsRef.current.target.set(-0.5, 0.2, 0);
      controlsRef.current.object.position.set(0, 1.2, 5.2);
    } else if (view === "top") {
      controlsRef.current.target.set(-0.5, 0, 0);
      controlsRef.current.object.position.set(-0.5, 5.5, 0.5);
    } else if (view === "close") {
      controlsRef.current.target.set(-1.2, 0.5, 0);
      controlsRef.current.object.position.set(-1.2, 0.8, 2.6);
    }
  };

  const handleFlaskClick = () => {
    if (!flaskPlaced) {
      triggerHaptic(30);
      playSound("snap");
      onAction({
        type: "place",
        apparatus: "receiving-flask",
        slot: "workbench-left",
      });
    }
  };

  const handleFunnelClick = () => {
    if (flaskPlaced && !funnelPlaced) {
      triggerHaptic(30);
      playSound("snap");
      onAction({
        type: "place",
        apparatus: "funnel",
        slot: "receiving-flask",
      });
    }
  };

  const handlePaperClick = () => {
    if (funnelPlaced && !paperFitted) {
      triggerHaptic(30);
      playSound("snap");
      onAction({
        type: "fit",
        apparatus: "filter-paper",
        target: "funnel",
      });
    }
  };

  const handleBeakerClick = () => {
    if (funnelPlaced && paperFitted && !poured) {
      triggerHaptic(50);
      playSound("pour");
      onAction({
        type: "pour",
        from: "beaker",
        to: "funnel",
      });
    }
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "380px",
        background:
          "radial-gradient(circle at 50% 30%, #1A1733 0%, #0F0D1F 100%)",
        borderRadius: "16px",
        overflow: "hidden",
      }}
    >
      {/* 3D Scene Controls Overlay */}
      <div
        style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          zIndex: 10,
          display: "flex",
          gap: "8px",
        }}
      >
        <button
          type="button"
          onClick={() => setPreset("front")}
          style={{
            padding: "6px 12px",
            fontSize: "12px",
            fontWeight: 700,
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.2)",
            background:
              cameraView === "front"
                ? TOKENS.violetBrand
                : "rgba(26,23,51,0.85)",
            color: "#FFFFFF",
            cursor: "pointer",
            backdropFilter: "blur(4px)",
          }}
        >
          Front View
        </button>
        <button
          type="button"
          onClick={() => setPreset("top")}
          style={{
            padding: "6px 12px",
            fontSize: "12px",
            fontWeight: 700,
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.2)",
            background:
              cameraView === "top" ? TOKENS.violetBrand : "rgba(26,23,51,0.85)",
            color: "#FFFFFF",
            cursor: "pointer",
            backdropFilter: "blur(4px)",
          }}
        >
          Top View
        </button>
        <button
          type="button"
          onClick={() => setPreset("close")}
          style={{
            padding: "6px 12px",
            fontSize: "12px",
            fontWeight: 700,
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.2)",
            background:
              cameraView === "close"
                ? TOKENS.violetBrand
                : "rgba(26,23,51,0.85)",
            color: "#FFFFFF",
            cursor: "pointer",
            backdropFilter: "blur(4px)",
          }}
        >
          Close-up
        </button>
      </div>

      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [0, 1.2, 5.2], fov: 45 }}
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight
          position={[4, 6, 4]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight
          position={[-3, 3, -1]}
          intensity={0.5}
          color={TOKENS.tealSoft}
        />

        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.08}
          minDistance={2.0}
          maxDistance={8.5}
          maxPolarAngle={Math.PI / 2 - 0.05}
          target={[-0.5, 0.2, 0]}
        />

        <LabBench />
        <RetortStand />

        <ConicalFlask
          placed={flaskPlaced}
          hasFiltrate={poured}
          onClick={handleFlaskClick}
        />

        <Funnel
          placed={funnelPlaced}
          flaskPlaced={flaskPlaced}
          paperFitted={paperFitted}
          onClick={handleFunnelClick}
        />

        <FilterPaperItem
          paperFitted={paperFitted}
          funnelPlaced={funnelPlaced}
          onClick={handlePaperClick}
        />

        <MixtureBeaker
          poured={poured}
          canPour={funnelPlaced && paperFitted}
          onClick={handleBeakerClick}
        />

        <FiltrateDrips active={poured} />

        <ContactShadows
          position={[0, -1.19, 0]}
          opacity={0.65}
          scale={10}
          blur={1.4}
          far={3.0}
        />
      </Canvas>

      {/* Bottom helper cue */}
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          color: "rgba(255,255,255,0.7)",
          fontSize: "12px",
          pointerEvents: "none",
          fontWeight: 600,
          letterSpacing: "0.02em",
          background: "rgba(15,13,31,0.6)",
          padding: "4px 12px",
          borderRadius: "12px",
          backdropFilter: "blur(4px)",
        }}
      >
        Drag to rotate · Pinch to zoom · Tap apparatus to interact
      </div>
    </div>
  );
}
