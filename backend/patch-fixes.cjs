const fs = require('fs');
const file = 'src/modules/owner/routes.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'doc.propertyIds = owner.propertyIds;\n      doc.isDedicated = true;\n      doc.tier = "standard";',
  '(doc as any).propertyIds = owner.propertyIds;\n      (doc as any).isDedicated = true;\n      (doc as any).tier = "standard";'
);

code = code.replace(/pg\.prices\[type\]/g, '(pg.prices as any)[type]');

fs.writeFileSync(file, code);
