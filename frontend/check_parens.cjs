const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/features/grades/pages/ReportCardsPage.jsx');
const c = fs.readFileSync(filePath, 'utf8');
const lines = c.split('\n');

let parenDepth = 0;
let inString = false;
let strChar = null;
let inTemplate = false;

for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  for (let j = 0; j < l.length; j++) {
    const ch = l[j];
    const prev = j > 0 ? l[j-1] : '';
    
    if (inTemplate) {
      if (ch === '`' && prev !== '\\') inTemplate = false;
      continue;
    }
    if (inString) {
      if (ch === strChar && prev !== '\\') inString = false;
      continue;
    }
    if (ch === '`') { inTemplate = true; continue; }
    if (ch === '"' || ch === "'") { inString = true; strChar = ch; continue; }
    if (ch === '(') parenDepth++;
    if (ch === ')') parenDepth--;
  }
  if (parenDepth !== 0) {
    console.log('Line', i+1, ': parens depth =', parenDepth, '->', l.trim().substring(0, 100));
  }
}
console.log('Final paren depth:', parenDepth);
