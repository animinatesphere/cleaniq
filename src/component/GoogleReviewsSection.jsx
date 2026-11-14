import { Star, ArrowRight } from "lucide-react";
import { useGoogleReviews } from "../utils/googleReviews";

const initials = (name = "") => name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

// Latest Google reviews, word for word, with the live rating, review count and a link to all reviews.
// New reviews on our Google Business Profile appear here within a few hours (utils/googleReviews.js).
export default function GoogleReviewsSection({ className = "bg-slate-50/50" }) {
  const { rating, count, url, reviews } = useGoogleReviews();
  const shown = reviews.slice(0, 6);

  return (
    <section className={`py-24 md:py-32 ${className}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14 md:mb-16">
          <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">Reviews</h2>
          <h3 className="text-2xl md:text-5xl font-extrabold text-primary-dark tracking-tighter mb-5">
            What our customers say.
          </h3>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex text-secondary">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={16} fill="currentColor" />
              ))}
            </div>
            <p className="text-sm font-bold text-primary-dark">
              {rating} stars on Google · {count} reviews
            </p>
          </a>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {shown.map((review, i) => (
            <figure key={`${review.name}-${i}`} className="flex flex-col p-7 rounded-[32px] bg-white border border-slate-100 shadow-sm">
              <div className="flex text-secondary mb-4" aria-label={`${review.rating} out of 5 stars`}>
                {Array.from({ length: review.rating }, (_, j) => (
                  <Star key={j} size={16} fill="currentColor" />
                ))}
              </div>
              <blockquote className="text-slate-600 font-medium leading-relaxed grow line-clamp-[8]">"{review.text}"</blockquote>
              <figcaption className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-3">
                {review.photo ? (
                  <img src={review.photo} alt="" width="36" height="36" loading="lazy" referrerPolicy="no-referrer" className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <span className="w-9 h-9 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0">{initials(review.name)}</span>
                )}
                <span className="min-w-0 grow">
                  <span className="block font-black text-primary-dark truncate">
                    {review.authorUrl ? (
                      <a href={review.authorUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{review.name}</a>
                    ) : (
                      review.name
                    )}
                  </span>
                  {review.when && <span className="block text-xs text-slate-400 font-semibold">{review.when}</span>}
                </span>
                <a
                  href={review.url || url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-primary shrink-0"
                >
                  Google review
                </a>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="text-center mt-12">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-black text-primary hover:gap-4 transition-all"
          >
            Read all {count} reviews on Google <ArrowRight size={18} />
          </a>
        </div>
      </div>
    </section>
  );
}
