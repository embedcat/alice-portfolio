import { createHash, randomUUID } from 'node:crypto';
import { readFile, writeFile, rename, unlink, readdir } from 'node:fs/promises';
import path from 'node:path';

const weightLine = /^(weight:[\t ]*)-?\d+(?=[\t ]*(?:#.*)?\r?$)/m;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

export class Conflict extends Error {}

// Never serialize YAML: preserve every byte outside the numeric weight value.
export function replaceWeight(bytes, weight) {
  const text = bytes.toString('utf8');
  if (!weightLine.test(text)) throw new Error('Не найдена строка weight с целым числом.');
  return Buffer.from(text.replace(weightLine, (_, prefix) => `${prefix}${weight}`));
}

export async function openStore(root, manifest) {
  const records = new Map();
  const sections = structuredClone(manifest.sections);
  for (const section of sections) {
    for (const item of section.items) {
      const file = path.resolve(root, 'content', item.id);
      const folder = path.resolve(root, 'content/work', section.id) + path.sep;
      if (!file.startsWith(folder) || !file.endsWith('.md')) throw new Error('Некорректный путь работы.');
      const bytes = await readFile(file);
      replaceWeight(bytes, item.weight); // Validate before showing the editor.
      records.set(item.id, { file, bytes });
    }
  }
  const revision = section => digest(Buffer.concat(section.items.map(item => records.get(item.id).bytes)));
  const state = () => ({ sections: sections.map(s => ({ ...s, revision: revision(s) })) });

  async function save({ section: id, order, revision: expected }) {
    const section = sections.find(s => s.id === id);
    if (!section || !Array.isArray(order) || order.some(x => typeof x !== 'string')) throw new Error('Некорректный раздел или порядок.');
    const ids = new Set(section.items.map(item => item.id));
    if (order.length !== ids.size || new Set(order).size !== ids.size || order.some(id => !ids.has(id))) {
      throw new Error('Список должен содержать каждую работу раздела ровно один раз.');
    }
    if (expected !== revision(section)) throw new Conflict('Порядок уже изменился. Обновите список работ.');
    const files = (await readdir(path.join(root, 'content/work', id))).filter(f => f.endsWith('.md') && f !== '_index.md');
    if (files.length !== ids.size || files.some(f => !ids.has(`work/${id}/${f}`))) {
      throw new Conflict('Состав раздела изменился. Обновите список работ.');
    }
    const changes = [];
    for (const [index, itemId] of order.entries()) {
      const record = records.get(itemId);
      if (!(await readFile(record.file)).equals(record.bytes)) {
        throw new Conflict('Файлы изменились вне редактора. Обновите список работ, чтобы не затереть изменения.');
      }
      const weight = (order.length - index) * 10;
      const bytes = replaceWeight(record.bytes, weight);
      if (!bytes.equals(record.bytes)) changes.push({ ...record, id: itemId, next: bytes, temp: `${record.file}.${randomUUID()}.tmp` });
    }
    const written = [];
    try {
      for (const change of changes) await writeFile(change.temp, change.next, { flag: 'wx' });
      for (const change of changes) {
        await rename(change.temp, change.file);
        written.push(change);
      }
    } catch (error) {
      for (const change of written.reverse()) await writeFile(change.file, change.bytes);
      throw error;
    } finally {
      await Promise.all(changes.map(change => unlink(change.temp).catch(() => {})));
    }
    const byId = new Map(section.items.map(item => [item.id, item]));
    section.items = order.map((itemId, index) => ({ ...byId.get(itemId), weight: (order.length - index) * 10 }));
    for (const change of changes) records.get(change.id).bytes = change.next;
    return { ...state(), changedFiles: changes.length };
  }
  return { state, save };
}
