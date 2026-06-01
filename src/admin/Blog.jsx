import React, { useState, useEffect } from "react";
import {
  Trash2,
  Edit2,
  Plus,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import LoadingOverlay from "../component/LoadingOverlay";
import { motion } from "framer-motion";

const AdminBlog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    author: "Cleaniq Team",
    published: false,
    image: null,
  });

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/blog/admin/all`);
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      alert("Title and description are required");
      return;
    }

    if (!editingId && !formData.image) {
      alert("Image is required for new posts");
      return;
    }

    try {
      setSubmitting(true);
      const form = new FormData();
      form.append("title", formData.title);
      form.append("description", formData.description);
      form.append("content", formData.content);
      form.append("author", formData.author);
      form.append("published", formData.published);

      if (formData.image instanceof File) {
        form.append("image", formData.image);
      }

      const url = editingId
        ? `${API_URL}/api/blog/${editingId}`
        : `${API_URL}/api/blog`;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: form,
      });

      if (!response.ok) {
        throw new Error("Failed to save blog post");
      }

      const message = editingId
        ? "Post updated successfully!"
        : "Post created successfully!";
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(""), 3000);

      setFormData({
        title: "",
        description: "",
        content: "",
        author: "Cleaniq Team",
        published: false,
        image: null,
      });
      setImagePreview(null);
      setEditingId(null);
      setShowForm(false);
      fetchPosts();
    } catch (error) {
      console.error("Error saving post:", error);
      alert("Error saving blog post");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (post) => {
    setFormData({
      title: post.title,
      description: post.description,
      content: post.content,
      author: post.author,
      published: post.published,
      image: null,
    });
    setImagePreview(post.image);
    setEditingId(post._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (
      !confirm(
        "Are you sure you want to delete this post? This action cannot be undone.",
      )
    )
      return;

    try {
      const response = await fetch(`${API_URL}/api/blog/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete post");
      }

      setSuccessMessage("Post deleted successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Error deleting blog post");
    }
  };

  const handleCancel = () => {
    setFormData({
      title: "",
      description: "",
      content: "",
      author: "Cleaniq Team",
      published: false,
      image: null,
    });
    setImagePreview(null);
    setEditingId(null);
    setShowForm(false);
  };

  if (loading && !showForm) {
    return <LoadingOverlay message="Loading blog posts..." />;
  }

  const publishedCount = posts.filter((p) => p.published).length;
  const draftCount = posts.length - publishedCount;

  return (
    <div className="p-6 md:p-8">
      {submitting && <LoadingOverlay message="Saving blog post..." />}

      {/* Success Message */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mb-6 flex items-center gap-3 bg-green-50 border-2 border-green-200 text-green-700 px-6 py-4 rounded-xl font-bold"
        >
          <CheckCircle size={20} />
          {successMessage}
        </motion.div>
      )}

      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-primary-dark mb-2">
            Blog Management
          </h1>
          <div className="flex gap-6 text-sm font-bold">
            <span className="text-slate-600">
              <span className="text-lg text-primary font-black">
                {posts.length}
              </span>{" "}
              Total Posts
            </span>
            <span className="text-slate-600">
              <span className="text-lg text-green-600 font-black">
                {publishedCount}
              </span>{" "}
              Published
            </span>
            <span className="text-slate-600">
              <span className="text-lg text-amber-600 font-black">
                {draftCount}
              </span>{" "}
              Drafts
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (!showForm) setEditingId(null);
          }}
          className="btn-primary flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold whitespace-nowrap"
        >
          <Plus size={18} />
          New Post
        </button>
      </div>

      {/* Form Section */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 mb-12 border-2 border-slate-200 shadow-lg"
        >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-primary-dark">
              {editingId ? "✎ Edit Blog Post" : "✍ Create New Blog Post"}
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-slate-600 text-2xl"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Grid Layout */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-black text-primary-dark mb-2 uppercase tracking-wide">
                  Post Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter compelling blog post title"
                  className="w-full p-4 rounded-xl border-2 border-slate-200 bg-white focus:border-primary focus:outline-none font-medium transition-colors"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-black text-primary-dark mb-2 uppercase tracking-wide">
                  Description / Preview Text *
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description shown in blog listing"
                  maxLength="150"
                  className="w-full p-4 rounded-xl border-2 border-slate-200 bg-white focus:border-primary focus:outline-none font-medium transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1 font-bold">
                  {formData.description.length}/150 characters
                </p>
              </div>

              {/* Author */}
              <div>
                <label className="block text-sm font-black text-primary-dark mb-2 uppercase tracking-wide">
                  Author Name
                </label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  placeholder="Author name"
                  className="w-full p-4 rounded-xl border-2 border-slate-200 bg-white focus:border-primary focus:outline-none font-medium transition-colors"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-black text-primary-dark mb-2 uppercase tracking-wide">
                  Featured Image {!editingId && "*"}
                </label>
                <div className="relative">
                  <input
                    type="file"
                    name="image"
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                    id="imageInput"
                  />
                  <label
                    htmlFor="imageInput"
                    className="block p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-primary bg-slate-50 hover:bg-primary/5 cursor-pointer transition-all text-center font-bold text-slate-600 hover:text-primary"
                  >
                    📸 Click to upload
                  </label>
                </div>
              </div>
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative max-w-xs">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 rounded-xl object-cover border-2 border-primary/30"
                />
                <p className="text-xs text-slate-500 mt-2 font-bold">
                  Image Preview
                </p>
              </div>
            )}

            {/* Content */}
            <div>
              <label className="block text-sm font-black text-primary-dark mb-2 uppercase tracking-wide">
                Full Article Content
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="Write your full blog post content here..."
                rows="10"
                className="w-full p-4 rounded-xl border-2 border-slate-200 bg-white focus:border-primary focus:outline-none font-medium resize-none transition-colors"
              />
              <p className="text-xs text-slate-500 mt-1 font-bold">
                Approximately{" "}
                {Math.ceil((formData.content.split(/\s+/).length || 0) / 200)}{" "}
                min read
              </p>
            </div>

            {/* Publish Toggle */}
            <div className="flex items-center gap-4 p-4 bg-slate-100 rounded-xl border-2 border-slate-200">
              <input
                type="checkbox"
                name="published"
                checked={formData.published}
                onChange={handleInputChange}
                id="published"
                className="w-5 h-5 cursor-pointer accent-primary"
              />
              <label
                htmlFor="published"
                className="font-black text-primary-dark cursor-pointer"
              >
                {formData.published
                  ? "🟢 Publish immediately"
                  : "🔴 Save as draft"}
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-8 py-3 rounded-full font-black border-2 border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary px-8 py-3 rounded-full text-sm font-black"
              >
                {editingId ? "✓ Update Post" : "✓ Create Post"}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Posts List Section */}
      <div>
        <h2 className="text-xl font-black text-primary-dark mb-6">
          📰 Blog Posts ({posts.length})
        </h2>

        {posts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-300"
          >
            <AlertCircle size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 text-lg font-bold">
              No blog posts yet. Click "New Post" above to get started!
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {posts.map((post, idx) => (
              <motion.div
                key={post._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-2xl border-2 border-slate-200 hover:border-primary hover:shadow-lg transition-all p-6"
              >
                <div className="flex gap-6">
                  {/* Image */}
                  {post.image && (
                    <div className="relative w-24 h-24 flex-shrink-0">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full rounded-lg object-cover border-2 border-slate-200"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="text-lg font-black text-primary-dark line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-sm text-slate-500 font-bold">
                          {new Date(post.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </p>
                      </div>
                      {post.published ? (
                        <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-black whitespace-nowrap">
                          <Eye size={14} />
                          Published
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-black whitespace-nowrap">
                          <EyeOff size={14} />
                          Draft
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-slate-600 mb-3 line-clamp-2 font-medium">
                      {post.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-500 font-bold space-y-1">
                        <p>👤 By {post.author}</p>
                        <p>👁️ {post.views || 0} views</p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(post)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600 font-bold"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(post._id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600 font-bold"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBlog;
