import { lazyGetID } from "./master.js";
import { lazyQuery } from "./master.js";
import { openNewTab } from "./master.js";

const infoButton = lazyGetID("infoBtn");
infoButton.addEventListener("click", () => {
    openNewTab("/greetings");
});

const entryDialog = lazyGetID("entryDialog");
const loginButton = lazyGetID("loginBtn");
const signupButton = lazyGetID("signupBtn");

const loginForm = {
    action: "/dashboard",
    class: "codeInput",
    label: "Login code",
    maxlength: "8",
    minlength: "8",
    pattern: "[a-zA-Z0-9]{8,8}",
    tooltip: "Your previously assigned login code",
    title: "Log In",
    type: "logincode"
};
const signupForm = {
    action: "/signup",
    class: "nameInput",
    label: "Username",
    maxlength: "32",
    minlength: "4",
    pattern: "[a-zA-Z0-9_]{4,32}",
    tooltip: "Your desired username on Seishun",
    title: "Sign Up",
    type: "username"
}

functionalizeDialog(entryDialog, loginButton, loginForm);
functionalizeDialog(entryDialog, signupButton, signupForm);

function functionalizeDialog(dialog, trigger, form) {
    const submitButton = lazyQuery(dialog, "#submitBtn");
    const cancelButton = lazyQuery(dialog, "#cancelBtn");
    const inputField = lazyQuery(dialog, "input");

    trigger.addEventListener("click", () => {
        constructForm(dialog, form, inputField);
        dialog.showModal();
    });

    cancelButton.addEventListener("click", () => {
        dialog.close();
    });

    inputField.addEventListener("change", () => {
        submitButton.value = inputField.value;
    });
}

function constructForm(dialog, form, input) {
    const heading = lazyQuery(dialog, "h2");
    const labelText = lazyQuery(dialog, "p");
    const label = lazyQuery(dialog, "label");
    const formObj = lazyQuery(dialog, "form");

    formObj.setAttribute("action", form.action);
    label.setAttribute("for", form.type);
    label.setAttribute("title", form.tooltip);
    labelText.innerHTML = `${form.label}:`;
    heading.innerHTML = form.title;

    input.setAttribute("id", form.type);
    input.setAttribute("name", form.type);
    input.setAttribute("minlength", form.minlength);
    input.setAttribute("maxlength", form.maxlength);
    input.setAttribute("pattern", form.pattern);
    input.setAttribute("class", `${form.class} monospace`);
}