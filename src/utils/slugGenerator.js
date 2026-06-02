// Utility function to generate URL-friendly slug from text
export const generateSlug = (text) => {
  if (!text) return "";
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
};

// Generate blog post URL slug (format: id-title-slug)
export const generateBlogSlug = (postId, title) => {
  if (!postId || !title) return postId;
  const titleSlug = generateSlug(title);
  return `${postId}-${titleSlug}`;
};

// Extract blog post ID from slug
export const extractBlogId = (slug) => {
  if (!slug) return null;
  // If slug is just an ID (MongoDB format), use it directly
  if (slug.match(/^[0-9a-f]{24}$/i)) return slug;
  // If slug contains ID at the beginning (id-title-format), extract it
  const parts = slug.split("-");
  if (parts[0] && parts[0].match(/^[0-9a-f]{24}$/i)) {
    return parts[0];
  }
  return slug; // Fallback to slug as-is
};
