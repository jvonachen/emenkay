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
}
s.fgcView = function () {
    s.g('fgcInput').value = s.fgColor;
}

s.boardView = function (column, row) {
    const model = s.model[row][column];
    // get the change group
    const group = model.changeGroup; // group object reference
    group.replaceChildren(); // This clears the group
    switch (model.state) {
        case 0:
            break;
        case 1:
            group.appendChild(model.cross1);
            group.appendChild(model.cross2);
            break;
        case 2:
            group.appendChild(model.circle);
            break;
        default:
            break;
    }
}
