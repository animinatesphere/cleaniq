import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Calendar,
  User,
  ArrowLeft,
  ArrowRight,
  Clock,
  Send,
  MessageCircle,
} from "lucide-react";
import LoadingOverlay from "../component/LoadingOverlay";
import { motion } from "framer-motion";

const BlogDetail = () => {
  const { slug } = useParams();
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

  // Extract ID from slug (format: id-title-slug)
  const extractIdFromSlug = (slug) => {
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

  const postId = extractIdFromSlug(slug);

  const getImageUrl = (imagePath) => {
    if (imagePath.startsWith("http")) return imagePath;
    return `${BASE_URL}${imagePath}`;
  };

  const fetchPost = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/blog/${postId}`);
      if (!response.ok) {
        throw new Error("Post not found");
      }
      const data = await response.json();
      setPost(data);
    } catch (error) {
      console.error("Error fetching blog post:", error);
    } finally {
      setLoading(false);
    }
  }, [postId, API_URL]);

  const fetchComments = useCallback(async () => {
    try {
      setLoadingComments(true);
      const response = await fetch(`${API_URL}/comments/${postId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoadingComments(false);
    }
  }, [postId, API_URL]);

  useEffect(() => {
    if (postId) {
      // This pattern is acceptable: fetchPost is useCallback-wrapped and memoized
      // eslint-disable-next-line
      fetchPost();
    }
  }, [postId, fetchPost]);

  useEffect(() => {
    if (postId) {
      // This pattern is acceptable: fetchComments is useCallback-wrapped and memoized
      // eslint-disable-next-line
      fetchComments();
    }
  }, [postId, fetchComments]);

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
      const response = await fetch(`${API_URL}/comments/${postId}`, {
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

  if (loading) {
    return <LoadingOverlay message="Loading post..." />;
  }

  if (!post) {
    return (
      <div className="pt-40 min-h-screen bg-gradient-to-br mt-12 from-slate-900 via-slate-800 to-slate-900 pb-20">
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
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "Do you offer end of tenancy cleaning in Manchester City Centre?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes, Cleaniq Services provides professional end of tenancy cleaning across Manchester City Centre from our Swan Street office, helping tenants secure their full deposits.",
                },
              },
              {
                "@type": "Question",
                name: "How do I book a cleaning service with Cleaniq?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "You can book online in 60 seconds at cleaniqservices.com/booking — simply choose your service, pick a date and time, and a vetted professional will be assigned to you.",
                },
              },
              {
                "@type": "Question",
                name: "Are Cleaniq cleaners background checked?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes, every Cleaniq cleaner undergoes a rigorous vetting process including face-to-face interviews, DBS background checks, and practical skills assessments before joining our platform.",
                },
              },
            ],
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-primary/5 mt-12 to-secondary/5 pt-32 pb-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
            {/* Back Button */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="grid md:grid-cols-3 gap-8 items-start"
            >
              {/* Content */}
              <div className="md:col-span-2">
                {/* Category Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 mb-6">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  <span className="text-xs font-black text-primary uppercase tracking-widest">
                    Cleaning Tips
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-4xl sm:text-5xl font-black text-primary-dark mb-6 leading-tight tracking-tight">
                  {post.title}
                </h1>

                {/* Description */}
                <p className="text-lg text-slate-600 font-medium mb-8 leading-relaxed">
                  {post.description}
                </p>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-slate-600">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-primary" />
                    <span>{post.author}</span>
                  </div>
                  <div className="w-px h-4 bg-slate-300"></div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-primary" />
                    <span>
                      {new Date(post.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="w-px h-4 bg-slate-300"></div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-primary" />
                    <span>
                      {Math.ceil(
                        post.content.trim().split(/\s+/).length / 200,
                      ) || 5}{" "}
                      min read
                    </span>
                  </div>
                </div>
              </div>

              {/* Featured Image - Sidebar */}
              {post.image && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="md:col-span-1 relative"
                >
                  <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-slate-100">
                    <div className="aspect-square relative">
                      <img
                        src={getImageUrl(post.image)}
                        alt={post.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error(
                            "Image failed to load:",
                            getImageUrl(post.image),
                          );
                          e.target.src = "";
                          e.target.alt = "Image unavailable - " + post.title;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10"></div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Article Content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-12 md:py-16">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* Full Content */}
            {post.content && (
              <div className="text-slate-700 leading-relaxed text-base sm:text-lg whitespace-pre-wrap space-y-6 mb-16">
                {post.content}
              </div>
            )}

            {/* Author Bio Card */}
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border-2 border-primary/10 rounded-2xl p-8 md:p-10 mb-16 hover:border-primary/20 transition-all">
              <h3 className="text-xl font-black text-primary-dark mb-6 flex items-center gap-3">
                <div className="w-1 h-8 bg-gradient-to-b from-primary to-secondary rounded-full" />
                About the Author
              </h3>
              <div className="flex gap-6 items-start">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0 shadow-md">
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
              <Link
                to="/booking"
                className="inline-flex items-center gap-2 bg-white text-primary font-black px-8 py-4 rounded-full hover:bg-slate-100 transition-colors shadow-lg"
              >
                Book Now
                <ArrowRight size={20} />
              </Link>
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
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0 shadow-md">
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

