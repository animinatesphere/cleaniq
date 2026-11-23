// Reads and commits the website's content files on GitHub, for /content-admin.
// Settings in the server's .env:
//   GITHUB_TOKEN   fine-grained token with Contents: read & write on this repository only
//   GITHUB_REPO    owner/name, e.g. animinatesphere/cleaniq
//   GITHUB_BRANCH  branch Vercel deploys from (default: main)
const API = "https://api.github.com";

const settings = () => ({
  token: process.env.GITHUB_TOKEN || "",
  repo: process.env.GITHUB_REPO || "",
  branch: process.env.GITHUB_BRANCH || "main",
});

const notConfigured = () =>
  Object.assign(new Error("Publishing to GitHub isn't set up yet: add GITHUB_TOKEN and GITHUB_REPO to the server's .env file."), { status: 503 });

async function gh(path, { method = "GET", body } = {}) {
  const { token, repo } = settings();
  if (!token || !repo) throw notConfigured();
  const res = await fetch(`${API}/repos/${repo}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "cleaniq-content-admin",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `GitHub responded ${res.status}`);
    err.status = res.status === 409 || res.status === 422 ? 409 : res.status === 404 ? 404 : 502;
    throw err;
  }
  return data;
}

/** Names of the JSON files in a folder of the repository, e.g. "src/content/services". */
async function listFiles(dir) {
  const { branch } = settings();
  const items = await gh(`/contents/${dir}?ref=${encodeURIComponent(branch)}`);
  return (Array.isArray(items) ? items : []).filter((i) => i.type === "file" && i.name.endsWith(".json")).map((i) => i.name);
}

/** A JSON file's content and its version id (sha), as it is on the branch now. */
async function readJson(path) {
  const { branch } = settings();
  const f = await gh(`/contents/${path}?ref=${encodeURIComponent(branch)}`);
  const text = Buffer.from(f.content || "", "base64").toString("utf8");
  return { data: JSON.parse(text), sha: f.sha };
}

/** Commit a JSON file. `sha` must be the version it was edited from, so newer changes aren't overwritten. */
async function writeJson(path, data, { sha, message, author }) {
  const { branch } = settings();
  const content = Buffer.from(JSON.stringify(data, null, 2) + "\n", "utf8").toString("base64");
  const r = await gh(`/contents/${path}`, {
    method: "PUT",
    body: { message, content, sha, branch, ...(author?.email ? { author: { name: author.name || author.email, email: author.email } } : {}) },
  });
  return { sha: r.content?.sha, commit: r.commit?.sha, url: r.commit?.html_url };
}

module.exports = { listFiles, readJson, writeJson, settings };
