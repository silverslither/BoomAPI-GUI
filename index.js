const EXPRESS_PORT = parseInt(process.argv[2] ?? "18327") % 65536;

const express = require("express");
const fs = require("fs");
const api = express();

api.get("/", (_req, res) => {
    res.sendFile(`${__dirname}/html/index.html`);
});

api.get("/main.js", (_req, res) => {
    res.sendFile(`${__dirname}/html/main.js`);
});

api.get("/cards.js", (_req, res) => {
    res.sendFile(`${__dirname}/html/cards.js`);
});

api.get("/response.js", (_req, res) => {
    res.sendFile(`${__dirname}/html/response.js`);
});

api.get("/style.css", (_req, res) => {
    res.sendFile(`${__dirname}/html/style.css`);
});

api.get("/favicon.ico", (_req, res) => {
    res.sendFile(`${__dirname}/html/favicon.ico`);
});

api.get("/OpenSans-Regular.woff2", (_req, res) => {
    res.sendFile(`${__dirname}/html/OpenSans-Regular.woff2`);
});

api.get("/OpenSans-Bold.woff2", (_req, res) => {
    res.sendFile(`${__dirname}/html/OpenSans-Bold.woff2`);
});

api.get("/assets/*", (req, res) => {
    const path = `${__dirname}/html${req.path}`;

    if (!fs.existsSync(path) || fs.statSync(path).isDirectory()) {
        res.status(404).send("404 Not Found");
        return;
    }

    res.sendFile(path);
});

api.get("/about", (_req, res) => {
    res.sendFile(`${__dirname}/html/about.html`);
});

api.get("/blog", (_req, res) => {
    res.sendFile(`${__dirname}/html/blog.html`);
});

api.get("/blog/*", (req, res) => {
    const path = `${__dirname}/html${req.path}.html`;

    if (!fs.existsSync(path) || fs.statSync(path).isDirectory()) {
        res.status(404).send("404 Not Found");
        return;
    }

    res.sendFile(path);
});

api.get("*", (_req, res) => {
    res.status(404).send("404 Not Found");
});

const server = api.listen(EXPRESS_PORT, () => {
    const port = server.address().port;
    console.log(`Running webserver on port ${port}.`);
});
