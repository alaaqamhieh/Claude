# 🦕 Little Dino Safari

A calm, gentle, **parent-assisted** learning game for toddlers (around age 2). Friendly
animals and friendly dinosaurs, soft sounds, big buttons, and short co-play sessions.

It runs entirely in the browser. There is **no backend, no accounts, no ads, no
analytics, no tracking, and no external API calls** — everything happens locally on
your device.

---

## What it is

Little Dino Safari is built for short (2–5 minute) sessions a grown-up and child play
*together*. The grown-up reads the prompts aloud, makes the sounds, points at the
animals, and connects the game to real-world play.

It focuses on early-development goals appropriate for under-2s:

- Recognizing animals and dinosaurs
- Hearing and imitating sounds
- Practicing simple words
- Tapping and (forgiving) dragging
- Simple concepts: big/small, up/down, roar/stomp/pop
- Parent–child talking, pointing, repeating, and moving together

### Activities

| Screen | What happens |
| --- | --- |
| **Animal Peekaboo** | Tap the hiding spot, a friendly animal appears with its name and sound. |
| **Dino Egg Hatch** | Tap an egg, a friendly dinosaur hatches and does a calm animation. |
| **Feed the Animal** | Tap or drag the food the animal likes. Gentle "try again", never "wrong". |
| **Bubble Pop** | Slow bubbles drift up; tap to pop. No score, no timer. |
| **Big & Small** | Sort one creature at a time into a big or small box. |
| **Story Time** | *The Little Dinosaur Says Hello* — a 7-page tap-along story. |
| **Parent Settings** | Behind a simple grown-up gate. All sound/motion/session options. |
| **All Done** | A calm goodbye with offline play ideas. |

The **friendly gorilla** appears in Peekaboo, Bubble Pop, Big & Small, and Story Time.
It smiles and gently taps its chest with a soft "thump thump" — never scary.

---

## How to run

```bash
npm install     # install dependencies
npm run dev     # start the dev server (open the printed local URL)
npm run build   # type-check + production build into /dist
npm run preview # preview the production build
```

Requires Node 18+.

---

## Age & co-play note

Designed for **parent-assisted co-play** for a toddler around 2 years old. It is **not**
intended as long, independent screen time. Sit together, talk, repeat the words slowly,
make the sounds, and move your bodies. After a few activities the game gently shows an
**All Done** screen and suggests playing offline. Please don't pressure your child to
keep going.

---

## Privacy

- ❌ No ads
- ❌ No accounts or logins
- ❌ No analytics
- ❌ No tracking
- ❌ No external API calls or external links in the child-facing game

The only thing stored is your settings (mute, calm mode, reduced motion, session length,
enabled features), saved in your browser's `localStorage` on this device only.

---

## Sound

All sounds are generated live with the **Web Audio API**, so the game needs **no audio
files** to work. Sounds are intentionally soft and short. Spoken words use the browser's
built-in speech synthesis (also fully offline). No sound ever plays before the first tap.

There is an always-visible mute button, plus a **Calm Sound Mode** that lowers volume,
and individual toggles for sound effects, animal sounds, dinosaur sounds, spoken words,
and optional (off by default) background music.

### Adding real audio files later

The code is structured so you can drop in real recordings without rewriting anything:

1. Put files in `public/sounds/`, e.g. `public/sounds/cow.mp3`.
2. In `src/audio.ts` there is a ready-made `playFile(name)` helper that loads and plays
   `sounds/<name>.mp3` (missing files are ignored, so nothing crashes).
3. Call `playFile('cow')` wherever you currently call `playAnimalSound('cow')` — or swap
   the body of `playAnimalSound` to call `playFile` first and fall back to the synth.

---

## Customizing the game

Almost everything is data-driven and lives in a couple of small files.

### Add more animals

Open `src/data.ts` and copy an entry in the `ANIMALS` array:

```ts
{
  id: 'frog',
  name: 'Frog',
  emoji: '🐸',
  habitat: 'pond',
  size: 'small',
  soundText: 'Ribbit!',
  preferredFood: { emoji: '🪰', label: 'bug' },
  parentPrompts: ['Can you say ribbit?', 'Can you hop like a frog?'],
}
```

To give it a sound, add a matching maker in `ANIMAL_SOUNDS` in `src/audio.ts` (or just
rely on the spoken name). New animals automatically appear in Peekaboo, Feed,
Bubble Pop, and Big & Small.

### Add more dinosaurs

Copy an entry in the `DINOSAURS` array in `src/data.ts`, and optionally add a maker in
`DINO_SOUNDS` in `src/audio.ts`. They appear in Egg Hatch, Bubble Pop, and Big & Small.

### Change colors or style

All styling is in `src/index.css`. The palette is defined as CSS variables at the top
(`:root { --bg, --accent, --pink, --blue, ... }`). Scene background gradients are the
`.scene--farm`, `.scene--jungle`, etc. classes.

### Adjust session length

In Parent Settings, choose **Short** or **Medium**. Under the hood this maps to the
number of activities before the All Done screen appears, in `SESSION_THRESHOLD` near the
top of `src/App.tsx`:

```ts
const SESSION_THRESHOLD = { short: 3, medium: 5 } as const
```

---

## Project layout

```
index.html        # app shell + emoji favicon
src/main.tsx      # React entry point
src/App.tsx       # all screens, router, shared components, the gorilla
src/data.ts       # animal & dinosaur data + types
src/audio.ts      # Web Audio engine, sound makers, speech, music, file hook
src/index.css     # all styles
```

Made to be calm, simple, private, and fun. 💚
