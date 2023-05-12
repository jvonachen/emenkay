#!/usr/bin/env node

const express = require('express');
const app = express();
const PORT = 5000;
const fs = require('fs');
const autoSaveMS = 60 * 1000;
const gameDurationMS = 24 * 60 * 60 * 1000;

// serve up files local to the server
app.use(express.static('.'));

// serve the main html if no file or endpoint is specified
app.get('/', (req, res) => {
    res.end(fs.readFileSync('index.html'));
});

const filename = 'database.json';
let database = { nextGameId: 0, currentGames:[],
    nextPlayerId:0, players:[] };
// load the database if it exists
if(fs.existsSync(filename)) {
    const fileContents = fs.readFileSync(filename).toString();
    if(fileContents !== '') {
        try {
            database = JSON.parse(fileContents);
            nextGameId = database.nextGameId;
            nextPlayerId = database.nextPlayerId;
        } catch(e) {
            console.log(e);
        }
    }
}

// somebody wants to play
app.get('/start', (req, res) => {
    const q = req.query;
    const responseObject = {};

    const board = [];
    for (let en = 0; en < q.en; en++) {
        board.push([]);
        for (let em = 0; em < q.em; em++) {
            board[en][em] = 0; // blank
        }
    }
    database.currentGames.push({id:database.nextGameId, started:Date.now(), kay:q.kay, board:board});
    responseObject.gameId = database.nextGameId;
    database.nextGameId++;

    if(q.playerId === undefined) { // player is first time player and did not have a cookie.
        database.players.push({id:database.nextPlayerId, lastPlayed:Date.now()});
        responseObject.playerId = database.nextPlayerId;
        database.nextPlayerId++;
    }
    // decide who goes first.  Computer is always O, player is always X.
    const index = database.currentGames.findIndex(g => g.id === responseObject.gameId);
    if(Math.floor(Math.random() * 2) === 0) {
        move(index);
    }
    responseObject.board = database.currentGames[index].board;

    res.end(JSON.stringify(responseObject));
});

// initially it will just make random moves.  Later on it will get smarter like playing chess.
function move(gameIndex) {
    const currentGame = database.currentGames[gameIndex];
    currentGame.board
        [Math.floor(Math.random() * currentGame.board.length)   ]
        [Math.floor(Math.random() * currentGame.board[0].length)] = 2;
}

// one of the users has quit the game
app.get('/stop', (req, res) => {
    database.currentGames = database.currentGames.filter(function(g) {
        return g.id !== parseInt(req.query.gameId);
    });
    res.end();
});

// Periodically get rid of games that are old, also it will serve as a backup for the database.
setInterval(function () {
    database.currentGames = database.currentGames.filter(function (g) {
        return g.started < Date.now() + gameDurationMS;
    });
    fs.writeFileSync(filename, JSON.stringify(database));
}, autoSaveMS);

// listen for requests
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
