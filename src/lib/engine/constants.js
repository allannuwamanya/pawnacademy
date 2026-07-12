export const ENGINE_FLAVORS = {
  LITE_SINGLE: {
    key: 'lite-single',
    js: '/stockfish/stockfish-18-lite-single.js',
    wasm: '/stockfish/stockfish-18-lite-single.wasm',
    label: 'Standard',
    multithreaded: false,
    description: 'Fast, lightweight, single-threaded (~7MB). Best for most users.',
  },
  LITE: {
    key: 'lite',
    js: '/stockfish/stockfish-18-lite.js',
    wasm: '/stockfish/stockfish-18-lite.wasm',
    label: 'Multi-Threaded',
    multithreaded: true,
    description: 'Multi-threaded lite engine. Needs COOP/COEP headers.',
  },
}

export const SKILL_LEVELS = [
  { elo: 400, label: 'Beginner', depth: 4, skill: 0 },
  { elo: 800, label: 'Casual', depth: 6, skill: 2 },
  { elo: 1200, label: 'Intermediate', depth: 8, skill: 4 },
  { elo: 1600, label: 'Advanced', depth: 11, skill: 6 },
  { elo: 2000, label: 'Expert', depth: 14, skill: 8 },
  { elo: 2500, label: 'Master', depth: 16, skill: 10 },
  { elo: 3200, label: 'Grandmaster', depth: 20, skill: 20 },
]

export const DEFAULT_SKILL = SKILL_LEVELS[2]

export const GAME_MODES = {
  BLITZ: { label: 'Blitz', initial: 300, increment: 2 },
  RAPID: { label: 'Rapid', initial: 600, increment: 5 },
  CLASSICAL: { label: 'Classical', initial: 1800, increment: 10 },
  UNLIMITED: { label: 'Unlimited', initial: Infinity, increment: 0 },
}
