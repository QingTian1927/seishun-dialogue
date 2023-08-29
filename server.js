// * ------------ * //
// * DEPENDENCIES * //
// * ------------ * //

const express = require("express");
const compression = require("compression");
const path = require("path");
const fs = require("fs/promises")

// * ---------------- * //
// * GLOBAL VARIABLES * //
// * ---------------- * //

const app = express();
const port = 6969;
const titlePrefix = "Seishun Dialogue";
const publicPath = getAbsPath("public");
const databasePath = getAbsPath("database");

// * ------------ * //
// * APP SETTINGS * //
// * ------------ * //

app.set("view engine", "ejs");
app.set("views", getPublicPath("views"));

app.use(compression());
app.use(express.urlencoded({extended: true}));
app.use(express.static(publicPath));

// * ---------- * //
// * GET ROUTES * //
// * ---------- * //

app.get("/", async (req, res) => {
    res.status(200).render("index", {title: titlePrefix});
    await logEvent("home", `New connection from {${req.ip}}`);
});

app.get("/greetings", (req, res) => {
    res.status(200).render("greetings", {title: `${titlePrefix} - About Us`});
});

// * ----------- * //
// * POST ROUTES * //
// * ----------- * //

app.post("/dashboard", async (req, res) => {
    const code = req.body.logincode;
    try {
        if (await doesCodeExist(code)) {
            const paths = constructUserPaths(code);
            const userObj = await parseJSON(paths.userJson);
            await appendLineFile(paths.accessLog, `${unixTimestamp()}`);
            res.status(200).render("dashboard",
                {
                    username: userObj.username,
                    creation: userObj.creation,
                    title: `${titlePrefix} - Dashboard`
                }
            );
            await logEvent("logi", `User {${code}} logged in from {${req.ip}}`);
        } else {
            res.send(`${code}: NOT FOUND`);
        }
    }
    catch (err) {
        await serverError("Login system critical failure", err);
    }
});

app.post("/signup", async (req, res) => {
    try {
        await onUserSignUp(req, res);
    }
    catch (err) {
        await serverError("Sign up system critical failure", err);
    }
});

// * ------------------- * //
// * 404 CATCH-ALL ROUTE * //
// * ------------------- * //

app.all("*", (req, res) => {
    res.status(404).render("404", {title: `${titlePrefix} - Not Found`});
});

// * ----------- * //
// * SERVER INIT * //
// * ----------- * //

app.listen(port, async () => {
    await mkdirIfNotExists("database");
    await mkdirIfNotExists("logs");
    await mkdirIfNotExists("logs/errors");
    await mkdirIfNotExists("iptable");

    initTime = humanTimestamp();  // ! potentially dangerous shit?
    await logEvent("init", `Seishun Dialogue listening on port {${port}}`);
});

// * -------------- * //
// * SIGN UP SYSTEM * //
// * -------------- * //

async function onUserSignUp(req, res) {
    const ip = req.ip;
    const tablePath = path.join(__dirname, "iptable");
    const ipJson = path.join(tablePath, ip + ".json");

    const knownIPs = await listFiles(tablePath);
    const ipObj = await connectionStatus(ip, knownIPs, ipJson);

    const action = ipObj[0];
    const data = ipObj[1];

    if (action === "SUSPEND") {
        res.status(403).render("suspended", {
            unbanTime: data,
            title: `${titlePrefix} - Account Creation Suspended`
        });
        await logEvent("spam", `Suspended account creation from {${ip}}`);
        return;
    }

    const username = req.body.username;
    const code = await getUniqueCode();
    await createNewEntry(code, username);

    if (action === "WARN") {
        res.status(201).render("warning", {
            code: code,
            title: `${titlePrefix} - Suspension Warning`
        });
        await logEvent("warn", `User {${code}} registered from {${req.ip}}`);
    } else {
        res.status(201).render("signup", {
            code: code,
            title: `${titlePrefix} - Sign Up Successful`
        });
        await logEvent("sign", `User {${code}} registered from {${req.ip}}`);
    }

    data.accessed = unixTimestamp();
    data.accounts.push(code);
    await writeJSON(ipJson, data);

}

// * ------------------------- * //
// * GENERAL FILE IO FUNCTIONS * //
// * ------------------------- * //

function getPublicPath(dir) {
    return path.join(publicPath, dir);
}

function getAbsPath(dir) {
    return path.join(__dirname, dir);
}

async function listDirs(path) {
    return (await fs.readdir(path, {withFileTypes: true}))
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
}

async function listFiles(path) {
    return (await fs.readdir(path));
}

async function appendLineFile(path, content) {
    await fs.writeFile(path, `${content}\n`, {flag: "a"});
}

async function mkdirIfNotExists(dir) {
    if (!(await listDirs(__dirname)).includes(dir)) {
        const newDir = getAbsPath(dir);
        try {
            await fs.mkdir(newDir, {recursive: true});
        } catch (err) {
            await serverError("Cannot create directory", err);
        }
    }
}

async function parseJSON(jsonPath) {
    return JSON.parse(await fs.readFile(jsonPath, {encoding: "utf8"}));
}

async function writeJSON(jsonPath, data, mode = "w") {
    await fs.writeFile(jsonPath, JSON.stringify(data), {flags: mode});
}

// * ---------------------- * //
// * BASIC ANTI-SPAM SYSTEM * //
// * ---------------------- * //

function newIP(status) {
    return {
        accounts: [],
        accessed: unixTimestamp(),
        status: status,
    };
}

async function connectionStatus(ip, knownIPs, ipJson) {
    if (!knownIPs.includes(ip + ".json")) {
        return ["ALLOW", newIP("active")];
    }

    const ipObj = await parseJSON(ipJson);

    if (ipObj.status === "active") {
        if (ipObj.accounts.length >= 5) {
            for (const account of ipObj.accounts) {
                await deleteEntry(account);
            }
            return ["WARN", newIP("suspended")];
        }
        return ["ALLOW", ipObj];
    }

    if (ipObj.status === "suspended") {
        const banDuration = 6 * (60 * 60 * 1000);
        const bannedTime = ipObj.accessed;
        const unbanTime = bannedTime + banDuration;
        const currentTime = unixTimestamp();

        if (currentTime < unbanTime) {
            return ["SUSPEND", unbanTime];
        }
        ipObj.status = "active";
        return ["ALLOW", ipObj];
    }
}

// * ------------------------- * //
// * USER MANAGEMENT FUNCTIONS * //
// * ------------------------- * //

function constructUserPaths(code) {
    entryPath = path.join(databasePath, code);
    return {
        entryDir: entryPath,
        userJson: path.join(entryPath, "user.json"),
        accessLog: path.join(entryPath, "access.log"),
    };
}

function userObj(username) {
    return {
        username: username,
        creation: unixTimestamp()
    };
}

async function deleteEntry(code) {
    try {
        const entryDir = path.join(databasePath, code);
        await fs.rm(entryDir, {recursive: true, force: true});
        await logEvent("ioop", `Deleted entry {${code}}`);
    }
    catch (err) {
        await serverError(`Failed to delete entry {${code}}`, err);
    }
}

async function createNewEntry(code, username) {
    try {
        const user = userObj(username);
        const paths = constructUserPaths(code);
        const {entryDir, userJson, accessLog} = paths;

        await fs.mkdir(entryDir);
        await writeJSON(userJson, user);
        await fs.writeFile(accessLog, `${user.creation}\n`, {flag: "a"});
        await logEvent("ioop", `New entry created for {${code}}`);
    }
    catch (err) {
        await serverError("Failed to create new entry", err);
    }
}

// * ------------------------- * //
// * CODE GENERATION FUNCTIONS * //
// * ------------------------- * //

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

async function getRandomCode(length) {
    const charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let code = "";
    while (code.length < length) {
        const ranNum = getRandomInt(0, charSet.length - 1);
        code += charSet[ranNum];
    }
    return code;
}

async function getUniqueCode() {
    let code = await getRandomCode(8);
    while (await doesCodeExist(code)) {
        code = await getRandomCode(8);
    }
    return code;
}

async function doesCodeExist(code) {
    return (await listDirs(databasePath)).includes(code);
}

// * ------------------------ * //
// * SERVER LOGGING FUNCTIONS * //
// * ------------------------ * //

function unixTimestamp() {
    return new Date().getTime();
}

function humanTimestamp() {
    return new Date().toISOString();
}

async function logEvent(flag, message) {
    flag = flag.toUpperCase();

    const logFile = path.join(__dirname, `logs/${initTime}.log`);
    const timeStamp = humanTimestamp();
    const logMessage = `[${flag}] [${timeStamp}] ${message}`;

    console.log(logMessage);
    await appendLineFile(logFile, logMessage);
}

// * ----------------------- * //
// * MISCELLANEOUS FUNCTIONS * //
// * ----------------------- * //

async function serverError(message, error) {
    res.status(500).render('500', {title: `${titlePrefix} - Internal Server Error`});
    await logEvent("ERRO", message);

    const timestamp = humanTimestamp();
    const separator = "-".repeat(timestamp.length);
    const errorMessage = `[${timestamp}]\n\n${error}\n\n${separator}\n\n`;

    const crashlog = getAbsPath(`logs/errors/${timestamp}.log`);
    await appendLineFile(crashlog, errorMessage);
}