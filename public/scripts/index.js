import { lazyGetID } from "./master.js";
import { lazyQuery } from "./master.js";
import { openNewTab } from "./master.js";

const infoButton = lazyGetID("infoBtn");
infoButton.addEventListener("click", () => {
    openNewTab("/greetings");
});

const loginButton = lazyGetID("loginBtn");
const loginDialog = lazyGetID("loginDialog");
const loginInput = lazyQuery(loginDialog, "input");
const submitButton = lazyQuery(loginDialog, "#submitBtn");
const cancelButton = lazyQuery(loginDialog, "#cancelBtn");

syncButtonValueToInput(submitButton, loginInput);
showDialog(loginButton, loginDialog);
onCloseDialog(loginDialog);
closeDialog(cancelButton, loginDialog);

function showDialog(button, dialog) {
    button.addEventListener("click", () => {
        dialog.showModal();
    });
}

function onCloseDialog(dialog) {
    dialog.addEventListener("close", (e) => {
    });
}

function closeDialog(button, dialog) {
    button.addEventListener("click", () => {
        dialog.close();
    });
}

function syncButtonValueToInput(button, input) {
    input.addEventListener("change", (e) => {
        button.value = input.value;
    });
}