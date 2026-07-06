/**
 * All open-source piece sets from Lichess (lichess-org/lila)
 * Source: https://github.com/lichess-org/lila/tree/master/public/piece
 * License: AGPL-3.0 / CC-BY-SA (varies by set)
 *
 * CDN: https://lichess1.org/assets/piece/{setName}/{piece}.svg
 * Pieces: wK wQ wR wB wN wP bK bQ bR bB bN bP
 */

const CDN_BASE = 'https://lichess1.org/assets/piece'

const PIECE_KEYS = ['wK', 'wQ', 'wR', 'wB', 'wN', 'wP', 'bK', 'bQ', 'bR', 'bB', 'bN', 'bP']

/* Map react-chessboard piece keys to lichess filenames */
const KEY_TO_FILE = {
  wK: 'wK', wQ: 'wQ', wR: 'wR', wB: 'wB', wN: 'wN', wP: 'wP',
  bK: 'bK', bQ: 'bQ', bR: 'bR', bB: 'bB', bN: 'bN', bP: 'bP',
}

export const PIECE_SETS = [
  { id: 'cburnett',    name: 'Cburnett',    style: 'Classic',    default: true },
  { id: 'merida',      name: 'Merida',      style: 'Traditional' },
  { id: 'alpha',       name: 'Alpha',       style: 'Clean' },
  { id: 'staunty',     name: 'Staunty',     style: 'Modern' },
  { id: 'california',  name: 'California',  style: 'Bold' },
  { id: 'cardinal',    name: 'Cardinal',    style: 'Elegant' },
  { id: 'celtic',      name: 'Celtic',      style: 'Ornate' },
  { id: 'chess7',      name: 'Chess7',      style: 'Geometric' },
  { id: 'chessnut',    name: 'Chessnut',    style: 'Warm' },
  { id: 'companion',   name: 'Companion',   style: 'Friendly' },
  { id: 'cooke',       name: 'Cooke',       style: 'European' },
  { id: 'dubrovny',    name: 'Dubrovny',    style: 'Eastern' },
  { id: 'fantasy',     name: 'Fantasy',     style: 'Illustrated' },
  { id: 'fresca',      name: 'Fresca',      style: 'Fresh' },
  { id: 'gioco',       name: 'Gioco',       style: 'Italian' },
  { id: 'governor',    name: 'Governor',    style: 'Tournament' },
  { id: 'horsey',      name: 'Horsey',      style: 'Playful' },
  { id: 'icpieces',    name: 'IC Pieces',   style: 'High-contrast' },
  { id: 'kiwen-suwi',  name: 'Kiwen Suwi',  style: 'Contemporary' },
  { id: 'kosal',       name: 'Kosal',       style: 'Cultural' },
  { id: 'leipzig',     name: 'Leipzig',     style: 'Professional' },
  { id: 'letter',      name: 'Letter',      style: 'Text-only' },
  { id: 'maestro',     name: 'Maestro',     style: 'Premium' },
  { id: 'monarchy',    name: 'Monarchy',    style: 'Royal' },
  { id: 'mono',        name: 'Mono',        style: 'Monochrome' },
  { id: 'mpchess',     name: 'MP Chess',    style: 'Modern' },
  { id: 'papercut',    name: 'Papercut',    style: 'Flat' },
  { id: 'pirouetti',   name: 'Pirouetti',   style: 'Whimsical' },
  { id: 'pixel',       name: 'Pixel',       style: '8-bit' },
  { id: 'reillycraig', name: 'Reilly Craig', style: 'Contemporary' },
  { id: 'rhosgfx',     name: 'Rhos GFX',    style: 'Stylized' },
  { id: 'riohacha',    name: 'Riohacha',    style: 'Vibrant' },
  { id: 'shapes',      name: 'Shapes',      style: 'Abstract' },
  { id: 'spatial',     name: 'Spatial',     style: '3D' },
  { id: 'tatiana',     name: 'Tatiana',     style: 'Elegant' },
  { id: 'totoy',       name: 'Totoy',       style: 'Bold' },
  { id: 'anarcandy',   name: 'Anarcandy',   style: 'Candy' },
  { id: 'caliente',    name: 'Caliente',    style: 'Warm' },
  { id: 'disguised',   name: 'Disguised',   style: 'Humorous' },
  { id: 'firi',        name: 'Firi',        style: 'Light' },
  { id: 'xkcd',        name: 'XKCD',        style: 'Comic' },
  { id: 'shahi-ivory-brown', name: 'Shahi', style: 'Ivory' },
]

/**
 * Build the URL for a specific piece image
 * @param {string} setId - e.g. 'cburnett'
 * @param {string} pieceKey - e.g. 'wK'
 * @returns {string} full CDN URL
 */
export function getPieceUrl(setId, pieceKey) {
  return `${CDN_BASE}/${setId}/${KEY_TO_FILE[pieceKey]}.svg`
}

import { createElement } from 'react'

/**
 * Build a customPieces object for react-chessboard
 * @param {string} setId - piece set id
 * @returns {Object} map of piece keys to render functions
 */
export function buildCustomPieces(setId) {
  if (!setId || setId === 'cburnett') return undefined // default built-in set is similar enough

  const pieces = {}
  for (const key of PIECE_KEYS) {
    const url = getPieceUrl(setId, key)
    pieces[key] = ({ squareWidth }) => {
      return createElement(
        'div',
        {
          style: {
            width: `${squareWidth}px`,
            height: `${squareWidth}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
        },
        createElement('img', {
          src: url,
          alt: key,
          style: {
            width: `${squareWidth}px`,
            height: `${squareWidth}px`,
          },
        })
      )
    }
  }
  return pieces
}

/**
 * Get preview piece URLs for a set (show all 6 white pieces)
 * @param {string} setId
 * @returns {Array} of {key, url} objects
 */
export function getPreviewPieces(setId) {
  return ['wK', 'wQ', 'wR', 'wB', 'wN', 'wP'].map(key => ({
    key,
    url: getPieceUrl(setId, key),
  }))
}
