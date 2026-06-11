const badges = [
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
    title: "Free cancellation",
    subtitle: "Up to 24 hours before each session",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
        />
      </svg>
    ),
    title: "Cleaning experts",
    subtitle: "Only home cleaning professionals",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
        />
      </svg>
    ),
    title: "4.9/5 · Excellent",
    subtitle: "Average score out of 286,000 cleaning sessions",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
        />
      </svg>
    ),
    title: "Supplies included",
    subtitle: "Cleaners bring all their own professional-grade supplies",
  },
];

export default function TrustBadges() {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8 bg-white rounded-2xl px-6 py-5 shadow-sm border border-gray-100 w-fit">
      {badges.map((badge, i) => (
        <div key={i} className="flex items-start gap-3 group">
          <div className="mt-0.5 text-emerald-600 shrink-0">{badge.icon}</div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-snug">
              {badge.title}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 leading-snug max-w-[160px]">
              {badge.subtitle}
            </p>
          </div>
          {i < badges.length - 1 && (
            <div className="hidden sm:block self-stretch w-px bg-gray-200 ml-4" />
          )}
        </div>
      ))}
    </div>
  );
}
