
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config();
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function migrateSettings() {
  const settingsPath = path.join(__dirname, '..', 'src', 'lib', 'site-settings.json');
  
  if (!fs.existsSync(settingsPath)) {
    console.log('No site-settings.json found.');
    return;
  }

  try {
    const content = fs.readFileSync(settingsPath, 'utf8');
    const settings = JSON.parse(content);

    console.log('Read settings from JSON:', settings);

    // Ensure single row exists or update it
    const { data: existing, error: fetchError } = await supabase
      .from('site_settings')
      .select('*')
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching existing settings:', fetchError);
      return;
    }

    if (existing) {
      console.log('Updating existing settings in DB...');
      const { error: updateError } = await supabase
        .from('site_settings')
        .update(settings)
        .eq('id', existing.id);
      
      if (updateError) console.error('Error updating settings:', updateError);
      else console.log('Settings updated successfully.');
    } else {
      console.log('Inserting new settings into DB...');
      const { error: insertError } = await supabase
        .from('site_settings')
        .insert(settings);
      
      if (insertError) console.error('Error inserting settings:', insertError);
      else console.log('Settings inserted successfully.');
    }

  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrateSettings();
