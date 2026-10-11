const fs = require('fs');
const path = require('path');

function walk(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          if (file.endsWith('.tsx') || file.endsWith('.ts')) {
             results.push(file);
          }
          if (!--pending) done(null, results);
        }
      });
    });
  });
}

walk(path.join(__dirname, 'app'), function(err, results) {
  if (err) throw err;
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/bg-\[#0A0F0D\]/g, 'bg-base');
    content = content.replace(/bg-\[#131A15\]/g, 'bg-card');
    content = content.replace(/bg-\[#1A221C\]/g, 'bg-card-hover');
    content = content.replace(/bg-\[#1A1A1A\]/g, 'bg-card-hover');
    content = content.replace(/border-\[#262626\]/g, 'border-border-theme');
    content = content.replace(/border-\[#FACC15\]/g, 'border-accent');
    content = content.replace(/text-\[#FACC15\]/g, 'text-accent');
    content = content.replace(/bg-\[#FACC15\]/g, 'bg-accent');
    content = content.replace(/focus:border-\[#FACC15\]/g, 'focus:border-accent');
    content = content.replace(/focus:ring-\[#FACC15\]/g, 'focus:ring-accent');
    content = content.replace(/hover:shadow-\[#FACC15\]/g, 'hover:shadow-accent');
    content = content.replace(/shadow-\[0_0_15px_rgba\(250,204,21,0\.1\)\]/g, 'shadow-[0_0_15px_var(--color-accent)]');
    fs.writeFileSync(file, content, 'utf8');
  });
  console.log('Done!');
});
