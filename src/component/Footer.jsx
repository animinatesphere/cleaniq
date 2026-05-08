import React from "react";
import { Link } from "react-router-dom";
import { 
  Globe, 
  Users, 
  MessageSquare, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck
} from "lucide-react";
import { useRegion } from "../context/RegionContext";
import logo2 from "../assets/lOGO.png"

const Footer = () => {
  const { region } = useRegion();
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
              <img src={logo2} alt="CLEANIQ SERVICES" className="h-8 md:h-10 w-auto" />
            </div>
            <p className="text-slate-400 leading-relaxed font-medium text-sm">
              Providing premium, eco-friendly cleaning solutions for modern homes and professional workspaces. Excellence in every detail.
            </p>
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
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-secondary">Platform</h4>
            <ul className="space-y-4">
              {[
                { label: "Book Service", path: "/booking" },
                { label: "Our Services", path: "/services" },
                { label: "Join Team", path: "/recruitment" },
                { label: "About Us", path: "/" },
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
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-secondary">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-slate-400 group cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-secondary/20 group-hover:text-secondary transition-colors">
                  <Mail size={16} />
                </div>
                <span className="text-sm font-semibold group-hover:text-white transition-colors">{region?.contact?.email}</span>
              </li>
              <li className="flex items-center gap-3 text-slate-400 group cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-secondary/20 group-hover:text-secondary transition-colors">
                  <Phone size={16} />
                </div>
                <span className="text-sm font-semibold group-hover:text-white transition-colors">{region?.contact?.phone}</span>
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
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-secondary">Quality First</h4>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <ShieldCheck size={64} />
              </div>
              <div className="flex items-center gap-2 text-secondary font-black text-[10px] tracking-widest uppercase">
                <ShieldCheck size={16} /> Verified Quality
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                Our cleaners are fully vetted, background-checked, and trained to cleaniq service institutional standards.
              </p>
              <Link to="/booking" className="block text-center bg-white text-primary-dark font-black text-[10px] uppercase tracking-widest py-3 rounded-xl hover:bg-secondary transition-colors">
                Book a Professional Clean
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">
            © 2026 CLEANIQ SERVICES. PROUDLY ECO-CONSCIOUS.
          </p>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Cookies"].map((label) => (
              <a 
                key={label} 
                href="#" 
                className="text-[10px] md:text-xs font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
