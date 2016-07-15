module.exports.getDay = function (time) {
    let today = new Date(time);
    today.setHours(8);
    today.setMinutes(0);
    today.setSeconds(0);
    today.setMilliseconds(0);
    return today.getTime();
};
