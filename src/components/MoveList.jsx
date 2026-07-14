import './MoveList.css'

/**
 * Convert UCI moves to human-readable format
 * This is a simple version - for production, use a full PGN parser
 */
function formatUciMove(move) {
  if (!move) return ''
  if (typeof move === 'string') return move
  if (move.san) return move.san
  if (move.from && move.to) return move.from + move.to
  return ''
}

export default function MoveList({ moves = [] }) {
  if (!moves || moves.length === 0) {
    return (
      <div className="movelist">
        <div className="movelist-header">
          <span className="movelist-title">Moves</span>
          <span className="movelist-count">No moves yet</span>
        </div>
        <div className="movelist-empty">
          <p>Make a move on the board to see the move history.</p>
        </div>
      </div>
    )
  }

  // Group moves into pairs (white, black)
  const movePairs = []
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      num: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1] || null
    })
  }

  return (
    <div className="movelist">
      <div className="movelist-header">
        <span className="movelist-title">Moves</span>
        <span className="movelist-count">{moves.length} move{moves.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="movelist-scroll">
        <div className="movelist-grid">
          {movePairs.map((pair) => (
            <div key={pair.num} className="movelist-row">
              <span className="movelist-num">{pair.num}.</span>
              <span className="movelist-move">
                <span className="move-text">{formatUciMove(pair.white)}</span>
              </span>
              {pair.black && (
                <span className="movelist-move">
                  <span className="move-text">{formatUciMove(pair.black)}</span>
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
