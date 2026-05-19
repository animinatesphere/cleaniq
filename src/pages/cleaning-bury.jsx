import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const Bury = () => (
  <div className="pt-32 pb-20 min-h-screen bg-white">
    <Helmet>
      <title>Cleaning Services Bury | Domestic & Commercial — CLEANIQ</title>
      <meta
        name="description"
        content="Bury cleaning services: end-of-tenancy, deep cleans, regular domestic cleaning and office services. Request a free quote today."
      />
      <link
        rel="canonical"
        href="https://cleaniqservices.com/cleaning-services-bury"
      />
    </Helmet>
    <div className="max-w-4xl mx-auto px-6 text-center">
      <h1 className="text-3xl md:text-5xl font-extrabold text-primary-dark mb-6">
        Cleaning Services in Bury
      </h1>
      <p className="text-lg text-slate-600 mb-8">
        Reliable local cleaners in Bury offering deep cleans, regular
        housekeeping and short-let turnovers.
      </p>
      <Link to="/booking" className="btn-primary py-4 px-8">
        Get a Free Quote
      </Link>
    </div>
  </div>
);

export default Bury;
