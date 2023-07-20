export function openNewTab(link) {
    window.open(link, "_blank");
}

export function retrieveText(textFile) {
    fetch(textFile)
    .then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        return response.text();
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