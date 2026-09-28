const fs = require('fs');
const path = require('path');

const dir = 'f:/prepmate frontend+server/PrepMate-backend/server/data/raw_papers';
const files = [
  'joa_it_2021_technical.txt', 
  'joa_it_2022_technical.txt', 
  'joa_it_2023_technical.txt', 
  'joa_it_2024_technical.txt', 
  'joa_it_2025_technical.txt'
];

let allRecords = [];

files.forEach(file => {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const lines = content.split('\n');
  lines.forEach(line => {
    const match = line.trim().match(/^((?:19|20)\d{2})\s*[,|:-]\s*(.+)$/);
    if (match) {
      allRecords.push({
        year: Number(match[1]),
        question: match[2].trim()
      });
    }
  });
});

fs.writeFileSync('f:/prepmate frontend+server/PrepMate-backend/server/data/sampleQuestionPapers.json', JSON.stringify(allRecords, null, 2));
console.log('Successfully wrote ' + allRecords.length + ' technical questions to sampleQuestionPapers.json');
