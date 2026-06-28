// =============================================================================
//  Little Dino Safari — Game Data
//  All animals and dinosaurs live here so they are easy to read and extend.
//  To add a new animal/dinosaur, copy an entry and fill in the fields.
// =============================================================================

export type Size = 'big' | 'small'
export type Habitat = 'farm' | 'jungle' | 'pond' | 'savanna' | 'sky' | 'dinoland'

export interface Animal {
  id: string
  name: string
  emoji: string
  habitat: Habitat
  size: Size
  soundText: string // what the animal "says", e.g. "Moo!"
  preferredFood: { emoji: string; label: string }
  parentPrompts: string[]
  /** Optional special action (used by the gorilla's chest beat). */
  action?: string
  actionSound?: string
}

export interface Dinosaur {
  id: string
  name: string
  emoji: string
  size: Size
  soundText: string
  action: string
  parentPrompts: string[]
}

// -----------------------------------------------------------------------------
//  Animals
// -----------------------------------------------------------------------------

export const ANIMALS: Animal[] = [
  {
    id: 'cow',
    name: 'Cow',
    emoji: '🐄',
    habitat: 'farm',
    size: 'big',
    soundText: 'Moo!',
    preferredFood: { emoji: '🌿', label: 'grass' },
    parentPrompts: ['Can you say moo?', 'Where is the cow?', 'Can you wave to the cow?'],
  },
  {
    id: 'dog',
    name: 'Dog',
    emoji: '🐶',
    habitat: 'farm',
    size: 'small',
    soundText: 'Woof!',
    preferredFood: { emoji: '🦴', label: 'bone' },
    parentPrompts: ['Dog says woof! Can you say woof?', 'Where is the puppy?'],
  },
  {
    id: 'cat',
    name: 'Cat',
    emoji: '🐱',
    habitat: 'farm',
    size: 'small',
    soundText: 'Meow!',
    preferredFood: { emoji: '🐟', label: 'fish' },
    parentPrompts: ['Can you say meow?', 'Soft kitty, can you pet the cat?'],
  },
  {
    id: 'duck',
    name: 'Duck',
    emoji: '🦆',
    habitat: 'pond',
    size: 'small',
    soundText: 'Quack!',
    preferredFood: { emoji: '🌾', label: 'seeds' },
    parentPrompts: ['Can you say quack?', 'Can you flap like a duck?'],
  },
  {
    id: 'lion',
    name: 'Lion',
    emoji: '🦁',
    habitat: 'savanna',
    size: 'big',
    soundText: 'Roar!',
    preferredFood: { emoji: '🍖', label: 'meat' },
    parentPrompts: ['Can you say a gentle roar?', 'Look at the big lion!'],
  },
  {
    id: 'elephant',
    name: 'Elephant',
    emoji: '🐘',
    habitat: 'savanna',
    size: 'big',
    soundText: 'Trumpet!',
    preferredFood: { emoji: '🍃', label: 'leaves' },
    parentPrompts: ['Where is the elephant?', 'The elephant is so big!'],
  },
  {
    id: 'monkey',
    name: 'Monkey',
    emoji: '🐵',
    habitat: 'jungle',
    size: 'small',
    soundText: 'Ooh ooh!',
    preferredFood: { emoji: '🍌', label: 'banana' },
    parentPrompts: ['Can you say ooh ooh?', 'What does monkey like to eat?'],
  },
  {
    id: 'sheep',
    name: 'Sheep',
    emoji: '🐑',
    habitat: 'farm',
    size: 'small',
    soundText: 'Baa!',
    preferredFood: { emoji: '🌿', label: 'grass' },
    parentPrompts: ['Can you say baa?', 'Soft fluffy sheep!'],
  },
  {
    id: 'horse',
    name: 'Horse',
    emoji: '🐴',
    habitat: 'farm',
    size: 'big',
    soundText: 'Neigh!',
    preferredFood: { emoji: '🌾', label: 'hay' },
    parentPrompts: ['Can you say neigh?', 'The horse runs fast!'],
  },
  {
    id: 'bird',
    name: 'Bird',
    emoji: '🐦',
    habitat: 'sky',
    size: 'small',
    soundText: 'Tweet!',
    preferredFood: { emoji: '🌰', label: 'seeds' },
    parentPrompts: ['Can you say tweet?', 'Can you flap like a bird?'],
  },
  {
    id: 'gorilla',
    name: 'Gorilla',
    emoji: '🦍',
    habitat: 'jungle',
    size: 'big',
    soundText: 'Hello!',
    preferredFood: { emoji: '🍓', label: 'fruit' },
    parentPrompts: [
      'Can you say gorilla?',
      'Can you gently tap your chest like the gorilla?',
      'Is the gorilla big?',
      'Can you wave to the gorilla?',
      'The gorilla says hello!',
    ],
    action: 'gentle chest beat',
    actionSound: 'soft thump thump',
  },
]

// -----------------------------------------------------------------------------
//  Dinosaurs (all friendly!)
// -----------------------------------------------------------------------------

export const DINOSAURS: Dinosaur[] = [
  {
    id: 'trex',
    name: 'T-Rex',
    emoji: '🦖',
    size: 'big',
    soundText: 'Rawr!',
    action: 'tiny friendly roar',
    parentPrompts: ['Can you say roar?', 'Tiny friendly T-Rex!'],
  },
  {
    id: 'triceratops',
    name: 'Triceratops',
    emoji: '🦕',
    size: 'big',
    soundText: 'Stomp!',
    action: 'gentle stomp',
    parentPrompts: ['Can you stomp like the dinosaur?', 'Stomp stomp!'],
  },
  {
    id: 'brontosaurus',
    name: 'Brontosaurus',
    emoji: '🦕',
    size: 'big',
    soundText: 'Hummm!',
    action: 'stretches neck and hums',
    parentPrompts: ['Can you stretch tall like Brontosaurus?', 'So tall!'],
  },
  {
    id: 'stegosaurus',
    name: 'Stegosaurus',
    emoji: '🦕',
    size: 'big',
    soundText: 'Wiggle!',
    action: 'wiggles plates with a soft chime',
    parentPrompts: ['Can you wiggle too?', 'See the pretty plates!'],
  },
  {
    id: 'baby',
    name: 'Baby Dino',
    emoji: '🐲',
    size: 'small',
    soundText: 'Chirp!',
    action: 'cute chirp-roar',
    parentPrompts: ['Is this dinosaur big or small?', 'A tiny baby dino!'],
  },
]

// Handy lookups
export const animalById = (id: string) => ANIMALS.find((a) => a.id === id)
export const dinoById = (id: string) => DINOSAURS.find((d) => d.id === id)
