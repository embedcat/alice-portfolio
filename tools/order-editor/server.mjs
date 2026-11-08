import http from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { openStore, Conflict } from './store.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const args = process.argv.slice(2);
let port = 1314, hugo = process.env.HUGO_BINARY || 'hugo';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port') port = Number(args[++i]);
  else if (args[i] === '--hugo') hugo = args[++i];
  else throw new Error(`Неизвестный аргумент: ${args[i]}`);
}
if (!Number.isInteger(port) || port < 1 || port > 65535 || !hugo) throw new Error('Проверьте --port и --hugo.');
const output = await mkdtemp(path.join(tmpdir(), 'alice-order-'));
const origin = `http://127.0.0.1:${port}`;
const token = randomBytes(24).toString('hex');
let store, busy = false;

async function build() {
  console.log('Подготовка миниатюр и текущего порядка через Hugo…');
  await new Promise((resolve, reject) => {
    const child = spawn(hugo, ['--config', 'config.yaml,tools/order-editor/hugo.yaml', '--destination', output,
      '--baseURL', `${origin}/`, '--cleanDestinationDir'], { cwd: root, stdio: 'inherit', windowsHide: true });
    child.on('error', () => reject(new Error('Не удалось запустить Hugo. Установите Hugo extended ≥ 0.166.0 или укажите --hugo "путь к hugo.exe".')));
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`Hugo завершился с кодом ${code}.`)));
  });
  store = await openStore(root, JSON.parse(await readFile(path.join(output, 'order-editor.json'), 'utf8')));
}

const json = (res, status, value) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(value)); };
async function body(req) {
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1_000_000) throw new Error('Слишком большой запрос.');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'");
  if (req.headers.host !== `127.0.0.1:${port}`) return json(res, 403, { error: 'Откройте редактор по локальному адресу из терминала.' });
  try {
    const url = new URL(req.url, origin);
    if (req.method === 'GET' && url.pathname === '/api/state') return json(res, 200, { ...store.state(), token, capabilities: { captions: true } });
    if (req.method === 'POST' && ['/api/save', '/api/reload'].includes(url.pathname)) {
      if (req.headers.origin !== origin || req.headers['x-editor-token'] !== token) return json(res, 403, { error: 'Обновите страницу редактора.' });
      if (busy) return json(res, 409, { error: 'Дождитесь завершения предыдущего действия.' });
      busy = true;
      try {
        if (url.pathname === '/api/reload') { await build(); return json(res, 200, store.state()); }
        return json(res, 200, await store.save(await body(req)));
      } finally { busy = false; }
    }
    if (req.method !== 'GET') return json(res, 405, { error: 'Метод не поддерживается.' });
    const ui = { '/': 'index.html', '/app.js': 'app.js', '/drag.js': 'drag.js', '/style.css': 'style.css' };
    let file;
    if (ui[url.pathname]) file = path.join(here, ui[url.pathname]);
    else if (url.pathname.startsWith('/images/')) {
      file = await realpath(path.resolve(output, '.' + decodeURIComponent(url.pathname)));
      if (!file.startsWith(output + path.sep)) return json(res, 404, { error: 'Файл не найден.' });
    } else return json(res, 404, { error: 'Файл не найден.' });
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.webp': 'image/webp' };
    const bytes = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(bytes);
  } catch (error) {
    json(res, error instanceof Conflict ? 409 : error.code === 'ENOENT' ? 404 : 400, { error: error.message });
  }
});

async function cleanup() { await rm(output, { recursive: true, force: true }); }
try {
  await build();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  console.log(`\nРедактор работ: ${origin}/\nСохранение записывает порядок и подписи выбранного раздела. Остановка: Ctrl+C.`);
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close(async () => { await cleanup(); process.exit(0); }));
} catch (error) {
  console.error(error.message);
  await cleanup();
  process.exitCode = 1;
}
