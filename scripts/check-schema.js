
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
let SUPABASE_URL = '';
let SUPABASE_SERVICE_ROLE_KEY = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
        if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
            SUPABASE_URL = line.split('=')[1].replace(/"/g, '').trim();
        }
        if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
            SUPABASE_SERVICE_ROLE_KEY = line.split('=')[1].replace(/"/g, '').trim();
        }
    }
} catch (e) { console.log("Env error"); }

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
    console.log("Checking Products Table Schema...");
    
    // We can't easily DESCRIBE table via client, but we can try to insert and see error details, 
    // or select one row and see keys.
    const { data, error } = await supabase.from('products').select('*').limit(1);
    
    if (error) {
        console.log("Error selecting:", error);
    } else if (data.length > 0) {
        console.log("Columns found:", Object.keys(data[0]));
        console.log("Sample row:", data[0]);
    } else {
        console.log("Table empty, trying to infer from error on empty insert");
    }
}

checkSchema();
