-- Pawn Academy Database Schema
-- PostgreSQL schema for chess puzzle training platform

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  firebase_uid VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  avatar_url TEXT,
  password_hash TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PUZZLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS puzzles (
  id SERIAL PRIMARY KEY,
  puzzle_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., "00001", "lichess_abc123"
  fen VARCHAR(100) NOT NULL, -- Starting position
  moves TEXT NOT NULL, -- Solution moves in UCI format (e.g., "e2e4 e7e5 g1f3")
  rating INTEGER NOT NULL DEFAULT 1500, -- Puzzle difficulty rating
  rating_deviation INTEGER DEFAULT 100, -- Rating certainty
  popularity INTEGER DEFAULT 0, -- Number of times attempted
  nb_plays INTEGER DEFAULT 0, -- Total attempts
  themes TEXT[], -- Array of themes (e.g., ['fork', 'pin', 'mate-in-2'])
  game_url TEXT, -- Source game URL if available
  opening_tags TEXT[], -- Opening classification
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for efficient puzzle fetching by rating
CREATE INDEX IF NOT EXISTS idx_puzzles_rating ON puzzles(rating);
CREATE INDEX IF NOT EXISTS idx_puzzles_themes ON puzzles USING GIN(themes);
CREATE INDEX IF NOT EXISTS idx_puzzles_puzzle_id ON puzzles(puzzle_id);

-- ============================================================================
-- USER PUZZLE ATTEMPTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS puzzle_attempts (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  puzzle_id INTEGER REFERENCES puzzles(id) ON DELETE CASCADE,
  solved BOOLEAN NOT NULL, -- True if user solved it correctly
  time_spent INTEGER, -- Seconds taken to solve
  moves_made TEXT[], -- Array of moves user made
  attempt_number INTEGER DEFAULT 1, -- Which attempt (1st, 2nd, etc.)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for user progress queries
CREATE INDEX IF NOT EXISTS idx_puzzle_attempts_user ON puzzle_attempts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_puzzle_attempts_puzzle ON puzzle_attempts(puzzle_id);
CREATE INDEX IF NOT EXISTS idx_puzzle_attempts_user_puzzle ON puzzle_attempts(user_id, puzzle_id);

-- ============================================================================
-- USER PUZZLE PROGRESS (aggregated stats)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_puzzle_progress (
  id SERIAL PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  current_rating INTEGER DEFAULT 1500, -- User's puzzle rating
  rating_deviation INTEGER DEFAULT 350, -- Rating uncertainty
  total_attempts INTEGER DEFAULT 0,
  total_solved INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0, -- Consecutive days with activity
  longest_streak INTEGER DEFAULT 0,
  last_attempt_date DATE,
  puzzles_today INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_puzzle_progress_user ON user_puzzle_progress(user_id);

-- ============================================================================
-- USER GAMES (for analysis feature)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_games (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  pgn TEXT NOT NULL, -- Full game in PGN format
  white_player VARCHAR(255),
  black_player VARCHAR(255),
  result VARCHAR(10), -- "1-0", "0-1", "1/2-1/2"
  time_control VARCHAR(50),
  opening_name VARCHAR(255),
  analyzed BOOLEAN DEFAULT FALSE,
  blunders INTEGER DEFAULT 0,
  mistakes INTEGER DEFAULT 0,
  inaccuracies INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_games_user ON user_games(user_id, created_at DESC);

-- ============================================================================
-- DAILY PUZZLE (featured puzzle of the day)
-- ============================================================================
CREATE TABLE IF NOT EXISTS daily_puzzles (
  id SERIAL PRIMARY KEY,
  puzzle_id INTEGER REFERENCES puzzles(id) ON DELETE CASCADE,
  date DATE UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_daily_puzzles_date ON daily_puzzles(date DESC);

-- ============================================================================
-- FUNCTIONS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Function to update puzzle popularity
CREATE OR REPLACE FUNCTION update_puzzle_popularity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE puzzles 
  SET 
    nb_plays = nb_plays + 1,
    popularity = CASE WHEN NEW.solved THEN popularity + 1 ELSE popularity END,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.puzzle_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update puzzle stats on attempt
DROP TRIGGER IF EXISTS trigger_update_puzzle_popularity ON puzzle_attempts;
CREATE TRIGGER trigger_update_puzzle_popularity
  AFTER INSERT ON puzzle_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_puzzle_popularity();

-- Function to update user progress
CREATE OR REPLACE FUNCTION update_user_progress()
RETURNS TRIGGER AS $$
DECLARE
  today DATE := CURRENT_DATE;
BEGIN
  -- Insert or update user progress
  INSERT INTO user_puzzle_progress (
    user_id, 
    total_attempts, 
    total_solved, 
    total_failed,
    last_attempt_date,
    puzzles_today,
    current_streak
  )
  VALUES (
    NEW.user_id,
    1,
    CASE WHEN NEW.solved THEN 1 ELSE 0 END,
    CASE WHEN NOT NEW.solved THEN 1 ELSE 0 END,
    today,
    1,
    1
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_attempts = user_puzzle_progress.total_attempts + 1,
    total_solved = user_puzzle_progress.total_solved + CASE WHEN NEW.solved THEN 1 ELSE 0 END,
    total_failed = user_puzzle_progress.total_failed + CASE WHEN NOT NEW.solved THEN 1 ELSE 0 END,
    puzzles_today = CASE 
      WHEN user_puzzle_progress.last_attempt_date = today 
      THEN user_puzzle_progress.puzzles_today + 1
      ELSE 1
    END,
    current_streak = CASE
      WHEN user_puzzle_progress.last_attempt_date = today THEN user_puzzle_progress.current_streak
      WHEN user_puzzle_progress.last_attempt_date = today - INTERVAL '1 day' THEN user_puzzle_progress.current_streak + 1
      ELSE 1
    END,
    longest_streak = GREATEST(
      user_puzzle_progress.longest_streak,
      CASE
        WHEN user_puzzle_progress.last_attempt_date = today THEN user_puzzle_progress.current_streak
        WHEN user_puzzle_progress.last_attempt_date = today - INTERVAL '1 day' THEN user_puzzle_progress.current_streak + 1
        ELSE 1
      END
    ),
    last_attempt_date = today,
    updated_at = CURRENT_TIMESTAMP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user progress on puzzle attempt
DROP TRIGGER IF EXISTS trigger_update_user_progress ON puzzle_attempts;
CREATE TRIGGER trigger_update_user_progress
  AFTER INSERT ON puzzle_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_user_progress();

-- ============================================================================
-- SEED DATA - Sample Puzzles
-- ============================================================================

-- Insert some initial puzzles for testing
INSERT INTO puzzles (puzzle_id, fen, moves, rating, themes, opening_tags) VALUES
  ('00001', 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', 'f3g5 d7d5 g5f7', 1420, ARRAY['fork', 'knight-fork', 'material-gain'], ARRAY['Italian Game']),
  ('00002', 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 5', 'c4f7 e8f7 d3d4', 1380, ARRAY['sacrifice', 'discovered-attack'], ARRAY['Italian Game']),
  ('00003', 'rnbqkb1r/ppp2ppp/4pn2/3p4/2PP4/2N2N2/PP2PPPP/R1BQKB1R b KQkq - 0 4', 'd5c4 e2e4 f6e4', 1510, ARRAY['pawn-capture', 'center-control'], ARRAY['Queens Gambit Declined']),
  ('00004', 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3', 'f1c4 c6d4 c4f7', 1350, ARRAY['fork', 'mate-threat'], ARRAY['Italian Game']),
  ('00005', 'rnbqkb1r/pppp1ppp/5n2/4p3/4P3/3P1N2/PPP2PPP/RNBQKB1R b KQkq - 0 3', 'f6e4 d3e4 d8h4', 1600, ARRAY['queen-attack', 'weak-king'], ARRAY['Philidor Defense'])
ON CONFLICT (puzzle_id) DO NOTHING;

-- Set today's daily puzzle
INSERT INTO daily_puzzles (puzzle_id, date)
SELECT id, CURRENT_DATE 
FROM puzzles 
WHERE puzzle_id = '00001'
ON CONFLICT (date) DO NOTHING;
