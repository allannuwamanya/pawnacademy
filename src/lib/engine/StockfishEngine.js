/**
 * StockfishEngine — plain JS class, zero React dependencies.
 * This avoids ALL stale closure issues.
 */

const WASM_PATH = '/stockfish/stockfish-18-lite-single.wasm'
const JS_PATH   = '/stockfish/stockfish-18-lite-single.js'

export class StockfishEngine {
  constructor() {
    this._worker      = null
    this._ready       = false
    this._resolveReady = null
    this._resolveMove  = null
    this._moveTimeout  = null
  }

  /** Spawn worker and wait for readyok */
  init() {
    this.destroy()

    const url = `${JS_PATH}#${encodeURIComponent(WASM_PATH)},worker`
    this._worker = new Worker(url)
    this._ready  = false

    this._worker.onmessage = (e) => this._onMessage(e.data)
    this._worker.onerror   = (e) => console.error('[Stockfish] Worker error:', e)

    this._send('uci')

    return new Promise((resolve) => {
      this._resolveReady = resolve
    })
  }

  /** Set engine strength by ELO */
  setElo(elo) {
    this._send(`setoption name UCI_LimitStrength value true`)
    this._send(`setoption name UCI_Elo value ${elo}`)
  }

  /**
   * Get best move for a position.
   * @param {string} fen
   * @param {{ depth?: number, movetime?: number, elo?: number }} opts
   * @returns {Promise<string|null>}  UCI move e.g. "e2e4"
   */
  getBestMove(fen, opts = {}) {
    return new Promise((resolve) => {
      if (!this._worker || !this._ready) {
        console.warn('[Stockfish] Engine not ready')
        resolve(null)
        return
      }

      // Cancel previous pending move
      if (this._resolveMove) {
        clearTimeout(this._moveTimeout)
        this._resolveMove(null)
        this._resolveMove = null
      }

      if (opts.elo) this.setElo(opts.elo)

      this._send('ucinewgame')
      this._send(`position fen ${fen}`)

      const parts = ['go']
      if (opts.movetime) {
        parts.push(`movetime ${opts.movetime}`)
      } else {
        parts.push(`depth ${opts.depth || 8}`)
      }
      this._send(parts.join(' '))

      this._resolveMove = resolve

      // Safety: stop after 15s and take whatever we have
      this._moveTimeout = setTimeout(() => {
        if (this._resolveMove) {
          this._send('stop')
          // bestmove will still fire after stop — let it resolve naturally
          // Hard fallback if engine is frozen
          setTimeout(() => {
            if (this._resolveMove) {
              this._resolveMove(null)
              this._resolveMove = null
            }
          }, 2000)
        }
      }, 15000)
    })
  }

  /** Kill the worker */
  destroy() {
    clearTimeout(this._moveTimeout)
    if (this._resolveMove)  { this._resolveMove(null);  this._resolveMove  = null }
    if (this._resolveReady) { this._resolveReady();     this._resolveReady = null }
    if (this._worker) {
      try { this._worker.terminate() } catch (_) {}
      this._worker = null
    }
    this._ready = false
  }

  // ── private ────────────────────────────────────────────────

  _send(cmd) {
    if (this._worker) {
      this._worker.postMessage(cmd)
    }
  }

  _onMessage(line) {
    if (typeof line !== 'string') return
    line = line.trim()

    if (line === 'uciok') {
      this._send('isready')
      return
    }

    if (line === 'readyok') {
      this._ready = true
      if (this._resolveReady) {
        this._resolveReady()
        this._resolveReady = null
      }
      return
    }

    if (line.startsWith('bestmove')) {
      clearTimeout(this._moveTimeout)
      const parts = line.split(' ')
      const move  = parts[1] && parts[1] !== '(none)' ? parts[1] : null
      if (this._resolveMove) {
        const r = this._resolveMove
        this._resolveMove = null
        r(move)
      }
    }
  }
}
