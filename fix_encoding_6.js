const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // We will look for '\u00F0\u0178' (which is ðŸ) and the following 2 characters.
    // In Latin-1 interpretation of UTF-8, emojis start with \xF0 \x9F. 
    // \xF0 is ð (U+00F0)
    // \x9F is Ÿ (U+0178) in some encodings, but let's just find the exact sequence.
    // Actually \x9F is a control character in pure latin1, but Windows-1252 maps it to Ÿ (U+0178).
    // So the sequence in JS string is \u00F0 \u0178.
    
    // We replace it by extracting the 4 characters, turning them back into bytes, and decoding as UTF-8.
    // Since Windows-1252 mapped the bytes, we need to un-map them.
    function unmap(ch) {
        const code = ch.charCodeAt(0);
        if (code === 0x0178) return 0x9F; // Ÿ
        if (code === 0x20AC) return 0x80; // €
        if (code === 0x201A) return 0x82; // ‚
        if (code === 0x0192) return 0x83; // ƒ
        if (code === 0x201E) return 0x84; // „
        if (code === 0x2026) return 0x85; // …
        if (code === 0x2020) return 0x86; // †
        if (code === 0x2021) return 0x87; // ‡
        if (code === 0x02C6) return 0x88; // ˆ
        if (code === 0x2030) return 0x89; // ‰
        if (code === 0x0160) return 0x8A; // Š
        if (code === 0x2039) return 0x8B; // ‹
        if (code === 0x0152) return 0x8C; // Œ
        if (code === 0x017D) return 0x8E; // Ž
        if (code === 0x2018) return 0x91; // ‘
        if (code === 0x2019) return 0x92; // ’
        if (code === 0x201C) return 0x93; // “
        if (code === 0x201D) return 0x94; // ”
        if (code === 0x2022) return 0x95; // •
        if (code === 0x2013) return 0x96; // –
        if (code === 0x2014) return 0x97; // —
        if (code === 0x02DC) return 0x98; // ˜
        if (code === 0x2122) return 0x99; // ™
        if (code === 0x0161) return 0x9A; // š
        if (code === 0x203A) return 0x9B; // ›
        if (code === 0x0153) return 0x9C; // œ
        if (code === 0x017E) return 0x9E; // ž
        return code; // If it wasn't remapped, it's just the Latin-1 code
    }

    // Replace 4-byte emojis (starts with ðŸ)
    const regex4 = /\u00F0\u0178../g;
    content = content.replace(regex4, (match) => {
        const bytes = [unmap(match[0]), unmap(match[1]), unmap(match[2]), unmap(match[3])];
        const decoded = Buffer.from(bytes).toString('utf8');
        if (decoded && !decoded.includes('\uFFFD')) {
            modified = true;
            return decoded;
        }
        return match;
    });
    
    // Replace 3-byte characters (starts with â)
    const regex3 = /\u00E2../g;
    content = content.replace(regex3, (match) => {
        const bytes = [unmap(match[0]), unmap(match[1]), unmap(match[2])];
        const decoded = Buffer.from(bytes).toString('utf8');
        if (decoded && !decoded.includes('\uFFFD')) {
            modified = true;
            return decoded;
        }
        return match;
    });

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
console.log('Done Deep Scan Fix');
