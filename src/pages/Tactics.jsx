import { useState, useCallback, useEffect } from 'react'
import { Chess } from 'chess.js'
import { Lightbulb, SkipForward, FlipVertical, RefreshCw } from 'lucide-react'
import ChessgroundBoard from '../components/ChessgroundBoard'
import MoveList from '../components/MoveList'
import AICoach from '../components/AICoach'
import Spinner from '../components/Spinner'
import { useToast } from '../components/Toast'
import { getThemeById } from '../lib/boardthemes'
import { usePreferences } from '../lib/PreferencesContext'
import { apiFetch } from '../lib/auth'
import { NetworkError, queueOfflineRequest, isOnline } from '../lib/networkHandler'
import './Tactics.css'

export default function Tactics() {
  const { boardThemeId, pieceSetId } = usePreferences()
  const toast = useToast()
  
  // Puzzle state
  const [puzzle, setPuzzle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Game state
  const [fen, setFen] = useState(null)
  const [moveHistory, setMoveHistory] = useState([])
  const [solutionMoves, setSolutionMoves] = useState([])
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0)
  
  // UI state
  const [activeTab, setActiveTab] = useState('moves')
  const [puzzleStatus, setPuzzleStatus] = useState(null) // 'correct', 'wrong', 'completed'
  const [boardOrientation, setBoardOrientation] = useState('white')
  const [attemptStartTime, setAttemptStartTime] = useState(null)
  
  // Progress state
  const [progress, setProgress] = useState({ done: 0, total: 10 })
  const [userStats, setUserStats] = useState(null)

  const theme = getThemeById(boardThemeId)

  // Fetch a new random puzzle
  const fetchPuzzle = useCallback(async () => {
    setLoading(true)
    setError(null)
    setPuzzleStatus(null)
    
    try {
      const data = await apiFetch('/puzzles/random')
      const newPuzzle = data.puzzle
      
      setPuzzle(newPuzzle)
      setFen(newPuzzle.fen)
      setMoveHistory([])
      setCurrentMoveIndex(0)
      setAttemptStartTime(Date.now())
      
      // Determine board orientation (puzzle side to move)
      const chess = new Chess(newPuzzle.fen)
      const sideToMove = chess.turn() === 'w' ? 'white' : 'black'
      setBoardOrientation(sideToMove)
      
      // Fetch user stats for progress bar
      try {
        const statsData = await apiFetch('/progress')
        if (statsData.progress) {
          setProgress({
            done: statsData.progress.puzzles_today || 0,
            total: 10
          })
          setUserStats(statsData.progress)
        }
      } catch (statsError) {
        // Don't fail puzzle loading if stats fail
        console.warn('Failed to load user stats:', statsError)
      }
      
    } catch (err) {
      console.error('Failed to fetch puzzle:', err)
      
      if (err instanceof NetworkError) {
        setError(err.message)
        toast.error(err.message)
      } else if (!isOnline()) {
        setError('You are offline. Please check your internet connection.')
        toast.offline('You are offline. Puzzles will load when connection is restored.')
      } else if (err.message?.includes('session has expired')) {
        setError('Your session has expired. Please log in again.')
        toast.error('Session expired. Please log in again.')
      } else {
        setError('Failed to load puzzle. Please try again.')
        toast.error('Failed to load puzzle. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Load initial puzzle on mount
  useEffect(() => {
    fetchPuzzle()
  }, [fetchPuzzle])

  // Submit puzzle attempt to backend
  const submitAttempt = useCallback(async (moves, isCorrect) => {
    if (!puzzle) return
    
    const timeSpent = attemptStartTime 
      ? Math.floor((Date.now() - attemptStartTime) / 1000)
      : null
    
    try {
      const result = await apiFetch(`/puzzles/${puzzle.id}/attempt`, {
        method: 'POST',
        body: JSON.stringify({
          moves: moves,
          timeSpent: timeSpent
        })
      })
      
      if (result.progress) {
        setProgress({
          done: result.progress.puzzles_today || 0,
          total: 10
        })
        setUserStats(result.progress)
      }
      
      return result
    } catch (err) {
      console.error('Failed to submit attempt:', err)
      
      if (!isOnline()) {
        // Queue the attempt for later when online
        queueOfflineRequest(() => 
          apiFetch(`/puzzles/${puzzle.id}/attempt`, {
            method: 'POST',
            body: JSON.stringify({ moves, timeSpent })
          })
        )
        toast.info('Attempt saved. Will sync when connection is restored.')
      } else if (err instanceof NetworkError) {
        toast.warning('Failed to save attempt. Please try again.')
      } else {
        console.warn('Attempt submission failed:', err.message)
      }
      
      return null
    }
  }, [puzzle, attemptStartTime, toast])

  // Handle user moves on the board
  const handleMove = useCallback(async (from, to, newFen, move) => {
    if (!puzzle || puzzleStatus === 'completed') return
    
    const moveUci = `${from}${to}${move.promotion || ''}`
    const newMoveHistory = [...moveHistory, moveUci]
    
    setFen(newFen)
    setMoveHistory(newMoveHistory)
    
    // Get solution moves from puzzle (stored as space-separated UCI)
    const solution = puzzle.moves ? puzzle.moves.trim().split(/\s+/) : []
    setSolutionMoves(solution)
    
    const currentExpectedMove = solution[currentMoveIndex]
    
    // Check if the move matches the solution
    if (moveUci === currentExpectedMove) {
      // Correct move!
      const nextIndex = currentMoveIndex + 1
      setCurrentMoveIndex(nextIndex)
      
      if (nextIndex >= solution.length) {
        // Puzzle completed!
        setPuzzleStatus('completed')
        const submitResult = await submitAttempt(newMoveHistory, true)
        
        // Show success feedback
        if (submitResult) {
          toast.success(`Puzzle solved! Rating: ${puzzle.rating}`)
        }
        
        setTimeout(() => {
          setPuzzleStatus('correct')
        }, 500)
        
      } else {
        // More moves to go - show temporary success and play opponent's move
        setPuzzleStatus('correct')
        setTimeout(() => setPuzzleStatus(null), 800)
        
        // Play the next move (opponent's response) automatically
        setTimeout(() => {
          const opponentMove = solution[nextIndex]
          if (opponentMove) {
            const chess = new Chess(newFen)
            const from = opponentMove.substring(0, 2)
            const to = opponentMove.substring(2, 4)
            const promotion = opponentMove.length > 4 ? opponentMove[4] : undefined
            
            try {
              chess.move({ from, to, promotion })
              setFen(chess.fen())
              setMoveHistory([...newMoveHistory, opponentMove])
              setCurrentMoveIndex(nextIndex + 1)
            } catch (err) {
              console.error('Failed to play opponent move:', err)
            }
          }
        }, 900)
      }
      
    } else {
      // Wrong move!
      setPuzzleStatus('wrong')
      await submitAttempt(newMoveHistory, false)
      
      // Reset to starting position after a delay
      setTimeout(() => {
        setFen(puzzle.fen)
        setMoveHistory([])
        setCurrentMoveIndex(0)
        setPuzzleStatus(null)
        setAttemptStartTime(Date.now())
      }, 2000)
    }
  }, [puzzle, moveHistory, currentMoveIndex, puzzleStatus, submitAttempt])

  // Skip to next puzzle
  const handleSkip = useCallback(() => {
    fetchPuzzle()
  }, [fetchPuzzle])

  // Show hint (first move of solution)
  const handleHint = useCallback(() => {
    if (!puzzle || !puzzle.moves) return
    
    const solution = puzzle.moves.trim().split(/\s+/)
    const hintMove = solution[currentMoveIndex]
    
    if (hintMove) {
      // Visual hint: briefly highlight the hint square
      setPuzzleStatus('hint')
      setTimeout(() => setPuzzleStatus(null), 2000)
      
      // TODO: Could highlight squares on the board for better UX
      console.log('Hint:', hintMove)
    }
  }, [puzzle, currentMoveIndex])

  // Detect whose turn it is for the status bar
  const turn = (() => {
    if (!fen) return 'White'
    try { 
      return new Chess(fen).turn() === 'w' ? 'White' : 'Black' 
    } catch { 
      return 'White' 
    }
  })()

  // Loading state
  if (loading) {
    return (
      <div className="tactics-page tactics-loading">
        <div className="tactics-loading-content">
          <Spinner size={40} />
          <p>Loading puzzle...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="tactics-page tactics-error">
        <div className="tactics-error-content">
          <p className="tactics-error-message">{error}</p>
          <button className="btn-primary" onClick={fetchPuzzle}>
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // No puzzle loaded
  if (!puzzle || !fen) {
    return (
      <div className="tactics-page tactics-error">
        <div className="tactics-error-content">
          <p className="tactics-error-message">No puzzle available</p>
          <button className="btn-primary" onClick={fetchPuzzle}>
            <RefreshCw size={16} />
            Load Puzzle
          </button>
        </div>
      </div>
    )
  }

  // Format themes for display
  const themeDisplay = puzzle.themes && puzzle.themes.length > 0
    ? puzzle.themes[0].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : 'Tactical Puzzle'

  // Calculate difficulty stars based on rating
  const getDifficultyStars = (rating) => {
    if (rating < 1300) return '★☆☆☆☆'
    if (rating < 1500) return '★★☆☆☆'
    if (rating < 1700) return '★★★☆☆'
    if (rating < 1900) return '★★★★☆'
    return '★★★★★'
  }

  return (
    <div className="tactics-page">
      {/* Board area */}
      <div className="tactics-board-area">
        <div className={`tactics-board-wrapper ${puzzleStatus ? `flash-${puzzleStatus}` : ''}`}>
          <ChessgroundBoard
            fen={fen}
            orientation={boardOrientation}
            onMove={handleMove}
            pieceSetId={pieceSetId}
            theme={theme}
            viewOnly={puzzleStatus === 'completed'}
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
            {puzzleStatus === 'completed' && (
              <span className="tactics-feedback completed">
                🎉 Puzzle solved! 
                <button className="tactics-next-btn" onClick={handleSkip}>
                  Next Puzzle →
                </button>
              </span>
            )}
            {puzzleStatus === 'hint' && (
              <span className="tactics-feedback hint">💡 Look for the best move!</span>
            )}
            {!puzzleStatus && (
              <span className="tactics-prompt">
                <span className="prompt-dot" />
                {turn} to move — find the best move!
              </span>
            )}
          </div>
          <div className="tactics-controls">
            <button 
              className="tactics-ctrl-btn" 
              onClick={handleHint}
              disabled={puzzleStatus === 'completed'}
              title="Hint"
            >
              <Lightbulb size={16} />
              <span>Hint</span>
            </button>
            <button 
              className="tactics-ctrl-btn" 
              onClick={handleSkip}
              title="Skip puzzle"
            >
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
          <span className="tactics-progress-text">
            {progress.done}/{progress.total} puzzles today
          </span>
          {userStats && (
            <span className="tactics-streak">
              🔥 {userStats.current_streak || 0}-day streak
            </span>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="tactics-right-panel">
        <div className="tactics-puzzle-info">
          <div className="puzzle-info-row">
            <span className="puzzle-num">Puzzle #{puzzle.puzzle_id}</span>
            <span className="puzzle-rating">♞ {puzzle.rating}</span>
          </div>
          <div className="puzzle-info-row">
            <span className="puzzle-theme">Theme: {themeDisplay}</span>
            <span className="puzzle-difficulty">{getDifficultyStars(puzzle.rating)}</span>
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
            <MoveList moves={moveHistory} />
          ) : (
            <AICoach fen={fen} />
          )}
        </div>
      </div>
    </div>
  )
}
