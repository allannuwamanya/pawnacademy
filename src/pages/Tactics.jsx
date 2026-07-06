import { useState, useMemo, useCallback } from 'react'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'
import { Lightbulb, SkipForward, FlipVertical, ChevronRight } from 'lucide-react'
import MoveList from '../components/MoveList'
import AICoach from '../components/AICoach'
import { getThemeById } from '../lib/boardthemes'
import { buildCustomPieces } from '../lib/piecesets'
import './Tactics.css'

const STARTING_FEN = 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4'

export default function Tactics() {
  const [game, setGame] = useState(new Chess(STARTING_FEN))
  const [activeTab, setActiveTab] = useState('moves') // 'moves' | 'ai'
  const [boardThemeId] = useState('midnight')
  const [pieceSetId] = useState('cburnett')
  const [puzzleStatus, setPuzzleStatus] = useState(null) // null | 'correct' | 'wrong'
  const [boardOrientation, setBoardOrientation] = useState('white')
  const [puzzleNum] = useState(3847)
  const [puzzleRating] = useState(1620)
  const [progress] = useState({ done: 8, total: 10 })

  const theme = getThemeById(boardThemeId)
  const customPieces = useMemo(() => buildCustomPieces(pieceSetId), [pieceSetId])

  const onDrop = useCallback((sourceSquare, targetSquare) => {
    const gameCopy = new Chess(game.fen())
    try {
      const result = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      })
      if (result === null) return false
      setGame(gameCopy)

      // Simulate puzzle feedback
      if (Math.random() > 0.4) {
        setPuzzleStatus('correct')
      } else {
        setPuzzleStatus('wrong')
      }
      setTimeout(() => setPuzzleStatus(null), 2000)
      return true
    } catch {
      return false
    }
  }, [game])

  return (
    <div className="tactics-page">
      {/* Board area */}
      <div className="tactics-board-area">
        <div className={`tactics-board-wrapper ${puzzleStatus ? `flash-${puzzleStatus}` : ''}`}>
          <Chessboard
            id="tactics-board"
            position={game.fen()}
            onPieceDrop={onDrop}
            boardOrientation={boardOrientation}
            boardWidth={540}
            customBoardStyle={{
              borderRadius: '10px',
              boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
            }}
            customDarkSquareStyle={theme.dark}
            customLightSquareStyle={theme.light}
            customPieces={customPieces}
            animationDuration={200}
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
                {game.turn() === 'w' ? 'White' : 'Black'} to move — find the best move!
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
            <button className="tactics-ctrl-btn" onClick={() => setBoardOrientation(o => o === 'white' ? 'black' : 'white')} title="Flip board">
              <FlipVertical size={16} />
              <span>Flip</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="tactics-progress">
          <div className="tactics-progress-bar">
            <div className="tactics-progress-fill" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
          </div>
          <span className="tactics-progress-text">{progress.done}/{progress.total} puzzles today</span>
          <span className="tactics-streak">🔥 7-day streak</span>
        </div>
      </div>

      {/* Right panel */}
      <div className="tactics-right-panel">
        {/* Puzzle info header */}
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

        {/* Tabs */}
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

        {/* Tab content */}
        <div className="tactics-tab-content">
          {activeTab === 'moves' ? (
            <MoveList />
          ) : (
            <AICoach fen={game.fen()} />
          )}
        </div>
      </div>
    </div>
  )
}
