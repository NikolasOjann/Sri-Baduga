const fs = require('fs');
const path = require('path');

function walk(dir) {
    fs.readdirSync(dir).forEach(f => {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) {
            walk(p);
        } else if (p.endsWith('.jsx')) {
            let c = fs.readFileSync(p, 'utf8');
            let original = c;
            
            // Replace strings like 'http://192.168.100.204:3001/api/...'
            c = c.replace(/'http:\/\/192\.168\.100\.204:3001([^']*)'/g, "('http://' + window.location.hostname + ':3001$1')");
            
            // Replace template literals like `http://192.168.100.204:3001/api/...`
            c = c.replace(/`http:\/\/192\.168\.100\.204:3001([^`]+)`/g, "`http://${window.location.hostname}:3001$1`");
            
            // Replace bare URLs like http://192.168.100.204:3001
            c = c.replace(/http:\/\/192\.168\.100\.204:3001/g, "http://${window.location.hostname}:3001");

            if (c !== original) {
                fs.writeFileSync(p, c);
                console.log('Fixed', p);
            }
        }
    });
}

walk('src');
console.log('Done');
