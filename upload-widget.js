/**
 * MyEOD Upload Widget — v1.0
 * Widget universel d'upload de documents
 * À inclure dans toutes les pages collaborateurs
 *
 * Usage:
 *   <script src="upload-widget.js"></script>
 *   Appeler initUploadWidget() dans le <body> ou après login
 */

(function() {
'use strict';

// ── Config ─────────────────────────────────────────────────────
const SB_URL    = 'https://kewhxzitwdrnpsnzlihn.supabase.co';
const SB_ANON   = 'sb_publishable_owbl6MuPlOfMYAOPMxQ8Hg_deQuxLWi';
const BUCKET    = 'uploads-collab';
const TABLE     = 'documents';
const MAX_SIZE  = 50 * 1024 * 1024; // 50 Mo
const ACCEPTED  = ['.docx','.xlsx','.pptx','.pdf','.jpg','.jpeg','.png'];
const ACCEPT_ATTR = ACCEPTED.join(',');

const MIME_MAP = {
  'pdf':'📄','docx':'📝','doc':'📝','xlsx':'📊','xls':'📊',
  'pptx':'📊','ppt':'📊','jpg':'🖼','jpeg':'🖼','png':'🖼',
};

// ── Supabase client (réutilise celui de la page si disponible) ──
let _sb = null;
function getSb() {
  if (_sb) return _sb;
  // Réutiliser le client de la page principale si disponible
  if (window._sbClient) return (_sb = window._sbClient);
  // Créer un nouveau client si Supabase CDN est chargé
  if (window.supabase) {
    _sb = window.supabase.createClient(SB_URL, SB_ANON);
    return _sb;
  }
  console.warn('Upload widget: Supabase CDN non chargé');
  return null;
}

async function getSbWithSession() {
  const sb = getSb();
  if (!sb) return null;
  // Restaurer la session depuis sessionStorage
  const t = sessionStorage.getItem('myeod_access_token');
  const r = sessionStorage.getItem('myeod_refresh_token');
  if (t) {
    try {
      await sb.auth.setSession({ access_token: t, refresh_token: r || '' });
    } catch(e) {
      console.warn('Session restore failed:', e.message);
    }
  }
  return sb;
}

// ── CSS ─────────────────────────────────────────────────────────
const CSS = `
#uw-trigger {
  display: inline-flex; align-items: center; justify-content: center;
  width: 34px; height: 34px;
  border: 1px solid #e0e0e0; background: #ffffff;
  cursor: pointer; font-size: 1rem;
  transition: border-color .15s, background .15s;
  position: relative; flex-shrink: 0;
}
#uw-trigger:hover { border-color: #1a1a1a; background: #f8f8f8; }
#uw-trigger .uw-badge {
  position: absolute; top: -5px; right: -5px;
  background: #1a1a1a; color: #fff;
  font-size: 9px; font-weight: 700;
  width: 16px; height: 16px;
  border-radius: 50%; display: none;
  align-items: center; justify-content: center;
}
#uw-trigger .uw-badge.show { display: flex; }

#uw-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.5);
  z-index: 9000; display: none;
  align-items: center; justify-content: center;
  padding: 20px;
}
#uw-overlay.open { display: flex; }

#uw-modal {
  background: #ffffff;
  width: 100%; max-width: 640px;
  max-height: 90vh; overflow-y: auto;
  box-shadow: 0 24px 64px rgba(0,0,0,.18);
  display: flex; flex-direction: column;
}

.uw-modal-hdr {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1rem 1.4rem;
  border-bottom: 2px solid #1a1a1a;
  flex-shrink: 0;
}
.uw-modal-title {
  font-family: 'Arial Narrow', Arial, sans-serif;
  font-size: 0.8rem; font-weight: 800;
  letter-spacing: 0.12em; text-transform: uppercase; color: #1a1a1a;
}
.uw-close {
  background: none; border: 1px solid #e0e0e0;
  width: 28px; height: 28px; cursor: pointer;
  font-size: 14px; color: #888; display: flex;
  align-items: center; justify-content: center;
  transition: border-color .15s;
}
.uw-close:hover { border-color: #1a1a1a; color: #1a1a1a; }

.uw-body { padding: 1.2rem 1.4rem; flex: 1; }

.uw-drop {
  border: 2px dashed #e0e0e0; padding: 1.8rem;
  text-align: center; cursor: pointer; position: relative;
  transition: border-color .2s, background .2s; margin-bottom: 1rem;
}
.uw-drop:hover, .uw-drop.over { border-color: #1a1a1a; background: #f8f8f8; }
.uw-drop input { position:absolute; inset:0; opacity:0; cursor:pointer; width:100%; height:100%; }
.uw-drop-icon { font-size: 1.6rem; margin-bottom: 6px; }
.uw-drop-label {
  font-family: 'Arial Narrow', Arial, sans-serif;
  font-size: 0.75rem; font-weight: 700; color: #1a1a1a; margin-bottom: 4px;
}
.uw-drop-hint { font-size: 0.6rem; color: #9a9a9a; letter-spacing: 0.08em; }

.uw-meta {
  display: flex; gap: 10px; flex-wrap: wrap;
  margin-bottom: 1rem; align-items: flex-end;
}
.uw-field { display: flex; flex-direction: column; gap: 3px; }
.uw-field label {
  font-size: 0.58rem; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase; color: #9a9a9a;
}
.uw-field select, .uw-field input {
  font-family: inherit; font-size: 0.7rem;
  border: 1px solid #e0e0e0; padding: 5px 8px;
  background: #fff; color: #1a1a1a; outline: none; min-width: 130px;
}
.uw-field select:focus, .uw-field input:focus { border-color: #1a1a1a; }

.uw-queue { display: flex; flex-direction: column; gap: 5px; margin-bottom: 1rem; }
.uw-queue-item {
  display: grid; grid-template-columns: 28px 1fr auto auto;
  gap: 0 10px; align-items: center;
  padding: 7px 10px; border: 1px solid #e0e0e0; background: #f8f8f8;
  font-size: 0.68rem;
}
.uw-queue-item.done   { border-color: #1e7a3a; background: rgba(30,122,58,.04); }
.uw-queue-item.error  { border-color: #c0392b; background: rgba(192,57,43,.04); }
.uw-queue-item.active { border-color: #2a6099; background: rgba(42,96,153,.04); }

.uw-q-icon { font-size: 1.1rem; text-align: center; }
.uw-q-info { min-width: 0; }
.uw-q-name {
  font-weight: 700; color: #1a1a1a;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.uw-q-size { font-size: 0.58rem; color: #9a9a9a; }
.uw-q-status { font-size: 0.65rem; white-space: nowrap; color: #9a9a9a; }
.uw-q-remove {
  background: none; border: none; cursor: pointer;
  color: #ccc; font-size: 14px; padding: 0 4px;
  transition: color .15s;
}
.uw-q-remove:hover { color: #c0392b; }

.uw-prog-bar {
  height: 3px; background: #f0f0f0; margin-bottom: 1rem;
}
.uw-prog-fill {
  height: 100%; background: #1a1a1a; transition: width .3s; width: 0%;
}

.uw-footer {
  display: flex; gap: 8px; justify-content: flex-end;
  padding: 0.8rem 1.4rem; border-top: 1px solid #e0e0e0;
  flex-shrink: 0;
}
.uw-btn {
  font-family: 'Arial Narrow', Arial, sans-serif;
  font-size: 0.65rem; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase;
  padding: 7px 18px; border: none; cursor: pointer; transition: background .15s;
}
.uw-btn-primary { background: #1a1a1a; color: #fff; }
.uw-btn-primary:hover { background: #333; }
.uw-btn-primary:disabled { background: #ccc; cursor: not-allowed; }
.uw-btn-ghost {
  background: transparent; color: #555; border: 1px solid #e0e0e0;
}
.uw-btn-ghost:hover { border-color: #1a1a1a; color: #1a1a1a; }

.uw-summary {
  font-size: 0.65rem; color: #9a9a9a; letter-spacing: 0.08em;
  padding: 0 1.4rem 0.8rem; text-align: center; display: none;
}
.uw-summary.show { display: block; }
`;

// ── HTML du widget ──────────────────────────────────────────────
const HTML = `
<div id="uw-overlay">
  <div id="uw-modal">
    <div class="uw-modal-hdr">
      <span class="uw-modal-title">📎 Upload de documents</span>
      <button class="uw-close" id="uw-close-btn">✕</button>
    </div>
    <div class="uw-body">
      <!-- Métadonnées communes -->
      <div class="uw-meta">
        <div class="uw-field">
          <label>Département *</label>
          <select id="uw-dept">
            <option value="">— Choisir —</option>
            <option value="Admin">Admin</option>
            <option value="BizDev">BizDev</option>
            <option value="Operations">Operations</option>
            <option value="IT">IT</option>
          </select>
        </div>
        <div class="uw-field">
          <label>Statut initial</label>
          <select id="uw-status">
            <option value="a_completer">À compléter</option>
            <option value="a_revoir">À revoir</option>
            <option value="a_approuver">À approuver</option>
            <option value="approuve">Approuvé</option>
          </select>
        </div>
        <div class="uw-field" style="flex:1; min-width:160px">
          <label>Note (optionnel)</label>
          <input type="text" id="uw-notes" placeholder="Contexte, version…">
        </div>
      </div>
      <!-- Drop zone -->
      <div class="uw-drop" id="uw-drop">
        <input type="file" id="uw-file-input" multiple accept=".docx,.xlsx,.pptx,.pdf,.jpg,.jpeg,.png">
        <div class="uw-drop-icon">📂</div>
        <p class="uw-drop-label">Glissez vos fichiers ou cliquez pour sélectionner</p>
        <p class="uw-drop-hint">DOCX · XLSX · PPTX · PDF · JPG · PNG · max 50 Mo par fichier</p>
      </div>
      <!-- File queue -->
      <div class="uw-queue" id="uw-queue"></div>
      <!-- Progress -->
      <div class="uw-prog-bar"><div class="uw-prog-fill" id="uw-prog"></div></div>
    </div>
    <div class="uw-summary" id="uw-summary"></div>
    <div class="uw-footer">
      <button class="uw-btn uw-btn-ghost" id="uw-cancel-btn">Fermer</button>
      <button class="uw-btn uw-btn-primary" id="uw-send-btn" disabled>⬆ Envoyer</button>
    </div>
  </div>
</div>
`;

// ── State ───────────────────────────────────────────────────────
let _queue    = [];   // { file, id, status, error }
let _uploading = false;

// ── Helpers ─────────────────────────────────────────────────────
function fmtSize(b) {
  if (b < 1024) return b + ' o';
  if (b < 1048576) return (b/1024).toFixed(0) + ' Ko';
  return (b/1048576).toFixed(1) + ' Mo';
}
function fileIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  return MIME_MAP[ext] || '📎';
}
function uid() { return Math.random().toString(36).slice(2, 9); }

// ── DOM helpers ─────────────────────────────────────────────────
function $(id) { return document.getElementById(id); }

// ── Render queue ────────────────────────────────────────────────
function renderQueue() {
  const container = $('uw-queue');
  if (!container) return;
  if (!_queue.length) { container.innerHTML = ''; updateSendBtn(); return; }

  container.innerHTML = _queue.map(item => {
    const cls   = item.status === 'done' ? 'done' : item.status === 'error' ? 'error' : item.status === 'active' ? 'active' : '';
    const badge = item.status === 'done'   ? '<span style="color:#1e7a3a">✓</span>' :
                  item.status === 'error'  ? '<span style="color:#c0392b" title="' + (item.error||'') + '">✗</span>' :
                  item.status === 'active' ? '<span style="color:#2a6099">⟳</span>' :
                  '<span style="color:#ccc">○</span>';
    const removeBtn = (!_uploading && item.status !== 'done' && item.status !== 'active')
      ? `<button class="uw-q-remove" onclick="window._uwRemove('${item.id}')">✕</button>`
      : '<span></span>';
    return `<div class="uw-queue-item ${cls}">
      <div class="uw-q-icon">${fileIcon(item.file.name)}</div>
      <div class="uw-q-info">
        <div class="uw-q-name" title="${item.file.name}">${item.file.name}</div>
        <div class="uw-q-size">${fmtSize(item.file.size)}</div>
      </div>
      <div class="uw-q-status">${badge}</div>
      ${removeBtn}
    </div>`;
  }).join('');

  updateSendBtn();
}

function updateSendBtn() {
  const btn = $('uw-send-btn');
  if (!btn) return;
  const pending = _queue.filter(i => i.status === 'pending');
  btn.disabled = !pending.length || _uploading || !$('uw-dept')?.value;
  btn.textContent = pending.length
    ? `⬆ Envoyer (${pending.length} fichier${pending.length>1?'s':''})`
    : _queue.length ? '✓ Tout envoyé' : '⬆ Envoyer';
}

// ── Add files to queue ──────────────────────────────────────────
function addFiles(files) {
  const errors = [];
  Array.from(files).forEach(f => {
    if (f.size > MAX_SIZE) {
      errors.push(f.name + ' dépasse 50 Mo');
      return;
    }
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    if (!ACCEPTED.includes(ext)) {
      errors.push(f.name + ' : format non supporté');
      return;
    }
    // Avoid duplicates
    if (_queue.some(i => i.file.name === f.name && i.file.size === f.size)) return;
    _queue.push({ file: f, id: uid(), status: 'pending', error: null });
  });
  if (errors.length) alert('Fichiers ignorés :\n' + errors.join('\n'));
  renderQueue();
}

window._uwRemove = function(id) {
  _queue = _queue.filter(i => i.id !== id);
  renderQueue();
};

// ── Upload batch ────────────────────────────────────────────────
async function startUpload() {
  const dept   = $('uw-dept')?.value;
  const status = $('uw-status')?.value || 'a_completer';
  const notes  = $('uw-notes')?.value.trim() || '';

  if (!dept) { alert('Veuillez sélectionner un département.'); return; }

  const pending = _queue.filter(i => i.status === 'pending');
  if (!pending.length) return;

  _uploading = true;
  updateSendBtn();
  $('uw-prog').style.width = '0%';

  const sb = await getSbWithSession();
  if (!sb) { alert('Supabase non disponible — vérifiez votre connexion.'); _uploading = false; return; }

  // Get user info
  let uploaderName  = sessionStorage.getItem('myeod_user_name')  || '';
  let uploaderEmail = sessionStorage.getItem('myeod_user_email') || '';
  if (!uploaderName) {
    try {
      const { data: { session } } = await sb.auth.getSession();
      uploaderEmail = session?.user?.email || '';
      uploaderName  = uploaderEmail;
    } catch(e) {}
  }

  let done = 0;
  const total = pending.length;

  for (const item of pending) {
    item.status = 'active';
    renderQueue();

    try {
      const ts   = Date.now();
      const safe = item.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${dept}/${ts}_${safe}`;

      // Upload to Storage
      const { error: storageErr } = await sb.storage
        .from(BUCKET)
        .upload(path, item.file, { contentType: item.file.type, upsert: false });

      if (storageErr) throw storageErr;

      // Insert metadata
      const { error: dbErr } = await sb.from(TABLE).insert({
        filename:       item.file.name,
        storage_path:   path,
        mime_type:      item.file.type,
        size_bytes:     item.file.size,
        department:     dept,
        status:         status,
        notes:          notes,
        uploader_name:  uploaderName,
        uploader_email: uploaderEmail,
      });

      if (dbErr) throw dbErr;

      item.status = 'done';
      done++;
    } catch(e) {
      item.status = 'error';
      item.error  = e.message;
      console.error('Upload error:', e);
    }

    $('uw-prog').style.width = Math.round((done / total) * 100) + '%';
    renderQueue();
  }

  _uploading = false;
  updateSendBtn();

  const failed = _queue.filter(i => i.status === 'error').length;
  const summary = $('uw-summary');
  summary.textContent = done === total
    ? `✓ ${done} fichier${done>1?'s':''} envoyé${done>1?'s':''} avec succès`
    : `${done} envoyé${done>1?'s':''} · ${failed} échec${failed>1?'s':''}`;
  summary.className = 'uw-summary show';

  // Reset après 3s si tout OK
  if (!failed) setTimeout(resetWidget, 3000);
}

// ── Reset ───────────────────────────────────────────────────────
function resetWidget() {
  _queue     = [];
  _uploading = false;
  renderQueue();
  const summary = $('uw-summary');
  if (summary) { summary.textContent = ''; summary.className = 'uw-summary'; }
  const prog = $('uw-prog');
  if (prog) prog.style.width = '0%';
  if ($('uw-file-input')) $('uw-file-input').value = '';
  if ($('uw-dept'))   $('uw-dept').value   = '';
  if ($('uw-status')) $('uw-status').value = 'a_completer';
  if ($('uw-notes'))  $('uw-notes').value  = '';
}

// ── Open / Close ─────────────────────────────────────────────────
function openWidget() {
  $('uw-overlay')?.classList.add('open');
}
function closeWidget() {
  if (_uploading) return;
  $('uw-overlay')?.classList.remove('open');
}

// ── Init ─────────────────────────────────────────────────────────
window.initUploadWidget = function(opts) {
  opts = opts || {};

  // Inject CSS
  if (!document.getElementById('uw-styles')) {
    const style = document.createElement('style');
    style.id = 'uw-styles';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  // Inject modal HTML
  if (!document.getElementById('uw-overlay')) {
    document.body.insertAdjacentHTML('beforeend', HTML);
  }

  // Create trigger button and inject into header
  const targetEl = opts.headerEl || document.querySelector(
    '.myeod-header, #hdr, .hdr, .doc-header, .dash-header'
  );
  if (targetEl && !document.getElementById('uw-trigger')) {
    const btn = document.createElement('button');
    btn.id = 'uw-trigger';
    btn.title = 'Upload de documents';
    btn.innerHTML = '📎<span class="uw-badge" id="uw-badge"></span>';
    btn.addEventListener('click', openWidget);
    // Insert before last child of header (before logout/meta)
    targetEl.appendChild(btn);
  }

  // Drop zone events
  const drop   = $('uw-drop');
  const input  = $('uw-file-input');
  if (drop && input) {
    input.addEventListener('change', () => { addFiles(input.files); input.value=''; });
    drop.addEventListener('dragover',  e => { e.preventDefault(); drop.classList.add('over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('over'));
    drop.addEventListener('drop', e => {
      e.preventDefault(); drop.classList.remove('over');
      addFiles(e.dataTransfer.files);
    });
  }

  // Buttons
  $('uw-close-btn')?.addEventListener('click', closeWidget);
  $('uw-cancel-btn')?.addEventListener('click', closeWidget);
  $('uw-send-btn')?.addEventListener('click', startUpload);
  $('uw-dept')?.addEventListener('change', updateSendBtn);

  // Close on overlay click
  $('uw-overlay')?.addEventListener('click', e => {
    if (e.target === $('uw-overlay')) closeWidget();
  });

  // ESC key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeWidget();
  });
};

// Store user info from session for uploads
window._uwSetUser = function(name, email) {
  sessionStorage.setItem('myeod_user_name',  name  || '');
  sessionStorage.setItem('myeod_user_email', email || '');
};

})();
