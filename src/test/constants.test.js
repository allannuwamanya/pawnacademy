import { describe, it, expect } from 'vitest'
import {
  ENGINE_FLAVORS,
  SKILL_LEVELS,
  DEFAULT_SKILL,
  GAME_MODES,
} from '../lib/engine/constants'

describe('ENGINE_FLAVORS', () => {
  it('has lite-single engine', () => {
    expect(ENGINE_FLAVORS.LITE_SINGLE.key).toBe('lite-single')
    expect(ENGINE_FLAVORS.LITE_SINGLE.js).toContain('stockfish')
    expect(ENGINE_FLAVORS.LITE_SINGLE.wasm).toContain('.wasm')
  })

  it('has lite engine', () => {
    expect(ENGINE_FLAVORS.LITE.key).toBe('lite')
    expect(ENGINE_FLAVORS.LITE.multithreaded).toBe(true)
  })
})

describe('SKILL_LEVELS', () => {
  it('has 7 skill levels', () => {
    expect(SKILL_LEVELS).toHaveLength(7)
  })

  it('levels are sorted by elo', () => {
    for (let i = 1; i < SKILL_LEVELS.length; i++) {
      expect(SKILL_LEVELS[i].elo).toBeGreaterThan(SKILL_LEVELS[i - 1].elo)
    }
  })

  it('starts at Beginner (400) and ends at Grandmaster (3200)', () => {
    expect(SKILL_LEVELS[0].label).toBe('Beginner')
    expect(SKILL_LEVELS[0].elo).toBe(400)
    expect(SKILL_LEVELS[SKILL_LEVELS.length - 1].label).toBe('Grandmaster')
    expect(SKILL_LEVELS[SKILL_LEVELS.length - 1].elo).toBe(3200)
  })
})

describe('DEFAULT_SKILL', () => {
  it('is Intermediate (1200)', () => {
    expect(DEFAULT_SKILL.elo).toBe(1200)
    expect(DEFAULT_SKILL.label).toBe('Intermediate')
  })
})

describe('GAME_MODES', () => {
  it('has 4 game modes', () => {
    expect(Object.keys(GAME_MODES)).toHaveLength(4)
  })

  it('UNLIMITED has Infinity initial time', () => {
    expect(GAME_MODES.UNLIMITED.initial).toBe(Infinity)
    expect(GAME_MODES.UNLIMITED.increment).toBe(0)
  })

  it('BLITZ is 5+2', () => {
    expect(GAME_MODES.BLITZ.initial).toBe(300)
    expect(GAME_MODES.BLITZ.increment).toBe(2)
  })
})
