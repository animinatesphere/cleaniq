import { useState, useEffect } from "react";
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
  MessageCircle,
  Check,
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
  const [commentsModal, setCommentsModal] = useState(null);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

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
    const cleanPath = imagePath.replace(/^\/api/, "");
    return `${API_URL.replace(/\/api$/, "")}${cleanPath}`;
  };

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

  useEffect(() => {
    // eslint-disable-next-line
    fetchPosts();
  }, []);

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
      form.append("published", String(formData.published));

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

  const fetchComments = async (postId) => {
    try {
      setLoadingComments(true);
      const response = await fetch(`${API_URL}/comments/admin/${postId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleViewComments = (postId) => {
    setCommentsModal(postId);
    fetchComments(postId);
  };

  const handleApproveComment = async (commentId) => {
    try {
      const response = await fetch(`${API_URL}/comments/approve/${commentId}`, {
        method: "PUT",
      });

      if (response.ok) {
        setSuccessMessage("Comment approved!");
        setTimeout(() => setSuccessMessage(""), 3000);
        fetchComments(commentsModal);
      }
    } catch (error) {
      console.error("Error approving comment:", error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm("Delete this comment?")) return;

    try {
      const response = await fetch(`${API_URL}/comments/${commentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccessMessage("Comment deleted!");
        setTimeout(() => setSuccessMessage(""), 3000);
        fetchComments(commentsModal);
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  if (loading && !showForm) {
    return <LoadingOverlay message="Loading blog posts..." />;
  }

  const publishedCount = posts.filter((p) => p.published).length;
  const draftCount = posts.length - publishedCount;

  return (
    <div className="min-h-screen bg-[#061A13]">
      {submitting && <LoadingOverlay message="Saving blog post..." />}

      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-emerald-500 text-white px-6 py-4 rounded-full font-bold shadow-lg"
        >
          <CheckCircle size={20} />
          {successMessage}
        </motion.div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl sm:text-5xl font-black text-white mb-3">
                📰 Blog Management
              </h1>
              <p className="text-white/70 text-lg font-medium">
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
              className="bg-emerald-500 hover:bg-emerald-400 text-white font-black flex items-center justify-center gap-2 px-6 sm:px-8 py-4 rounded-xl text-sm sm:text-base whitespace-nowrap shadow-lg hover:shadow-xl transition-all"
            >
              <Plus size={20} />
              New Post
            </motion.button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: "Total Posts",
                value: posts.length,
                icon: FileText,
                cardClass: "bg-[#0B2D22] border border-white/7 rounded-2xl p-6",
                valueClass: "text-3xl font-black text-white",
                badgeClass: "p-3 bg-white/5 rounded-full text-white/40",
              },
              {
                label: "Published",
                value: publishedCount,
                icon: Eye,
                cardClass: "bg-[#0B2D22] border border-white/7 rounded-2xl p-6",
                valueClass: "text-3xl font-black text-emerald-400",
                badgeClass: "p-3 bg-emerald-500/15 rounded-full text-emerald-400",
              },
              {
                label: "Drafts",
                value: draftCount,
                icon: EyeOff,
                cardClass: "bg-[#0B2D22] border border-white/7 rounded-2xl p-6",
                valueClass: "text-3xl font-black text-amber-400",
                badgeClass: "p-3 bg-amber-500/15 rounded-full text-amber-400",
              },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={stat.cardClass}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/40 text-sm font-bold uppercase tracking-wide mb-1">
                      {stat.label}
                    </p>
                    <p className={stat.valueClass}>{stat.value}</p>
                  </div>
                  <div className={stat.badgeClass}>
                    <stat.icon size={24} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mb-12"
          >
            <div className="bg-[#0B2D22] border border-white/10 rounded-2xl overflow-hidden">
              <div className="bg-[#071D16] border-b border-white/10 px-6 sm:px-8 py-6 flex items-center justify-between">
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  {editingId ? "✎ Edit Blog Post" : "✍ Create New Blog Post"}
                </h2>
                <button
                  onClick={handleCancel}
                  className="text-white/80 hover:bg-white/10 p-2 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
                <div>
                  <label className="block text-sm font-black text-white/70 mb-3 uppercase tracking-wider">
                    Post Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter your compelling blog post title..."
                    className="w-full px-5 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 font-medium transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-white/70 mb-3 uppercase tracking-wider">
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
                      className="w-full px-5 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 font-medium transition-all"
                    />
                    <span className="absolute right-4 top-3 text-xs font-bold text-white/40">
                      {formData.description.length}/150
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-black text-white/70 mb-3 uppercase tracking-wider">
                      Author Name
                    </label>
                    <div className="flex items-center">
                      <Users
                        size={18}
                        className="absolute ml-4 text-white/40 pointer-events-none"
                      />
                      <input
                        type="text"
                        name="author"
                        value={formData.author}
                        onChange={handleInputChange}
                        placeholder="Author name"
                        className="w-full pl-12 pr-5 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 font-medium transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-black text-white/70 mb-3 uppercase tracking-wider">
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
                        className="flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 cursor-pointer transition-all"
                      >
                        <ImageIcon size={20} className="text-emerald-400" />
                        <span className="font-bold text-emerald-400">
                          Upload Image
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {imagePreview && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative"
                  >
                    <p className="text-sm font-bold text-white/70 mb-3">
                      Image Preview:
                    </p>
                    <img
                      src={getImageUrl(imagePreview)}
                      alt="Preview"
                      className="w-full sm:w-64 h-40 rounded-2xl object-cover border border-white/10 shadow-lg"
                    />
                  </motion.div>
                )}

                <div>
                  <label className="block text-sm font-black text-white/70 mb-3 uppercase tracking-wider">
                    Full Article Content
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="Write your complete blog post content here..."
                    rows="12"
                    className="w-full px-5 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 font-medium resize-none transition-all"
                  />
                  <p className="text-xs text-white/40 mt-2 font-bold">
                    ⏱️ Estimated read time:{" "}
                    <span className="text-emerald-400 font-black">
                      {Math.ceil(
                        (formData.content.split(/\s+/).length || 0) / 200,
                      )}{" "}
                      min
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-4 p-5 bg-[#071D16] rounded-xl border border-white/10">
                  <input
                    type="checkbox"
                    name="published"
                    checked={formData.published}
                    onChange={handleInputChange}
                    id="published"
                    className="w-6 h-6 cursor-pointer accent-emerald-500 rounded"
                  />
                  <label
                    htmlFor="published"
                    className="font-bold text-white cursor-pointer flex-1"
                  >
                    {formData.published
                      ? "🟢 Publish immediately"
                      : "🔴 Save as draft"}
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6 border-t border-white/7">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 sm:px-8 py-3 rounded-xl font-bold bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 sm:px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                  >
                    {editingId ? "✓ Update Post" : "✓ Create Post"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-3xl font-black text-white mb-6">
            All Posts ({posts.length})
          </h2>

          {posts.length === 0 ? (
            <div className="bg-[#0B2D22] rounded-2xl p-12 text-center border border-dashed border-white/10">
              <FileText size={64} className="mx-auto mb-4 text-white/25" />
              <p className="text-white/70 text-lg font-bold mb-2">
                No blog posts yet
              </p>
              <p className="text-white/40">
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
                  className="bg-[#0B2D22] border border-white/7 rounded-2xl hover:border-white/15 transition-all p-4 sm:p-6"
                >
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    {post.image && (
                      <div className="relative w-full sm:w-28 h-40 sm:h-28 shrink-0">
                        <img
                          src={getImageUrl(post.image)}
                          alt={post.title}
                          className="w-full h-full rounded-xl object-cover border border-white/10 shadow-md"
                        />
                      </div>
                    )}

                    <div className="flex-1 flex flex-col">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg sm:text-xl font-black text-white line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-sm text-white/40 font-bold mt-1">
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
                          <span className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 rounded-full text-[10px] font-black whitespace-nowrap">
                            <Eye size={12} />
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-amber-500/15 border border-amber-500/25 text-amber-400 rounded-full text-[10px] font-black whitespace-nowrap">
                            <EyeOff size={12} />
                            Draft
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-white/70 mb-4 line-clamp-2 font-medium">
                        {post.description}
                      </p>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-3 border-t border-white/6">
                        <div className="text-xs text-white/40 font-bold space-y-1 sm:space-y-0 sm:space-x-4 sm:flex">
                          <span>👤 {post.author}</span>
                          <span>👁️ {post.views || 0} views</span>
                        </div>

                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() =>
                              handleViewComments(post._id, post.title)
                            }
                            className="p-2 sm:p-3 hover:bg-white/5 rounded-lg transition-all text-white/60 font-bold border border-white/10 hover:border-white/20"
                            title="Comments"
                          >
                            <MessageCircle size={18} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEdit(post)}
                            className="p-2 sm:p-3 hover:bg-blue-500/10 rounded-lg transition-all text-blue-400 font-bold border border-white/10 hover:border-blue-500/30"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(post._id)}
                            className="p-2 sm:p-3 hover:bg-rose-500/10 rounded-lg transition-all text-rose-400 font-bold border border-white/10 hover:border-rose-500/30"
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

      {commentsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-[#0B2D22] border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="bg-[#071D16] border-b border-white/10 px-6 sm:px-8 py-6 flex items-center justify-between sticky top-0">
              <h3 className="text-2xl font-black text-white flex items-center gap-2">
                <MessageCircle size={28} />
                Comments
              </h3>
              <button
                onClick={() => {
                  setCommentsModal(null);
                  setComments([]);
                }}
                className="text-white/80 hover:bg-white/10 p-2 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              {loadingComments ? (
                <div className="text-center py-12">
                  <p className="text-white/40 font-bold">
                    Loading comments...
                  </p>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-12 bg-[#071D16] rounded-2xl border border-dashed border-white/10">
                  <MessageCircle
                    size={48}
                    className="mx-auto mb-3 text-white/25"
                  />
                  <p className="text-white/40 font-bold">No comments yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment, idx) => (
                    <motion.div
                      key={comment._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`rounded-xl p-4 border ${
                        comment.approved
                          ? "bg-emerald-500/10 border-emerald-500/20"
                          : "bg-amber-500/10 border-amber-500/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h5 className="font-black text-white">
                            {comment.name}
                          </h5>
                          <p className="text-xs text-white/40 font-bold">
                            {comment.email} •{" "}
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-black px-3 py-1 rounded-full whitespace-nowrap ${
                            comment.approved
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                              : "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                          }`}
                        >
                          {comment.approved ? "✓ Approved" : "⏳ Pending"}
                        </span>
                      </div>

                      <p className="text-white/70 mb-4 leading-relaxed">
                        {comment.content}
                      </p>

                      <div className="flex gap-2 justify-end">
                        {!comment.approved && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleApproveComment(comment._id)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold transition-colors"
                          >
                            <Check size={16} />
                            Approve
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDeleteComment(comment._id)}
                          className="flex items-center gap-2 px-4 py-2 bg-rose-500/15 border border-rose-500/25 text-rose-400 rounded-xl font-bold hover:bg-rose-500/25 transition-colors"
                        >
                          <Trash2 size={16} />
                          Delete
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminBlog;
