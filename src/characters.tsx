// =============================================================================
//  Little Dino Safari — Custom storybook artwork (SVG)
//  Hand-drawn, consistent, soft characters + layered scene backdrops.
//  All characters share one style: rounded shapes, big friendly eyes, rosy
//  cheeks, gentle smiles. Drawn on a 0..100 viewBox.
// =============================================================================

import type { ReactNode } from 'react'
import { animalById, dinoById } from './data'

// ---------- shared face parts ------------------------------------------------

function Eyes({ x1 = 38, x2 = 62, y = 46, r = 6 }: { x1?: number; x2?: number; y?: number; r?: number }) {
  return (
    <>
      {[x1, x2].map((cx, i) => (
        <g key={i}>
          <circle cx={cx} cy={y} r={r} fill="#3a3230" />
          <circle cx={cx + r * 0.35} cy={y - r * 0.4} r={r * 0.34} fill="#fff" />
        </g>
      ))}
    </>
  )
}

function Cheeks({ x1 = 30, x2 = 70, y = 58, r = 6 }: { x1?: number; x2?: number; y?: number; r?: number }) {
  return (
    <>
      <circle cx={x1} cy={y} r={r} fill="#ff9db1" opacity="0.55" />
      <circle cx={x2} cy={y} r={r} fill="#ff9db1" opacity="0.55" />
    </>
  )
}

function Smile({ d = 'M42 58 Q50 66 58 58', w = 3 }: { d?: string; w?: number }) {
  return <path d={d} fill="none" stroke="#5a4a40" strokeWidth={w} strokeLinecap="round" />
}

// ---------- the cast ---------------------------------------------------------
// Each entry returns the inner SVG (0..100 viewBox). Kept simple + cute.

const CAST: Record<string, () => ReactNode> = {
  cow: () => (
    <g>
      <ellipse cx="50" cy="50" rx="34" ry="32" fill="#f3efe9" />
      <ellipse cx="50" cy="50" rx="34" ry="32" fill="none" stroke="#dcd6cc" strokeWidth="2" />
      <path d="M24 30 Q20 20 30 22 Q34 28 32 34Z" fill="#6f5848" />
      <path d="M76 30 Q80 20 70 22 Q66 28 68 34Z" fill="#6f5848" />
      <ellipse cx="26" cy="44" rx="9" ry="7" fill="#f7b8c6" />
      <ellipse cx="74" cy="44" rx="9" ry="7" fill="#f7b8c6" />
      <path d="M30 26 Q24 24 22 30" stroke="#cdbfae" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M70 26 Q76 24 78 30" stroke="#cdbfae" strokeWidth="4" fill="none" strokeLinecap="round" />
      <ellipse cx="50" cy="64" rx="20" ry="15" fill="#f7c3cf" />
      <circle cx="44" cy="64" r="2.6" fill="#cf8f9c" />
      <circle cx="56" cy="64" r="2.6" fill="#cf8f9c" />
      <Eyes y={44} />
      <ellipse cx="64" cy="30" rx="7" ry="5" fill="#9c8676" opacity="0.5" />
    </g>
  ),
  dog: () => (
    <g>
      <path d="M22 40 Q16 70 30 80 Q24 50 30 42Z" fill="#a9794e" />
      <path d="M78 40 Q84 70 70 80 Q76 50 70 42Z" fill="#a9794e" />
      <ellipse cx="50" cy="50" rx="32" ry="30" fill="#e7b483" />
      <ellipse cx="50" cy="62" rx="20" ry="16" fill="#f6dcc0" />
      <Eyes y={45} />
      <ellipse cx="50" cy="58" rx="6" ry="5" fill="#3a3230" />
      <path d="M50 63 Q50 70 44 71" stroke="#5a4a40" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M50 63 Q50 70 56 71" stroke="#5a4a40" strokeWidth="3" fill="none" strokeLinecap="round" />
      <Cheeks y={60} />
    </g>
  ),
  cat: () => (
    <g>
      <path d="M28 26 L34 46 L18 44Z" fill="#f4a258" />
      <path d="M72 26 L66 46 L82 44Z" fill="#f4a258" />
      <path d="M28 28 L32 42 L22 41Z" fill="#f7c8a0" />
      <path d="M72 28 L68 42 L78 41Z" fill="#f7c8a0" />
      <ellipse cx="50" cy="52" rx="32" ry="29" fill="#f4a258" />
      <Eyes y={48} />
      <path d="M47 57 L53 57 L50 61Z" fill="#e07a90" />
      <Smile d="M50 61 Q46 65 42 63 M50 61 Q54 65 58 63" />
      <g stroke="#d98c4e" strokeWidth="1.6" strokeLinecap="round">
        <path d="M20 54 H34" /><path d="M20 60 H34" /><path d="M80 54 H66" /><path d="M80 60 H66" />
      </g>
      <Cheeks y={58} r={5} />
    </g>
  ),
  duck: () => (
    <g>
      <ellipse cx="50" cy="58" rx="30" ry="28" fill="#ffe07a" />
      <ellipse cx="50" cy="40" rx="22" ry="20" fill="#ffe88f" />
      <path d="M30 60 Q22 66 30 72 Q40 70 44 64Z" fill="#f6a13a" />
      <Eyes x1={42} x2={58} y={38} r={5} />
      <path d="M44 50 Q50 56 62 50 Q58 58 50 58 Q44 56 44 50Z" fill="#f6a13a" />
      <Cheeks x1={34} x2={66} y={50} r={5} />
    </g>
  ),
  lion: () => (
    <g>
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2
        return <circle key={i} cx={50 + Math.cos(a) * 32} cy={52 + Math.sin(a) * 32} r="11" fill="#e9a23b" />
      })}
      <circle cx="50" cy="52" r="30" fill="#f6c66b" />
      <Eyes y={48} />
      <path d="M44 57 H56 L50 62Z" fill="#7a5a44" />
      <Smile d="M50 62 Q45 67 40 64 M50 62 Q55 67 60 64" />
      <Cheeks y={59} r={5} />
    </g>
  ),
  elephant: () => (
    <g>
      <ellipse cx="24" cy="48" rx="16" ry="18" fill="#bcc6d4" />
      <ellipse cx="76" cy="48" rx="16" ry="18" fill="#bcc6d4" />
      <ellipse cx="24" cy="48" rx="9" ry="11" fill="#cfd7e2" />
      <ellipse cx="76" cy="48" rx="9" ry="11" fill="#cfd7e2" />
      <ellipse cx="50" cy="50" rx="28" ry="30" fill="#aeb9c9" />
      <path d="M50 56 Q44 64 48 76 Q50 82 56 78 Q52 70 54 60Z" fill="#aeb9c9" />
      <Eyes y={46} r={5} />
      <Cheeks y={58} r={5} />
    </g>
  ),
  monkey: () => (
    <g>
      <circle cx="24" cy="42" r="12" fill="#8a5a3c" />
      <circle cx="76" cy="42" r="12" fill="#8a5a3c" />
      <circle cx="24" cy="42" r="7" fill="#c89a78" />
      <circle cx="76" cy="42" r="7" fill="#c89a78" />
      <circle cx="50" cy="50" r="31" fill="#8a5a3c" />
      <path d="M50 30 Q74 36 70 60 Q60 76 50 76 Q40 76 30 60 Q26 36 50 30Z" fill="#e8c39c" />
      <Eyes y={46} />
      <ellipse cx="50" cy="60" rx="4" ry="3" fill="#7a5a44" />
      <Smile d="M42 66 Q50 72 58 66" />
      <Cheeks y={62} r={4} />
    </g>
  ),
  sheep: () => (
    <g>
      {[
        [30, 34], [50, 28], [70, 34], [22, 50], [78, 50], [30, 68], [50, 74], [70, 68],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="14" fill="#fbfaf6" />
      ))}
      <circle cx="50" cy="52" r="24" fill="#f6ece0" />
      <path d="M30 40 Q24 36 22 42" stroke="#cdbfae" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M70 40 Q76 36 78 42" stroke="#cdbfae" strokeWidth="4" fill="none" strokeLinecap="round" />
      <Eyes y={50} r={5} />
      <Smile d="M44 58 Q50 63 56 58" />
      <Cheeks y={56} r={5} />
    </g>
  ),
  horse: () => (
    <g>
      <path d="M30 24 Q26 40 32 54 L40 50 Q36 36 40 26Z" fill="#7a4a2e" />
      <ellipse cx="52" cy="50" rx="26" ry="30" fill="#b07a4e" />
      <ellipse cx="52" cy="64" rx="17" ry="15" fill="#caa07a" />
      <path d="M30 30 L40 28 L38 38Z" fill="#a9794e" />
      <path d="M70 30 L62 30 L66 40Z" fill="#a9794e" />
      <Eyes x1={44} x2={64} y={46} r={5} />
      <circle cx="48" cy="64" r="2.4" fill="#8a6a54" />
      <circle cx="58" cy="64" r="2.4" fill="#8a6a54" />
      <Cheeks x1={36} x2={70} y={60} r={5} />
    </g>
  ),
  bird: () => (
    <g>
      <ellipse cx="50" cy="54" rx="28" ry="26" fill="#7ec4ee" />
      <ellipse cx="50" cy="60" rx="16" ry="14" fill="#cdeafb" />
      <ellipse cx="74" cy="56" rx="12" ry="16" fill="#5aa9da" />
      <path d="M40 34 Q50 24 60 34Z" fill="#9ad3f4" />
      <Eyes x1={42} x2={58} y={48} r={5} />
      <path d="M46 56 L54 56 L50 62Z" fill="#f6a13a" />
      <Cheeks x1={34} x2={66} y={56} r={4} />
    </g>
  ),
  gorilla: () => (
    <g>
      {/* arms + fists animate via .gorilla--beat in CSS */}
      <g className="g-arm g-arm--l">
        <rect x="10" y="54" width="16" height="30" rx="8" fill="#5b5560" />
        <circle cx="18" cy="60" r="9" fill="#6a636f" />
      </g>
      <g className="g-arm g-arm--r">
        <rect x="74" y="54" width="16" height="30" rx="8" fill="#5b5560" />
        <circle cx="82" cy="60" r="9" fill="#6a636f" />
      </g>
      <ellipse cx="50" cy="62" rx="30" ry="26" fill="#5b5560" />
      <circle cx="24" cy="40" r="9" fill="#4c4751" />
      <circle cx="76" cy="40" r="9" fill="#4c4751" />
      <ellipse cx="50" cy="48" rx="30" ry="28" fill="#6a636f" />
      <path d="M50 30 Q72 36 70 58 Q60 72 50 72 Q40 72 30 58 Q28 36 50 30Z" fill="#cdbfb0" />
      <Eyes y={46} />
      <ellipse cx="50" cy="58" rx="7" ry="4" fill="#7a6a5c" />
      <Smile d="M42 64 Q50 70 58 64" />
    </g>
  ),
  // ---- dinosaurs (all friendly) ----
  trex: () => (
    <g>
      <path d="M40 78 Q30 80 26 74" stroke="#79c06a" strokeWidth="8" fill="none" strokeLinecap="round" />
      <ellipse cx="52" cy="50" rx="30" ry="30" fill="#86c976" />
      <path d="M70 54 Q86 52 84 64 Q74 66 66 62Z" fill="#86c976" />
      <path d="M70 60 l4 0 l-1 4 l3 0 l-1 4" fill="none" stroke="#fff" strokeWidth="2" />
      <path d="M36 26 L42 34 L32 34Z" fill="#6fb35f" />
      <path d="M50 24 L56 33 L44 33Z" fill="#6fb35f" />
      <Eyes x1={44} x2={62} y={44} r={5} />
      <Cheeks x1={38} x2={66} y={56} r={5} />
      <Smile d="M44 60 Q54 66 64 60" />
    </g>
  ),
  triceratops: () => (
    <g>
      <path d="M50 18 Q22 22 20 44 Q40 40 50 44 Q60 40 80 44 Q78 22 50 18Z" fill="#7fb6c9" />
      {[26, 50, 74].map((x) => (
        <circle key={x} cx={x} cy="30" r="5" fill="#a7d2df" />
      ))}
      <path d="M34 38 L30 26 L40 32Z" fill="#e9d39a" />
      <path d="M66 38 L70 26 L60 32Z" fill="#e9d39a" />
      <ellipse cx="50" cy="58" rx="28" ry="24" fill="#8fc6d6" />
      <path d="M50 64 L46 56 L54 56Z" fill="#e9d39a" />
      <Eyes y={52} r={5} />
      <Smile d="M42 66 Q50 72 58 66" />
      <Cheeks y={64} r={5} />
    </g>
  ),
  brontosaurus: () => (
    <g>
      <path d="M40 82 Q34 60 44 44" stroke="#9bd08a" strokeWidth="16" fill="none" strokeLinecap="round" />
      <path d="M44 64 Q40 36 60 26" stroke="#9bd08a" strokeWidth="15" fill="none" strokeLinecap="round" />
      <circle cx="64" cy="26" r="15" fill="#aadb99" />
      <Eyes x1={60} x2={72} y={24} r={3.6} />
      <Smile d="M60 31 Q66 35 72 31" w={2.4} />
      <circle cx="58" cy="31" r="3" fill="#ff9db1" opacity="0.5" />
      {[34, 44, 54].map((x, i) => (
        <circle key={i} cx={x} cy={70 - i * 4} r="3.4" fill="#cfe9c2" />
      ))}
    </g>
  ),
  stegosaurus: () => (
    <g>
      {[28, 40, 52, 64].map((x, i) => (
        <path key={i} d={`M${x} 40 L${x + 8} 22 L${x + 16} 40Z`} fill={['#f6c66b', '#f4a258', '#86c976', '#7fb6c9'][i]} />
      ))}
      <ellipse cx="50" cy="58" rx="34" ry="22" fill="#9bd08a" />
      <circle cx="26" cy="54" r="14" fill="#aadb99" />
      <path d="M16 80 Q12 66 22 62" stroke="#9bd08a" strokeWidth="9" fill="none" strokeLinecap="round" />
      <Eyes x1={20} x2={30} y={52} r={3.4} />
      <Smile d="M18 58 Q24 62 30 58" w={2.4} />
      <Cheeks x1={16} x2={34} y={57} r={3.4} />
    </g>
  ),
  baby: () => (
    <g>
      <ellipse cx="50" cy="56" rx="28" ry="30" fill="#9fe0c0" />
      <ellipse cx="50" cy="64" rx="18" ry="16" fill="#d9f5e8" />
      <path d="M40 28 Q44 18 48 28" fill="#7fd0aa" />
      <path d="M52 28 Q56 18 60 28" fill="#7fd0aa" />
      <circle cx="40" cy="30" r="3" fill="#8ad8b6" />
      <Eyes y={50} r={6} />
      <ellipse cx="50" cy="62" rx="3.4" ry="2.6" fill="#5aa888" />
      <Smile d="M43 66 Q50 72 57 66" />
      <Cheeks y={62} r={5} />
    </g>
  ),
}

// ---------- public Creature component ----------------------------------------

export function Creature({
  id,
  className = '',
  title,
}: {
  id: string
  className?: string
  title?: string
}) {
  const draw = CAST[id]
  const label = title ?? animalById(id)?.name ?? dinoById(id)?.name ?? 'animal'
  if (!draw) {
    // graceful fallback to emoji if a creature has no art yet
    const emoji = animalById(id)?.emoji ?? dinoById(id)?.emoji ?? '🐾'
    return (
      <span className={`creature-art creature-art--emoji ${className}`} role="img" aria-label={label}>
        {emoji}
      </span>
    )
  }
  return (
    <svg
      className={`creature-art ${id === 'gorilla' ? 'creature-art--gorilla' : ''} ${className}`}
      viewBox="0 0 100 100"
      role="img"
      aria-label={label}
    >
      {draw()}
    </svg>
  )
}

// =============================================================================
//  Scenes — gentle layered storybook backdrops
// =============================================================================

export type SceneVariant = 'farm' | 'jungle' | 'pond' | 'savanna' | 'sky'

const HILLS: Record<SceneVariant, [string, string]> = {
  farm: ['#bfe6a3', '#a6d98a'],
  jungle: ['#9ed3a6', '#7cc08a'],
  pond: ['#a9dbc7', '#86c9ad'],
  savanna: ['#f0d089', '#e6bd6a'],
  sky: ['#d6efff', '#c2e6fb'],
}

export function Scene({ variant }: { variant: SceneVariant }) {
  const [h1, h2] = HILLS[variant]
  return (
    <svg className="scene-bg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* soft sun glow */}
      <circle cx="80" cy="18" r="14" fill="#fff6d8" opacity="0.9" />
      <circle cx="80" cy="18" r="9" fill="#ffe9a6" />
      {/* clouds */}
      <g fill="#ffffff" opacity="0.85">
        <ellipse cx="22" cy="16" rx="11" ry="6" />
        <ellipse cx="32" cy="18" rx="9" ry="5" />
        <ellipse cx="58" cy="10" rx="9" ry="5" />
      </g>
      {/* rolling hills */}
      <path d={`M0 78 Q25 64 50 76 Q75 88 100 72 L100 100 L0 100Z`} fill={h1} />
      <path d={`M0 88 Q30 76 55 86 Q80 94 100 84 L100 100 L0 100Z`} fill={h2} />
      {variant === 'pond' && <ellipse cx="50" cy="95" rx="40" ry="9" fill="#bfe6f5" opacity="0.8" />}
      {variant === 'jungle' && (
        <g fill="#6bb079" opacity="0.7">
          <path d="M6 100 Q4 70 14 64 Q12 84 18 100Z" />
          <path d="M94 100 Q96 70 86 64 Q88 84 82 100Z" />
        </g>
      )}
    </svg>
  )
}
