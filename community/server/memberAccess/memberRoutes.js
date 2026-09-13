"use strict";

const express = require("express");

const { MemberAccessStore } = require("./memberStore");
const { generateToken, hashToken } = require("./memberAuth");
const { parseCookies, getSessionFromRequest } = require("./memberSession");
const { renderSignInPage } = require("./renderSignInPage");
const { renderMemberDashboard } = require("./renderMemberDashboard");
const { renderEditProfile } = require("./renderEditProfile");
const { sendMemberSignInEmail } = require("../email/emailService");

const SIGN_IN_TOKEN_MINUTES = 15;
const SESSION_DAYS = 7;
const SESSION_COOKIE_NAME = "odd_community_session";

function createMemberRouter(config, registrationStore, emailProvider) {
  const router = express.Router();
  const memberStore = new MemberAccessStore(registrationStore.db);

  router.get("/sign-in/", (request, response) => {
    response
      .status(200)
      .type("html")
      .send(renderSignInPage());
  });

  router.post("/api/member/sign-in", async (request, response) => {
    const email = String(request.body.email || "").trim();
    const emailNormalized = email.toLowerCase();

    const neutralMessage =
      "If that email address is registered with the Open Door Design Community, a secure sign-in link has been sent.";

    if (!email || email.length > 254) {
      response
        .status(400)
        .type("html")
        .send(
          renderSignInPage({
            email,
            message:
              "Enter the email address you used when joining the Community."
          })
        );
      return;
    }

    const member =
      memberStore.findMemberByNormalizedEmail(emailNormalized);

    if (member) {
      const rawToken = generateToken();
      const tokenHash = hashToken(rawToken);

      const expiresAt = new Date(
        Date.now() + SIGN_IN_TOKEN_MINUTES * 60 * 1000
      ).toISOString();

      memberStore.createSignInToken(
        member.id,
        tokenHash,
        expiresAt
      );

      const signInUrl =
        `${config.publicBaseUrl}/community/member/sign-in/confirm` +
        `?token=${encodeURIComponent(rawToken)}`;

      try {
        await sendMemberSignInEmail(
          emailProvider,
          {
            firstName: member.first_name,
            email: member.email
          },
          signInUrl,
          config
        );
      } catch (error) {
        console.error(
          "[community-member-access] sign-in email delivery failed:",
          error
        );
      }
    }

    response
      .status(200)
      .type("html")
      .send(
        renderSignInPage({
          message: neutralMessage
        })
      );
  });

  router.get("/member/sign-in/confirm", (request, response) => {
    const rawToken = String(request.query.token || "").trim();

    if (!rawToken) {
      response
        .status(400)
        .type("html")
        .send(
          renderSignInPage({
            message:
              "That sign-in link is invalid or has expired. Request a new sign-in link."
          })
        );
      return;
    }

    const tokenHash = hashToken(rawToken);
    const consumed = memberStore.consumeSignInToken(tokenHash);

    if (!consumed) {
      response
        .status(400)
        .type("html")
        .send(
          renderSignInPage({
            message:
              "That sign-in link is invalid or has expired. Request a new sign-in link."
          })
        );
      return;
    }

    const rawSessionToken = generateToken();
    const sessionTokenHash = hashToken(rawSessionToken);

    const sessionExpiresAt = new Date(
      Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    memberStore.createSession(
      consumed.communityMemberId,
      sessionTokenHash,
      sessionExpiresAt
    );

    response.cookie(
      SESSION_COOKIE_NAME,
      rawSessionToken,
      {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: "lax",
        maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
        path: "/community"
      }
    );

    response.redirect(303, "/community/member/dashboard/");
  });
  router.get("/member/dashboard/", (request, response) => {
    const session = getSessionFromRequest(
      request,
      memberStore,
      SESSION_COOKIE_NAME
    );

    if (!session) {
      response.redirect(303, "/community/sign-in/");
      return;
    }

    const profile = memberStore.getMemberProfile(
      session.community_member_id
    );

    if (!profile) {
      response.redirect(303, "/community/sign-in/");
      return;
    }

    response
      .status(200)
      .type("html")
      .send(renderMemberDashboard(profile));
  });
  router.get("/member/profile/", (request, response) => {
    const session = getSessionFromRequest(
      request,
      memberStore,
      SESSION_COOKIE_NAME
    );

    if (!session) {
      response.redirect(303, "/community/sign-in/");
      return;
    }

    const profile = memberStore.getMemberProfile(
      session.community_member_id
    );

    if (!profile) {
      response.redirect(303, "/community/sign-in/");
      return;
    }

    response
      .status(200)
      .type("html")
      .send(renderEditProfile(profile));
  });

  router.post("/member/profile", (request, response) => {
    const session = getSessionFromRequest(
      request,
      memberStore,
      SESSION_COOKIE_NAME
    );

    if (!session) {
      response.redirect(303, "/community/sign-in/");
      return;
    }

    const firstName = String(request.body.first_name || "").trim();
    const lastName = String(request.body.last_name || "").trim();
    const aboutYou = String(request.body.about_you || "").trim();

    const profile = memberStore.getMemberProfile(
      session.community_member_id
    );

    if (!profile) {
      response.redirect(303, "/community/sign-in/");
      return;
    }

    if (
      !firstName ||
      !lastName ||
      firstName.length > 100 ||
      lastName.length > 100 ||
      aboutYou.length > 2000
    ) {
      response
        .status(400)
        .type("html")
        .send(
          renderEditProfile(
            {
              ...profile,
              firstName,
              lastName,
              aboutYou
            },
            {
              message:
                "Profile changes were not saved. Check the required fields and character limits."
            }
          )
        );
      return;
    }

    memberStore.updateMemberProfile(
      session.community_member_id,
      {
        firstName,
        lastName,
        aboutYou
      }
    );

    const updatedProfile = memberStore.getMemberProfile(
      session.community_member_id
    );

    response
      .status(200)
      .type("html")
      .send(
        renderEditProfile(updatedProfile, {
          message: "Profile saved."
        })
      );
  });

  router.post("/member/sign-out", (request, response) => {
    const cookies = parseCookies(request.headers.cookie);
    const rawSessionToken = cookies[SESSION_COOKIE_NAME];

    if (rawSessionToken) {
      const sessionTokenHash = hashToken(rawSessionToken);
      memberStore.revokeSession(sessionTokenHash);
    }

    response.clearCookie(
      SESSION_COOKIE_NAME,
      {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: "lax",
        path: "/community"
      }
    );

    response.redirect(303, "/community/sign-in/");
  });
  return router;
}

module.exports = {
  createMemberRouter,
  SESSION_COOKIE_NAME
};