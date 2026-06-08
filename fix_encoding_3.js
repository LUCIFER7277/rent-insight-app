const fs = require('fs');
const path = require('path');

const replacements = {
    'ðŸ †': '🏆',
    'ðŸ“…': '📅',
    'ðŸ  ': '🏠',
    'ðŸ›¡ï¸ ': '🛡️',
    'ðŸ›¡️': '🛡️',
    'ðŸŽ“': '🎓',
    'ðŸ’¼': '💼',
    'ðŸ‘¤': '👤',
    'ðŸŽ‰': '🎉',
    'ðŸ¥‡': '🥇',
    'ðŸ¥ˆ': '🥈',
    'ðŸ¥‰': '🥉',
    'ðŸ ¢': '🏢',
    'ðŸ ˜ï¸ ': '🏘️',
    'ðŸ ˜️': '🏘️',
    'ðŸ —ï¸ ': '🏗️',
    'ðŸ —️': '🏗️',
    'ðŸ ¡': '🏡',
    'ðŸ› ï¸ ': '🛏️',
    'ðŸ› ️': '🛏️',
    'ðŸš€': '🚀',
    'ðŸ—“ï¸ ': '🗓️',
    'ðŸ—“️': '🗓️',
    'ðŸ” ': '🔍',
    'ðŸ“±': '📱',
    'ðŸŒ±': '🌱',
    'ðŸš‡': '🚇',
    'ðŸ‘¨': '👨',
    'ðŸ‘©': '👩',
    'ðŸ’Ž': '💎',
    'ðŸ’¸': '💸',
    'ðŸŽ°': '🎰',
    'ðŸ“¸': '📸',
    'ðŸ’¬': '💬',
    'âœˆï¸ ': '✈️',
    'âœˆ️': '✈️',
    'ðŸ ¦': '🏦',
    'ðŸš€': '🚀',
    'ðŸ’»': '💻',
    'ðŸŒ³': '🌳',
    'ðŸŒŠ': '🌊',
    'ðŸ º': '🍺',
    'ðŸ ­': '🏭',
    'ðŸ¤ ': '🤝',
    'â˜•': '☕',
    'ðŸ”¥': '🔥',
    'ðŸ“ ': '📍',
    'ðŸ§®': '🧮',
    'ðŸ¤‘': '🤑',
    'ðŸ™Œ': '🙌',
    'ðŸ¥³': '🥳',
    'ðŸŽ ': '🎁'
};

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    for (const [bad, good] of Object.entries(replacements)) {
        if (content.includes(bad)) {
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
            }
        }
    }
}

walkDir(path.join(__dirname, 'frontend', 'src'));
console.log('Done Phase 3');
