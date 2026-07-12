import { describe, it, expect } from 'vitest'
import {
  parseEval,
  parseBestMove,
  parsePV,
  parseDepth,
  parseNodes,
  parseTime,
  parseMultiPV,
  parseSearchInfo,
  formatMoveUCI,
} from '../lib/engine/engineUtils'

describe('parseEval', () => {
  it('parses centipawn evaluation', () => {
    expect(parseEval('info score cp 142 depth 10')).toEqual({ cp: 142, mate: null, wdl: null })
  })

  it('parses negative centipawn', () => {
    expect(parseEval('info score cp -53 depth 8')).toEqual({ cp: -53, mate: null, wdl: null })
  })

  it('parses mate evaluation', () => {
    expect(parseEval('info score mate 3 depth 12')).toEqual({ cp: null, mate: 3, wdl: null })
  })

  it('parses negative mate', () => {
    expect(parseEval('info score mate -1 depth 22')).toEqual({ cp: null, mate: -1, wdl: null })
  })

  it('parses WDL', () => {
    expect(parseEval('info score cp 45 wdl 500 250 250 depth 10')).toEqual({
      cp: 45, mate: null, wdl: [500, 250, 250],
    })
  })

  it('returns nulls for empty string', () => {
    expect(parseEval('')).toEqual({ cp: null, mate: null, wdl: null })
  })
})

describe('parseBestMove', () => {
  it('parses bestmove with ponder', () => {
    expect(parseBestMove('bestmove e2e4 ponder e7e5')).toEqual({ best: 'e2e4', ponder: 'e7e5' })
  })

  it('parses bestmove without ponder', () => {
    expect(parseBestMove('bestmove g1f3')).toEqual({ best: 'g1f3', ponder: undefined })
  })

  it('returns null for non-bestmove line', () => {
    expect(parseBestMove('info depth 10')).toBeNull()
  })
})

describe('parsePV', () => {
  it('extracts principal variation', () => {
    expect(parsePV('info depth 10 pv e2e4 e7e5 g1f3 b8c6')).toEqual(['e2e4', 'e7e5', 'g1f3', 'b8c6'])
  })

  it('returns empty array when no PV', () => {
    expect(parsePV('info depth 10 score cp 45')).toEqual([])
  })
})

describe('parseSearchInfo', () => {
  it('parses a full info line', () => {
    const result = parseSearchInfo('info depth 12 seldepth 14 multipv 1 score cp 45 nodes 12345 nps 987654 time 500 pv e2e4 e7e5')
    expect(result).toEqual({
      depth: 12,
      nodes: 12345,
      time: 500,
      multipv: 1,
      eval: { cp: 45, mate: null, wdl: null },
      pv: ['e2e4', 'e7e5'],
      raw: expect.any(String),
    })
  })

  it('returns null for string info', () => {
    expect(parseSearchInfo('info string No suitable moves found')).toBeNull()
  })

  it('returns null for non-info lines', () => {
    expect(parseSearchInfo('bestmove e2e4')).toBeNull()
  })
})

describe('formatMoveUCI', () => {
  it('formats a simple move', () => {
    expect(formatMoveUCI({ from: 'e2', to: 'e4' })).toBe('e2e4')
  })

  it('formats a promotion move', () => {
    expect(formatMoveUCI({ from: 'e7', to: 'e8', promotion: 'q' })).toBe('e7e8q')
  })

  it('handles missing promotion', () => {
    expect(formatMoveUCI({ from: 'e7', to: 'e8' })).toBe('e7e8')
  })
})
