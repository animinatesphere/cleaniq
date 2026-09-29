export function timeLabel(d) {
  if (!d) return "";
  const date = new Date(d);
  const today = new Date();
  return date.toDateString() === today.toDateString()
    ? date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) +
        " " +
        date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
