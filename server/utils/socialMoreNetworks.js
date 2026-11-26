// More networks for the social dashboard: Google Business Profile, Threads, TikTok and Pinterest.
// Connecting (OAuth), refreshing tokens and publishing. See socialNetworks.js for the shared parts.
//
// Settings in server/.env (each network works once its keys are set):
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET           Google Business Profile (Google Cloud OAuth client;
//                                                    Google must approve Business Profile API access)
//   THREADS_APP_ID, THREADS_APP_SECRET               Threads (Meta app with the Threads use case)
//   TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET          TikTok (Content Posting API; posts are private
//                                                    until TikTok audits the app)
//   PINTEREST_APP_ID, PINTEREST_APP_SECRET           Pinterest
const env = (k, d = "") => process.env[k] || d;
const GOOGLE_AUTH = () => env("GOOGLE_AUTH_URL", "https://accounts.google.com");
const GOOGLE_TOKEN = () => env("GOOGLE_TOKEN_URL", "https://oauth2.googleapis.com");
const GBP_ACCOUNTS = () => env("GBP_ACCOUNTS_URL", "https://mybusinessaccountmanagement.googleapis.com");
const GBP_INFO = () => env("GBP_INFO_URL", "https://mybusinessbusinessinformation.googleapis.com");
const GBP_POSTS = () => env("GBP_POSTS_URL", "https://mybusiness.googleapis.com");
const THREADS_AUTH = () => env("THREADS_AUTH_URL", "https://threads.net");
const THREADS_API = () => env("THREADS_API_URL", "https://graph.threads.net");
const TIKTOK_AUTH = () => env("TIKTOK_AUTH_URL", "https://www.tiktok.com");
const TIKTOK_API = () => env("TIKTOK_API_URL", "https://open.tiktokapis.com");
const PIN_AUTH = () => env("PINTEREST_AUTH_URL", "https://www.pinterest.com");
const PIN_API = () => env("PINTEREST_API_URL", "https://api.pinterest.com");
const SITE = () => env("SOCIAL_SITE_URL", "https://www.cleaniqservices.com");
const YT_API = () => env("YOUTUBE_API_URL", "https://www.googleapis.com");

const configured = () => ({
  google: !!(env("GOOGLE_CLIENT_ID") && env("GOOGLE_CLIENT_SECRET")),
  youtube: !!(env("GOOGLE_CLIENT_ID") && env("GOOGLE_CLIENT_SECRET")),
  threads: !!(env("THREADS_APP_ID") && env("THREADS_APP_SECRET")),
  tiktok: !!(env("TIKTOK_CLIENT_KEY") && env("TIKTOK_CLIENT_SECRET")),
  pinterest: !!(env("PINTEREST_APP_ID") && env("PINTEREST_APP_SECRET")),
});

const form = (obj) => new URLSearchParams(Object.entries(obj).filter(([, v]) => v != null && v !== ""));
const expiry = (seconds, fallback) => new Date(Date.now() + (Number(seconds) || fallback) * 1000);
const basic = (id, secret) => `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`;

// ── connect ───────────────────────────────────────────────────────────────────
function authUrl(network, state, callbackUrl) {
  const redirect = callbackUrl(network);
  if (network === "google") return `${GOOGLE_AUTH()}/o/oauth2/v2/auth?${form({ client_id: env("GOOGLE_CLIENT_ID"), redirect_uri: redirect, response_type: "code", scope: "https://www.googleapis.com/auth/business.manage", access_type: "offline", prompt: "consent", include_granted_scopes: "true", state })}`;
  if (network === "youtube") return `${GOOGLE_AUTH()}/o/oauth2/v2/auth?${form({ client_id: env("GOOGLE_CLIENT_ID"), redirect_uri: redirect, response_type: "code", scope: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly", access_type: "offline", prompt: "consent", include_granted_scopes: "true", state })}`;
  if (network === "threads") return `${THREADS_AUTH()}/oauth/authorize?${form({ client_id: env("THREADS_APP_ID"), redirect_uri: redirect, scope: "threads_basic,threads_content_publish", response_type: "code", state })}`;
  if (network === "tiktok") return `${TIKTOK_AUTH()}/v2/auth/authorize/?${form({ client_key: env("TIKTOK_CLIENT_KEY"), redirect_uri: redirect, scope: "user.info.basic,video.publish", response_type: "code", state })}`;
  if (network === "pinterest") return `${PIN_AUTH()}/oauth/?${form({ client_id: env("PINTEREST_APP_ID"), redirect_uri: redirect, response_type: "code", scope: "boards:read,pins:read,pins:write,user_accounts:read", state })}`;
  return null;
}

async function finishConnect(network, code, callbackUrl, call) {
  const redirect = callbackUrl(network);
  if (network === "google") {
    const tok = (await call(`${GOOGLE_TOKEN()}/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form({ code, client_id: env("GOOGLE_CLIENT_ID"), client_secret: env("GOOGLE_CLIENT_SECRET"), redirect_uri: redirect, grant_type: "authorization_code" }) }, "Google sign-in")).data;
    const auth = { Authorization: `Bearer ${tok.access_token}` };
    const accounts = (await call(`${GBP_ACCOUNTS()}/v1/accounts`, { headers: auth }, "Google Business accounts")).data.accounts || [];
    const out = [];
    for (const acc of accounts) {
      const locs = (await call(`${GBP_INFO()}/v1/${acc.name}/locations?${form({ readMask: "name,title,storefrontAddress", pageSize: "100" })}`, { headers: auth }, "Google Business locations")).data.locations || [];
      for (const l of locs) {
        // Posts use the older API's path: accounts/{a}/locations/{l}.
        const path = `${acc.name}/${l.name}`;
        out.push({ network: "google", externalId: path, name: l.title || "Business Profile", handle: l.storefrontAddress?.locality || "Google Business Profile", picture: "", token: tok.access_token, refreshToken: tok.refresh_token || "", expiresAt: expiry(tok.expires_in, 3600) });
      }
    }
    if (!out.length) throw new Error("No Google Business Profile locations were found for this Google account.");
    return out;
  }
  if (network === "youtube") {
    const tok = (await call(`${GOOGLE_TOKEN()}/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form({ code, client_id: env("GOOGLE_CLIENT_ID"), client_secret: env("GOOGLE_CLIENT_SECRET"), redirect_uri: redirect, grant_type: "authorization_code" }) }, "Google sign-in")).data;
    const channels = (await call(`${YT_API()}/youtube/v3/channels?part=snippet&mine=true`, { headers: { Authorization: `Bearer ${tok.access_token}` } }, "YouTube channel")).data.items || [];
    if (!channels.length) throw new Error("This Google account has no YouTube channel. Create one on YouTube first, then connect again.");
    return channels.map((c) => ({ network: "youtube", externalId: c.id, name: c.snippet?.title || "YouTube channel", handle: c.snippet?.customUrl || "YouTube", picture: c.snippet?.thumbnails?.default?.url || "", token: tok.access_token, refreshToken: tok.refresh_token || "", expiresAt: expiry(tok.expires_in, 3600) }));
  }
  if (network === "threads") {
    const short = (await call(`${THREADS_API()}/oauth/access_token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form({ client_id: env("THREADS_APP_ID"), client_secret: env("THREADS_APP_SECRET"), grant_type: "authorization_code", redirect_uri: redirect, code }) }, "Threads sign-in")).data;
    const long = (await call(`${THREADS_API()}/access_token?${form({ grant_type: "th_exchange_token", client_secret: env("THREADS_APP_SECRET"), access_token: short.access_token })}`, {}, "Threads sign-in")).data;
    const me = (await call(`${THREADS_API()}/v1.0/me?${form({ fields: "id,username,threads_profile_picture_url", access_token: long.access_token })}`, {}, "Threads profile")).data;
    // Long-lived Threads tokens last 60 days and are refreshed before posting.
    return [{ network: "threads", externalId: me.id, name: me.username, handle: `@${me.username}`, picture: me.threads_profile_picture_url || "", token: long.access_token, refreshToken: "", expiresAt: expiry(long.expires_in, 60 * 86400) }];
  }
  if (network === "tiktok") {
    const tok = (await call(`${TIKTOK_API()}/v2/oauth/token/`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form({ client_key: env("TIKTOK_CLIENT_KEY"), client_secret: env("TIKTOK_CLIENT_SECRET"), code, grant_type: "authorization_code", redirect_uri: redirect }) }, "TikTok sign-in")).data;
    if (tok.error) throw new Error(`TikTok sign-in: ${tok.error_description || tok.error}`);
    const me = (await call(`${TIKTOK_API()}/v2/user/info/?fields=open_id,display_name,avatar_url`, { headers: { Authorization: `Bearer ${tok.access_token}` } }, "TikTok profile")).data.data?.user || {};
    return [{ network: "tiktok", externalId: me.open_id || tok.open_id, name: me.display_name || "TikTok", handle: "TikTok", picture: me.avatar_url || "", token: tok.access_token, refreshToken: tok.refresh_token || "", expiresAt: expiry(tok.expires_in, 86400) }];
  }
  if (network === "pinterest") {
    const tok = (await call(`${PIN_API()}/v5/oauth/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: basic(env("PINTEREST_APP_ID"), env("PINTEREST_APP_SECRET")) }, body: form({ grant_type: "authorization_code", code, redirect_uri: redirect }) }, "Pinterest sign-in")).data;
    const auth = { Authorization: `Bearer ${tok.access_token}` };
    const me = (await call(`${PIN_API()}/v5/user_account`, { headers: auth }, "Pinterest profile")).data;
    const boards = (await call(`${PIN_API()}/v5/boards?page_size=100`, { headers: auth }, "Pinterest boards")).data.items || [];
    if (!boards.length) throw new Error("Your Pinterest account has no boards. Create a board on Pinterest first, then connect again.");
    // Each board is its own "account" to post to.
    return boards.map((b) => ({ network: "pinterest", externalId: b.id, name: b.name, handle: `@${me.username} · board`, picture: me.profile_image || "", token: tok.access_token, refreshToken: tok.refresh_token || "", expiresAt: expiry(tok.expires_in, 30 * 86400) }));
  }
  return null;
}

/** Fresh token fields for an account whose token is running out. */
async function refresh(network, { token, refreshToken }, call) {
  if (network === "google" || network === "youtube") {
    const t = (await call(`${GOOGLE_TOKEN()}/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form({ client_id: env("GOOGLE_CLIENT_ID"), client_secret: env("GOOGLE_CLIENT_SECRET"), refresh_token: refreshToken, grant_type: "refresh_token" }) }, "Google sign-in")).data;
    return { token: t.access_token, refreshToken, expiresAt: expiry(t.expires_in, 3600) };
  }
  if (network === "threads") {
    const t = (await call(`${THREADS_API()}/refresh_access_token?${form({ grant_type: "th_refresh_token", access_token: token })}`, {}, "Threads sign-in")).data;
    return { token: t.access_token, refreshToken: "", expiresAt: expiry(t.expires_in, 60 * 86400) };
  }
  if (network === "tiktok") {
    const t = (await call(`${TIKTOK_API()}/v2/oauth/token/`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form({ client_key: env("TIKTOK_CLIENT_KEY"), client_secret: env("TIKTOK_CLIENT_SECRET"), grant_type: "refresh_token", refresh_token: refreshToken }) }, "TikTok sign-in")).data;
    if (t.error) throw new Error(`TikTok sign-in: ${t.error_description || t.error}. Reconnect TikTok on the Accounts page.`);
    return { token: t.access_token, refreshToken: t.refresh_token || refreshToken, expiresAt: expiry(t.expires_in, 86400) };
  }
  if (network === "pinterest") {
    const t = (await call(`${PIN_API()}/v5/oauth/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: basic(env("PINTEREST_APP_ID"), env("PINTEREST_APP_SECRET")) }, body: form({ grant_type: "refresh_token", refresh_token: refreshToken }) }, "Pinterest sign-in")).data;
    return { token: t.access_token, refreshToken: t.refresh_token || refreshToken, expiresAt: expiry(t.expires_in, 30 * 86400) };
  }
  return null;
}
// How long before running out a token is refreshed (Threads: renew a week ahead; others: minutes).
const REFRESH_AHEAD = { google: 5 * 60e3, youtube: 5 * 60e3, threads: 7 * 86400e3, tiktok: 30 * 60e3, pinterest: 2 * 86400e3 };

// ── publish ───────────────────────────────────────────────────────────────────
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function publishGoogle(acc, text, photos, call) {
  const body = {
    languageCode: "en-GB",
    summary: text,
    topicType: "STANDARD",
    callToAction: { actionType: "LEARN_MORE", url: SITE() },
    ...(photos.length ? { media: photos.slice(0, 10).map((p) => ({ mediaFormat: "PHOTO", sourceUrl: p.publicUrl })) } : {}),
  };
  const { data } = await call(`${GBP_POSTS()}/v4/${acc.externalId}/localPosts`, { method: "POST", headers: { Authorization: `Bearer ${acc.token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) }, "Google Business post");
  return { externalId: data.name || "", url: data.searchUrl || "" };
}

async function threadsReady(id, token, call) {
  for (let i = 0; i < 20; i++) {
    const { data } = await call(`${THREADS_API()}/v1.0/${id}?${form({ fields: "status,error_message", access_token: token })}`, {}, "Threads photo check");
    if (!data.status || data.status === "FINISHED") return;
    if (data.status === "ERROR" || data.status === "EXPIRED") throw new Error(`Threads couldn't process the post${data.error_message ? `: ${data.error_message}` : ""}.`);
    await wait(Number(env("SOCIAL_IG_POLL_MS", "3000")));
  }
  throw new Error("Threads took too long to process the post.");
}
async function publishThreads(acc, text, photos, call) {
  const t = acc.token;
  const u = acc.externalId;
  const make = (params, what) => call(`${THREADS_API()}/v1.0/${u}/threads`, { method: "POST", body: form({ ...params, access_token: t }) }, what);
  let creation;
  if (!photos.length) creation = (await make({ media_type: "TEXT", text }, "Threads post")).data.id;
  else if (photos.length === 1) creation = (await make({ media_type: "IMAGE", image_url: photos[0].publicUrl, text }, "Threads post")).data.id;
  else {
    const kids = [];
    for (const p of photos.slice(0, 20)) {
      const id = (await make({ media_type: "IMAGE", image_url: p.publicUrl, is_carousel_item: "true" }, "Threads photo")).data.id;
      kids.push(id);
    }
    creation = (await make({ media_type: "CAROUSEL", children: kids.join(","), text }, "Threads post")).data.id;
  }
  await threadsReady(creation, t, call);
  const { data } = await call(`${THREADS_API()}/v1.0/${u}/threads_publish`, { method: "POST", body: form({ creation_id: creation, access_token: t }) }, "Threads post");
  let url = "";
  try { url = (await call(`${THREADS_API()}/v1.0/${data.id}?${form({ fields: "permalink", access_token: t })}`, {}, "Threads link")).data.permalink || ""; } catch {}
  return { externalId: data.id, url };
}

async function publishTikTok(acc, text, photos, call) {
  if (!photos.length) throw new Error("TikTok posts need at least one photo.");
  if (photos.some((p) => !/image\/(jpeg|webp)/.test(p.type))) throw new Error("TikTok only accepts JPEG or WebP photos.");
  const h = { Authorization: `Bearer ${acc.token}`, "Content-Type": "application/json; charset=UTF-8" };
  // Apps TikTok hasn't audited yet may only post privately ("only me").
  const info = (await call(`${TIKTOK_API()}/v2/post/publish/creator_info/query/`, { method: "POST", headers: h, body: "{}" }, "TikTok account check")).data.data || {};
  const options = info.privacy_level_options || [];
  const privacy = options.includes("PUBLIC_TO_EVERYONE") ? "PUBLIC_TO_EVERYONE" : options[0] || "SELF_ONLY";
  const firstLine = text.split("\n")[0].replace(/#\w+/g, "").trim();
  const body = {
    media_type: "PHOTO",
    post_mode: "DIRECT_POST",
    post_info: { title: firstLine.slice(0, 90), description: text.slice(0, 4000), privacy_level: privacy, disable_comment: false, auto_add_music: true },
    source_info: { source: "PULL_FROM_URL", photo_cover_index: 0, photo_images: photos.slice(0, 35).map((p) => p.publicUrl) },
  };
  const { data } = await call(`${TIKTOK_API()}/v2/post/publish/content/init/`, { method: "POST", headers: h, body: JSON.stringify(body) }, "TikTok post");
  if (data.error?.code && data.error.code !== "ok") throw new Error(`TikTok post: ${data.error.message || data.error.code}`);
  return { externalId: data.data?.publish_id || "", url: "", note: privacy === "SELF_ONLY" ? "Posted as private (TikTok hasn't approved the app for public posts yet)" : "" };
}

async function publishPinterest(acc, text, photos, call) {
  if (!photos.length) throw new Error("Pinterest pins need a photo.");
  const title = text.split("\n")[0].replace(/#\w+/g, "").trim().slice(0, 100);
  const media = photos.length === 1
    ? { source_type: "image_url", url: photos[0].publicUrl }
    : { source_type: "multiple_image_urls", items: photos.slice(0, 5).map((p) => ({ url: p.publicUrl, title, link: SITE() })) };
  const { data } = await call(`${PIN_API()}/v5/pins`, { method: "POST", headers: { Authorization: `Bearer ${acc.token}`, "Content-Type": "application/json" }, body: JSON.stringify({ board_id: acc.externalId, title, description: text.slice(0, 800), link: SITE(), media_source: media }) }, "Pinterest pin");
  return { externalId: data.id, url: `https://www.pinterest.com/pin/${data.id}/` };
}

const PUBLISH = { google: publishGoogle, threads: publishThreads, tiktok: publishTikTok, pinterest: publishPinterest };

module.exports = { configured, authUrl, finishConnect, refresh, REFRESH_AHEAD, PUBLISH };
