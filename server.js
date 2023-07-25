const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');

const path = require('path');
const fs = require('fs/promises')

const app = express();
const port = 6969;
const publicPath = path.join(__dirname, 'public');

app.use(compression());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(publicPath));

app.get('/', (req, res) => {
    res.status(200).sendFile(getPublicPath('routes/index.html'));
    console.log(`[+] 1 new connection: ${req.ip}`);
});

app.get('/greetings', (req, res) => {
    res.status(200).sendFile(getPublicPath('routes/greetings.html'));
});

app.post('/dashboard', (req, res) => {
    console.log('[P] ', req.body);
    listDir('database').then(
        (entries) => {
            const logincode = req.body.logincode;
            if (entries.includes(logincode)) {
                res.send(`${logincode}: OK`);
            } else {
                res.send(`${logincode}: NOT FOUND`);
            }
        },
        (error) => {
            console.error('[X] Failed to access database: ', error);
            res.status(500).sendFile(getPublicPath('routes/server-error.html'));
        }
    );
});

app.post('/signup', (req, res) => {
    res.send(req.body);
});

app.all('*', (req, res) => {
    res.status(404).sendFile(getPublicPath('routes/notfound.html'));
});

app.listen(port, () => {
    console.log(`[I] Seishun Dialogue listening on port ${port}\n`);
});

function getPublicPath(rel_path) {
    return path.join(publicPath, rel_path);
}

async function listDir(path) {
    return (await fs.readdir(path, { withFileTypes: true }))
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
}