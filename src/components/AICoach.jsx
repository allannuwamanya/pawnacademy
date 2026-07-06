import { useState, useRef, useEffect } from 'react'
import {
  Sparkles,
  Send,
  AlertTriangle,
  BookOpen,
  Swords,
  Brain,
  TrendingUp,
  GitBranch,
} from 'lucide-react'
import './AICoach.css'

const QUICK_ACTIONS = [
  { id: 'why',       icon: '♟',          label: 'Why this move?',         prompt: 'Explain why the last move was played and what it accomplishes.' },
  { id: 'blunder',   Icon: AlertTriangle, label: 'Explain my blunder',     prompt: 'Explain why my last move was a blunder and what I should have played instead.' },
  { id: 'plan',      Icon: BookOpen,      label: "What's the plan here?",  prompt: "What's the strategic plan for the side to move in this position?" },
  { id: 'next',      Icon: Swords,        label: 'What should I play?',    prompt: 'Suggest 2-3 candidate moves in this position and explain the idea behind each.' },
  { id: 'concept',   Icon: Brain,         label: 'What concept is this?',  prompt: 'What chess concept, theme, or tactical motif is present in this position?' },
  { id: 'improve',   Icon: TrendingUp,    label: 'How can I improve?',     prompt: 'Based on the moves so far, what areas should I focus on to improve my play?' },
  { id: 'opening',   Icon: GitBranch,     label: 'Opening name?',          prompt: 'What opening is being played? Give the ECO code, name, and main ideas.' },
  { id: 'endgame',   icon: '♚',          label: 'Is this endgame won?',   prompt: 'Evaluate this endgame position. Is it winning, drawing, or losing? Explain the key technique.' },
]

const DEMO_RESPONSES = [
  {
    role: 'assistant',
    content: "Welcome to Pawn Academy! 👋 I'm your AI chess coach. I can help you understand positions, explain moves, and teach you chess concepts.\n\nTry clicking one of the quick action buttons above, or ask me anything about the position on the board!",
  },
]

export default function AICoach({ fen, pgn, lastMove }) {
  const [messages, setMessages] = useState(DEMO_RESPONSES)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  const sendMessage = (text) => {
    if (!text.trim()) return
    const userMsg = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Simulate AI response (UI only — no backend)
    setTimeout(() => {
      const aiResponse = generateMockResponse(text)
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }])
      setIsTyping(false)
    }, 1200 + Math.random() * 800)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleQuickAction = (action) => {
    sendMessage(action.prompt)
  }

  return (
    <div className="aicoach">
      {/* Header */}
      <div className="aicoach-header">
        <Sparkles size={16} className="aicoach-sparkle" />
        <span className="aicoach-title">AI Coach</span>
        <span className="aicoach-badge">Beta</span>
      </div>

      {/* Quick Actions */}
      <div className="aicoach-actions">
        {QUICK_ACTIONS.map(action => (
          <button
            key={action.id}
            className="aicoach-action-btn"
            onClick={() => handleQuickAction(action)}
            disabled={isTyping}
          >
            {action.icon ? (
              <span className="action-chess-icon">{action.icon}</span>
            ) : (
              <action.Icon size={14} />
            )}
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="aicoach-messages" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`aicoach-msg ${msg.role}`}>
            <div className="msg-avatar">
              {msg.role === 'user' ? '🧑' : <Sparkles size={14} />}
            </div>
            <div className="msg-content">
              <div className="msg-role">{msg.role === 'user' ? 'You' : 'Coach'}</div>
              <div className="msg-text">{msg.content}</div>
              {msg.role === 'assistant' && msg.showOnBoard && (
                <button className="msg-show-board">Show on board →</button>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="aicoach-msg assistant">
            <div className="msg-avatar"><Sparkles size={14} /></div>
            <div className="msg-content">
              <div className="msg-role">Coach</div>
              <div className="msg-typing">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form className="aicoach-input-area" onSubmit={handleSubmit}>
        <input
          type="text"
          className="aicoach-input"
          placeholder="Ask Coach..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isTyping}
        />
        <button type="submit" className="aicoach-send" disabled={!input.trim() || isTyping}>
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}

/**
 * Generate mock AI responses for demo purposes
 */
function generateMockResponse(query) {
  const q = query.toLowerCase()

  if (q.includes('why') && q.includes('move')) {
    return "That's a great question! The last move develops a piece to an active square while maintaining control of the center. In this position, piece activity is more important than material — the key idea is to create pressure on the opponent's king-side while keeping the pawn structure flexible.\n\nThis is a common theme in the Ruy Lopez: White doesn't rush to win material but instead builds a long-term positional advantage."
  }

  if (q.includes('blunder')) {
    return "Your move was a blunder because it leaves the knight unprotected on a5, where it's out of play and can be trapped. The better move was **...Nc6-d4**, centralizing the knight and putting pressure on White's position.\n\n**Key lesson:** Knights on the rim are dim! Always look for central squares for your knights."
  }

  if (q.includes('plan') || q.includes('strategic')) {
    return "In this position, the strategic plan involves:\n\n1. **Controlling the center** — Keep pawns on e4 and d4 to restrict Black's pieces\n2. **King-side attack** — Maneuver knights to f5 or g5 to pressure f7\n3. **Pawn expansion** — Consider f4-f5 to open lines against the king\n\nThe key principle here is **space advantage** — when you control more squares, your pieces have more mobility."
  }

  if (q.includes('candidate') || q.includes('should i play') || q.includes('what should')) {
    return "Here are the top 3 candidate moves:\n\n1. **Nd5** — Centralizes the knight on the strongest possible square. Threatens Nxf6+ and Nc7.\n2. **f4** — Starts a king-side pawn storm. Gains space and opens the f-file.\n3. **Bg5** — Pins the knight to the queen. Creates tactical pressure.\n\nI'd recommend **Nd5** — it follows the principle of \"knights before bishops\" in the attack."
  }

  if (q.includes('concept') || q.includes('theme') || q.includes('motif')) {
    return "This position demonstrates the **closed center** concept. When the center is locked, play shifts to the flanks. The key concepts at work:\n\n• **Pawn chains** — The d4-e5 chain determines where each side attacks\n• **Minority attack** — Black should push b5-b4 on the queen-side\n• **Knight outposts** — f5 and d5 are ideal outpost squares\n\n📖 Study Nimzowitsch's \"My System\" Chapter 4 for a deep dive on pawn chains."
  }

  if (q.includes('improve') || q.includes('focus')) {
    return "Based on the moves so far, here are your key improvement areas:\n\n📊 **Tactical awareness** — You missed a fork opportunity on move 9. Practice 10 puzzles daily.\n📊 **Piece activity** — Your knight on a5 spent 3 moves going to a bad square. Ask \"Is this piece doing anything useful?\"\n📊 **Time management** — You played the first 6 moves quickly but slowed down too much later.\n\n**Recommended training:** Focus on knight maneuvers and tactical patterns involving forks and pins."
  }

  if (q.includes('opening')) {
    return "This is the **Ruy Lopez** (Spanish Game)\n\n**ECO Code:** C65-C99\n**Moves:** 1.e4 e5 2.Nf3 Nc6 3.Bb5\n\n**Key ideas:**\n• White pressures e5 indirectly through the pin on Nc6\n• The bishop retreat Ba4-Bb3 aims at f7\n• Black should aim for ...d5 break when ready\n\nThis is one of the oldest and most respected openings in chess, favored by World Champions from Lasker to Caruana."
  }

  if (q.includes('endgame') || q.includes('won') || q.includes('drawn')) {
    return "This endgame is **theoretically drawn** with best play, but it's very tricky to hold for Black.\n\n**Key technique:** The defending side must keep the king in front of the pawn and maintain the opposition. Remember the **Lucena** and **Philidor** positions — they're the foundation of all rook endgames.\n\n**Practical tip:** In a rapid game, the side with the pawn wins ~65% of the time due to defensive errors. So don't give up if you're attacking!"
  }

  return "That's an interesting question! Let me break down the position:\n\nThe current position has roughly equal chances. White has a slight space advantage, but Black's pieces are actively placed. The key battle is over the d5 square — whoever controls it will have the better position.\n\n**My recommendation:** Focus on piece coordination over material gain. Chess is about harmony, not just counting points. 🎵♟"
}
