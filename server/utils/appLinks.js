// Where cleaners download the worker app (Cleaniq Service Pro).
// Android: Expo's APK links change with every build, so emails and the website use our own
// permanent link (/api/app/worker/android), which forwards here. After a new Android build, set
// WORKER_ANDROID_APK_URL in .env to the new APK link and restart — nothing else changes.
const WORKER_ANDROID_APK_URL =
  process.env.WORKER_ANDROID_APK_URL ||
  "https://expo.dev/artifacts/eas/GsVNC1W3CmDg_y4l3Me1GnoLI5qF3IdFkMXhas0Min8.apk"; // build 20483e3a, 10 Oct 2026
const WORKER_IOS_URL = "https://apps.apple.com/gb/app/cleaniq-service-pro/id6784165706";

const API_BASE = (process.env.PUBLIC_API_URL || "https://api.cleaniqservices.com").replace(/\/+$/, "");

module.exports = {
  workerAndroidApk: () => WORKER_ANDROID_APK_URL,
  workerIos: () => WORKER_IOS_URL,
  // The links we hand out (stable).
  workerAndroidLink: () => `${API_BASE}/api/app/worker/android`,
  workerDownloadPage: () => "https://cleaniqservices.com/worker-app",
};
