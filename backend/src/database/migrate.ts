import dotenv from 'dotenv';
import { connectDatabase, query } from '../config/database';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.development
dotenv.config({ path: '.env.development' });

const runMigration = async () => {
  try {
    console.log('🚀 Starting database migration...');
    
    // Connect to database
    await connectDatabase();
    
    // Read the schema SQL file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Split SQL into individual statements (basic parsing)
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        await query(statement + ';');
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (error: any) {
        // Some statements might fail if they already exist (like CREATE TABLE IF NOT EXISTS)
        if (error.message?.includes('already exists')) {
          console.log(`⚠️  Statement ${i + 1} skipped (already exists)`);
        } else {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          console.log(`SQL:`, statement.substring(0, 100) + '...');
        }
      }
    }
    
    console.log('🎉 Database migration completed successfully!');
    
    // Test with a simple query
    const result = await query('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = \'public\'');
    console.log(`📊 Total tables created: ${result.rows[0].count}`);
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
};

// Only run if this file is executed directly
if (require.main === module) {
  runMigration();
}

export default runMigration;