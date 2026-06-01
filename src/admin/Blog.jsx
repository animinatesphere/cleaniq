import React, { useState, useEffect } from "react";
import { Trash2, Edit2, Plus, Eye, EyeOff, Loader } from "lucide-react";
import LoadingOverlay from "../../component/LoadingOverlay";

const AdminBlog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    author: "Cleaniq Team",
    published: false,
    image: null,
  });

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Fetch all blog posts
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
      alert("Error loading blog posts");
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

      alert(
        editingId ? "Post updated successfully" : "Post created successfully",
      );
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
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const response = await fetch(`${API_URL}/api/blog/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete post");
      }

      alert("Post deleted successfully");
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

  return (
    <div className="p-6">
      {submitting && <LoadingOverlay message="Saving blog post..." />}

      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary-dark">
          Blog Management
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2 px-6 py-3 rounded-full text-sm"
        >
          <Plus size={18} />
          New Post
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-3xl p-8 mb-8 border border-slate-100 shadow-sm">
          <h2 className="text-2xl font-bold text-primary-dark mb-6">
            {editingId ? "Edit Blog Post" : "Create New Blog Post"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-bold text-primary-dark mb-2">
                Post Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter blog post title"
                className="w-full p-4 rounded-xl border-2 border-transparent bg-slate-50 focus:border-primary outline-none font-medium"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-primary-dark mb-2">
                Description *
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Short description (appears in list view)"
                className="w-full p-4 rounded-xl border-2 border-transparent bg-slate-50 focus:border-primary outline-none font-medium"
              />
              <p className="text-xs text-slate-400 mt-1">
                This will show on the blog listing page
              </p>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-bold text-primary-dark mb-2">
                Full Content
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="Full blog post content (optional)"
                rows="6"
                className="w-full p-4 rounded-xl border-2 border-transparent bg-slate-50 focus:border-primary outline-none font-medium resize-none"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-bold text-primary-dark mb-2">
                Featured Image {!editingId && "*"}
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  name="image"
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                  id="imageInput"
                />
                <label htmlFor="imageInput" className="cursor-pointer">
                  {imagePreview ? (
                    <div className="space-y-3">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-40 mx-auto rounded-lg object-cover"
                      />
                      <p className="text-sm text-slate-500">
                        Click to change image
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-slate-600 font-bold">
                        Click to upload image
                      </p>
                      <p className="text-xs text-slate-400">
                        PNG, JPG, GIF, WEBP up to 5MB
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Author */}
            <div>
              <label className="block text-sm font-bold text-primary-dark mb-2">
                Author Name
              </label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                placeholder="Author name"
                className="w-full p-4 rounded-xl border-2 border-transparent bg-slate-50 focus:border-primary outline-none font-medium"
              />
            </div>

            {/* Published Toggle */}
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <input
                type="checkbox"
                name="published"
                checked={formData.published}
                onChange={handleInputChange}
                id="published"
                className="w-5 h-5 cursor-pointer"
              />
              <label
                htmlFor="published"
                className="font-bold text-primary-dark cursor-pointer"
              >
                Publish immediately
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 rounded-full font-bold border-2 border-slate-200 text-slate-600 hover:border-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary px-8 py-3 rounded-full text-sm font-bold flex items-center gap-2"
              >
                {editingId ? "Update Post" : "Create Post"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-primary-dark mb-4">
          Blog Posts ({posts.length})
        </h2>

        {posts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
            <p className="text-slate-400 font-bold">
              No blog posts yet. Create one to get started!
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post._id}
              className="bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-md transition-shadow"
            >
              <div className="flex gap-6">
                {post.image && (
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                  />
                )}

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-primary-dark">
                        {post.title}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {post.published ? (
                        <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                          <Eye size={14} />
                          Published
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                          <EyeOff size={14} />
                          Draft
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                    {post.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400">
                      By {post.author} • {post.views || 0} views
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(post)}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(post._id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminBlog;
