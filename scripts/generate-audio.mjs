// =============================================================================
//  Little Dino Safari — build-time audio generator
// -----------------------------------------------------------------------------
//  Generates NATURAL audio once, at build/deploy time, and writes static files
//  into /public. The child-facing app then only ever plays these local files —
//  no network calls, no tracking at runtime.
//
//  - Voice narration (warm, Ms. Rachel–style) via a text-to-speech API.
//  - Gentle, friendly animal/dino sound effects via a sound-generation API.
//
//  Provider: ElevenLabs by default (one key covers BOTH voice + sounds; its
//  "Rachel" voice fits perfectly). OpenAI is supported for voice only.
//
//  Usage (normally run in CI):
//      TTS_API_KEY=...  node scripts/generate-audio.mjs
//  Optional env:
//      TTS_PROVIDER=elevenlabs|openai   (default elevenlabs)
//      TTS_VOICE_ID=<elevenlabs voice>  (default Rachel)
//      OPENAI_VOICE=nova|shimmer|...    (default nova, openai only)
//
//  With NO key it exits cleanly and writes nothing — the app falls back to the
//  device voice + gentle synthesized sounds, so local dev/builds still work.
// =============================================================================

import { mkdir, writeFile, access } from 'node:fs/promises'
import { constants } from 'node:fs'

const KEY = process.env.TTS_API_KEY
const PROVIDER = (process.env.TTS_PROVIDER || 'elevenlabs').toLowerCase()
const EL_VOICE = process.env.TTS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM' // ElevenLabs "Rachel"
const OPENAI_VOICE = process.env.OPENAI_VOICE || 'nova'

const VOICE_DIR = 'public/voice'
const SOUND_DIR = 'public/sounds'

// Must match slug() in src/audio.ts
const slug = (t) =>
  t.toLowerCase().replace(/['’!?.,]/g, '').trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

// ---- Phrases to narrate (the atomic words/lines the app speaks) -------------
const NAMES = ['Cow', 'Dog', 'Cat', 'Duck', 'Lion', 'Elephant', 'Monkey', 'Sheep', 'Horse', 'Bird', 'Gorilla', 'T-Rex', 'Triceratops', 'Brontosaurus', 'Stegosaurus', 'Baby Dino']
const SOUND_WORDS = ['Moo!', 'Woof!', 'Meow!', 'Quack!', 'Roar!', 'Trumpet!', 'Ooh ooh!', 'Baa!', 'Neigh!', 'Tweet!', 'Hello!', 'Rawr!', 'Stomp!', 'Hummm!', 'Wiggle!', 'Chirp!']
const EXTRA = [
  'Big!', 'Small!', 'Big gorilla!', 'Red ball', 'Bye bye!', 'Good morning!',
  'Little Dino Safari', 'All done. Great playing!', 'Great playing!', 'Yum!', 'Great job!',
  'Red', 'Blue', 'Yellow', 'Green', 'Circle', 'Star', 'Heart', 'Pop', 'Roar', 'Stomp',
]
const PHRASES = [...new Set([...NAMES, ...SOUND_WORDS, ...EXTRA])]

// ---- Gentle sound-effect prompts (ElevenLabs sound generation) -------------
const SFX = {
  cow: 'a single gentle, soft cow moo, friendly and calm, short',
  dog: 'a soft friendly small dog woof, gentle, short',
  cat: 'a soft gentle cat meow, cute, short',
  duck: 'a soft cute duck quack, gentle, short',
  lion: 'a soft gentle baby lion roar, friendly not scary, short',
  elephant: 'a soft gentle elephant trumpet, calm, short',
  monkey: 'a soft playful monkey ooh ooh call, gentle, short',
  sheep: 'a soft gentle sheep baa, calm, short',
  horse: 'a soft gentle horse neigh, calm, short',
  bird: 'a soft cute little bird chirp tweeting, gentle, short',
  gorilla: 'a soft friendly gorilla hoot with two gentle chest thumps, calm, short',
  trex: 'a tiny friendly cute dinosaur roar, soft and playful, not scary, short',
  triceratops: 'a soft gentle dinosaur stomp with a friendly grunt, short',
  brontosaurus: 'a soft gentle low friendly dinosaur hum, calm, short',
  stegosaurus: 'a soft gentle wiggle chime with a friendly dinosaur coo, short',
  baby: 'a cute tiny baby dinosaur chirp-roar, soft and adorable, short',
}

const exists = async (p) => access(p, constants.F_OK).then(() => true).catch(() => false)

async function elevenTTS(text) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${EL_VOICE}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'content-type': 'application/json' },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.3 },
    }),
  })
  if (!res.ok) throw new Error(`ElevenLabs TTS ${res.status}: ${await res.text()}`)
  return Buffer.from(await res.arrayBuffer())
}

async function elevenSFX(prompt) {
  const res = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ text: prompt, duration_seconds: 2, prompt_influence: 0.5 }),
  })
  if (!res.ok) throw new Error(`ElevenLabs SFX ${res.status}: ${await res.text()}`)
  return Buffer.from(await res.arrayBuffer())
}

async function openaiTTS(text) {
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { authorization: `Bearer ${KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o-mini-tts', voice: OPENAI_VOICE, input: text, response_format: 'mp3' }),
  })
  if (!res.ok) throw new Error(`OpenAI TTS ${res.status}: ${await res.text()}`)
  return Buffer.from(await res.arrayBuffer())
}

async function main() {
  if (!KEY) {
    console.log('[generate-audio] No TTS_API_KEY set — skipping. App will use the built-in voice + synth.')
    return
  }
  await mkdir(VOICE_DIR, { recursive: true })
  await mkdir(SOUND_DIR, { recursive: true })

  // ---- Voice narration ----
  const voiceManifest = {}
  let made = 0
  for (const text of PHRASES) {
    const s = slug(text)
    if (!s) continue
    const file = `${VOICE_DIR}/${s}.mp3`
    voiceManifest[s] = `${s}.mp3`
    if (await exists(file)) continue
    try {
      const buf = PROVIDER === 'openai' ? await openaiTTS(text) : await elevenTTS(text)
      await writeFile(file, buf)
      made++
      console.log(`[voice] ${text} -> ${s}.mp3`)
    } catch (e) {
      console.warn(`[voice] skip "${text}": ${e.message}`)
      delete voiceManifest[s]
    }
  }
  await writeFile(`${VOICE_DIR}/manifest.json`, JSON.stringify(voiceManifest, null, 0))
  console.log(`[voice] ${Object.keys(voiceManifest).length} clips ready (${made} new).`)

  // ---- Animal/dino sound effects (ElevenLabs only) ----
  const soundIds = []
  if (PROVIDER === 'elevenlabs') {
    for (const [id, prompt] of Object.entries(SFX)) {
      const file = `${SOUND_DIR}/${id}.mp3`
      if (await exists(file)) {
        soundIds.push(id)
        continue
      }
      try {
        const buf = await elevenSFX(prompt)
        await writeFile(file, buf)
        soundIds.push(id)
        console.log(`[sfx] ${id}.mp3`)
      } catch (e) {
        console.warn(`[sfx] skip "${id}": ${e.message}`)
      }
    }
  } else {
    console.log('[sfx] provider has no sound-generation — using gentle synth fallback.')
  }
  await writeFile(`${SOUND_DIR}/manifest.json`, JSON.stringify(soundIds, null, 0))
  console.log(`[sfx] ${soundIds.length} sounds ready.`)
}

main().catch((e) => {
  // Never fail the build because of audio generation.
  console.warn('[generate-audio] error (continuing without generated audio):', e.message)
})
