'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { useRef } from 'react'

function FieldSurface({ stressScore = 0 }) {
  const meshRef = useRef(null)
  const risk = Math.min(1, Math.max(0, Number(stressScore) / 9))

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.z += delta * 0.025
  })

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2.35, 0, 0]}>
      <planeGeometry args={[5.6, 4.2, 18, 14]} />
      <meshStandardMaterial color={risk > 0.6 ? '#c47c4f' : risk > 0.3 ? '#d3b64f' : '#55a978'} wireframe={false} roughness={0.9} />
    </mesh>
  )
}

function LocationBeacon({ position = [0, 0.28, 0] }) {
  const beaconRef = useRef(null)
  useFrame(({ clock }) => {
    if (beaconRef.current) beaconRef.current.position.y = 0.28 + Math.sin(clock.elapsedTime * 2) * 0.06
  })
  return (
    <mesh ref={beaconRef} position={position}>
      <sphereGeometry args={[0.12, 18, 18]} />
      <meshStandardMaterial color="#67e8f9" emissive="#0e7490" emissiveIntensity={1.5} />
    </mesh>
  )
}

export default function SpatialFieldScene({ stressScore = 0 }) {
  return (
    <div className="h-[220px] w-full overflow-hidden rounded-[24px] border border-white/20 bg-slate-950/80" aria-label="Interactive 3D field scene">
      <Canvas dpr={[1, 1.5]} gl={{ antialias: true }}>
        <PerspectiveCamera makeDefault position={[0, 3.8, 5.8]} fov={42} />
        <ambientLight intensity={1.1} />
        <directionalLight position={[3, 5, 2]} intensity={2.4} color="#d8fff0" />
        <FieldSurface stressScore={stressScore} />
        <LocationBeacon />
        <OrbitControls enablePan={false} minDistance={4.5} maxDistance={8} />
      </Canvas>
    </div>
  )
}
