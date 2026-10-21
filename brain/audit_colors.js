const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./app');
const patterns = [
  /text-white\b/g,
  /text-black\b/g,
  /text-neutral-\d+/g,
  /bg-neutral-\d+/g,
  /border-neutral-\d+/g,
  /text-gray-\d+/g,
  /bg-gray-\d+/g,
  /border-gray-\d+/g,
  /text-zinc-\d+/g,
  /bg-zinc-\d+/g,
  /border-zinc-\d+/g,
  /text-slate-\d+/g
];

const fileStats = [];

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const counts = {};
  let total = 0;
  patterns.forEach(p => {
    const matches = content.match(p);
    if (matches) {
      counts[p.toString()] = matches.length;
      total += matches.length;
    }
  });
  if (total > 0) {
    fileStats.push({ file: f.replace(/\\/g, '/'), total, counts });
  }
});

fileStats.sort((a, b) => b.total - a.total);
console.log(JSON.stringify(fileStats.slice(0, 15), null, 2));
