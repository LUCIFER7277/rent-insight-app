const fs = require('fs');
const path = require('path');

// Regex to match sequences of typical corrupted UTF-8 (mostly 2-4 byte sequences starting with 0xC2-0xF4 read as latin1)
// These typically show up as characters in \x80-\xFF.
const corruptedRegex = /[\x80-\xFF]{2,}/g;

const replacements = new Map();

function collectCorruptedStrings(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let match;
    while ((match = corruptedRegex.exec(content)) !== null) {
        const corrupted = match[0];
        try {
            const fixed = Buffer.from(corrupted, 'latin1').toString('utf8');
            // If the fixed string doesn't contain the replacement character \uFFFD
            if (!fixed.includes('\uFFFD') && fixed.length < corrupted.length) {
                replacements.set(corrupted, fixed);
            }
        } catch (e) {
            // ignore
        }
    }
}

function processDir(dir, cb) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && file !== 'node_modules' && file !== '.git') {
            processDir(fullPath, cb);
        } else if (stat.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx'))) {
            cb(fullPath);
        }
    }
}

// Pass 1: Collect replacements safely
processDir(path.join(__dirname, 'frontend', 'src'), collectCorruptedStrings);

// Log replacements for debugging
console.log("Found replacements:");
for (const [bad, good] of replacements.entries()) {
    console.log(`"${bad}" -> "${good}"`);
}

// Pass 2: Apply replacements
function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Sort replacements by length descending to replace longest first (e.g. 4-byte emojis before 2-byte parts)
    const sortedBad = Array.from(replacements.keys()).sort((a, b) => b.length - a.length);

    for (const bad of sortedBad) {
        if (content.includes(bad)) {
            content = content.split(bad).join(replacements.get(bad));
            modified = true;
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed ${filePath}`);
    }
}

processDir(path.join(__dirname, 'frontend', 'src'), fixFile);
console.log('Done');
