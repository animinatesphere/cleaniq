const fs = require('fs');

const file = 'src/pages/Booking.jsx';
let content = fs.readFileSync(file, 'utf8');

// Add cleanKey if not present
if (!content.includes('const cleanKey =')) {
  content = content.replace(
    /const Booking = \(\) => {/g,
    'const cleanKey = (str) => (str || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();\n\nconst Booking = () => {'
  );
}

// 1. Populating ratesObj
content = content.replace(
  /ratesObj\[service\.name\.trim\(\)\] = service\.rate;/g,
  'ratesObj[cleanKey(service.name)] = service.rate;'
);

// 2. Lookups
content = content.replace(
  /dynamicRates\[formData\.serviceType\.trim\(\)\]/g,
  'dynamicRates[cleanKey(formData.serviceType)]'
);

content = content.replace(
  /dynamicRates\[name\.trim\(\)\]/g,
  'dynamicRates[cleanKey(name)]'
);

content = content.replace(
  /dynamicRates\[s\.id\.trim\(\)\]/g,
  'dynamicRates[cleanKey(s.id)]'
);

content = content.replace(
  /dynamicRates\[roomName\.trim\(\)\]/g,
  'dynamicRates[cleanKey(roomName)]'
);

fs.writeFileSync(file, content);
console.log('Fixed Booking.jsx');
