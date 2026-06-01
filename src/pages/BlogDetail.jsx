import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Calendar, User, Eye, ArrowLeft } from "lucide-react";
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

  if (loading) {
    return <LoadingOverlay message="Loading post..." />;
  }

  if (!post) {
    return (
      <div className="pt-32 min-h-screen bg-[#F8FAFC] pb-20">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
            <h1 className="text-2xl font-bold text-primary-dark mb-4">
              Blog Post Not Found
            </h1>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 font-bold text-primary hover:text-primary-dark transition-colors"
            >
              <ArrowLeft size={18} />
              Back to Blog
            </Link>
          </div>
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

      <div className="pt-32 min-h-screen bg-[#F8FAFC] pb-20">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          {/* Back Button */}
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 font-bold text-primary hover:text-primary-dark transition-colors mb-8"
          >
            <ArrowLeft size={18} />
            Back to Blog
          </Link>

          {/* Post Content */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm"
          >
            {/* Featured Image */}
            {post.image && (
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-96 object-cover"
              />
            )}

            {/* Content */}
            <div className="p-8 md:p-12">
              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-extrabold text-primary-dark mb-6 tracking-tight">
                {post.title}
              </h1>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-6 text-sm text-slate-500 font-bold mb-8 pb-8 border-b border-slate-200">
                <span className="flex items-center gap-2">
                  <Calendar size={18} />
                  {new Date(post.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-2">
                  <User size={18} />
                  {post.author}
                </span>
                <span className="flex items-center gap-2">
                  <Eye size={18} />
                  {post.views || 0} views
                </span>
              </div>

              {/* Description */}
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                {post.description}
              </p>

              {/* Full Content */}
              {post.content && (
                <div className="prose prose-lg max-w-none mb-12">
                  <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {post.content}
                  </div>
                </div>
              )}

              {/* CTA Button */}
              <div className="mt-12 p-6 bg-primary/10 rounded-2xl border border-primary/20">
                <h3 className="text-lg font-bold text-primary-dark mb-2">
                  Ready for a Professional Clean?
                </h3>
                <p className="text-slate-600 mb-4">
                  Book our cleaning services today and experience the Cleaniq
                  difference.
                </p>
                <Link
                  to="/booking"
                  className="inline-flex items-center gap-2 btn-primary px-6 py-3 rounded-full font-bold text-sm"
                >
                  Book Now
                </Link>
              </div>
            </div>
          </motion.article>

          {/* Related Posts (Optional) */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-primary-dark mb-6">
              Back to All Posts
            </h2>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 font-bold text-primary hover:text-primary-dark transition-colors group"
            >
              View All Blog Posts
              <span className="group-hover:translate-x-1 transition-transform">
                →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogDetail;
