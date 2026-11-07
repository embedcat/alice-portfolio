import { attachLiveDrag } from './drag.js';

const $ = selector => document.querySelector(selector);
let sections = [], active, token, busy = false;
const drafts = new Map(), history = new Map();
const ids = section => section.items.map(item => item.id);
const current = () => sections.find(section => section.id === active);
const dirty = id => JSON.stringify(drafts.get(id)) !== JSON.stringify(ids(sections.find(s => s.id === id)));
const anyDirty = () => sections.some(section => dirty(section.id));
function message(text, error = false) { $('#message').textContent = text; $('#message').classList.toggle('error', error); }

async function request(route, data) {
  const response = await fetch(route, data ? { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Editor-Token': token }, body: JSON.stringify(data) } : {});
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Не удалось выполнить действие.');
  return result;
}
function initialize(result, appendNew = false) {
  const known = new Map(sections.map(section => [section.id, new Set(ids(section))]));
  sections = result.sections;
  for (const section of sections) {
    const order = ids(section), previous = known.get(section.id);
    drafts.set(section.id, appendNew && previous ? [...order.filter(id => previous.has(id)), ...order.filter(id => !previous.has(id))] : order);
    history.set(section.id, []);
  }
  if (!sections.some(s => s.id === active)) active = sections[0].id;
}
function renderControls() {
  document.body.classList.toggle('busy', busy);
  $('#tabs').replaceChildren(...sections.map(section => {
    const button = document.createElement('button');
    button.textContent = section.title;
    button.setAttribute('aria-pressed', String(active === section.id));
    const count = document.createElement('small'); count.textContent = `${section.items.length}${dirty(section.id) ? ' •' : ''}`;
    button.append(count); button.disabled = busy;
    button.onclick = () => {
      active = section.id; render(); window.scrollTo(0, 0);
      message(dirty(active) ? 'Есть несохранённые изменения.' : 'Порядок сохранён в файлах проекта.');
    };
    return button;
  }));
  $('#summary').textContent = `${current().items.length} работ · ${dirty(active) ? 'есть изменения' : 'сохранённый порядок'}`;
  $('#save').disabled = busy || !dirty(active);
  $('#reset').disabled = busy || !dirty(active);
  $('#undo').disabled = busy || history.get(active).length === 0;
  $('#reload').disabled = busy;
}
function reorder(next) {
  if (busy || JSON.stringify(next) === JSON.stringify(drafts.get(active))) return;
  history.get(active).push([...drafts.get(active)]);
  drafts.set(active, next); render(); message('Порядок изменён. Нажмите «Сохранить порядок», чтобы записать его в файлы.');
}
function render() {
  renderControls();
  const columns = Array.from({ length: 3 }, () => { const column = document.createElement('div'); column.className = 'gallery-column'; return column; });
  const items = new Map(current().items.map(item => [item.id, item]));
  const order = drafts.get(active);
  order.forEach((id, index) => {
    const item = items.get(id), card = document.createElement('article');
    card.dataset.id = id; card.draggable = false;
    card.setAttribute('aria-label', `Позиция ${index + 1}. ${item.alt}`);
    const img = document.createElement('img');
    img.src = item.image; img.alt = item.alt; img.width = item.width; img.height = item.height; img.loading = 'lazy'; img.draggable = false;
    card.append(img);
    columns[index % 3].append(card);
  });
  $('#gallery').replaceChildren(...columns);
}
attachLiveDrag($('#gallery'), { getOrder: () => drafts.get(active), isBusy: () => busy, commit: reorder, reset: render });
$('#undo').onclick = () => { drafts.set(active, history.get(active).pop()); render(); message('Последнее перемещение отменено.'); };
$('#reset').onclick = () => { reorder(ids(current())); message('Восстановлен сохранённый порядок.'); };
$('#save').onclick = async () => {
  busy = true; renderControls(); message('Сохраняю веса…');
  try {
    const result = await request('/api/save', { section: active, order: drafts.get(active), revision: current().revision });
    const saved = result.sections.find(section => section.id === active);
    sections = sections.map(section => section.id === active ? saved : section);
    drafts.set(active, ids(saved)); history.set(active, []);
    message(`Порядок сохранён. Обновлено файлов: ${result.changedFiles}.`);
  } catch (error) { message(error.message, true); }
  finally { busy = false; render(); }
};
$('#reload').onclick = async () => {
  if (anyDirty() && !confirm('Обновление списка сбросит несохранённые изменения во всех разделах. Продолжить?')) return;
  busy = true; renderControls(); message('Hugo обновляет список работ и миниатюры…');
  try {
    initialize(await request('/api/reload', {}), true);
    message(anyDirty() ? 'Список обновлён. Новые работы добавлены в конец; сохраните порядок изменённых разделов.' : 'Список обновлён из файлов проекта.');
  }
  catch (error) { message(error.message, true); }
  finally { busy = false; render(); }
};
window.addEventListener('beforeunload', event => { if (anyDirty()) { event.preventDefault(); event.returnValue = ''; } });
try {
  const result = await request('/api/state'); token = result.token; initialize(result); render();
  message('Перетаскивайте работы, чтобы изменить порядок.');
} catch (error) { message(error.message, true); }
