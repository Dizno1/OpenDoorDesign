"use strict";

const express = require("express");

const { MemberAccessStore } = require("./memberStore");
const { generateToken, hashToken } = require("./memberAuth");
const { parseCookies, getSessionFromRequest } = require("./memberSession");
const { renderSignInPage } = require("./renderSignInPage");
const { renderMemberDashboard } = require("./renderMemberDashboard");
const { renderEditProfile } = require("./renderEditProfile");
const { renderDirectoryProfile } = require("./renderDirectoryProfile");
const { renderDirectory, renderDirectoryMember } = require("./renderDirectory");
const { renderBulletinBoard, renderBulletinThread } = require("./renderBulletinBoard");
const { renderNotifications } = require("./renderNotifications");
const { sendMemberSignInEmail } = require("../email/emailService");
const { getSmsProvider } = require("../sms/smsService");
const { deliverBulletinReplyNotifications } = require("../notifications/notificationService");

const SIGN_IN_TOKEN_MINUTES = 15;
const SESSION_DAYS = 7;
const SESSION_COOKIE_NAME = "odd_community_session";

function createMemberRouter(config, registrationStore, emailProvider) {
  const router = express.Router();
  const memberStore = new MemberAccessStore(registrationStore.db);
  const smsProvider = getSmsProvider(config);

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
      .send(renderMemberDashboard(profile, { unreadNotifications: memberStore.countUnreadNotifications(session.community_member_id) }));
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


  function requireMember(request, response) {
    const session = getSessionFromRequest(request, memberStore, SESSION_COOKIE_NAME);
    if (!session) {
      response.redirect(303, "/community/sign-in/");
      return null;
    }
    return session;
  }

  router.post("/member/directory/participation", (request, response) => {
    const session = requireMember(request, response);
    if (!session) return;
    const choice = request.body.choice === "yes" ? "yes" : request.body.choice === "no" ? "no" : null;
    if (!choice) { response.status(400).type("text").send("Invalid Directory participation choice."); return; }
    memberStore.setDirectoryParticipation(session.community_member_id, choice);
    if (choice === "no") {
      const existing = memberStore.getDirectoryProfile(session.community_member_id);
      if (existing) memberStore.saveDirectoryProfile(session.community_member_id, {
        headline: existing.headline, location: existing.location, websiteUrl: existing.website_url,
        showEmail: Boolean(existing.show_email), showBiography: Boolean(existing.show_biography), isPublished: false
      });
    }
    response.redirect(303, choice === "yes" ? "/community/member/directory/profile/" : "/community/member/dashboard/");
  });


  router.get("/member/directory/", (request, response) => {
    const session = requireMember(request, response);
    if (!session) return;
    memberStore.recordPageVisit("/community/member/directory/", session.community_member_id);
    const searchTerm = String(request.query.q || "").trim().slice(0, 100);
    response.status(200).type("html").send(renderDirectory(memberStore.listPublishedDirectoryProfiles(searchTerm), { searchTerm }));
  });

  router.get("/member/directory/member/:memberId/", (request, response) => {
    const session = requireMember(request, response);
    if (!session) return;
    const profile = memberStore.getPublishedDirectoryProfile(request.params.memberId);
    if (!profile) { response.status(404).type("text").send("Published Directory profile not found."); return; }
    response.status(200).type("html").send(renderDirectoryMember(profile));
  });

  router.get("/member/directory/profile/", (request, response) => {
    const session = requireMember(request, response);
    if (!session) return;
    const member = memberStore.getMemberProfile(session.community_member_id);
    if (!member) { response.redirect(303, "/community/sign-in/"); return; }
    const directory = memberStore.getDirectoryProfile(session.community_member_id) || {};
    response.status(200).type("html").send(renderDirectoryProfile(member, directory));
  });

  router.post("/member/directory/profile", (request, response) => {
    const session = requireMember(request, response);
    if (!session) return;
    const member = memberStore.getMemberProfile(session.community_member_id);
    if (!member) { response.redirect(303, "/community/sign-in/"); return; }
    const profile = {
      headline: String(request.body.headline || "").trim(),
      location: String(request.body.location || "").trim(),
      websiteUrl: String(request.body.website_url || "").trim(),
      showEmail: request.body.show_email === "yes",
      showBiography: request.body.show_biography === "yes",
      isPublished: request.body.is_published === "yes" && member.directoryParticipation === "yes"
    };
    let websiteValid = true;
    if (profile.websiteUrl) {
      try { const u = new URL(profile.websiteUrl); websiteValid = u.protocol === "http:" || u.protocol === "https:"; } catch { websiteValid = false; }
    }
    if (profile.headline.length > 160 || profile.location.length > 160 || profile.websiteUrl.length > 500 || !websiteValid) {
      response.status(400).type("html").send(renderDirectoryProfile(member, {
        headline: profile.headline, location: profile.location, website_url: profile.websiteUrl,
        show_email: profile.showEmail ? 1 : 0, show_biography: profile.showBiography ? 1 : 0,
        is_published: profile.isPublished ? 1 : 0
      }, { message: "Directory profile was not saved. Check the character limits and enter a complete http or https website address." }));
      return;
    }
    const saved = memberStore.saveDirectoryProfile(session.community_member_id, profile);
    response.status(200).type("html").send(renderDirectoryProfile(member, saved, { message: profile.isPublished ? "Directory profile saved and published." : "Directory profile saved. It is not currently published." }));
  });

  router.get("/member/bulletin-board/", (request, response) => {
    const session = requireMember(request, response);
    if (!session) return;
    memberStore.recordPageVisit("/community/member/bulletin-board/", session.community_member_id);
    response.status(200).type("html").send(renderBulletinBoard(memberStore.listBulletinPosts()));
  });

  router.post("/member/bulletin-board", (request, response) => {
    const session = requireMember(request, response);
    if (!session) return;
    const subject = String(request.body.subject || "").trim();
    const body = String(request.body.body || "").trim();
    if (!subject || !body || subject.length > 160 || body.length > 5000) {
      response.status(400).type("html").send(renderBulletinBoard(memberStore.listBulletinPosts(), { message: "Post was not added. A subject and message are required and must be within the character limits." }));
      return;
    }
    memberStore.createBulletinPost(session.community_member_id, subject, body);
    response.redirect(303, "/community/member/bulletin-board/");
  });

  router.get("/member/bulletin-board/post/:postId/", (request, response) => {
    const session = requireMember(request, response);
    if (!session) return;
    const post = memberStore.getBulletinPost(request.params.postId);
    if (!post) { response.status(404).type("text").send("Bulletin Board post not found."); return; }
    response.status(200).type("html").send(renderBulletinThread(post, memberStore.listBulletinReplies(post.id)));
  });

  router.post("/member/bulletin-board/post/:postId/reply", async (request, response) => {
    const session = requireMember(request, response);
    if (!session) return;
    const post = memberStore.getBulletinPost(request.params.postId);
    if (!post) { response.status(404).type("text").send("Bulletin Board post not found."); return; }
    const body = String(request.body.body || "").trim();
    if (!body || body.length > 5000) {
      response.status(400).type("html").send(renderBulletinThread(post, memberStore.listBulletinReplies(post.id), { message: "Reply was not added. Enter a reply within the 5,000 character limit." }));
      return;
    }
    const replyId = memberStore.createBulletinReply(post.id, session.community_member_id, body);
    await deliverBulletinReplyNotifications({
      memberStore,
      emailProvider,
      smsProvider,
      config,
      post,
      replyId,
      replierMemberId: session.community_member_id,
      replyBody: body
    });
    response.redirect(303, `/community/member/bulletin-board/post/${encodeURIComponent(post.id)}/`);
  });

  router.get("/member/notifications/", (request, response) => {
    const session = requireMember(request, response);
    if (!session) return;
    response.status(200).type("html").send(renderNotifications(memberStore.listNotifications(session.community_member_id), memberStore.getNotificationPreferences(session.community_member_id)));
  });

  router.post("/member/notifications/read", (request, response) => {
    const session = requireMember(request, response);
    if (!session) return;
    memberStore.markNotificationsRead(session.community_member_id);
    response.redirect(303, "/community/member/notifications/");
  });

  router.post("/member/notifications/preferences", (request, response) => {
    const session = requireMember(request, response);
    if (!session) return;
    const smsPhone = String(request.body.sms_phone || "").trim();
    const smsEnabled = request.body.sms_replies_enabled === "yes";
    if (smsPhone.length > 30 || (smsEnabled && !smsPhone)) {
      response.status(400).type("html").send(renderNotifications(memberStore.listNotifications(session.community_member_id), memberStore.getNotificationPreferences(session.community_member_id), { message: "Preferences were not saved. Enter a mobile number if text notifications are selected." }));
      return;
    }
    const saved = memberStore.saveNotificationPreferences(session.community_member_id, {
      dashboardEnabled: request.body.dashboard_enabled === "yes",
      emailRepliesEnabled: request.body.email_replies_enabled === "yes",
      smsRepliesEnabled: smsEnabled,
      smsPhone
    });
    response.status(200).type("html").send(renderNotifications(memberStore.listNotifications(session.community_member_id), saved, { message: "Notification preferences saved." }));
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