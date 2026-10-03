"use strict";

function escapeHtml(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function checked(value) { return value ? " checked" : ""; }

function renderDirectoryProfile(member, directory = {}, options = {}) {
  const message = options.message ? `<p role="status">${escapeHtml(options.message)}</p>` : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Directory Profile - Open Door Design Community</title><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/css/odd-theme.css"><link rel="stylesheet" href="/css/odd-layout.css"><link rel="stylesheet" href="/css/odd-components.css"><link rel="stylesheet" href="/css/odd-utilities.css"><link rel="stylesheet" href="/community/assets/community.css"></head><body>
<div class="skip-links"><a href="#main">Skip to main content</a><a href="#primary-navigation">Skip to primary navigation</a><a href="#footer">Skip to footer</a></div>
<header class="banner" aria-labelledby="banner-name"><span id="banner-name" class="visually-hidden">Banner</span><div class="topbar" role="none"><a class="home-link" href="https://opendoordesign.org/"><img src="/dino_home_wave.png" alt="Dino waves you home."></a></div></header>
<nav id="primary-navigation" class="primary-nav" aria-labelledby="primary-nav-name"><span id="primary-nav-name" class="visually-hidden">Primary navigation</span><ul role="list" class="nav-list"><li><a href="/community/member/dashboard/">Dashboard</a></li><li><a href="/community/member/directory/">Open Door Directory</a></li><li><a href="/community/member/bulletin-board/">Bulletin Board</a></li><li><a href="https://opendoordesign.org/community/">Community Home</a></li></ul></nav>
<main id="main" tabindex="-1"><section class="section"><h1>Manage Directory Profile</h1><p>Choose what other Community members can find in the Open Door Directory. Your email is private unless you explicitly choose to show it.</p>${message}
<form method="post" action="/community/member/directory/profile">
<div class="field"><label for="headline">Headline</label><input id="headline" name="headline" type="text" maxlength="160" value="${escapeHtml(directory.headline)}"><p>Optional. Maximum 160 characters.</p></div>
<div class="field"><label for="location">Location</label><input id="location" name="location" type="text" maxlength="160" value="${escapeHtml(directory.location)}"><p>Optional. Use only as much location detail as you want to share.</p></div>
<div class="field"><label for="website-url">Website</label><input id="website-url" name="website_url" type="url" maxlength="500" value="${escapeHtml(directory.website_url)}"></div>
<fieldset><legend>Directory privacy and publishing</legend><div class="field"><input id="show-biography" name="show_biography" type="checkbox" value="yes"${checked(directory.show_biography !== 0)}><label for="show-biography">Show my biography</label></div><div class="field"><input id="show-email" name="show_email" type="checkbox" value="yes"${checked(directory.show_email)}><label for="show-email">Show my email address</label></div><div class="field"><input id="is-published" name="is_published" type="checkbox" value="yes"${checked(directory.is_published)}><label for="is-published">Publish my profile in the Open Door Directory</label></div></fieldset>
<button type="submit">Save Directory profile</button></form><p><a href="/community/member/directory/">View the Directory</a></p><p><a href="/community/member/dashboard/">Return to Community Dashboard</a></p></section></main>
<footer id="footer" role="contentinfo" aria-labelledby="footer-name"><span id="footer-name" class="visually-hidden">Footer</span><p><a href="https://opendoordesign.org/Accessibility-OpenDoorDesign.html">Read the Open Door Design Accessibility Commitment</a></p></footer></body></html>`;
}
module.exports = { renderDirectoryProfile };
