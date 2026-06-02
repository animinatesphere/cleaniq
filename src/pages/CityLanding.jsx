import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Star, BookOpen } from "lucide-react";
import { generateBlogSlug } from "../utils/slugGenerator";

const CITIES = {
  london: {
    name: "London",
    region: "Greater London",
    description:
      "Professional cleaning services across London's diverse neighborhoods",
    keywords:
      "London cleaning, domestic cleaning London, professional cleaners London",
    img: "https://images.unsplash.com/photo-1778942673046-f10e20d2872d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8TG9uZG9uJTIwdG93bmhvdXNlJTIwaW50ZXJpb3IlMjBjbGVhbiUyMiUyMG9yJTIwJTIyTG9uZG9uJTIwbW9kZXJuJTIwYXBhcnRtZW50JTIwY2xlYW58ZW58MHx8MHx8fDA%3D",
  },
  bristol: {
    name: "Bristol",
    region: "West of England",
    description: "Trusted cleaning services for Bristol's growing community",
    keywords:
      "Bristol cleaning, home cleaning Bristol, professional cleaners Bristol",
    img: "https://images.unsplash.com/photo-1770631070169-98cade3a5f99?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8TGl2ZXJwb29sJTIwaG9tZSUyMGNsZWFuaW5nJTIwc2VydmljZXxlbnwwfHwwfHx8MA%3D%3D",
  },
  birmingham: {
    name: "Birmingham",
    region: "West Midlands",
    description: "Expert cleaning solutions for Birmingham homes and offices",
    keywords: "Birmingham cleaning, domestic cleaning Birmingham",
    img: "https://images.unsplash.com/photo-1616864192312-9bea98cabef6?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8QmlybWluZ2hhbSUyMHJlc2lkZW50aWFsJTIwaG9tZSUyMGNsZWFufGVufDB8fDB8fHww",
  },
  manchester: {
    name: "Manchester",
    region: "Greater Manchester",
    description: "Premier cleaning services across Manchester and surroundings",
    keywords: "Manchester cleaning, professional cleaners Manchester",
    img: "https://images.unsplash.com/photo-1662660689402-6fbfdf16b257?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8TWFuY2hlc3RlciUyMGFwYXJ0bWVudCUyMHByb2Zlc3Npb25hbCUyMGNsZWFuaW5nfGVufDB8fDB8fHww",
  },
  leeds: {
    name: "Leeds",
    region: "West Yorkshire",
    description: "Professional cleaning services throughout Leeds",
    keywords: "Leeds cleaning, domestic cleaning Leeds",
    img: "https://images.unsplash.com/photo-1679395608154-eb03a384274a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8WW9ya3NoaXJlJTIwbW9kZXJuJTIwaG9tZSUyMGNsZWFufGVufDB8fDB8fHww",
  },
  slough: {
    name: "Slough",
    region: "Berkshire",
    description:
      "Quality cleaning services for Slough residents and businesses",
    keywords: "Slough cleaning, professional cleaners Slough",
    img: "https://images.unsplash.com/photo-1616864192312-9bea98cabef6?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8QmlybWluZ2hhbSUyMHJlc2lkZW50aWFsJTIwaG9tZSUyMGNsZWFufGVufDB8fDB8fHww",
  },
  chelmsford: {
    name: "Chelmsford",
    region: "Essex",
    description: "Reliable cleaning solutions for Chelmsford homes",
    keywords: "Chelmsford cleaning, domestic cleaning Chelmsford",
  },
  luton: {
    name: "Luton",
    region: "Bedfordshire",
    description: "Professional cleaning for Luton and surrounding areas",
    keywords: "Luton cleaning, professional cleaners Luton",
    img: "https://images.unsplash.com/photo-1770631070169-98cade3a5f99?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8TGl2ZXJwb29sJTIwaG9tZSUyMGNsZWFuaW5nJTIwc2VydmljZXxlbnwwfHwwfHx8MA%3D%3D",
  },
  "milton-keynes": {
    name: "Milton Keynes",
    region: "Buckinghamshire",
    description: "Expert cleaning services for Milton Keynes",
    keywords: "Milton Keynes cleaning, domestic cleaning Milton Keynes",
    img: "https://images.unsplash.com/photo-1770631070169-98cade3a5f99?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8TGl2ZXJwb29sJTIwaG9tZSUyMGNsZWFuaW5nJTIwc2VydmljZXxlbnwwfHwwfHx8MA%3D%3D",
  },
  liverpool: {
    name: "Liverpool",
    region: "Merseyside",
    description: "Quality cleaning services across Liverpool",
    keywords: "Liverpool cleaning, professional cleaners Liverpool",
    img: "https://images.unsplash.com/photo-1770631070169-98cade3a5f99?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8TGl2ZXJwb29sJTIwaG9tZSUyMGNsZWFuaW5nJTIwc2VydmljZXxlbnwwfHwwfHx8MA%3D%3D",
  },
  coventry: {
    name: "Coventry",
    region: "West Midlands",
    description: "Trusted cleaning solutions for Coventry homes",
    keywords: "Coventry cleaning, domestic cleaning Coventry",
    img: "https://images.unsplash.com/photo-1770631070169-98cade3a5f99?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8TGl2ZXJwb29sJTIwaG9tZSUyMGNsZWFuaW5nJTIwc2VydmljZXxlbnwwfHwwfHx8MA%3D%3D",
  },
  croydon: {
    name: "Croydon",
    region: "Greater London",
    description: "Professional cleaning services for Croydon area",
    keywords: "Croydon cleaning, professional cleaners Croydon",
    img: "https://images.unsplash.com/photo-1770631070169-98cade3a5f99?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8TGl2ZXJwb29sJTIwaG9tZSUyMGNsZWFuaW5nJTIwc2VydmljZXxlbnwwfHwwfHx8MA%3D%3D",
  },
};

const getImageUrl = (imagePath) => {
  if (!imagePath) return "";
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const baseUrl = apiUrl.replace("/api", "");
  return `${baseUrl}${imagePath.startsWith("/") ? imagePath : "/" + imagePath}`;
};

const calculateReadTime = (content) => {
  if (!content) return 5;
  const wordCount = content.trim().split(/\s+/).length;
  return Math.max(5, Math.ceil(wordCount / 200));
};

const CityLanding = () => {
  const { city } = useParams();
  const cityInfo = CITIES[city];
  const [blogPosts, setBlogPosts] = useState([]);
  const [blogLoading, setBlogLoading] = useState(true);

  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        setBlogLoading(true);
        const apiUrl =
          import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const response = await fetch(`${apiUrl}/blog?limit=6&page=1`);
        const data = await response.json();
        setBlogPosts(data.posts || []);
      } catch (error) {
        console.error("Failed to fetch blog posts:", error);
        setBlogPosts([]);
      } finally {
        setBlogLoading(false);
      }
    };

    fetchBlogPosts();
  }, []);

  if (!cityInfo) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black text-primary-dark mb-4">
            City Not Found
          </h1>
          <p className="text-slate-600 mb-8">
            Sorry, we couldn't find this city.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-bold text-white bg-primary hover:bg-primary-dark px-8 py-4 rounded-full transition-colors"
          >
            Back to Home
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-hidden bg-white">
      <Helmet>
        <title>Cleaning Services in {cityInfo.name} | Cleaniq Services</title>
        <meta
          name="description"
          content={`Professional cleaning services in ${cityInfo.name}. ${cityInfo.description}`}
        />
        <meta name="keywords" content={cityInfo.keywords} />
        <link
          rel="canonical"
          href={`https://www.cleaniqservices.com/locations/${city}`}
        />
        <meta
          property="og:title"
          content={`Cleaning Services in ${cityInfo.name} | Cleaniq Services`}
        />
        <meta
          property="og:description"
          content={`Professional cleaning services in ${cityInfo.name}. ${cityInfo.description}`}
        />
      </Helmet>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 bg-gradient-to-br from-primary/10 via-white to-secondary/5 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            {/* Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-lg border border-primary/10 mb-8">
                <MapPin size={16} className="text-primary" />
                <span className="text-xs font-bold text-primary uppercase tracking-widest">
                  {cityInfo.region}
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-extrabold text-primary-dark mb-6 tracking-tighter">
                Professional Cleaning in{" "}
                <span className="text-primary">{cityInfo.name}</span>
              </h1>

              <p className="text-lg text-slate-600 font-medium mb-10">
                {cityInfo.description}. From residential deep cleans to
                commercial office maintenance, we deliver exceptional results
                with background-checked professionals you can trust.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/booking"
                  className="inline-flex items-center gap-2 font-bold text-white bg-primary hover:bg-primary-dark px-10 py-5 rounded-full transition-colors shadow-lg shadow-primary/30"
                >
                  Book Now
                  <ArrowRight size={20} />
                </Link>
                <Link
                  to="/services"
                  className="inline-flex items-center gap-2 font-bold text-primary bg-white border-2 border-primary hover:bg-primary/5 px-10 py-5 rounded-full transition-colors"
                >
                  View Services
                  <ArrowRight size={20} />
                </Link>
              </div>
            </div>

            {/* Featured Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="rounded-3xl overflow-hidden shadow-2xl   h-96 md:h-full min-h-80">
                <div className="w-full h-full flex items-center justify-center text-center text-slate-400 p-6">
                  <div>
                    <img
                      src={cityInfo.img}
                      alt={`${cityInfo.name} cleaning services`}
                      className=" object-cover"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
      <div className="mt-20 border-t border-slate-100 pt-16">
        <h4 className="text-[10px] font-black text-center text-slate-400 uppercase tracking-[0.3em] mb-8">
          Our Service Areas In Manchester
        </h4>
        <div className="flex flex-wrap justify-center gap-4">
          {[
            {
              name: "Bury",
              // path: "/pages/end-of-tenancy-cleaning-manchester",
            },
            {
              name: " Stockport",
              // path: "/pages/deep-cleaning-manchester",
            },
            {
              name: " Trafford",
              // path: "/pages/airbnb-cleaning-manchester",
            },
            {
              name: "Manchester City Centre",
              // path: "/pages/office-cleaning-manchester",
            },
            {
              name: " Salford",
              // path: "/pages/post-construction-cleaning-manchester",
            },
            {
              name: " Bolton",
              // path: "/pages/post-construction-cleaning-manchester",
            },
          ].map((link, i) => (
            <Link
              key={i}
              // to={link.path}
              className="px-6 py-3.5 bg-slate-50 border border-slate-100 hover:border-primary/20 rounded-2xl text-xs font-black text-primary-dark hover:text-primary transition-all shadow-sm hover:shadow"
            >
              {link.name} &rarr;
            </Link>
          ))}
        </div>
      </div>
      {/* Why Choose Us */}
      <section className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] mb-4">
              Why Choose Cleaniq
            </h2>
            <h3 className="text-2xl md:text-5xl font-extrabold text-primary-dark tracking-tighter mb-6">
              Trusted by {cityInfo.name} residents.
            </h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { number: "500+", label: "Active Professionals" },
              { number: "98%", label: "Satisfaction Rate" },
              { number: "24/7", label: "Customer Support" },
              { number: "100%", label: "Background Checked" },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -10 }}
                className="text-center p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-slate-200"
              >
                <p className="text-4xl font-black text-primary mb-2">
                  {stat.number}
                </p>
                <p className="text-sm font-bold text-slate-600 uppercase tracking-wide">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Available */}
      <section className="py-24 md:py-32 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] mb-4">
              Our Services
            </h2>
            <h3 className="text-2xl md:text-5xl font-extrabold text-primary-dark tracking-tighter mb-6">
              Available in {cityInfo.name}
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              "Residential Cleaning",
              "Deep Cleaning",
              "End of Tenancy Cleaning",
              "Airbnb Turnover Cleaning",
              "Office & Commercial Cleaning",
              "Post-Construction Cleaning",
            ].map((service, idx) => (
              <motion.div
                key={idx}
                whileHover={{ x: 10 }}
                className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg transition-all flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Star size={24} />
                </div>
                <div>
                  <h4 className="font-black text-primary-dark text-lg">
                    {service}
                  </h4>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">
                    Professional service
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/services"
              className="inline-flex items-center gap-2 font-bold text-primary hover:text-primary-dark transition-colors text-lg"
            >
              Explore All Services <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 mb-4">
              <BookOpen size={16} className="text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-widest">
                Cleaning Tips
              </span>
            </div>
            <h2 className="text-2xl md:text-5xl font-extrabold text-primary-dark tracking-tighter mb-6">
              Expert cleaning insights
            </h2>
            <p className="text-lg text-slate-600 font-medium">
              Learn professional cleaning techniques and maintenance tips from
              our experts.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {blogLoading ? (
              <div className="col-span-full text-center py-12">
                <div className="inline-block h-8 w-8 border-4 border-primary border-r-transparent rounded-full animate-spin" />
                <p className="mt-4 text-slate-600 font-medium">
                  Loading articles...
                </p>
              </div>
            ) : blogPosts.length > 0 ? (
              blogPosts.slice(0, 3).map((post) => (
                <motion.div
                  key={post._id}
                  whileHover={{ y: -8 }}
                  className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="h-40 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center overflow-hidden relative">
                    {post.image ? (
                      <img
                        src={getImageUrl(post.image)}
                        alt={post.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          console.error(
                            "Image failed to load:",
                            getImageUrl(post.image),
                          );
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="text-4xl font-black text-primary opacity-20">
                        {post.title.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h4 className="text-lg font-black text-primary-dark mb-2 line-clamp-2">
                      {post.title}
                    </h4>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                      {post.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-bold">
                        {calculateReadTime(post.content)} min read
                      </span>
                      <Link
                        to={`/blog/${generateBlogSlug(post._id, post.title)}`}
                        className="text-xs font-black text-primary hover:text-primary-dark transition-colors"
                      >
                        Read →
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-slate-600 font-medium">
                  No articles available yet.
                </p>
              </div>
            )}
          </div>

          <div className="text-center">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 font-bold text-white bg-primary hover:bg-primary-dark px-10 py-4 rounded-full transition-colors shadow-lg shadow-primary/30"
            >
              View All Articles
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-primary-dark text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 tracking-tighter">
            Ready to book your cleaning?
          </h2>
          <p className="text-xl text-white/80 font-medium mb-10">
            Professional, reliable, and trusted by thousands in {cityInfo.name}.
          </p>
          <Link
            to="/booking"
            className="inline-flex items-center gap-2 font-bold text-primary-dark bg-white hover:bg-slate-100 px-10 py-5 rounded-full transition-colors shadow-lg"
          >
            Book Now in {cityInfo.name}
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default CityLanding;
