import { Mail, Phone, MapPin } from 'lucide-react'
import React from 'react'

const TopNav = () => {
  return (
    <div className="bg-black text-white/90 py-2 md:h-[52px] flex items-center border-b border-white/5 fixed top-0 w-full z-60 font-sans">
      <div className="max-w-7xl mx-auto px-4 md:px-8 w-full">
        <div className="flex flex-col md:flex-row justify-between items-center gap-2 md:gap-0">
          {/* Left Side: Contact Info */}
          <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 md:gap-10">
            <a href="mailto:info@cleaniqservices.com" className="flex items-center gap-2 hover:text-secondary transition-colors cursor-pointer group">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-secondary/10 transition-colors">
                <Mail size={12} className="text-secondary group-hover:scale-110 transition-transform md:w-3.5 md:h-3.5" />
              </div>
              <span className="text-[8px] md:text-[10px] font-bold  tracking-[0.15em] md:tracking-[0.25em]">info@cleaniqservices.com</span>
            </a>
            
            <a href="tel:+447752476368" className="flex items-center gap-2 hover:text-secondary transition-colors cursor-pointer group">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-secondary/10 transition-colors">
                <Phone size={12} className="text-secondary group-hover:scale-110 transition-transform md:w-3.5 md:h-3.5" />
              </div>
              <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.15em] md:tracking-[0.25em]">+44 7752 476368</span>
            </a>

            <a href="https://maps.app.goo.gl/UHcabzmFuj11wuLo9" target="_blank" rel="noopener noreferrer" className="hidden sm:flex items-center gap-2 hover:text-secondary transition-colors cursor-pointer group">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-secondary/10 transition-colors">
                <MapPin size={12} className="text-secondary group-hover:scale-110 transition-transform md:w-3.5 md:h-3.5" />
              </div>
              <span className="text-[8px] md:text-[10px] font-bold  tracking-[0.15em] md:tracking-[0.25em]">Manchester</span>
            </a>
          </div>

          {/* Right Side: Social Media */}
          <div className="flex items-center gap-4 md:gap-6">
            <a href="https://www.facebook.com/profile.php?id=61580606194883" target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-all hover:scale-110 opacity-70 hover:opacity-100 p-1.5 md:p-2 rounded-lg hover:bg-white/5">
              <svg width="14" height="14" className="md:w-4 md:h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="https://instagram.com/cleaniqservices" target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-all hover:scale-110 opacity-70 hover:opacity-100 p-1.5 md:p-2 rounded-lg hover:bg-white/5">
              <svg width="14" height="14" className="md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
            <a href="https://www.tiktok.com/@cleaniq_services_uk" target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-all hover:scale-110 opacity-70 hover:opacity-100 p-1.5 md:p-2 rounded-lg hover:bg-white/5">
              <svg width="14" height="14" className="md:w-4 md:h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.9-.32-1.98-.23-2.81.33-.76.51-1.2 1.41-1.1 2.33.05.79.4 1.56 1.02 2.05.73.58 1.69.75 2.6.51.87-.21 1.62-.84 1.96-1.67.14-.34.19-.71.18-1.08.02-3.76 0-7.53.01-11.29z"/></svg>
            </a>
            <a href="https://linkedin.com/in/cleaniq-services-a99157395/" target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-all hover:scale-110 opacity-70 hover:opacity-100 p-1.5 md:p-2 rounded-lg hover:bg-white/5">
              <svg width="14" height="14" className="md:w-4 md:h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.2225 0z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TopNav