// form.js — Dynamic form rendering and submission
(function() {
  const supabase = window.supabaseClient;
  if (!supabase || typeof supabase.from !== 'function') {
    showToast('Ошибка конфигурации Supabase', 'error');
    return;
  }
  const params = new URLSearchParams(location.search);
  const catSlug = params.get('cat');
  if (!catSlug) { location.href = 'index.html'; return; }

  let categoryId = null;
  let fields = [];

  const CAT_NAMES = { exterior: 'Экстерьер', interior: 'Интерьер', technical: 'Техническая' };
  document.getElementById('cat-badge').textContent = CAT_NAMES[catSlug] || catSlug;

  async function loadForm() {
    // Get category
    const { data: cat } = await supabase
      .from('categories').select('*').eq('slug', catSlug).single();
    if (!cat) { location.href = 'index.html'; return; }
    categoryId = cat.id;

    // Get fields
    const { data: flds } = await supabase
      .from('form_fields').select('*').eq('category_id', cat.id).order('sort_order');
    fields = flds || [];

    renderFields();
  }

  function renderFields() {
    const container = document.getElementById('fields-container');
    if (!fields.length) { container.innerHTML = '<p class="text-muted">Нет полей для этой категории.</p>'; return; }

    container.innerHTML = fields.map(f => {
      const req = f.is_required ? '<span class="req">*</span>' : '';
      const id = `field_${f.id}`;
      let html = `<div class="field" data-field-id="${f.id}" data-required="${f.is_required}">`;
      html += `<label class="field__label">${f.label} ${req}</label>`;

      switch (f.field_type) {
        case 'text':
        case 'url':
          html += `<input type="${f.field_type === 'url' ? 'url' : 'text'}" class="field__input" id="${id}" placeholder="${esc(f.placeholder || '')}" ${f.is_required ? 'required' : ''}>`;
          break;
        case 'textarea':
          html += `<textarea class="field__textarea" id="${id}" placeholder="${esc(f.placeholder || '')}" ${f.is_required ? 'required' : ''}></textarea>`;
          break;
        case 'select': {
          const opts = parseOpts(f.options);
          html += `<select class="field__select" id="${id}" ${f.is_required ? 'required' : ''}>`;
          html += `<option value="">— Выберите —</option>`;
          opts.forEach(o => { html += `<option value="${esc(o)}">${esc(o)}</option>`; });
          html += `</select>`;
          break;
        }
        case 'checkbox': {
          const opts = parseOpts(f.options);
          html += `<div class="field__options">`;
          opts.forEach((o, i) => {
            html += `<label class="field__option"><input type="checkbox" name="${id}" value="${esc(o)}" onchange="toggleOptionStyle(this)"> ${esc(o)}</label>`;
          });
          html += `</div>`;
          break;
        }
        case 'radio': {
          const opts = parseOpts(f.options);
          html += `<div class="field__options">`;
          opts.forEach((o, i) => {
            html += `<label class="field__option"><input type="radio" name="${id}" value="${esc(o)}" onchange="toggleRadioStyle(this)"> ${esc(o)}</label>`;
          });
          html += `</div>`;
          break;
        }
        case 'file':
          html += `<div class="field__file-zone" onclick="this.querySelector('input').click()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <p>Нажмите для загрузки или перетащите файл</p>
            <input type="file" id="${id}" multiple>
            <div class="field__file-names mt-2 text-sm"></div>
          </div>`;
          break;
      }

      html += `<div class="field__error">Это поле обязательно для заполнения</div>`;
      html += `</div>`;
      return html;
    }).join('');
  }

  function parseOpts(opts) {
    if (Array.isArray(opts)) return opts;
    try { return JSON.parse(opts); } catch { return []; }
  }

  function esc(s) { return String(s).replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

  // Toggle option styles
  window.toggleOptionStyle = function(el) {
    el.closest('.field__option').classList.toggle('field__option--checked', el.checked);
  };
  window.toggleRadioStyle = function(el) {
    el.closest('.field__options').querySelectorAll('.field__option').forEach(l => l.classList.remove('field__option--checked'));
    el.closest('.field__option').classList.add('field__option--checked');
  };

  // File names display
  document.addEventListener('change', function(e) {
    if (e.target.type === 'file') {
      const zone = e.target.closest('.field__file-zone');
      const names = zone.querySelector('.field__file-names');
      names.textContent = Array.from(e.target.files).map(f => f.name).join(', ');
    }
  });

  // Form submission
  document.getElementById('viz-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!validateForm()) return;

    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Отправка...';

    const data = {};
    fields.forEach(f => {
      const id = `field_${f.id}`;
      if (f.field_type === 'checkbox') {
        const checked = document.querySelectorAll(`input[name="${id}"]:checked`);
        data[f.label] = Array.from(checked).map(c => c.value);
      } else if (f.field_type === 'radio') {
        const checked = document.querySelector(`input[name="${id}"]:checked`);
        data[f.label] = checked ? checked.value : '';
      } else if (f.field_type === 'file') {
        const input = document.getElementById(id);
        data[f.label] = input.files.length ? Array.from(input.files).map(fi => fi.name) : [];
      } else {
        data[f.label] = document.getElementById(id)?.value || '';
      }
    });

    const submission = {
      category_id: categoryId,
      data: data,
      submitter_name: document.getElementById('submitter_name').value.trim(),
      submitter_email: document.getElementById('submitter_email').value.trim(),
      status: 'new'
    };

    const { error } = await supabase.from('submissions').insert(submission);
    if (error) {
      showToast('Ошибка при отправке: ' + error.message, 'error');
      btn.disabled = false; btn.textContent = 'Отправить заявку';
      return;
    }

    // Send notification
    sendNotification(submission);

    document.getElementById('viz-form').classList.add('hidden');
    document.getElementById('form-header').classList.add('hidden');
    document.getElementById('success-screen').classList.remove('hidden');
  });

  function validateForm() {
    let valid = true;
    document.querySelectorAll('.field--error').forEach(f => f.classList.remove('field--error'));

    fields.forEach(f => {
      if (!f.is_required) return;
      const id = `field_${f.id}`;
      const wrap = document.querySelector(`[data-field-id="${f.id}"]`);
      let empty = false;

      if (f.field_type === 'checkbox') {
        empty = !document.querySelectorAll(`input[name="${id}"]:checked`).length;
      } else if (f.field_type === 'radio') {
        empty = !document.querySelector(`input[name="${id}"]:checked`);
      } else {
        const el = document.getElementById(id);
        empty = !el || !el.value.trim();
      }

      if (empty) { wrap.classList.add('field--error'); valid = false; }
    });

    // Contact info
    const name = document.getElementById('submitter_name');
    const email = document.getElementById('submitter_email');
    if (!name.value.trim()) { name.closest('.field').classList.add('field--error'); valid = false; }
    if (!email.value.trim() || !email.value.includes('@')) { email.closest('.field').classList.add('field--error'); valid = false; }

    if (!valid) {
      const first = document.querySelector('.field--error');
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return valid;
  }

  async function sendNotification(sub) {
    try {
      const { data: settings } = await supabase
        .from('app_settings').select('value').eq('key', 'notifications').single();
      if (!settings) return;
      const cfg = settings.value;

      if (cfg.telegram_enabled && cfg.telegram_bot_token && cfg.telegram_chat_id) {
        const text = `Новая заявка на визуализацию!\n\nИмя: ${sub.submitter_name}\nEmail: ${sub.submitter_email}\n\nДанные:\n${Object.entries(sub.data).map(([k,v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n')}`;
        fetch(`https://api.telegram.org/bot${cfg.telegram_bot_token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: cfg.telegram_chat_id, text, parse_mode: 'HTML' })
        }).catch(() => {});
      }

      if (cfg.email_enabled && cfg.email_to) {
        // Email via Supabase Edge Function (optional, user must deploy)
        supabase.functions.invoke('send-email', {
          body: { to: cfg.email_to, subject: 'Новая заявка на визуализацию', data: sub }
        }).catch(() => {});
      }
    } catch {}
  }

  loadForm();
})();
