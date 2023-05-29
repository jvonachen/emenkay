import independent from './independent.json' assert { type: 'json' };
s.fetchDN = independent.fetchDN;
s.port = independent.sport;

s.g = function (id) {
    return document.getElementById(id);
}

s.init = function () {
    s.svgNS = 'http://www.w3.org/2000/svg';

    s.cookieExDays = 365;
    s.em = parseInt(s.getCookie('em')) || 3; // columns
    s.setCookie('em', s.em, s.cookieExDays);
    s.en = parseInt(s.getCookie('en')) || 3; // rows
    s.setCookie('em', s.em, s.cookieExDays);
    s.kay = parseInt(s.getCookie('kay')) || 3; // number of sequence to win
    s.setCookie('kay', s.kay, s.cookieExDays);

    s.maxViewbox = 1000;
    s.emMax = 30;
    s.emMin = 1;
    s.enMax = 30;
    s.enMin = 1;
    s.kayMax = 30;
    s.kayMin = 2;
    s.attractMS = 1000;

    s.fgColor = s.getCookie('fgc') || '#0000FF'; // columns
    s.setCookie('fgc', s.fgColor, s.cookieExDays);
    s.bgColor = s.getCookie('bgc') || '#FF0000'; // columns
    s.setCookie('bgc', s.bgColor, s.cookieExDays);

    s.playerId = parseInt(s.getCookie('playerId')); // if it does not exist will return empty string

    s.resize();
    window.onresize = s.resize;
    s.newBoard();

    // set up event handlers for controls
    s.g('emInput').onchange = function () {
        s.emControl(this.value);
    }
    s.g('enInput').onchange = function () {
        s.enControl(this.value);
    }
    s.g('kayInput').onchange = function () {
        s.kayControl(this.value);
    }
    s.g('bgcInput').onchange = function () {
        s.bgcControl(this.value);
    }
    s.g('fgcInput').onchange = function () {
        s.fgcControl(this.value);
    }
    s.g('randomColorButton').onclick = function () {
        s.rcControl();
    }

    s.g('startButton').onclick = s.startControl;
    s.g('stopButton').onclick = s.stopControl;
    s.startAttract();

    s.emView();
    s.enView();
    s.kayView();
    s.bgcView();
    s.fgcView();

    s.statusSpan = s.g('statusSpan');
}

s.setCookie = function(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    let expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

s.getCookie = function(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

s.startAttract = function () {
    s.mode = 'attract';
    for (let i = 0; i < s.en; i++) { // rows
        for (let j = 0; j < s.em; j++) { // columns
            const eventGroup = s.g(`eg-${i}-${j}`);
            eventGroup.onclick = function () {
                s.cycleControl(j, i);
            };
        }
    }
    s.attractIntervalHandle = setInterval(function () {
        const row = Math.floor(Math.random() * s.en);
        const column = Math.floor(Math.random() * s.em);
        s.cycleControl(column, row);
    }, s.attractMS);
}

s.resize = function () {
    const board = s.g('boardSVG');
    board.setAttributeNS(null, 'width', window.innerWidth * 0.95 + 'px');
    board.setAttributeNS(null, 'height', window.innerHeight * 0.8 + 'px');
}

s.newBoard = function () {
    document.body.style.backgroundColor = s.bgColor;
    s.g('boardBackground').setAttributeNS(null, 'fill', s.fgColor);
    const max = Math.max(s.em, s.en);
    const lineWidth = s.maxViewbox / max * 0.12;
    const board = s.g('boardSVG');
    const size = (s.maxViewbox - lineWidth * (max - 1)) / max;
    let reduced;
    const width = s.em * size + (s.em - 1) * lineWidth;
    const height = s.en * size + (s.en - 1) * lineWidth;
    if (width > height) {
        reduced = (height / width) * s.maxViewbox;
        board.setAttributeNS(null, 'viewBox', `0 0 ${s.maxViewbox} ${reduced}`);
    } else if (height > width) {
        reduced = (width / height) * s.maxViewbox;
        board.setAttributeNS(null, 'viewBox', `0 0 ${reduced} ${s.maxViewbox}`);
    } else {
        board.setAttributeNS(null, 'viewBox', `0 0 ${s.maxViewbox} ${s.maxViewbox}`);
    }
    s.model = [];
    const boardGroup = s.g('boardGroup');
    boardGroup.replaceChildren(); // This clears the group
    for (let i = 0; i < s.en; i++) { // rows
        s.model.push([]);
        for (let j = 0; j < s.em; j++) { // columns
            s.model[i][j] = {};
            const model = s.model[i][j];

            let x = j * size + j * lineWidth;
            let y = i * size + i * lineWidth;

            // This takes care of some graphical glitches
            let [leftXtra, rightXtra, topXtra, bottomXtra] = [0, 0, 0, 0];
            if (j === 0) {
                leftXtra = 1;
                rightXtra = 1;
            }
            if (i === 0) {
                topXtra = 1;
                bottomXtra = 1;
            }
            if (j === s.em - 1) {
                rightXtra = 1;
            }
            if (i === s.en - 1) {
                bottomXtra = 1;
            }
            // if the board is just one unit tall
            if (i === 0 && i === s.en - 1) {
                topXtra = 1;
                bottomXtra = 2;
            }
            // if the board is just one unit wide
            if (j === 0 && j === s.em - 1) {
                leftXtra = 1;
                rightXtra = 2;
            }

            // the model for the game state
            model.state = 0; // blank, unmarked

            // this group gets the background image and events
            let eventGroup = document.createElementNS(s.svgNS, 'g');
            eventGroup.id = `eg-${i}-${j}`;
            boardGroup.appendChild(eventGroup);

            // add this background to each event group permanently
            let domo = document.createElementNS(s.svgNS, 'rect');
            let set = [['width', size + rightXtra], ['height', size + bottomXtra], ['x', x - leftXtra],
                ['y', y - topXtra], ['fill', s.bgColor]];
            set.forEach(e => domo.setAttribute(e[0], e[1]));
            eventGroup.appendChild(domo);

            // make these svg dom objects and store them in the model.  That way the view function which gets called
            //  a lot, will not have to generate them on the fly.

            // this group gets changing graphics, add it to the change group
            let changeGroup = document.createElementNS(s.svgNS, 'g');
            eventGroup.appendChild(changeGroup);
            changeGroup.id = `g-${i}-${j}`;
            model.changeGroup = changeGroup;

            // cross lines
            domo = document.createElementNS(s.svgNS, 'line');
            set = [['x1', x + lineWidth], ['y1', y + lineWidth], ['x2', x + size - lineWidth],
                ['y2', y + size - lineWidth], ['stroke', s.fgColor], ['stroke-width', lineWidth]];
            set.forEach(e => domo.setAttributeNS(null, e[0], e[1]));
            model.cross1 = domo;

            domo = document.createElementNS(s.svgNS, 'line');
            set = [['x1', x + size - lineWidth], ['y1', y + lineWidth], ['x2', x + lineWidth],
                ['y2', y + size - lineWidth], ['stroke', s.fgColor], ['stroke-width', lineWidth]];
            set.forEach(e => domo.setAttributeNS(null, e[0], e[1]));
            model.cross2 = domo;

            // circle
            domo = document.createElementNS(s.svgNS, 'circle');
            set = [['cx', x + size / 2], ['cy', y + size / 2], ['stroke', s.fgColor], ['fill', 'none'],
                ['stroke-width', lineWidth], ['r', (size - lineWidth * 2) / 2]];
            set.forEach(e => domo.setAttributeNS(null, e[0], e[1]));
            model.circle = domo;

            s.boardView(j, i);
        }
    }
}
