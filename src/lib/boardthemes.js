/**
 * Board color theme presets for react-chessboard
 * Each theme provides customDarkSquareStyle + customLightSquareStyle
 */

export const BOARD_THEMES = [
  {
    id: 'midnight',
    name: 'Midnight',
    light: { backgroundColor: '#1e1e2e' },
    dark:  { backgroundColor: '#0d0d1a' },
    default: true,
  },
  {
    id: 'gold',
    name: 'Gold',
    light: { backgroundColor: '#3a2e00' },
    dark:  { backgroundColor: '#1a1400' },
  },
  {
    id: 'classic',
    name: 'Classic',
    light: { backgroundColor: '#f0d9b5' },
    dark:  { backgroundColor: '#b58863' },
  },
  {
    id: 'slate',
    name: 'Slate',
    light: { backgroundColor: '#2d3748' },
    dark:  { backgroundColor: '#1a202c' },
  },
  {
    id: 'green',
    name: 'Green',
    light: { backgroundColor: '#eeeed2' },
    dark:  { backgroundColor: '#769656' },
  },
  {
    id: 'blue',
    name: 'Blue',
    light: { backgroundColor: '#dae6ee' },
    dark:  { backgroundColor: '#4a7fa5' },
  },
  {
    id: 'walnut',
    name: 'Walnut',
    light: { backgroundColor: '#c9a86c' },
    dark:  { backgroundColor: '#6b4020' },
  },
  {
    id: 'ice',
    name: 'Ice',
    light: { backgroundColor: '#c8d8e8' },
    dark:  { backgroundColor: '#8898a8' },
  },
  {
    id: 'coral',
    name: 'Coral',
    light: { backgroundColor: '#f0b8a0' },
    dark:  { backgroundColor: '#c0605a' },
  },
  {
    id: 'purple',
    name: 'Purple',
    light: { backgroundColor: '#c4b5fd' },
    dark:  { backgroundColor: '#7c3aed' },
  },
]

export function getThemeById(id) {
  return BOARD_THEMES.find(t => t.id === id) || BOARD_THEMES[0]
}
