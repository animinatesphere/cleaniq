// { "./services/carpet-cleaning-manchester.json": data } → { "carpet-cleaning-manchester": data }
export const bySlug = (files) =>
  Object.fromEntries(Object.entries(files).map(([path, data]) => [path.split("/").pop().replace(/\.json$/, ""), data]));
