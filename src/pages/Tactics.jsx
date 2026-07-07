import { useState, useCallback } from 'react'
import { Chess } from 'chess.js'
import { Lightbulb, SkipForward, FlipVertical } from 'lucide-react'
import ChessgroundBoard from '../components/ChessgroundBoard'
import MoveList from '../components/MoveList'
import AICoach from '../components/AICoach'
import { getThemeById } from '../lib/boardthemes'
import { usePreferences } from '../lib/PreferencesContext'
import './Tactics.css'

const STARTING_FEN = 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4'

export default function Tactics() {
  const { boardThemeId, pieceSetId } = usePreferences()
  const [fen, setFen]                 = useState(STARTING_FEN)
  const [activeTab, setActiveTab]     = useState('moves')
  const [puzzleStatus, setPuzzleStatus] = useState(null)
  const [boardOrientation, setBoardOrientation] = useState('white')
  const [puzzleNum]  = useState(3847)
  const [puzzleRating] = useState(1620)
  const [progress]   = useState({ done: 8, total: 10 })

  const theme = getThemeById(boardThemeId)

  // Called by ChessgroundBoard after every legal move
  const handleMove = useCallback((_from, _to, newFen) => {
    setFen(newFen)

    // Simulate puzzle feedback (replace with real logic later)
    const status = Math.random() > 0.4 ? 'correct' : 'wrong'
    setPuzzleStatus(status)
    setTimeout(() => setPuzzleStatus(null), 2000)
  }, [])

  // Detect whose turn it is for the status bar
  const turn = (() => {
    try { return new Chess(fen).turn() === 'w' ? 'White' : 'Black' } catch { return 'White' }
  })()

  return (
    <div className="tactics-page">
      {/* Board area */}
      <div className="tactics-board-area">
        <div className={`tactics-board-wrapper ${puzzleStatus ? `flash-${puzzleStatus}` : ''}`}>
          <ChessgroundBoard
            fen={STARTING_FEN}
            orientation={boardOrientation}
            onMove={handleMove}
            pieceSetId={pieceSetId}
            theme={theme}
          />
        </div>

        {/* Status bar */}
        <div className="tactics-status">
          <div className="tactics-status-left">
            {puzzleStatus === 'correct' && (
              <span className="tactics-feedback correct">✓ Correct! Well done.</span>
            )}
            {puzzleStatus === 'wrong' && (
              <span className="tactics-feedback wrong">✗ Not quite — try again!</span>
            )}
            {!puzzleStatus && (
              <span className="tactics-prompt">
                <span className="prompt-dot" />
                {turn} to move — find the best move!
              </span>
            )}
          </div>
          <div className="tactics-controls">
            <button className="tactics-ctrl-btn" title="Hint">
              <Lightbulb size={16} />
              <span>Hint</span>
            </button>
            <button className="tactics-ctrl-btn" title="Skip puzzle">
              <SkipForward size={16} />
              <span>Skip</span>
            </button>
            <button
              className="tactics-ctrl-btn"
              onClick={() => setBoardOrientation(o => o === 'white' ? 'black' : 'white')}
              title="Flip board"
            >
              <FlipVertical size={16} />
              <span>Flip</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="tactics-progress">
          <div className="tactics-progress-bar">
            <div
              className="tactics-progress-fill"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </div>
          <span className="tactics-progress-text">{progress.done}/{progress.total} puzzles today</span>
          <span className="tactics-streak">🔥 7-day streak</span>
        </div>
      </div>

      {/* Right panel */}
      <div className="tactics-right-panel">
        <div className="tactics-puzzle-info">
          <div className="puzzle-info-row">
            <span className="puzzle-num">Puzzle #{puzzleNum}</span>
            <span className="puzzle-rating">♞ {puzzleRating}</span>
          </div>
          <div className="puzzle-info-row">
            <span className="puzzle-theme">Theme: Knight Fork</span>
            <span className="puzzle-difficulty">★★★☆☆</span>
          </div>
        </div>

        <div className="tactics-tabs">
          <button
            className={`tactics-tab ${activeTab === 'moves' ? 'active' : ''}`}
            onClick={() => setActiveTab('moves')}
          >
            Moves
          </button>
          <button
            className={`tactics-tab ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            ✦ AI Coach
          </button>
        </div>

        <div className="tactics-tab-content">
          {activeTab === 'moves' ? (
            <MoveList />
          ) : (
            <AICoach fen={fen} />
          )}
        </div>
      </div>
    </div>
  )
}
