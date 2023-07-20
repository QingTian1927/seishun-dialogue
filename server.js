const express = require('express');
const path = require('path');
const app = express();
const port = 6969;

const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, "routes/index.html"));
    console.log(`[+] 1 new connection: ${req.ip}`);
});

app.get("/greetings", (req, res) => {
    res.sendFile(path.join(publicPath, "routes/greetings.html"));
});

app.listen(port, () => {
    console.log(`[I] Seishun Dialogue listening on port ${port}\n`);
});
