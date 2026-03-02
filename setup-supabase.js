import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '/Users/sam/.openclaw/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setup() {
  console.log('Initializing Supabase tables for HCC App...');

  // Create clients table
  const { error: clientsError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `
  });

  // Note: If rpc exec_sql isn't enabled, we might need a different approach or ask the user.
  // But usually, I can try direct table creation if the key is service_role.
  
  // Since I can't run arbitrary SQL via the client easily without a pre-defined RPC,
  // I will try to perform a simple check or insert to verify connection.
  
  const { data, error } = await supabase.from('clients').select('*').limit(1);
  if (error && error.code === '42P01') {
    console.log('Tables do not exist. Please run the following SQL in your Supabase SQL Editor:');
    console.log(`
      CREATE TABLE clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID REFERENCES clients(id),
        name TEXT NOT NULL,
        status TEXT DEFAULT 'Pending',
        type TEXT,
        date DATE,
        created_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id),
        amount DECIMAL(10, 2) NOT NULL,
        status TEXT DEFAULT 'Pending',
        due_date DATE,
        paid_at TIMESTAMPTZ,
        external_id TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);
  } else if (error) {
    console.error('Error connecting to Supabase:', error.message);
  } else {
    console.log('Connection successful. Tables appear to exist or were reachable.');
  }
}

setup();
