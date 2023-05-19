#!/usr/bin/env node

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = 5000;
const fs = require('fs');
const autoSaveMS = 60 * 1000;
const gameDurationMS = 24 * 60 * 60 * 1000;

const cors = require('cors');
app.use(cors({
    origin: 'https://www.section.io'
}));

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

    // make the patterns for this game
    const kay = parseInt(q.kay);

    const horPat = [];
    horPat.push([]);
    for (let column = 0; column < kay; column++) {
        horPat[0][column] = 1;
    }

    const verPat = [];
    for (let row = 0; row < kay; row++) {
        verPat.push([1]);
    }

    const bksPat = []; // backslash pattern
    for (let row = 0; row < kay; row++) {
        bksPat.push([]);
        for (let column = 0; column < kay; column++) {
            bksPat[row].push([]);
            if(row === column) {
                bksPat[row][column] = 1; // a marked square
            } else {
                bksPat[row][column] = 0; // any mark
            }
        }
    }

    // make a copy of the backslash pattern
    const fwsPat = JSON.parse(JSON.stringify(bksPat)); // forward slash pattern
    fwsPat.reverse(); // This reverses in place

    database.currentGames.push({id:database.nextGameId, started:Date.now(), kay:kay, board:board, horPat:horPat,
        verPat:verPat, bksPat:bksPat, fwsPat:fwsPat});
    responseObject.gameId = database.nextGameId;
    database.nextGameId++;

    if(isNaN(q.playerId)) { // player is first time player and did not have a cookie.
        database.players.push({id:database.nextPlayerId, lastPlayed:Date.now()});
        responseObject.playerId = database.nextPlayerId;
        database.nextPlayerId++;
    }
    // decide who goes first.  Computer is always O, player is always X.
    const index = database.currentGames.findIndex(g => g.id === responseObject.gameId);
    const coinFlip = Math.floor(Math.random() * 2);
    if(coinFlip === 0) {
        move(index);
    }
    responseObject.board = database.currentGames[index].board;

    res.end(JSON.stringify(responseObject));
});

// the player chose a square and send the new board state
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended:false }));

app.post('/yourTurn', (req, res) => {
    const b = req.body;
    const responseObject = {};
    const playerIndex = database.players.findIndex((e) => e.id === b.playerId);
    const gameIndex = database.currentGames.findIndex((e) => e.id === b.gameId);

    database.currentGames[gameIndex].board = b.board;
    database.players[playerIndex].lastPlayed = Date.now();


    // Did the player win?
    responseObject.wldi = 'inPlay'
    if (allMatch(1, b.board, gameIndex)) {
        responseObject.wldi = 'lose'; // computer lost
    } else {
        const moveReturn = move(gameIndex);
        if(allMatch(2, database.currentGames[gameIndex].board, gameIndex)) {
            responseObject.wldi = 'win'; // computer won
        }
        if(responseObject.wldi !== 'win' && moveReturn === 'drawMaybe') {
            responseObject.wldi = 'draw';
        }
    }

    responseObject.board = database.currentGames[gameIndex].board;
    res.end(JSON.stringify(responseObject));
});

// initially it will just make random moves.  Later on it will get smarter like playing chess.
function move(gameIndex) {
    const currentGame = database.currentGames[gameIndex];
    const moves = [];
    for (let en = 0; en < currentGame.board.length; en++) {
        for (let em = 0; em < currentGame.board[0].length; em++) {
            if(currentGame.board[en][em] === 0) moves.push([en, em]);
        }
    }
    if (moves.length === 0) return 'draw';
    const move = moves[Math.floor(Math.random() * moves.length)];

    currentGame.board[move[0]][move[1]] = 2;
    if (moves.length === 1) return 'drawMaybe';
    else return 'inPlay';
}

function allMatch(playerMark, board, gameIndex) {
    let returnVal = false;

    const game = database.currentGames[gameIndex];
    if (
        matchPattern(playerMark, game.horPat, board) === 1 ||
        matchPattern(playerMark, game.verPat, board) === 1 ||
        matchPattern(playerMark, game.bksPat, board) === 1 ||
        matchPattern(playerMark, game.fwsPat, board) === 1
    ) {
        returnVal = true;
    }

    return returnVal;
}

// Does this pattern exist in this board?
function matchPattern(playerMark, pattern, board) {
    // is this pattern too big for the board?
    if (pattern.length > board.length || pattern[0].length > board[0].length) {
        return 3;
    }

    let found = false;
    for (let boardRow = 0; boardRow < board.length - (pattern.length - 1); boardRow++) {
       for (let boardColumn = 0; boardColumn < board[0].length - (pattern[0].length - 1); boardColumn++) {
           let patternFound = true;
           for (let patternRow = 0; patternRow < pattern.length; patternRow++) {
               for (let patternColumn = 0; patternColumn < pattern[0].length; patternColumn++) {
                   // if even one exception is found then this pattern does not match with this position on the board
                   if (
                       pattern[patternRow][patternColumn] === 1 &&
                       board[boardRow + patternRow][boardColumn + patternColumn] !== playerMark
                   ) {
                       patternFound = false;
                       break;
                   }
               }
               if (!patternFound) break;
           }
           if (patternFound) {
               found = true;
               break;
           }
       }
       if (found) break;
    }

    // returns 0-false, 1-true, 3-pattern too big
    if (found) return 1; else return 0;
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
