# Pawn Academy Database Schema

This directory contains the database schema and migration scripts for Pawn Academy.

## Database Structure

### Core Tables

#### `puzzles`
Stores chess tactical puzzles with solutions and metadata.
- `puzzle_id`: Unique identifier for the puzzle
- `fen`: Starting position in FEN notation
- `moves`: Solution moves in UCI format (space-separated)
- `rating`: Puzzle difficulty rating (Elo-style)
- `themes`: Array of tactical themes (fork, pin, skewer, etc.)
- `opening_tags`: Opening classification

#### `puzzle_attempts`
Tracks all user attempts at puzzles.
- Links users to puzzles with attempt history
- Records if solved, time taken, and moves made
- Supports multiple attempts per puzzle per user

#### `user_puzzle_progress`
Aggregated statistics for each user.
- Current puzzle rating and rating deviation
- Total attempts, solved, and failed counts
- Daily streak tracking (current and longest)
- Automatically updated via database triggers

#### `user_games`
Stores user-uploaded games for analysis.
- Full PGN format storage
- Blunder/mistake/inaccuracy counts
- Opening classification

#### `daily_puzzles`
Maps dates to featured puzzles of the day.

### Automatic Updates

The schema includes PostgreSQL triggers that automatically:
1. **Update puzzle statistics** when users attempt them
2. **Track user progress** including streaks and daily counts
3. **Maintain data integrity** across related tables

## Running Migrations

### Initial Setup

1. Ensure your `.dev.vars` file has the database URL:
   ```
   NEON_DATABASE_URL=postgresql://...
   ```

2. Run the migration:
   ```bash
   npm run db:migrate
   ```

### What the Migration Does

- Creates all tables with proper indexes
- Sets up foreign key relationships
- Creates database functions and triggers for auto-updates
- Seeds 5 sample puzzles for testing
- Sets a daily puzzle for today

## Adding New Puzzles

Puzzles follow this format:

```sql
INSERT INTO puzzles (puzzle_id, fen, moves, rating, themes, opening_tags) 
VALUES (
  'unique-id',
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  'e2e4 e7e5 g1f3',
  1500,
  ARRAY['fork', 'discovery'],
  ARRAY['Italian Game']
);
```

### Move Format (UCI Notation)

Moves are stored as space-separated UCI strings:
- `e2e4` = pawn from e2 to e4
- `g1f3` = knight from g1 to f3
- `e1g1` = castling kingside (white)
- `e7e8q` = pawn promotion to queen

## Theme Categories

Common puzzle themes include:
- `fork` - Knight/bishop/queen fork
- `pin` - Absolute or relative pin
- `skewer` - Reverse pin
- `discovered-attack` - Moving piece reveals attack
- `sacrifice` - Material sacrifice for advantage
- `mate-in-2`, `mate-in-3` - Forced checkmate puzzles
- `endgame` - Endgame technique
- `opening` - Opening trap
- `middlegame` - Middlegame tactics

## API Usage

See `functions/api/[[route]].js` for API endpoints that interact with these tables:
- `GET /api/puzzles/random` - Fetch puzzle near user's rating
- `GET /api/puzzles/daily` - Get today's daily puzzle
- `POST /api/puzzles/:id/attempt` - Submit a puzzle solution
- `GET /api/progress` - Get user's puzzle statistics

## Future Enhancements

Potential additions to the schema:
- `opening_repertoire` - User's opening preferences
- `puzzle_collections` - Curated puzzle sets
- `achievements` - Gamification badges and milestones
- `coaching_insights` - AI-generated improvement suggestions
