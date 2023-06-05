#!/usr/bin/env node

const https = require('https');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const fs = require('fs');
const autoSaveMS = 60 * 1000;
const gameDurationMS = 24 * 60 * 60 * 1000;
const cors = require('cors');

// This contains variables in a file which is not under version control and is read by client and server which means
//  each instance of your system has potentially a different version of this file and have to be maintained, each one.
const independent = JSON.parse(fs.readFileSync('independent.json').toString());

// surreal stuff - We will want to have a remote dev database to test stuff so specify this in the independent file
//const { default: surreal } = require('surrealdb');

// https stuff
const httpsOptions = {
    key: fs.readFileSync('kalebProductions.key'),
    cert: fs.readFileSync('kalebproductions_com.chained.crt'),
    ca: [
        fs.readFileSync('kalebproductions_com.chained.crt'),
        fs.readFileSync('kalebproductions_com.chained.crt')
    ]
};

app.use(cors({
    origin: 'https://kalebproductions.com'
}));

// serve up files local to the server
app.use(express.static('.'));

// serve the main html if no file or endpoint is specified
app.get('/', (req, res) => {
    res.end(fs.readFileSync('index.html'));
});

// a "flat file" "database" for now but will be replaced with surreal
// This creates a default empty database before trying to load it
const filename = 'database.json';
let database = {
    nextCurrentGameId: 0, currentGames: [],
    nextPlayerId: 0, players: [],
    nextGameId: 0, games: []
};
let edges = [];

// load the database if it exists
if (fs.existsSync(filename)) {
    const fileContents = fs.readFileSync(filename).toString();
    if (fileContents !== '') {
        try {
            database = JSON.parse(fileContents);
        } catch (e) {
            console.log(e);
        }
    }
}

/*
const surrealOptions = {
    user: 'root',
    pass: 'root',
    namespace: 'Kaleb Productions',
    database: 'EmEnKay'
};
let sdb = null;

try {
    sdb = new surreal(`http://localhost:${independent.prodSurrealPort}/rpc`, surrealOptions);
    database.nextGameId = sdb.select('nextGameId');
    database.nextPlayerId = sdb.select('nextPlayerId');
    database.currentGames = sdb.select('currentGames');
    database.players = sdb.select('players');
} catch(e) {
    console.log('problem with database');
    process.exit(1);
}
*/
        // somebody wants to play
app.get('/start', (req, res) => {
    const q = req.query;
    const responseObject = {};

    const board = [];
    function clearBoard(push) {
        for (let en = 0; en < q.en; en++) {
            if(push) board.push([]);
            for (let em = 0; em < q.em; em++) {
                board[en][em] = 0; // blank
            }
        }
    }
    clearBoard(true);

    const kay = parseInt(q.kay);

    // make the 4 patterns for this game
    const horPat = []; // the horizontal pattern
    horPat.push([]);
    for (let column = 0; column < kay; column++) {
        horPat[0][column] = 1;
    }

    const verPat = []; // the vertical pattern
    for (let row = 0; row < kay; row++) {
        verPat.push([1]);
    }

    const bksPat = []; // backslash pattern
    for (let row = 0; row < kay; row++) {
        bksPat.push([]);
        for (let column = 0; column < kay; column++) {
            bksPat[row].push([]);
            if (row === column) {
                bksPat[row][column] = 1; // a marked square
            } else {
                bksPat[row][column] = 0; // any mark
            }
        }
    }

    // make a copy of the backslash pattern
    const fwsPat = JSON.parse(JSON.stringify(bksPat)); // the forward slash pattern
    fwsPat.reverse(); // This reverses in place

    function boardTernary2Decimal(board) {
        let ternary = '';
        for(let row = 0; row < q.en; row++) {
            for(let column = 0; column < q.em; column++) {
                ternary += board[row][column].toString();
            }
        }
        //return parseInt(ternary, 3);
        return ternary;
    }

    // recursive function for finding edges in the graph of moves
    function generateEdges(boardP, marker, levelP) {
        let level = levelP;
        const board = JSON.parse(JSON.stringify(boardP));
        const vm = validMoves(board);
        console.log(`marker:${marker}, level:${levelP}, vm:${JSON.stringify(vm)}`);
        let broken = false;
        for(let vmi = 0; vmi < vm.length; vmi++) {
            // save "the from" vertex
            const edge = {from: boardTernary2Decimal(board)};
            // change the board
            board[vm[vmi][0]][vm[vmi][1]] = marker;
            // save "the to" vertex
            edge.to = boardTernary2Decimal(board);
            edge.level = level++; // records the level so the computer can find the shortest path to winning
            // did this player or computer win?
            if (
                matchPattern(marker, horPat, board) === 1 ||
                matchPattern(marker, verPat, board) === 1 ||
                matchPattern(marker, bksPat, board) === 1 ||
                matchPattern(marker, fwsPat, board) === 1
            ) {
                // someone won
                edge.state = marker; // either the player or the computer won
                edges.push(edge);
                board[vm[vmi][0]][vm[vmi][1]] = 0; // put it back to unmarked
                console.log(`vmi: ${vmi}, vm[vmi]:${JSON.stringify(vm[vmi])}, edge:${JSON.stringify(edge)}`);
            } else {
                edge.state = 0; // game still in play
                edges.push(edge); // with state 0
                console.log(`vmi: ${vmi}, vm[vmi]:${JSON.stringify(vm[vmi])}, edge:${JSON.stringify(edge)}\n`);
                // two players take turns
                if(marker === 1) marker = 2; else marker = 1;
                broken = true;
                break;
            }
        }
        if(broken) generateEdges(board, marker, level);
    }

    generateEdges(board, 1, 0); // player goes first
    generateEdges(board, 2, 0); // computer goes first
    clearBoard(false);

    database.currentGames.push({
        id: database.nextCurrentGameId, started: Date.now(), kay: kay, board: board, horPat: horPat,
        verPat: verPat, bksPat: bksPat, fwsPat: fwsPat, edges: edges
    });
    responseObject.gameId = database.nextCurrentGameId;
    database.nextCurrentGameId++;

    if (isNaN(q.playerId)) { // player is first time player and did not have a cookie.
        database.players.push({id: database.nextPlayerId, lastPlayed: Date.now()});
        responseObject.playerId = database.nextPlayerId;
        database.nextPlayerId++;
    }

    // decide who goes first.  Computer is always O, player is always X.
    const index = database.currentGames.findIndex(g => g.id === responseObject.gameId);
    const coinFlip = Math.floor(Math.random() * 2);
    if (coinFlip === 0) {
        move(index);
    }
    responseObject.board = database.currentGames[index].board;

    res.end(JSON.stringify(responseObject));
});

// the player chose a square and send the new board state
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

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
        if (allMatch(2, database.currentGames[gameIndex].board, gameIndex)) {
            responseObject.wldi = 'win'; // computer won
        }
        if (responseObject.wldi !== 'win' && moveReturn === 'drawMaybe') {
            responseObject.wldi = 'draw';
        }
    }

    responseObject.board = database.currentGames[gameIndex].board;
    res.end(JSON.stringify(responseObject));
});

function validMoves(board) {
    const moves = [];
    for (let en = 0; en < board.length; en++) {
        for (let em = 0; em < board[0].length; em++) {
            if (board[en][em] === 0) moves.push([en, em]);
        }
    }
    return moves;
}

// initially it will just make random moves.  Later on it will get smarter like playing chess.
function move(gameIndex) {
    const currentGame = database.currentGames[gameIndex];
    const moves = validMoves(currentGame.board);
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

    database.currentGames = database.currentGames.filter(function (g) {
        return g.id !== parseInt(req.query.gameId);
    });

    edges = [];
    //sdb.

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
https.createServer(httpsOptions, app).listen(independent.sport, independent.fetchDN, function () {
    console.log(`EmEnKay secure server listening on port ${independent.sport}`);
});
