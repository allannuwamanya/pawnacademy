import { useState } from 'react'
import { Chessboard } from 'react-chessboard'
import { PIECE_SETS, getPreviewPieces, buildCustomPieces } from '../lib/piecesets'
import { BOARD_THEMES, getThemeById } from '../lib/boardthemes'
import './Settings.css'

const PREVIEW_FEN = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'

export default function Settings() {
  const [selectedPieceSet, setSelectedPieceSet] = useState('cburnett')
  const [selectedBoardTheme, setSelectedBoardTheme] = useState('midnight')
  const [searchPieces, setSearchPieces] = useState('')

  const theme = getThemeById(selectedBoardTheme)
  const customPieces = buildCustomPieces(selectedPieceSet)
  const previewPieces = getPreviewPieces(selectedPieceSet)

  const filteredSets = PIECE_SETS.filter(s =>
    s.name.toLowerCase().includes(searchPieces.toLowerCase()) ||
    s.style.toLowerCase().includes(searchPieces.toLowerCase())
  )

  return (
    <div className="settings-page">
      <div className="settings-container">
        {/* Board & Pieces */}
        <section className="settings-section">
          <div className="settings-section-header">
            <h2>Board & Pieces</h2>
            <p className="settings-section-desc">Customize your chessboard appearance</p>
          </div>

          <div className="settings-board-row">
            {/* Live Preview */}
            <div className="settings-preview">
              <div className="settings-preview-label">Live Preview</div>
              <div className="settings-preview-board">
                <Chessboard
                  id="settings-preview"
                  position={PREVIEW_FEN}
                  boardWidth={280}
                  arePiecesDraggable={false}
                  customBoardStyle={{
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  }}
                  customDarkSquareStyle={theme.dark}
                  customLightSquareStyle={theme.light}
                  customPieces={customPieces}
                />
              </div>
            </div>

            {/* Board Theme Picker */}
            <div className="settings-theme-section">
              <h3 className="settings-subsection-title">Board Theme</h3>
              <div className="board-themes-grid">
                {BOARD_THEMES.map(bt => (
                  <button
                    key={bt.id}
                    className={`board-theme-btn ${selectedBoardTheme === bt.id ? 'selected' : ''}`}
                    onClick={() => setSelectedBoardTheme(bt.id)}
                    title={bt.name}
                  >
                    <div className="board-theme-preview">
                      {Array.from({ length: 16 }, (_, i) => {
                        const row = Math.floor(i / 4)
                        const col = i % 4
                        const isDark = (row + col) % 2 === 1
                        return (
                          <div
                            key={i}
                            className="btp-sq"
                            style={isDark ? bt.dark : bt.light}
                          />
                        )
                      })}
                    </div>
                    <span className="board-theme-name">{bt.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Piece Set Picker */}
        <section className="settings-section">
          <div className="settings-section-header">
            <h2>Piece Set</h2>
            <p className="settings-section-desc">Choose from {PIECE_SETS.length} open-source piece sets</p>
          </div>

          {/* Current piece preview */}
          <div className="piece-preview-row">
            <span className="piece-preview-label">Current: <strong>{PIECE_SETS.find(s => s.id === selectedPieceSet)?.name}</strong></span>
            <div className="piece-preview-pieces">
              {previewPieces.map(p => (
                <img key={p.key} src={p.url} alt={p.key} className="piece-preview-img" width={44} height={44} />
              ))}
            </div>
          </div>

          {/* Search */}
          <input
            type="text"
            className="piece-search"
            placeholder="Search piece sets..."
            value={searchPieces}
            onChange={(e) => setSearchPieces(e.target.value)}
          />

          {/* Piece set grid */}
          <div className="piece-set-grid">
            {filteredSets.map(ps => (
              <button
                key={ps.id}
                className={`piece-set-btn ${selectedPieceSet === ps.id ? 'selected' : ''}`}
                onClick={() => setSelectedPieceSet(ps.id)}
              >
                <div className="piece-set-preview">
                  {['wK', 'wQ', 'wN'].map(key => (
                    <img
                      key={key}
                      src={`https://lichess1.org/assets/piece/${ps.id}/${key}.svg`}
                      alt={key}
                      className="psp-img"
                      loading="lazy"
                    />
                  ))}
                </div>
                <div className="piece-set-info">
                  <span className="piece-set-name">{ps.name}</span>
                  <span className="piece-set-style">{ps.style}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Account */}
        <section className="settings-section">
          <div className="settings-section-header">
            <h2>Account</h2>
            <p className="settings-section-desc">Manage your account settings</p>
          </div>
          <div className="settings-field">
            <label className="settings-label">Display Name</label>
            <input type="text" className="settings-input" placeholder="Your display name" defaultValue="Player" />
          </div>
          <div className="settings-field">
            <label className="settings-label">Email</label>
            <input type="email" className="settings-input" placeholder="you@example.com" disabled />
          </div>
          <div className="settings-actions">
            <button className="btn-primary settings-save">Save Changes</button>
          </div>
        </section>
      </div>
    </div>
  )
}
