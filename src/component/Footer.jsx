import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Globe,
  Users,
  MessageSquare,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { useRegion } from "../context/RegionContext";
import logo2 from "../assets/lOGO.png";

const Footer = () => {
  const { region } = useRegion();

  useEffect(() => {
    const mjqScript = document.createElement("script");
    mjqScript.src = "https://www.myjobquote.co.uk/js/widget.js";
    mjqScript.async = true;
    mjqScript.onload = () => {
      try {
        new window.MyJobQuoteWidget().init({
          targetId: "mjq-widget",
          userId: "usr_wzjss6dgfba6cphndxrohgshe33h",
          badgeName: "standard-badge",
        });
      } catch {}
    };
    document.body.appendChild(mjqScript);

    const barkScript = document.createElement("script");
    barkScript.src =
      "https://www.bark.com/assets/js/frontend-v2/widgets-v2.7f94dbb7d9ce0d27fb12f0374e491545.v2.js";
    barkScript.defer = true;
    document.body.appendChild(barkScript);

    return () => {
      if (document.body.contains(mjqScript))
        document.body.removeChild(mjqScript);
      if (document.body.contains(barkScript))
        document.body.removeChild(barkScript);
    };
  }, []);

  return (
    <footer className="bg-primary-dark text-white pt-20 pb-10 px-6 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] -mt-48 -mr-48 opacity-30" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -mb-32 -ml-32 opacity-20" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <img
                src={logo2}
                alt="Cleaniq Services"
                className="h-8 md:h-10 w-auto"
              />
            </div>
            <p className="text-slate-400 leading-relaxed font-medium text-sm">
              Cleaniq Services is a premium cleaning solutions company based in
              Manchester, United Kingdom, offering trusted, eco-friendly, and
              efficient cleaning services.
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                {[Globe, Users, MessageSquare].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-secondary hover:border-secondary hover:bg-secondary/10 transition-all duration-300"
                  >
                    <Icon size={18} />
                  </a>
                ))}
              </div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                Follow us: @cleaniqservices
              </p>

              {/* App Download */}
              <div>
                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-3">
                  Get Our App
                </p>
                <div className="flex flex-col gap-2">
                  <a
                    href="https://apps.apple.com/app/cleaniq-services/id6787302038"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Download on the App Store"
                    className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 hover:bg-white/10 hover:border-white/20 transition-all"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-5 w-5 shrink-0 text-white">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                    <span className="flex flex-col leading-none">
                      <span className="text-[9px] font-medium text-white/50 uppercase tracking-wider">Download on the</span>
                      <span className="text-sm font-semibold text-white">App Store</span>
                    </span>
                  </a>
                  <a
                    href="https://expo.dev/artifacts/eas/yUF7N6zJ9lCSOwooWtkD7nZjaRD5jBnaihsb7UOgF1A.apk"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Download for Android"
                    className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 hover:bg-white/10 hover:border-white/20 transition-all"
                  >
                    <svg viewBox="0 0 512 512" aria-hidden="true" className="h-5 w-5 shrink-0">
                      <path fill="#00A0FF" d="M47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0z" />
                      <path fill="#00E676" d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1z" />
                      <path fill="#FFC900" d="M472.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8z" />
                      <path fill="#FF3A44" d="M104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
                    </svg>
                    <span className="flex flex-col leading-none">
                      <span className="text-[9px] font-medium text-white/50 uppercase tracking-wider">Download for</span>
                      <span className="text-sm font-semibold text-white">Android</span>
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-secondary">
              Platform
            </h4>
            <ul className="space-y-4">
              {[
                { label: "Book Service", path: "/booking" },
                { label: "Our Services", path: "/services" },
                { label: "Blog", path: "/blog" },
                { label: "Join Team", path: "/recruitment" },
                { label: "About Us", path: "/about" },
                { label: "Contact Us", path: "/pages/contact" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className="text-slate-400 hover:text-white hover:translate-x-2 transition-all duration-300 inline-block text-sm font-semibold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-secondary">
              Contact
            </h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-slate-400 group cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-secondary/20 group-hover:text-secondary transition-colors">
                  <Mail size={16} />
                </div>
                <span className="text-sm font-semibold group-hover:text-white transition-colors">
                  {region?.contact?.email}
                </span>
              </li>
              <li className="flex items-center gap-3 text-slate-400 group cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-secondary/20 group-hover:text-secondary transition-colors">
                  <Phone size={16} />
                </div>
                <span className="text-sm font-semibold group-hover:text-white transition-colors">
                  {region?.contact?.phone}
                </span>
              </li>
              <li className="flex items-start gap-3 text-slate-400 group cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-secondary/20 group-hover:text-secondary transition-colors mt-1">
                  <MapPin size={16} />
                </div>
                <span className="text-sm font-semibold group-hover:text-white transition-colors leading-relaxed">
                  {region?.contact?.address}
                </span>
              </li>
            </ul>
          </div>

          {/* Newsletter / Trust */}
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-secondary">
              Quality First
            </h4>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <ShieldCheck size={64} />
              </div>
              <div className="flex items-center gap-2 text-secondary font-black text-[10px] tracking-widest uppercase">
                <ShieldCheck size={16} /> Verified Quality
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                Our cleaners are fully vetted, background-checked, and trained
                to Cleaniq service institutional standards.
              </p>
              <Link
                to="/booking"
                className="block text-center bg-white text-primary-dark font-black text-[10px] uppercase tracking-widest py-3 rounded-xl hover:bg-secondary transition-colors"
              >
                <button>Book a Professional Clean</button>
              </Link>
              <div className="mt-3">
                <a
                  href={
                    import.meta.env.VITE_GMB_REVIEW_URL ||
                    "https://g.page/r/CTGJLR1Z7dySEBM/review"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center bg-transparent text-white border-2 border-white/20 font-black text-[10px] uppercase tracking-widest py-2 rounded-xl hover:bg-white/5 transition-colors"
                  aria-label="Write a review on Google"
                >
                  Write a review
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Badges Strip */}
        <div className="mb-10 py-5 border-t border-b border-white/10">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 mb-3 text-center md:text-left">
            Trusted &amp; Verified On
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {/* MyJobQuote badge */}
            {/* <div
              style={{ transform: "scale(0.52)", transformOrigin: "left center", height: 32, overflow: "hidden" }}
              className="flex-shrink-0"
            >
              <div id="mjq-widget" />
            </div> */}

            {/* Bark verified badge */}
            {/* <div
              style={{ transform: "scale(0.7)", transformOrigin: "left center", height: 32, overflow: "hidden" }}
              className="flex-shrink-0"
            >
              <a
                href="https://www.bark.com/en/gb/company/cleaniq-services/0mRwz4/"
                target="_blank"
                rel="noopener noreferrer"
                className="bark-widget"
                data-type="verified"
                data-id="0mRwz4"
                data-image="medium-navy"
                data-version="3.0"
              >
                Cleaniq Services
              </a>
            </div> */}

            {/* Google Reviews badge */}
            <a
              href={
                import.meta.env.VITE_GMB_REVIEW_URL ||
                "https://g.page/r/CTGJLR1Z7dySEBM/review"
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 hover:bg-white/10 transition-colors flex-shrink-0"
              aria-label="See our Google Reviews"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <div>
                <p className="text-[9px] font-black text-white/50 leading-none">
                  Google
                </p>
                <div className="flex items-center gap-px mt-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg
                      key={s}
                      width="7"
                      height="7"
                      viewBox="0 0 24 24"
                      fill="#FBBC05"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                  <span className="text-[8px] font-bold text-slate-400 ml-0.5">
                    5.0
                  </span>
                </div>
              </div>
            </a>

            {/* Stripe badge */}
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 flex-shrink-0">
              <svg width="28" height="12" viewBox="0 0 60 26" fill="none">
                <path
                  d="M5.452 10.172c0-.613.504-.849 1.34-.849 1.195 0 2.709.362 3.904 1.01V6.67c-1.307-.52-2.6-.724-3.904-.724C3.29 5.946 1 7.447 1 10.316c0 4.46 6.14 3.748 6.14 5.67 0 .724-.63.96-1.508.96-1.307 0-2.976-.543-4.294-1.274v3.704c1.463.63 2.94.897 4.294.897 3.276 0 5.53-1.618 5.53-4.52-.016-4.813-6.71-3.955-6.71-5.581zm14.543-3.85l-2.45.52-.016 12.02h3.386V6.994l-.92-.672zm5.403.672V6.67l-3.386.016v12.687l3.386-.016V10.9c.8-1.046 2.16-.854 2.578-.712V6.91c-.433-.16-2.02-.4-2.578.084zm5.64-1.843l-3.386.724v2.725l3.386-.016V18.7h3.387V6.81l-3.387.341zm4.36 12.352h3.387V6.655h-3.387V18.5zm1.697-13.48c1.083 0 1.955-.872 1.955-1.956C38.05.98 37.178 0 36.095 0c-1.083 0-1.955.98-1.955 2.064 0 1.084.872 1.956 1.955 1.956zm9.048 12.736c-1.084 0-1.83-.48-1.83-1.956V9.896h2.24V6.994h-2.24V3.75l-3.42.718v2.526H38.5v2.903h1.393v6.22c0 2.528 1.272 3.883 3.812 3.883.928 0 1.97-.236 2.67-.63v-2.77c-.522.27-1.24.557-1.78.557z"
                  fill="#635BFF"
                />
              </svg>
              <p className="text-[9px] font-bold text-white/40">Secure Pay</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">
            © 2026 Cleaniq Services. PROUDLY ECO-CONSCIOUS.
          </p>
          <div className="flex gap-6">
            <Link
              to="/privacy"
              className="text-[10px] md:text-xs font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-[10px] md:text-xs font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
            >
              Terms
            </Link>
            <a
              href="#"
              className="text-[10px] md:text-xs font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
            >
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
