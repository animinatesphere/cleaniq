import { Star, ArrowRight } from "lucide-react";
import { GOOGLE_RATING, GOOGLE_REVIEW_COUNT, GOOGLE_REVIEWS, GOOGLE_REVIEWS_URL } from "../utils/googleReviews";

// Real Google reviews, word for word, with the rating summary and a link to all reviews.
export default function GoogleReviewsSection({ className = "bg-slate-50/50" }) {
  return (
    <section className={`py-24 md:py-32 ${className}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14 md:mb-16">
          <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">Reviews</h2>
          <h3 className="text-2xl md:text-5xl font-extrabold text-primary-dark tracking-tighter mb-5">
            What our customers say.
          </h3>
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white border border-slate-100 shadow-sm">
            <div className="flex text-secondary">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={16} fill="currentColor" />
              ))}
            </div>
            <p className="text-sm font-bold text-primary-dark">
              {GOOGLE_RATING} on Google · {GOOGLE_REVIEW_COUNT} reviews
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {GOOGLE_REVIEWS.map((review) => (
            <figure key={review.name} className="flex flex-col p-7 rounded-[32px] bg-white border border-slate-100 shadow-sm">
              <div className="flex text-secondary mb-4" aria-label={`${review.rating} out of 5 stars`}>
                {Array.from({ length: review.rating }, (_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>
              <blockquote className="text-slate-600 font-medium leading-relaxed grow">"{review.text}"</blockquote>
              <figcaption className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
                <span className="font-black text-primary-dark">{review.name}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Google review</span>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="text-center mt-12">
          <a
            href={GOOGLE_REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-black text-primary hover:gap-4 transition-all"
          >
            Read all {GOOGLE_REVIEW_COUNT} reviews on Google <ArrowRight size={18} />
          </a>
        </div>
      </div>
    </section>
  );
}
