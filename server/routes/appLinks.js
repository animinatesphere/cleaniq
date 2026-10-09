// Permanent download links for the worker app (see utils/appLinks.js).
const express = require("express");
const links = require("../utils/appLinks");

const router = express.Router();
const noStore = (res) => res.set("Cache-Control", "no-store");

router.get("/worker/android", (req, res) => { noStore(res); res.redirect(302, links.workerAndroidApk()); });
router.get("/worker/ios", (req, res) => { noStore(res); res.redirect(302, links.workerIos()); });
router.get("/worker", (req, res) => res.json({ android: links.workerAndroidLink(), ios: links.workerIos(), page: links.workerDownloadPage() }));

module.exports = router;
