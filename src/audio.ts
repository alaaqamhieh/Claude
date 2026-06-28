// =============================================================================
//  Little Dino Safari — Audio Engine (warm, gentle, voice-forward)
// -----------------------------------------------------------------------------
//  Inspired by the calm "Ms. Rachel" feel: a friendly spoken voice says the
//  word AND the sound, softened by gentle marimba-style chimes and a warm
//  little room reverb. No audio files needed; nothing plays before a tap.
//
//   - Warm bus: every sound runs through a soft low-pass + short reverb, so
//     nothing is harsh or buzzy.
//   - Rounder tones: notes use a quietly detuned second layer + light vibrato.
//   - Voice: picks the most natural English voice available and speaks slowly
//     and warmly, like a friendly grown-up.
//   - To add REAL recordings later, see playFile() at the bottom.
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
let master: GainNode | null = null // bus input — every voice connects here

let activeVoices: { osc: OscillatorNode; gain: GainNode }[] = []
const lastPlayed: Record<string, number> = {}

// -----------------------------------------------------------------------------
//  Settings
// -----------------------------------------------------------------------------

export function updateAudioSettings(next: AudioSettings) {
  settings = next
  applyMasterVolume()
}

function applyMasterVolume() {
  if (!ctx || !master) return
  const base = settings.calmMode ? 0.34 : 0.62
  master.gain.setTargetAtTime(settings.muted ? 0 : base, ctx.currentTime, 0.02)
  if (musicGain) musicGain.gain.setTargetAtTime(settings.calmMode ? 0.016 : 0.028, ctx.currentTime, 0.1)
}

// -----------------------------------------------------------------------------
//  Warm bus: master -> soft low-pass -> (dry + short reverb) -> speakers
// -----------------------------------------------------------------------------

function makeImpulse(c: AudioContext, seconds = 1.1, decay = 3.2): AudioBuffer {
  const rate = c.sampleRate
  const len = Math.max(1, Math.floor(rate * seconds))
  const buf = c.createBuffer(2, len, rate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
    }
  }
  return buf
}

function ensureContext(): AudioContext | null {
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  }
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()

    master = ctx.createGain()

    // Soften everything — round off harsh highs.
    const lowpass = ctx.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = 6200
    lowpass.Q.value = 0.2

    // Gentle warm room.
    const dry = ctx.createGain()
    dry.gain.value = 0.92
    const wet = ctx.createGain()
    wet.gain.value = 0.16
    const reverb = ctx.createConvolver()
    reverb.buffer = makeImpulse(ctx)

    master.connect(lowpass)
    lowpass.connect(dry).connect(ctx.destination)
    lowpass.connect(reverb).connect(wet).connect(ctx.destination)

    applyMasterVolume()
    return ctx
  } catch {
    return null
  }
}

/** Wake audio + speech from a user gesture (called on first interaction). */
export function unlockAudio() {
  ensureContext()
  loadVoices()
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
//  Low-level voice helper (rounded: detuned layer + optional vibrato)
// -----------------------------------------------------------------------------

interface Note {
  freq: number
  at: number
  dur: number
  type?: OscillatorType
  peak?: number
  glideTo?: number
  vibrato?: boolean
}

function playNotes(notes: Note[], opts?: { melodic?: boolean }) {
  const c = ensureContext()
  if (!c || !master) return
  if (settings.muted) return
  if (opts?.melodic) stopActiveVoices()

  const t0 = c.currentTime
  for (const n of notes) {
    const start = t0 + n.at
    const end = start + n.dur
    const peak = Math.max(0.0001, n.peak ?? 0.25)
    const attack = Math.min(0.03, n.dur * 0.3)
    const release = Math.min(0.16, n.dur * 0.55)
    const type = n.type ?? 'sine'

    const gain = c.createGain()
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.linearRampToValueAtTime(peak, start + attack)
    gain.gain.setValueAtTime(peak, Math.max(start + attack, end - release))
    gain.gain.exponentialRampToValueAtTime(0.0001, end)
    gain.connect(master)

    // Two slightly detuned layers for a rounder, warmer body.
    for (const detune of [-5, 6]) {
      const osc = c.createOscillator()
      osc.type = type
      osc.detune.value = detune
      osc.frequency.setValueAtTime(n.freq, start)
      if (n.glideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, n.glideTo), end)

      if (n.vibrato) {
        const lfo = c.createOscillator()
        const lg = c.createGain()
        lfo.frequency.value = 5.5
        lg.gain.value = n.freq * 0.012
        lfo.connect(lg).connect(osc.frequency)
        lfo.start(start)
        lfo.stop(end + 0.03)
      }

      osc.connect(gain)
      osc.start(start)
      osc.stop(end + 0.04)
      if (opts?.melodic) activeVoices.push({ osc, gain })
    }
  }
}

/** A soft marimba-like note: warm fundamental + a quiet, quick harmonic. */
function marimba(freq: number, at: number, peak = 0.26) {
  playNotes([
    { freq, at, dur: 0.5, type: 'sine', peak },
    { freq: freq * 2, at, dur: 0.18, type: 'sine', peak: peak * 0.35 },
  ])
}

// =============================================================================
//  UI sounds — soft and musical
// =============================================================================

export function playTap() {
  if (!settings.sfxOn) return
  if (!debounced('tap', 40)) return
  marimba(660, 0, 0.14)
}

export function playPop() {
  if (!settings.sfxOn) return
  if (!debounced('pop', 30)) return
  playNotes([{ freq: 720, at: 0, dur: 0.14, type: 'sine', peak: 0.26, glideTo: 1180 }])
}

export function playEggCrack() {
  if (!settings.sfxOn) return
  if (!debounced('egg', 120)) return
  playNotes([
    { freq: 320, at: 0, dur: 0.05, type: 'triangle', peak: 0.2 },
    { freq: 260, at: 0.09, dur: 0.05, type: 'triangle', peak: 0.2 },
  ])
  marimba(880, 0.2, 0.2)
}

export function playPageTurn() {
  if (!settings.sfxOn) return
  if (!debounced('page', 120)) return
  playNotes([{ freq: 540, at: 0, dur: 0.2, type: 'sine', peak: 0.14, glideTo: 320 }])
}

/** A gentle welcoming chime when a creature appears. */
export function playReveal() {
  if (!settings.sfxOn) return
  if (!debounced('reveal', 150)) return
  marimba(523, 0, 0.22)
  marimba(784, 0.12, 0.2)
}

export function playSuccess() {
  if (!settings.sfxOn) return
  if (!debounced('success', 200)) return
  marimba(523, 0, 0.24)
  marimba(659, 0.13, 0.24)
  marimba(784, 0.26, 0.26)
}

export function playEat() {
  if (!settings.sfxOn) return
  if (!debounced('eat', 120)) return
  playNotes([
    { freq: 220, at: 0, dur: 0.1, type: 'triangle', peak: 0.18 },
    { freq: 180, at: 0.13, dur: 0.1, type: 'triangle', peak: 0.18 },
  ])
}

export function playGoodbye() {
  if (!settings.sfxOn) return
  if (!debounced('bye', 200)) return
  marimba(784, 0, 0.24)
  marimba(659, 0.18, 0.24)
  marimba(523, 0.36, 0.26)
}

// =============================================================================
//  Animal & dinosaur sound accents (soft, warm — the spoken voice leads)
// =============================================================================

type SoundMaker = () => void

const ANIMAL_SOUNDS: Record<string, SoundMaker> = {
  cow: () => playNotes([{ freq: 210, at: 0, dur: 0.6, type: 'sine', peak: 0.24, glideTo: 165, vibrato: true }], { melodic: true }),
  dog: () =>
    playNotes(
      [
        { freq: 260, at: 0, dur: 0.12, type: 'triangle', peak: 0.24 },
        { freq: 210, at: 0.16, dur: 0.16, type: 'triangle', peak: 0.24 },
      ],
      { melodic: true },
    ),
  cat: () => playNotes([{ freq: 420, at: 0, dur: 0.1, peak: 0.2, glideTo: 660 }, { freq: 660, at: 0.1, dur: 0.22, peak: 0.2, glideTo: 480 }], { melodic: true }),
  duck: () =>
    playNotes(
      [
        { freq: 330, at: 0, dur: 0.1, type: 'sawtooth', peak: 0.12 },
        { freq: 300, at: 0.13, dur: 0.12, type: 'sawtooth', peak: 0.12 },
      ],
      { melodic: true },
    ),
  lion: () => playNotes([{ freq: 130, at: 0, dur: 0.7, type: 'sine', peak: 0.2, glideTo: 100, vibrato: true }], { melodic: true }),
  elephant: () => playNotes([{ freq: 220, at: 0, dur: 0.5, type: 'sine', peak: 0.22, glideTo: 520 }], { melodic: true }),
  monkey: () =>
    playNotes(
      [
        { freq: 700, at: 0, dur: 0.1, peak: 0.18 },
        { freq: 920, at: 0.12, dur: 0.1, peak: 0.18 },
        { freq: 760, at: 0.24, dur: 0.1, peak: 0.18 },
      ],
      { melodic: true },
    ),
  sheep: () => playNotes([{ freq: 350, at: 0, dur: 0.4, type: 'sine', peak: 0.16, vibrato: true }], { melodic: true }),
  horse: () =>
    playNotes(
      [
        { freq: 560, at: 0, dur: 0.1, peak: 0.16 },
        { freq: 440, at: 0.1, dur: 0.1, peak: 0.16 },
        { freq: 340, at: 0.2, dur: 0.16, peak: 0.16, glideTo: 290 },
      ],
      { melodic: true },
    ),
  bird: () =>
    playNotes(
      [
        { freq: 1100, at: 0, dur: 0.07, peak: 0.14, glideTo: 1400 },
        { freq: 1300, at: 0.1, dur: 0.07, peak: 0.14, glideTo: 1600 },
      ],
      { melodic: true },
    ),
  gorilla: () => playNotes([{ freq: 150, at: 0, dur: 0.45, type: 'sine', peak: 0.2, glideTo: 120 }], { melodic: true }),
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
    { freq: 78, at: 0, dur: 0.14, type: 'sine', peak: 0.3 },
    { freq: 74, at: 0.26, dur: 0.14, type: 'sine', peak: 0.3 },
  ])
}

const DINO_SOUNDS: Record<string, SoundMaker> = {
  trex: () => playNotes([{ freq: 170, at: 0, dur: 0.45, type: 'sine', peak: 0.2, glideTo: 140, vibrato: true }], { melodic: true }),
  triceratops: () =>
    playNotes(
      [
        { freq: 95, at: 0, dur: 0.16, type: 'sine', peak: 0.28 },
        { freq: 90, at: 0.24, dur: 0.16, type: 'sine', peak: 0.28 },
      ],
      { melodic: true },
    ),
  brontosaurus: () => playNotes([{ freq: 140, at: 0, dur: 0.7, type: 'sine', peak: 0.2, glideTo: 150, vibrato: true }], { melodic: true }),
  stegosaurus: () => {
    marimba(800, 0, 0.16)
    marimba(1000, 0.12, 0.16)
    marimba(1250, 0.24, 0.16)
  },
  baby: () =>
    playNotes(
      [
        { freq: 880, at: 0, dur: 0.1, peak: 0.16, glideTo: 1080 },
        { freq: 520, at: 0.14, dur: 0.16, type: 'sine', peak: 0.16, glideTo: 470 },
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
//  Spoken words — natural, warm, slow (the heart of the experience)
// =============================================================================

let chosenVoice: SpeechSynthesisVoice | null = null

function loadVoices() {
  try {
    const synth = window.speechSynthesis
    if (!synth) return
    const voices = synth.getVoices()
    if (!voices.length) return
    // Prefer the most natural / friendly English voices first.
    const prefs: ((v: SpeechSynthesisVoice) => boolean)[] = [
      (v) => /en/i.test(v.lang) && /natural|neural/i.test(v.name),
      (v) => /(samantha|karen|moira|tessa|fiona|serena|allison|ava|nicky)/i.test(v.name),
      (v) => /(google us english|google uk english female)/i.test(v.name),
      (v) => /(zira|aria|jenny|michelle|sonia)/i.test(v.name),
      (v) => /en-US/i.test(v.lang) && /female/i.test(v.name),
      (v) => /^en[-_]/i.test(v.lang),
      () => true,
    ]
    for (const p of prefs) {
      const m = voices.find(p)
      if (m) {
        chosenVoice = m
        return
      }
    }
  } catch {
    /* ignore */
  }
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices()
  window.speechSynthesis.onvoiceschanged = loadVoices
}

/** Warm up speech inside a user gesture so the first word speaks reliably. */
export function warmUpSpeech() {
  try {
    loadVoices()
    const synth = window.speechSynthesis
    if (!synth) return
    const u = new SpeechSynthesisUtterance(' ')
    u.volume = 0
    synth.speak(u)
  } catch {
    /* ignore */
  }
}

export function speakWord(word: string, opts?: { rate?: number; pitch?: number }) {
  if (!settings.spokenWordsOn || settings.muted) return
  if (!debounced('speak:' + word, 90)) return
  try {
    const synth = window.speechSynthesis
    if (!synth) return
    synth.cancel()
    const u = new SpeechSynthesisUtterance(word)
    if (chosenVoice) u.voice = chosenVoice
    u.lang = chosenVoice?.lang || 'en-US'
    u.rate = opts?.rate ?? (settings.calmMode ? 0.72 : 0.8) // slow & clear, like a friendly grown-up
    u.pitch = opts?.pitch ?? 1.12
    u.volume = settings.calmMode ? 0.85 : 1
    synth.speak(u)
  } catch {
    /* speech unavailable — ignore */
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
//  Soft background music — slow, quiet pad. OFF by default.
// =============================================================================

let musicGain: GainNode | null = null
let musicVoices: OscillatorNode[] = []

export function startMusic() {
  const c = ensureContext()
  if (!c || !master) return
  if (musicGain) return
  musicGain = c.createGain()
  musicGain.gain.value = settings.calmMode ? 0.016 : 0.028
  musicGain.connect(master)

  const chord = [196, 261.6, 329.6]
  const lfo = c.createOscillator()
  const lfoGain = c.createGain()
  lfo.frequency.value = 0.08
  lfoGain.gain.value = 0.01
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
//  Hook point for REAL audio files (optional, added later by you)
//  Drop files in /public/sounds and call playFile('cow'); missing files are
//  ignored so nothing ever crashes.
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
