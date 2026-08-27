#!/usr/bin/env node
// Regenerates index.html from src/ and data/.
//
//   node build.js           write index.html
//   node build.js --check   rebuild in memory and fail if index.html is stale
//
// The site stays a single self-contained file: the data is inlined here at build
// time, so index.html still opens by double-click with no server and no fetch.

const fs = require('node:fs');
const path = require('node:path');

const ROOT = __dirname;
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8');
const load = (name) => JSON.parse(read('data', name));

const problems = [];
const complain = (msg) => problems.push(msg);

// ---------------------------------------------------------------- assemble

const meta = load('meta.json');

// Key order is part of the output; build it explicitly rather than spreading.
const D = {
  posts: load('posts.json'),
  series: meta.series,
  intro: meta.intro,
  hl: meta.hl,
  extra: load('extra.json'),
  photos: load('photos.json'),
  cats: meta.cats,
  wall: load('wall.json'),
};

// ---------------------------------------------------------------- validate

// Mirrors how app.js builds image paths (see fig, lbSrc, card and album).
const img = (i) => 'i' + String(i).padStart(3, '0') + '.jpg';
const xtra = (k) => 'x' + String(k).padStart(3, '0') + '.jpg';

const dir = (name) => new Set(fs.readdirSync(path.join(ROOT, name)));
const IMAGES = dir('images');
const THUMBS = dir('thumbs');

const referenced = new Set();
const need = (file, where) => {
  referenced.add(file);
  if (!IMAGES.has(file)) complain(`missing images/${file} (referenced by ${where})`);
  if (!THUMBS.has(file)) complain(`missing thumbs/${file} (referenced by ${where})`);
};

D.posts.forEach((p) => (p.m || []).forEach((m) => need(img(m.i), `post ${p.id}`)));
D.photos.forEach((p, i) => need(img(p.i), `photos[${i}]`));
D.extra.forEach((x, i) => need(xtra(x.k), `extra[${i}]`));

for (const file of IMAGES) {
  if (!referenced.has(file)) complain(`images/${file} is not referenced by any data`);
}

// Referential integrity.
const byId = new Set(D.posts.map((p) => p.id));
const cats = new Set(D.cats.map((c) => c.k));

D.hl.forEach((id) => byId.has(id) || complain(`hl: no such post ${id}`));
D.series.forEach((s) =>
  s.ids.forEach((id) => byId.has(id) || complain(`series "${s.name}": no such post ${id}`)),
);
D.photos.forEach((p, i) => {
  // p.p === null means the photo has no post — those are the ones listed in orphans.
  if (p.p !== null && !byId.has(p.p)) complain(`photos[${i}]: no such post ${p.p}`);
  (p.c || []).forEach((c) => cats.has(c) || complain(`photos[${i}]: no such category ${c}`));
});

// Image indices are positional: app.js turns them straight into iNNN/xNNN filenames, so a
// gap or a duplicate means a photo was dropped or two records point at the same file.
const continuous = (label, ids) => {
  const seen = new Set();
  const dupes = new Set();
  ids.forEach((i) => (seen.has(i) ? dupes.add(i) : seen.add(i)));
  if (dupes.size) complain(`${label}: duplicate indices ${[...dupes].sort((a, b) => a - b).join(', ')}`);
  const lo = Math.min(...ids);
  const hi = Math.max(...ids);
  if (lo !== 0) complain(`${label}: indices start at ${lo}, expected 0`);
  const gaps = [];
  for (let i = lo; i <= hi; i++) if (!seen.has(i)) gaps.push(i);
  if (gaps.length) complain(`${label}: missing indices ${gaps.join(', ')} in the run ${lo}\u2013${hi}`);
};

// Every iNNN belongs to photos; a post's m[] must draw from that same pool.
continuous('photos', D.photos.map((p) => p.i));
continuous('extra', D.extra.map((x) => x.k));

const inAlbum = new Set(D.photos.map((p) => p.i));
D.posts.forEach((p) =>
  (p.m || []).forEach((m, j) => {
    if (!inAlbum.has(m.i)) complain(`post ${p.id} m[${j}]: image ${m.i} is not in photos`);
  }),
);

// w/h drive the figure aspect ratio; without them the page reflows as images load.
const dimension = (label, o) => {
  ['w', 'h'].forEach((k) => {
    if (!Number.isInteger(o[k]) || o[k] <= 0) {
      complain(`${label}: ${k} is ${JSON.stringify(o[k])}, expected a positive integer`);
    }
  });
};
D.posts.forEach((p) => (p.m || []).forEach((m, j) => dimension(`post ${p.id} m[${j}]`, m)));
D.extra.forEach((x, i) => dimension(`extra[${i}]`, x));
D.extra.forEach((x, i) =>
  (x.c || []).forEach((c) => cats.has(c) || complain(`extra[${i}]: no such category ${c}`)),
);

// README repeats the counts in prose and in the file table, and they have gone stale
// before. Every number the README claims must match what data/ actually holds.
const totals = {
  posts: D.posts.length,
  photos: D.photos.length,
  extra: D.extra.length,
  wall: D.wall.length,
  images: D.photos.length + D.extra.length,
};

const CLAIMS = [
  ['posts', /共 (\d+) 篇/g],
  ['posts', /(\d+) 篇正文/g],
  ['images', /(\d+) 张图片/g],
  ['images', /(\d+) 张原图/g],
  ['images', /(\d+) 张缩略图/g],
  ['photos', /(\d+) 张正文图片/g],
  ['photos', /正文 (\d+) 张/g],
  ['extra', /(\d+) 张「这四年啊」/g],
  ['extra', /「这四年啊」(\d+) 张/g],
  ['wall', /(\d+) 条留言板记录/g],
];

const readme = read('README.md');
CLAIMS.forEach(([key, pattern]) => {
  const found = [...readme.matchAll(pattern)];
  if (!found.length) {
    complain(`README.md no longer says "${pattern.source}" — the ${key} count check is dead`);
    return;
  }
  found.forEach((m) => {
    if (Number(m[1]) !== totals[key]) {
      complain(`README.md claims "${m[0].trim()}" but ${key} is ${totals[key]}`);
    }
  });
});

if (IMAGES.size !== totals.images) {
  complain(`images/ holds ${IMAGES.size} files but the data describes ${totals.images}`);
}

// Inlining safety: either sequence would end the script element early.
const json = JSON.stringify(D);
if (/<\/script/i.test(json)) complain('data contains "</script" and cannot be inlined');
if (json.includes('<!--')) complain('data contains "<!--" and cannot be inlined');

if (problems.length) {
  console.error(`build failed — ${problems.length} problem(s):`);
  problems.forEach((p) => console.error('  ' + p));
  process.exit(1);
}

// ------------------------------------------------------------------ render

const body = (file) => read('src', file).replace(/\n$/, '');

const parts = {
  styles: body('styles.css'),
  app: body('app.js'),
  data: `<script>const D=${json};</script>`,
  postCount: String(D.posts.length),
};

let html = read('src', 'template.html');
for (const [key, value] of Object.entries(parts)) {
  const token = `{{${key}}}`;
  if (!html.includes(token)) {
    console.error(`build failed — src/template.html has no ${token}`);
    process.exit(1);
  }
  html = html.split(token).join(value); // not .replace: $& and $1 are literal here
}

const out = path.join(ROOT, 'index.html');

if (process.argv.includes('--check')) {
  const current = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '';
  if (current === html) {
    console.log('index.html is up to date');
    process.exit(0);
  }
  console.error('index.html is stale — run `npm run build` and commit the result');
  console.error(`  committed: ${current.length} chars, rebuilt: ${html.length} chars`);
  process.exit(1);
}

fs.writeFileSync(out, html);
console.log(
  'built index.html — %d posts, %d photos, %d extra, %d wall, %s',
  D.posts.length, D.photos.length, D.extra.length, D.wall.length,
  (html.length / 1024).toFixed(0) + 'KB',
);
