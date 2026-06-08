const fs = require('fs');
const path = require('path');

const replacements = {
    'â‚¹': '₹',
    'ðŸ’°': '💰',
    'ðŸŽ¯': '🎯',
    'ðŸ”‘': '🔑',
    'ðŸŽ ': '🎁',
    'â€¢': '•',
    'ðŸ  ': '🏠',
    'ðŸ“ ': '📍',
    'â‰¤': '≤',
    'ðŸ‘‘': '👑',
    'Â·': '·',
    'â€“': '–',
    'ðŸ¤ ': '🤝',
    'ðŸ”¥': '🔥'
};

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    for (const [bad, good] of Object.entries(replacements)) {
        if (content.includes(bad)) {
            // Using split.join to replace all occurrences globally
            content = content.split(bad).join(good);
            modified = true;
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed ${filePath}`);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && file !== 'node_modules' && file !== '.git') {
            walkDir(fullPath);
        } else if (stat.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx'))) {
            try {
                fixFile(fullPath);
            } catch (e) {
                console.error(`Error processing ${fullPath}:`, e.message);
            }
        }
    }
}

walkDir(path.join(__dirname, 'frontend', 'src'));
console.log('Done');
