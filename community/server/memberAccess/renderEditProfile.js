"use strict";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderEditProfile(profile, options = {}) {
  const message = options.message
    ? `<p id="profile-status" role="status" tabindex="-1">${escapeHtml(options.message)}</p>
<script>
document.addEventListener("DOMContentLoaded", () => {
  const status = document.getElementById("profile-status");
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
  <title>Edit Profile - Open Door Design Community</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Edit your Open Door Design Community profile.">
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
      <a class="home-link" href="/">
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
      <li role="listitem"><a href="/">Home</a></li>
      <li role="listitem"><a href="/OurStory-OpenDoorDesign.html">Our Story</a></li>
      <li role="listitem"><a href="/AccessibilityAcademy-OpenDoorDesign.html">Accessibility Academy</a></li>
      <li role="listitem"><a href="/InnovationLab-OpenDoorDesign.html">Innovation Lab</a></li>
      <li role="listitem"><a href="/CurrentInitiatives-OpenDoorDesign.html">Current Initiatives</a></li>
      <li role="listitem"><a href="/JoinTheJourney-OpenDoorDesign.html">Join the Journey</a>
      <a href="/FollowTheJourney-OpenDoorDesign.html">Follow the Journey</a></li>
      <li role="listitem"><a href="/community/" aria-current="page">Community</a></li>
      <li role="listitem"><a href="/Accessibility-OpenDoorDesign.html">Accessibility Commitment</a></li>
      <li role="listitem"><a href="/Contact-OpenDoorDesign.html">Contact</a></li>
    </ul>
  </nav>

  <main id="main" tabindex="-1">
    <section class="section">
      <h1>Edit Profile</h1>
      <p class="lede">Update the basic information connected to your Community account.</p>

      ${message}

      <form method="post" action="/community/member/profile">
        <div class="field">
          <label for="first-name">First name <span class="required-text">required</span></label>
          <input
            id="first-name"
            name="first_name"
            type="text"
            autocomplete="given-name"
            maxlength="100"
            value="${escapeHtml(profile.firstName)}"
            required>
        </div>

        <div class="field">
          <label for="last-name">Last name <span class="required-text">required</span></label>
          <input
            id="last-name"
            name="last_name"
            type="text"
            autocomplete="family-name"
            maxlength="100"
            value="${escapeHtml(profile.lastName)}"
            required>
        </div>

        <div class="field">
          <label for="about-you">Biography</label>
          <textarea
            id="about-you"
            name="about_you"
            maxlength="2000"
            rows="8">${escapeHtml(profile.aboutYou)}</textarea>
          <p>Optional. Maximum 2,000 characters. Do not include passwords, financial information, government identification, or other sensitive information.</p>
        </div>

        <button type="submit">Save profile</button>
      </form>

      <p><a href="/community/member/dashboard/">Return to Community Dashboard</a></p>
    </section>
  </main>

  <footer id="footer" role="contentinfo" aria-labelledby="footer-name">
    <span id="footer-name" class="visually-hidden">Footer</span>
    <p><a href="/Accessibility-OpenDoorDesign.html">Read the Open Door Design Accessibility Commitment</a></p>
    <p><a href="mailto:Accessibility@OpenDoorDesign.org">Accessibility@OpenDoorDesign.org</a> | <a href="mailto:Info@OpenDoorDesign.org">Info@OpenDoorDesign.org</a> | <a href="mailto:Inquiries@OpenDoorDesign.org">Inquiries@OpenDoorDesign.org</a></p>
    <p>Open Door Design is in its founding season. Every page represents ideas in motion, work in progress, and opportunities for collaboration.</p>
  </footer>
</body>
</html>`;
}

module.exports = { renderEditProfile };