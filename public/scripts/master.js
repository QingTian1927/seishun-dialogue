export function openNewTab(link) {
    window.open(link, "_blank");
}

export function lazyQuery(element, selector) {
    return element.querySelector(selector);
}

export function lazyGetID(elementId) {
    return document.getElementById(elementId);
}

export async function underlineEachCharCSS(selector, maxlength, letterSpacing, boldness, color) {
    const charWidth = 1;
    const textWidth = maxlength * (letterSpacing + charWidth);
    const properties = {
        "width": `${textWidth}ch`,
        "letter-spacing": `${letterSpacing}ch`,
        "background": `repeating-linear-gradient(90deg, ${color} 0, ${color} ${charWidth}ch, transparent 0, transparent ${charWidth + letterSpacing}ch) 0 100%/ ${textWidth - letterSpacing}ch ${boldness} no-repeat`,
    };
    // ? This shit looks fucking ugly, I know :)
    await appendCSSRule(selector, properties);
}

async function appendCSSRule(selector, properties) {
    let style = lazyQuery(document.head, "style");
    if (!style) {
        style = document.createElement("style");
        document.head.appendChild(style);
    }
    const styleSheet = style.sheet;
    styleSheet.insertRule(await createRuleset(selector, properties), 0);
}

async function createRuleset(selector, properties) {
    let rule = `${selector} { `;
    for (const prop in properties) {
        rule += `${prop}: ${properties[prop]}; `;
    }
    return rule += "}\n";
}