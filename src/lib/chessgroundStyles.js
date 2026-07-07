/**
 * Inject dynamic CSS for chessground board themes and piece sets.
 * Uses lichess CDN for piece SVGs.
 */

const CDN = 'https://lichess1.org/assets/piece'

// Maps chessground role names to lichess file keys
const ROLES = [
  ['pawn',   'wP', 'bP'],
  ['knight', 'wN', 'bN'],
  ['bishop', 'wB', 'bB'],
  ['rook',   'wR', 'bR'],
  ['queen',  'wQ', 'bQ'],
  ['king',   'wK', 'bK'],
]

/**
 * Inject CSS rules so chessground renders pieces from a lichess CDN piece set.
 * @param {string} setId - e.g. 'cburnett', 'merida', 'alpha'
 */
export function injectPieceSet(setId) {
  let el = document.getElementById('cg-piece-set')
  if (!el) {
    el = document.createElement('style')
    el.id = 'cg-piece-set'
    document.head.appendChild(el)
  }

  const rules = ROLES.flatMap(([role, whiteKey, blackKey]) => [
    `.cg-wrap piece.${role}.white { background-image: url('${CDN}/${setId}/${whiteKey}.svg') !important; }`,
    `.cg-wrap piece.${role}.black { background-image: url('${CDN}/${setId}/${blackKey}.svg') !important; }`,
  ])

  el.textContent = rules.join('\n')
}

/**
 * Generate an inline SVG checkerboard pattern as a data-URI
 * with the given dark color, to use as cg-board background-image.
 */
function buildBoardSvg(darkColor) {
  // 8x8 grid where dark squares (where (row+col) is odd) are filled
  let rects = ''
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        rects += `<rect x="${col}" y="${row}" width="1" height="1" fill="${darkColor}"/>`
      }
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" shape-rendering="crispEdges">${rects}</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

/**
 * Inject CSS rules to color chessground squares with the chosen board theme.
 * @param {{ light: { backgroundColor: string }, dark: { backgroundColor: string } }} theme
 */
export function injectBoardTheme(theme) {
  let el = document.getElementById('cg-board-theme')
  if (!el) {
    el = document.createElement('style')
    el.id = 'cg-board-theme'
    document.head.appendChild(el)
  }

  const lightColor = theme.light.backgroundColor
  const darkColor  = theme.dark.backgroundColor
  const pattern    = buildBoardSvg(darkColor)

  // Also update move-dest, last-move, selected highlight colors to look nice
  el.textContent = `
    cg-board {
      background-color: ${lightColor} !important;
      background-image: ${pattern} !important;
      background-size: cover !important;
    }
    cg-board square.move-dest {
      background: radial-gradient(rgba(0,0,0,0.35) 22%, rgba(0,0,0,0) 23%) !important;
    }
    cg-board square.oc.move-dest {
      background: radial-gradient(transparent 0%, transparent 80%, rgba(0,0,0,0.25) 80%) !important;
    }
    cg-board square.last-move {
      background-color: rgba(255, 210, 0, 0.35) !important;
    }
    cg-board square.selected {
      background-color: rgba(255, 210, 0, 0.45) !important;
    }
    cg-board square.check {
      background: radial-gradient(ellipse at center, rgba(255,0,0,1) 0%, rgba(231,0,0,1) 25%, rgba(169,0,0,0) 89%, rgba(158,0,0,0) 100%) !important;
    }
  `
}
