"use strict";

const form = document.getElementById("community-registration");

if (form) {
    const renderedAtField = document.getElementById("form-rendered-at");
    if (renderedAtField) renderedAtField.value = String(Date.now());

    const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const directoryYes = document.getElementById("directory-participation-yes");
    const directoryNo = document.getElementById("directory-participation-no");

    const fields = [
        { input: document.getElementById("first-name"), error: document.getElementById("first-name-error"), getMessage: input => input.value.trim() ? null : "Enter your first name." },
        { input: document.getElementById("last-name"), error: document.getElementById("last-name-error"), getMessage: input => input.value.trim() ? null : "Enter your last name." },
        { input: document.getElementById("email"), error: document.getElementById("email-error"), getMessage: input => { const value=input.value.trim(); if (!value) return "Enter your email address."; if (!EMAIL_PATTERN.test(value)) return "Enter an email address in a valid format."; return null; } },
        { input: directoryYes, inputs: [directoryYes, directoryNo], error: document.getElementById("directory-participation-error"), getMessage: () => (directoryYes.checked || directoryNo.checked) ? null : "Choose Yes or No for Open Door Directory participation." },
        { input: document.getElementById("privacy-agreement"), error: document.getElementById("privacy-error"), getMessage: input => input.checked ? null : "Confirm that you have read the Community Privacy Notice." }
    ];

    const controlsFor = field => field.inputs || [field.input];
    const clearFieldError = field => { field.error.hidden=true; field.error.textContent=""; controlsFor(field).forEach(control => control.removeAttribute("aria-invalid")); };
    const showFieldError = (field, message) => { field.error.textContent=message; field.error.hidden=false; controlsFor(field).forEach(control => control.setAttribute("aria-invalid","true")); };

    form.addEventListener("submit", event => {
        let firstInvalidField = null;
        fields.forEach(field => {
            const message = field.getMessage(field.input);
            if (message) { showFieldError(field, message); if (!firstInvalidField) firstInvalidField=field; }
            else clearFieldError(field);
        });
        if (firstInvalidField) { event.preventDefault(); firstInvalidField.input.focus(); }
    });

    fields.forEach(field => {
        const recheck = () => { if (!field.getMessage(field.input)) clearFieldError(field); };
        controlsFor(field).forEach(control => { control.addEventListener("input",recheck); control.addEventListener("change",recheck); });
    });
}
