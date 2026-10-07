// 시안: Vercel Ship 2024 목걸이 명찰 방식 (React Three Fiber + Rapier 물리 + MeshLine 끈)
// 참고: https://vercel.com/blog/building-an-interactive-3d-event-badge-with-react-three-fiber
import * as THREE from 'three'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, extend, useFrame, useThree, type ThreeElement } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import {
  BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint, type RapierRigidBody,
} from '@react-three/rapier'
import { MeshLineGeometry, MeshLineMaterial } from 'meshline'
import { SAMPLE, type Tier, type TierId } from './tiers'

extend({ MeshLineGeometry, MeshLineMaterial })
declare module '@react-three/fiber' {
  interface ThreeElements {
    meshLineGeometry: ThreeElement<typeof MeshLineGeometry>
    meshLineMaterial: Omit<ThreeElement<typeof MeshLineMaterial>, 'args'> & { args?: ConstructorParameters<typeof MeshLineMaterial> }
  }
}

const CARD_W = 1.6
const CARD_H = 2.25

// 등급별 3D 재질 — 금·은은 금속, 킹갓제너럴은 무지개 간섭색(iridescence)
const MATERIAL: Record<TierId, { bg: [string, string]; ink: string; sub: string; metal: number; rough: number; irid: number }> = {
  sprout: { bg: ['#eef4e6', '#d3e2c4'], ink: '#23301c', sub: '#5f7152', metal: 0, rough: 0.8, irid: 0 },
  mid: { bg: ['#f1f3f6', '#a7afb9'], ink: '#15191e', sub: '#4d5560', metal: 0.75, rough: 0.28, irid: 0 },
  pro: { bg: ['#ffe9a6', '#c79633'], ink: '#2c1d03', sub: '#6b4c12', metal: 0.85, rough: 0.22, irid: 0 },
  king: { bg: ['#2a1f4a', '#0b0816'], ink: '#ffffff', sub: '#c9c1ff', metal: 0.3, rough: 0.15, irid: 1 },
}

// 캔버스에 카드 앞·뒷면을 그려 텍스처로 씀 (모서리는 투명하게 둥글림)
function faceTexture(tier: Tier, side: 'front' | 'back') {
  const m = MATERIAL[tier.id]
  const c = document.createElement('canvas')
  c.width = 800
  c.height = 1125
  const g = c.getContext('2d')!
  const grad = g.createLinearGradient(0, 0, 800, 1125)
  grad.addColorStop(0, m.bg[0])
  grad.addColorStop(1, m.bg[1])
  g.fillStyle = grad
  g.beginPath()
  g.roundRect(0, 0, 800, 1125, 60)
  g.fill()
  g.fillStyle = 'rgba(0,0,0,0.35)'
  g.beginPath()
  g.roundRect(330, 40, 140, 26, 13)
  g.fill()

  const font = (w: number, px: number, mono = false) =>
    `${w} ${px}px ${mono ? 'ui-monospace, "SF Mono", Menlo, monospace' : '-apple-system, "Apple SD Gothic Neo", sans-serif'}`
  g.textBaseline = 'alphabetic'
  if (side === 'front') {
    g.fillStyle = m.sub
    g.font = font(600, 34)
    g.fillText('코드 타자 레이스 · 개발자 인증', 64, 150)
    g.fillStyle = m.ink
    g.font = font(800, 84)
    const words = tier.name.split(' ')
    g.fillText(words.slice(0, -1).join(' '), 64, 280)
    g.fillText(words[words.length - 1], 64, 380)
    g.font = font(700, 260, true)
    g.fillText(String(tier.cpm), 52, 820)
    g.fillStyle = m.sub
    g.font = font(600, 40)
    g.fillText('타/분 · ' + tier.rank, 64, 890)
    g.fillRect(64, 960, 672, 3)
    g.font = font(500, 34, true)
    g.fillText(SAMPLE.player, 64, 1030)
    g.textAlign = 'right'
    g.fillText(SAMPLE.serial, 736, 1030)
  } else {
    g.fillStyle = m.sub
    g.font = font(600, 36)
    ;['코스', '정확도', '발급일'].forEach((t, i) => g.fillText(t, 64, 190 + i * 90))
    g.fillStyle = m.ink
    g.font = font(700, 40)
    ;[SAMPLE.course, `${tier.acc}%`, SAMPLE.date].forEach((t, i) => g.fillText(t, 250, 190 + i * 90))
    for (let x = 64, i = 0; x < 736; i++) {
      const w = [4, 2, 6, 2, 3][i % 5]
      g.fillRect(x, 820, w, 140)
      x += w + [3, 5, 2, 4][i % 4]
    }
    g.font = font(500, 34, true)
    g.textAlign = 'center'
    g.fillText(SAMPLE.serial, 400, 1030)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 16
  return tex
}

function bandTexture() {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 64
  const g = c.getContext('2d')!
  g.fillStyle = '#1f3a2e'
  g.fillRect(0, 0, 1024, 64)
  g.fillStyle = '#7dd3a8'
  g.font = '700 30px -apple-system, "Apple SD Gothic Neo", sans-serif'
  g.textBaseline = 'middle'
  g.fillText('코드 타자 레이스  ·  CODE RACE  ·  코드 타자 레이스  ·  CODE RACE  ·', 12, 34)
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function Band({ tier, flipped, onFlip }: { tier: Tier; flipped: boolean; onFlip: () => void }) {
  const band = useRef<THREE.Mesh>(null)
  const fixed = useRef<RapierRigidBody>(null!)
  const j1 = useRef<RapierRigidBody>(null!)
  const j2 = useRef<RapierRigidBody>(null!)
  const j3 = useRef<RapierRigidBody>(null!)
  const card = useRef<RapierRigidBody>(null!)
  const face = useRef<THREE.Group>(null)
  const { width, height } = useThree((s) => s.size)
  const [curve] = useState(() => {
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()])
    c.curveType = 'chordal'
    return c
  })
  const lerped = useRef(new Map<RapierRigidBody, THREE.Vector3>())
  const [dragged, drag] = useState<THREE.Vector3 | false>(false)
  const [hovered, hover] = useState(false)
  const moved = useRef(false)
  const tmp = useMemo(() => ({ vec: new THREE.Vector3(), dir: new THREE.Vector3(), ang: new THREE.Vector3(), rot: new THREE.Vector3() }), [])

  const front = useMemo(() => faceTexture(tier, 'front'), [tier])
  const back = useMemo(() => faceTexture(tier, 'back'), [tier])
  const strap = useMemo(bandTexture, [])
  const m = MATERIAL[tier.id]

  const segment = { type: 'dynamic' as const, canSleep: true, colliders: false as const, angularDamping: 2, linearDamping: 2 }
  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1])
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1])
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1])
  useSphericalJoint(j3, card, [[0, 0, 0], [0, 1.45, 0]])

  useEffect(() => {
    if (!hovered) return
    document.body.style.cursor = dragged ? 'grabbing' : 'grab'
    return () => void (document.body.style.cursor = 'auto')
  }, [hovered, dragged])

  useFrame((state, delta) => {
    const { vec, dir, ang, rot } = tmp
    if (!fixed.current || !j1.current || !j2.current || !j3.current || !card.current) return
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera)
      dir.copy(vec).sub(state.camera.position).normalize()
      vec.add(dir.multiplyScalar(state.camera.position.length()))
      ;[card, j1, j2, j3, fixed].forEach((r) => r.current?.wakeUp())
      card.current.setNextKinematicTranslation({ x: vec.x - dragged.x, y: vec.y - dragged.y, z: vec.z - dragged.z })
    }
    // 세게 당길 때 끈이 떨리는 걸 줄이려고 중간 마디 위치를 부드럽게 따라가게 함
    for (const r of [j1.current, j2.current]) {
      const now = new THREE.Vector3().copy(r.translation())
      const prev = lerped.current.get(r) ?? now.clone()
      const d = Math.max(0.1, Math.min(1, prev.distanceTo(now)))
      prev.lerp(now, delta * (10 + d * 40))
      lerped.current.set(r, prev)
    }
    curve.points[0].copy(j3.current.translation())
    curve.points[1].copy(lerped.current.get(j2.current)!)
    curve.points[2].copy(lerped.current.get(j1.current)!)
    curve.points[3].copy(fixed.current.translation())
    ;(band.current!.geometry as MeshLineGeometry).setPoints(curve.getPoints(32))
    // 카드가 카메라 쪽을 보도록 살짝 되돌림
    ang.copy(card.current.angvel())
    rot.copy(card.current.rotation())
    card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z }, true)
    // 뒤집기: 카드 안쪽 그룹만 부드럽게 회전
    if (face.current) face.current.rotation.y = THREE.MathUtils.damp(face.current.rotation.y, flipped ? Math.PI : 0, 8, delta)
  })

  const mat = (map: THREE.Texture) => (
    <meshPhysicalMaterial
      map={map}
      transparent
      alphaTest={0.5}
      side={THREE.FrontSide}
      metalness={m.metal}
      roughness={m.rough}
      clearcoat={1}
      clearcoatRoughness={0.15}
      iridescence={m.irid}
      iridescenceIOR={1.6}
      iridescenceThicknessRange={[200, 900]}
    />
  )

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segment} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segment}><BallCollider args={[0.1]} /></RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segment}><BallCollider args={[0.1]} /></RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segment}><BallCollider args={[0.1]} /></RigidBody>
        <RigidBody position={[2, 0, 0]} ref={card} {...segment} type={dragged ? 'kinematicPosition' : 'dynamic'}>
          <CuboidCollider args={[CARD_W / 2, CARD_H / 2, 0.01]} />
          <group
            position={[0, -0.05, 0]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerDown={(e) => {
              ;(e.target as Element).setPointerCapture(e.pointerId)
              moved.current = false
              drag(new THREE.Vector3().copy(e.point).sub(tmp.vec.copy(card.current!.translation())))
            }}
            onPointerMove={() => { if (dragged) moved.current = true }}
            onPointerUp={(e) => {
              ;(e.target as Element).releasePointerCapture(e.pointerId)
              drag(false)
              if (!moved.current) onFlip()
            }}
          >
            {/* 금속 집게 */}
            <mesh position={[0, CARD_H / 2 + 0.12, 0]}>
              <boxGeometry args={[0.32, 0.22, 0.06]} />
              <meshStandardMaterial color="#d9dde3" metalness={1} roughness={0.25} />
            </mesh>
            <group ref={face}>
              <mesh position={[0, 0, 0.006]}>
                <planeGeometry args={[CARD_W, CARD_H]} />
                {mat(front)}
              </mesh>
              <mesh position={[0, 0, -0.006]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[CARD_W, CARD_H]} />
                {mat(back)}
              </mesh>
            </group>
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          color="white"
          depthTest={false}
          resolution={new THREE.Vector2(width, height)}
          useMap={1}
          map={strap}
          repeat={new THREE.Vector2(-3, 1)}
          lineWidth={1}
        />
      </mesh>
    </>
  )
}

export function Badge3D({ tier }: { tier: Tier }) {
  const [flipped, setFlipped] = useState(false)
  return (
    <div className="badge3d-stage">
      <Canvas camera={{ position: [0, 0, 13], fov: 25 }}>
        <ambientLight intensity={Math.PI} />
        <Physics interpolate gravity={[0, -40, 0]} timeStep={1 / 60}>
          <Band tier={tier} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />
        </Physics>
        <Environment blur={0.75}>
          <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={10} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
        </Environment>
      </Canvas>
      <p className="lab-hint">카드를 잡아 끌어 보세요 · 그냥 클릭하면 뒤집혀요</p>
    </div>
  )
}
