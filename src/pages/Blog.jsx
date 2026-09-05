import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import {
  Calendar,
  Eye,
  Search,
  ArrowRight,
  Clock,
  Zap,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import LoadingOverlay from "../component/LoadingOverlay";
import { generateBlogSlug } from "../utils/slugGenerator";
import { motion } from "framer-motion";

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const postsPerPage = 9;
  const BASE_URL = API_URL.endsWith("/api") ? API_URL.slice(0, -4) : API_URL;

  const getImageUrl = (imagePath) => {
    if (imagePath.startsWith("http")) return imagePath;
    return `${BASE_URL}${imagePath}`;
  };

  useEffect(() => {
    fetchPosts(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const fetchPosts = async (page) => {
    try {
      setLoading(true);
      console.log(
        "Fetching from:",
        `${API_URL}/blog?page=${page}&limit=${postsPerPage}`,
      );
      const response = await fetch(
        `${API_URL}/blog?page=${page}&limit=${postsPerPage}`,
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Fetched data:", data);
      setPosts(data.posts || []);
      setTotalPages(data.pages || 1);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      setPosts([]);
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

      <div
        className="min-h-screen bg-white mt-12"
        style={{ backgroundColor: "#ffffff" }}
      >
        {/* Navigation Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
        </div>

        {/* Hero Section */}
        <div className="relative pt-20 sm:pt-28 md:pt-32 pb-10 md:pb-24 px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              {/* Badge */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-full px-4 py-2 mb-6"
              >
                <BookOpen size={16} className="text-primary" />
                <span className="text-sm font-bold text-black uppercase tracking-widest">
                  Expert Insights
                </span>
              </motion.div>

              {/* Main Title */}
              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-black mb-6 tracking-tight leading-tight">
                Cleaning Tips & <br />
                <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                  Industry Insights
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-3xl mx-auto">
                Discover expert advice, proven strategies, and insider tips from
                Cleaniq professionals to maintain a spotless and healthy home.
              </p>

              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative max-w-2xl mx-auto"
              >
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={22}
                />
                <input
                  type="text"
                  placeholder="Search articles, tips, and insights..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white border-2 border-slate-200 text-black placeholder:text-slate-400 focus:border-primary focus:outline-none font-medium transition-all hover:border-slate-300 shadow-sm"
                />
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Content Section */}
        <div className="relative pb-20 px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Featured Post */}
            {featuredPost && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="mb-20"
              >
                <Link
                  to={`/blog/${generateBlogSlug(featuredPost._id, featuredPost.title)}`}
                  className="group"
                >
                  <div className="overflow-hidden rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 border border-slate-200">
                    {/* Image */}
                    {featuredPost.image && (
                      <div className="relative h-56 sm:h-72 md:h-[500px] overflow-hidden">
                        <img
                          src={getImageUrl(featuredPost.image)}
                          alt={featuredPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        {/* Gradient only on md+ where text overlays image */}
                        <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                        {/* Badge — always shown over image */}
                        <div className="absolute top-4 left-4 md:top-6 md:left-6 bg-gradient-to-r from-primary to-secondary px-4 py-2 md:px-5 md:py-2.5 rounded-full shadow-lg">
                          <span className="text-white font-black text-xs md:text-sm flex items-center gap-2">
                            <Zap size={14} />
                            Featured Post
                          </span>
                        </div>

                        {/* Desktop-only overlay content */}
                        <div className="hidden md:block absolute bottom-0 left-0 right-0 p-12">
                          <div className="flex flex-wrap gap-6 text-white/80 text-sm font-bold mb-6">
                            <span className="flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-1 rounded-full">
                              <Clock size={16} />
                              {estimateReadTime(featuredPost.content)} min read
                            </span>
                            <span className="flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-1 rounded-full">
                              <Calendar size={16} />
                              {new Date(featuredPost.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          </div>
                          <h2 className="text-5xl font-black text-white mb-4 leading-tight group-hover:text-primary transition-colors">
                            {featuredPost.title}
                          </h2>
                          <p className="text-white/90 text-xl mb-6 line-clamp-2">
                            {featuredPost.description}
                          </p>
                          <div className="flex items-center gap-2 text-primary font-black text-lg group-hover:gap-4 transition-all">
                            Read Article <ChevronRight size={24} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Mobile-only content — below image */}
                    <div className="block md:hidden p-5 bg-white">
                      <div className="flex flex-wrap gap-3 text-slate-500 text-xs font-bold mb-3">
                        <span className="flex items-center gap-1.5">
                          <Clock size={13} />
                          {estimateReadTime(featuredPost.content)} min read
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar size={13} />
                          {new Date(featuredPost.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                      <h2 className="text-xl font-black text-black mb-2 leading-snug group-hover:text-primary transition-colors line-clamp-3">
                        {featuredPost.title}
                      </h2>
                      <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                        {featuredPost.description}
                      </p>
                      <div className="flex items-center gap-2 text-primary font-black text-sm">
                        Read Article <ChevronRight size={18} />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}

            {/* Section Title */}
            {remainingPosts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mb-12"
              >
                <h2 className="text-3xl md:text-4xl font-black text-black flex items-center gap-3">
                  <div className="w-1 h-10 bg-gradient-to-b from-primary to-secondary rounded-full" />
                  Latest Articles
                </h2>
              </motion.div>
            )}

            {/* Posts Grid */}
            {remainingPosts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <BookOpen size={64} className="mx-auto mb-4 text-slate-300" />
                <p className="text-slate-600 text-xl font-bold">
                  {searchQuery
                    ? "No articles match your search. Try different keywords."
                    : "No blog posts available yet. Check back soon!"}
                </p>
              </motion.div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
                {remainingPosts.map((post, idx) => (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 + idx * 0.1 }}
                    className="group h-full"
                  >
                    <Link
                      to={`/blog/${generateBlogSlug(post._id, post.title)}`}
                      className="block h-full"
                    >
                      <div className="h-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-primary/50 hover:shadow-xl transition-all duration-300 flex flex-col group-hover:-translate-y-2">
                        {/* Image */}
                        {post.image && (
                          <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
                            <img
                              src={getImageUrl(post.image)}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                          </div>
                        )}

                        {/* Content */}
                        <div className="p-6 flex flex-col flex-1">
                          {/* Category Badge */}
                          <div className="inline-flex items-center gap-2 mb-4 w-fit">
                            <span className="text-xs font-black text-primary bg-primary/20 px-3 py-1.5 rounded-full">
                              Cleaning Tips
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="text-lg md:text-xl font-black text-black mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                            {post.title}
                          </h3>

                          {/* Description */}
                          <p className="text-slate-600 text-sm md:text-base mb-6 flex-1 line-clamp-3">
                            {post.description}
                          </p>

                          {/* Meta */}
                          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                              <Clock size={14} />
                              {estimateReadTime(post.content)} min
                            </div>
                            <div className="flex items-center gap-1 text-xs font-bold text-slate-400">
                              <Eye size={14} />
                              {post.views || 0}
                            </div>
                          </div>

                          {/* Read More */}
                          <div className="mt-4 flex items-center gap-2 text-primary font-bold group-hover:gap-3 transition-all">
                            <span>Read More</span>
                            <ArrowRight
                              size={16}
                              className="group-hover:translate-x-1 transition-transform"
                            />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex justify-center items-center gap-2 md:gap-3 flex-wrap pt-12 border-t border-slate-200"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg font-bold border-2 border-slate-200 text-black disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary hover:bg-primary/10 transition-all"
                >
                  ← Previous
                </motion.button>

                <div className="flex gap-2">
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
                      <motion.button
                        key={page}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-lg font-bold transition-all ${
                          currentPage === page
                            ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30"
                            : "border-2 border-slate-200 text-black hover:border-primary hover:bg-primary/10"
                        }`}
                      >
                        {page}
                      </motion.button>
                    );
                  })}
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg font-bold border-2 border-slate-200 text-black disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary hover:bg-primary/10 transition-all"
                >
                  Next →
                </motion.button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Blog;
