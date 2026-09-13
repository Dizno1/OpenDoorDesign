"use strict";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderSignInPage(options = {}) {
  const email = escapeHtml(options.email || "");
  const message = options.message
  ? `<p id="sign-in-status" role="status" tabindex="-1">${escapeHtml(options.message)}</p>
<script>
document.addEventListener("DOMContentLoaded", () => {
  const status = document.getElementById("sign-in-status");
  if (status) {
    status.focus();
  }
});
</script>`
  : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Community Sign In - Open Door Design</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Sign in to your Open Door Design Community Dashboard.">
  <link rel="stylesheet" href="/css/odd-theme.css">
  <link rel="stylesheet" href="/css/odd-layout.css">
  <link rel="stylesheet" href="/css/odd-components.css">
  <link rel="stylesheet" href="/css/odd-utilities.css">
  <link rel="stylesheet" href="/community/assets/community.css">
</head>
<body>
  <div class="skip-links">
    <a href="#main">Skip to main content</a>
    <a href="#primary-navigation">Skip to primary navigation</a>
    <a href="#footer">Skip to footer</a>
  </div>

  <header class="banner" aria-labelledby="banner-name">
    <span id="banner-name" class="visually-hidden">Banner</span>
    <div class="topbar" role="none">
      <a class="home-link" href="https://opendoordesign.org/">
        <img src="/dino_home_wave.png" alt="Dino waves you home.">
      </a>
    </div>
  </header>

  <div class="brand-center">
    <span class="logo-wrap">
      <img
        src="/ODD-FullLogo-StandingDino-DoorwayV2.png"
        alt="Open Door Design logo with a dinosaur mascot standing in a doorway that represents accessible entry into digital and physical spaces.">
    </span>
  </div>

  <nav id="primary-navigation" class="primary-nav" aria-labelledby="primary-nav-name">
    <span id="primary-nav-name" class="visually-hidden">Primary navigation</span>
    <ul role="list" class="nav-list">
      <li role="listitem"><a href="https://opendoordesign.org/">Home</a></li>
      <li role="listitem"><a href="https://opendoordesign.org/OurStory-OpenDoorDesign.html">Our Story</a></li>
      <li role="listitem"><a href="https://opendoordesign.org/AccessibilityAcademy-OpenDoorDesign.html">Accessibility Academy</a></li>
      <li role="listitem"><a href="https://opendoordesign.org/InnovationLab-OpenDoorDesign.html">Innovation Lab</a></li>
      <li role="listitem"><a href="https://opendoordesign.org/CurrentInitiatives-OpenDoorDesign.html">Current Initiatives</a></li>
      <li role="listitem"><a href="https://opendoordesign.org/JoinTheJourney-OpenDoorDesign.html">Join the Journey</a>
      <a href="https://opendoordesign.org/FollowTheJourney-OpenDoorDesign.html">Follow the Journey</a></li>
      <li role="listitem"><a href="https://opendoordesign.org/community/" aria-current="page">Community</a></li>
      <li role="listitem"><a href="https://opendoordesign.org/Accessibility-OpenDoorDesign.html">Accessibility Commitment</a></li>
      <li role="listitem"><a href="https://opendoordesign.org/Contact-OpenDoorDesign.html">Contact</a></li>
    </ul>
  </nav>

  <main id="main" tabindex="-1">
    <section class="section">
      <h1>Community Sign In</h1>

      <p class="lede">Sign in to your Open Door Design Community Dashboard.</p>

      <p>Enter the email address you used when joining the Community. We will send a secure sign-in link to that address.</p>

      <p>The link expires after 15 minutes and can be used only once.</p>

      ${message}

      <form method="post" action="/community/api/member/sign-in">
        <div class="field">
          <label for="email">Email address <span class="required-text">required</span></label>
          <input
            id="email"
            name="email"
            type="email"
            autocomplete="email"
            maxlength="254"
            value="${email}"
            required>
        </div>

        <button type="submit">Email me a sign-in link</button>
      </form>

      <p>Not registered yet? <a href="/community/register.html">Join the Open Door Design Community</a>.</p>
    </section>
  </main>

  <footer id="footer" role="contentinfo" aria-labelledby="footer-name">
    <span id="footer-name" class="visually-hidden">Footer</span>
    <p><a href="https://opendoordesign.org/Accessibility-OpenDoorDesign.html">Read the Open Door Design Accessibility Commitment</a></p>
    <p><a href="mailto:Accessibility@OpenDoorDesign.org">Accessibility@OpenDoorDesign.org</a> | <a href="mailto:Info@OpenDoorDesign.org">Info@OpenDoorDesign.org</a> | <a href="mailto:Inquiries@OpenDoorDesign.org">Inquiries@OpenDoorDesign.org</a></p>
    <p>Open Door Design is in its founding season. Every page represents ideas in motion, work in progress, and opportunities for collaboration.</p>
  </footer>
</body>
</html>`;
}

module.exports = { renderSignInPage };