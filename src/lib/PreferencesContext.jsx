import { createContext, useContext, useState } from 'react'

const PreferencesContext = createContext(null)

export function PreferencesProvider({ children }) {
  const [boardThemeId, setBoardThemeId] = useState(() => {
    return localStorage.getItem('pref_board_theme') || 'midnight'
  })

  const [pieceSetId, setPieceSetId] = useState(() => {
    return localStorage.getItem('pref_piece_set') || 'cburnett'
  })

  const updateBoardTheme = (themeId) => {
    setBoardThemeId(themeId)
    localStorage.setItem('pref_board_theme', themeId)
  }

  const updatePieceSet = (setId) => {
    setPieceSetId(setId)
    localStorage.setItem('pref_piece_set', setId)
  }

  return (
    <PreferencesContext.Provider
      value={{
        boardThemeId,
        pieceSetId,
        setBoardThemeId: updateBoardTheme,
        setPieceSetId: updatePieceSet,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  )
}

export const usePreferences = () => useContext(PreferencesContext)
