// * --------- * //
// * LEGACY.JS * //
// * --------- * //

/*
    ? This file is used to store code that is no longer used in production
    ? but might still be useful some day.
*/

function dateObj(now = new Date()) {
    return {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
        hours: now.getHours(),
        minutes: now.getMinutes(),
        seconds: now.getSeconds(),
        milliseconds: now.getMilliseconds(),
        timezone: now.getTimezoneOffset(),

        date: function() {return `${this.year}-${this.month}-${this.day}`;},
        time: function() {return `${this.hours}:${this.minutes}:${this.seconds}:${this.milliseconds}`;}
    };
    // ? This looks quite retarded. Is there a better way?
}

async function currentTimestamp() {
    const timestamp = await getPaddedTime(dateObj());
    return `${timestamp.date()}_${timestamp.time()}`;
}

async function getPaddedTime(dateObj) {
    const padTwo = ["month", "day", "hours", "minutes", "seconds"];

    for (const key in dateObj) {
        if (
                (key == "year") ||
                (!(padTwo.includes(key)) && key != "milliseconds")
        ) {continue;}

        if (padTwo.includes(key)) {
            dateObj[key] = await stringPadding(dateObj[key], "0", 2);
            continue;
        }

        if (key == "milliseconds") {
            dateObj[key] = await stringPadding(dateObj[key], "0", 3);
            continue;
        }
    }
    return dateObj;
}

async function stringPadding(str, padding, maxLength, direction = "l") {
    padding = padding.toString();
    str = str.toString();

    if (str.length >= maxLength) {return str;}

    range = maxLength - str.length;
    if (direction == "l") {return padding.repeat(range) + str;}
    if (direction == "r") {return str + padding.repeat(range);}
}
