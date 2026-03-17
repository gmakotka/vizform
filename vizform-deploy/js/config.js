// VizForm Supabase Configuration
// Replace these values with your Supabase project credentials

const SUPABASE_URL = 'https://krqofgpakenxvyttbloq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtycW9mZ3Bha2VueHZ5dHRibG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2ODg4MjAsImV4cCI6MjA4OTI2NDgyMH0.uZVBd5eTwP0ogSIjElCPk0gjFMZgAR6uf2CYpG95ZaY';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Toast notifications
function showToast(msg, type = 'success') {
  let c = document.getElementById('toast-container');
  if (!c) { c = document.createElement('div'); c.id = 'toast-container'; c.className = 'toast-container'; document.body.appendChild(c); }
  const t = document.createElement('div');
  t.className = `toast toast--${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
