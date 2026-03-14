const fs = require('fs');

try {
  const remote = fs.readFileSync('remote_dist/assets/index-czrsokrl.js', 'utf8');
  const local = fs.readFileSync('dist/assets/index-BOMDR8a4.js', 'utf8');

  // Find alphanumeric strings longer than 15 chars that look like sentences
  const regex = /[A-Z][a-z]+ [a-zA-Z0-9_ ,.!?'’"()\-]{15,}/g;
  
  const getStrings = (text) => {
    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push(match[0].trim());
    }
    return new Set(matches);
  };

  const remoteStrings = getStrings(remote);
  const localStrings = getStrings(local);

  // Find strings in LOCAL that are NOT in REMOTE
  const oldInLocal = [...localStrings].filter(s => !remoteStrings.has(s) && !s.includes('eagerState') && !s.includes('window.'));
  
  console.log(`Found ${oldInLocal.length} phrases in LOCAL that are NOT in REMOTE (potentially old).`);
  console.log('Top differences:', oldInLocal.slice(0, 30));
} catch (e) {
  console.error(e);
}