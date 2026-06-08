const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && file !== 'node_modules' && file !== '.git') {
            processDir(fullPath);
        } else if (stat.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx'))) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Regex to match "ðŸ" followed by exactly two characters in the \x80-\xFF or \u0100-\u01FF range
            const regex = /ðŸ[\x80-\xFF\u0100-\u01FF\u2000-\u20FF\u0000-\u007F]{2}/g;
            
            content = content.replace(regex, (match) => {
                try {
                    const decoded = Buffer.from(match, 'latin1').toString('utf8');
                    if (decoded && !decoded.includes('\uFFFD')) {
                        modified = true;
                        return decoded;
                    }
                } catch(e) {}
                return match; // fallback
            });

            // Fallback explicit regexes for spaces
            const fallbackMap = [
                { bad: /ðŸ  /g, good: '🏠' },
                { bad: /ðŸ¤ /g, good: '🤝' },
                { bad: /ðŸ ¢/g, good: '🏢' },
                { bad: /ðŸ” /g, good: '🔍' },
                { bad: /ðŸ ˜️?/g, good: '🏘️' },
                { bad: /ðŸ —️?/g, good: '🏗️' },
                { bad: /ðŸ ¡/g, good: '🏡' },
                { bad: /ðŸ› ️?/g, good: '🛏️' },
                { bad: /ðŸ †/g, good: '🏆' },
                { bad: /ðŸŽ /g, good: '🎁' },
                { bad: /ðŸ ¦/g, good: '🏦' },
                { bad: /ðŸ“¥/g, good: '📥' },
                { bad: /ðŸ”—/g, good: '🔗' },
                { bad: /ðŸ‘‹/g, good: '👋' },
                { bad: /ðŸ˜´/g, good: '😴' },
                { bad: /ðŸ’³/g, good: '💳' },
                { bad: /ðŸ“ /g, good: '📍' },
                { bad: /ðŸ º/g, good: '🍺' },
                { bad: /ðŸ ­/g, good: '🏭' },
                { bad: /ðŸ“Š/g, good: '📊' },
                { bad: /ðŸ“±/g, good: '📱' },
                { bad: /ðŸ›¡ï¸ /g, good: '🛡️' },
                { bad: /ðŸ›¡️?/g, good: '🛡️' },
            ];

            for (const {bad, good} of fallbackMap) {
                if (bad.test(content)) {
                    content = content.replace(bad, good);
                    modified = true;
                }
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Fixed ${fullPath.split(path.sep).pop()}`);
            }
        }
    }
}

processDir(path.join(__dirname, 'frontend', 'src'));
console.log('Done Regex Pass');
