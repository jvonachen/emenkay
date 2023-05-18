s.startControl = function() {
    s.g('attractDiv').style.display = 'none';
    s.g('playDiv').style.display = 'inline';
    clearInterval(s.attractIntervalHandle);
    // detach the event handlers for attract mode
    s.newBoard();

    const url = new URL('http://localhost:5000/start');

    const params = {em:s.em, en:s.en, kay:s.kay};
    if(s.playerId !== '') {
        params.playerId = s.playerId;
    }
    url.search = new URLSearchParams(params).toString();
    fetch(url)
        .then(p => p.text())
        .then(rs => {
            const parsed = JSON.parse(rs);
            s.gameId = parsed.gameId;
            if (parsed.playerId !== undefined) {
                s.playerId = parsed.playerId;
                s.setCookie('playerId', s.playerId, s.cookieExDays);
            }
            if (parsed.board !== undefined) {
                // The server won the coin flip and went first
                for (let i = 0; i < s.en; i++) { // rows
                    for (let j = 0; j < s.em; j++) { // columns
                        s.model[i][j].state = parsed.board[i][j];
                        const eventGroup = s.g(`eg-${i}-${j}`);
                        eventGroup.onclick = null;
                        eventGroup.addEventListener('click', function () {
                            s.myMove(i, j);
                        });
                    }
                }
                s.updateBoard();
            } else {
                console.log('player one coin flip');
            }
        }); // What is returned is the new game id.

    for (let i = 0; i < s.en; i++) { // rows
        for (let j = 0; j < s.em; j++) { // columns
            s.g(`eg-${i}-${j}`).addEventListener('click', function () {
                if(s.model[i][j].state === 0) {
                    s.model[i][j].state = 1;
                    s.updateBoard();
                    s.yourTurn();
                }
            });
        }
    }
}

s.myMove = function(i, j) {
    const model = s.model[i][j];
    if(model.state === 0) model.state = 1;
}

s.yourTurn = function() {
    const url = new URL('http://localhost:5000/yourTurn');

    const boardStates = [];
    for (let i = 0; i < s.en; i++) { // rows
        boardStates.push([]);
        for (let j = 0; j < s.em; j++) { // columns
            boardStates[i][j] = s.model[i][j].state;
        }
    }

    const params = { board:boardStates, playerId:s.playerId, gameId:s.gameId };
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
    };
    fetch(url, requestOptions)
        .then(p => p.text())
        .then(rs => {
            const parsed = JSON.parse(rs);
            for (let i = 0; i < s.en; i++) { // rows
                for (let j = 0; j < s.em; j++) { // columns
                    s.model[i][j].state = parsed.board[i][j];
                }
            }
            s.updateBoard();
            switch(parsed.wldi) {
                case 'win': console.log('computer won :('); break;
                case 'lose': console.log('computer lost! :)'); break;
                case 'draw': console.log('it\'s a draw.'); break;
                case 'inPlay': console.log('Still in play.'); break;
                default: console.log('unknown game state.'); break;
            }
        })
        .catch(error => {
            console.error('There was an error!', error);
        });
}

s.stopControl = function() {
    s.g('playDiv').style.display = 'none';
    s.g('attractDiv').style.display = 'inline';
    s.startAttract();
    s.newBoard();

    const url = new URL('http://localhost:5000/stop');
    const params = { gameId:s.gameId };
    url.search = new URLSearchParams(params).toString();
    fetch(url).then(); // no need to do anything with this.  Just letting the server know we are done with this game.
}

s.emControl = function (value) {
    s.em = value;
    s.setCookie('em', s.em, s.cookieExDays)
    s.newBoard();
}

s.enControl = function (value) {
    s.en = value;
    s.setCookie('en', s.en, s.cookieExDays)
    s.newBoard();
}

s.kayControl = function (value) {
    s.kay = value;
    s.setCookie('kay', s.kay, s.cookieExDays)
    s.newBoard();
}

s.initControl = function (value) {
    s.init = value;
    s.setCookie('init', s.init, s.cookieExDays)
    s.newBoard();
}

s.bgcControl = function (value) {
    s.bgColor = value;
    s.setCookie('bgc', s.bgColor, s.cookieExDays)
    s.bgcView();
    s.newBoard();
}

s.fgcControl = function (value) {
    s.fgColor = value;
    s.setCookie('fgc', s.fgColor, s.cookieExDays)
    s.fgcView();
    s.newBoard();
}

s.rcControl = function() {
    function rc() { return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`; }
    s.bgColor = rc();
    s.setCookie('bgc', s.bgColor, s.cookieExDays)
    s.bgcView();
    s.fgColor = rc();
    s.setCookie('fgc', s.fgColor, s.cookieExDays)
    s.fgcView();

    s.newBoard();
}

s.cycleControl = function (column, row) {
    const model = s.model[row][column];
    switch (model.state) {
        case 0:
            model.state = 1;
            break;
        case 1:
            model.state = 2;
            break;
        case 2:
            model.state = 0;
            break;
        default:
            break;
    }
    s.boardView(column, row);
}
