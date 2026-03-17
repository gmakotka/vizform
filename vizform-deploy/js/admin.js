// admin.js — Admin panel logic (skeleton)
// Sections: submissions, fields, settings

let categories = [];
let currentCatId = null;

// --- AUTH ---
function adminLogin() {
  const pass = document.getElementById('admin-pass').value;
  const stored = localStorage.getItem('vizform_admin_pass') || 'admin';
  if (pass === stored) {
    localStorage.setItem('vizform_logged', '1');
    showAdmin();
  } else {
    showToast('Неверный пароль', 'error');
  }
}

document.getElementById('admin-pass').addEventListener('keydown', e => { if (e.key === 'Enter') adminLogin(); });

function showAdmin() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('admin-panel').classList.remove('hidden');
  init();
}

if (localStorage.getItem('vizform_logged') === '1') showAdmin();

// --- INIT ---
async function init() {
  setupNav();
  try {
    await loadCategories();
    loadSubmissions();
    loadSettings();
  } catch(e) {
    console.error('Init error:', e);
    showToast('Ошибка загрузки данных: ' + e.message, 'error');
  }
}

// --- NAV ---
function setupNav() {
  document.querySelectorAll('.admin-sidebar__link[data-section]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const sec = link.dataset.section;
      document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
      document.getElementById('sec-' + sec).classList.remove('hidden');
      document.querySelectorAll('.admin-sidebar__link').forEach(l => l.classList.remove('admin-sidebar__link--active'));
      link.classList.add('admin-sidebar__link--active');
    });
  });
}

// --- CATEGORIES ---
async function loadCategories() {
  const { data } = await supabase.from('categories').select('*').order('sort_order');
  categories = data || [];
  renderFieldTabs();
}

// --- SUBMISSIONS ---
const STATUS_LABELS = { new: 'Новая', in_progress: 'В работе', completed: 'Завершена', cancelled: 'Отменена' };

async function loadSubmissions() {
  const status = document.getElementById('filter-status').value;
  let q = supabase.from('submissions').select('*, categories(name)').order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data } = await q;
  const body = document.getElementById('submissions-body');
  if (!data || !data.length) {
    body.innerHTML = '<tr><td colspan="7" class="text-muted" style="text-align:center;padding:32px">Нет заявок</td></tr>';
    return;
  }
  body.innerHTML = data.map((s, i) => `<tr>
    <td>${i + 1}</td>
    <td>${new Date(s.created_at).toLocaleDateString('ru-RU')}</td>
    <td>${s.categories?.name || '—'}</td>
    <td>${esc(s.submitter_name || '—')}</td>
    <td>${esc(s.submitter_email || '—')}</td>
    <td><span class="badge badge--${s.status}">${STATUS_LABELS[s.status] || s.status}</span></td>
    <td>
      <button class="btn btn--outline btn--sm" onclick='viewSubmission(${JSON.stringify(s).replace(/'/g,"&#39;")})'>Открыть</button>
      <select class="field__select" style="width:130px;display:inline-block;padding:6px 10px;font-size:0.75rem" onchange="updateStatus('${s.id}', this.value)">
        <option value="new" ${s.status==='new'?'selected':''}>Новая</option>
        <option value="in_progress" ${s.status==='in_progress'?'selected':''}>В работе</option>
        <option value="completed" ${s.status==='completed'?'selected':''}>Завершена</option>
        <option value="cancelled" ${s.status==='cancelled'?'selected':''}>Отменена</option>
      </select>
    </td>
  </tr>`).join('');
}

async function updateStatus(id, status) {
  await supabase.from('submissions').update({ status }).eq('id', id);
  showToast('Статус обновлён');
}

function viewSubmission(s) {
  const modal = document.getElementById('modal-content');
  const entries = Object.entries(s.data || {});
  modal.innerHTML = `
    <div class="flex-between mb-4">
      <h2 class="modal__title">Заявка от ${esc(s.submitter_name || '—')}</h2>
      <button class="btn btn--outline btn--sm" onclick="closeModal()">Закрыть</button>
    </div>
    <p class="text-sm text-muted mb-4">${s.submitter_email} &middot; ${new Date(s.created_at).toLocaleString('ru-RU')}</p>
    <table>
      ${entries.map(([k,v]) => `<tr><td style="font-weight:600;width:40%;vertical-align:top">${esc(k)}</td><td>${Array.isArray(v) ? v.join(', ') : esc(String(v))}</td></tr>`).join('')}
    </table>`;
  document.getElementById('modal-overlay').classList.add('modal-overlay--active');
}

function closeModal() { document.getElementById('modal-overlay').classList.remove('modal-overlay--active'); }
document.getElementById('modal-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });

// --- FIELDS MANAGEMENT ---
function renderFieldTabs() {
  const tabs = document.getElementById('field-tabs');
  tabs.innerHTML = categories.map((c, i) =>
    `<button class="tab ${i === 0 ? 'tab--active' : ''}" onclick="switchFieldTab('${c.id}', this)">${c.name}</button>`
  ).join('');
  if (categories.length) { currentCatId = categories[0].id; loadFields(); }
}

function switchFieldTab(catId, btn) {
  currentCatId = catId;
  document.querySelectorAll('#field-tabs .tab').forEach(t => t.classList.remove('tab--active'));
  btn.classList.add('tab--active');
  loadFields();
}

async function loadFields() {
  const { data } = await supabase.from('form_fields').select('*').eq('category_id', currentCatId).order('sort_order');
  renderFieldEditors(data || []);
}

function renderFieldEditors(fields) {
  const list = document.getElementById('fields-list');
  if (!fields.length) { list.innerHTML = '<p class="text-muted mt-4">Нет полей. Нажмите "Добавить поле".</p>'; return; }
  list.innerHTML = fields.map(f => `
    <div class="field-editor" data-id="${f.id}">
      <div class="field-editor__header">
        <span class="text-sm text-muted">#${f.sort_order}</span>
        <div class="flex gap-2">
          <button class="btn btn--outline btn--sm" onclick="editField('${f.id}')">Редактировать</button>
          <button class="btn btn--danger btn--sm" onclick="deleteField('${f.id}')">Удалить</button>
        </div>
      </div>
      <div class="field-editor__grid">
        <div><strong>${esc(f.label)}</strong></div>
        <div class="text-sm text-muted">
          Тип: ${f.field_type} &middot;
          ${f.is_required ? '<span style="color:var(--danger)">Обязательное</span>' : 'Необязательное'} &middot;
          ${f.placeholder ? 'Образец: "' + esc(f.placeholder) + '"' : 'Без образца'}
        </div>
      </div>
      ${(parseOpts(f.options).length) ? '<div class="text-sm mt-2">Варианты: ' + parseOpts(f.options).join(', ') + '</div>' : ''}
    </div>
  `).join('');
}

function parseOpts(o) { if (Array.isArray(o)) return o; try { return JSON.parse(o); } catch { return []; } }

async function addField() {
  openFieldModal({ category_id: currentCatId, field_type: 'text', label: '', placeholder: '', options: '[]', is_required: false, sort_order: 99 });
}

async function editField(id) {
  const { data } = await supabase.from('form_fields').select('*').eq('id', id).single();
  if (data) openFieldModal(data);
}

function openFieldModal(f) {
  const isNew = !f.id;
  const opts = parseOpts(f.options);
  const modal = document.getElementById('modal-content');
  modal.innerHTML = `
    <h2 class="modal__title">${isNew ? 'Новое поле' : 'Редактирование поля'}</h2>
    <div class="field">
      <label class="field__label">Название поля</label>
      <input type="text" class="field__input" id="ef-label" value="${esc(f.label || '')}">
    </div>
    <div class="field">
      <label class="field__label">Тип поля</label>
      <select class="field__select" id="ef-type">
        ${['text','textarea','select','checkbox','radio','file','url'].map(t => `<option value="${t}" ${f.field_type===t?'selected':''}>${t}</option>`).join('')}
      </select>
    </div>
    <div class="field">
      <label class="field__label">Текст-образец (placeholder)</label>
      <input type="text" class="field__input" id="ef-placeholder" value="${esc(f.placeholder || '')}">
    </div>
    <div class="field">
      <label class="field__label">Варианты (через запятую, для select/checkbox/radio)</label>
      <input type="text" class="field__input" id="ef-options" value="${opts.join(', ')}">
    </div>
    <div class="field">
      <label class="field__option" style="width:fit-content"><input type="checkbox" id="ef-required" ${f.is_required?'checked':''}> Обязательное поле</label>
    </div>
    <div class="field">
      <label class="field__label">Порядок сортировки</label>
      <input type="number" class="field__input" id="ef-sort" value="${f.sort_order || 0}">
    </div>
    <div class="flex gap-2 mt-4">
      <button class="btn btn--primary" onclick="saveField('${f.id || ''}')">Сохранить</button>
      <button class="btn btn--outline" onclick="closeModal()">Отмена</button>
    </div>`;
  document.getElementById('modal-overlay').classList.add('modal-overlay--active');
}

async function saveField(id) {
  const label = document.getElementById('ef-label').value.trim();
  if (!label) { showToast('Укажите название поля', 'error'); return; }
  const optsRaw = document.getElementById('ef-options').value.trim();
  const options = optsRaw ? optsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
  const payload = {
    category_id: currentCatId,
    field_type: document.getElementById('ef-type').value,
    label,
    placeholder: document.getElementById('ef-placeholder').value,
    options,
    is_required: document.getElementById('ef-required').checked,
    sort_order: parseInt(document.getElementById('ef-sort').value) || 0
  };
  if (id) {
    await supabase.from('form_fields').update(payload).eq('id', id);
  } else {
    await supabase.from('form_fields').insert(payload);
  }
  closeModal();
  loadFields();
  showToast('Поле сохранено');
}

async function deleteField(id) {
  if (!confirm('Удалить это поле?')) return;
  await supabase.from('form_fields').delete().eq('id', id);
  loadFields();
  showToast('Поле удалено');
}

// --- SETTINGS ---
async function loadSettings() {
  const { data } = await supabase.from('app_settings').select('*').eq('key', 'notifications').single();
  if (!data) return;
  const v = data.value;
  document.getElementById('tg-enabled').checked = v.telegram_enabled || false;
  document.getElementById('tg-token').value = v.telegram_bot_token || '';
  document.getElementById('tg-chat').value = v.telegram_chat_id || '';
  document.getElementById('email-enabled').checked = v.email_enabled || false;
  document.getElementById('email-to').value = v.email_to || '';
}

async function saveSettings() {
  const value = {
    telegram_enabled: document.getElementById('tg-enabled').checked,
    telegram_bot_token: document.getElementById('tg-token').value.trim(),
    telegram_chat_id: document.getElementById('tg-chat').value.trim(),
    email_enabled: document.getElementById('email-enabled').checked,
    email_to: document.getElementById('email-to').value.trim()
  };
  await supabase.from('app_settings').update({ value }).eq('key', 'notifications');
  showToast('Настройки сохранены');
}

function changePassword() {
  const pass = document.getElementById('new-password').value;
  if (!pass || pass.length < 4) { showToast('Минимум 4 символа', 'error'); return; }
  localStorage.setItem('vizform_admin_pass', pass);
  showToast('Пароль изменён');
}

// --- HELPERS ---
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

window.toggleOptionStyle = function(el) {
  el.closest('.field__option').classList.toggle('field__option--checked', el.checked);
};
