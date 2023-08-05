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
const publicPath = path.join(__dirname, "public");
const databasePath = path.join(__dirname, "database");
const titlePrefix = "Seishun Dialogue";

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

app.get("/", (req, res) => {
    res.status(200).render("index", {title: titlePrefix});
    logEvent("home", `New connection from {${req.ip}}`);
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
            const paths = await constructUserPaths(code);
            const userObj = await getUserData(paths);
            await appendLineFile(paths.accessLog, `${await currentTimestamp()}`);
            res.send(`username: ${userObj.username}<br>creation date: ${userObj.creation}`);
            logEvent("lo", `User {${code}} logged in from {${req.ip}}`);
        } else {
            res.send(`${code}: NOT FOUND`);
        }
    }
    catch (err) {
        serverError("[X] login system critical failure", err);
    }
});

app.post("/signup", async (req, res) => {
    const username = req.body.username;
    try {
        const code = await getUniqueCode();
        await createNewEntry(code, username);
        res.status(200).render("signup", {code: code, title: `${titlePrefix} - Sign Up Successful`});
        logEvent("si", `User {${code}} registered from {${req.ip}}`);

    }
    catch (err) {
        serverError("[X] sign up system critical failure", err);
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

    initTime = await currentTimestamp(); // ! potentially dangerous shit
    logEvent("init", `Seishun Dialogue listening on port {${port}}`);
});

// * ----------------------- * //
// * MISCELLANEOUS FUNCTIONS * //
// * ----------------------- * //

function serverError(message, error) {
    console.error(`${message}:\n${error}`);
    res.status(500).render('500', {title: `${titlePrefix} - Internal Server Error`});
}

function getPublicPath(relativePath) {
    return path.join(publicPath, relativePath);
}

// * -------------------- * //
// * GENERAL IO FUNCTIONS * //
// * -------------------- * //

async function listDirs(path) {
    return (await fs.readdir(path, { withFileTypes: true }))
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
}

async function appendLineFile(path, content) {
    try {await fs.writeFile(path, `${content}\n`, {flag: "a"});}
    catch (err) {
        console.error(`[X] failed to append contents to file\n${err}`);
        throw err;
    }
}

async function mkdirIfNotExists(dir) {
    if (!(await listDirs(__dirname)).includes(dir)) {
        const newDir = path.join(__dirname, dir);
        try {
            await fs.mkdir(newDir);
        } catch (err) {
            serverError("[X] Cannot create directory", err);
        }
    }
}

// * ------------------------ * //
// * SERVER LOGGING FUNCTIONS * //
// * ------------------------ * //

async function currentTimestamp() {
    const timestamp = await getPaddedTime({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        day: new Date().getDate(),
        hours: new Date().getHours(),
        minutes: new Date().getMinutes(),
        seconds: new Date().getSeconds(),
        milliseconds: new Date().getMilliseconds(),

        date: function() {return `${this.year}-${this.month}-${this.day}`;},
        time: function() {return `${this.hours}-${this.minutes}-${this.seconds}-${this.milliseconds}`;}
    });
    // ? This looks really retarded. Is there a better way?

    return `${timestamp.date()}_${timestamp.time()}`;
}

async function getPaddedTime(dateObj) {
    const padTwo = ["month", "day", "hours", "minutes", "seconds"];

    for (const key in dateObj) {
        if (key == "year") {continue;}
        else if (padTwo.includes(key)) {dateObj[key] = await stringPadding(dateObj[key], "0", 2);}
        else if (key == "milliseconds") {dateObj[key] = await stringPadding(dateObj[key], "0", 3);}
    }
    return dateObj;
}

async function stringPadding(str, padding, maxLength, direction = "l") {
    padding = padding.toString();
    str = str.toString();

    if (str.length >= maxLength) {return str;}

    range = maxLength - str.length;
    if (direction == "l") {return padding.repeat(range) + str;}
    else if (direction == "r") {return str + padding.repeat(range);}
}

async function logEvent(flag, message) {
    switch (flag) {
        case "lo":
            flag = "LOGI";
            break;
        case "si":
            flag = "SIGN";
            break;
        case "er":
            flag = "ERRO";
            break;
        case "io":
            flag = "IOOP";
            break;
        default:
            flag = flag.toUpperCase();
    }

    const logFile = path.join(__dirname, `log/${initTime}.log`);
    const timeStamp = await currentTimestamp();
    const logMessage = `[${flag}] [${timeStamp}] ${message}`;

    console.log(logMessage);
}

// * ---------------------- * //
// * LOGIN-SIGNUP FUNCTIONS * //
// * ---------------------- * //

async function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

async function getRandomCode(length) {
    const charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let code = "";
    while (code.length < length) {
        const ranNum = await getRandomInt(0, charSet.length - 1);
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
    const entries = await listDirs(databasePath);
    return entries.includes(code);
}

async function constructUserPaths(code) {
    entryPath = path.join(databasePath, code);
    return {
        entryDir: entryPath,
        userJson: path.join(entryPath, "user.json"),
        accessLog: path.join(entryPath, "access.log"),
    };
}

async function createNewEntry(code, username) {
    try {
        const userObj = {username: username, creation: await currentTimestamp()};
        const paths = await constructUserPaths(code);

        await fs.mkdir(paths.entryDir);
        await fs.writeFile(paths.userJson, JSON.stringify(userObj), {flag: "w" });
        await fs.writeFile(paths.accessLog, `${userObj.creation}\n`, {flag: "a"});
        logEvent("io", `New entry created for {${code}}`);
    }
    catch (err) {
        serverError("[X] failed to create new entry", err);
    }
}

async function getUserData(paths) {
    return JSON.parse(await fs.readFile(paths.userJson, {encoding: "utf8"}));
}