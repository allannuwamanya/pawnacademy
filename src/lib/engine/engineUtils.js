export function parseEval(infoStr) {
  const evals = { cp: null, mate: null, wdl: null }
  const cpMatch = infoStr.match(/score cp (-?\d+)/)
  const mateMatch = infoStr.match(/score mate (-?\d+)/)
  const wdlMatch = infoStr.match(/wdl (-?\d+) (-?\d+) (-?\d+)/)
  if (cpMatch) evals.cp = parseInt(cpMatch[1])
  if (mateMatch) evals.mate = parseInt(mateMatch[1])
  if (wdlMatch) evals.wdl = [parseInt(wdlMatch[1]), parseInt(wdlMatch[2]), parseInt(wdlMatch[3])]
  return evals
}

export function parseBestMove(line) {
  const match = line.match(/^bestmove (\S+)/)
  if (!match) return null
  const result = { best: match[1] }
  const ponder = line.match(/ponder (\S+)/)
  if (ponder) result.ponder = ponder[1]
  return result
}

export function parsePV(infoStr) {
  const match = infoStr.match(/ pv (.+)$/)
  if (!match) return []
  return match[1].trim().split(/\s+/)
}

export function parseDepth(infoStr) {
  const match = infoStr.match(/ depth (\d+)/)
  return match ? parseInt(match[1]) : null
}

export function parseNodes(infoStr) {
  const match = infoStr.match(/ nodes (\d+)/)
  return match ? parseInt(match[1]) : null
}

export function parseTime(infoStr) {
  const match = infoStr.match(/ time (\d+)/)
  return match ? parseInt(match[1]) : null
}

export function parseMultiPV(infoStr) {
  const match = infoStr.match(/ multipv (\d+)/)
  return match ? parseInt(match[1]) : null
}

export function parseSearchInfo(line) {
  if (!line.startsWith('info')) return null
  if (line.includes('string')) return null
  return {
    depth: parseDepth(line),
    nodes: parseNodes(line),
    time: parseTime(line),
    multipv: parseMultiPV(line),
    eval: parseEval(line),
    pv: parsePV(line),
    raw: line,
  }
}

export function formatMoveUCI(move) {
  return `${move.from}${move.to}${move.promotion || ''}`
}

export function formatEngineTime(ms) {
  if (ms === Infinity) return 0
  return Math.max(1, Math.floor(ms))
}
