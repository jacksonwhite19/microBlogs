const fs = require('fs');

const inputFile = 'journal.txt';
const outputFile = 'daily-notes.md';

function formatDate(dateObj) {
  const d = new Date(dateObj);
  if (isNaN(d)) return 'UnknownDate';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}${dd}${yyyy}`;
}

function tryParseDate(str) {
  const parsed = Date.parse(str.trim());
  return isNaN(parsed) ? null : new Date(parsed);
}

// Fallback: file last modified date
const fileStats = fs.statSync(inputFile);
const fallbackDate = fileStats.mtime;

// Read input file
const path = require('path');
const journalPath = path.resolve(__dirname, 'journal.txt');
const content = fs.readFileSync(journalPath, 'utf8');

// Split into entries
const entries = content.split(/^---$/m).map(e => e.trim()).filter(e => e.length > 0);

// Intro text
let markdown = `# Daily Notes

This is a dumping ground to record some of my daily notes/thoughts about projects I’m working on. Completely uncategorized and unedited.

`;

entries.forEach((entry) => {
  const lines = entry.split('\n').map(line => line.trim()).filter(Boolean);

  if (lines.length === 0) return;

  const title = lines[0]; // Always the summary
  let date = fallbackDate;
  let bodyStartIndex = 1;

  // Check if line 2 is a date
  if (lines.length > 1) {
    const possibleDate = tryParseDate(lines[1]);
    if (possibleDate) {
      date = possibleDate;
      bodyStartIndex = 2;
    }
  }

  const dateFormatted = formatDate(date);
  const body = lines.slice(bodyStartIndex).join('\n').trim();

  markdown += `<details>\n<summary>${title} - ${dateFormatted}</summary>\n\n${body}\n\n</details>\n\n`;
});

// Write output file
fs.writeFileSync(outputFile, markdown, 'utf8');
console.log(`✅ Parsed ${entries.length} entries and wrote to ${outputFile}`);
