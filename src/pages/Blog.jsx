import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Calendar, User, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import LoadingOverlay from "../component/LoadingOverlay";
import { motion } from "framer-motion";

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const postsPerPage = 10;

  useEffect(() => {
    fetchPosts(currentPage);
  }, [currentPage]);

  const fetchPosts = async (page) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/api/blog?page=${page}&limit=${postsPerPage}`,
      );
      const data = await response.json();
      setPosts(data.posts);
      setTotalPages(data.pages);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingOverlay message="Loading blog posts..." />;
  }

  return (
    <>
      <Helmet>
        <title>Blog — Cleaniq Services</title>
        <meta
          name="description"
          content="Read our latest blog posts about cleaning tips, industry insights, and service updates from Cleaniq."
        />
        <link rel="canonical" href="https://www.cleaniqservices.com/blog" />
        <meta property="og:title" content="Blog — Cleaniq Services" />
        <meta
          property="og:description"
          content="Read our latest blog posts about cleaning tips, industry insights, and service updates."
        />
      </Helmet>

      <div className="pt-32 min-h-screen bg-[#F8FAFC] pb-20">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-16 text-center"
          >
            <h1 className="text-4xl md:text-5xl font-extrabold text-primary-dark mb-4 tracking-tight">
              Cleaniq Blog
            </h1>
            <p className="text-slate-500 text-lg font-bold">
              Tips, insights, and updates from the cleaning industry
            </p>
          </motion.div>

          {/* Blog Posts */}
          {posts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
              <p className="text-slate-400 font-bold">
                No blog posts available yet.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {posts.map((post, idx) => (
                <motion.article
                  key={post._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="bg-white rounded-3xl overflow-hidden border border-slate-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="grid md:grid-cols-3 gap-6 p-6 md:p-8">
                    {/* Image */}
                    {post.image && (
                      <Link to={`/blog/${post._id}`} className="md:col-span-1">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-48 md:h-40 object-cover rounded-2xl hover:scale-105 transition-transform duration-300"
                        />
                      </Link>
                    )}

                    {/* Content */}
                    <div
                      className={post.image ? "md:col-span-2" : "md:col-span-3"}
                    >
                      <Link to={`/blog/${post._id}`} className="block group">
                        <h2 className="text-2xl md:text-3xl font-extrabold text-primary-dark mb-3 group-hover:text-primary transition-colors">
                          {post.title}
                        </h2>
                      </Link>

                      {/* Meta Info */}
                      <div className="flex flex-wrap gap-4 text-sm text-slate-500 font-bold mb-4">
                        <span className="flex items-center gap-1">
                          <Calendar size={16} />
                          {new Date(post.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <User size={16} />
                          {post.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye size={16} />
                          {post.views || 0} views
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-slate-600 mb-6 line-clamp-2">
                        {post.description}
                      </p>

                      {/* Read More Button */}
                      <Link
                        to={`/blog/${post._id}`}
                        className="inline-flex items-center gap-2 font-bold text-primary hover:text-primary-dark transition-colors group"
                      >
                        Read Article
                        <span className="group-hover:translate-x-1 transition-transform">
                          →
                        </span>
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-12">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg font-bold border-2 border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-colors"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg font-bold transition-colors ${
                      currentPage === page
                        ? "bg-primary text-white"
                        : "border-2 border-slate-200 hover:border-primary hover:text-primary"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}

              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg font-bold border-2 border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Blog;
