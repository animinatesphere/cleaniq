const fs = require('fs');

const file = 'src/pages/Services.jsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('const cleanKey =')) {
  content = content.replace(
    /const Services = \(\) => {/g,
    'const cleanKey = (str) => (str || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();\n\nconst Services = () => {'
  );
}

content = content.replace(
  /ratesObj\[service\.name\.trim\(\)\] = service\.rate;/g,
  'ratesObj[cleanKey(service.name)] = service.rate;'
);

content = content.replace(
  /dynamicRates\["([^"]+)"\.trim\(\)\]/g,
  'dynamicRates[cleanKey("$1")]'
);

fs.writeFileSync(file, content);
console.log('Fixed Services.jsx');
