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
                console.log(parsed.board);
                console.log('computer won coin flip');
            } else {
                console.log('player one coin flip');
            }
            // attach new event handlers to the svg groups
        }); // What is returned is the new game id.
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
    s.newBoard();
}

s.fgcControl = function (value) {
    s.fgColor = value;
    s.setCookie('fgc', s.fgColor, s.cookieExDays)
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
    // This will be a lot more complicated in the future :)
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
