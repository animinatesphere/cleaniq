// Android cloud builds: give Gradle's build process enough memory. Without this the release
// build can fail with "OutOfMemoryError: Metaspace" (GRADLE_OPTS only affects Gradle's launcher,
// not the daemon that does the work — that reads org.gradle.jvmargs).
const { withGradleProperties } = require("expo/config-plugins");

const PROPS = {
  "org.gradle.jvmargs": "-Xmx4096m -XX:MaxMetaspaceSize=1536m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8",
};

module.exports = function withGradleMemory(config) {
  return withGradleProperties(config, (c) => {
    for (const [key, value] of Object.entries(PROPS)) {
      const existing = c.modResults.find((p) => p.type === "property" && p.key === key);
      if (existing) existing.value = value;
      else c.modResults.push({ type: "property", key, value });
    }
    return c;
  });
};
