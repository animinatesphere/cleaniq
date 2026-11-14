import { ourWorkFor } from "../utils/ourWork";

// "Photos from our recent jobs" gallery for a service page. Renders nothing if the service has none.
export default function OurWork({ slug, title = "Photos from our recent jobs" }) {
  const photos = ourWorkFor(slug);
  if (!photos.length) return null;
  return (
    <section>
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">{title}</h2>
      <p className="text-sm text-slate-500 mb-6">Real photos taken by our cleaners after finishing a job.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {photos.map((p) => (
          <figure key={`${p.set}-${p.n}`} className="rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
            <img src={p.src} alt={`${p.caption} cleaned by Cleaniq Services`} loading="lazy" width="1000" height="750" className="w-full aspect-4/3 object-cover" />
            {p.caption && <figcaption className="px-3 py-2 text-xs font-semibold text-slate-600">{p.caption}</figcaption>}
          </figure>
        ))}
      </div>
    </section>
  );
}
