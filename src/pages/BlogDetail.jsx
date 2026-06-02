import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Calendar,
  User,
  Eye,
  ArrowLeft,
  Share2,
  Clock,
  Send,
  MessageCircle,
} from "lucide-react";
import LoadingOverlay from "../component/LoadingOverlay";
import { motion } from "framer-motion";

const BlogDetail = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentForm, setCommentForm] = useState({
    name: "",
    email: "",
    content: "",
  });
  const [successMessage, setSuccessMessage] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const BASE_URL = API_URL.endsWith("/api") ? API_URL.slice(0, -4) : API_URL;

  const getImageUrl = (imagePath) => {
    if (imagePath.startsWith("http")) return imagePath;
    return `${BASE_URL}${imagePath}`;
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/blog/${id}`);
      if (!response.ok) {
        throw new Error("Post not found");
      }
      const data = await response.json();
      setPost(data);
      fetchComments();
    } catch (error) {
      console.error("Error fetching blog post:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const response = await fetch(`${API_URL}/comments/${id}`);
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

  const handleCommentChange = (e) => {
    const { name, value } = e.target;
    setCommentForm({ ...commentForm, [name]: value });
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    if (
      !commentForm.name.trim() ||
      !commentForm.email.trim() ||
      !commentForm.content.trim()
    ) {
      alert("Please fill in all fields");
      return;
    }

    if (commentForm.content.trim().length < 3) {
      alert("Comment must be at least 3 characters");
      return;
    }

    try {
      setSubmittingComment(true);
      const response = await fetch(`${API_URL}/comments/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commentForm),
      });

      if (!response.ok) {
        throw new Error("Failed to submit comment");
      }

      setSuccessMessage(
        "Comment submitted! It will appear after admin approval.",
      );
      setCommentForm({ name: "", email: "", content: "" });
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      console.error("Error submitting comment:", error);
      alert("Error submitting comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const estimateReadTime = (content) => {
    const wordsPerMinute = 200;
    const wordCount = (content || "").split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute) || 5;
  };

  if (loading) {
    return <LoadingOverlay message="Loading post..." />;
  }

  if (!post) {
    return (
      <div className="pt-40 min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-20">
        <div className="max-w-3xl mx-auto px-4 md:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h1 className="text-4xl font-black text-white mb-6">
              Blog Post Not Found
            </h1>
            <p className="text-slate-300 mb-8 text-lg">
              Sorry, we couldn't find the blog post you're looking for.
            </p>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 font-bold text-white bg-primary hover:bg-primary-dark px-6 py-3 rounded-full transition-colors"
            >
              <ArrowLeft size={18} />
              Back to Blog
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{post.title} — Cleaniq Blog</title>
        <meta name="description" content={post.description} />
        <link
          rel="canonical"
          href={`https://www.cleaniqservices.com/blog/${post._id}`}
        />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.description} />
        {post.image && (
          <meta
            property="og:image"
            content={`https://www.cleaniqservices.com${post.image}`}
          />
        )}
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Featured Image Section */}
        {post.image && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="relative w-full h-80 sm:h-96 md:h-[500px] overflow-hidden"
          >
            <img
              src={getImageUrl(post.image)}
              alt={post.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-white" />

            {/* Category Badge */}
            <div className="absolute top-6 left-6 bg-gradient-to-r from-primary to-secondary px-4 py-2 rounded-full shadow-lg">
              <span className="text-white font-black text-xs sm:text-sm">
                Cleaning Tips
              </span>
            </div>
          </motion.div>
        )}

        {/* Article Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-12 md:py-16">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 font-bold text-primary hover:text-primary-dark transition-colors group hover:gap-3"
            >
              <ArrowLeft size={18} />
              <span>Back to Blog</span>
            </Link>
          </motion.div>

          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-primary-dark mb-6 leading-tight tracking-tight">
              {post.title}
            </h1>

            {/* Meta Info Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-8 mb-12 border-b-2 border-slate-200">
              <div className="flex flex-wrap items-center gap-6">
                {/* Author Info */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
                    <User size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{post.author}</p>
                    <p className="text-xs text-slate-500 font-bold">Author</p>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-8 w-px bg-slate-200" />

                {/* Date */}
                <div className="flex items-center gap-2 text-slate-600 font-bold">
                  <Calendar size={16} className="text-primary" />
                  {new Date(post.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>

                {/* Read Time */}
                <div className="flex items-center gap-2 text-slate-600 font-bold">
                  <Clock size={16} className="text-primary" />
                  {estimateReadTime(post.content)} min
                </div>

                {/* Views */}
                <div className="flex items-center gap-2 text-slate-600 font-bold">
                  <Eye size={16} className="text-primary" />
                  {post.views || 0}
                </div>
              </div>

              {/* Share Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: post.title,
                      text: post.description,
                      url: window.location.href,
                    });
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold transition-colors border border-primary/20"
              >
                <Share2 size={16} />
                Share
              </motion.button>
            </div>

            {/* Description */}
            <p className="text-lg md:text-xl text-slate-700 mb-12 leading-relaxed font-semibold italic border-l-4 border-primary pl-6 bg-slate-50 py-6 px-8 rounded-r-lg">
              "{post.description}"
            </p>

            {/* Full Content */}
            {post.content && (
              <div className="prose prose-lg max-w-none mb-16">
                <div className="text-slate-700 leading-relaxed text-lg whitespace-pre-wrap space-y-6 text-base sm:text-lg">
                  {post.content}
                </div>
              </div>
            )}

            {/* Author Bio Card */}
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border-2 border-primary/10 rounded-2xl p-8 md:p-10 mb-16 hover:border-primary/20 transition-all">
              <h3 className="text-xl font-black text-primary-dark mb-6 flex items-center gap-3">
                <div className="w-1 h-8 bg-gradient-to-b from-primary to-secondary rounded-full" />
                About the Author
              </h3>
              <div className="flex gap-6 items-start">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 shadow-md">
                  <User size={28} className="text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-primary-dark text-lg mb-2">
                    {post.author}
                  </h4>
                  <p className="text-slate-700 leading-relaxed">
                    Professional cleaning expert at Cleaniq Services with years
                    of experience in providing top-quality cleaning solutions
                    for homes and businesses. Passionate about sharing insights
                    to help our community maintain spotless spaces.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-primary via-secondary to-primary rounded-2xl p-8 md:p-12 text-white mb-16 shadow-2xl shadow-primary/20"
            >
              <h3 className="text-2xl md:text-3xl font-black mb-4">
                Ready for a Professional Clean?
              </h3>
              <p className="text-white/90 mb-6 text-lg leading-relaxed">
                Apply the tips from this article or let our expert team handle
                the cleaning for you. Book your service today and experience the
                Cleaniq difference.
              </p>
              <motion.div whileHover={{ gap: "12px" }} className="inline-flex">
                <Link
                  to="/booking"
                  className="inline-flex items-center gap-2 bg-white text-primary font-black px-8 py-4 rounded-full hover:bg-slate-100 transition-colors shadow-lg"
                >
                  Book Now
                  <span>→</span>
                </Link>
              </motion.div>
            </motion.div>
          </motion.article>

          {/* Comments Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-16 pt-12 border-t-2 border-slate-200"
          >
            <h3 className="text-3xl font-black text-primary-dark mb-8 flex items-center gap-3">
              <MessageCircle size={32} className="text-primary" />
              Comments
              <span className="text-slate-400 ml-2 text-xl">
                ({comments.length})
              </span>
            </h3>

            {/* Success Message */}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-emerald-50 border-2 border-emerald-200 text-emerald-700 rounded-lg font-bold flex items-center gap-2"
              >
                <span>✓</span>
                {successMessage}
              </motion.div>
            )}

            {/* Comment Form */}
            <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-6 md:p-8 mb-12">
              <h4 className="text-xl font-black text-primary-dark mb-6 flex items-center gap-2">
                <MessageCircle size={24} className="text-primary" />
                Leave a Comment
              </h4>
              <form onSubmit={handleCommentSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="name"
                    placeholder="Your Name *"
                    value={commentForm.name}
                    onChange={handleCommentChange}
                    className="px-4 py-3 rounded-lg bg-white border-2 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none font-medium transition-colors"
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Your Email *"
                    value={commentForm.email}
                    onChange={handleCommentChange}
                    className="px-4 py-3 rounded-lg bg-white border-2 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none font-medium transition-colors"
                  />
                </div>
                <textarea
                  name="content"
                  placeholder="Your comment... *"
                  value={commentForm.content}
                  onChange={handleCommentChange}
                  rows="5"
                  className="w-full px-4 py-3 rounded-lg bg-white border-2 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none font-medium resize-none transition-colors"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submittingComment}
                  className="bg-gradient-to-r from-primary to-secondary px-6 py-3 rounded-lg font-bold text-white flex items-center gap-2 hover:shadow-lg shadow-primary/30 transition-all disabled:opacity-50"
                >
                  <Send size={18} />
                  {submittingComment ? "Submitting..." : "Post Comment"}
                </motion.button>
                <p className="text-xs text-slate-600 font-bold">
                  ℹ️ Comments are moderated and will appear after admin
                  approval.
                </p>
              </form>
            </div>

            {/* Comments List */}
            {loadingComments ? (
              <div className="text-center py-8">
                <p className="text-slate-500 font-bold">Loading comments...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                <MessageCircle
                  size={48}
                  className="mx-auto mb-3 text-slate-300"
                />
                <p className="text-slate-500 font-bold">
                  No comments yet. Be the first to share your thoughts!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment, idx) => (
                  <motion.div
                    key={comment._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white border-2 border-slate-200 rounded-lg p-6 hover:shadow-md hover:border-primary/20 transition-all"
                  >
                    <div className="flex gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 shadow-md">
                        <User size={20} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-black text-primary-dark">
                          {comment.name}
                        </h5>
                        <p className="text-xs text-slate-500 font-bold">
                          {new Date(comment.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </p>
                      </div>
                    </div>
                    <p className="text-slate-700 leading-relaxed">
                      {comment.content}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Related Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="pt-12 border-t-2 border-slate-200 text-center"
          >
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 font-bold text-primary hover:text-primary-dark transition-colors group hover:gap-3 mb-6"
            >
              <span>← Back to All Articles</span>
            </Link>
            <p className="text-slate-600 font-bold text-sm mt-4">
              Explore more insights and tips from the Cleaniq blog.
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default BlogDetail;
