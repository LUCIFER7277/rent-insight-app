const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory() && file !== 'node_modules' && file !== '.git') {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            let idx = -1;
            while ((idx = content.indexOf('ðŸ', idx + 1)) !== -1) {
                const sub = content.substring(idx, idx + 4);
                console.log(`Found in ${fullPath.split(path.sep).pop()}: ${JSON.stringify(sub)}`);
            }
            let idx2 = -1;
            while ((idx2 = content.indexOf('â', idx2 + 1)) !== -1) {
                const sub = content.substring(idx2, idx2 + 3);
                // only print if it looks like corruption (not regular words)
                if (sub.charCodeAt(1) >= 128) {
                    console.log(`Found â in ${fullPath.split(path.sep).pop()}: ${JSON.stringify(sub)}`);
                }
            }
        }
    }
}

processDir(path.join(__dirname, 'frontend', 'src'));
