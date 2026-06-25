const { BetaAnalyticsDataClient } = require("@google-analytics/data");

let client = null;

function getClient() {
  if (!client) {
    if (!process.env.GA4_SERVICE_ACCOUNT_JSON) {
      throw new Error("GA4_SERVICE_ACCOUNT_JSON is not configured");
    }
    const credentials = JSON.parse(process.env.GA4_SERVICE_ACCOUNT_JSON);
    client = new BetaAnalyticsDataClient({ credentials });
  }
  return client;
}

const propertyPath = () => `properties/${process.env.GA4_PROPERTY_ID}`;

const rowsToObjects = (response, dimensionNames, metricNames) =>
  (response.rows || []).map((row) => {
    const obj = {};
    (row.dimensionValues || []).forEach((d, i) => {
      obj[dimensionNames[i]] = d.value;
    });
    (row.metricValues || []).forEach((m, i) => {
      obj[metricNames[i]] = Number(m.value);
    });
    return obj;
  });

// Headline totals + daily trend for the selected window.
async function getOverview(days = 28) {
  const analyticsDataClient = getClient();

  const [totalsRes] = await analyticsDataClient.runReport({
    property: propertyPath(),
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    metrics: [
      { name: "activeUsers" },
      { name: "newUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
      { name: "averageSessionDuration" },
      { name: "bounceRate" },
      { name: "engagementRate" },
      { name: "engagedSessions" },
    ],
  });

  const totalsRow = totalsRes.rows?.[0]?.metricValues || [];
  const totals = {
    activeUsers: Number(totalsRow[0]?.value || 0),
    newUsers: Number(totalsRow[1]?.value || 0),
    sessions: Number(totalsRow[2]?.value || 0),
    pageViews: Number(totalsRow[3]?.value || 0),
    avgSessionDurationSec: Number(totalsRow[4]?.value || 0),
    bounceRate: Number(totalsRow[5]?.value || 0),
    engagementRate: Number(totalsRow[6]?.value || 0),
    engagedSessions: Number(totalsRow[7]?.value || 0),
  };

  const [trendRes] = await analyticsDataClient.runReport({
    property: propertyPath(),
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "date" }],
    metrics: [{ name: "activeUsers" }, { name: "sessions" }],
    orderBys: [{ dimension: { dimensionName: "date" } }],
  });
  const trend = rowsToObjects(trendRes, ["date"], ["activeUsers", "sessions"]);

  const [pagesRes] = await analyticsDataClient.runReport({
    property: propertyPath(),
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "pagePath" }],
    metrics: [{ name: "screenPageViews" }],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit: 8,
  });
  const topPages = rowsToObjects(pagesRes, ["path"], ["views"]);

  const [sourcesRes] = await analyticsDataClient.runReport({
    property: propertyPath(),
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "sessionSourceMedium" }],
    metrics: [{ name: "sessions" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: 6,
  });
  const topSources = rowsToObjects(sourcesRes, ["sourceMedium"], ["sessions"]);

  const [devicesRes] = await analyticsDataClient.runReport({
    property: propertyPath(),
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "deviceCategory" }],
    metrics: [{ name: "sessions" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
  });
  const devices = rowsToObjects(devicesRes, ["category"], ["sessions"]);

  const [citiesRes] = await analyticsDataClient.runReport({
    property: propertyPath(),
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "city" }],
    metrics: [{ name: "sessions" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: 6,
  });
  const topCities = rowsToObjects(citiesRes, ["city"], ["sessions"]).filter(
    (c) => c.city && c.city !== "(not set)",
  );

  const [browsersRes] = await analyticsDataClient.runReport({
    property: propertyPath(),
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "browser" }],
    metrics: [{ name: "sessions" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: 5,
  });
  const browsers = rowsToObjects(browsersRes, ["browser"], ["sessions"]);

  const [landingRes] = await analyticsDataClient.runReport({
    property: propertyPath(),
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "landingPagePlusQueryString" }],
    metrics: [{ name: "sessions" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: 6,
  });
  const landingPages = rowsToObjects(landingRes, ["path"], ["sessions"]);

  const [newVsReturningRes] = await analyticsDataClient.runReport({
    property: propertyPath(),
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "newVsReturning" }],
    metrics: [{ name: "sessions" }],
  });
  const newVsReturning = rowsToObjects(
    newVsReturningRes,
    ["type"],
    ["sessions"],
  ).filter((r) => r.type && r.type !== "(not set)");

  return {
    totals,
    trend,
    topPages,
    topSources,
    devices,
    topCities,
    browsers,
    landingPages,
    newVsReturning,
  };
}

// Visitors on the site right now (last 30 minutes), for a "Live" indicator.
async function getRealtime() {
  const analyticsDataClient = getClient();
  const [response] = await analyticsDataClient.runRealtimeReport({
    property: propertyPath(),
    metrics: [{ name: "activeUsers" }],
  });
  return {
    activeUsers: Number(response.rows?.[0]?.metricValues?.[0]?.value || 0),
  };
}

module.exports = { getOverview, getRealtime };
