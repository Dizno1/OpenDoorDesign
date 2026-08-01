"use strict";

/*
 * Open Door Design Community registration form behavior.
 *
 * This script is a progressive enhancement. The form has a real "action" and
 * "method=post" and works without JavaScript: an unenhanced submission goes to
 * the server, and the server performs the same validation described here and
 * returns the same field-level error experience (see community/server/lib).
 *
 * When JavaScript is available, on an invalid submission this script:
 * - Shows a field-level error connected to its control with aria-describedby.
 * - Sets aria-invalid="true" on that control.
 * - Moves focus directly to the FIRST invalid control in document order.
 *
 * There is no error summary and no alert region. A screen reader user lands
 * on the first problem immediately and hears its label, required state,
 * invalid state, and error message in one stop, instead of navigating a
 * separate landmark or a linked list first.
 */

const form = document.getElementById("community-registration");

if (form) {
    const renderedAtField = document.getElementById("form-rendered-at");
    if (renderedAtField) {
        renderedAtField.value = String(Date.now());
    }

    const EMPTY_EMAIL_MESSAGE = "Enter your email address.";
    const INVALID_EMAIL_FORMAT_MESSAGE = "Enter an email address in a valid format.";
    const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Order matters: this is the document order fields appear in, so "the
    // first invalid field" is always correct without a separate DOM query.
    const fields = [
        {
            input: document.getElementById("first-name"),
            error: document.getElementById("first-name-error"),
            getMessage: (input) => (input.value.trim() ? null : "Enter your first name.")
        },
        {
            input: document.getElementById("last-name"),
            error: document.getElementById("last-name-error"),
            getMessage: (input) => (input.value.trim() ? null : "Enter your last name.")
        },
        {
            input: document.getElementById("email"),
            error: document.getElementById("email-error"),
            getMessage: (input) => {
                const value = input.value.trim();
                if (!value) return EMPTY_EMAIL_MESSAGE;
                if (!EMAIL_PATTERN.test(value)) return INVALID_EMAIL_FORMAT_MESSAGE;
                return null;
            }
        },
        {
            input: document.getElementById("privacy-agreement"),
            error: document.getElementById("privacy-error"),
            getMessage: (input) => (input.checked ? null : "Confirm that you have read the Community Privacy Notice.")
        }
    ];

    function clearFieldError(field) {
        field.error.hidden = true;
        field.error.textContent = "";
        field.input.removeAttribute("aria-invalid");
    }

    function showFieldError(field, message) {
        field.error.textContent = message;
        field.error.hidden = false;
        field.input.setAttribute("aria-invalid", "true");
    }

    form.addEventListener("submit", (event) => {
        let firstInvalidField = null;

        fields.forEach((field) => {
            const message = field.getMessage(field.input);
            if (message) {
                showFieldError(field, message);
                if (!firstInvalidField) firstInvalidField = field;
            } else {
                clearFieldError(field);
            }
        });

        if (firstInvalidField) {
            event.preventDefault();
            firstInvalidField.input.focus();
            return;
        }

        // Valid: let the browser submit the form normally (real HTTP POST).
        // The server performs its own validation regardless of this check.
    });

    fields.forEach((field) => {
        const recheck = () => {
            // Only ever clears THIS field's own error. Never touches other
            // fields, and never moves focus — a person correcting one field
            // should not be interrupted while other fields remain invalid.
            if (!field.getMessage(field.input)) {
                clearFieldError(field);
            }
        };
        field.input.addEventListener("input", recheck);
        field.input.addEventListener("change", recheck);
    });
}
