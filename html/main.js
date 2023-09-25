import { convertResponse, procTitle } from "./response.js";
import { cards } from "./cards.js";

const SAMPLE_PERIODS = {
    gamecount: ["202309ladder", "202309topladder", "202308ladder", "202308topladder"],
    players: ["202309ladder", "202308ladder"],
    leaderboard: ["202309ladder", "202308ladder"],
    games: ["202309ladder", "202308ladder"],
    decks: ["202309ladder", "202309topladder", "202308ladder", "202308topladder"],
    cards: ["202309ladder", "202309topladder", "202308ladder", "202308topladder"]
};

let endpointSelect,
    tableSelect,
    paramInput,
    queryButton,
    responseDiv;

const inputNodes = [];

const getParams = {
    id: "",
    query: "",
    sort: "",
    table: ""
};

document.addEventListener("DOMContentLoaded", start);

function start() {
    endpointSelect = document.getElementById("endpoint-select");
    tableSelect = document.getElementById("table-select");
    paramInput = document.getElementById("param-input");
    queryButton = document.getElementById("query-button");
    responseDiv = document.getElementById("response");

    getParams.table = tableSelect.value;

    endpointSelect.addEventListener("input", endpointChange);
    tableSelect.addEventListener("input", () => getParams.table = tableSelect.value);
    queryButton.addEventListener("click", () => {
        const hash = { endpoint: endpointSelect.value };
        for (const i in getParams)
            if (getParams[i] !== "")
                hash[i] = getParams[i];
        location.hash = encodeURIComponent(JSON.stringify(hash));
    });

    addEventListener("hashchange", hashChange);

    endpointChange();
    hashChange();
}

function hashChange() {
    try {
        const params = JSON.parse(decodeURIComponent(location.hash.slice(1)));
        if (params.endpoint != null) {
            endpointSelect.value = params.endpoint;
            const input = endpointChange() ?? {};
            tableSelect.value = getParams.table = params.table ?? tableSelect.value;
            if (params.id != null)
                input.value = getParams.id = params.id;
            if (params.query != null) {
                if (params.endpoint !== "decksearch") {
                    input.value = getParams.query = params.query;
                } else {
                    input._deckquery = JSON.parse(params.query);
                    paramInput.querySelector("span").innerHTML = (input._deckquery.length > 0) ?
                        input._deckquery.slice(1).reduce((a, v) => `${a}<img style="height: 100%" src=${cardPath(cards[v].name)}>`, `<img style="height: 100%" src=${cardPath(cards[input._deckquery[0]].name)}>`) :
                        "";
                    getParams.query = params.query;
                }
            }
            if (params.sort != null)
                input.value = getParams.sort = params.sort;
            sendQuery();
        }
    } catch (err) {
        responseDiv.innerHTML = "";
        document.title = "BoomAPI - Boom Arena Statistics";
    }
}

function endpointChange() {
    queryButton.style.flex = 0;
    Object.keys(getParams).forEach(i => getParams[i] = "");
    const endpoint = endpointSelect.value;
    while (inputNodes.length > 0)
        inputNodes.pop().remove();
    switch (endpoint) {
        case "gamecount": case "leaderboard":
            setTableSelect(SAMPLE_PERIODS[endpoint]);
            queryButton.style.flex = 1;
            return;
        case "player": case "deck": case "game": {
            setTableSelect(SAMPLE_PERIODS[`${endpoint}s`]);
            const div = document.createElement("div");
            div.className = "labeled";
            const label = document.createElement("label");
            label.innerHTML = "id";
            const input = document.createElement("input");
            input.addEventListener("input", () => getParams.id = input.value);
            label.htmlFor = input.id = `${endpoint}-input`;
            div.append(label, input);
            paramInput.prepend(div);
            inputNodes.push(div);
            return input;
        }
        case "card": {
            setTableSelect(SAMPLE_PERIODS.cards);
            const div = document.createElement("div");
            div.className = "labeled";
            const label = document.createElement("label");
            label.innerHTML = "name";
            const select = document.createElement("select");
            for (const i in cards) {
                const option = document.createElement("option");
                option.value = i;
                option.innerHTML = cards[i].name;
                select.append(option);
            }
            getParams.id = "1";
            select.addEventListener("input", () => getParams.id = select.value);
            label.htmlFor = select.id = "card-select";
            div.append(label, select);
            paramInput.prepend(div);
            inputNodes.push(div);
            return select;
        }
        case "playersearch": {
            setTableSelect(SAMPLE_PERIODS.players);
            const div = document.createElement("div");
            div.className = "labeled";
            const label = document.createElement("label");
            label.innerHTML = "query";
            const input = document.createElement("input");
            input.addEventListener("input", () => getParams.query = input.value);
            label.htmlFor = input.id = "playersearch-input";
            div.append(label, input);
            paramInput.prepend(div);
            inputNodes.push(div);
            return input;
        }
        case "cards": case "topdecks": {
            setTableSelect(SAMPLE_PERIODS.cards);
            const div = document.createElement("div");
            div.className = "labeled";
            const label = document.createElement("label");
            label.innerHTML = "sort";
            const select = document.createElement("select");
            for (const value of ["rating", "use", "win"]) {
                const option = document.createElement("option");
                option.innerHTML = option.value = value;
                select.append(option);
            }
            getParams.sort = "rating";
            select.addEventListener("input", () => getParams.sort = select.value);
            label.htmlFor = select.id = `${endpoint}-select`;
            div.append(label, select);
            paramInput.prepend(div);
            inputNodes.push(div);
            return select;
        }
        case "decksearch": {
            setTableSelect(SAMPLE_PERIODS.decks);
            const div = document.createElement("div");
            div.className = "labeled";
            const select = document.createElement("select");
            select.style.width = "96px";
            select.style.marginRight = "8px";
            select.style.flex = 0;

            const option1 = document.createElement("option");
            option1.value = "-1";
            option1.innerHTML = "Add card";
            const option2 = document.createElement("option");
            option2.value = "-2";
            option2.innerHTML = "Remove last card";
            select.append(option1, option2);
            for (const i in cards) {
                const option = document.createElement("option");
                option.value = i;
                option.innerHTML = cards[i].name;
                select.append(option);
            }

            const span = document.createElement("span");

            getParams.query = "[]";
            select.value = -1;
            select._deckquery = [];
            select.addEventListener("input", () => {
                const value = Number(select.value);
                select.value = -1;
                if (value === -1 || (select._deckquery.length === 8 && value !== -2) || select._deckquery.includes(Number(value)))
                    return;
                if (value !== -2)
                    select._deckquery.push(Number(value));
                else
                    select._deckquery.pop();
                span.innerHTML = (select._deckquery.length > 0) ?
                    select._deckquery.slice(1).reduce((a, v) => `${a}<img style="height: 100%" src=${cardPath(cards[v].name)}>`, `<img style="height: 100%" src=${cardPath(cards[select._deckquery[0]].name)}>`) :
                    "";
                getParams.query = JSON.stringify(select._deckquery);
            });

            div.append(select, span);
            paramInput.prepend(div);
            inputNodes.push(div);
            return select;
        }
    }
}

function cardPath(name) {
    return `assets/card/jpg/${name.replace(/ /g, "_").toLowerCase()}.jpg`;
}

function setTableSelect(values) {
    tableSelect.innerHTML = "";

    for (const value of values) {
        const option = document.createElement("option");
        option.innerHTML = option.value = value;
        tableSelect.append(option);
    }

    getParams.table = tableSelect.value;
}

async function sendQuery() {
    const endpoint = endpointSelect.value;
    const params = getParams;

    const response = await fetch(`https://api.boomapi.ca/${endpoint}?${new URLSearchParams(params)}`);

    if (response.status === 400) {
        responseDiv.innerHTML = "Invalid input.";
        return;
    } else if (response.status > 400) {
        responseDiv.innerHTML = `An unknown error occured (server returned status ${response.status})`;
    }

    const data = await response.json();

    if (data === null) {
        responseDiv.innerHTML = "Unable to retrive data (response was null).";
        return;
    }

    responseDiv.innerHTML = "";

    if (convertResponse[endpoint]) {
        const elements = await convertResponse[endpoint](data, params);
        for (let i = 0; i < elements.length; i++)
            responseDiv.append(elements[i]);
    } else {
        responseDiv.innerHTML = JSON.stringify(data);
    }

    if (procTitle[endpoint])
        document.title = `${procTitle[endpoint](data, params)} - BoomAPI`;
}