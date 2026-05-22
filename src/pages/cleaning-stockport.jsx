import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const Stockport = () => (
  <div className="pt-32 pb-20 min-h-screen bg-white">
    <Helmet>
      <title>
        Cleaning Services Stockport | Domestic & Commercial — Cleaniq
      </title>
      <meta
        name="description"
        content="Stockport cleaning services: weekly cleans, deep cleans, Airbnb turnovers and office janitorial services. Book online or request a quote."
      />
      <link
        rel="canonical"
        href="https://www.cleaniqservices.com/pages/cleaning-stockport"
      />
    </Helmet>
    <div className="max-w-4xl mx-auto px-6 text-center">
      <h1 className="text-3xl md:text-5xl font-extrabold text-primary-dark mb-6">
        Cleaning Services in Stockport
      </h1>
      <p className="text-lg text-slate-600 mb-8">
        Trusted local cleaners serving Stockport for homes, short-lets and
        businesses.
      </p>
      <Link to="/booking" className="btn-primary py-4 px-8">
        Get a Free Quote
      </Link>
    </div>
  </div>
);

export default Stockport;
