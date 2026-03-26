const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkSchema() {
  try {
    const { data: nodes } = await supabase.from('nodes').select('*').limit(1);
    console.log("Nodes Columns:", Object.keys(nodes?.[0] || {}).join(', '));

    const { data: conn } = await supabase.from('connections').select('*').limit(1);
    console.log("Connections Columns:", Object.keys(conn?.[0] || {}).join(', '));
  } catch (err) {
    console.error(err);
  }
}
checkSchema();
