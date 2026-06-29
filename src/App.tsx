// =============================================================================
//  Little Dino Safari 🦕
//  A calm, parent-assisted learning game for toddlers (around age 2).
//
//  Everything child-facing lives in this file: the screen router, all nine
//  screens, the friendly gorilla, and the shared building blocks. Game data
//  lives in data.ts and all sound lives in audio.ts.
//
//  Guiding rules: calm, gentle, private, no scores, no timers, no pressure.
// =============================================================================

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { ANIMALS, DINOSAURS, type Animal, type Dinosaur } from './data'
import { Creature, Scene, type SceneVariant } from './characters'
import * as Audio from './audio'

// -----------------------------------------------------------------------------
//  Screens + settings
// -----------------------------------------------------------------------------

type Screen =
  | 'welcome'
  | 'home'
  | 'peekaboo'
  | 'egg'
  | 'feed'
  | 'bubbles'
  | 'bigsmall'
  | 'story'
  | 'settings'
  | 'done'

interface Settings {
  // audio
  muted: boolean
  calmMode: boolean
  sfxOn: boolean
  animalSoundsOn: boolean
  dinoSoundsOn: boolean
  spokenWordsOn: boolean
  musicOn: boolean
  // experience
  reducedMotion: boolean
  sessionLength: 'short' | 'medium'
  dinosaursEnabled: boolean
}

const DEFAULT_SETTINGS: Settings = {
  muted: false,
  calmMode: false,
  sfxOn: true,
  animalSoundsOn: true,
  dinoSoundsOn: true,
  spokenWordsOn: true,
  musicOn: false,
  reducedMotion: false,
  sessionLength: 'short',
  dinosaursEnabled: true,
}

const STORAGE_KEY = 'little-dino-safari/settings'

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

// -----------------------------------------------------------------------------
//  Settings context
// -----------------------------------------------------------------------------

interface SettingsCtx {
  settings: Settings
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void
}

const SettingsContext = createContext<SettingsCtx | null>(null)
function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('SettingsContext missing')
  return ctx
}

// -----------------------------------------------------------------------------
//  Small helpers
// -----------------------------------------------------------------------------

const SESSION_THRESHOLD = { short: 3, medium: 5 } as const

/** Fullscreen support (no-ops gracefully where the browser blocks it). */
function useFullscreen() {
  const [isFs, setIsFs] = useState(false)
  useEffect(() => {
    const onChange = () => setIsFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])
  const supported =
    typeof document !== 'undefined' && (document.fullscreenEnabled ?? false)
  const toggle = useCallback(() => {
    try {
      if (document.fullscreenElement) {
        void document.exitFullscreen?.()
      } else {
        const p = document.documentElement.requestFullscreen?.()
        if (p && typeof p.catch === 'function') p.catch(() => {})
      }
    } catch {
      /* ignore */
    }
  }, [])
  return { isFs, toggle, supported }
}

function FullscreenButton({ large = false }: { large?: boolean }) {
  const { isFs, toggle, supported } = useFullscreen()
  if (!supported) return null
  return (
    <button
      type="button"
      className={`icon-btn ${large ? 'icon-btn--lg' : ''}`}
      aria-label={isFs ? 'Exit full screen' : 'Full screen'}
      onClick={() => {
        Audio.unlockAudio()
        toggle()
      }}
    >
      {isFs ? '🡼' : '⛶'}
    </button>
  )
}

function pickRandom<T>(arr: T[], notId?: string): T {
  const pool = notId ? arr.filter((x) => (x as { id?: string }).id !== notId) : arr
  return pool[Math.floor(Math.random() * pool.length)] ?? arr[0]
}

// A friendly grown-up voice leads: a soft chime, then the name, then the
// sound said out loud ("Cow! ... Moo!"), with a gentle accent underneath.
function announceAnimal(a: Animal) {
  Audio.playReveal()
  window.setTimeout(() => Audio.speakWord(a.name), 200)
  window.setTimeout(() => Audio.speakWord(a.soundText), 1050)
  if (a.id === 'gorilla') window.setTimeout(() => Audio.playGorillaThump(), 1900)
  else window.setTimeout(() => Audio.playAnimalSound(a.id), 1900)
}

function announceDino(d: Dinosaur) {
  Audio.playReveal()
  window.setTimeout(() => Audio.speakWord(d.name), 200)
  window.setTimeout(() => Audio.speakWord(d.soundText), 1050)
  window.setTimeout(() => Audio.playDinoSound(d.id), 1900)
}

// =============================================================================
//  Shared UI building blocks
// =============================================================================

function BigButton({
  children,
  onClick,
  className = '',
  ariaLabel,
  style,
}: {
  children: ReactNode
  onClick: () => void
  className?: string
  ariaLabel?: string
  style?: React.CSSProperties
}) {
  return (
    <button
      type="button"
      className={`big-btn ${className}`}
      aria-label={ariaLabel}
      style={style}
      onClick={() => {
        Audio.unlockAudio()
        onClick()
      }}
    >
      {children}
    </button>
  )
}

/** Top bar shown on every activity: Home, replay prompt, and mute. */
function TopBar({
  onHome,
  onReplay,
  title,
}: {
  onHome: () => void
  onReplay?: () => void
  title: string
}) {
  const { settings, set } = useSettings()
  return (
    <header className="topbar">
      <button type="button" className="icon-btn" aria-label="Go home" onClick={onHome}>
        🏠
      </button>
      <h1 className="topbar__title">{title}</h1>
      <div className="topbar__right">
        {onReplay && (
          <button type="button" className="icon-btn" aria-label="Say it again" onClick={onReplay}>
            🔊
          </button>
        )}
        <button
          type="button"
          className="icon-btn"
          aria-label={settings.muted ? 'Turn sound on' : 'Turn sound off'}
          aria-pressed={settings.muted}
          onClick={() => {
            Audio.unlockAudio()
            set('muted', !settings.muted)
          }}
        >
          {settings.muted ? '🔇' : '🔈'}
        </button>
      </div>
    </header>
  )
}

/** A short, friendly prompt for the grown-up to read aloud. */
function ParentPrompt({ text }: { text: string }) {
  return (
    <p className="parent-prompt" aria-live="polite">
      <span className="parent-prompt__tag">Grown-up:</span> {text}
    </p>
  )
}

// -----------------------------------------------------------------------------
//  The friendly gorilla (cute, smiling, gently beats chest)
// -----------------------------------------------------------------------------

function Gorilla({
  beating,
  className = '',
  label = 'Friendly smiling gorilla',
}: {
  beating: boolean
  className?: string
  label?: string
}) {
  const { settings } = useSettings()
  const animate = beating && !settings.reducedMotion
  return (
    <div className={`gorilla ${animate ? 'gorilla--beat' : ''}`}>
      <Creature id="gorilla" title={label} className={className} />
    </div>
  )
}

// -----------------------------------------------------------------------------
//  Draggable item (also works as a plain tap — very forgiving)
// -----------------------------------------------------------------------------

function DragItem({
  children,
  onChoose,
  ariaLabel,
  className = '',
}: {
  children: ReactNode
  /** Called on a tap OR when dropped onto an element with [data-dropzone]. */
  onChoose: (dropZone: string | null) => void
  ariaLabel: string
  className?: string
}) {
  const { settings } = useSettings()
  const ref = useRef<HTMLButtonElement>(null)
  const start = useRef<{ x: number; y: number } | null>(null)
  const moved = useRef(false)
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null)

  const onDown = (e: ReactPointerEvent) => {
    Audio.unlockAudio()
    start.current = { x: e.clientX, y: e.clientY }
    moved.current = false
    ref.current?.setPointerCapture(e.pointerId)
  }
  const onMove = (e: ReactPointerEvent) => {
    if (!start.current) return
    const dx = e.clientX - start.current.x
    const dy = e.clientY - start.current.y
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) moved.current = true
    if (moved.current && !settings.reducedMotion) setDrag({ x: dx, y: dy })
  }
  const onUp = (e: ReactPointerEvent) => {
    if (!start.current) return
    let zone: string | null = null
    if (moved.current) {
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
      zone = el?.closest<HTMLElement>('[data-dropzone]')?.dataset.dropzone ?? null
    }
    start.current = null
    setDrag(null)
    onChoose(zone)
  }

  return (
    <button
      ref={ref}
      type="button"
      aria-label={ariaLabel}
      className={`drag-item ${drag ? 'drag-item--dragging' : ''} ${className}`}
      style={drag ? { transform: `translate(${drag.x}px, ${drag.y}px)` } : undefined}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={() => {
        start.current = null
        setDrag(null)
      }}
    >
      {children}
    </button>
  )
}

// =============================================================================
//  HOME SCREEN
// =============================================================================

function HomeScreen({
  go,
  openParents,
}: {
  go: (s: Screen) => void
  openParents: () => void
}) {
  const { settings, set } = useSettings()
  const allTiles: { screen: Screen; label: string; emoji: string; dino?: boolean }[] = [
    { screen: 'peekaboo', label: 'Peekaboo', emoji: '🌿' },
    { screen: 'egg', label: 'Dino Eggs', emoji: '🥚', dino: true },
    { screen: 'feed', label: 'Feed Time', emoji: '🍌' },
    { screen: 'bubbles', label: 'Bubbles', emoji: '🫧' },
    { screen: 'bigsmall', label: 'Big & Small', emoji: '🐘' },
    { screen: 'story', label: 'Story Time', emoji: '📖' },
  ]
  const tiles = allTiles.filter((t) => settings.dinosaursEnabled || !t.dino)

  return (
    <div className="screen home">
      <header className="home__header">
        <h1 className="home__title">Little Dino Safari</h1>
        <p className="home__subtitle">Let’s play together! 🦕</p>
      </header>

      <div className="tile-grid">
        {tiles.map((t) => (
          <BigButton
            key={t.screen}
            className="tile"
            ariaLabel={t.label}
            onClick={() => go(t.screen)}
          >
            <span className="tile__emoji" aria-hidden="true">
              {t.emoji}
            </span>
            <span className="tile__label">{t.label}</span>
          </BigButton>
        ))}
      </div>

      <div className="home__footer">
        <button
          type="button"
          className="icon-btn icon-btn--lg"
          aria-label={settings.muted ? 'Turn sound on' : 'Turn sound off'}
          onClick={() => {
            Audio.unlockAudio()
            set('muted', !settings.muted)
          }}
        >
          {settings.muted ? '🔇' : '🔈'}
        </button>
        <button type="button" className="text-btn" onClick={() => go('done')}>
          All Done 👋
        </button>
        <FullscreenButton large />
        <button type="button" className="icon-btn icon-btn--lg" aria-label="Parent settings" onClick={openParents}>
          ⚙️
        </button>
      </div>
    </div>
  )
}

// =============================================================================
//  GAME 1 — ANIMAL PEEKABOO
// =============================================================================

function PeekabooScreen({ onHome, onDone }: { onHome: () => void; onDone: () => void }) {
  const { settings } = useSettings()
  const pool = useMemo(() => ANIMALS, [])
  const [animal, setAnimal] = useState<Animal>(() => pickRandom(pool))
  const [revealed, setRevealed] = useState(false)
  const [round, setRound] = useState(0)
  const [beat, setBeat] = useState(false)

  const habitatCover: Record<string, { emoji: string; bg: string; variant: SceneVariant }> = {
    farm: { emoji: '🌾', bg: 'scene--farm', variant: 'farm' },
    jungle: { emoji: '🌿', bg: 'scene--jungle', variant: 'jungle' },
    pond: { emoji: '💧', bg: 'scene--pond', variant: 'pond' },
    savanna: { emoji: '🌳', bg: 'scene--savanna', variant: 'savanna' },
    sky: { emoji: '☁️', bg: 'scene--sky', variant: 'sky' },
    dinoland: { emoji: '🌋', bg: 'scene--jungle', variant: 'jungle' },
  }
  const cover = habitatCover[animal.habitat]

  const reveal = useCallback(() => {
    if (revealed) {
      // tapping again repeats the sound
      announceAnimal(animal)
      if (animal.id === 'gorilla') {
        setBeat(true)
        window.setTimeout(() => setBeat(false), 1400)
      }
      return
    }
    setRevealed(true)
    announceAnimal(animal)
    if (animal.id === 'gorilla') {
      setBeat(true)
      window.setTimeout(() => setBeat(false), 1600)
    }
  }, [animal, revealed])

  const next = () => {
    Audio.playPageTurn()
    setRevealed(false)
    setBeat(false)
    setAnimal((cur) => pickRandom(pool, cur.id))
    setRound((r) => r + 1)
  }

  const prompt = revealed
    ? animal.parentPrompts[round % animal.parentPrompts.length]
    : `Where is the hiding animal? Tap the ${cover.emoji}!`

  return (
    <div className={`screen scene ${cover.bg}`}>
      <Scene variant={cover.variant} />
      <TopBar title="Peekaboo" onHome={onHome} onReplay={revealed ? () => announceAnimal(animal) : undefined} />

      <div className="stage">
        {!revealed ? (
          <button
            type="button"
            className="peek-cover"
            aria-label="Tap to find the hidden animal"
            onClick={reveal}
          >
            <span className="peek-cover__emoji" aria-hidden="true">
              {cover.emoji}
            </span>
            <span className="peek-cover__hint">Tap me!</span>
          </button>
        ) : animal.id === 'gorilla' ? (
          <button type="button" className="reveal-btn" aria-label={`${animal.name}. ${animal.soundText}`} onClick={reveal}>
            <Gorilla beating={beat} />
            <span className="creature-name">{animal.name}</span>
            <span className="creature-sound">{animal.soundText}</span>
          </button>
        ) : (
          <button
            type="button"
            className={`reveal-btn ${settings.reducedMotion ? '' : 'pop-in'}`}
            aria-label={`${animal.name}. ${animal.soundText}`}
            onClick={reveal}
          >
            <Creature id={animal.id} title={animal.name} />
            <span className="creature-name">{animal.name}</span>
            <span className="creature-sound">{animal.soundText}</span>
          </button>
        )}
      </div>

      <ParentPrompt text={prompt} />

      <div className="action-row">
        {revealed && (
          <BigButton className="next-btn" onClick={next} ariaLabel="Next animal">
            Next 🌿
          </BigButton>
        )}
        <button type="button" className="text-btn" onClick={onDone}>
          Finish
        </button>
      </div>
    </div>
  )
}

// =============================================================================
//  GAME 2 — DINO EGG HATCH
// =============================================================================

function EggHatchScreen({ onHome, onDone }: { onHome: () => void; onDone: () => void }) {
  const { settings } = useSettings()
  const [eggs] = useState(() => ['#ffd6e0', '#cdeffd', '#e3f7d3'])
  const [hatched, setHatched] = useState<Dinosaur | null>(null)
  const [round, setRound] = useState(0)
  const [wiggle, setWiggle] = useState(false)

  const hatch = (eggIndex: number) => {
    Audio.playEggCrack()
    const d = DINOSAURS[(eggIndex + round) % DINOSAURS.length]
    window.setTimeout(() => {
      setHatched(d)
      announceDino(d)
      setWiggle(true)
      window.setTimeout(() => setWiggle(false), 1200)
    }, 350)
  }

  const repeat = () => {
    if (!hatched) return
    announceDino(hatched)
    setWiggle(true)
    window.setTimeout(() => setWiggle(false), 1200)
  }

  const again = () => {
    Audio.playPageTurn()
    setHatched(null)
    setRound((r) => r + 1)
  }

  return (
    <div className="screen scene scene--jungle">
      <Scene variant="jungle" />
      <TopBar title="Dino Eggs" onHome={onHome} onReplay={hatched ? repeat : undefined} />

      <div className="stage">
        {!hatched ? (
          <>
            <div className="egg-row">
              {eggs.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  className="egg"
                  style={{ background: c }}
                  aria-label={`Tap egg ${i + 1}`}
                  onClick={() => hatch(i)}
                >
                  🥚
                </button>
              ))}
            </div>
            <ParentPrompt text="Can you tap an egg? Let’s see who is inside!" />
          </>
        ) : (
          <>
            <button
              type="button"
              className={`reveal-btn ${wiggle && !settings.reducedMotion ? 'wiggle' : ''}`}
              aria-label={`${hatched.name}. ${hatched.soundText}`}
              onClick={repeat}
            >
              <Creature id={hatched.id} title={hatched.name} />
              <span className="creature-name">{hatched.name}</span>
              <span className="creature-sound">{hatched.soundText}</span>
            </button>
            <ParentPrompt text={hatched.parentPrompts[round % hatched.parentPrompts.length]} />
          </>
        )}
      </div>

      <div className="action-row">
        {hatched && (
          <BigButton className="next-btn" onClick={again} ariaLabel="More eggs">
            More eggs 🥚
          </BigButton>
        )}
        <button type="button" className="text-btn" onClick={onDone}>
          Finish
        </button>
      </div>
    </div>
  )
}

// =============================================================================
//  GAME 3 — FEED THE ANIMAL
// =============================================================================

const EXTRA_FOODS = [
  { emoji: '🍌', label: 'banana' },
  { emoji: '🥕', label: 'carrot' },
  { emoji: '🌿', label: 'grass' },
  { emoji: '🌾', label: 'hay' },
  { emoji: '🍓', label: 'fruit' },
  { emoji: '🍃', label: 'leaves' },
  { emoji: '🐟', label: 'fish' },
  { emoji: '🦴', label: 'bone' },
  { emoji: '🌰', label: 'seeds' },
]

const HAPPY = ['Yum!', 'Great job!', 'Delicious!', 'So tasty!']
const TRY_AGAIN = ['Try another one.', 'Let’s try again.', 'Hmm, what does it like?']

function FeedScreen({ onHome, onDone }: { onHome: () => void; onDone: () => void }) {
  const { settings } = useSettings()
  const feeders = useMemo(() => ANIMALS.filter((a) => a.preferredFood), [])
  const [animal, setAnimal] = useState<Animal>(() => pickRandom(feeders))
  const [foods, setFoods] = useState<{ emoji: string; label: string }[]>([])
  const [status, setStatus] = useState<'idle' | 'wrong' | 'happy'>('idle')
  const [message, setMessage] = useState('')

  const buildFoods = useCallback((a: Animal) => {
    const wrong = EXTRA_FOODS.filter((f) => f.label !== a.preferredFood.label)
    const chosen = [a.preferredFood]
    while (chosen.length < 3 && wrong.length) {
      const idx = Math.floor(Math.random() * wrong.length)
      chosen.push(wrong.splice(idx, 1)[0])
    }
    return chosen.sort(() => Math.random() - 0.5)
  }, [])

  useEffect(() => {
    setFoods(buildFoods(animal))
    setStatus('idle')
    setMessage('')
    Audio.speakWord(`Feed the ${animal.name}`)
  }, [animal, buildFoods])

  const choose = (label: string) => {
    if (status === 'happy') return
    if (label === animal.preferredFood.label) {
      setStatus('happy')
      Audio.playEat()
      window.setTimeout(() => Audio.playSuccess(), 250)
      window.setTimeout(() => Audio.playAnimalSound(animal.id), 600)
      const m = `${HAPPY[Math.floor(Math.random() * HAPPY.length)]} ${animal.name} likes ${animal.preferredFood.label}.`
      setMessage(m)
      Audio.speakWord(m)
    } else {
      setStatus('wrong')
      Audio.playTap()
      const m = TRY_AGAIN[Math.floor(Math.random() * TRY_AGAIN.length)]
      setMessage(m)
      Audio.speakWord(m)
      window.setTimeout(() => setStatus('idle'), 900)
    }
  }

  const next = () => {
    Audio.playPageTurn()
    setAnimal((cur) => pickRandom(feeders, cur.id))
  }

  return (
    <div className="screen scene scene--farm">
      <Scene variant="farm" />
      <TopBar title="Feed Time" onHome={onHome} onReplay={() => Audio.speakWord(`Feed the ${animal.name}`)} />

      <div className="stage stage--feed">
        <div className="feed-animal" data-dropzone="animal">
          {animal.id === 'gorilla' ? (
            <Gorilla beating={status === 'happy'} />
          ) : (
            <Creature
              id={animal.id}
              title={animal.name}
              className={status === 'happy' && !settings.reducedMotion ? 'nom' : ''}
            />
          )}
          <span className="creature-name">{animal.name}</span>
        </div>

        {status !== 'happy' ? (
          <div className="food-row">
            {foods.map((f, i) => (
              <DragItem
                key={f.label + i}
                ariaLabel={`Give ${f.label}`}
                className="food"
                onChoose={() => choose(f.label)}
              >
                <span aria-hidden="true">{f.emoji}</span>
              </DragItem>
            ))}
          </div>
        ) : (
          <BigButton className="next-btn" onClick={next} ariaLabel="Feed another animal">
            Another friend 🍽️
          </BigButton>
        )}
      </div>

      <ParentPrompt
        text={
          status === 'idle'
            ? `Which food does the ${animal.name} like? Tap it!`
            : message
        }
      />

      <div className="action-row">
        <button type="button" className="text-btn" onClick={onDone}>
          Finish
        </button>
      </div>
    </div>
  )
}

// =============================================================================
//  GAME 4 — BUBBLE POP
// =============================================================================

interface BubbleData {
  id: number
  x: number // vw
  emoji: string
  label: string
  kind: 'animal' | 'dino' | 'color' | 'shape' | 'action'
  soundId?: string
  duration: number
}

const COLORS = [
  { label: 'Red', emoji: '🔴' },
  { label: 'Blue', emoji: '🔵' },
  { label: 'Yellow', emoji: '🟡' },
  { label: 'Green', emoji: '🟢' },
]
const SHAPES = [
  { label: 'Circle', emoji: '⚪' },
  { label: 'Star', emoji: '⭐' },
  { label: 'Heart', emoji: '❤️' },
]
const ACTIONS = [
  { label: 'Pop', emoji: '🫧' },
  { label: 'Roar', emoji: '🦖' },
  { label: 'Stomp', emoji: '🦕' },
]

function BubblePopScreen({ onHome, onDone }: { onHome: () => void; onDone: () => void }) {
  const { settings } = useSettings()
  const [bubbles, setBubbles] = useState<BubbleData[]>([])
  const [popped, setPopped] = useState(0)
  const idRef = useRef(0)
  const finished = popped >= 10

  const makeBubble = useCallback((): BubbleData => {
    const id = idRef.current++
    const roll = Math.random()
    const dur = (settings.reducedMotion ? 11 : 8) + Math.random() * 3
    const x = 8 + Math.random() * 74
    if (roll < 0.4 && (settings.dinosaursEnabled || roll < 0.28)) {
      const a = pickRandom(ANIMALS)
      return { id, x, emoji: a.emoji, label: a.name, kind: 'animal', soundId: a.id, duration: dur }
    }
    if (roll < 0.55 && settings.dinosaursEnabled) {
      const d = pickRandom(DINOSAURS)
      return { id, x, emoji: d.emoji, label: d.name, kind: 'dino', soundId: d.id, duration: dur }
    }
    if (roll < 0.72) {
      const c = pickRandom(COLORS)
      return { id, x, emoji: c.emoji, label: c.label, kind: 'color', duration: dur }
    }
    if (roll < 0.88) {
      const s = pickRandom(SHAPES)
      return { id, x, emoji: s.emoji, label: s.label, kind: 'shape', duration: dur }
    }
    const act = pickRandom(ACTIONS)
    return { id, x, emoji: act.emoji, label: act.label, kind: 'action', duration: dur }
  }, [settings.reducedMotion, settings.dinosaursEnabled])

  // Gently spawn bubbles until we reach the calm "all done" point.
  useEffect(() => {
    if (finished) return
    const spawn = () => setBubbles((b) => (b.length >= 4 ? b : [...b, makeBubble()]))
    spawn()
    const t = window.setInterval(spawn, 1700)
    return () => window.clearInterval(t)
  }, [finished, makeBubble])

  const removeBubble = (id: number) =>
    setBubbles((b) => b.filter((x) => x.id !== id))

  const pop = (bub: BubbleData) => {
    Audio.playPop()
    if (bub.kind === 'animal' && bub.soundId) {
      Audio.speakWord(bub.label)
      if (bub.soundId === 'gorilla') {
        window.setTimeout(() => Audio.playGorillaThump(), 350)
      } else {
        window.setTimeout(() => Audio.playAnimalSound(bub.soundId!), 350)
      }
    } else if (bub.kind === 'dino' && bub.soundId) {
      Audio.speakWord(bub.label)
      window.setTimeout(() => Audio.playDinoSound(bub.soundId!), 350)
    } else {
      Audio.speakWord(bub.label)
    }
    removeBubble(bub.id)
    setPopped((p) => p + 1)
  }

  return (
    <div className="screen scene scene--sky">
      <Scene variant="sky" />
      <TopBar title="Bubbles" onHome={onHome} />

      <div className="bubble-stage" aria-label="Floating bubbles to pop">
        {!finished ? (
          bubbles.map((b) => (
            <button
              key={b.id}
              type="button"
              className={`bubble ${settings.reducedMotion ? 'bubble--still' : ''}`}
              style={{ left: `${b.x}vw`, animationDuration: `${b.duration}s` }}
              aria-label={`Pop ${b.label}`}
              onClick={() => pop(b)}
              onAnimationEnd={() => removeBubble(b.id)}
            >
              <span className="bubble__inner" aria-hidden="true">
                {b.emoji}
              </span>
            </button>
          ))
        ) : (
          <div className="finish-card">
            <span className="finish-card__emoji" aria-hidden="true">
              🫧✨
            </span>
            <p className="finish-card__text">Great playing!</p>
          </div>
        )}
      </div>

      <ParentPrompt
        text={finished ? 'You popped so many bubbles! What did you see?' : 'Can you pop the bubbles? Say what you see!'}
      />

      <div className="action-row">
        <button type="button" className="text-btn" onClick={onDone}>
          {finished ? 'All done' : 'Finish'}
        </button>
      </div>
    </div>
  )
}

// =============================================================================
//  GAME 5 — BIG / SMALL SORTING
// =============================================================================

type SortItem = { id: string; emoji: string; name: string; size: 'big' | 'small'; isGorilla?: boolean; creatureId?: string }

function BigSmallScreen({ onHome, onDone }: { onHome: () => void; onDone: () => void }) {
  const { settings } = useSettings()

  const items = useMemo<SortItem[]>(() => {
    const list: SortItem[] = []
    for (const a of ANIMALS) list.push({ id: a.id, emoji: a.emoji, name: a.name, size: a.size, isGorilla: a.id === 'gorilla', creatureId: a.id })
    if (settings.dinosaursEnabled) {
      for (const d of DINOSAURS) list.push({ id: 'dino-' + d.id, emoji: d.emoji, name: d.name, size: d.size, creatureId: d.id })
    }
    list.push({ id: 'egg', emoji: '🥚', name: 'Small egg', size: 'small' })
    return list
  }, [settings.dinosaursEnabled])

  const [item, setItem] = useState<SortItem>(() => pickRandom(items))
  const [feedback, setFeedback] = useState<'idle' | 'wrong' | 'right'>('idle')
  const [message, setMessage] = useState('')

  const next = useCallback(() => {
    setItem((cur) => pickRandom(items, cur.id))
    setFeedback('idle')
    setMessage('')
  }, [items])

  const answer = (zone: 'big' | 'small') => {
    if (feedback === 'right') return
    if (zone === item.size) {
      setFeedback('right')
      const word = item.size === 'big' ? 'Big!' : 'Small!'
      const m = item.isGorilla ? 'Big gorilla!' : `${word} ${item.name}.`
      setMessage(m)
      Audio.playSuccess()
      Audio.speakWord(m)
      if (item.isGorilla) window.setTimeout(() => Audio.playGorillaThump(), 500)
      window.setTimeout(next, 1700)
    } else {
      setFeedback('wrong')
      const m = 'Let’s try again.'
      setMessage(m)
      Audio.playTap()
      Audio.speakWord(m)
      window.setTimeout(() => setFeedback('idle'), 900)
    }
  }

  return (
    <div className="screen scene scene--savanna">
      <Scene variant="savanna" />
      <TopBar title="Big & Small" onHome={onHome} onReplay={() => Audio.speakWord(item.name)} />

      <div className="stage stage--sort">
        <div className="sort-item-wrap">
          {item.isGorilla ? (
            <DragItem ariaLabel={`Sort the ${item.name}`} className="sort-item" onChoose={(z) => z && answer(z as 'big' | 'small')}>
              <Gorilla beating={feedback === 'right'} />
            </DragItem>
          ) : item.creatureId ? (
            <DragItem ariaLabel={`Sort the ${item.name}`} className="sort-item" onChoose={(z) => z && answer(z as 'big' | 'small')}>
              <Creature id={item.creatureId} title={item.name} className={feedback === 'right' && !settings.reducedMotion ? 'pop-in' : ''} />
            </DragItem>
          ) : (
            <DragItem ariaLabel={`Sort the ${item.name}`} className="sort-item" onChoose={(z) => z && answer(z as 'big' | 'small')}>
              <span className={`creature-emoji ${feedback === 'right' && !settings.reducedMotion ? 'pop-in' : ''}`} aria-hidden="true">
                {item.emoji}
              </span>
            </DragItem>
          )}
          <span className="creature-name">{item.name}</span>
        </div>

        <div className="zone-row">
          <button type="button" className="zone zone--big" data-dropzone="big" aria-label="Big zone" onClick={() => answer('big')}>
            <span className="zone__emoji" aria-hidden="true">
              🐘
            </span>
            <span className="zone__label">BIG</span>
          </button>
          <button type="button" className="zone zone--small" data-dropzone="small" aria-label="Small zone" onClick={() => answer('small')}>
            <span className="zone__emoji" aria-hidden="true">
              🐣
            </span>
            <span className="zone__label">small</span>
          </button>
        </div>
      </div>

      <ParentPrompt
        text={feedback === 'idle' ? `Is the ${item.name} big or small? Tap a box!` : message}
      />

      <div className="action-row">
        <button type="button" className="text-btn" onClick={onDone}>
          Finish
        </button>
      </div>
    </div>
  )
}

// =============================================================================
//  GAME 6 — STORY TIME: "The Little Dinosaur Says Hello"
// =============================================================================

interface StoryPage {
  text: string
  prompt: string
  emoji: string
  isGorilla?: boolean
  creatureId?: string
  onTap: () => void
}

function StoryScreen({ onHome, onDone }: { onHome: () => void; onDone: () => void }) {
  const { settings } = useSettings()
  const [page, setPage] = useState(0)
  const [beat, setBeat] = useState(false)
  const [wave, setWave] = useState(false)

  const doBeat = () => {
    setBeat(true)
    Audio.playGorillaThump()
    window.setTimeout(() => setBeat(false), 1400)
  }

  const pages: StoryPage[] = [
    {
      text: 'The little dinosaur wakes up.',
      prompt: 'Can you stretch too?',
      emoji: '🦕',
      creatureId: 'baby',
      onTap: () => {
        Audio.playDinoSound('baby')
        Audio.speakWord('Good morning!')
      },
    },
    {
      text: 'The little dinosaur sees a cow.',
      prompt: 'Can you say moo?',
      emoji: '🐄',
      creatureId: 'cow',
      onTap: () => {
        Audio.speakWord('Cow')
        window.setTimeout(() => Audio.playAnimalSound('cow'), 600)
      },
    },
    {
      text: 'The little dinosaur sees a duck.',
      prompt: 'Can you flap like a duck?',
      emoji: '🦆',
      creatureId: 'duck',
      onTap: () => {
        Audio.speakWord('Duck')
        window.setTimeout(() => Audio.playAnimalSound('duck'), 600)
      },
    },
    {
      text: 'The little dinosaur sees a friendly gorilla.',
      prompt: 'Can you say hello to the gorilla?',
      emoji: '🦍',
      isGorilla: true,
      onTap: () => {
        Audio.speakWord('Gorilla')
        window.setTimeout(doBeat, 600)
      },
    },
    {
      text: 'The gorilla says hello.',
      prompt: 'Can you wave hello?',
      emoji: '🦍',
      isGorilla: true,
      onTap: () => {
        Audio.speakWord('Hello!')
        setWave(true)
        window.setTimeout(() => setWave(false), 1200)
      },
    },
    {
      text: 'The little dinosaur finds a red ball.',
      prompt: 'Can you find something red?',
      emoji: '🔴',
      onTap: () => Audio.speakWord('Red ball'),
    },
    {
      text: 'Everyone says bye-bye.',
      prompt: 'Can you wave bye-bye?',
      emoji: '👋',
      onTap: () => {
        Audio.speakWord('Bye bye!')
        Audio.playGoodbye()
      },
    },
  ]

  const p = pages[page]
  const isLast = page === pages.length - 1

  const goNext = () => {
    Audio.playPageTurn()
    setBeat(false)
    setWave(false)
    setPage((n) => Math.min(n + 1, pages.length - 1))
  }
  const goPrev = () => {
    Audio.playPageTurn()
    setBeat(false)
    setWave(false)
    setPage((n) => Math.max(n - 1, 0))
  }

  return (
    <div className="screen scene scene--jungle">
      <Scene variant="jungle" />
      <TopBar title="Story Time" onHome={onHome} onReplay={() => Audio.speakWord(p.text)} />

      <p className="story-text" aria-live="polite">
        {p.text}
      </p>

      <div className="stage">
        <button type="button" className={`reveal-btn ${wave && !settings.reducedMotion ? 'wave' : ''}`} aria-label={p.text} onClick={p.onTap}>
          {p.isGorilla ? (
            <Gorilla beating={beat} />
          ) : p.creatureId ? (
            <Creature id={p.creatureId} title={p.text} />
          ) : (
            <span className="creature-emoji" aria-hidden="true">
              {p.emoji}
            </span>
          )}
        </button>
      </div>

      <ParentPrompt text={p.prompt} />

      <div className="action-row story-nav">
        <button type="button" className="icon-btn icon-btn--lg" aria-label="Previous page" disabled={page === 0} onClick={goPrev}>
          ◀
        </button>
        <span className="story-dots" aria-hidden="true">
          {pages.map((_, i) => (
            <span key={i} className={`dot ${i === page ? 'dot--on' : ''}`} />
          ))}
        </span>
        {!isLast ? (
          <button type="button" className="icon-btn icon-btn--lg" aria-label="Next page" onClick={goNext}>
            ▶
          </button>
        ) : (
          <BigButton className="next-btn" onClick={onDone} ariaLabel="Finish the story">
            The End 💚
          </BigButton>
        )}
      </div>
    </div>
  )
}

// =============================================================================
//  PARENT GATE + PARENT SETTINGS
// =============================================================================

function ParentGate({ onPass, onCancel }: { onPass: () => void; onCancel: () => void }) {
  const a = 3
  const b = 2
  const options = useMemo(() => {
    const correct = a + b
    const set = new Set<number>([correct])
    while (set.size < 3) set.add(correct + (Math.floor(Math.random() * 5) - 2))
    return Array.from(set).sort(() => Math.random() - 0.5)
  }, [])

  return (
    <div className="gate-overlay" role="dialog" aria-modal="true" aria-label="Grown-up check">
      <div className="gate-card">
        <h2 className="gate-title">For grown-ups 🔒</h2>
        <p className="gate-q">
          Tap the answer: <strong>{a} + {b}</strong>
        </p>
        <div className="gate-options">
          {options.map((n) => (
            <button
              key={n}
              type="button"
              className="gate-num"
              onClick={() => {
                if (n === a + b) onPass()
                else Audio.playTap()
              }}
            >
              {n}
            </button>
          ))}
        </div>
        <button type="button" className="text-btn" onClick={onCancel}>
          Back
        </button>
      </div>
    </div>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="toggle">
      <span className="toggle__label">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`toggle__switch ${checked ? 'toggle__switch--on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="toggle__knob" />
      </button>
    </label>
  )
}

function ParentSettingsScreen({ onHome }: { onHome: () => void }) {
  const { settings, set } = useSettings()
  const [showTips, setShowTips] = useState(false)

  const tips = [
    'Make the animal sound together.',
    'Point to the animal and name it.',
    'Repeat the word slowly, twice.',
    'Find a matching toy animal.',
    'Read an animal book together.',
    'Stomp like a dinosaur. 🦕',
    'Flap like a bird. 🐦',
    'Roll a ball back and forth. ⚽',
    'Take a movement break.',
    'Say bye-bye and close the game. 👋',
  ]

  return (
    <div className="screen settings">
      <TopBar title="Parent Settings" onHome={onHome} />

      <div className="settings__scroll">
        <section className="info-card">
          <p>
            <strong>Little Dino Safari</strong> is made for short, supervised <em>co-play</em> — not long,
            independent screen time.
          </p>
          <ul>
            <li>Sit together. Talk, point, repeat words, and make the sounds.</li>
            <li>Connect the game to real-world play and toys.</li>
            <li>Never pressure your child to keep going.</li>
            <li>Offline play is best — move and explore after the game.</li>
          </ul>
        </section>

        <button type="button" className="tips-btn" onClick={() => setShowTips((s) => !s)}>
          {showTips ? 'Hide Parent Tips' : 'Parent Tips 💡'}
        </button>
        {showTips && (
          <ul className="tips-list">
            {tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}

        <h3 className="settings__group">Sound</h3>
        <Toggle label="Mute all sounds" checked={settings.muted} onChange={(v) => set('muted', v)} />
        <Toggle label="Sound effects" checked={settings.sfxOn} onChange={(v) => set('sfxOn', v)} />
        <Toggle label="Animal sounds" checked={settings.animalSoundsOn} onChange={(v) => set('animalSoundsOn', v)} />
        <Toggle label="Dinosaur sounds" checked={settings.dinoSoundsOn} onChange={(v) => set('dinoSoundsOn', v)} />
        <Toggle label="Spoken words" checked={settings.spokenWordsOn} onChange={(v) => set('spokenWordsOn', v)} />
        <Toggle label="Background music" checked={settings.musicOn} onChange={(v) => set('musicOn', v)} />
        <Toggle label="Calm Sound Mode (quieter)" checked={settings.calmMode} onChange={(v) => set('calmMode', v)} />

        <h3 className="settings__group">Play</h3>
        <div className="seg-row">
          <span className="toggle__label">Full screen</span>
          <FullscreenButton />
        </div>
        <Toggle label="Reduced motion" checked={settings.reducedMotion} onChange={(v) => set('reducedMotion', v)} />
        <Toggle label="Include dinosaurs" checked={settings.dinosaursEnabled} onChange={(v) => set('dinosaursEnabled', v)} />

        <div className="seg-row" role="group" aria-label="Session length">
          <span className="toggle__label">Session length</span>
          <div className="seg">
            <button
              type="button"
              className={`seg__btn ${settings.sessionLength === 'short' ? 'seg__btn--on' : ''}`}
              aria-pressed={settings.sessionLength === 'short'}
              onClick={() => set('sessionLength', 'short')}
            >
              Short
            </button>
            <button
              type="button"
              className={`seg__btn ${settings.sessionLength === 'medium' ? 'seg__btn--on' : ''}`}
              aria-pressed={settings.sessionLength === 'medium'}
              onClick={() => set('sessionLength', 'medium')}
            >
              Medium
            </button>
          </div>
        </div>

        <p className="settings__note">
          Settings are saved on this device only. No accounts, no ads, no tracking.
        </p>
      </div>
    </div>
  )
}

// =============================================================================
//  ALL DONE SCREEN
// =============================================================================

function AllDoneScreen({ onHome }: { onHome: () => void }) {
  const { settings } = useSettings()
  useEffect(() => {
    Audio.speakWord('All done. Great playing!')
    window.setTimeout(() => Audio.playGoodbye(), 900)
  }, [])

  const ideas = [
    { emoji: '🧸', text: 'Find a stuffed animal.' },
    { emoji: '📚', text: 'Read an animal book.' },
    { emoji: '🦕', text: 'Stomp like a dinosaur.' },
    { emoji: '⚽', text: 'Roll a ball.' },
    { emoji: '🐮', text: 'Make animal sounds together.' },
    { emoji: '🤗', text: 'Give someone a big hug.' },
  ]

  return (
    <div className="screen done-screen">
      <div className={`done-celebrate ${settings.reducedMotion ? '' : 'twinkle'}`} aria-hidden="true">
        ✨🦕✨
      </div>
      <h1 className="done-title">All done!</h1>
      <p className="done-sub">Great playing! 💚</p>

      <p className="done-lead">Now let’s play in the real world:</p>
      <ul className="ideas">
        {ideas.map((i) => (
          <li key={i.text} className="idea">
            <span aria-hidden="true" className="idea__emoji">
              {i.emoji}
            </span>
            <span>{i.text}</span>
          </li>
        ))}
      </ul>

      <BigButton className="home-btn" onClick={onHome} ariaLabel="Go home">
        🏠 Home
      </BigButton>
    </div>
  )
}

// =============================================================================
//  WELCOME SCREEN — first tap unlocks + warms up the friendly voice
// =============================================================================

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  const start = () => {
    Audio.unlockAudio()
    Audio.warmUpSpeech()
    Audio.playReveal()
    window.setTimeout(() => Audio.speakWord('Little Dino Safari'), 350)
    onStart()
  }
  return (
    <button type="button" className="screen welcome" aria-label="Tap to play Little Dino Safari" onClick={start}>
      <div className="welcome__art" aria-hidden="true">
        <div className="welcome__dino float-soft">
          <Creature id="brontosaurus" title="dinosaur" />
        </div>
        <span className="welcome__spark twinkle">✨</span>
      </div>
      <h1 className="welcome__title">Little Dino Safari</h1>
      <p className="welcome__sub">Let’s play together!</p>
      <span className="welcome__cta pulse-soft">👉 Tap to start</span>
    </button>
  )
}

// =============================================================================
//  APP ROOT — router, settings persistence, audio wiring
// =============================================================================

export default function App() {
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [screen, setScreen] = useState<Screen>('welcome')
  const [showGate, setShowGate] = useState(false)
  const activitiesRef = useRef(0)

  const set = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* storage unavailable — keep playing anyway */
      }
      return next
    })
  }, [])

  // Keep the audio engine in sync with settings.
  useEffect(() => {
    Audio.updateAudioSettings({
      muted: settings.muted,
      calmMode: settings.calmMode,
      sfxOn: settings.sfxOn,
      animalSoundsOn: settings.animalSoundsOn,
      dinoSoundsOn: settings.dinoSoundsOn,
      spokenWordsOn: settings.spokenWordsOn,
      musicOn: settings.musicOn,
    })
  }, [settings])

  // Background music on/off (only ever toggled by a user tap in settings).
  useEffect(() => {
    if (settings.musicOn && !settings.muted) Audio.startMusic()
    else Audio.stopMusic()
  }, [settings.musicOn, settings.muted])

  // Reflect reduced-motion preference on the root element.
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', settings.reducedMotion)
  }, [settings.reducedMotion])

  const go = useCallback((s: Screen) => {
    Audio.stopSpeaking()
    setScreen(s)
  }, [])

  // Finishing an activity: count it, and after "several" gently go to All Done.
  const finishActivity = useCallback(() => {
    Audio.stopSpeaking()
    activitiesRef.current += 1
    const threshold = SESSION_THRESHOLD[settings.sessionLength]
    if (activitiesRef.current >= threshold) {
      activitiesRef.current = 0
      setScreen('done')
    } else {
      setScreen('home')
    }
  }, [settings.sessionLength])

  const ctxValue = useMemo<SettingsCtx>(() => ({ settings, set }), [settings, set])

  const onHome = () => go('home')

  return (
    <SettingsContext.Provider value={ctxValue}>
      <div className="app">
        {/* keyed wrapper => each screen change gently fades/slides in */}
        <div key={screen} className="screen-anim">
          {screen === 'welcome' && <WelcomeScreen onStart={() => setScreen('home')} />}
          {screen === 'home' && <HomeScreen go={go} openParents={() => setShowGate(true)} />}
          {screen === 'peekaboo' && <PeekabooScreen onHome={onHome} onDone={finishActivity} />}
          {screen === 'egg' && <EggHatchScreen onHome={onHome} onDone={finishActivity} />}
          {screen === 'feed' && <FeedScreen onHome={onHome} onDone={finishActivity} />}
          {screen === 'bubbles' && <BubblePopScreen onHome={onHome} onDone={finishActivity} />}
          {screen === 'bigsmall' && <BigSmallScreen onHome={onHome} onDone={finishActivity} />}
          {screen === 'story' && <StoryScreen onHome={onHome} onDone={finishActivity} />}
          {screen === 'settings' && <ParentSettingsScreen onHome={onHome} />}
          {screen === 'done' && <AllDoneScreen onHome={onHome} />}
        </div>

        {showGate && (
          <ParentGate
            onPass={() => {
              setShowGate(false)
              go('settings')
            }}
            onCancel={() => setShowGate(false)}
          />
        )}
      </div>
    </SettingsContext.Provider>
  )
}
