import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const Salford = () => (
  <div className="pt-32 pb-20 min-h-screen bg-white">
    <Helmet>
      <title>Cleaning Services Salford | Domestic & Office — Cleaniq</title>
      <meta
        name="description"
        content="Professional cleaning services in Salford — deep cleans, end-of-tenancy, and office cleaning. Get a free quote or book online."
      />
      <link
        rel="canonical"
        href="https://www.cleaniqservices.com/pages/cleaning-salford"
      />
    </Helmet>
    <div className="max-w-4xl mx-auto px-6 text-center">
      <h1 className="text-3xl md:text-5xl font-extrabold text-primary-dark mb-6">
        Cleaning Services in Salford
      </h1>
      <p className="text-lg text-slate-600 mb-8">
        Local vetted cleaners in Salford for homes and offices. Eco-friendly
        supplies available.
      </p>
      <Link to="/booking" className="btn-primary py-4 px-8">
        Get a Free Quote
      </Link>
    </div>
  </div>
);

export default Salford;
