// Image picker for the visual page editor: choose one of the website's images (with a preview),
// or paste a web address.
import { IMAGE_OPTIONS, imageUrl } from "../blocks/blockUtils";

export default function ImageField({ value, onChange, readOnly }) {
  const isUrl = /^https?:\/\//.test(value || "");
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {value && imageUrl(value) && (
        <img src={imageUrl(value)} alt="" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8, border: "1px solid #e2e8f0" }} />
      )}
      <select
        disabled={readOnly}
        value={isUrl ? "__url__" : value || ""}
        onChange={(e) => onChange(e.target.value === "__url__" ? "https://" : e.target.value)}
        style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13 }}
      >
        <option value="">No image</option>
        {IMAGE_OPTIONS.map((o) => (
          <option key={o} value={o}>{o.replace(/^our-work\//, "Our photos: ").replace(/\.(jpe?g|png|webp|avif)$/, "")}</option>
        ))}
        <option value="__url__">Use an image from a web address…</option>
      </select>
      {isUrl && (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13 }}
        />
      )}
    </div>
  );
}
