// Video posts for every network that takes them: Facebook (Page video), Instagram (Reel), LinkedIn,
// X, Threads, TikTok, Pinterest (video pin, needs a cover photo) and YouTube. Google Business
// Profile posts can't include video, so they go out as text with the website button.
//
// Networks that fetch the video themselves (Facebook, Instagram, Threads) get its public
// address; the others (LinkedIn, X, TikTok, Pinterest, YouTube) are sent the file.
const fs = require("fs");

const env = (k, d = "") => process.env[k] || d;
const GRAPH = () => `${env("META_GRAPH_URL", "https://graph.facebook.com")}/${env("META_GRAPH_VERSION", "v23.0")}`;
const LI_API = () => env("LINKEDIN_API_URL", "https://api.linkedin.com");
const X_API = () => env("X_API_URL", "https://api.x.com");
const THREADS_API = () => env("THREADS_API_URL", "https://graph.threads.net");
const TIKTOK_API = () => env("TIKTOK_API_URL", "https://open.tiktokapis.com");
const PIN_API = () => env("PINTEREST_API_URL", "https://api.pinterest.com");
const YT_UPLOAD = () => env("YOUTUBE_UPLOAD_URL", "https://www.googleapis.com");
const SITE = () => env("SOCIAL_SITE_URL", "https://www.cleaniqservices.com");
const POLL_MS = () => Number(env("SOCIAL_IG_POLL_MS", "5000"));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const form = (obj) => new URLSearchParams(Object.entries(obj).filter(([, v]) => v != null && v !== ""));
const title = (text, max) => text.split("\n")[0].replace(/#\w+/g, "").trim().slice(0, max) || "Cleaniq Services";

/** Poll until the network has finished processing the video (videos take a while). */
async function until(check, what, tries = 60) {
  for (let i = 0; i < tries; i++) {
    const state = await check();
    if (state === "done") return;
    if (state && state !== "wait") throw new Error(`${what}: ${state}`);
    await wait(POLL_MS());
  }
  throw new Error(`${what} took too long to process the video.`);
}

async function facebook(acc, text, video, cover, call) {
  const { data } = await call(`${GRAPH()}/${acc.externalId}/videos`, { method: "POST", body: form({ file_url: video.publicUrl, description: text, access_token: acc.token }) }, "Facebook video");
  return { externalId: data.id, url: `https://www.facebook.com/${data.id}` };
}

async function instagram(acc, text, video, cover, call) {
  const t = acc.token;
  const id = (await call(`${GRAPH()}/${acc.externalId}/media`, { method: "POST", body: form({ media_type: "REELS", video_url: video.publicUrl, caption: text, share_to_feed: "true", access_token: t }) }, "Instagram Reel")).data.id;
  await until(async () => {
    const s = (await call(`${GRAPH()}/${id}?${form({ fields: "status_code,status", access_token: t })}`, {}, "Instagram Reel check")).data;
    return !s.status_code || s.status_code === "FINISHED" ? "done" : s.status_code === "ERROR" || s.status_code === "EXPIRED" ? `Instagram couldn't process the video (${s.status || "use an MP4, 3-90 seconds"})` : "wait";
  }, "Instagram");
  const { data } = await call(`${GRAPH()}/${acc.externalId}/media_publish`, { method: "POST", body: form({ creation_id: id, access_token: t }) }, "Instagram Reel");
  let url = "";
  try { url = (await call(`${GRAPH()}/${data.id}?${form({ fields: "permalink", access_token: t })}`, {}, "Instagram link")).data.permalink || ""; } catch {}
  return { externalId: data.id, url };
}

async function linkedin(acc, text, video, cover, call, extra) {
  const h = { Authorization: `Bearer ${acc.token}`, "LinkedIn-Version": env("LINKEDIN_VERSION", "202610"), "X-Restli-Protocol-Version": "2.0.0", "Content-Type": "application/json" };
  const bytes = fs.readFileSync(video.file);
  const init = (await call(`${LI_API()}/rest/videos?action=initializeUpload`, { method: "POST", headers: h, body: JSON.stringify({ initializeUploadRequest: { owner: acc.externalId, fileSizeBytes: bytes.length, uploadCaptions: false, uploadThumbnail: false } }) }, "LinkedIn video")).data.value;
  const etags = [];
  for (const part of init.uploadInstructions || []) {
    const res = await fetch(part.uploadUrl, { method: "PUT", headers: { "Content-Type": "application/octet-stream" }, body: bytes.subarray(part.firstByte, part.lastByte + 1), signal: AbortSignal.timeout(300000) });
    if (!res.ok) throw new Error(`LinkedIn video upload: HTTP ${res.status}`);
    etags.push(res.headers.get("etag"));
  }
  await call(`${LI_API()}/rest/videos?action=finalizeUpload`, { method: "POST", headers: h, body: JSON.stringify({ finalizeUploadRequest: { video: init.video, uploadToken: init.uploadToken || "", uploadedPartIds: etags } }) }, "LinkedIn video");
  const body = { author: acc.externalId, commentary: extra.linkedinText(text), visibility: "PUBLIC", distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] }, content: { media: { id: init.video, title: title(text, 200) } }, lifecycleState: "PUBLISHED", isReshareDisabledByAuthor: false };
  const { headers } = await call(`${LI_API()}/rest/posts`, { method: "POST", headers: h, body: JSON.stringify(body) }, "LinkedIn post");
  const urn = headers.get("x-restli-id") || "";
  return { externalId: urn, url: urn ? `https://www.linkedin.com/feed/update/${urn}` : "" };
}

async function x(acc, text, video, cover, call) {
  const auth = { Authorization: `Bearer ${acc.token}` };
  const bytes = fs.readFileSync(video.file);
  const init = (await call(`${X_API()}/2/media/upload/initialize`, { method: "POST", headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify({ media_type: video.type, total_bytes: bytes.length, media_category: "tweet_video" }) }, "X video")).data.data;
  const CHUNK = 4 * 1024 * 1024;
  for (let i = 0, seg = 0; i < bytes.length; i += CHUNK, seg++) {
    const fd = new FormData();
    fd.append("media", new Blob([bytes.subarray(i, i + CHUNK)]), "chunk");
    fd.append("segment_index", String(seg));
    await call(`${X_API()}/2/media/upload/${init.id}/append`, { method: "POST", headers: auth, body: fd }, "X video upload");
  }
  let info = (await call(`${X_API()}/2/media/upload/${init.id}/finalize`, { method: "POST", headers: auth }, "X video")).data.data || {};
  await until(async () => {
    const st = info.processing_info?.state;
    if (!st || st === "succeeded") return "done";
    if (st === "failed") return `X couldn't process the video (${info.processing_info?.error?.message || "use an MP4 under 140 seconds"})`;
    info = (await call(`${X_API()}/2/media/upload?${form({ command: "STATUS", media_id: init.id })}`, { headers: auth }, "X video check")).data.data || {};
    return "wait";
  }, "X");
  const { data } = await call(`${X_API()}/2/tweets`, { method: "POST", headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify({ text, media: { media_ids: [init.id] } }) }, "X post");
  return { externalId: data.data.id, url: `https://x.com/i/web/status/${data.data.id}` };
}

async function threads(acc, text, video, cover, call) {
  const t = acc.token;
  const id = (await call(`${THREADS_API()}/v1.0/${acc.externalId}/threads`, { method: "POST", body: form({ media_type: "VIDEO", video_url: video.publicUrl, text, access_token: t }) }, "Threads video")).data.id;
  await until(async () => {
    const s = (await call(`${THREADS_API()}/v1.0/${id}?${form({ fields: "status,error_message", access_token: t })}`, {}, "Threads video check")).data;
    return !s.status || s.status === "FINISHED" ? "done" : s.status === "ERROR" || s.status === "EXPIRED" ? `Threads couldn't process the video${s.error_message ? ` (${s.error_message})` : ""}` : "wait";
  }, "Threads");
  const { data } = await call(`${THREADS_API()}/v1.0/${acc.externalId}/threads_publish`, { method: "POST", body: form({ creation_id: id, access_token: t }) }, "Threads post");
  let url = "";
  try { url = (await call(`${THREADS_API()}/v1.0/${data.id}?${form({ fields: "permalink", access_token: t })}`, {}, "Threads link")).data.permalink || ""; } catch {}
  return { externalId: data.id, url };
}

async function tiktok(acc, text, video, cover, call) {
  const h = { Authorization: `Bearer ${acc.token}`, "Content-Type": "application/json; charset=UTF-8" };
  const info = (await call(`${TIKTOK_API()}/v2/post/publish/creator_info/query/`, { method: "POST", headers: h, body: "{}" }, "TikTok account check")).data.data || {};
  const options = info.privacy_level_options || [];
  const privacy = options.includes("PUBLIC_TO_EVERYONE") ? "PUBLIC_TO_EVERYONE" : options[0] || "SELF_ONLY";
  // We send the file ourselves (FILE_UPLOAD) so TikTok doesn't need our web address verified.
  // TikTok's rules: one piece if it's under 64MB, otherwise 10MB pieces with the last one taking the rest.
  const bytes = fs.readFileSync(video.file);
  const size = bytes.length;
  const MB = 1024 * 1024;
  const chunk = size <= 64 * MB ? size : 10 * MB;
  const count = size <= 64 * MB ? 1 : Math.floor(size / chunk);
  const body = { post_info: { title: text.slice(0, 2200), privacy_level: privacy, disable_comment: false, disable_duet: false, disable_stitch: false }, source_info: { source: "FILE_UPLOAD", video_size: size, chunk_size: chunk, total_chunk_count: count } };
  const { data } = await call(`${TIKTOK_API()}/v2/post/publish/video/init/`, { method: "POST", headers: h, body: JSON.stringify(body) }, "TikTok video");
  if (data.error?.code && data.error.code !== "ok") throw new Error(`TikTok video: ${data.error.message || data.error.code}`);
  const uploadUrl = data.data?.upload_url;
  if (!uploadUrl) throw new Error("TikTok video: TikTok didn't give an upload address. Try again.");
  for (let i = 0; i < count; i++) {
    const first = i * chunk;
    const last = i === count - 1 ? size - 1 : first + chunk - 1;
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": video.type || "video/mp4", "Content-Length": String(last - first + 1), "Content-Range": `bytes ${first}-${last}/${size}` },
      body: bytes.subarray(first, last + 1),
      signal: AbortSignal.timeout(300000),
    });
    if (!res.ok) throw new Error(`TikTok video upload: HTTP ${res.status}`);
  }
  return { externalId: data.data?.publish_id || "", url: "", note: privacy === "SELF_ONLY" ? "Posted as private (TikTok hasn't approved the app for public posts yet)" : "" };
}

async function pinterest(acc, text, video, cover, call) {
  if (!cover) throw new Error("Pinterest video pins need a cover photo: add a photo to the post as well as the video.");
  const auth = { Authorization: `Bearer ${acc.token}` };
  const reg = (await call(`${PIN_API()}/v5/media`, { method: "POST", headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify({ media_type: "video" }) }, "Pinterest video")).data;
  const fd = new FormData();
  for (const [k, v] of Object.entries(reg.upload_parameters || {})) fd.append(k, v);
  fd.append("file", new Blob([fs.readFileSync(video.file)], { type: video.type }), "video.mp4");
  const up = await fetch(reg.upload_url, { method: "POST", body: fd, signal: AbortSignal.timeout(300000) });
  if (!up.ok) throw new Error(`Pinterest video upload: HTTP ${up.status}`);
  await until(async () => {
    const s = (await call(`${PIN_API()}/v5/media/${reg.media_id}`, { headers: auth }, "Pinterest video check")).data.status;
    return s === "succeeded" ? "done" : s === "failed" ? "Pinterest couldn't process the video" : "wait";
  }, "Pinterest");
  const t = title(text, 100);
  const { data } = await call(`${PIN_API()}/v5/pins`, { method: "POST", headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify({ board_id: acc.externalId, title: t, description: text.slice(0, 800), link: SITE(), media_source: { source_type: "video_id", media_id: reg.media_id, cover_image_url: cover.publicUrl } }) }, "Pinterest pin");
  return { externalId: data.id, url: `https://www.pinterest.com/pin/${data.id}/` };
}

async function youtube(acc, text, video, cover, call) {
  const bytes = fs.readFileSync(video.file);
  const meta = {
    snippet: { title: title(text, 100), description: text.slice(0, 4900), categoryId: "26" }, // Howto & Style
    status: { privacyStatus: "public", selfDeclaredMadeForKids: false },
  };
  const start = await fetch(`${YT_UPLOAD()}/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`, {
    method: "POST",
    headers: { Authorization: `Bearer ${acc.token}`, "Content-Type": "application/json; charset=UTF-8", "X-Upload-Content-Type": video.type, "X-Upload-Content-Length": String(bytes.length) },
    body: JSON.stringify(meta),
    signal: AbortSignal.timeout(60000),
  });
  if (!start.ok) throw new Error(`YouTube upload: ${(await start.json().catch(() => ({})))?.error?.message || `HTTP ${start.status}`}`);
  const { data } = await call(start.headers.get("location"), { method: "PUT", headers: { "Content-Type": video.type }, body: bytes }, "YouTube upload");
  return { externalId: data.id, url: `https://www.youtube.com/watch?v=${data.id}`, ...(data.status?.privacyStatus && data.status.privacyStatus !== "public" ? { note: `YouTube set the video to ${data.status.privacyStatus} (unverified apps upload privately until Google reviews them)` } : {}) };
}

const VIDEO = { facebook, instagram, linkedin, x, threads, tiktok, pinterest, youtube };

module.exports = { VIDEO };
