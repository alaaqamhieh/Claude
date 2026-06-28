// =============================================================================
//  Little Dino Safari — Audio Engine
// -----------------------------------------------------------------------------
//  All sounds are generated live with the Web Audio API, so the game needs NO
//  audio files to work. Sounds are intentionally soft, short, and gentle.
//
//  Design rules honored here:
//   - No audio ever plays before the first user gesture (the AudioContext is
//     created lazily on the first play call, which only happens after a tap).
//   - A always-available mute, plus a "Calm Sound Mode" that lowers volume.
//   - Repeated taps restart a sound instead of layering chaotic overlaps.
//   - Spoken words use the browser's built-in speech synthesis (no network).
//   - To add REAL audio files later, see playFile() at the bottom of this file.
// =============================================================================

export interface AudioSettings {
  muted: boolean
  calmMode: boolean
  sfxOn: boolean
  animalSoundsOn: boolean
  dinoSoundsOn: boolean
  spokenWordsOn: boolean
  musicOn: boolean
}

const DEFAULT_SETTINGS: AudioSettings = {
  muted: false,
  calmMode: false,
  sfxOn: true,
  animalSoundsOn: true,
  dinoSoundsOn: true,
  spokenWordsOn: true,
  musicOn: false,
}

let settings: AudioSettings = { ...DEFAULT_SETTINGS }

let ctx: AudioContext | null = null
let master: GainNode | null = null

// Voices that are currently sounding for melodic effects. We fade these out
// when a new melodic sound starts so rapid taps "restart" rather than pile up.
let activeVoices: { osc: OscillatorNode; gain: GainNode }[] = []

// Simple per-tag debounce so a frantically tapping toddler can't spam audio.
const lastPlayed: Record<string, number> = {}

// -----------------------------------------------------------------------------
//  Setup / settings
// -----------------------------------------------------------------------------

export function updateAudioSettings(next: AudioSettings) {
  settings = next
  applyMasterVolume()
}

function applyMasterVolume() {
  if (!ctx || !master) return
  const base = settings.calmMode ? 0.32 : 0.6
  master.gain.setTargetAtTime(settings.muted ? 0 : base, ctx.currentTime, 0.02)
  if (musicGain) {
    musicGain.gain.setTargetAtTime(settings.calmMode ? 0.018 : 0.03, ctx.currentTime, 0.1)
  }
}

// Created lazily — this is only ever reached from inside a play call, which in
// turn only fires after a user tap. That guarantees no autoplay on load.
function ensureContext(): AudioContext | null {
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  }
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
    master = ctx.createGain()
    master.connect(ctx.destination)
    applyMasterVolume()
    return ctx
  } catch {
    return null // Missing/blocked audio must never crash the game.
  }
}

/** Wake the audio system from a user gesture (called on first interaction). */
export function unlockAudio() {
  ensureContext()
}

function debounced(tag: string, gapMs: number): boolean {
  const now = performance.now()
  if (lastPlayed[tag] && now - lastPlayed[tag] < gapMs) return false
  lastPlayed[tag] = now
  return true
}

function stopActiveVoices(fade = 0.06) {
  if (!ctx) return
  const t = ctx.currentTime
  for (const v of activeVoices) {
    try {
      v.gain.gain.cancelScheduledValues(t)
      v.gain.gain.setTargetAtTime(0, t, fade / 3)
      v.osc.stop(t + fade)
    } catch {
      /* already stopped */
    }
  }
  activeVoices = []
}

// -----------------------------------------------------------------------------
//  Low-level voice helper
// -----------------------------------------------------------------------------

interface Note {
  freq: number
  /** seconds from "now" */
  at: number
  dur: number
  type?: OscillatorType
  /** peak gain, kept low for gentleness (0–1) */
  peak?: number
  /** glide to this frequency across the note */
  glideTo?: number
}

function playNotes(notes: Note[], opts?: { melodic?: boolean }) {
  const c = ensureContext()
  if (!c || !master) return
  if (settings.muted) return

  if (opts?.melodic) stopActiveVoices()

  const t0 = c.currentTime
  for (const n of notes) {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = n.type ?? 'sine'

    const start = t0 + n.at
    const end = start + n.dur
    osc.frequency.setValueAtTime(n.freq, start)
    if (n.glideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, n.glideTo), end)

    const peak = Math.max(0.0001, n.peak ?? 0.25)
    const attack = Math.min(0.03, n.dur * 0.3)
    const release = Math.min(0.12, n.dur * 0.5)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.linearRampToValueAtTime(peak, start + attack)
    gain.gain.setValueAtTime(peak, Math.max(start + attack, end - release))
    gain.gain.exponentialRampToValueAtTime(0.0001, end)

    osc.connect(gain).connect(master)
    osc.start(start)
    osc.stop(end + 0.03)

    if (opts?.melodic) activeVoices.push({ osc, gain })
  }
}

// =============================================================================
//  UI sounds
// =============================================================================

export function playTap() {
  if (!settings.sfxOn) return
  if (!debounced('tap', 40)) return
  playNotes([{ freq: 520, at: 0, dur: 0.08, type: 'sine', peak: 0.18, glideTo: 680 }])
}

export function playPop() {
  if (!settings.sfxOn) return
  if (!debounced('pop', 30)) return
  playNotes([{ freq: 760, at: 0, dur: 0.12, type: 'sine', peak: 0.28, glideTo: 1300 }])
}

export function playEggCrack() {
  if (!settings.sfxOn) return
  if (!debounced('egg', 120)) return
  playNotes([
    { freq: 300, at: 0, dur: 0.05, type: 'triangle', peak: 0.22 },
    { freq: 240, at: 0.09, dur: 0.05, type: 'triangle', peak: 0.22 },
    { freq: 360, at: 0.18, dur: 0.06, type: 'triangle', peak: 0.2 },
  ])
}

export function playPageTurn() {
  if (!settings.sfxOn) return
  if (!debounced('page', 120)) return
  playNotes([{ freq: 520, at: 0, dur: 0.18, type: 'sine', peak: 0.16, glideTo: 300 }])
}

export function playSuccess() {
  if (!settings.sfxOn) return
  if (!debounced('success', 200)) return
  playNotes(
    [
      { freq: 523, at: 0, dur: 0.16, peak: 0.22 },
      { freq: 659, at: 0.13, dur: 0.16, peak: 0.22 },
      { freq: 784, at: 0.26, dur: 0.26, peak: 0.24 },
    ],
    { melodic: true },
  )
}

export function playEat() {
  if (!settings.sfxOn) return
  if (!debounced('eat', 120)) return
  playNotes([
    { freq: 200, at: 0, dur: 0.1, type: 'triangle', peak: 0.2 },
    { freq: 170, at: 0.13, dur: 0.1, type: 'triangle', peak: 0.2 },
  ])
}

export function playGoodbye() {
  if (!settings.sfxOn) return
  if (!debounced('bye', 200)) return
  playNotes(
    [
      { freq: 784, at: 0, dur: 0.2, peak: 0.22 },
      { freq: 659, at: 0.18, dur: 0.2, peak: 0.22 },
      { freq: 523, at: 0.36, dur: 0.34, peak: 0.24 },
    ],
    { melodic: true },
  )
}

// =============================================================================
//  Animal sounds (gentle synthesized impressions)
// =============================================================================

type SoundMaker = () => void

const ANIMAL_SOUNDS: Record<string, SoundMaker> = {
  cow: () => playNotes([{ freq: 210, at: 0, dur: 0.6, type: 'sine', peak: 0.26, glideTo: 165 }], { melodic: true }),
  dog: () =>
    playNotes(
      [
        { freq: 260, at: 0, dur: 0.12, type: 'triangle', peak: 0.26 },
        { freq: 210, at: 0.16, dur: 0.16, type: 'triangle', peak: 0.26 },
      ],
      { melodic: true },
    ),
  cat: () => playNotes([{ freq: 420, at: 0, dur: 0.1, peak: 0.22, glideTo: 660 }, { freq: 660, at: 0.1, dur: 0.22, peak: 0.22, glideTo: 480 }], { melodic: true }),
  duck: () =>
    playNotes(
      [
        { freq: 330, at: 0, dur: 0.1, type: 'square', peak: 0.16 },
        { freq: 300, at: 0.13, dur: 0.12, type: 'square', peak: 0.16 },
      ],
      { melodic: true },
    ),
  lion: () => playNotes([{ freq: 130, at: 0, dur: 0.7, type: 'sawtooth', peak: 0.18, glideTo: 100 }], { melodic: true }),
  elephant: () => playNotes([{ freq: 220, at: 0, dur: 0.5, type: 'sine', peak: 0.24, glideTo: 520 }], { melodic: true }),
  monkey: () =>
    playNotes(
      [
        { freq: 700, at: 0, dur: 0.1, peak: 0.2 },
        { freq: 920, at: 0.12, dur: 0.1, peak: 0.2 },
        { freq: 760, at: 0.24, dur: 0.1, peak: 0.2 },
      ],
      { melodic: true },
    ),
  sheep: () =>
    playNotes(
      [
        { freq: 360, at: 0, dur: 0.12, type: 'sawtooth', peak: 0.16 },
        { freq: 320, at: 0.12, dur: 0.12, type: 'sawtooth', peak: 0.16 },
        { freq: 360, at: 0.24, dur: 0.14, type: 'sawtooth', peak: 0.16 },
      ],
      { melodic: true },
    ),
  horse: () =>
    playNotes(
      [
        { freq: 620, at: 0, dur: 0.08, peak: 0.18 },
        { freq: 520, at: 0.08, dur: 0.08, peak: 0.18 },
        { freq: 440, at: 0.16, dur: 0.08, peak: 0.18 },
        { freq: 360, at: 0.24, dur: 0.14, peak: 0.18, glideTo: 300 },
      ],
      { melodic: true },
    ),
  bird: () =>
    playNotes(
      [
        { freq: 1200, at: 0, dur: 0.07, peak: 0.16, glideTo: 1500 },
        { freq: 1400, at: 0.1, dur: 0.07, peak: 0.16, glideTo: 1700 },
      ],
      { melodic: true },
    ),
  gorilla: () => playNotes([{ freq: 150, at: 0, dur: 0.45, type: 'sine', peak: 0.22, glideTo: 120 }], { melodic: true }),
}

export function playAnimalSound(id: string) {
  if (!settings.animalSoundsOn) return
  if (!debounced('animal:' + id, 120)) return
  ANIMAL_SOUNDS[id]?.()
}

/** Two soft low thumps — the gorilla's playful chest beat. */
export function playGorillaThump() {
  if (!settings.animalSoundsOn && !settings.sfxOn) return
  if (!debounced('thump', 200)) return
  playNotes([
    { freq: 80, at: 0, dur: 0.14, type: 'sine', peak: 0.3 },
    { freq: 76, at: 0.26, dur: 0.14, type: 'sine', peak: 0.3 },
  ])
}

// =============================================================================
//  Dinosaur sounds (friendly — never loud or scary)
// =============================================================================

const DINO_SOUNDS: Record<string, SoundMaker> = {
  trex: () => playNotes([{ freq: 170, at: 0, dur: 0.45, type: 'sawtooth', peak: 0.2, glideTo: 140 }], { melodic: true }),
  triceratops: () =>
    playNotes(
      [
        { freq: 95, at: 0, dur: 0.16, type: 'sine', peak: 0.3 },
        { freq: 90, at: 0.24, dur: 0.16, type: 'sine', peak: 0.3 },
      ],
      { melodic: true },
    ),
  brontosaurus: () => playNotes([{ freq: 140, at: 0, dur: 0.7, type: 'sine', peak: 0.22, glideTo: 150 }], { melodic: true }),
  stegosaurus: () =>
    playNotes(
      [
        { freq: 800, at: 0, dur: 0.12, peak: 0.16 },
        { freq: 1000, at: 0.12, dur: 0.12, peak: 0.16 },
        { freq: 1250, at: 0.24, dur: 0.18, peak: 0.16 },
      ],
      { melodic: true },
    ),
  baby: () =>
    playNotes(
      [
        { freq: 900, at: 0, dur: 0.1, peak: 0.18, glideTo: 1100 },
        { freq: 520, at: 0.14, dur: 0.16, type: 'sawtooth', peak: 0.16, glideTo: 460 },
      ],
      { melodic: true },
    ),
}

export function playDinoSound(id: string) {
  if (!settings.dinoSoundsOn) return
  if (!debounced('dino:' + id, 120)) return
  DINO_SOUNDS[id]?.()
}

// =============================================================================
//  Soft background music — a slow, quiet pad. OFF by default.
// -----------------------------------------------------------------------------
//  Only ever started from a settings toggle (a user tap), so never autoplays.
// =============================================================================

let musicGain: GainNode | null = null
let musicVoices: OscillatorNode[] = []

export function startMusic() {
  const c = ensureContext()
  if (!c || !master) return
  if (musicGain) return // already playing
  musicGain = c.createGain()
  musicGain.gain.value = settings.calmMode ? 0.018 : 0.03 // very quiet
  musicGain.connect(master)

  // A gentle, warm chord that slowly breathes.
  const chord = [196, 261.6, 329.6] // G3, C4, E4
  const lfo = c.createOscillator()
  const lfoGain = c.createGain()
  lfo.frequency.value = 0.08 // very slow breathing
  lfoGain.gain.value = 0.012
  lfo.connect(lfoGain).connect(musicGain.gain)
  lfo.start()
  musicVoices.push(lfo)

  for (const f of chord) {
    const osc = c.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = f
    osc.connect(musicGain)
    osc.start()
    musicVoices.push(osc)
  }
}

export function stopMusic() {
  if (!ctx || !musicGain) return
  const t = ctx.currentTime
  musicGain.gain.setTargetAtTime(0, t, 0.3)
  const toStop = musicVoices
  const g = musicGain
  musicVoices = []
  musicGain = null
  window.setTimeout(() => {
    for (const v of toStop) {
      try {
        v.stop()
      } catch {
        /* already stopped */
      }
    }
    try {
      g.disconnect()
    } catch {
      /* ignore */
    }
  }, 600)
}

// =============================================================================
//  Spoken words (browser built-in, fully offline)
// =============================================================================

export function speakWord(word: string) {
  if (!settings.spokenWordsOn || settings.muted) return
  if (!debounced('speak', 120)) return
  try {
    const synth = window.speechSynthesis
    if (!synth) return
    synth.cancel() // never let phrases pile up
    const u = new SpeechSynthesisUtterance(word)
    u.rate = settings.calmMode ? 0.78 : 0.86
    u.pitch = 1.15
    u.volume = settings.calmMode ? 0.65 : 0.85
    synth.speak(u)
  } catch {
    /* speech unavailable — silently ignore */
  }
}

export function stopSpeaking() {
  try {
    window.speechSynthesis?.cancel()
  } catch {
    /* ignore */
  }
}

// =============================================================================
//  Hook point for REAL audio files (optional, added later by you)
// -----------------------------------------------------------------------------
//  Drop files in /public/sounds and map them here, then call playFile('cow').
//  Missing files are ignored so nothing ever crashes.
// =============================================================================

const fileCache: Record<string, HTMLAudioElement> = {}

export function playFile(name: string, baseUrl = 'sounds/') {
  if (settings.muted) return
  try {
    let el = fileCache[name]
    if (!el) {
      el = new Audio(`${baseUrl}${name}.mp3`)
      fileCache[name] = el
    }
    el.volume = settings.calmMode ? 0.4 : 0.8
    el.currentTime = 0
    void el.play().catch(() => {})
  } catch {
    /* ignore missing files */
  }
}
