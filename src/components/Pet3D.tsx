"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float, Sparkles, Stars, Environment, useGLTF, ContactShadows } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { Group, Color, MeshStandardMaterial, Box3, Vector3 } from "three";
import { PetStage, PetMood } from "@/lib/pet-engine";

interface Pet3DProps {
  stage: PetStage;
  mood: PetMood;
  level: number;
}

// Natural fantasy progression: egg → chick → small bird → eagle → griffin → dragon
const stageModel: Record<PetStage, string> = {
  [PetStage.EGG]: "/models/Egg.glb",
  [PetStage.CHICK]: "/models/Chick.glb",
  [PetStage.BIRD]: "/models/Bird.glb",
  [PetStage.WORKER_BIRD]: "/models/Eagle.glb",          // 강해진 맹금
  [PetStage.FOUNDER_BIRD]: "/models/Griffin.glb",       // 신화: 새 + 사자
  [PetStage.DRAGON_OR_PHOENIX]: "/models/Dragon.glb",   // 최종: 드래곤
};

// Stage 별 normalize target size — 진화할수록 약간 커지되 wingspan 고려
const stageTargetSize: Record<PetStage, number> = {
  [PetStage.EGG]: 1.6,
  [PetStage.CHICK]: 1.6,
  [PetStage.BIRD]: 1.7,
  [PetStage.WORKER_BIRD]: 1.9,
  [PetStage.FOUNDER_BIRD]: 2.0,
  [PetStage.DRAGON_OR_PHOENIX]: 2.2,  // 진화의 정점, 더 큰 임팩트
};

// Stage 별 카메라 + 줌 범위 — 모델 wingspan에 맞춤
const stageCamera: Record<PetStage, { position: [number, number, number]; min: number; max: number }> = {
  [PetStage.EGG]: { position: [0, 1.0, 3.8], min: 2.8, max: 6 },
  [PetStage.CHICK]: { position: [0, 1.0, 3.8], min: 2.8, max: 6 },
  [PetStage.BIRD]: { position: [0, 1.0, 4.0], min: 3.0, max: 7 },
  [PetStage.WORKER_BIRD]: { position: [0, 1.2, 4.5], min: 3.5, max: 7.5 },
  [PetStage.FOUNDER_BIRD]: { position: [0, 1.2, 5.0], min: 4.0, max: 8 },
  [PetStage.DRAGON_OR_PHOENIX]: { position: [0, 0.8, 5.5], min: 4.5, max: 8.5 },
};

const moodAccent: Record<PetMood, string> = {
  [PetMood.HAPPY]: "#fcd34d",
  [PetMood.FOCUSED]: "#60a5fa",
  [PetMood.CELEBRATING]: "#f472b6",
  [PetMood.HUNGRY]: "#fb923c",
  [PetMood.TIRED]: "#94a3b8",
  [PetMood.BLOCKED]: "#f87171",
};

function NormalizedModel({ url, mood, stage }: { url: string; mood: PetMood; stage: PetStage }) {
  const group = useRef<Group>(null);
  const { scene } = useGLTF(url);
  const moodColor = moodAccent[mood];
  const speed = mood === PetMood.TIRED ? 0.4 : mood === PetMood.CELEBRATING ? 1.6 : 1.0;

  // Auto-fit: normalize to consistent size regardless of source model
  const { cloned, fit } = useMemo(() => {
    const c = scene.clone();
    const box = new Box3().setFromObject(c);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetSize = stageTargetSize[stage];
    const scale = targetSize / maxDim;
    return {
      cloned: c,
      fit: {
        scale,
        offsetY: -center.y * scale + size.y * scale * 0.05,
      },
    };
  }, [scene, stage]);

  // Apply mood emissive tint without destroying original colors
  useEffect(() => {
    cloned.traverse((obj: any) => {
      if (obj.isMesh && obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m: any) => {
          if (m instanceof MeshStandardMaterial || m.emissive !== undefined) {
            m.emissive = new Color(moodColor);
            m.emissiveIntensity = mood === PetMood.CELEBRATING ? 0.3 : 0.12;
            m.needsUpdate = true;
          }
        });
      }
    });
  }, [cloned, moodColor, mood]);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.rotation.y = t * 0.4 * speed;
    const breath = 1 + Math.sin(t * speed * 2.5) * 0.04;
    group.current.scale.set(fit.scale * breath, fit.scale * breath, fit.scale * breath);
  });

  return (
    <group ref={group} position={[0, fit.offsetY, 0]}>
      <primitive object={cloned} />
    </group>
  );
}

function GriffinAura({ mood }: { mood: PetMood }) {
  const accent = moodAccent[mood];
  return (
    <>
      {/* Mythic ring around the griffin */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2.2, 0, 0]}>
        <torusGeometry args={[1.4, 0.025, 16, 64]} />
        <meshBasicMaterial color={accent} transparent opacity={0.5} />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 1.8, 0, 0]}>
        <torusGeometry args={[1.4, 0.025, 16, 64]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.4} />
      </mesh>
    </>
  );
}

function DragonAura({ mood }: { mood: PetMood }) {
  const accent = moodAccent[mood];
  return (
    <>
      {/* Halo */}
      <mesh position={[0, 1.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.0, 0.04, 16, 48]} />
        <meshPhysicalMaterial color="#fbbf24" metalness={1} roughness={0.05} emissive="#f59e0b" emissiveIntensity={1.0} />
      </mesh>
      {/* Ground ring */}
      <mesh position={[0, -1.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.0, 0.05, 16, 48]} />
        <meshPhysicalMaterial color={accent} metalness={0.7} roughness={0.1} emissive={accent} emissiveIntensity={0.7} />
      </mesh>
    </>
  );
}

function Pet({ stage, mood }: { stage: PetStage; mood: PetMood }) {
  const url = stageModel[stage];
  return (
    <>
      <NormalizedModel url={url} mood={mood} stage={stage} />
      {stage === PetStage.FOUNDER_BIRD && <GriffinAura mood={mood} />}
      {stage === PetStage.DRAGON_OR_PHOENIX && <DragonAura mood={mood} />}
    </>
  );
}

function Fallback() {
  return (
    <mesh>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.3} />
    </mesh>
  );
}

export default function Pet3D({ stage, mood, level }: Pet3DProps) {
  const cam = stageCamera[stage];
  // Mobile detection (SSR-safe)
  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
  const isWatchSize = typeof window !== "undefined" && window.matchMedia("(max-width: 240px)").matches;

  // Particle count scaling
  const sparkCount = isWatchSize ? 0 : isMobile ? 40 : 140;
  const starCount = isWatchSize ? 0 : isMobile ? 600 : 3000;
  const shadowsOn = !isMobile;

  return (
    <div className="w-full h-[400px] sm:h-[500px] watch:h-[180px] bg-gradient-to-br from-[#0a0a14] via-[#15102a] to-[#0a0a14] rounded-2xl overflow-hidden border border-zinc-800/60 relative">
      <Canvas
        camera={{ position: cam.position, fov: 45 }}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        shadows={shadowsOn}
        gl={{ powerPreference: "high-performance", antialias: !isMobile, alpha: false }}
        frameloop="always"
      >
        <color attach="background" args={["#0a0a14"]} />
        <fog attach="fog" args={["#0a0a14", 7, 18]} />

        <ambientLight intensity={0.45} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.4}
          castShadow={shadowsOn}
          shadow-mapSize={isMobile ? [512, 512] : [1024, 1024]}
        />
        <pointLight position={[-3, 2, 4]} intensity={1.2} color={moodAccent[mood]} />
        {!isMobile && <pointLight position={[3, -1, -3]} intensity={0.6} color="#a855f7" />}

        {!isMobile && <Environment preset="sunset" />}

        <Suspense fallback={<Fallback />}>
          <Float speed={1.0} rotationIntensity={0.1} floatIntensity={0.25}>
            <Pet stage={stage} mood={mood} />
          </Float>
        </Suspense>

        {sparkCount > 0 && (stage === PetStage.FOUNDER_BIRD || stage === PetStage.DRAGON_OR_PHOENIX) && (
          <Sparkles count={sparkCount} scale={[6, 6, 6]} size={5} speed={0.6} color="#fbbf24" />
        )}
        {sparkCount > 0 && (stage === PetStage.CHICK || stage === PetStage.BIRD) && (
          <Sparkles count={Math.floor(sparkCount / 4)} scale={[5, 5, 5]} size={2.5} speed={0.4} color={moodAccent[mood]} />
        )}

        {starCount > 0 && <Stars radius={60} depth={30} count={starCount} factor={3} fade speed={0.5} />}

        {!isMobile && <ContactShadows position={[0, -1.5, 0]} opacity={0.55} scale={6} blur={2.5} far={3} />}

        <OrbitControls
          enablePan={false}
          minDistance={cam.min}
          maxDistance={cam.max}
          autoRotate
          autoRotateSpeed={0.5}
          minPolarAngle={Math.PI / 3.5}
          maxPolarAngle={Math.PI / 1.9}
          enableDamping
          dampingFactor={0.08}
          touches={{ ONE: 0, TWO: 2 /* TOUCH.DOLLY_PAN for pinch-zoom on mobile */ }}
        />
      </Canvas>
      <div className="absolute top-4 left-4 text-xs text-zinc-400 bg-zinc-900/60 backdrop-blur px-3 py-1.5 rounded-full border border-zinc-800/60 flex items-center gap-2">
        <span className="font-mono">L{level}</span>
        <span className="w-1 h-1 rounded-full bg-zinc-700" />
        <span>{stage.replace(/_/g, " ")}</span>
      </div>
      <div className="absolute bottom-4 right-4 text-[10px] text-zinc-600 font-mono">
        Models CC0/CC-BY · Poly Pizza
      </div>
    </div>
  );
}
