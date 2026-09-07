"use strict";
/**
 * Registration storage interface.
 * createRegistration stores Community membership data, Community privacy
 * consent, and the separate Open Door Directory participation choice in one
 * transaction. Directory "yes" records intent only and does not publish a
 * profile. Directory "no" does not affect Community membership.
 * RegistrationInput adds directoryParticipation ("yes" or "no") and
 * directoryParticipationVersion (string).
 */
module.exports={};
