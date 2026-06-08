const fs = require('fs');
const path = require('path');
function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}
walk('src').forEach(f => {
    let c = fs.readFileSync(f, 'utf8');
    let r = c.replace(/from\s+['"](.*)\.ts['"]/g, 'from "$1.js"').replace(/import\s+['"](.*)\.ts['"]/g, 'import "$1.js"');
    if (c !== r) {
        fs.writeFileSync(f, r);
        console.log('Fixed', f);
    }
});
console.log('Done');
