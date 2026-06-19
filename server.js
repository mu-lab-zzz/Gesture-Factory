const http = require('http');
const fs = require('fs');
const path = require('path');
const port = 3333;
const mime = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml' };
http.createServer((req, res) => {
    let fp = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    fs.readFile(fp, (err, data) => {
        if (err) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(200, { 'Content-Type': mime[path.extname(fp)] || 'text/plain' });
        res.end(data);
    });
}).listen(port, () => console.log('Server running on port ' + port));
