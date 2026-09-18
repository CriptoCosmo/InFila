const fs = require('fs');

function extractAndReplace(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Admin.jsx remaining
    content = content.replace(/style=\{\{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 24 \}\}/g, 'className="admin-form-group"');

    // Dashboard.jsx remaining
    content = content.replace(/style=\{\{ marginBottom: 24 \}\}/g, 'className="mb-24"');
    content = content.replace(/style=\{\{ display: 'flex', flexDirection: 'column', gap: 16 \}\}/g, 'className="venue-list-cards"');
    content = content.replace(/className="card" style=\{\{ marginTop: 24 \}\}/g, 'className="card dashboard-mt"'); // Just in case it wasn't matched
    content = content.replace(/style=\{\{ marginTop: 24 \}\}/g, 'className="dashboard-mt"');
    content = content.replace(/style=\{\{ width: '100%' \}\}/g, 'className="w-100"');
    content = content.replace(/style=\{\{ margin: 0, color: 'var\(--grigio-testo\)', lineHeight: 1.4 \}\}/g, 'className="modal-desc"');

    // NewVenue.jsx remaining
    content = content.replace(/style=\{\{ marginTop: 24 \}\}/g, 'className="mt-24"');
    content = content.replace(/style=\{\{ color: 'var\(--terracotta\)' \}\}/g, 'className="text-terracotta"');
    content = content.replace(/style=\{\{ color: 'var\(--salvia\)' \}\}/g, 'className="text-salvia"');
    content = content.replace(/style=\{\{ background:'none', border:'none', color:'var\(--terracotta\)', textDecoration:'underline', cursor:'pointer', padding:0 \}\}/g, 'className="btn-link"');
    content = content.replace(/style=\{\{ marginTop: 16 \}\}/g, 'className="mt-16"');

    fs.writeFileSync(filePath, content, 'utf-8');
}

extractAndReplace('src/screens/Admin.jsx');
extractAndReplace('src/screens/Dashboard.jsx');
extractAndReplace('src/screens/NewVenue.jsx');
console.log("Done");
