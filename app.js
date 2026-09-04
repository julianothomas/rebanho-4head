/* ============================================================
   Rebanho — Registro de Gado (Corte e Leite)
   App 100% offline: dados ficam salvos no próprio iPhone (IndexedDB).
   ============================================================ */

/* ---------------- IndexedDB layer ---------------- */
const DB_NAME = 'rebanhoDB';
const DB_VERSION = 1;
const STORE = 'animais';
let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function dbGetAll() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function dbPut(animal) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(animal);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dbDelete(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dbBulkPut(animais) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    animais.forEach(a => store.put(a));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ---------------- Helpers ---------------- */
function uid() {
  return 'a_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 2200);
}

function fmtDate(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function fmtMesAno(d) {
  if (!d) return '—';
  const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const dt = new Date(d + 'T00:00:00');
  return `${meses[dt.getMonth()]} de ${dt.getFullYear()}`;
}

function idadeStr(dataNasc) {
  if (!dataNasc) return '—';
  const nasc = new Date(dataNasc + 'T00:00:00');
  const now = new Date();
  let anos = now.getFullYear() - nasc.getFullYear();
  let meses = now.getMonth() - nasc.getMonth();
  if (now.getDate() < nasc.getDate()) meses--;
  if (meses < 0) { anos--; meses += 12; }
  if (anos < 0) return '—';
  if (anos === 0) return `${meses} m`;
  return meses === 0 ? `${anos} a` : `${anos}a ${meses}m`;
}

function pesoAtual(animal) {
  if (!animal.pesagens || animal.pesagens.length === 0) return null;
  const ordenado = [...animal.pesagens].sort((a, b) => a.data.localeCompare(b.data));
  return ordenado[ordenado.length - 1].peso;
}

function calcArrobas(peso, rendimento) {
  if (!peso) return null;
  const rend = rendimento || 50;
  return (peso * (rend / 100)) / 30;
}

function calcGMD(animal) {
  if (!animal.pesagens || animal.pesagens.length < 2) return null;
  const ord = [...animal.pesagens].sort((a, b) => a.data.localeCompare(b.data));
  const last = ord[ord.length - 1];
  const prev = ord[ord.length - 2];
  const dias = (new Date(last.data) - new Date(prev.data)) / 86400000;
  if (dias <= 0) return null;
  return (last.peso - prev.peso) / dias;
}

function calcPrevisaoParto(dataCobertura) {
  if (!dataCobertura) return null;
  const d = new Date(dataCobertura + 'T00:00:00');
  d.setDate(d.getDate() + 285);
  return d.toISOString().slice(0, 10);
}

function ultimoControleLeiteiro(animal) {
  if (!animal.controleLeiteiro || animal.controleLeiteiro.length === 0) return null;
  const ord = [...animal.controleLeiteiro].sort((a, b) => a.data.localeCompare(b.data));
  return ord[ord.length - 1];
}

function resizeImage(file, maxW = 900, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > maxW) { h = Math.round(h * (maxW / w)); w = maxW; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ---------------- Constants ---------------- */
const CATEGORIAS = ['Bezerro', 'Bezerra', 'Novilha', 'Novilho', 'Garrote', 'Vaca', 'Touro', 'Boi'];
const STATUS_COMERCIAL = ['Ativo', 'Vendido', 'Abatido', 'Morto'];
const STATUS_REPRO = ['Não se aplica', 'Vazia', 'Inseminada (sem prenhez confirmada)', 'Prenhez confirmada', 'Parida'];
const TIPO_COBERTURA = ['IA (inseminação artificial)', 'Embrião (FIV/TE)', 'Monta natural'];
const TIPOS_PRODUCAO = ['Corte', 'Leite'];

/* ---------------- App state ---------------- */
let state = {
  view: 'lista',
  animais: [],
  search: '',
  filtroStatus: '',
  editing: null,
  detalheId: null,
  catalogoSelecionados: new Set(),
  catalogoMeta: { titulo: 'Catálogo de Leilão', data: '', contato: '' },
};

/* ---------------- DOM refs ---------------- */
const mainEl = document.getElementById('main');
const topbarTitle = document.getElementById('topbar-title');
const topbarSub = document.getElementById('topbar-sub');
const btnBack = document.getElementById('btn-back');
const fabAdd = document.getElementById('fab-add');
const bottomNav = document.getElementById('bottom-nav');
const cameraInput = document.getElementById('camera-input');

/* ---------------- Init ---------------- */
async function init() {
  state.animais = await dbGetAll();
  bindGlobalEvents();
  render();
}

function bindGlobalEvents() {
  bottomNav.addEventListener('click', (e) => {
    const btn = e.target.closest('.nav-btn');
    if (!btn) return;
    const view = btn.dataset.view;
    if (view === 'novo') { startNovo(); }
    else { state.view = view; render(); }
  });

  fabAdd.addEventListener('click', startNovo);
  btnBack.addEventListener('click', () => { state.view = 'lista'; render(); });
}

function startNovo() {
  state.editing = {
    id: uid(),
    tipoProducao: 'Corte',
    nome: '', brinco: '', sexo: 'Fêmea', dataNascimento: '', categoria: 'Bezerra',
    composicaoRacial: '',
    pai: '', mae: '', plantel: '',
    fazenda: '', lote: '', pastoAtual: '',
    loteVenda: '', ofertaTipo: 'IND',
    pesagens: [], rendimentoCarcaca: 50, escoreCorporal: '',
    lactacaoOficial: '', controleLeiteiro: [],
    statusReprodutivo: 'Não se aplica', tipoCobertura: TIPO_COBERTURA[0], touroOuEmbriao: '',
    dataCobertura: '', dataParto: '', sexoBezerro: '',
    vacinas: [],
    status: 'Ativo', valorEstimado: '',
    observacoes: '', fotos: [],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    _isNew: true
  };
  state.view = 'form';
  render();
}

function startEditar(id) {
  const a = state.animais.find(x => x.id === id);
  if (!a) return;
  state.editing = Object.assign({
    tipoProducao: 'Corte', composicaoRacial: '', loteVenda: '', ofertaTipo: 'IND',
    lactacaoOficial: '', controleLeiteiro: [], tipoCobertura: TIPO_COBERTURA[0],
    touroOuEmbriao: '', dataParto: '', sexoBezerro: ''
  }, JSON.parse(JSON.stringify(a)));
  state.editing._isNew = false;
  state.view = 'form';
  render();
}

/* ---------------- Render router ---------------- */
function render() {
  btnBack.classList.toggle('hidden', state.view === 'lista' || state.view === 'backup' || state.view === 'catalogo');
  fabAdd.classList.toggle('hidden', state.view !== 'lista');
  bottomNav.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === state.view || (b.dataset.view === 'novo' && state.view === 'form' && state.editing && state.editing._isNew));
  });

  if (state.view === 'lista') { topbarTitle.textContent = 'Rebanho'; topbarSub.textContent = `${state.animais.length} animal(is) registrado(s)`; renderLista(); }
  else if (state.view === 'form') { topbarTitle.textContent = state.editing._isNew ? 'Novo animal' : 'Editar animal'; topbarSub.textContent = state.editing.nome || 'Preencha os dados'; renderForm(); }
  else if (state.view === 'detalhe') { const a = state.animais.find(x => x.id === state.detalheId); topbarTitle.textContent = a ? a.nome || 'Sem nome' : 'Detalhe'; topbarSub.textContent = a && a.brinco ? `Brinco ${a.brinco}` : ''; renderDetalhe(); }
  else if (state.view === 'backup') { topbarTitle.textContent = 'Backup'; topbarSub.textContent = 'Exportar / importar dados'; renderBackup(); }
  else if (state.view === 'catalogo') { topbarTitle.textContent = 'Catálogo'; topbarSub.textContent = 'Gerar PDF para leilão/venda'; renderCatalogo(); }
}

/* ---------------- Lista view ---------------- */
function renderLista() {
  const term = state.search.trim().toLowerCase();
  let lista = state.animais.filter(a => {
    const matchesTerm = !term || (a.nome || '').toLowerCase().includes(term) || (a.brinco || '').toLowerCase().includes(term);
    const matchesStatus = !state.filtroStatus || a.status === state.filtroStatus;
    return matchesTerm && matchesStatus;
  }).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));

  const filterOptions = STATUS_COMERCIAL.map(s => `<option value="${s}" ${state.filtroStatus === s ? 'selected' : ''}>${s}</option>`).join('');

  let html = `
    <div class="search-row">
      <input type="search" id="search-input" placeholder="Buscar por nome ou brinco" value="${escAttr(state.search)}">
      <select id="filtro-status">
        <option value="">Todos</option>
        ${filterOptions}
      </select>
    </div>
  `;

  if (lista.length === 0) {
    html += `
      <div class="empty-state">
        <div class="big">Nenhum animal aqui</div>
        <div>Toque em "+" para registrar o primeiro animal do rebanho.</div>
      </div>`;
  } else {
    html += lista.map(a => {
      const foto = a.fotos && a.fotos[0];
      const isLeite = a.tipoProducao === 'Leite';
      const peso = pesoAtual(a);
      const arrobas = calcArrobas(peso, a.rendimentoCarcaca);
      const ultCtrl = ultimoControleLeiteiro(a);
      const metaExtra = isLeite
        ? (ultCtrl ? `${ultCtrl.litros} L/dia` : (a.lactacaoOficial ? a.lactacaoOficial + ' kg (lact.)' : 'sem controle'))
        : (peso ? peso + ' kg' : 'sem peso') + (arrobas ? ` · ${arrobas.toFixed(1)} @` : '');
      return `
        <div class="animal-card" data-id="${a.id}">
          ${foto ? `<img class="animal-thumb" src="${foto}">` : `<div class="animal-thumb placeholder">🐄</div>`}
          <div class="animal-info">
            <div class="name-row">
              <span class="name">${esc(a.nome || 'Sem nome')}</span>
              ${a.brinco ? `<span class="tag-badge">${esc(a.brinco)}</span>` : ''}
            </div>
            <div class="animal-meta">
              <span>${esc(a.categoria || '—')}</span>
              <span>${metaExtra}</span>
              <span class="status-pill status-${a.status}">${a.status}</span>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  mainEl.innerHTML = html;

  document.getElementById('search-input').addEventListener('input', (e) => { state.search = e.target.value; renderLista(); });
  document.getElementById('filtro-status').addEventListener('change', (e) => { state.filtroStatus = e.target.value; renderLista(); });
  mainEl.querySelectorAll('.animal-card').forEach(card => {
    card.addEventListener('click', () => { state.detalheId = card.dataset.id; state.view = 'detalhe'; render(); });
  });
}

function esc(s) { return (s || '').toString().replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function escAttr(s) { return esc(s); }

/* ---------------- Form view (novo/editar) ---------------- */
function renderForm() {
  const a = state.editing;
  const isLeite = a.tipoProducao === 'Leite';
  const catOptions = CATEGORIAS.map(c => `<option value="${c}" ${a.categoria === c ? 'selected' : ''}>${c}</option>`).join('');
  const statusOptions = STATUS_COMERCIAL.map(s => `<option value="${s}" ${a.status === s ? 'selected' : ''}>${s}</option>`).join('');
  const reproOptions = STATUS_REPRO.map(s => `<option value="${s}" ${a.statusReprodutivo === s ? 'selected' : ''}>${s}</option>`).join('');
  const coberturaOptions = TIPO_COBERTURA.map(s => `<option value="${s}" ${a.tipoCobertura === s ? 'selected' : ''}>${s}</option>`).join('');

  const fotosHtml = (a.fotos || []).map((f, i) => `
    <div class="photo-thumb-wrap">
      <img class="photo-thumb" src="${f}">
      <div class="photo-remove" data-i="${i}">✕</div>
    </div>`).join('');

  const pesagensHtml = (a.pesagens || []).slice().sort((x, y) => y.data.localeCompare(x.data)).map((p) => `
    <div class="list-row" data-data="${p.data}">
      <span>${fmtDate(p.data)} — ${p.peso} kg</span>
      <span class="del" data-del-peso="${p.data}">remover</span>
    </div>`).join('') || `<div style="color:var(--ink-soft);font-size:0.85rem;">Nenhuma pesagem registrada.</div>`;

  const controleHtml = (a.controleLeiteiro || []).slice().sort((x, y) => y.data.localeCompare(x.data)).map((c) => `
    <div class="list-row" data-data="${c.data}">
      <span>${fmtDate(c.data)} — ${c.litros} L/dia</span>
      <span class="del" data-del-controle="${c.data}">remover</span>
    </div>`).join('') || `<div style="color:var(--ink-soft);font-size:0.85rem;">Nenhum controle leiteiro registrado.</div>`;

  const vacinasHtml = (a.vacinas || []).slice().sort((x, y) => y.data.localeCompare(x.data)).map((v, i) => `
    <div class="list-row">
      <span>${fmtDate(v.data)} — ${esc(v.nome)}${v.obs ? ' (' + esc(v.obs) + ')' : ''}</span>
      <span class="del" data-del-vacina="${i}">remover</span>
    </div>`).join('') || `<div style="color:var(--ink-soft);font-size:0.85rem;">Nenhuma vacina registrada.</div>`;

  mainEl.innerHTML = `
    <div class="form-section">
      <h2>Perfil do animal</h2>
      <div class="segmented" id="segmented-tipo">
        <button type="button" data-tipo="Corte" class="${!isLeite ? 'active' : ''}">🥩 Corte</button>
        <button type="button" data-tipo="Leite" class="${isLeite ? 'active' : ''}">🥛 Leite</button>
      </div>
    </div>

    <div class="form-section">
      <h2>Fotos</h2>
      <div class="photo-picker">
        ${fotosHtml}
        <div class="photo-add" id="btn-add-photo">📷</div>
      </div>
    </div>

    <div class="form-section">
      <h2>Identificação</h2>
      <div class="field"><label>Nome / apelido</label><input id="f-nome" value="${escAttr(a.nome)}" placeholder="Ex: Estrela"></div>
      <div class="field-row">
        <div class="field"><label>Brinco / registro / RFID</label><input id="f-brinco" value="${escAttr(a.brinco)}" placeholder="Ex: REM1073"></div>
        <div class="field"><label>Sexo</label>
          <select id="f-sexo">
            <option ${a.sexo === 'Fêmea' ? 'selected' : ''}>Fêmea</option>
            <option ${a.sexo === 'Macho' ? 'selected' : ''}>Macho</option>
          </select>
        </div>
      </div>
      <div class="field-row">
        <div class="field"><label>Data de nascimento</label><input type="date" id="f-nascimento" value="${a.dataNascimento || ''}"></div>
        <div class="field"><label>Categoria</label><select id="f-categoria">${catOptions}</select></div>
      </div>
      <div class="field"><label>Composição racial</label><input id="f-composicao" value="${escAttr(a.composicaoRacial)}" placeholder="Ex: 1/2 HOL + 1/2 GIR"></div>
    </div>

    <div class="form-section">
      <h2>Genealogia</h2>
      <div class="field-row">
        <div class="field"><label>Pai (touro)</label><input id="f-pai" value="${escAttr(a.pai)}"></div>
        <div class="field"><label>Mãe (vaca)</label><input id="f-mae" value="${escAttr(a.mae)}"></div>
      </div>
      <div class="field"><label>Linhagem / plantel</label><input id="f-plantel" value="${escAttr(a.plantel)}"></div>
    </div>

    <div class="form-section">
      <h2>Peso &amp; arroba</h2>
      <div class="add-row-btn">
        <input type="date" id="f-peso-data" value="${new Date().toISOString().slice(0,10)}">
        <input type="number" id="f-peso-valor" placeholder="Peso (kg)" step="0.1">
        <button class="btn btn-secondary" style="width:auto;padding:10px 14px;" id="btn-add-peso">Add</button>
      </div>
      <div style="margin-top:10px;">${pesagensHtml}</div>
      <div class="field" style="margin-top:12px;">
        <label>Rendimento de carcaça estimado (%)</label>
        <input type="number" id="f-rendimento" value="${a.rendimentoCarcaca ?? 50}" step="0.5">
      </div>
      <div class="field"><label>Escore de condição corporal (1 a 5)</label><input type="number" id="f-escore" min="1" max="5" value="${a.escoreCorporal || ''}"></div>
    </div>

    <div class="form-section ${isLeite ? '' : 'hidden'}" id="section-leite">
      <h2>Produção leiteira</h2>
      <div class="field"><label>Lactação oficial (kg de leite)</label><input type="number" id="f-lactacao" value="${a.lactacaoOficial || ''}" placeholder="Ex: 8363" step="1"></div>
      <div class="field" style="margin-top:4px;"><label>Controle leiteiro mensal</label></div>
      <div class="add-row-btn">
        <input type="date" id="f-controle-data" value="${new Date().toISOString().slice(0,10)}">
        <input type="number" id="f-controle-valor" placeholder="Litros/dia" step="0.1">
        <button class="btn btn-secondary" style="width:auto;padding:10px 14px;" id="btn-add-controle">Add</button>
      </div>
      <div style="margin-top:10px;">${controleHtml}</div>
    </div>

    <div class="form-section">
      <h2>Reprodução</h2>
      <div class="field"><label>Status reprodutivo</label><select id="f-repro">${reproOptions}</select></div>
      <div class="field"><label>Tipo de cobertura</label><select id="f-tipo-cobertura">${coberturaOptions}</select></div>
      <div class="field"><label>Touro ou embrião utilizado</label><input id="f-touro-embriao" value="${escAttr(a.touroOuEmbriao)}" placeholder="Ex: LLA NEMO 370 CAPELA DAY"></div>
      <div class="field-row">
        <div class="field"><label>Data da cobertura / IA / TE</label><input type="date" id="f-cobertura" value="${a.dataCobertura || ''}"></div>
        <div class="field"><label>Data do parto (se já pariu)</label><input type="date" id="f-parto" value="${a.dataParto || ''}"></div>
      </div>
      <div class="field"><label>Sexo do bezerro (se pariu)</label>
        <select id="f-sexo-bezerro">
          <option value="" ${!a.sexoBezerro ? 'selected' : ''}>—</option>
          <option value="Macho" ${a.sexoBezerro === 'Macho' ? 'selected' : ''}>Macho</option>
          <option value="Fêmea" ${a.sexoBezerro === 'Fêmea' ? 'selected' : ''}>Fêmea</option>
        </select>
      </div>
    </div>

    <div class="form-section">
      <h2>Sanidade</h2>
      <div class="add-row-btn">
        <input type="date" id="f-vacina-data" value="${new Date().toISOString().slice(0,10)}">
        <input id="f-vacina-nome" placeholder="Vacina / tratamento">
      </div>
      <input id="f-vacina-obs" placeholder="Observação (opcional)" style="width:100%;margin-top:8px;padding:10px 12px;border-radius:8px;border:1px solid var(--line);">
      <button class="btn btn-secondary" style="margin-top:8px;" id="btn-add-vacina">Adicionar registro sanitário</button>
      <div style="margin-top:10px;">${vacinasHtml}</div>
    </div>

    <div class="form-section">
      <h2>Localização e manejo</h2>
      <div class="field-row">
        <div class="field"><label>Fazenda</label><input id="f-fazenda" value="${escAttr(a.fazenda)}"></div>
        <div class="field"><label>Lote (pasto/manejo)</label><input id="f-lote" value="${escAttr(a.lote)}"></div>
      </div>
      <div class="field"><label>Pasto atual</label><input id="f-pasto" value="${escAttr(a.pastoAtual)}"></div>
    </div>

    <div class="form-section">
      <h2>Lote de venda / leilão</h2>
      <div class="field-row">
        <div class="field"><label>Número do lote</label><input id="f-lote-venda" value="${escAttr(a.loteVenda)}" placeholder="Ex: 12"></div>
        <div class="field"><label>Tipo de oferta</label><input id="f-oferta-tipo" value="${escAttr(a.ofertaTipo)}" placeholder="Ex: IND"></div>
      </div>
    </div>

    <div class="form-section">
      <h2>Status comercial</h2>
      <div class="field-row">
        <div class="field"><label>Status</label><select id="f-status">${statusOptions}</select></div>
        <div class="field"><label>Valor estimado (R$)</label><input type="number" id="f-valor" value="${a.valorEstimado || ''}" step="0.01"></div>
      </div>
    </div>

    <div class="form-section">
      <h2>Observações</h2>
      <textarea id="f-obs" placeholder="Anotações gerais sobre o animal">${esc(a.observacoes)}</textarea>
    </div>

    <div class="btn-row">
      ${!a._isNew ? `<button class="btn btn-danger" id="btn-excluir">Excluir</button>` : ''}
      <button class="btn btn-primary" id="btn-salvar">Salvar</button>
    </div>
  `;

  // --- bind form events ---
  document.getElementById('segmented-tipo').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-tipo]');
    if (!btn) return;
    a.tipoProducao = btn.dataset.tipo;
    renderForm();
  });

  document.getElementById('btn-add-photo').addEventListener('click', () => cameraInput.click());
  cameraInput.onchange = async () => {
    const file = cameraInput.files[0];
    if (!file) return;
    toast('Processando foto…');
    try {
      const dataUrl = await resizeImage(file);
      a.fotos = a.fotos || [];
      a.fotos.push(dataUrl);
      renderForm();
    } catch (err) { toast('Não foi possível carregar a foto.'); }
    cameraInput.value = '';
  };
  mainEl.querySelectorAll('.photo-remove').forEach(btn => {
    btn.addEventListener('click', () => { a.fotos.splice(Number(btn.dataset.i), 1); renderForm(); });
  });

  document.getElementById('btn-add-peso').addEventListener('click', () => {
    const data = document.getElementById('f-peso-data').value;
    const peso = parseFloat(document.getElementById('f-peso-valor').value);
    if (!data || !peso) { toast('Informe data e peso.'); return; }
    a.pesagens = a.pesagens || [];
    a.pesagens = a.pesagens.filter(p => p.data !== data);
    a.pesagens.push({ data, peso });
    renderForm();
  });
  mainEl.querySelectorAll('[data-del-peso]').forEach(el => {
    el.addEventListener('click', () => { a.pesagens = a.pesagens.filter(p => p.data !== el.dataset.delPeso); renderForm(); });
  });

  if (isLeite) {
    document.getElementById('btn-add-controle').addEventListener('click', () => {
      const data = document.getElementById('f-controle-data').value;
      const litros = parseFloat(document.getElementById('f-controle-valor').value);
      if (!data || !litros) { toast('Informe data e litros.'); return; }
      a.controleLeiteiro = a.controleLeiteiro || [];
      a.controleLeiteiro = a.controleLeiteiro.filter(c => c.data !== data);
      a.controleLeiteiro.push({ data, litros });
      renderForm();
    });
    mainEl.querySelectorAll('[data-del-controle]').forEach(el => {
      el.addEventListener('click', () => { a.controleLeiteiro = a.controleLeiteiro.filter(c => c.data !== el.dataset.delControle); renderForm(); });
    });
  }

  document.getElementById('btn-add-vacina').addEventListener('click', () => {
    const data = document.getElementById('f-vacina-data').value;
    const nome = document.getElementById('f-vacina-nome').value.trim();
    const obs = document.getElementById('f-vacina-obs').value.trim();
    if (!data || !nome) { toast('Informe data e nome da vacina/tratamento.'); return; }
    a.vacinas = a.vacinas || [];
    a.vacinas.push({ data, nome, obs });
    renderForm();
  });
  mainEl.querySelectorAll('[data-del-vacina]').forEach(el => {
    el.addEventListener('click', () => { a.vacinas.splice(Number(el.dataset.delVacina), 1); renderForm(); });
  });

  if (!a._isNew) {
    document.getElementById('btn-excluir').addEventListener('click', async () => {
      if (!confirm('Excluir este animal do registro? Essa ação não pode ser desfeita.')) return;
      await dbDelete(a.id);
      state.animais = state.animais.filter(x => x.id !== a.id);
      state.view = 'lista';
      toast('Animal excluído.');
      render();
    });
  }

  document.getElementById('btn-salvar').addEventListener('click', async () => {
    a.nome = document.getElementById('f-nome').value.trim();
    a.brinco = document.getElementById('f-brinco').value.trim();
    a.sexo = document.getElementById('f-sexo').value;
    a.dataNascimento = document.getElementById('f-nascimento').value;
    a.categoria = document.getElementById('f-categoria').value;
    a.composicaoRacial = document.getElementById('f-composicao').value.trim();
    a.pai = document.getElementById('f-pai').value.trim();
    a.mae = document.getElementById('f-mae').value.trim();
    a.plantel = document.getElementById('f-plantel').value.trim();
    a.rendimentoCarcaca = parseFloat(document.getElementById('f-rendimento').value) || 50;
    a.escoreCorporal = document.getElementById('f-escore').value;
    if (isLeite) {
      a.lactacaoOficial = document.getElementById('f-lactacao').value;
    }
    a.statusReprodutivo = document.getElementById('f-repro').value;
    a.tipoCobertura = document.getElementById('f-tipo-cobertura').value;
    a.touroOuEmbriao = document.getElementById('f-touro-embriao').value.trim();
    a.dataCobertura = document.getElementById('f-cobertura').value;
    a.dataParto = document.getElementById('f-parto').value;
    a.sexoBezerro = document.getElementById('f-sexo-bezerro').value;
    a.fazenda = document.getElementById('f-fazenda').value.trim();
    a.lote = document.getElementById('f-lote').value.trim();
    a.pastoAtual = document.getElementById('f-pasto').value.trim();
    a.loteVenda = document.getElementById('f-lote-venda').value.trim();
    a.ofertaTipo = document.getElementById('f-oferta-tipo').value.trim();
    a.status = document.getElementById('f-status').value;
    a.valorEstimado = document.getElementById('f-valor').value;
    a.observacoes = document.getElementById('f-obs').value.trim();
    a.updatedAt = new Date().toISOString();
    delete a._isNew;

    await dbPut(a);
    state.animais = state.animais.filter(x => x.id !== a.id);
    state.animais.push(a);
    state.detalheId = a.id;
    state.view = 'detalhe';
    toast('Animal salvo.');
    render();
  });
}

/* ---------------- Detalhe view ---------------- */
function renderDetalhe() {
  const a = state.animais.find(x => x.id === state.detalheId);
  if (!a) { state.view = 'lista'; render(); return; }

  const isLeite = a.tipoProducao === 'Leite';
  const peso = pesoAtual(a);
  const arrobas = calcArrobas(peso, a.rendimentoCarcaca);
  const gmd = calcGMD(a);
  const previsaoParto = calcPrevisaoParto(a.dataCobertura);
  const foto = a.fotos && a.fotos[0];
  const ultCtrl = ultimoControleLeiteiro(a);

  const pesagensHtml = (a.pesagens || []).slice().sort((x, y) => y.data.localeCompare(x.data))
    .map(p => `<div class="kv-row"><span class="k">${fmtDate(p.data)}</span><span class="v">${p.peso} kg</span></div>`).join('')
    || `<div style="color:var(--ink-soft);font-size:0.85rem;">Nenhuma pesagem registrada.</div>`;

  const controleHtml = (a.controleLeiteiro || []).slice().sort((x, y) => y.data.localeCompare(x.data))
    .map(c => `<div class="kv-row"><span class="k">${fmtDate(c.data)}</span><span class="v">${c.litros} L/dia</span></div>`).join('')
    || `<div style="color:var(--ink-soft);font-size:0.85rem;">Nenhum controle leiteiro registrado.</div>`;

  const vacinasHtml = (a.vacinas || []).slice().sort((x, y) => y.data.localeCompare(x.data))
    .map(v => `<div class="kv-row"><span class="k">${fmtDate(v.data)} — ${esc(v.nome)}</span><span class="v">${esc(v.obs || '')}</span></div>`).join('')
    || `<div style="color:var(--ink-soft);font-size:0.85rem;">Nenhum registro sanitário.</div>`;

  const statBoxes = isLeite ? `
      <div class="stat-box"><div class="v">${ultCtrl ? ultCtrl.litros + ' L' : '—'}</div><div class="l">Último controle leiteiro</div></div>
      <div class="stat-box"><div class="v">${a.lactacaoOficial ? a.lactacaoOficial + ' kg' : '—'}</div><div class="l">Lactação oficial</div></div>
      <div class="stat-box"><div class="v">${idadeStr(a.dataNascimento)}</div><div class="l">Idade</div></div>
      <div class="stat-box"><div class="v">${esc(a.composicaoRacial || '—')}</div><div class="l">Composição racial</div></div>
    ` : `
      <div class="stat-box"><div class="v">${peso ? peso + ' kg' : '—'}</div><div class="l">Peso atual</div></div>
      <div class="stat-box"><div class="v">${arrobas ? arrobas.toFixed(2) + ' @' : '—'}</div><div class="l">Arrobas estimadas</div></div>
      <div class="stat-box"><div class="v">${gmd !== null ? gmd.toFixed(2) + ' kg/dia' : '—'}</div><div class="l">GMD (ganho médio diário)</div></div>
      <div class="stat-box"><div class="v">${idadeStr(a.dataNascimento)}</div><div class="l">Idade</div></div>
    `;

  mainEl.innerHTML = `
    ${foto ? `<img class="detail-hero" src="${foto}">` : `<div class="detail-hero placeholder">🐄</div>`}
    <div class="name-row" style="margin-bottom:2px;">
      <span class="detail-title">${esc(a.nome || 'Sem nome')}</span>
      ${a.brinco ? `<span class="tag-badge" style="margin-left:8px;">${esc(a.brinco)}</span>` : ''}
      <span class="badge-tipo badge-${a.tipoProducao || 'Corte'}">${a.tipoProducao || 'Corte'}</span>
    </div>
    <span class="status-pill status-${a.status}">${a.status}</span>

    <div class="stat-grid">${statBoxes}</div>

    <div class="form-section">
      <h2>Identificação</h2>
      <div class="kv-row"><span class="k">Sexo</span><span class="v">${esc(a.sexo)}</span></div>
      <div class="kv-row"><span class="k">Categoria</span><span class="v">${esc(a.categoria)}</span></div>
      <div class="kv-row"><span class="k">Nascimento</span><span class="v">${fmtDate(a.dataNascimento)}</span></div>
      ${a.composicaoRacial ? `<div class="kv-row"><span class="k">Composição racial</span><span class="v">${esc(a.composicaoRacial)}</span></div>` : ''}
      ${a.pai ? `<div class="kv-row"><span class="k">Pai</span><span class="v">${esc(a.pai)}</span></div>` : ''}
      ${a.mae ? `<div class="kv-row"><span class="k">Mãe</span><span class="v">${esc(a.mae)}</span></div>` : ''}
      ${a.plantel ? `<div class="kv-row"><span class="k">Linhagem</span><span class="v">${esc(a.plantel)}</span></div>` : ''}
    </div>

    <div class="form-section">
      <h2>Histórico de peso</h2>
      ${pesagensHtml}
      <div class="kv-row"><span class="k">Rendimento de carcaça usado</span><span class="v">${a.rendimentoCarcaca || 50}%</span></div>
      ${a.escoreCorporal ? `<div class="kv-row"><span class="k">Escore corporal</span><span class="v">${a.escoreCorporal}/5</span></div>` : ''}
    </div>

    ${isLeite ? `
    <div class="form-section">
      <h2>Controle leiteiro</h2>
      ${controleHtml}
    </div>` : ''}

    <div class="form-section">
      <h2>Reprodução</h2>
      <div class="kv-row"><span class="k">Status</span><span class="v">${esc(a.statusReprodutivo || 'Não se aplica')}</span></div>
      ${a.touroOuEmbriao ? `<div class="kv-row"><span class="k">Touro/embrião utilizado</span><span class="v">${esc(a.touroOuEmbriao)}</span></div>` : ''}
      ${a.tipoCobertura ? `<div class="kv-row"><span class="k">Tipo de cobertura</span><span class="v">${esc(a.tipoCobertura)}</span></div>` : ''}
      ${a.dataCobertura ? `<div class="kv-row"><span class="k">Data da cobertura</span><span class="v">${fmtDate(a.dataCobertura)}</span></div>` : ''}
      ${previsaoParto && a.statusReprodutivo !== 'Parida' ? `<div class="kv-row"><span class="k">Previsão de parto</span><span class="v">${fmtDate(previsaoParto)}</span></div>` : ''}
      ${a.dataParto ? `<div class="kv-row"><span class="k">Data do parto</span><span class="v">${fmtDate(a.dataParto)}</span></div>` : ''}
      ${a.sexoBezerro ? `<div class="kv-row"><span class="k">Sexo do bezerro</span><span class="v">${esc(a.sexoBezerro)}</span></div>` : ''}
    </div>

    <div class="form-section">
      <h2>Sanidade</h2>
      ${vacinasHtml}
    </div>

    <div class="form-section">
      <h2>Localização</h2>
      <div class="kv-row"><span class="k">Fazenda</span><span class="v">${esc(a.fazenda || '—')}</span></div>
      <div class="kv-row"><span class="k">Lote (manejo)</span><span class="v">${esc(a.lote || '—')}</span></div>
      <div class="kv-row"><span class="k">Pasto atual</span><span class="v">${esc(a.pastoAtual || '—')}</span></div>
    </div>

    ${(a.loteVenda || a.ofertaTipo) ? `
    <div class="form-section">
      <h2>Lote de venda / leilão</h2>
      <div class="kv-row"><span class="k">Número do lote</span><span class="v">${esc(a.loteVenda || '—')}</span></div>
      <div class="kv-row"><span class="k">Tipo de oferta</span><span class="v">${esc(a.ofertaTipo || '—')}</span></div>
    </div>` : ''}

    ${a.valorEstimado ? `
    <div class="form-section">
      <h2>Comercial</h2>
      <div class="kv-row"><span class="k">Valor estimado</span><span class="v">R$ ${Number(a.valorEstimado).toLocaleString('pt-BR', {minimumFractionDigits:2})}</span></div>
    </div>` : ''}

    ${a.observacoes ? `
    <div class="form-section">
      <h2>Observações</h2>
      <div style="font-size:0.9rem;line-height:1.5;">${esc(a.observacoes)}</div>
    </div>` : ''}

    <div class="btn-row">
      <button class="btn btn-secondary" id="btn-editar">Editar</button>
    </div>
  `;

  document.getElementById('btn-editar').addEventListener('click', () => startEditar(a.id));
}

/* ---------------- Backup view ---------------- */
function renderBackup() {
  mainEl.innerHTML = `
    <div class="form-section">
      <h2>Exportar dados</h2>
      <p class="backup-note">Gera um arquivo com todo o seu rebanho (incluindo fotos). Guarde esse arquivo sempre que tiver acesso ao computador ou nuvem — é a sua cópia de segurança, já que os dados ficam apenas neste iPhone.</p>
      <button class="btn btn-primary" id="btn-export-json">Exportar backup completo (.json)</button>
      <div style="height:8px;"></div>
      <button class="btn btn-secondary" id="btn-export-csv">Exportar planilha (.csv, sem fotos)</button>
    </div>
    <div class="form-section">
      <h2>Importar dados</h2>
      <p class="backup-note">Restaura ou mescla um backup .json exportado anteriormente. Animais com o mesmo ID serão atualizados.</p>
      <input type="file" id="import-file" accept=".json" style="width:100%;">
    </div>
    <div class="form-section">
      <h2>Sobre este app</h2>
      <p class="backup-note">Todos os dados ficam salvos localmente neste aparelho, funcionando sem internet. Nada é enviado para nenhum servidor. Total de animais registrados: <b>${state.animais.length}</b>.</p>
    </div>
  `;

  document.getElementById('btn-export-json').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state.animais, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `rebanho-backup-${new Date().toISOString().slice(0,10)}.json`);
  });

  document.getElementById('btn-export-csv').addEventListener('click', () => {
    const cols = ['tipoProducao','nome','brinco','sexo','dataNascimento','categoria','composicaoRacial','pai','mae','plantel','pesoAtual_kg','arrobas','lactacaoOficial','statusReprodutivo','touroOuEmbriao','dataCobertura','dataParto','fazenda','lote','pastoAtual','loteVenda','ofertaTipo','status','valorEstimado','observacoes'];
    const rows = state.animais.map(a => {
      const peso = pesoAtual(a);
      const arrobas = calcArrobas(peso, a.rendimentoCarcaca);
      const vals = [a.tipoProducao, a.nome, a.brinco, a.sexo, a.dataNascimento, a.categoria, a.composicaoRacial, a.pai, a.mae, a.plantel, peso || '', arrobas ? arrobas.toFixed(2) : '', a.lactacaoOficial, a.statusReprodutivo, a.touroOuEmbriao, a.dataCobertura, a.dataParto, a.fazenda, a.lote, a.pastoAtual, a.loteVenda, a.ofertaTipo, a.status, a.valorEstimado, a.observacoes];
      return vals.map(v => `"${(v ?? '').toString().replace(/"/g,'""')}"`).join(',');
    });
    const csv = [cols.join(','), ...rows].join('\r\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `rebanho-planilha-${new Date().toISOString().slice(0,10)}.csv`);
  });

  document.getElementById('import-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const dados = JSON.parse(text);
      if (!Array.isArray(dados)) throw new Error('formato inválido');
      await dbBulkPut(dados);
      state.animais = await dbGetAll();
      toast(`${dados.length} animal(is) importado(s).`);
      state.view = 'lista';
      render();
    } catch (err) {
      toast('Arquivo inválido. Verifique se é um backup .json gerado por este app.');
    }
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename;
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ---------------- Catálogo (PDF) view ---------------- */
function buildComentario(a) {
  const partes = [];
  const composicao = a.composicaoRacial ? ` ${a.composicaoRacial}` : '';
  let abertura = `${a.categoria || ''}${composicao}`.trim();
  if (a.pai || a.mae) abertura += `, filho(a) de ${a.pai || '—'} x ${a.mae || '—'}`;
  partes.push(abertura + '.');

  if (a.tipoProducao === 'Leite') {
    if (a.lactacaoOficial) partes.push(`Lactação oficial: ${a.lactacaoOficial} kg/leite.`);
    const ult = ultimoControleLeiteiro(a);
    if (ult) partes.push(`Último controle leiteiro: ${ult.litros} L/dia (${fmtDate(ult.data)}).`);
  }

  const previsao = calcPrevisaoParto(a.dataCobertura);
  if (a.statusReprodutivo === 'Prenhez confirmada') {
    partes.push(`Prenhez confirmada${a.touroOuEmbriao ? ' do touro/embrião ' + a.touroOuEmbriao : ''}${previsao ? ', com previsão de parto para ' + fmtMesAno(previsao) : ''}.`);
  } else if (a.statusReprodutivo === 'Inseminada (sem prenhez confirmada)') {
    partes.push(`Inseminada (sem prenhez confirmada)${a.touroOuEmbriao ? ' do touro ' + a.touroOuEmbriao : ''}${previsao ? ', com previsão de parto para ' + fmtMesAno(previsao) : ''}.${a.dataCobertura ? ' Data da IA: ' + fmtDate(a.dataCobertura) + '.' : ''}`);
  } else if (a.statusReprodutivo === 'Parida') {
    partes.push(`Parida${a.sexoBezerro ? ' de ' + a.sexoBezerro.toLowerCase() : ''}${a.dataParto ? ' em ' + fmtDate(a.dataParto) : ''}${a.touroOuEmbriao ? ', do touro ' + a.touroOuEmbriao : ''}.`);
  }

  if (a.observacoes) partes.push(a.observacoes);
  return partes.join(' ');
}

function renderCatalogo() {
  const lista = state.animais.slice().sort((a, b) => (a.loteVenda || '').localeCompare(b.loteVenda || '', undefined, { numeric: true }));

  if (state.catalogoSelecionados.size === 0 && lista.length > 0 && !state._catalogoTouched) {
    lista.forEach(a => state.catalogoSelecionados.add(a.id));
  }

  const rows = lista.map(a => {
    const foto = a.fotos && a.fotos[0];
    const checked = state.catalogoSelecionados.has(a.id) ? 'checked' : '';
    return `
      <div class="check-row" data-id="${a.id}">
        <input type="checkbox" ${checked} data-check="${a.id}">
        ${foto ? `<img class="ct-thumb" src="${foto}">` : `<div class="ct-thumb" style="display:flex;align-items:center;justify-content:center;">🐄</div>`}
        <div class="ct-info">
          <div class="n">${a.loteVenda ? 'Lote ' + esc(a.loteVenda) + ' — ' : ''}${esc(a.nome || 'Sem nome')}</div>
          <div class="m">${esc(a.categoria || '')} · ${a.tipoProducao || 'Corte'}</div>
        </div>
      </div>`;
  }).join('') || `<div class="empty-state"><div class="big">Nenhum animal cadastrado</div><div>Cadastre animais para poder gerar um catálogo.</div></div>`;

  mainEl.innerHTML = `
    <div class="form-section">
      <h2>Dados do catálogo</h2>
      <div class="field"><label>Título</label><input id="cat-titulo" value="${escAttr(state.catalogoMeta.titulo)}"></div>
      <div class="field"><label>Data / horário do evento</label><input id="cat-data" value="${escAttr(state.catalogoMeta.data)}" placeholder="Ex: 31 de Maio, Domingo 09h"></div>
      <div class="field"><label>Informações de contato</label><textarea id="cat-contato" placeholder="Ex: João (67) 99999-0000">${esc(state.catalogoMeta.contato)}</textarea></div>
    </div>

    <div class="form-section">
      <h2>Animais no catálogo (${state.catalogoSelecionados.size} selecionado(s))</h2>
      <div class="btn-row" style="margin-bottom:10px;">
        <button class="btn btn-secondary" id="btn-select-all">Selecionar todos</button>
        <button class="btn btn-secondary" id="btn-select-none">Limpar seleção</button>
      </div>
      ${rows}
    </div>

    <div class="btn-row">
      <button class="btn btn-primary" id="btn-gerar-pdf">Gerar catálogo em PDF</button>
    </div>
  `;

  document.getElementById('cat-titulo').addEventListener('input', (e) => state.catalogoMeta.titulo = e.target.value);
  document.getElementById('cat-data').addEventListener('input', (e) => state.catalogoMeta.data = e.target.value);
  document.getElementById('cat-contato').addEventListener('input', (e) => state.catalogoMeta.contato = e.target.value);

  mainEl.querySelectorAll('[data-check]').forEach(chk => {
    chk.addEventListener('change', () => {
      state._catalogoTouched = true;
      const id = chk.dataset.check;
      if (chk.checked) state.catalogoSelecionados.add(id); else state.catalogoSelecionados.delete(id);
      const header = mainEl.querySelectorAll('h2')[1];
      if (header) header.textContent = `Animais no catálogo (${state.catalogoSelecionados.size} selecionado(s))`;
    });
  });

  document.getElementById('btn-select-all').addEventListener('click', () => {
    state._catalogoTouched = true;
    lista.forEach(a => state.catalogoSelecionados.add(a.id));
    renderCatalogo();
  });
  document.getElementById('btn-select-none').addEventListener('click', () => {
    state._catalogoTouched = true;
    state.catalogoSelecionados.clear();
    renderCatalogo();
  });

  document.getElementById('btn-gerar-pdf').addEventListener('click', () => gerarCatalogoPDF(lista.filter(a => state.catalogoSelecionados.has(a.id))));
}

function gerarCatalogoPDF(animais) {
  if (!window.jspdf) { toast('Biblioteca de PDF não carregou. Tente reabrir o app.'); return; }
  if (animais.length === 0) { toast('Selecione ao menos um animal.'); return; }

  toast('Gerando PDF…');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;

  // ---- Capa ----
  doc.setFillColor(43, 66, 31);
  doc.rect(0, 0, pageW, pageH, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text(state.catalogoMeta.titulo || 'Catálogo', pageW / 2, pageH / 2 - 60, { align: 'center' });
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  if (state.catalogoMeta.data) doc.text(state.catalogoMeta.data, pageW / 2, pageH / 2 - 20, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`${animais.length} animal(is) neste catálogo`, pageW / 2, pageH / 2 + 10, { align: 'center' });
  if (state.catalogoMeta.contato) {
    doc.setFontSize(11);
    const linhas = doc.splitTextToSize(state.catalogoMeta.contato, pageW - margin * 2);
    doc.text(linhas, pageW / 2, pageH - 90, { align: 'center' });
  }

  // ---- Uma página por animal ----
  animais.forEach((a) => {
    doc.addPage();
    let y = margin;

    // cabeçalho do lote
    doc.setFillColor(51, 66, 31);
    doc.rect(0, 0, pageW, 46, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    const cabecalho = `LOTE: ${a.loteVenda || '—'}   ${(a.tipoProducao || 'Corte').toUpperCase()}   OFERTA: ${a.ofertaTipo || 'IND'}`;
    doc.text(cabecalho, margin, 29);

    y = 46 + 26;
    doc.setTextColor(43, 38, 32);

    // foto
    const foto = a.fotos && a.fotos[0];
    const imgW = 170, imgH = 170;
    if (foto) {
      try { doc.addImage(foto, 'JPEG', margin, y, imgW, imgH); } catch (e) {}
    } else {
      doc.setDrawColor(200, 195, 165);
      doc.rect(margin, y, imgW, imgH);
    }

    const textX = margin + imgW + 24;
    let ty = y + 16;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(a.nome || 'Sem nome', textX, ty);
    ty += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    if (a.brinco) { doc.text(`Registro: ${a.brinco}`, textX, ty); ty += 15; }
    if (a.pai || a.mae) { doc.text(`${a.pai || '—'} x ${a.mae || '—'}`, textX, ty); ty += 15; }
    doc.text(`${a.categoria || ''}${a.composicaoRacial ? ' ' + a.composicaoRacial : ''}`, textX, ty); ty += 15;
    doc.text(`NASCIMENTO: ${fmtDate(a.dataNascimento)}`, textX, ty); ty += 15;
    doc.text(`SEXO: ${a.sexo || '—'}`, textX, ty); ty += 15;

    y = y + imgH + 24;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('COMENTÁRIOS:', margin, y);
    y += 16;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    const comentario = buildComentario(a);
    const linhas = doc.splitTextToSize(comentario, pageW - margin * 2);
    doc.text(linhas, margin, y);
  });

  const filename = `catalogo-${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(filename);
  toast('Catálogo gerado.');
}

/* ---------------- Service worker (offline) ---------------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}

init();
