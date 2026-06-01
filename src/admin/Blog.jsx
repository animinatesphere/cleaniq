import React, { useState, useEffect } from "react";
import {
  Trash2,
  Edit2,
  Plus,
  Eye,
  EyeOff,
  CheckCircle,
  ImageIcon,
  FileText,
  Users,
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

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    if (imagePath.startsWith("data:")) return imagePath;
    // Ensure we get the correct URL by removing /api if it exists in the path
    const cleanPath = imagePath.replace(/^\/api/, "");
    return `${API_URL.replace(/\/api$/, "")}${cleanPath}`;
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/blog/admin/all`);
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
        ? `${API_URL}/blog/${editingId}`
        : `${API_URL}/blog`;

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
      const response = await fetch(`${API_URL}/blog/${id}`, {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {submitting && <LoadingOverlay message="Saving blog post..." />}

      {/* Success Message */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-full font-bold shadow-lg"
        >
          <CheckCircle size={20} />
          {successMessage}
        </motion.div>
      )}

      {/* Page Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl sm:text-5xl font-black text-primary-dark mb-3">
                📰 Blog Management
              </h1>
              <p className="text-slate-600 text-lg font-medium">
                Manage your blog posts and engage with your audience
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setShowForm(!showForm);
                if (!showForm) setEditingId(null);
              }}
              className="btn-primary flex items-center justify-center gap-2 px-6 sm:px-8 py-4 rounded-full text-sm sm:text-base font-black whitespace-nowrap shadow-lg hover:shadow-xl transition-shadow"
            >
              <Plus size={20} />
              New Post
            </motion.button>
          </div>

          {/* Stats Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: "Total Posts",
                value: posts.length,
                icon: FileText,
                color: "primary",
              },
              {
                label: "Published",
                value: publishedCount,
                icon: Eye,
                color: "emerald",
              },
              {
                label: "Drafts",
                value: draftCount,
                icon: EyeOff,
                color: "amber",
              },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100 rounded-2xl p-6 border-2 border-${stat.color}-200`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-bold uppercase tracking-wide mb-1">
                      {stat.label}
                    </p>
                    <p className={`text-3xl font-black text-${stat.color}-600`}>
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`p-3 bg-${stat.color}-200 rounded-full text-${stat.color}-600`}
                  >
                    <stat.icon size={24} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Create/Edit Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mb-12"
          >
            <div className="bg-white rounded-3xl shadow-xl border-2 border-slate-200 overflow-hidden">
              {/* Form Header */}
              <div className="bg-gradient-to-r from-primary to-secondary px-6 sm:px-8 py-6 flex items-center justify-between">
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  {editingId ? "✎ Edit Blog Post" : "✍ Create New Blog Post"}
                </h2>
                <button
                  onClick={handleCancel}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-black text-primary-dark mb-3 uppercase tracking-wider">
                    Post Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter your compelling blog post title..."
                    className="w-full px-5 py-3 rounded-xl border-2 border-slate-300 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium transition-all"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-black text-primary-dark mb-3 uppercase tracking-wider">
                    Description / Preview *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Brief description that appears in the blog listing..."
                      maxLength="150"
                      className="w-full px-5 py-3 rounded-xl border-2 border-slate-300 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium transition-all"
                    />
                    <span className="absolute right-4 top-3 text-xs font-bold text-slate-400">
                      {formData.description.length}/150
                    </span>
                  </div>
                </div>

                {/* Author & Image Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Author */}
                  <div>
                    <label className="block text-sm font-black text-primary-dark mb-3 uppercase tracking-wider">
                      Author Name
                    </label>
                    <div className="flex items-center">
                      <Users
                        size={18}
                        className="absolute ml-4 text-slate-400 pointer-events-none"
                      />
                      <input
                        type="text"
                        name="author"
                        value={formData.author}
                        onChange={handleInputChange}
                        placeholder="Author name"
                        className="w-full pl-12 pr-5 py-3 rounded-xl border-2 border-slate-300 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium transition-all"
                      />
                    </div>
                  </div>

                  {/* Featured Image */}
                  <div>
                    <label className="block text-sm font-black text-primary-dark mb-3 uppercase tracking-wider">
                      Featured Image {!editingId && "*"}
                    </label>
                    <div>
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
                        className="flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 cursor-pointer transition-all"
                      >
                        <ImageIcon size={20} className="text-primary" />
                        <span className="font-bold text-primary">
                          Upload Image
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Image Preview */}
                {imagePreview && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative"
                  >
                    <p className="text-sm font-bold text-slate-600 mb-3">
                      Image Preview:
                    </p>
                    <img
                      src={getImageUrl(imagePreview)}
                      alt="Preview"
                      className="w-full sm:w-64 h-40 rounded-2xl object-cover border-2 border-primary shadow-lg"
                    />
                  </motion.div>
                )}

                {/* Content */}
                <div>
                  <label className="block text-sm font-black text-primary-dark mb-3 uppercase tracking-wider">
                    Full Article Content
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="Write your complete blog post content here..."
                    rows="12"
                    className="w-full px-5 py-3 rounded-xl border-2 border-slate-300 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium resize-none transition-all"
                  />
                  <p className="text-xs text-slate-500 mt-2 font-bold">
                    ⏱️ Estimated read time:{" "}
                    <span className="text-primary font-black">
                      {Math.ceil(
                        (formData.content.split(/\s+/).length || 0) / 200,
                      )}{" "}
                      min
                    </span>
                  </p>
                </div>

                {/* Publish Status */}
                <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-slate-100 to-slate-50 rounded-xl border-2 border-slate-200">
                  <input
                    type="checkbox"
                    name="published"
                    checked={formData.published}
                    onChange={handleInputChange}
                    id="published"
                    className="w-6 h-6 cursor-pointer accent-primary rounded"
                  />
                  <label
                    htmlFor="published"
                    className="font-bold text-primary-dark cursor-pointer flex-1"
                  >
                    {formData.published
                      ? "🟢 Publish immediately"
                      : "🔴 Save as draft"}
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6 border-t-2 border-slate-200">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 sm:px-8 py-3 rounded-full font-bold border-2 border-slate-300 text-slate-600 hover:bg-slate-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary px-6 sm:px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transition-shadow"
                  >
                    {editingId ? "✓ Update Post" : "✓ Create Post"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* Posts List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-3xl font-black text-primary-dark mb-6">
            All Posts ({posts.length})
          </h2>

          {posts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-300 shadow-md">
              <FileText size={64} className="mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 text-lg font-bold mb-2">
                No blog posts yet
              </p>
              <p className="text-slate-400">
                Click "New Post" above to create your first blog post
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {posts.map((post, idx) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-2xl border-2 border-slate-200 hover:border-primary hover:shadow-xl transition-all p-4 sm:p-6"
                >
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    {/* Image */}
                    {post.image && (
                      <div className="relative w-full sm:w-28 h-40 sm:h-28 flex-shrink-0">
                        <img
                          src={getImageUrl(post.image)}
                          alt={post.title}
                          className="w-full h-full rounded-xl object-cover border-2 border-slate-200 shadow-md"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 flex flex-col">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg sm:text-xl font-black text-primary-dark line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-sm text-slate-500 font-bold mt-1">
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
                          <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 rounded-full text-xs font-black whitespace-nowrap">
                            <Eye size={16} />
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 rounded-full text-xs font-black whitespace-nowrap">
                            <EyeOff size={16} />
                            Draft
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-slate-600 mb-4 line-clamp-2 font-medium">
                        {post.description}
                      </p>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-3 border-t-2 border-slate-100">
                        <div className="text-xs text-slate-500 font-bold space-y-1 sm:space-y-0 sm:space-x-4 sm:flex">
                          <span>👤 {post.author}</span>
                          <span>👁️ {post.views || 0} views</span>
                        </div>

                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEdit(post)}
                            className="p-2 sm:p-3 hover:bg-blue-50 rounded-lg transition-all text-blue-600 font-bold border border-blue-200 hover:border-blue-300"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(post._id)}
                            className="p-2 sm:p-3 hover:bg-red-50 rounded-lg transition-all text-red-600 font-bold border border-red-200 hover:border-red-300"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminBlog;
