const fs = require('fs');
const path = require('path');

// These are specific sequences that are clearly double-encoded UTF-8 emojis/symbols.
// E.g. ðŸ is \xF0 \x9F which is the start of many 4-byte emojis.
function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // We'll look for anything starting with ð (which is \xC3\xB0 in utf8, but \xF0 in latin1)
    // Actually, in JS strings, 'ð' is \u00F0.
    // 'Ÿ' is \u0178.
    // Let's use a regex to find all sequences of characters that are corrupted.
    // Specifically `ðŸ` followed by two other characters in the extended latin range.
    const regex = /ðŸ[\x80-\xFF\u0100-\u01FF\u2000-\u20FF\u0000-\u007F]{2}/g;
    
    let match;
    const replacements = new Map();
    while ((match = regex.exec(content)) !== null) {
        const corrupted = match[0];
        try {
            // Try to decode back
            const decoded = Buffer.from(corrupted, 'latin1').toString('utf8');
            if (decoded && !decoded.includes('\uFFFD')) {
                replacements.set(corrupted, decoded);
            }
        } catch(e) {}
    }

    // Also look for `ðŸ` followed by 1 char for 3-byte emojis maybe? But emojis are 4 bytes.
    // Also look for 3-byte characters like `â‚¹` which starts with `â` (\u00E2).
    const regex3 = /â[\x80-\xFF\u0100-\u01FF\u2000-\u20FF]{2}/g;
    while ((match = regex3.exec(content)) !== null) {
        const corrupted = match[0];
        try {
            const decoded = Buffer.from(corrupted, 'latin1').toString('utf8');
            if (decoded && !decoded.includes('\uFFFD')) {
                replacements.set(corrupted, decoded);
            }
        } catch(e) {}
    }

    // specific manual fallback map for the ones that didn't match cleanly:
    const manualMap = {
        'ðŸ“¥': '📥',
        'ðŸ  ': '🏠',
        'ðŸ¤ ': '🤝',
        'ðŸ †': '🏆',
        'ðŸ”—': '🔗',
        'ðŸ‘‹': '👋',
        'ðŸ˜´': '😴',
        'ðŸ’³': '💳',
        'ðŸ“ ': '📍',
        'ðŸ º': '🍺',
        'ðŸ ­': '🏭',
        'ðŸ ¡': '🏡',
        'ðŸ“Š': '📊',
        'ðŸ ¢': '🏢',
        'ðŸ ˜️': '🏘️',
        'ðŸ —️': '🏗️',
        'ðŸ› ️': '🛏️',
        'ðŸ” ': '🔍',
        'ðŸ“±': '📱',
        'ðŸ›¡️': '🛡️'
    };

    for (const [bad, good] of Object.entries(manualMap)) {
        if (content.includes(bad)) {
            content = content.split(bad).join(good);
            modified = true;
        }
    }

    // Apply regex found ones
    for (const [bad, good] of replacements.entries()) {
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

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && file !== 'node_modules' && file !== '.git') {
            processDir(fullPath);
        } else if (stat.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx'))) {
            fixFile(fullPath);
        }
    }
}

processDir(path.join(__dirname, 'frontend', 'src'));
console.log('Done Phase 4');
