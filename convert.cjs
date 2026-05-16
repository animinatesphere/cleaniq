const fs = require('fs');
const marked = require('marked');

const mdPath = 'C:/Users/HP/.gemini/antigravity/brain/13ee3f1b-4a89-44ad-ba08-66eae60c5b3d/WORKER_APP_DOCS.md';
const md = fs.readFileSync(mdPath, 'utf8');

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Worker App Docs</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; color: #333; }
h1, h2, h3 { color: #111; }
code { background: #f4f4f4; padding: 2px 5px; border-radius: 4px; }
pre { background: #f4f4f4; padding: 15px; border-radius: 8px; overflow-x: auto; }
pre code { background: none; padding: 0; }
</style>
</head>
<body>
${marked.parse(md)}
<script>
  window.onload = () => window.print();
</script>
</body>
</html>`;

fs.writeFileSync('c:/Users/HP/cleaniq/WORKER_APP_DOCS.html', html);
console.log('HTML file created successfully.');
