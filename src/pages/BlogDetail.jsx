import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Calendar, User, Eye, ArrowLeft, Share2, Clock } from "lucide-react";
import LoadingOverlay from "../component/LoadingOverlay";
import { motion } from "framer-motion";

const BlogDetail = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/blog/${id}`);
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
      <div className="pt-40 min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20">
        <div className="max-w-3xl mx-auto px-4 md:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h1 className="text-4xl font-black text-primary-dark mb-6">
              Blog Post Not Found
            </h1>
            <p className="text-slate-600 mb-8 text-lg">
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

      <div className="min-h-screen bg-white pb-20">
        {/* Featured Image */}
        {post.image && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="relative w-full h-96 md:h-[500px] overflow-hidden"
          >
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-white" />
          </motion.div>
        )}

        {/* Article Content */}
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-12 md:py-16">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 font-bold text-primary hover:text-primary-dark transition-colors group"
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
            <h1 className="text-4xl md:text-5xl font-black text-primary-dark mb-6 leading-tight tracking-tight">
              {post.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 md:gap-8 pb-8 mb-8 border-b border-slate-200">
              {/* Author Info */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <User size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{post.author}</p>
                  <p className="text-xs text-slate-500 font-bold">Author</p>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center gap-2 text-slate-600 font-bold">
                <Calendar size={18} />
                {new Date(post.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>

              {/* Read Time */}
              <div className="flex items-center gap-2 text-slate-600 font-bold">
                <Clock size={18} />
                {estimateReadTime(post.content)} min read
              </div>

              {/* Views */}
              <div className="flex items-center gap-2 text-slate-600 font-bold">
                <Eye size={18} />
                {post.views || 0} views
              </div>

              {/* Share Button */}
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: post.title,
                      text: post.description,
                      url: window.location.href,
                    });
                  }
                }}
                className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
              >
                <Share2 size={16} />
                Share
              </button>
            </div>

            {/* Description */}
            <p className="text-xl text-slate-700 mb-12 leading-relaxed font-semibold">
              {post.description}
            </p>

            {/* Full Content */}
            {post.content && (
              <div className="prose prose-lg max-w-none mb-16">
                <div className="text-slate-700 leading-relaxed text-lg whitespace-pre-wrap space-y-6">
                  {post.content}
                </div>
              </div>
            )}

            {/* Author Bio Card */}
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl border-2 border-primary/20 p-8 mb-12">
              <h3 className="text-lg font-black text-primary-dark mb-4">
                About the Author
              </h3>
              <div className="flex gap-6 items-start">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                  <User size={24} className="text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-primary-dark text-lg mb-2">
                    {post.author}
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Professional cleaning expert at Cleaniq Services with years
                    of experience in providing top-quality cleaning solutions
                    for homes and businesses.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-primary to-secondary rounded-3xl p-8 md:p-12 text-white mb-12 shadow-xl shadow-primary/20">
              <h3 className="text-2xl md:text-3xl font-black mb-3">
                Ready for a Professional Clean?
              </h3>
              <p className="text-white/90 mb-6 text-lg leading-relaxed">
                Apply the tips from this article or let our expert team handle
                the cleaning for you. Book your service today and experience the
                Cleaniq difference.
              </p>
              <Link
                to="/booking"
                className="inline-flex items-center gap-2 bg-white text-primary font-black px-8 py-4 rounded-full hover:bg-slate-100 transition-colors"
              >
                Book Now →
              </Link>
            </div>
          </motion.article>

          {/* Related Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="pt-12 border-t border-slate-200"
          >
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 font-bold text-primary hover:text-primary-dark transition-colors group mb-6"
            >
              <span>← Back to All Articles</span>
            </Link>
            <p className="text-slate-500 font-bold text-sm mt-4">
              Read more insights and tips from the Cleaniq blog.
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default BlogDetail;
