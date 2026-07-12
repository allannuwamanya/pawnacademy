import { useState, useRef, useCallback, useEffect } from 'react'
import { ENGINE_FLAVORS } from './constants'
import { parseBestMove, parseSearchInfo, formatMoveUCI } from './engineUtils'

const UCI_COMMANDS = {
  UCI: 'uci',
  IS_READY: 'isready',
  UCINEWGAME: 'ucinewgame',
  STOP: 'stop',
  QUIT: 'quit',
}

export function useEngine(flavor = ENGINE_FLAVORS.LITE_SINGLE) {
  const [status, setStatus] = useState('idle')
  const [bestMove, setBestMove] = useState(null)
  const [searchInfo, setSearchInfo] = useState(null)
  const [error, setError] = useState(null)
  const workerRef = useRef(null)
  const readyRef = useRef(false)
  const resolveRef = useRef(null)

  const sendCommand = useCallback((cmd) => {
    if (workerRef.current) {
      workerRef.current.postMessage(cmd)
    }
  }, [])

  const handleWorkerMessage = useCallback((e) => {
    const line = e.data
    if (!line || typeof line !== 'string') return

    if (line === 'readyok') {
      readyRef.current = true
      setStatus('ready')
      if (resolveRef.current) {
        resolveRef.current()
        resolveRef.current = null
      }
      return
    }

    if (line === 'uciok') {
      sendCommand(UCI_COMMANDS.IS_READY)
      return
    }

    if (line.startsWith('info')) {
      const parsed = parseSearchInfo(line)
      if (parsed) setSearchInfo(parsed)
      return
    }

    if (line.startsWith('bestmove')) {
      const parsed = parseBestMove(line)
      if (parsed) setBestMove(parsed.best)
      return
    }
  }, [sendCommand])

  const init = useCallback(() => {
    if (workerRef.current) {
      sendCommand(UCI_COMMANDS.QUIT)
      workerRef.current.terminate()
    }

    setStatus('loading')
    setBestMove(null)
    setSearchInfo(null)
    setError(null)
    readyRef.current = false

    const wasmPath = flavor.wasm
    const url = `${flavor.js}#${encodeURIComponent(wasmPath)},worker`

    try {
      const worker = new Worker(url)
      workerRef.current = worker
      worker.onmessage = handleWorkerMessage
      worker.onerror = (err) => {
        setError(err.message || 'Engine failed to load')
        setStatus('error')
      }
      sendCommand(UCI_COMMANDS.UCI)
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }, [flavor, sendCommand, handleWorkerMessage])

  const waitForReady = useCallback(() => {
    if (readyRef.current) return Promise.resolve()
    return new Promise((resolve) => {
      resolveRef.current = resolve
      sendCommand(UCI_COMMANDS.IS_READY)
    })
  }, [sendCommand])

  const setPosition = useCallback(async (fen, moves = []) => {
    await waitForReady()
    if (fen) {
      sendCommand(`position fen ${fen}${moves.length ? ` moves ${moves.join(' ')}` : ''}`)
    } else {
      sendCommand(`position startpos${moves.length ? ` moves ${moves.join(' ')}` : ''}`)
    }
  }, [sendCommand, waitForReady])

  const startSearch = useCallback(({ depth, movetime, wtime, btime, winc, binc, movestogo } = {}) => {
    const parts = ['go']
    if (depth) parts.push(`depth ${depth}`)
    if (movetime) parts.push(`movetime ${movetime}`)
    if (wtime) parts.push(`wtime ${wtime}`)
    if (btime) parts.push(`btime ${btime}`)
    if (winc) parts.push(`winc ${winc}`)
    if (binc) parts.push(`binc ${binc}`)
    if (movestogo) parts.push(`movestogo ${movestogo}`)
    if (!depth && !movetime && !wtime) parts.push('depth 8')
    sendCommand(parts.join(' '))
  }, [sendCommand])

  const stopSearch = useCallback(() => {
    sendCommand(UCI_COMMANDS.STOP)
  }, [sendCommand])

  const getBestMove = useCallback(async (fen, moves = [], options = {}) => {
    setBestMove(null)
    setSearchInfo(null)
    await setPosition(fen, moves)
    startSearch(options)
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (bestMove !== null) {
          clearInterval(checkInterval)
          resolve(bestMove)
        }
      }, 50)
      setTimeout(() => {
        clearInterval(checkInterval)
        stopSearch()
        setTimeout(() => {
          if (bestMove) resolve(bestMove)
          else resolve(null)
        }, 100)
      }, options.timeout || 10000)
    })
  }, [setPosition, startSearch, stopSearch, bestMove])

  const setOption = useCallback((name, value) => {
    sendCommand(`setoption name ${name} value ${value}`)
  }, [sendCommand])

  const setSkillLevel = useCallback((elo) => {
    sendCommand(`setoption name UCI_LimitStrength value true`)
    sendCommand(`setoption name UCI_Elo value ${elo}`)
  }, [sendCommand])

  const destroy = useCallback(() => {
    if (workerRef.current) {
      sendCommand(UCI_COMMANDS.QUIT)
      workerRef.current.terminate()
      workerRef.current = null
    }
    readyRef.current = false
    setStatus('idle')
  }, [sendCommand])

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
    }
  }, [])

  return {
    status,
    bestMove,
    searchInfo,
    error,
    init,
    sendCommand,
    setPosition,
    startSearch,
    stopSearch,
    getBestMove,
    setOption,
    setSkillLevel,
    waitForReady,
    destroy,
  }
}
