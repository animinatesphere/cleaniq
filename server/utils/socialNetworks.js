// Facebook Pages, Instagram (business accounts), LinkedIn and X: connecting accounts (OAuth) and
// publishing posts with photos.
//
// Settings in server/.env (each network works once its keys are set):
//   META_APP_ID, META_APP_SECRET                 Facebook Pages + Instagram (Meta developer app)
//   LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET   LinkedIn (LINKEDIN_ORG_SCOPES=1 once LinkedIn approves
//                                                company page posting)
//   X_CLIENT_ID, X_CLIENT_SECRET                 X (OAuth 2.0 app with read + write)
//   PUBLIC_API_URL                               e.g. https://api.cleaniqservices.com (callbacks + photo links)
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const more = require("./socialMoreNetworks");
const { VIDEO } = require("./socialVideo");

const env = (k, d = "") => process.env[k] || d;
const API_BASE = () => env("PUBLIC_API_URL", "https://api.cleaniqservices.com").replace(/\/+$/, "");
const GRAPH = () => `${env("META_GRAPH_URL", "https://graph.facebook.com")}/${env("META_GRAPH_VERSION", "v23.0")}`;
const LI_API = () => env("LINKEDIN_API_URL", "https://api.linkedin.com");
const LI_AUTH = () => env("LINKEDIN_AUTH_URL", "https://www.linkedin.com");
const LI_VERSION = () => env("LINKEDIN_VERSION", "202610");
const X_API = () => env("X_API_URL", "https://api.x.com");
const X_AUTH = () => env("X_AUTH_URL", "https://x.com");

const callbackUrl = (network) => `${API_BASE()}/api/social/connect/${network}/callback`;

/** Which networks have their app keys set on the server. */
function configured() {
  return {
    meta: !!(env("META_APP_ID") && env("META_APP_SECRET")),
    linkedin: !!(env("LINKEDIN_CLIENT_ID") && env("LINKEDIN_CLIENT_SECRET")),
    x: !!(env("X_CLIENT_ID") && env("X_CLIENT_SECRET")),
    ...more.configured(),
  };
}

// ── helpers ───────────────────────────────────────────────────────────────────
// Facebook/Instagram (Graph API) requests are signed with the app secret ("appsecret_proof"), which
// Meta requires when the app's "Require App Secret" setting is on (and accepts when it's off).
const proof = (token) => crypto.createHmac("sha256", env("META_APP_SECRET")).update(token).digest("hex");
function signGraph(url, opts) {
  if (!env("META_APP_SECRET") || !String(url).startsWith(GRAPH())) return [url, opts];
  const u = new URL(url);
  if (u.searchParams.get("access_token") && !u.searchParams.has("appsecret_proof")) {
    u.searchParams.set("appsecret_proof", proof(u.searchParams.get("access_token")));
    url = u.toString();
  }
  const b = opts.body;
  if (b instanceof URLSearchParams && b.get("access_token") && !b.has("appsecret_proof")) {
    const body = new URLSearchParams(b);
    body.set("appsecret_proof", proof(b.get("access_token")));
    opts = { ...opts, body };
  }
  return [url, opts];
}

async function call(rawUrl, rawOpts = {}, what = "request") {
  const [url, opts] = signGraph(rawUrl, rawOpts);
  const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(60000) });
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text.slice(0, 300) }; }
  if (!res.ok) {
    const msg = data?.error?.message || data?.error_description || data?.detail || data?.message || data?.title || (typeof data?.error === "string" ? data.error : "") || data?.raw || `HTTP ${res.status}`;
    throw Object.assign(new Error(`${what}: ${msg}`), { status: res.status, data });
  }
  return { data, headers: res.headers };
}
const form = (obj) => new URLSearchParams(Object.entries(obj).filter(([, v]) => v != null && v !== ""));

// ── photos ────────────────────────────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "social");
const LIBRARY_DIR = () => env("SOCIAL_LIBRARY_DIR", path.join(__dirname, "..", "..", "src", "assets"));
const TYPES = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif", ".mp4": "video/mp4", ".mov": "video/quicktime", ".m4v": "video/mp4" };

/** A post's photo → its file on this server, its public web address and type. */
function resolvePhoto(ref) {
  const r = String(ref || "");
  let file, publicUrl;
  let m = r.match(/^\/uploads\/social\/([\w.-]+)$/);
  if (m) {
    file = path.join(UPLOAD_DIR, m[1]);
    publicUrl = `${API_BASE()}/uploads/social/${m[1]}`;
  } else if ((m = r.match(/^library:(our-work\/[\w.-]+)$/))) {
    file = path.join(LIBRARY_DIR(), m[1]);
    publicUrl = `${API_BASE()}/social-library/${m[1]}`;
  } else {
    throw new Error(`Unknown photo: ${r}`);
  }
  if (!fs.existsSync(file)) throw new Error(`Photo not found on the server: ${r}`);
  return { file, publicUrl, type: TYPES[path.extname(file).toLowerCase()] || "image/jpeg" };
}

/** Our own job photos (src/assets/our-work), as library photos the autopilot can use. */
function ourPhotos() {
  try {
    return fs.readdirSync(path.join(LIBRARY_DIR(), "our-work"))
      .filter((f) => /\.(jpe?g|png)$/i.test(f))
      .map((f) => ({ ref: `library:our-work/${f}`, description: `Our own photo from a real job: ${f.replace(/\.\w+$/, "").replace(/-\d+$/, "").replace(/-/g, " ")}` }));
  } catch {
    return [];
  }
}

// ── text per network ──────────────────────────────────────────────────────────
const X_LIMIT = 280;
// Most characters each network accepts (longer text is shortened at a word).
const LIMITS = { x: X_LIMIT, threads: 500, google: 1500, pinterest: 800, tiktok: 2200, youtube: 4900 };
function textFor(post, network) {
  let t = String(post.variants?.[network] || post.text || "").trim();
  const credit = post.credit ? `\n\n${post.credit}` : "";
  const limit = LIMITS[network];
  if (limit) {
    const room = limit - credit.length;
    if (t.length > room) t = `${t.slice(0, room - 1).replace(/\s+\S*$/, "")}…`;
  }
  return t + credit;
}
// LinkedIn's post text treats some characters as markup: escape them, keep #hashtags.
function linkedinText(t) {
  const tags = [];
  return String(t)
    .replace(/[\\|{}@[\]()<>*_~]/g, (c) => `\\${c}`)
    .replace(/(^|\s)#(\w+)/g, (m, sp, tag) => `${sp}\u0000${tags.push(tag) - 1}\u0000`)
    .replace(/#/g, "\\#")
    .replace(/\u0000(\d+)\u0000/g, (m, n) => `{hashtag|\\#|${tags[n]}}`);
}

// ── connect (OAuth) ───────────────────────────────────────────────────────────
const META_SCOPES = "pages_show_list,pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish,business_management";
const X_SCOPES = "tweet.read tweet.write users.read offline.access media.write";
const liScopes = () => ["openid", "profile", "w_member_social", ...(env("LINKEDIN_ORG_SCOPES") === "1" ? ["w_organization_social", "r_organization_social", "rw_organization_admin"] : [])].join(" ");

/** Where to send the person to approve access. `state` ties the reply to this request. */
function authUrl(network, state, verifier) {
  if (network === "meta") {
    return `${env("META_DIALOG_URL", "https://www.facebook.com")}/${env("META_GRAPH_VERSION", "v23.0")}/dialog/oauth?${form({ client_id: env("META_APP_ID"), redirect_uri: callbackUrl("meta"), state, scope: META_SCOPES, response_type: "code" })}`;
  }
  if (network === "linkedin") {
    return `${LI_AUTH()}/oauth/v2/authorization?${form({ response_type: "code", client_id: env("LINKEDIN_CLIENT_ID"), redirect_uri: callbackUrl("linkedin"), state, scope: liScopes() })}`;
  }
  if (network === "x") {
    const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
    return `${X_AUTH()}/i/oauth2/authorize?${form({ response_type: "code", client_id: env("X_CLIENT_ID"), redirect_uri: callbackUrl("x"), scope: X_SCOPES, state, code_challenge: challenge, code_challenge_method: "S256" })}`;
  }
  const other = more.authUrl(network, state, callbackUrl);
  if (other) return other;
  throw new Error("Unknown network");
}

/**
 * Finish connecting: swap the code for tokens and list the accounts it gives access to.
 * @returns {Promise<Array<{network, externalId, name, handle, picture, token, refreshToken?, expiresAt?}>>}
 */
async function finishConnect(network, code, verifier) {
  if (network === "meta") {
    const short = (await call(`${GRAPH()}/oauth/access_token?${form({ client_id: env("META_APP_ID"), client_secret: env("META_APP_SECRET"), redirect_uri: callbackUrl("meta"), code })}`, {}, "Facebook sign-in")).data;
    const long = (await call(`${GRAPH()}/oauth/access_token?${form({ grant_type: "fb_exchange_token", client_id: env("META_APP_ID"), client_secret: env("META_APP_SECRET"), fb_exchange_token: short.access_token })}`, {}, "Facebook sign-in")).data;
    // Page tokens from a long-lived user token don't expire.
    const pages = (await call(`${GRAPH()}/me/accounts?${form({ fields: "id,name,access_token,picture{url},instagram_business_account{id,username,profile_picture_url}", limit: "100", access_token: long.access_token })}`, {}, "Facebook pages")).data.data || [];
    if (!pages.length) throw new Error("No Facebook Pages were shared. Connect again and tick your business Page.");
    const out = [];
    for (const p of pages) {
      out.push({ network: "facebook", externalId: p.id, name: p.name, handle: "", picture: p.picture?.data?.url || "", token: p.access_token });
      const ig = p.instagram_business_account;
      if (ig?.id) out.push({ network: "instagram", externalId: ig.id, name: ig.username || p.name, handle: ig.username ? `@${ig.username}` : "", picture: ig.profile_picture_url || "", token: p.access_token });
    }
    return out;
  }
  if (network === "linkedin") {
    const tok = (await call(`${LI_AUTH()}/oauth/v2/accessToken`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form({ grant_type: "authorization_code", code, redirect_uri: callbackUrl("linkedin"), client_id: env("LINKEDIN_CLIENT_ID"), client_secret: env("LINKEDIN_CLIENT_SECRET") }) }, "LinkedIn sign-in")).data;
    const auth = { Authorization: `Bearer ${tok.access_token}` };
    const me = (await call(`${LI_API()}/v2/userinfo`, { headers: auth }, "LinkedIn profile")).data;
    const common = { token: tok.access_token, refreshToken: tok.refresh_token || "", expiresAt: tok.expires_in ? new Date(Date.now() + tok.expires_in * 1000) : null };
    const out = [{ network: "linkedin", externalId: `urn:li:person:${me.sub}`, name: me.name || "LinkedIn profile", handle: "Personal profile", picture: me.picture || "", ...common }];
    if (env("LINKEDIN_ORG_SCOPES") === "1") {
      try {
        const h = { ...auth, "LinkedIn-Version": LI_VERSION(), "X-Restli-Protocol-Version": "2.0.0" };
        const acls = (await call(`${LI_API()}/rest/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED`, { headers: h }, "LinkedIn pages")).data.elements || [];
        for (const a of acls) {
          const id = String(a.organization || "").split(":").pop();
          if (!id) continue;
          let name = "LinkedIn company page";
          try { name = (await call(`${LI_API()}/rest/organizations/${id}`, { headers: h }, "LinkedIn page")).data.localizedName || name; } catch {}
          out.push({ network: "linkedin", externalId: `urn:li:organization:${id}`, name, handle: "Company page", picture: "", ...common });
        }
      } catch (e) {
        console.warn("[social] LinkedIn company pages not listed:", e.message);
      }
    }
    return out;
  }
  if (network === "x") {
    const tok = await xToken({ grant_type: "authorization_code", code, redirect_uri: callbackUrl("x"), code_verifier: verifier, client_id: env("X_CLIENT_ID") });
    const me = (await call(`${X_API()}/2/users/me?user.fields=profile_image_url`, { headers: { Authorization: `Bearer ${tok.access_token}` } }, "X profile")).data.data;
    return [{ network: "x", externalId: me.id, name: me.name, handle: `@${me.username}`, picture: me.profile_image_url || "", token: tok.access_token, refreshToken: tok.refresh_token || "", expiresAt: new Date(Date.now() + (tok.expires_in || 7200) * 1000) }];
  }
  const other = await more.finishConnect(network, code, callbackUrl, call);
  if (other) return other;
  throw new Error("Unknown network");
}

async function xToken(params) {
  const basic = Buffer.from(`${env("X_CLIENT_ID")}:${env("X_CLIENT_SECRET")}`).toString("base64");
  return (await call(`${X_API()}/2/oauth2/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${basic}` }, body: form(params) }, "X sign-in")).data;
}

/** X tokens last 2 hours: get a fresh one with the refresh token. Returns new token fields. */
async function refreshX(refreshToken) {
  const tok = await xToken({ grant_type: "refresh_token", refresh_token: refreshToken, client_id: env("X_CLIENT_ID") });
  return { token: tok.access_token, refreshToken: tok.refresh_token || refreshToken, expiresAt: new Date(Date.now() + (tok.expires_in || 7200) * 1000) };
}

// ── publish ───────────────────────────────────────────────────────────────────
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function publishFacebook(acc, text, photos) {
  const t = acc.token;
  if (!photos.length) {
    const { data } = await call(`${GRAPH()}/${acc.externalId}/feed`, { method: "POST", body: form({ message: text, access_token: t }) }, "Facebook post");
    return { externalId: data.id, url: `https://www.facebook.com/${data.id}` };
  }
  if (photos.length === 1) {
    const { data } = await call(`${GRAPH()}/${acc.externalId}/photos`, { method: "POST", body: form({ url: photos[0].publicUrl, caption: text, access_token: t }) }, "Facebook photo post");
    const id = data.post_id || data.id;
    return { externalId: id, url: `https://www.facebook.com/${id}` };
  }
  const ids = [];
  for (const p of photos) {
    const { data } = await call(`${GRAPH()}/${acc.externalId}/photos`, { method: "POST", body: form({ url: p.publicUrl, published: "false", access_token: t }) }, "Facebook photo upload");
    ids.push(data.id);
  }
  const body = form({ message: text, access_token: t });
  ids.forEach((id, i) => body.append(`attached_media[${i}]`, JSON.stringify({ media_fbid: id })));
  const { data } = await call(`${GRAPH()}/${acc.externalId}/feed`, { method: "POST", body }, "Facebook post");
  return { externalId: data.id, url: `https://www.facebook.com/${data.id}` };
}

async function igReady(id, token) {
  for (let i = 0; i < 20; i++) {
    const { data } = await call(`${GRAPH()}/${id}?${form({ fields: "status_code", access_token: token })}`, {}, "Instagram photo check");
    if (!data.status_code || data.status_code === "FINISHED") return;
    if (data.status_code === "ERROR" || data.status_code === "EXPIRED") throw new Error("Instagram couldn't process the photo (it must be a JPEG under 8 MB).");
    await wait(Number(env("SOCIAL_IG_POLL_MS", "3000")));
  }
  throw new Error("Instagram took too long to process the photo.");
}

async function publishInstagram(acc, text, photos) {
  if (!photos.length) throw new Error("Instagram posts need at least one photo.");
  const bad = photos.find((p) => p.type !== "image/jpeg");
  if (bad) throw new Error("Instagram only accepts JPEG photos. Use a .jpg photo for Instagram.");
  const t = acc.token;
  const ig = acc.externalId;
  let creation;
  if (photos.length === 1) {
    creation = (await call(`${GRAPH()}/${ig}/media`, { method: "POST", body: form({ image_url: photos[0].publicUrl, caption: text, access_token: t }) }, "Instagram photo")).data.id;
  } else {
    const children = [];
    for (const p of photos.slice(0, 10)) {
      const id = (await call(`${GRAPH()}/${ig}/media`, { method: "POST", body: form({ image_url: p.publicUrl, is_carousel_item: "true", access_token: t }) }, "Instagram photo")).data.id;
      await igReady(id, t);
      children.push(id);
    }
    creation = (await call(`${GRAPH()}/${ig}/media`, { method: "POST", body: form({ media_type: "CAROUSEL", children: children.join(","), caption: text, access_token: t }) }, "Instagram carousel")).data.id;
  }
  await igReady(creation, t);
  const { data } = await call(`${GRAPH()}/${ig}/media_publish`, { method: "POST", body: form({ creation_id: creation, access_token: t }) }, "Instagram post");
  let url = "";
  try { url = (await call(`${GRAPH()}/${data.id}?${form({ fields: "permalink", access_token: t })}`, {}, "Instagram link")).data.permalink || ""; } catch {}
  return { externalId: data.id, url };
}

async function publishLinkedIn(acc, text, photos) {
  const h = { Authorization: `Bearer ${acc.token}`, "LinkedIn-Version": LI_VERSION(), "X-Restli-Protocol-Version": "2.0.0", "Content-Type": "application/json" };
  const images = [];
  for (const p of photos.slice(0, 20)) {
    const { data } = await call(`${LI_API()}/rest/images?action=initializeUpload`, { method: "POST", headers: h, body: JSON.stringify({ initializeUploadRequest: { owner: acc.externalId } }) }, "LinkedIn photo");
    const up = await fetch(data.value.uploadUrl, { method: "PUT", headers: { Authorization: `Bearer ${acc.token}`, "Content-Type": p.type }, body: fs.readFileSync(p.file), signal: AbortSignal.timeout(60000) });
    if (!up.ok) throw new Error(`LinkedIn photo upload: HTTP ${up.status}`);
    images.push(data.value.image);
  }
  const body = {
    author: acc.externalId,
    commentary: linkedinText(text),
    visibility: "PUBLIC",
    distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
    ...(images.length === 1 ? { content: { media: { id: images[0] } } } : images.length > 1 ? { content: { multiImage: { images: images.map((id) => ({ id })) } } } : {}),
  };
  const { headers } = await call(`${LI_API()}/rest/posts`, { method: "POST", headers: h, body: JSON.stringify(body) }, "LinkedIn post");
  const urn = headers.get("x-restli-id") || headers.get("x-linkedin-id") || "";
  return { externalId: urn, url: urn ? `https://www.linkedin.com/feed/update/${urn}` : "" };
}

async function publishX(acc, text, photos) {
  const auth = { Authorization: `Bearer ${acc.token}` };
  const mediaIds = [];
  for (const p of photos.slice(0, 4)) {
    const fd = new FormData();
    fd.append("media", new Blob([fs.readFileSync(p.file)], { type: p.type }), path.basename(p.file));
    fd.append("media_category", "tweet_image");
    const { data } = await call(`${X_API()}/2/media/upload`, { method: "POST", headers: auth, body: fd }, "X photo upload");
    mediaIds.push(data.data?.id || data.media_id_string || data.id);
  }
  const { data } = await call(`${X_API()}/2/tweets`, { method: "POST", headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify({ text, ...(mediaIds.length ? { media: { media_ids: mediaIds } } : {}) }) }, "X post");
  return { externalId: data.data.id, url: `https://x.com/i/web/status/${data.data.id}` };
}

/** Post to one account. `acc.token` must already be decrypted. */
async function publishTo(acc, post) {
  const photos = (post.images || []).map(resolvePhoto);
  const text = textFor(post, acc.network);
  if (post.video) {
    const video = resolvePhoto(post.video);
    // Google Business Profile posts can't hold a video: post the text (and button) on its own.
    if (acc.network === "google") {
      const r = await more.PUBLISH.google(acc, text, [], call);
      return { ...r, note: "Google Business posts can't include video, so this went out as text" };
    }
    if (!VIDEO[acc.network]) throw new Error("This network can't post videos.");
    return VIDEO[acc.network](acc, text, video, photos[0] || null, call, { linkedinText });
  }
  if (acc.network === "youtube") throw new Error("YouTube needs a video. Add a video to the post or untick YouTube.");
  if (acc.network === "facebook") return publishFacebook(acc, text, photos);
  if (acc.network === "instagram") return publishInstagram(acc, text, photos);
  if (acc.network === "linkedin") return publishLinkedIn(acc, text, photos);
  if (acc.network === "x") return publishX(acc, text, photos);
  if (more.PUBLISH[acc.network]) return more.PUBLISH[acc.network](acc, text, photos, call);
  throw new Error("Unknown network");
}

/** Accounts whose token runs out: when to renew, and how. */
const REFRESH_AHEAD = { x: 5 * 60e3, ...more.REFRESH_AHEAD };
async function refreshToken(network, tokens) {
  if (network === "x") return refreshX(tokens.refreshToken);
  return more.refresh(network, tokens, call);
}

module.exports = { configured, authUrl, finishConnect, refreshX, refreshToken, REFRESH_AHEAD, LIMITS, publishTo, resolvePhoto, ourPhotos, textFor, linkedinText, callbackUrl, UPLOAD_DIR, X_LIMIT };
