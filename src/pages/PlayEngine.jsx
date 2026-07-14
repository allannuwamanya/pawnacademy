import { useState, useCallback, useEffect, useRef } from 'react'
import { Chess } from 'chess.js'
import { StockfishEngine } from '../lib/engine/StockfishEngine'
import { SKILL_LEVELS, DEFAULT_SKILL, GAME_MODES } from '../lib/engine/constants'
import { playSound } from '../lib/sounds'
import ChessgroundBoard from '../components/ChessgroundBoard'
import MoveList from '../components/MoveList'
import Spinner from '../components/Spinner'
import { getThemeById } from '../lib/boardthemes'
import { usePreferences } from '../lib/PreferencesContext'
import './PlayEngine.css'

const PIECE_UNICODE = {
  w: { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙' },
  b: { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' },
}

function capturedPieces(game, color) {
  const counts = {}
  const fen = game.fen()
  const rows = fen.split(' ')[0].split('/')
  for (const row of rows) {
    for (const ch of row) {
      if (isNaN(ch)) {
        const pieceColor = ch === ch.toUpperCase() ? 'w' : 'b'
        if (pieceColor !== color) {
          const type = ch.toUpperCase()
          counts[type] = (counts[type] || 0) + 1
        }
      }
    }
  }
  const initial = { P: 8, N: 2, B: 2, R: 2, Q: 1, K: 1 }
  const result = []
  for (const type of Object.keys(initial)) {
    const remaining = counts[type] || 0
    const captured = initial[type] - remaining
    const colorKey = color === 'w' ? 'b' : 'w'
    for (let i = 0; i < captured; i++) {
      result.push(PIECE_UNICODE[colorKey][type])
    }
  }
  return result.sort((a, b) => {
    const order = ['♔', '♕', '♖', '♗', '♘', '♙', '♚', '♛', '♜', '♝', '♞', '♟']
    return order.indexOf(a) - order.indexOf(b)
  })
}

function formatTime(seconds) {
  if (seconds === Infinity || seconds === null || seconds === undefined) return '--'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function PromotionDialog({ color, onSelect, onCancel }) {
  const pieces = [
    { type: 'q', label: 'Queen', uni: PIECE_UNICODE[color].Q },
    { type: 'r', label: 'Rook', uni: PIECE_UNICODE[color].R },
    { type: 'b', label: 'Bishop', uni: PIECE_UNICODE[color].B },
    { type: 'n', label: 'Knight', uni: PIECE_UNICODE[color].N },
  ]
  return (
    <div className="promotion-overlay" onClick={onCancel}>
      <div className="promotion-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="promotion-label">Promote pawn to:</div>
        <div className="promotion-options">
          {pieces.map((p) => (
            <button key={p.type} className="promotion-btn" onClick={() => onSelect(p.type)}>
              <span className="promotion-piece">{p.uni}</span>
              <span className="promotion-name">{p.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function PlayEngine() {
  const { boardThemeId, pieceSetId } = usePreferences()
  const theme = getThemeById(boardThemeId)

  const [game, setGame] = useState(() => new Chess())
  const [orientation, setOrientation] = useState('white')
  const [playerColor, setPlayerColor] = useState('w')
  const [skillLevel, setSkillLevel] = useState(DEFAULT_SKILL)
  const [gameMode, setGameMode] = useState(GAME_MODES.UNLIMITED)
  const [gameStatus, setGameStatus] = useState('idle')
  const [moves, setMoves] = useState([])
  const [playerTime, setPlayerTime] = useState(null)
  const [engineTime, setEngineTime] = useState(null)
  const [promotion, setPromotion] = useState(null)
  const [gameResult, setGameResult] = useState(null)
  const [fen, setFen] = useState('start')
  const [lastMove, setLastMove] = useState(null)
  const clockRef          = useRef(null)
  const engineThinkingRef = useRef(false)
  const gameRef           = useRef(game)
  const engineRef         = useRef(null)  // StockfishEngine instance

  // Create engine once on mount
  useEffect(() => {
    engineRef.current = new StockfishEngine()
    return () => { engineRef.current?.destroy() }
  }, [])

  useEffect(() => {
    gameRef.current = game
  }, [game])

  const startClock = useCallback(() => {
    if (clockRef.current) clearInterval(clockRef.current)
    clockRef.current = setInterval(() => {
      setPlayerTime((t) => {
        if (t === null || t === Infinity || gameRef.current.isGameOver()) return t
        return Math.max(0, t - 1)
      })
      setEngineTime((t) => {
        if (t === null || t === Infinity || gameRef.current.isGameOver()) return t
        return Math.max(0, t - 1)
      })
    }, 1000)
  }, [])

  const stopClock = useCallback(() => {
    if (clockRef.current) {
      clearInterval(clockRef.current)
      clockRef.current = null
    }
  }, [])

  const handleGameOver = useCallback((g) => {
    stopClock()
    setGameStatus('over')
    if (g.isCheckmate()) {
      const winner = g.turn() === 'w' ? 'Black' : 'White'
      setGameResult(`Checkmate — ${winner} wins!`)
    } else if (g.isDraw()) {
      if (g.isStalemate()) setGameResult('Draw — Stalemate')
      else if (g.isThreefoldRepetition()) setGameResult('Draw — Threefold Repetition')
      else if (g.isInsufficientMaterial()) setGameResult('Draw — Insufficient Material')
      else setGameResult('Draw — 50-move Rule')
    } else {
      setGameResult('Game Over')
    }
  }, [stopClock])

  const engineMove = useCallback(async () => {
    if (engineThinkingRef.current) return
    engineThinkingRef.current = true
    setGameStatus('thinking')

    const g = gameRef.current
    if (g.isGameOver()) { engineThinkingRef.current = false; setGameStatus('playing'); return }

    const sf = engineRef.current
    if (!sf) { engineThinkingRef.current = false; setGameStatus('playing'); return }

    // Use skillLevel and gameMode from refs so we never capture stale values
    const opts = {
      elo:   skillLevelRef.current.elo,
      depth: skillLevelRef.current.depth,
    }
    if (gameModeRef.current.initial !== Infinity) {
      opts.movetime = 2000
    }

    console.log('[Engine] Asking for best move, fen:', g.fen())
    const best = await sf.getBestMove(g.fen(), opts)
    console.log('[Engine] Best move received:', best)
    engineThinkingRef.current = false

    if (!best || gameRef.current.isGameOver()) {
      setGameStatus('playing')
      return
    }

    try {
      const g2    = new Chess(gameRef.current.fen())
      const from  = best.slice(0, 2)
      const to    = best.slice(2, 4)
      const promo = best.length === 5 ? best[4] : 'q'
      const move  = g2.move({ from, to, promotion: promo })
      if (!move) throw new Error('illegal engine move: ' + best)

      gameRef.current = g2
      setGame(g2)
      setMoves(g2.history({ verbose: true }))
      setFen(g2.fen())
      const last = g2.history({ verbose: true }).at(-1)
      setLastMove(last ? { from: last.from, to: last.to } : null)
      playSound(g2.inCheck() ? 'check' : last?.captured ? 'capture' : 'move')

      if (g2.isGameOver()) { handleGameOver(g2); return }
      setGameStatus('playing')
    } catch (err) {
      console.error('[Engine] Bad move:', err)
      setGameStatus('playing')
    }
  }, [handleGameOver])

  useEffect(() => {
    if (gameStatus === 'thinking' && !engineThinkingRef.current) {
      engineMove()
    }
  }, [gameStatus, engineMove])

  // Refs to avoid stale closures in async engineMove
  const skillLevelRef = useRef(skillLevel)
  const gameModeRef   = useRef(gameMode)
  const playerColorRef = useRef(playerColor)
  useEffect(() => { skillLevelRef.current = skillLevel }, [skillLevel])
  useEffect(() => { gameModeRef.current   = gameMode   }, [gameMode])
  useEffect(() => { playerColorRef.current = playerColor }, [playerColor])

  const startGame = useCallback(async () => {
    const fresh = new Chess()
    gameRef.current = fresh
    setGame(fresh)
    setMoves([])
    setFen('start')
    setLastMove(null)
    setGameResult(null)
    setPlayerTime(gameMode.initial === Infinity ? Infinity : gameMode.initial)
    setEngineTime(gameMode.initial === Infinity ? Infinity : gameMode.initial)
    setOrientation(playerColor === 'w' ? 'white' : 'black')
    setGameStatus('playing')
    startClock()

    console.log('[Engine] Initializing Stockfish...')
    await engineRef.current.init()
    console.log('[Engine] Stockfish ready!')

    if (playerColor === 'b') {
      setGameStatus('thinking')
    }
  }, [playerColor, gameMode, startClock])

  const handlePlayerMove = useCallback((from, to) => {
    if (gameStatus !== 'playing' || game.turn() !== playerColor) return

    const g = new Chess(game.fen())
    let promotionPiece = undefined

    const isPromotion = g.get(from)?.type === 'p' && (to[1] === '8' || to[1] === '1')
    if (isPromotion) {
      setPromotion({ from, to })
      return
    }

    try {
      const move = g.move({ from, to, promotion: 'q' })
      if (!move) return
      setGame(g)
      gameRef.current = g
      setMoves(g.history({ verbose: true }))
      setFen(g.fen())
      const history = g.history({ verbose: true })
      const last = history[history.length - 1]
      setLastMove(last ? { from: last.from, to: last.to } : null)

      playSound(g.isCheck() ? 'check' : last?.captured ? 'capture' : 'move')

      if (g.isGameOver()) {
        handleGameOver(g)
        return
      }
      setGameStatus('thinking')
    } catch {
    }
  }, [game, gameStatus, playerColor, handleGameOver])

  const handlePromotion = useCallback((piece) => {
    if (!promotion) return
    const g = new Chess(game.fen())
    try {
      const move = g.move({ from: promotion.from, to: promotion.to, promotion: piece })
      if (!move) return
      setGame(g)
      gameRef.current = g
      setMoves(g.history({ verbose: true }))
      setFen(g.fen())
      const history = g.history({ verbose: true })
      const last = history[history.length - 1]
      setLastMove(last ? { from: last.from, to: last.to } : null)
      playSound('move')
      if (g.isGameOver()) {
        handleGameOver(g)
        return
      }
      setGameStatus('thinking')
    } catch {
    }
    setPromotion(null)
  }, [promotion, game, handleGameOver])

  const resign = useCallback(() => {
    stopClock()
    setGameStatus('over')
    setGameResult(`${playerColor === 'w' ? 'White' : 'Black'} resigns`)
  }, [playerColor, stopClock])

  const flipBoard = useCallback(() => {
    setOrientation((o) => (o === 'white' ? 'black' : 'white'))
  }, [])

  const newGame = useCallback(() => {
    stopClock()
    engineRef.current?.destroy()
    setGameStatus('idle')
    setGameResult(null)
  }, [stopClock])

  const undoMove = useCallback(() => {
    if (moves.length < 2) return
    const g = new Chess(game.fen())
    g.undo()
    g.undo()
    setGame(g)
    gameRef.current = g
    setMoves(g.history({ verbose: true }))
    setFen(g.fen())
  }, [moves, game])

  const statusLabel = {
    idle: 'Configure and start a game',
    playing: 'Your turn',
    thinking: 'Engine is thinking...',
    over: 'Game over',
  }

  const capturedWhite = capturedPieces(game, 'w')
  const capturedBlack = capturedPieces(game, 'b')

  return (
    <div className="play-engine">
      {promotion && (
        <PromotionDialog
          color={playerColor}
          onSelect={handlePromotion}
          onCancel={() => setPromotion(null)}
        />
      )}

      {/* Main Board Column */}
      <div className="play-engine-main">
        <div className="play-topbar">
          <div className="play-status">
            <span className={`status-dot ${gameStatus}`} />
            <span>{gameResult || statusLabel[gameStatus]}</span>
          </div>
        </div>

        <div className="play-board-container">
          <div className="captured">
            {capturedBlack.length > 0 ? capturedBlack.join('') : '\u00A0'}
          </div>

          <div className="engine-info-bar">
            <div className="player-label-wrap">
              <div className="player-avatar engine-avatar">♟</div>
              <div className="player-label-text">
                <span className="engine-label">Stockfish 18</span>
                <span className="engine-elo">ELO {skillLevel.elo} · {skillLevel.label}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {gameStatus === 'thinking' && <Spinner size={14} />}
              <span className="engine-time">{formatTime(engineTime)}</span>
            </div>
          </div>

          <div className={`board-wrapper-glass ${gameStatus === 'playing' ? 'active-turn' : ''}`}>
            <ChessgroundBoard
              fen={fen}
              orientation={orientation}
              lastMove={lastMove}
              onMove={handlePlayerMove}
              viewOnly={gameStatus !== 'playing' || game.turn() !== playerColor}
              pieceSetId={pieceSetId}
              theme={theme}
            />
          </div>

          <div className="player-info-bar">
            <div className="player-label-wrap">
              <div className="player-avatar player-avatar-you">♙</div>
              <div className="player-label-text">
                <span className="player-label">You</span>
                <span className="engine-elo" style={{ color: '#4caf50' }}>{playerColor === 'w' ? 'White' : 'Black'}</span>
              </div>
            </div>
            <span className="player-time">{formatTime(playerTime)}</span>
          </div>

          <div className="captured">
            {capturedWhite.length > 0 ? capturedWhite.join('') : '\u00A0'}
          </div>
        </div>
      </div>

      {/* Right Sidebar Column */}
      <div className="play-engine-sidebar">
        {gameStatus === 'idle' ? (
          <div className="setup-card glass-panel">
            <h2>Play vs Stockfish</h2>
            <p className="setup-subtitle">Choose your settings and start playing</p>

            <div className="setup-section">
              <label className="setup-label">Your Color</label>
              <div className="color-options">
                {['w', 'b'].map((c) => (
                  <button
                    key={c}
                    className={`color-btn ${playerColor === c ? 'active' : ''}`}
                    onClick={() => setPlayerColor(c)}
                  >
                    <span className="color-piece">{PIECE_UNICODE[c].K}</span>
                    <span>{c === 'w' ? 'White' : 'Black'}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="setup-section">
              <label className="setup-label">Engine Strength</label>
              <div className="skill-options">
                {SKILL_LEVELS.map((s) => (
                  <button
                    key={s.elo}
                    className={`skill-btn ${skillLevel.elo === s.elo ? 'active' : ''}`}
                    onClick={() => setSkillLevel(s)}
                  >
                    <span className="skill-name">{s.label}</span>
                    <span className="skill-elo">{s.elo}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="setup-section">
              <label className="setup-label">Time Control</label>
              <div className="mode-options">
                {Object.entries(GAME_MODES).map(([key, mode]) => (
                  <button
                    key={key}
                    className={`mode-btn ${gameMode.label === mode.label ? 'active' : ''}`}
                    onClick={() => setGameMode(mode)}
                  >
                    <span className="mode-name">{mode.label}</span>
                    {mode.initial !== Infinity && (
                      <span className="mode-time">
                        {mode.initial / 60}+{mode.increment}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn-primary start-btn" onClick={startGame}>
              Start Game
            </button>
          </div>
        ) : (
          <div className="active-game-sidebar glass-panel">
            <div className="sidebar-controls">
              <button className="ctrl-btn" onClick={flipBoard} title="Flip board">Flip</button>
              <button className="ctrl-btn" onClick={undoMove} disabled={moves.length < 2}>Undo</button>
              <button className="ctrl-btn danger" onClick={resign} disabled={gameStatus === 'over'}>Resign</button>
              <button className="ctrl-btn" onClick={newGame}>New Game</button>
            </div>
            <div className="move-list-container">
              <MoveList moves={moves} />
            </div>
          </div>
        )}
      </div>

      {gameResult && (
        <div className="game-result-banner" onClick={newGame}>
          <div className="result-text">{gameResult}</div>
          <div className="result-hint">Click to play again</div>
        </div>
      )}
    </div>
  )
}
