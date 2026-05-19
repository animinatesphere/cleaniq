import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const Bolton = () => (
  <div className="pt-32 pb-20 min-h-screen bg-white">
    <Helmet>
      <title>Cleaning Services Bolton | Domestic & Commercial — CLEANIQ</title>
      <meta
        name="description"
        content="Local professional cleaning services in Bolton — domestic, office, end-of-tenancy and Airbnb turnovers. Book online or get a free quote."
      />
      <link
        rel="canonical"
        href="https://cleaniqservices.com/cleaning-services-bolton"
      />
    </Helmet>
    <div className="max-w-4xl mx-auto px-6 text-center">
      <h1 className="text-3xl md:text-5xl font-extrabold text-primary-dark mb-6">
        Cleaning Services in Bolton
      </h1>
      <p className="text-lg text-slate-600 mb-8">
        Trusted local cleaners for homes and businesses in Bolton. Background
        checked professionals, eco-friendly products.
      </p>
      <Link to="/booking" className="btn-primary py-4 px-8">
        Get a Free Quote
      </Link>
    </div>
  </div>
);

export default Bolton;
