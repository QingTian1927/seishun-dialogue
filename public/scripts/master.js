export function openNewTab(link) {
    window.open(link, "_blank");
}

export function retrieveText(textFile) {
    fetch(textFile)
    .then((res) => {
        if (!res.ok) {
            throw new Error(`HTTP error: ${res.status}`);
        }
        return res.text();
    })
    .then((text) => {return text})
    .catch((err) => console.error(`Fetch issue for item (${textFile}): ${err.message}`));
}

export function lazyQuery(element, selector) {
    return element.querySelector(selector);
}

export function lazyGetID(elementId) {
    return document.getElementById(elementId);
}