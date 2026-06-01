import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import {
  Calendar,
  User,
  Eye,
  Search,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import LoadingOverlay from "../component/LoadingOverlay";
import { motion } from "framer-motion";

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const postsPerPage = 9;

  useEffect(() => {
    fetchPosts(currentPage);
  }, [currentPage]);

  const fetchPosts = async (page) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/blog?page=${page}&limit=${postsPerPage}`,
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

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const estimateReadTime = (content) => {
    const wordsPerMinute = 200;
    const wordCount = (content || "").split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute) || 5;
  };

  if (loading) {
    return <LoadingOverlay message="Loading blog posts..." />;
  }

  const featuredPost = posts[0];
  const remainingPosts = filteredPosts.slice(1);

  return (
    <>
      <Helmet>
        <title>
          Blog — Cleaniq Services | Cleaning Tips & Industry Insights
        </title>
        <meta
          name="description"
          content="Read our latest blog posts about cleaning tips, industry insights, and service updates from Cleaniq. Expert advice for a cleaner home."
        />
        <link rel="canonical" href="https://www.cleaniqservices.com/blog" />
        <meta property="og:title" content="Blog — Cleaniq Services" />
        <meta
          property="og:description"
          content="Read our latest blog posts about cleaning tips, industry insights, and service updates."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 pb-20">
        {/* Hero Section */}
        <div className="pt-40 pb-16 md:pb-20 px-4 md:px-8">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center justify-center gap-2 mb-6">
                <TrendingUp size={20} className="text-primary" />
                <span className="text-sm font-bold text-primary uppercase tracking-widest">
                  Insights & Tips
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-primary-dark mb-6 tracking-tight leading-tight">
                Cleaning Insights & Professional Tips
              </h1>
              <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto">
                Discover expert advice, industry trends, and practical tips to
                maintain a spotless home or office space.
              </p>

              {/* Search Bar */}
              <div className="relative max-w-md mx-auto">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 md:py-4 rounded-xl border-2 border-slate-200 bg-white focus:border-primary focus:outline-none font-medium text-slate-700 transition-colors"
                />
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-8">
          {/* Featured Post */}
          {featuredPost && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-16"
            >
              <Link to={`/blog/${featuredPost._id}`} className="group block">
                <div className="relative overflow-hidden rounded-3xl border border-slate-200 shadow-lg hover:shadow-2xl transition-shadow duration-500">
                  {/* Featured Badge */}
                  <div className="absolute top-4 left-4 z-20 bg-gradient-to-r from-primary to-secondary px-4 py-2 rounded-full">
                    <span className="text-white font-bold text-sm">
                      Featured
                    </span>
                  </div>

                  {/* Image */}
                  {featuredPost.image && (
                    <div className="relative h-96 overflow-hidden">
                      <img
                        src={featuredPost.image}
                        alt={featuredPost.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    </div>
                  )}

                  {/* Content Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                    <p className="text-white/80 font-bold text-sm uppercase tracking-widest mb-3">
                      {estimateReadTime(featuredPost.content)} min read
                    </p>
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
                      {featuredPost.title}
                    </h2>
                    <p className="text-white/90 text-lg mb-6 line-clamp-2">
                      {featuredPost.description}
                    </p>
                    <div className="flex items-center gap-6 text-white/70 text-sm font-bold">
                      <span className="flex items-center gap-2">
                        <Calendar size={16} />
                        {new Date(featuredPost.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </span>
                      <span className="flex items-center gap-2">
                        <User size={16} />
                        {featuredPost.author}
                      </span>
                      <span className="flex items-center gap-2">
                        <Eye size={16} />
                        {featuredPost.views || 0} views
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}

          {/* Blog Posts Grid */}
          {remainingPosts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-400 text-lg font-bold">
                {searchQuery
                  ? "No articles match your search."
                  : "No blog posts available yet."}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {remainingPosts.map((post, idx) => (
                <motion.article
                  key={post._id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="group"
                >
                  <Link to={`/blog/${post._id}`} className="block h-full">
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full hover:-translate-y-1">
                      {/* Image Container */}
                      {post.image && (
                        <div className="relative h-48 overflow-hidden bg-slate-100">
                          <img
                            src={post.image}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-6 flex flex-col flex-1">
                        {/* Meta */}
                        <div className="flex items-center gap-3 mb-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-dark bg-primary/10 px-3 py-1 rounded-full">
                            <Clock size={12} />
                            {estimateReadTime(post.content)} min
                          </span>
                          {post.published && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full">
                              <Eye size={12} />
                              Published
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-lg md:text-xl font-black text-primary-dark mb-3 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h3>

                        {/* Description */}
                        <p className="text-slate-600 text-sm md:text-base mb-4 flex-1 line-clamp-3">
                          {post.description}
                        </p>

                        {/* Footer Meta */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs font-bold text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(post.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye size={14} />
                            {post.views || 0}
                          </span>
                        </div>

                        {/* Read More */}
                        <div className="mt-4 inline-flex items-center gap-2 text-primary font-bold group-hover:gap-3 transition-all">
                          Read More
                          <ArrowRight size={16} />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex justify-center items-center gap-2 md:gap-3 flex-wrap mt-16 pt-12 border-t border-slate-200"
            >
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg font-bold border-2 border-slate-300 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
              >
                ← Previous
              </button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg font-bold transition-all ${
                        currentPage === page
                          ? "bg-primary text-white shadow-lg shadow-primary/30"
                          : "border-2 border-slate-300 text-slate-700 hover:border-primary hover:text-primary"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg font-bold border-2 border-slate-300 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
              >
                Next →
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

const Clock = ({ size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export default Blog;
