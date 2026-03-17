// VizForm Supabase Configuration
// Priority:
// 1) Runtime values from /runtime-config.js (Railway variables)
// 2) Local defaults below

const RUNTIME_CFG = window.__VIZFORM_RUNTIME_CONFIG__ || {};

const DEFAULT_SUPABASE_URL = 'https://krqofgpakenxvyttbloq.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtycW9mZ3Bha2VueHZ5dHRibG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2ODg4MjAsImV4cCI6MjA4OTI2NDgyMH0.uZVBd5eTwP0ogSIjElCPk0gjFMZgAR6uf2CYpG95ZaY';

const SUPABASE_URL = RUNTIME_CFG.SUPABASE_URL || DEFAULT_SUPABASE_URL;
const SUPABASE_ANON_KEY = RUNTIME_CFG.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase configuration is missing. Set SUPABASE_URL and SUPABASE_ANON_KEY.');
}

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
