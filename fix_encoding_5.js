const fs = require('fs');
const path = require('path');

const replacements = {
    "ðŸ  ": "🏠",
    "ðŸ¤ ": "🤝",
    "ðŸ ¢": "🏢",
    "ðŸ” ": "🔍",
    "ðŸ ˜": "🏘️",
    "ðŸ —": "🏗️",
    "ðŸ ¡": "🏡",
    "ðŸ› ": "🛏️",
    "ðŸ †": "🏆",
    "ðŸŽ ": "🎁",
    "ðŸ ¦": "🏦",
    "â”€": "─",
    "â€”": "—",
    "âœ“": "✓",
    "â˜…": "★",
    "âœ…": "✅",
    "â† ": "←",
    "âš”": "⚔",
    "âš¡": "⚡",
    "ðŸ“¥": "📥",
    "ðŸ”—": "🔗",
    "ðŸ‘‹": "👋",
    "ðŸ˜´": "😴",
    "ðŸ’³": "💳",
    "ðŸ“ ": "📍",
    "ðŸ º": "🍺",
    "ðŸ ­": "🏭",
    "ðŸ“Š": "📊",
    "ðŸ“±": "📱",
    "ðŸ›¡️": "🛡️",
    "ðŸ›¡ï¸ ": "🛡️"
};

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Use split and join for exact literal string replacement across the entire content
    for (const [bad, good] of Object.entries(replacements)) {
        if (content.includes(bad)) {
            content = content.split(bad).join(good);
            modified = true;
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed ${filePath.split(path.sep).pop()}`);
    }
}

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && file !== 'node_modules' && file !== '.git') {
            processDir(fullPath);
        } else if (stat.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx'))) {
            try {
                fixFile(fullPath);
            } catch (e) {}
        }
    }
}

processDir(path.join(__dirname, 'frontend', 'src'));
console.log('Done Final Pass');
