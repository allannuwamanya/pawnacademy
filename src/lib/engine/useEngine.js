import { useRef, useCallback, useEffect } from 'react'
import { ENGINE_FLAVORS } from './constants'

/**
 * A pure-ref Stockfish hook. Zero React state is used for engine communication,
 * so there are no stale closure bugs or async batching issues.
 *
 * Usage:
 *   const engine = useEngine()
 *   await engine.init()
 *   const move = await engine.getBestMove(fen, { depth: 8 })
 */
export function useEngine(flavor = ENGINE_FLAVORS.LITE_SINGLE) {
  const workerRef     = useRef(null)
  const readyRef      = useRef(false)
  const resolveReady  = useRef(null)
  const resolveMove   = useRef(null)

  // ── Send a raw UCI string to the worker ──────────────────────────────────
  const send = useCallback((cmd) => {
    if (workerRef.current) {
      workerRef.current.postMessage(cmd)
    }
  }, [])

  // ── Handle every line the worker emits ───────────────────────────────────
  const onMessage = useCallback((e) => {
    const line = typeof e.data === 'string' ? e.data.trim() : null
    if (!line) return

    if (line === 'uciok') {
      send('isready')
      return
    }

    if (line === 'readyok') {
      readyRef.current = true
      const r = resolveReady.current
      if (r) { resolveReady.current = null; r() }
      return
    }

    if (line.startsWith('bestmove')) {
      // bestmove e2e4 ponder e7e5   OR   bestmove (none)
      const parts = line.split(' ')
      const move  = parts[1] && parts[1] !== '(none)' ? parts[1] : null
      const r = resolveMove.current
      if (r) { resolveMove.current = null; r(move) }
      return
    }
  }, [send])

  // ── Initialize / restart the engine ──────────────────────────────────────
  const init = useCallback(() => {
    // Kill existing worker
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
    readyRef.current   = false
    resolveReady.current = null
    resolveMove.current  = null

    const url = `${flavor.js}#${encodeURIComponent(flavor.wasm)},worker`
    const worker = new Worker(url)
    worker.onmessage = onMessage
    worker.onerror   = (err) => console.error('[Engine] Worker error:', err)
    workerRef.current = worker

    // Kick off UCI handshake
    send('uci')

    // Return a promise that resolves once the engine says readyok
    return new Promise((resolve) => {
      resolveReady.current = resolve
    })
  }, [flavor, send, onMessage])

  // ── Wait until readyok (re-usable) ───────────────────────────────────────
  const waitReady = useCallback(() => {
    if (readyRef.current) return Promise.resolve()
    return new Promise((resolve) => {
      resolveReady.current = resolve
      send('isready')
    })
  }, [send])

  // ── Set skill level (UCI_Elo) ─────────────────────────────────────────────
  const setSkillLevel = useCallback((elo) => {
    send(`setoption name UCI_LimitStrength value true`)
    send(`setoption name UCI_Elo value ${elo}`)
  }, [send])

  // ── Get the best move for a position ─────────────────────────────────────
  /**
   * @param {string} fen     - FEN string
   * @param {object} opts    - { depth?, movetime?, elo? }
   * @returns {Promise<string|null>}  UCI move string e.g. "e2e4"
   */
  const getBestMove = useCallback(async (fen, opts = {}) => {
    await waitReady()

    // Cancel any previous pending move promise
    if (resolveMove.current) { resolveMove.current(null); resolveMove.current = null }

    // Set skill if requested
    if (opts.elo) {
      send(`setoption name UCI_LimitStrength value true`)
      send(`setoption name UCI_Elo value ${opts.elo}`)
    }

    // Tell engine the position
    send(`position fen ${fen}`)

    // Build go command
    const parts = ['go']
    if (opts.depth)    parts.push(`depth ${opts.depth}`)
    if (opts.movetime) parts.push(`movetime ${opts.movetime}`)
    // Default: depth 8 (fast, ~50ms)
    if (!opts.depth && !opts.movetime) parts.push('depth 8')
    send(parts.join(' '))

    return new Promise((resolve) => {
      resolveMove.current = resolve

      // Safety timeout: stop and collect whatever we have
      const ms = opts.movetime ? opts.movetime + 2000 : 15000
      setTimeout(() => {
        if (resolveMove.current) {
          send('stop')
          // bestmove will fire after stop; resolver will catch it.
          // Add an extra hard-kill just in case engine is totally stuck.
          setTimeout(() => {
            if (resolveMove.current) {
              resolveMove.current(null)
              resolveMove.current = null
            }
          }, 1000)
        }
      }, ms)
    })
  }, [send, waitReady])

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
    }
  }, [])

  return { init, getBestMove, setSkillLevel, send }
}
