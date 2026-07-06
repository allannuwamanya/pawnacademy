import { useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import './MoveList.css'

/**
 * Move annotation symbols & colors
 */
const ANNOTATIONS = {
  best:       { symbol: '✓', className: 'ann-best',       label: 'Best' },
  good:       { symbol: '~', className: 'ann-good',       label: 'Good' },
  book:       { symbol: '📖', className: 'ann-book',      label: 'Book' },
  inaccuracy: { symbol: '⚠', className: 'ann-inaccuracy', label: 'Inaccuracy' },
  mistake:    { symbol: '❌', className: 'ann-mistake',    label: 'Mistake' },
  blunder:    { symbol: '💀', className: 'ann-blunder',    label: 'Blunder' },
}

/**
 * Sample annotated moves for demo
 */
const DEMO_MOVES = [
  { num: 1, white: 'e4',  black: 'e5',  wAnn: 'book',  bAnn: 'book' },
  { num: 2, white: 'Nf3', black: 'Nc6', wAnn: 'best',  bAnn: 'best' },
  { num: 3, white: 'Bb5', black: 'a6',  wAnn: 'best',  bAnn: 'good' },
  { num: 4, white: 'Ba4', black: 'Nf6', wAnn: 'good',  bAnn: 'best' },
  { num: 5, white: 'O-O', black: 'Be7', wAnn: 'best',  bAnn: 'best' },
  { num: 6, white: 'Re1', black: 'b5',  wAnn: 'good',  bAnn: 'inaccuracy' },
  { num: 7, white: 'Bb3', black: 'O-O', wAnn: 'best',  bAnn: 'best' },
  { num: 8, white: 'c3',  black: 'd6',  wAnn: 'good',  bAnn: 'good' },
  { num: 9, white: 'h3',  black: 'Na5', wAnn: 'inaccuracy', bAnn: 'mistake' },
  { num: 10, white: 'Bc2', black: 'c5', wAnn: 'best',  bAnn: 'good' },
  { num: 11, white: 'd4',  black: 'Qc7', wAnn: 'best', bAnn: 'blunder' },
  { num: 12, white: 'Nbd2', black: 'Nc6', wAnn: 'good', bAnn: 'good' },
]

export default function MoveList({ moves = DEMO_MOVES, selectedMoveIndex, onSelectMove }) {
  const [currentIndex, setCurrentIndex] = useState(selectedMoveIndex ?? -1)

  const totalHalfMoves = moves.length * 2
  const handleSelect = (idx) => {
    setCurrentIndex(idx)
    onSelectMove?.(idx)
  }

  return (
    <div className="movelist">
      <div className="movelist-header">
        <span className="movelist-title">Moves</span>
        <span className="movelist-count">{moves.length} moves</span>
      </div>

      <div className="movelist-scroll">
        <div className="movelist-grid">
          {moves.map((move, i) => {
            const wIdx = i * 2
            const bIdx = i * 2 + 1
            const wAnnotation = ANNOTATIONS[move.wAnn]
            const bAnnotation = ANNOTATIONS[move.bAnn]
            return (
              <div key={move.num} className="movelist-row">
                <span className="movelist-num">{move.num}.</span>
                <button
                  className={`movelist-move ${currentIndex === wIdx ? 'selected' : ''} ${wAnnotation?.className || ''}`}
                  onClick={() => handleSelect(wIdx)}
                >
                  <span className="move-text">{move.white}</span>
                  {wAnnotation && <span className="move-ann" title={wAnnotation.label}>{wAnnotation.symbol}</span>}
                </button>
                <button
                  className={`movelist-move ${currentIndex === bIdx ? 'selected' : ''} ${bAnnotation?.className || ''}`}
                  onClick={() => handleSelect(bIdx)}
                >
                  <span className="move-text">{move.black}</span>
                  {bAnnotation && <span className="move-ann" title={bAnnotation.label}>{bAnnotation.symbol}</span>}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Navigation controls */}
      <div className="movelist-controls">
        <button className="movelist-btn" onClick={() => handleSelect(-1)} title="Go to start">
          <ChevronsLeft size={16} />
        </button>
        <button className="movelist-btn" onClick={() => handleSelect(Math.max(-1, currentIndex - 1))} title="Previous move">
          <ChevronLeft size={16} />
        </button>
        <button className="movelist-btn" onClick={() => handleSelect(Math.min(totalHalfMoves - 1, currentIndex + 1))} title="Next move">
          <ChevronRight size={16} />
        </button>
        <button className="movelist-btn" onClick={() => handleSelect(totalHalfMoves - 1)} title="Go to end">
          <ChevronsRight size={16} />
        </button>
      </div>

      {/* Legend */}
      <div className="movelist-legend">
        {Object.entries(ANNOTATIONS).map(([key, ann]) => (
          <span key={key} className={`legend-item ${ann.className}`}>
            <span className="legend-symbol">{ann.symbol}</span>
            <span className="legend-label">{ann.label}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
