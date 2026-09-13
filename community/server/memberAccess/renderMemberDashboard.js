"use strict";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderList(values, emptyText) {
  if (!Array.isArray(values) || values.length === 0) {
    return escapeHtml(emptyText);
  }

  return `<ul>${values
    .map((value) => `<li>${escapeHtml(value)}</li>`)
    .join("")}</ul>`;
}

function directoryStatus(choice) {
  if (choice === "yes") {
    return "You chose to participate in the Open Door Directory. Your public Directory listing has not been created yet.";
  }

  if (choice === "no") {
    return "You are not currently participating in the Open Door Directory.";
  }

  return "You have not yet made a Directory participation choice.";
}

function renderMemberDashboard(profile) {
  const name = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Community Dashboard - Open Door Design</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Your Open Door Design Community Dashboard.">
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
      <h1>Community Dashboard</h1>
      <p class="lede">Welcome, ${escapeHtml(profile.firstName)}.</p>
      <p>Your Dashboard brings your Open Door Design Community information together in one place.</p>
<form method="post" action="/community/member/sign-out">
  <button type="submit">Sign out</button>
</form>
    </section>

    <section class="section">
      <h2>Profile</h2>
      <p><a href="/community/member/profile/">Edit profile</a></p>
      <dl class="kvl">
        <dt>Name</dt>
        <dd>${escapeHtml(name)}</dd>

        <dt>Email</dt>
        <dd>${escapeHtml(profile.email)}</dd>

        <dt>Community status</dt>
        <dd>${escapeHtml(profile.status)}</dd>

        <dt>Biography</dt>
        <dd>${profile.aboutYou
          ? escapeHtml(profile.aboutYou)
          : "No biography provided."}</dd>
      </dl>

      <h3>Community interests</h3>
      ${renderList(profile.interests, "No interests selected.")}

      <h3>Accessibility perspectives</h3>
      ${renderList(
        profile.accessibilityPerspectives,
        "No accessibility perspectives selected."
      )}

      <h3>Participation preferences</h3>
      ${renderList(
        profile.participationPreferences,
        "No participation preferences selected."
      )}
    </section>

    <section class="section">
      <h2>Open Door Directory</h2>

      <p>${escapeHtml(
        directoryStatus(profile.directoryParticipation)
      )}</p>

      ${
        profile.directoryParticipation === "yes"
          ? `<p>Directory profile editing and publishing controls are coming next.</p>`
          : `<p>A Join the Directory option will be available here when Directory profile management is connected.</p>`
      }
    </section>

    <section class="section">
      <h2>Coming to Your Dashboard</h2>

      <h3>Community Activity</h3>
      <p>Community updates, discussions, and activity relevant to you are planned.</p>

      <h3>Accessibility Academy</h3>
      <p>Your courses, enrollment, and learning progress are planned.</p>

      <h3>Innovation Lab</h3>
      <p>Innovation Lab projects you can test, follow, or provide feedback on are planned.</p>

      <h3>Downloads</h3>
      <p>Academy resources, Innovation Lab builds, accessibility documents, and other publications are planned.</p>

      <h3>Research Opportunities</h3>
      <p>Usability studies, beta testing, accessibility reviews, and collaboration opportunities are planned.</p>

      <h3>Account Settings</h3>
      <p>Profile editing, communication preferences, optional password creation, and account management are planned.</p>
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

module.exports = { renderMemberDashboard };