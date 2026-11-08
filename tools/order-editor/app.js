import { attachLiveDrag } from './drag.js';

const $ = selector => document.querySelector(selector);
let sections = [], active, token, busy = false, editingId, supportsCaptions = false;
const drafts = new Map(), history = new Map();
const ids = section => section.items.map(item => item.id);
const current = () => sections.find(section => section.id === active);
const cleanDraft = section => ({ order: ids(section), captions: {} });
const dirty = id => {
  const draft = drafts.get(id);
  return JSON.stringify(draft.order) !== JSON.stringify(ids(sections.find(s => s.id === id))) || Object.keys(draft.captions).length > 0;
};
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
    drafts.set(section.id, { order: appendNew && previous ? [...order.filter(id => previous.has(id)), ...order.filter(id => !previous.has(id))] : order, captions: {} });
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
      message(dirty(active) ? 'Есть несохранённые изменения.' : 'Все изменения сохранены в файлах проекта.');
    };
    return button;
  }));
  $('#summary').textContent = `${current().items.length} работ · ${dirty(active) ? 'есть изменения' : 'без изменений'}`;
  $('#save').disabled = busy || !dirty(active);
  $('#reset').disabled = busy || !dirty(active);
  $('#undo').disabled = busy || history.get(active).length === 0;
  $('#reload').disabled = busy;
}
function changeDraft(next, text) {
  if (busy || JSON.stringify(next) === JSON.stringify(drafts.get(active))) return;
  history.get(active).push(structuredClone(drafts.get(active)));
  drafts.set(active, next); render(); message(text);
}
function reorder(order) {
  changeDraft({ ...drafts.get(active), order }, 'Порядок изменён. Нажмите «Сохранить изменения», чтобы записать его в файлы.');
}
function openCaption(id) {
  if (busy) return;
  if (!supportsCaptions) { message('Для редактирования подписей перезапустите утилиту через start.cmd и обновите страницу.', true); return; }
  const item = current().items.find(item => item.id === id);
  if (!item) return;
  editingId = id;
  const caption = drafts.get(active).captions[id] ?? item.alt;
  $('#caption-preview').src = item.image; $('#caption-preview').alt = caption;
  $('#caption-text').value = caption; $('#caption-text').setCustomValidity('');
  $('#caption-dialog').showModal(); $('#caption-text').focus();
}
function render() {
  renderControls();
  const columns = Array.from({ length: 3 }, () => { const column = document.createElement('div'); column.className = 'gallery-column'; return column; });
  const items = new Map(current().items.map(item => [item.id, item]));
  const { order, captions } = drafts.get(active);
  order.forEach((id, index) => {
    const item = items.get(id), card = document.createElement('article');
    card.dataset.id = id; card.draggable = false;
    const caption = captions[id] ?? item.alt;
    card.tabIndex = 0; card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Изменить подпись. Позиция ${index + 1}. ${caption}`);
    card.onkeydown = event => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); openCaption(id); } };
    const img = document.createElement('img');
    img.src = item.image; img.alt = caption; img.width = item.width; img.height = item.height; img.loading = 'lazy'; img.draggable = false;
    card.append(img);
    columns[index % 3].append(card);
  });
  $('#gallery').replaceChildren(...columns);
}
attachLiveDrag($('#gallery'), { getOrder: () => drafts.get(active).order, isBusy: () => busy, commit: reorder, reset: render, tap: openCaption });
$('#caption-cancel').onclick = () => $('#caption-dialog').close();
$('#caption-text').oninput = () => $('#caption-text').setCustomValidity('');
$('#caption-form').onsubmit = event => {
  event.preventDefault();
  const text = $('#caption-text').value.trim();
  if (!text || text.length > 2000) { $('#caption-text').setCustomValidity('Введите подпись от 1 до 2000 символов.'); $('#caption-text').reportValidity(); return; }
  const next = structuredClone(drafts.get(active));
  const original = current().items.find(item => item.id === editingId).alt;
  if (text === original) delete next.captions[editingId];
  else next.captions[editingId] = text;
  changeDraft(next, 'Подпись изменена. Нажмите «Сохранить изменения», чтобы записать её в файл.');
  $('#caption-dialog').close();
};
$('#undo').onclick = () => { drafts.set(active, history.get(active).pop()); render(); message('Последнее изменение отменено.'); };
$('#reset').onclick = () => { changeDraft(cleanDraft(current()), 'Восстановлены сохранённые порядок и подписи.'); };
$('#save').onclick = async () => {
  busy = true; renderControls(); message('Сохраняю изменения…');
  try {
    const result = await request('/api/save', { section: active, ...drafts.get(active), revision: current().revision });
    const saved = result.sections.find(section => section.id === active);
    sections = sections.map(section => section.id === active ? saved : section);
    drafts.set(active, cleanDraft(saved)); history.set(active, []);
    message(`Изменения сохранены. Обновлено файлов: ${result.changedFiles}.`);
  } catch (error) { message(error.message, true); }
  finally { busy = false; render(); }
};
$('#reload').onclick = async () => {
  if (anyDirty() && !confirm('Обновление списка сбросит несохранённые изменения во всех разделах. Продолжить?')) return;
  busy = true; renderControls(); message('Hugo обновляет список работ и миниатюры…');
  try {
    initialize(await request('/api/reload', {}), true);
    message(anyDirty() ? 'Список обновлён. Новые работы добавлены в конец; сохраните изменения.' : 'Список обновлён из файлов проекта.');
  }
  catch (error) { message(error.message, true); }
  finally { busy = false; render(); }
};
window.addEventListener('beforeunload', event => {
  const editing = $('#caption-dialog').open && $('#caption-text').value !== (drafts.get(active).captions[editingId] ?? current().items.find(item => item.id === editingId).alt);
  if (anyDirty() || editing) { event.preventDefault(); event.returnValue = ''; }
});
try {
  const result = await request('/api/state'); token = result.token; supportsCaptions = result.capabilities?.captions === true; initialize(result); render();
  message(supportsCaptions ? 'Перетаскивайте работы или нажмите на изображение для изменения подписи.' : 'Для редактирования подписей перезапустите утилиту через start.cmd и обновите страницу.', !supportsCaptions);
} catch (error) { message(error.message, true); }
