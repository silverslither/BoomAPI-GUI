import { cards as cardInfo } from "./cards.js";

export const procTitle = {
    leaderboard: () => "Global leaderboard",
    player: (player) => `Stats for ${player.name} (id: ${player.id})`,
    playersearch: (_players, params) => `Search results for ${params.query}`,
    cards: () => "All card stats",
    card: (card) => `Stats for ${cardInfo[card.id].name}`,
    topdecks: () => "Top deck stats",
    decksearch: () => "Deck search results",
    deck: (deck) => deck.id,
    game: (game) => `Game ${game.id}`
};

export const convertResponse = {
    leaderboard: async (players, params) => {
        const heading = document.createElement("h2");
        heading.innerText = "Global leaderboard";
        const table = document.createElement("table");
        const th = document.createElement("tr");
        th.innerHTML = "<th>Rank</th><th>Player</th><th>Medals</th>";
        table.append(th);
        for (const player of players) {
            const tr = document.createElement("tr");
            const hash = { endpoint: "player", id: player.user_id, table: params.table };
            tr.innerHTML = `<td>${player.rank + 1}.</td><td><a href="#${encodeURIComponent(JSON.stringify(hash))}">${player.name} (id:\u00a0${player.user_id})</a></td><td>${player.medals}</td>`;
            table.append(tr);
        }
        return [heading, table];
    },
    player: async (player, params) => {
        let totalgames = player.wins + player.losses + player.draws;
        const heading = document.createElement("h2");
        heading.innerText = `${player.name} (id:\u00a0${player.id})`;

        const stats = new DocumentFragment();
        const statsHeading = document.createElement("h3");
        statsHeading.innerText = "Stats";
        stats.append(
            statsHeading,
            `Medals: ${player.medals}`, document.createElement("br"),
            `Games: ${totalgames}`, document.createElement("br"),
            `Wins: ${np(player.wins, (totalgames = Math.max(totalgames, 1)))}`, document.createElement("br"),
            `Three star wins: ${np(player.three_crown_wins, totalgames)}`, document.createElement("br"),
            `Losses: ${np(player.losses, totalgames)}`, document.createElement("br"),
            `Draws: ${np(player.draws, totalgames)}`
        );

        const decks = new DocumentFragment();
        const decksHeading = document.createElement("h3");
        decksHeading.innerText = "Decks";
        decks.append(decksHeading);
        const decksTable = document.createElement("table");
        const decksTH = document.createElement("tr");
        decksTH.innerHTML = "<th>Deck</th><th>Usage</th><th>Wins</th><th>Losses</th><th>Draws</th>";
        decksTable.append(decksTH);
        for (const deck of player.decks) {
            const usage = deck.wins + deck.losses + deck.draws;
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.append(...renderDeckSmall(params.table, deck.id, undefined, "36px"));
            tr.innerHTML = `<td>${np(usage, totalgames)}</td><td>${np(deck.wins, usage)}</td><td>${np(deck.losses, usage)}</td><td>${np(deck.draws, usage)}</td>`;
            tr.prepend(td);
            decksTable.append(tr);
        }
        decks.append(decksTable);

        const gameData = await (await fetch(`https://api.boomapi.ca/games?${new URLSearchParams({
            ids: JSON.stringify(player.games.slice(0, 10)),
            table: params.table
        })}`)).json();

        const opponentData = await (await fetch(`https://api.boomapi.ca/previewplayers?${new URLSearchParams({
            ids: JSON.stringify(gameData.map(v => (v.p0_id === player.id) ? v.p1_id : v.p0_id)),
            table: params.table
        })}`)).json();

        const games = new DocumentFragment();
        const gamesHeading = document.createElement("h3");
        gamesHeading.innerText = "Recent Games";
        const gamesTable = document.createElement("table");
        const gamesTH = document.createElement("tr");
        gamesTH.innerHTML = "<th>Game</th><th>Opponent</th><th>Result</th>";
        gamesTable.append(gamesTH);
        for (let i = 0; i < gameData.length; i++) {
            const game = gameData[i];
            const tr = document.createElement("tr");
            const gameHash = { endpoint: "game", id: game.id, table: params.table };
            const opponentHash = { endpoint: "player", id: opponentData[i].id, table: params.table };
            tr.innerHTML =`<td><a href="#${encodeURIComponent(JSON.stringify(gameHash))}">${game.id}</a></td><td><a href="#${encodeURIComponent(JSON.stringify(opponentHash))}">${opponentData[i].name} (id:\u00a0${opponentData[i].id})</a></td><td>${(game.p0_id === player.id) ? `${3 - game.p1_towers} - ${3 - game.p0_towers}` : `${3 - game.p0_towers} - ${3 - game.p1_towers}`}</td>`;
            gamesTable.append(tr);
        }
        games.append(
            gamesHeading,
            gamesTable
        );

        return [heading, stats, decks, games];
    },
    playersearch: async (players, params) => {
        const heading = document.createElement("h2");
        heading.innerText = `Search results (${players.length})`;
        const table = document.createElement("table");
        const th = document.createElement("tr");
        th.innerHTML = "<th>Player</th><th>Medals</th>";
        table.append(th);
        for (const player of players) {
            const tr = document.createElement("tr");
            const hash = { endpoint: "player", id: player.id, table: params.table };
            tr.innerHTML = `<td><a href="#${encodeURIComponent(JSON.stringify(hash))}">${player.name} (id:\u00a0${player.id})</a></td><td>${player.medals}</td>`;
            table.append(tr);
        }
        return [heading, table];
    },
    cards: async (cards, params) => {
        const gamecount = Math.max((await (await fetch(`https://api.boomapi.ca/gamecount?${new URLSearchParams(params)}`)).json()).count, 1);
        const heading = document.createElement("h2");
        heading.innerText = "All card stats";
        const table = document.createElement("table");
        const th = document.createElement("tr");
        th.innerHTML = "<th>Card</th><th>Rating</th><th>Usage</th><th>Wins</th><th>Losses</th><th>Draws</th>";
        table.append(th);
        for (const card of cards) {
            let totalgames = card.wins + card.losses + card.draws;
            const tr = document.createElement("tr");
            const hash = { endpoint: "card", id: card.id, table: params.table };
            tr.innerHTML = `<td><a href="#${encodeURIComponent(JSON.stringify(hash))}">${cardInfo[card.id].name}</a></td><td>${(card.rating * 100).toFixed(1)}</td><td>${np(totalgames, gamecount)}</td><td>${np(card.wins, (totalgames = Math.max(totalgames, 1)))}</td><td>${np(card.losses, totalgames)}</td><td>${np(card.draws, totalgames)}</td>`;
            table.append(tr);
        }
        return [heading, table];
    },
    card: async (card, params) => {
        const gamecount = Math.max((await (await fetch(`https://api.boomapi.ca/gamecount?${new URLSearchParams(params)}`)).json()).count, 1);
        let totalgames = card.wins + card.losses + card.draws;

        const info = document.createElement("div");
        info.className = "cardinfo";
        const infoImg = document.createElement("img");
        infoImg.alt = "";
        infoImg.src = cardPath(cardInfo[card.id].name);
        infoImg.style.height = "108px";
        const infoText = document.createElement("div");
        const heading = document.createElement("h2");
        heading.innerText = cardInfo[card.id].name;
        infoText.append(
            heading,
            `"${cardInfo[card.id].description}"`, document.createElement("br"),
            `Type: ${cardInfo[card.id].type}`, document.createElement("br"),
            `Mana: ${cardInfo[card.id].mana}`
        );
        info.append(
            infoImg,
            infoText
        );

        const stats = new DocumentFragment();
        const statsHeading = document.createElement("h3");
        statsHeading.innerText = "Stats";
        stats.append(
            statsHeading,
            `Rating: ${(card.rating * 100).toFixed(1)}`, document.createElement("br"),
            `Usage: ${np(totalgames, gamecount)}`, document.createElement("br"),
        );
        totalgames = Math.max(totalgames, 1);
        stats.append(
            `Wins: ${np(card.wins, totalgames)}`, document.createElement("br"),
            `Losses: ${np(card.losses, totalgames)}`, document.createElement("br"),
            `Draws: ${np(card.draws, totalgames)}`
        );

        const matchups = new DocumentFragment();
        const matchupsHeading = document.createElement("h3");
        matchupsHeading.innerText = "Card Matchups";
        const table = document.createElement("table");
        const th = document.createElement("tr");
        th.innerHTML = "<th>Card</th><th>Games</th><th>Wins</th><th>Losses</th><th>Draws</th>";
        table.append(th);
        for (const c of card.card_matchups.sort((a, b) => b.wins / Math.max(b.losses + b.draws, 0.5) - a.wins / Math.max(a.losses + a.draws, 0.5))) {
            let ctotalgames = c.wins + c.losses + c.draws;
            const tr = document.createElement("tr");
            const hash = { endpoint: "card", id: c.id, table: params.table };
            tr.innerHTML = `<td><a href="#${encodeURIComponent(JSON.stringify(hash))}">${cardInfo[c.id].name}</a></td><td>${np(ctotalgames, totalgames)}</td><td>${np(c.wins, (ctotalgames = Math.max(ctotalgames, 1)))}</td><td>${np(c.losses, ctotalgames)}</td><td>${np(c.draws, ctotalgames)}</td>`;
            table.append(tr);
        }
        matchups.append(matchupsHeading, table);

        return [info, stats, matchups];
    },
    topdecks: async (decks, params) => {
        const gamecount = Math.max((await (await fetch(`https://api.boomapi.ca/gamecount?${new URLSearchParams(params)}`)).json()).count, 1);
        const heading = document.createElement("h2");
        heading.innerText = "Top deck stats";
        const table = document.createElement("table");
        const th = document.createElement("tr");
        th.innerHTML = "<th>Deck</th><th>Rating</th><th>Usage</th><th>Wins</th><th>Losses</th><th>Draws</th>";
        table.append(th);
        for (const deck of decks) {
            let totalgames = deck.wins + deck.losses + deck.draws;
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.append(...renderDeckSmall(params.table, deck.id, undefined, "36px"));
            tr.innerHTML = `<td>${(deck.rating * 100).toFixed(1)}</td><td>${np(totalgames, gamecount)}</td><td>${np(deck.wins, (totalgames = Math.max(totalgames, 1)))}</td><td>${np(deck.losses, totalgames)}</td><td>${np(deck.draws, totalgames)}</td>`;
            tr.prepend(td);
            table.append(tr);
        }
        return [heading, table];
    },
    decksearch: async (decks, params) => {
        const gamecount = Math.max((await (await fetch(`https://api.boomapi.ca/gamecount?${new URLSearchParams(params)}`)).json()).count, 1);
        const heading = document.createElement("h2");
        heading.innerText = `Search results (${decks.length})`;
        const table = document.createElement("table");
        const th = document.createElement("tr");
        th.innerHTML = "<th>Deck</th><th>Rating</th><th>Usage</th><th>Wins</th><th>Losses</th><th>Draws</th>";
        table.append(th);
        for (const deck of decks) {
            let totalgames = deck.wins + deck.losses + deck.draws;
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.append(...renderDeckSmall(params.table, deck.id, undefined, "36px"));
            tr.innerHTML = `<td>${(deck.rating * 100).toFixed(1)}</td><td>${np(totalgames, gamecount)}</td><td>${np(deck.wins, (totalgames = Math.max(totalgames, 1)))}</td><td>${np(deck.losses, totalgames)}</td><td>${np(deck.draws, totalgames)}</td>`;
            tr.prepend(td);
            table.append(tr);
        }
        return [heading, table];
    },
    deck: async (deck, params) => {
        const gamecount = Math.max((await (await fetch(`https://api.boomapi.ca/gamecount?${new URLSearchParams(params)}`)).json()).count, 1);
        const totalgames = Math.max(deck.wins + deck.losses + deck.draws, 1);
        const deckParsed = parseDeck(deck.id);
        const [avgMana, fourCardCycle] = deckInfo(deckParsed);

        const info = new DocumentFragment();
        const heading = document.createElement("h2");
        heading.innerText = "Deck";
        info.append(
            heading,
            ...renderDeckLarge(params.table, deck.id, "12%"),
            `Avg. Mana: ${avgMana.toFixed(1)}`, document.createElement("br"),
            `4-Card Cycle: ${fourCardCycle}`
        );

        const stats = new DocumentFragment();
        const statsHeading = document.createElement("h3");
        statsHeading.innerText = "Stats";
        stats.append(
            statsHeading,
            `Rating: ${(deck.rating * 100).toFixed(1)}`, document.createElement("br"),
            `Usage: ${np(totalgames, gamecount)}`, document.createElement("br"),
            `Wins: ${np(deck.wins, totalgames)}`, document.createElement("br"),
            `Losses: ${np(deck.losses, totalgames)}`, document.createElement("br"),
            `Draws: ${np(deck.draws, totalgames)}`, document.createElement("br"),
            `Total Players: ${deck.players.length}`
        );

        const playerData = await (await fetch(`https://api.boomapi.ca/previewplayers?${new URLSearchParams({
            ids: JSON.stringify(deck.players.slice(0, 10)),
            table: params.table
        })}`)).json();
        const players = new DocumentFragment();
        const playersHeading = document.createElement("h3");
        const playersTable = document.createElement("table");
        const playersTh = document.createElement("tr");
        playersTh.innerHTML = "<th>Player</th><th>Medals</th>";
        playersTable.append(playersTh);
        for (const player of playerData) {
            const tr = document.createElement("tr");
            const hash = { endpoint: "player", id: player.id, table: `${parseInt(params.table)}ladder` };
            tr.innerHTML = `<td><a href="#${encodeURIComponent(JSON.stringify(hash))}">${player.name} (id:\u00a0${player.id})</a></td><td>${player.medals}</td>`;
            playersTable.append(tr);
        }
        playersHeading.innerText = "Recent Players";
        players.append(
            playersHeading,
            playersTable
        );

        const matchups = new DocumentFragment();
        const matchupsHeading = document.createElement("h3");
        matchupsHeading.innerText = "Card Matchups";
        const matchupsTable = document.createElement("table");
        const matchupsTh = document.createElement("tr");
        matchupsTh.innerHTML = "<th>Card</th><th>Games</th><th>Wins</th><th>Losses</th><th>Draws</th>";
        matchupsTable.append(matchupsTh);
        for (const c of deck.card_matchups.sort((a, b) => b.wins / Math.max(b.losses + b.draws, 0.5) - a.wins / Math.max(a.losses + a.draws, 0.5))) {
            let ctotalgames = c.wins + c.losses + c.draws;
            const tr = document.createElement("tr");
            const hash = { endpoint: "card", id: c.id, table: params.table };
            tr.innerHTML = `<td><a href="#${encodeURIComponent(JSON.stringify(hash))}">${cardInfo[c.id].name}</a></td><td>${np(ctotalgames, totalgames)}</td><td>${np(c.wins, (ctotalgames = Math.max(ctotalgames, 1)))}</td><td>${np(c.losses, ctotalgames)}</td><td>${np(c.draws, ctotalgames)}</td>`;
            matchupsTable.append(tr);
        }
        matchups.append(matchupsHeading, matchupsTable);

        return [info, stats, players, matchups];
    },
    game: async (game, params) => {
        const info = new DocumentFragment();
        const heading = document.createElement("h2");
        heading.innerText = "Game info";
        info.append(
            heading,
            `Recorded: ${new Date(game.timestamp).toLocaleString()}`
        );

        const div = document.createElement("div");

        const [player1Data, player2Data] = await (await fetch(`https://api.boomapi.ca/previewplayers?${new URLSearchParams({
            ids: JSON.stringify([game.p0_id, game.p1_id]),
            table: params.table
        })}`)).json();

        const player1 = document.createElement("div");
        player1.className = "gamedeck";
        const player1Heading = document.createElement("a");
        player1Heading.style.fontWeight = 700;
        const player1Hash = { endpoint: "player", id: player1Data.id, table: params.table };
        player1Heading.href = `#${encodeURIComponent(JSON.stringify(player1Hash))}`;
        player1Heading.innerText = `${player1Data.name} (id:\u00a0${player1Data.id})`;
        const player1Deck = document.createElement("div");
        player1Deck.style.margin = "4px 0px 4px 0px";
        player1Deck.append(...renderDeckSmall(params.table, game.p0_deck, "24%", undefined, "left"));
        const [player1AvgMana, player1FourCardCycle] = deckInfo(parseDeck(game.p0_deck));
        player1.append(
            player1Heading, document.createElement("br"),
            `Medals: ${game.p0_medals}`, document.createElement("br"),
            `Score: ${3 - game.p1_towers}`, document.createElement("br"),
            player1Deck,
            `Avg. Mana: ${player1AvgMana.toFixed(1)}`, document.createElement("br"),
            `4-Card Cycle: ${player1FourCardCycle}`
        );

        const player2 = document.createElement("div");
        player2.className = "gamedeck";
        player2.style.textAlign = "right";
        const player2Heading = document.createElement("a");
        player2Heading.style.fontWeight = 700;
        const player2Hash = { endpoint: "player", id: player2Data.id, table: params.table };
        player2Heading.href = `#${encodeURIComponent(JSON.stringify(player2Hash))}`;
        player2Heading.innerText = `${player2Data.name} (id:\u00a0${player2Data.id})`;
        const player2Deck = document.createElement("div");
        player2Deck.style.margin = "4px 0px 4px 0px";
        player2Deck.append(...renderDeckSmall(params.table, game.p1_deck, "24%", undefined, "right"));
        const [player2AvgMana, player2FourCardCycle] = deckInfo(parseDeck(game.p1_deck));
        player2.append(
            player2Heading, document.createElement("br"),

            `Medals: ${game.p1_medals}`, document.createElement("br"),
            `Score: ${3 - game.p0_towers}`, document.createElement("br"),
            player2Deck,
            `Avg. Mana: ${player2AvgMana.toFixed(1)}`, document.createElement("br"),
            `4-Card Cycle: ${player2FourCardCycle}`
        );

        div.append(player1, player2);

        return [info, div];
    }
};

function np(n, total) {
    return `${n} (${(100 * n / total).toFixed(1)}%)`;
}

function renderDeckLarge(table, id, width, height) {
    const div = document.createElement("div");
    div.className = "decklarge";
    div.append(...parseDeck(id).map(v => {
        const card = cardInfo[v].name;
        const a = document.createElement("a");
        const img = document.createElement("img");
        img.alt = card;
        img.style.cursor = "pointer";
        const hash = { endpoint: "card", id: v, table };
        a.href = `#${encodeURIComponent(JSON.stringify(hash))}`;
        a.ariaLabel = "View card";
        img.src = cardPath(card);
        a.append(img);
        a.style.display = "flex";
        if (width != null) {
            a.style.width = width;
            img.style.width = "100%";
        }
        if (height != null) {
            a.style.height = height;
            img.style.height = "100%";
        }
        return a;
    }));
    return [div];
}

function renderDeckSmall(table, id, width, height, justifyContent = "center") {
    const images = parseDeck(id).map(v => {
        const card = cardInfo[v].name;
        const a = document.createElement("a");
        const img = document.createElement("img");
        img.alt = card;
        img.style.cursor = "pointer";
        const hash = { endpoint: "deck", id, table };
        a.href = `#${encodeURIComponent(JSON.stringify(hash))}`;
        a.ariaLabel = "View deck";
        img.src = cardPath(card);
        a.append(img);
        a.style.display = "flex";
        if (width != null) {
            a.style.width = width;
            img.style.width = "100%";
        }
        if (height != null) {
            a.style.height = height;
            img.style.height = "100%";
        }
        return a;
    });

    const div1 = document.createElement("div");
    div1.className = "decksmall";
    div1.style.justifyContent = justifyContent;
    div1.append(images[0], images[1], images[2], images[3]);

    const div2 = document.createElement("div");
    div2.className = "decksmall";
    div2.style.justifyContent = justifyContent;
    div2.append(images[4], images[5], images[6], images[7]);

    return [div1, div2];
}

function deckInfo(parsed) {
    const cycle = [];
    let avgMana = 0;
    let mirrorFlag = false;
    for (let i = 0; i < 8; i++) {
        const card = cardInfo[parsed[i]];

        if (parsed[i] === 90) {
            mirrorFlag = true;
        } else {
            avgMana += card.mana;

            if (cycle.length < 4) {
                cycle.push(card.mana);
            } else {
                const maxMana = Math.max(...cycle);
                if (card.mana < maxMana)
                    cycle.splice(cycle.indexOf(maxMana), 1, card.mana);
            }
        }
    }

    let fourCardCycle = cycle[0] + cycle[1] + cycle[2] + cycle[3];
    if (mirrorFlag) {
        const mirrorMana = Number(cardInfo[90].mana);
        avgMana = avgMana / 7 + mirrorMana / 8;
        const cycleMin = Math.min(...cycle);
        const cycleMax = Math.max(...cycle);
        if (cycleMax > cycleMin)
            fourCardCycle += cycleMin + mirrorMana - cycleMax;
    } else {
        avgMana = avgMana / 8;
    }

    return [avgMana, fourCardCycle];
}

function cardPath(name) {
    return `assets/card/jpg/${name.replace(/ /g, "_").toLowerCase()}.jpg`;
}

function parseDeck(str) {
    return str.match(/../g).map(v => parseInt(v, 16));
}
