import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { openStore, replaceWeight, Conflict } from './store.mjs';

test('weight replacement preserves UTF-8 BOM, CRLF, comments and all other front matter', () => {
  const bytes = Buffer.from('\uFEFF---\r\nalt: "Изображение: описание"\r\nweight: -12 # порядок\r\nimages:\r\n- /images/a.jpg\r\n---\r\n');
  assert.equal(replaceWeight(bytes, 30).toString(), bytes.toString().replace('weight: -12', 'weight: 30'));
  assert.throws(() => replaceWeight(Buffer.from('---\nweight: invalid\n---'), 1));
});

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'alice-store-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'content/work/design'), { recursive: true });
  const manifest = { sections: [{ id: 'design', items: ['a', 'b', 'c'].map(name => ({ id: `work/design/${name}.md`, weight: 1 })) }] };
  for (const item of manifest.sections[0].items) await writeFile(path.join(root, 'content', item.id), `---\nweight: 1\nalt: "${item.id}"\n---\n`);
  const store = await openStore(root, manifest);
  const order = [...manifest.sections[0].items.map(i => i.id)].reverse();
  return { root, store, order, revision: store.state().sections[0].revision };
}

test('save assigns descending unique Hugo weights and rejects stale sessions', async t => {
  const { root, store, order, revision } = await fixture(t);
  const result = await store.save({ section: 'design', order, revision });
  assert.equal(result.changedFiles, 3);
  assert.deepEqual(result.sections[0].items.map(i => i.id), order);
  for (const [i, id] of order.entries()) assert.match(await readFile(path.join(root, 'content', id), 'utf8'), new RegExp(`weight: ${(3 - i) * 10}\\n`));
  await assert.rejects(store.save({ section: 'design', order, revision }), Conflict);
  assert.equal((await store.save({ section: 'design', order, revision: result.sections[0].revision })).changedFiles, 0);
});

test('duplicate, missing and foreign paths never write any files', async t => {
  const { root, store, order, revision } = await fixture(t);
  for (const invalid of [order.slice(1), [order[0], order[0], order[2]], ['../../config.yaml', ...order.slice(1)]]) {
    await assert.rejects(store.save({ section: 'design', order: invalid, revision }));
  }
  for (const id of order) assert.match(await readFile(path.join(root, 'content', id), 'utf8'), /weight: 1\n/);
});

test('external edits are detected before any write', async t => {
  const { root, store, order, revision } = await fixture(t);
  const changed = path.join(root, 'content', order.at(-1));
  await writeFile(changed, '---\nweight: 88\nalt: "Изменено автором"\n---\n');
  await assert.rejects(store.save({ section: 'design', order, revision }), Conflict);
  assert.match(await readFile(changed, 'utf8'), /weight: 88/);
  assert.match(await readFile(path.join(root, 'content', order[0]), 'utf8'), /weight: 1\n/);
});

test('added or removed work requires refresh', async t => {
  const { root, store, order, revision } = await fixture(t);
  const added = path.join(root, 'content/work/design/new.md');
  await writeFile(added, '---\nweight: 1\n---\n');
  await assert.rejects(store.save({ section: 'design', order, revision }), Conflict);
  await rm(added);
  await rm(path.join(root, 'content', order[0]));
  await assert.rejects(store.save({ section: 'design', order, revision }), Conflict);
});

test('Hugo rebuild reproduces saved order in desktop, mobile and slideshow', { skip: !process.env.HUGO_BINARY }, async t => {
  const root = await mkdtemp(path.join(tmpdir(), 'alice-hugo-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  await cp(path.join(repo, 'content'), path.join(root, 'content'), { recursive: true });
  const output = path.join(root, 'public');
  const build = () => execFileSync(process.env.HUGO_BINARY, ['--config', 'config.yaml,tools/order-editor/hugo.yaml', '--contentDir', path.join(root, 'content'), '--destination', output], { cwd: repo, windowsHide: true });
  build();
  const manifest = JSON.parse(await readFile(path.join(output, 'order-editor.json'), 'utf8'));
  assert.deepEqual(manifest.sections.map(s => s.items.length), [14, 23, 6, 19]);
  const store = await openStore(root, manifest);
  for (const section of store.state().sections) {
    const order = section.items.map(item => item.id).reverse();
    await store.save({ section: section.id, order, revision: section.revision });
  }
  build();
  const rebuilt = JSON.parse(await readFile(path.join(output, 'order-editor.json'), 'utf8'));
  for (const section of rebuilt.sections) {
    const expected = store.state().sections.find(s => s.id === section.id).items;
    assert.deepEqual(section.items.map(i => i.id), expected.map(i => i.id));
    const html = await readFile(path.join(output, `tags/${section.id}/index.html`), 'utf8');
    const sections = [...html.matchAll(/<section id="(desktop|mobile)"[\s\S]*?<\/section>/g)];
    assert.equal(sections.length, 2);
    for (const [, type] of sections) {
      const markup = sections.find(match => match[1] === type)[0];
      const thumbs = [...markup.matchAll(/<img\s[\s\S]*?>/g)].map(match => {
        const tag = match[0];
        return { image: tag.match(/src="([^"]+)"/)[1], index: Number(tag.match(/currentSlide\(\s*(\d+)\s*\)/)[1]) };
      }).sort((a, b) => a.index - b.index);
      assert.deepEqual(thumbs.map(i => i.image), expected.map(i => i.image));
    }
    const paths = [...html.matchAll(/class="slide[^\"]*"\s+path="([^"]+)"/g)].map(m => m[1]);
    assert.deepEqual(paths, expected.map(i => `/${path.posix.basename(i.id, '.md')}/`));
  }
});
