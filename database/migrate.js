#!/usr/bin/env node
/**
 * Database migration script for Pawn Academy
 * Reads schema.sql and applies it to the Neon database
 * 
 * Usage:
 *   node database/migrate.js
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Pool, neon } from '@neondatabase/serverless';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read database URL from environment
const DATABASE_URL = process.env.NEON_DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: NEON_DATABASE_URL environment variable is not set');
  console.error('   Please set it in your .env or .dev.vars file');
  process.exit(1);
}

async function migrate() {
  console.log('🚀 Starting database migration...\n');
  
  // Use Pool for raw SQL execution
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    // Read the schema file
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    
    console.log('📖 Reading schema.sql...');
    
    // Execute the entire schema as one statement
    console.log('📝 Executing schema...\n');
    
    await pool.query(schema);
    
    console.log('✨ Migration completed successfully!');
    
    // Verify tables were created using neon for tagged templates
    console.log('\n📊 Verifying database tables...');
    const sql = neon(DATABASE_URL);
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    console.log('\nExisting tables:');
    tables.forEach(t => console.log(`  - ${t.table_name}`));
    
    // Check puzzle count
    const puzzleCount = await sql`SELECT COUNT(*) as count FROM puzzles`;
    console.log(`\n🧩 Total puzzles in database: ${puzzleCount[0].count}`);
    
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
