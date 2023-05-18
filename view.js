s.emView = function () {
    s.g('emInput').value = s.em;
}
s.enView = function () {
    s.g('enInput').value = s.en;
}
s.kayView = function () {
    s.g('kayInput').value = s.kay;
}
s.bgcView = function () {
    s.g('bgcInput').value = s.bgColor;
    s.imageLogoView();
}
s.fgcView = function () {
    document.body.style.color = s.fgColor
    s.g('fgcInput').value = s.fgColor;
    s.imageLogoView();
}

s.boardView = function (column, row) {
    const model = s.model[row][column];
    // get the change group
    const group = model.changeGroup; // group object reference
    group.replaceChildren(); // This clears the group
    const eventGroup = s.g(`eg-${row}-${column}`);
    switch (model.state) {
        case 0:
            break;
        case 1:
            eventGroup.onclick = null;
            group.appendChild(model.cross1);
            group.appendChild(model.cross2);
            break;
        case 2:
            eventGroup.onclick = null;
            group.appendChild(model.circle);
            break;
        default:
            break;
    }
}

s.updateBoard = function() {
    for (let i = 0; i < s.en; i++) { // rows
        for (let j = 0; j < s.em; j++) { // columns
            s.boardView(j, i);
        }
    }
}

s.imageLogoView = function() {
    s.g('imageLogoSVG').innerHTML = `
        <rect width="100%" height="100%" x="0" y="0" fill="${s.fgColor}"></rect>
        <rect width="471" height="471" x="-1" y="-1" fill="${s.bgColor}"></rect>
        <line x1="60" y1="60" x2="410" y2="410" stroke="${s.fgColor}" stroke-width="60"></line>
        <line x1="410" y1="60" x2="60" y2="410" stroke="${s.fgColor}" stroke-width="60"></line>
        <rect width="471" height="471" x="530" y="-1" fill="${s.bgColor}"></rect>
        <circle cx="765" cy="235" stroke="${s.fgColor}" fill="none" stroke-width="60" r="175"></circle>
        <rect width="471" height="471" x="-1" y="530" fill="${s.bgColor}"></rect>
        <circle cx="235" cy="765" stroke="${s.fgColor}" fill="none" stroke-width="60" r="175"></circle>
        <rect width="471" height="471" x="530" y="530" fill="${s.bgColor}"></rect>
        <line x1="590" y1="590" x2="940" y2="940" stroke="${s.fgColor}" stroke-width="60"></line>
        <line x1="940" y1="590" x2="590" y2="940" stroke="${s.fgColor}" stroke-width="60"></line>
    `;
}