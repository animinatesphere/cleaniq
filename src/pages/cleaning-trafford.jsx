import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const Trafford = () => (
  <div className="pt-32 pb-20 min-h-screen bg-white">
    <Helmet>
      <title>Cleaning Services Trafford | Domestic & Office — Cleaniq</title>
      <meta
        name="description"
        content="Trafford cleaning specialists — residential, commercial and end-of-tenancy cleaning. Book online or get a free quote."
      />
      <link
        rel="canonical"
        href="https://www.cleaniqservices.com/pages/cleaning-trafford"
      />
    </Helmet>
    <div className="max-w-4xl mx-auto px-6 text-center">
      <h1 className="text-3xl md:text-5xl font-extrabold text-primary-dark mb-6">
        Cleaning Services in Trafford
      </h1>
      <p className="text-lg text-slate-600 mb-8">
        Local vetted professionals delivering reliable cleaning services across
        Trafford.
      </p>
      <Link to="/booking" className="btn-primary py-4 px-8">
        Get a Free Quote
      </Link>
    </div>
  </div>
);

export default Trafford;
