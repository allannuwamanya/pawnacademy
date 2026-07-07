import { useEffect, useRef } from 'react'
import { Chessground } from 'chessground'
import { Chess } from 'chess.js'
import 'chessground/assets/chessground.base.css'
import { injectPieceSet, injectBoardTheme } from '../lib/chessgroundStyles'

/**
 * Build the legal-moves destination map chess.js → chessground format.
 * @param {Chess} chess
 * @returns {Map<string, string[]>}
 */
function buildDests(chess) {
  const dests = new Map()
  const squares = chess.board().flat().filter(Boolean).map(p => p.square)
  for (const sq of squares) {
    const moves = chess.moves({ square: sq, verbose: true })
    if (moves.length) dests.set(sq, moves.map(m => m.to))
  }
  return dests
}

/**
 * chess.js color ('w' | 'b') → chessground color ('white' | 'black')
 */
const toColor = c => (c === 'w' ? 'white' : 'black')

/**
 * A fully-featured React wrapper around chessground.
 *
 * Props:
 *  - fen          Initial position FEN (re-mount to change)
 *  - orientation  'white' | 'black'
 *  - viewOnly     Disable all interaction
 *  - onMove(from, to, fen, move)  Called after a legal move
 *  - pieceSetId   Lichess piece-set id (e.g. 'cburnett')
 *  - theme        { light: { backgroundColor }, dark: { backgroundColor } }
 *  - style        Extra CSS for the wrapper div
 */
export default function ChessgroundBoard({
  fen,
  orientation = 'white',
  viewOnly = false,
  onMove,
  pieceSetId = 'cburnett',
  theme,
  style,
}) {
  const wrapRef  = useRef(null)
  const cgRef    = useRef(null)
  const chessRef = useRef(null)

  // ── Mount / unmount ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!wrapRef.current) return

    const chess = new Chess(fen || undefined)
    chessRef.current = chess

    cgRef.current = Chessground(wrapRef.current, {
      fen: chess.fen(),
      orientation,
      viewOnly,
      coordinates: true,
      movable: viewOnly
        ? { free: false, color: undefined }
        : {
            free: false,
            color: toColor(chess.turn()),
            dests: buildDests(chess),
            showDests: true,
          },
      draggable: { enabled: !viewOnly, showGhost: true },
      selectable: { enabled: !viewOnly },
      animation: { enabled: true, duration: 180 },
      highlight: { lastMove: true, check: true },
      premovable: { enabled: false },
      events: {
        move(orig, dest) {
          const chess = chessRef.current
          try {
            // Attempt the move (auto-promote to queen)
            const move = chess.move({ from: orig, to: dest, promotion: 'q' })
            if (!move) {
              // Illegal — reset board to current FEN
              cgRef.current.set({ fen: chess.fen() })
              return
            }

            const isGameOver = chess.isGameOver()
            const newColor   = toColor(chess.turn())

            cgRef.current.set({
              fen: chess.fen(),
              turnColor: newColor,
              movable: isGameOver
                ? { color: undefined }
                : {
                    color: newColor,
                    dests: buildDests(chess),
                  },
              check: chess.inCheck(),
            })

            onMove?.(orig, dest, chess.fen(), move)
          } catch {
            cgRef.current.set({ fen: chess.fen() })
          }
        },
      },
    })

    return () => {
      cgRef.current?.destroy()
      cgRef.current = null
    }
    // Only re-run on mount – fen/orientation changes handled separately below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── FEN change from parent ─────────────────────────────────────────────────
  useEffect(() => {
    if (!cgRef.current || !fen) return
    try {
      const chess = new Chess(fen)
      chessRef.current = chess
      cgRef.current.set({
        fen: chess.fen(),
        turnColor: toColor(chess.turn()),
        movable: viewOnly
          ? { color: undefined }
          : {
              color: toColor(chess.turn()),
              dests: buildDests(chess),
            },
      })
    } catch { /* invalid FEN */ }
  }, [fen, viewOnly])

  // ── Orientation change ─────────────────────────────────────────────────────
  useEffect(() => {
    cgRef.current?.set({ orientation })
  }, [orientation])

  // ── Piece set change ───────────────────────────────────────────────────────
  useEffect(() => {
    injectPieceSet(pieceSetId)
  }, [pieceSetId])

  // ── Board theme change ─────────────────────────────────────────────────────
  useEffect(() => {
    if (theme) injectBoardTheme(theme)
  }, [theme])

  return (
    <div
      ref={wrapRef}
      className="cg-wrap"
      style={{
        width: '100%',
        aspectRatio: '1 / 1',
        ...style,
      }}
    />
  )
}
