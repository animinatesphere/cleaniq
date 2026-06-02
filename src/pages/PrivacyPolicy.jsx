/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Lock,
  Shield,
  Eye,
  Users,
  FileText,
  Cookie,
  Mail,
  Phone,
  ChevronDown,
} from "lucide-react";

const LAST_UPDATED = "2 June 2026";

const sections = [
  {
    id: "purpose",
    icon: <FileText size={20} />,
    title: "1. Purpose",
    content: [
      "The purpose of this privacy policy is to inform users of our Site of the following:",
      "1. The personal data we will collect",
      "2. Use of collected data",
      "3. Who has access to the data collected",
      "4. The rights of Site users",
      "5. The Site's cookie policy",
      "This Privacy Policy applies in addition to the terms and conditions of our Site.",
    ],
  },
  {
    id: "consent",
    icon: <Shield size={20} />,
    title: "2. Consent",
    content: [
      "By using our Site, users agree that they consent to:",
      "1. The conditions set out in this Privacy Policy",
      "2. The collection, use, and retention of the data listed in this Privacy Policy",
      "Your continued use of our website and services constitutes your agreement to these terms.",
    ],
  },
  {
    id: "personal-data",
    icon: <Eye size={20} />,
    title: "3. Personal Data We Collect",
    content: [
      "Before or at the time of collecting personal information, we will identify the purposes for which information is being collected.",
      "We only collect data that helps us achieve the purpose set out in this Privacy Policy. We will not collect any additional data beyond the data listed below without notifying you first.",
      "Data Collected in a Non-Automatic Way:",
      "We may also collect the following data when you perform certain functions on our Site:",
      "1. First and last name",
      "2. Email address",
      "3. Phone number",
      "4. Address",
      "5. Payment information",
      "6. Type(s) of service you are looking for",
      "This data may be collected using the following methods:",
      "1. Book Now form on website",
      "2. Contact forms",
      "3. Customer account registration",
    ],
  },
  {
    id: "use-data",
    icon: <Users size={20} />,
    title: "4. How We Use Personal Data",
    content: [
      "Data collected on our Site will only be used for the purposes specified in this Privacy Policy or indicated on the relevant pages of our Site.",
      "We will not use your data beyond what we disclose in this Privacy Policy.",
      "The data we collect when the user performs certain functions may be used for the following purposes:",
      "1. Communication with users and service providers",
      "2. Processing and fulfilling your service bookings",
      "3. Sending service confirmations and updates",
      "4. Providing customer support",
      "5. Improving our services and website",
      "6. Complying with legal and regulatory requirements",
    ],
  },
  {
    id: "sharing",
    icon: <Shield size={20} />,
    title: "5. Who We Share Personal Data With",
    content: [
      "Service Providers:",
      "We may disclose user data to a service provider who reasonably needs access to user data to achieve the purposes set out in this Privacy Policy. Our service providers include payment processors, email service providers, and customer support platforms.",
      "Other Disclosures:",
      "We will not sell or share your data with other third parties, except in the following cases:",
      "1. If the law requires it",
      "2. If it is required for any legal proceeding",
      "3. To prove or protect our legal rights",
      "4. To buyers or potential buyers of this company in the event that we seek to sell the company",
      "If you follow hyperlinks from our Site to another Site, please note that we are not responsible for and have no control over their privacy policies and practices.",
    ],
  },
  {
    id: "storage",
    icon: <Lock size={20} />,
    title: "6. How Long We Store Personal Data",
    content: [
      "User data will be stored until the purpose the data was collected for has been achieved.",
      "You will be notified if your data is kept for longer than this period.",
      "For service booking purposes, we retain your data for at least 7 years to comply with accounting and tax regulations.",
      "You may request deletion of your data at any time, subject to legal retention requirements.",
    ],
  },
  {
    id: "security",
    icon: <Shield size={20} />,
    title: "7. How We Protect Your Personal Data",
    content: [
      "In order to protect your security, we use the strongest available browser encryption and store all of our data on servers in secure facilities.",
      "Your data is only provided to our service providers with your consent. Our service providers are bound by confidentiality agreements, and a breach of this agreement would result in the service provider being removed from this platform.",
      "All payment processing is handled through Stripe with PCI DSS compliance. We do not store your full credit card details on our servers.",
      "While we take all reasonable precautions to ensure that user data is secure and that users are protected, there always remains the risk of harm. The Internet as a whole can be insecure at times, and therefore we are unable to guarantee the security of user data beyond what is reasonably practical.",
    ],
  },
  {
    id: "children",
    icon: <Users size={20} />,
    title: "8. Children",
    content: [
      "We do not knowingly collect or use personal data from children under 13 years of age.",
      "If we learn that we have collected personal data from a child under 13 years of age, the personal data will be deleted as soon as possible.",
      "If a child under 13 years of age has provided us with personal data, their parent or guardian may contact our privacy officer at info@cleaniqservices.com.",
    ],
  },
  {
    id: "access",
    icon: <Eye size={20} />,
    title: "9. How to Access, Modify, Delete, or Challenge the Data Collected",
    content: [
      "If you would like to know if we have collected your personal data, how we have used your personal data, if we have disclosed your personal data and to whom we disclosed your personal data, or if you would like your data to be deleted or modified in any way, please contact our privacy officer by email at info@cleaniqservices.com.",
      "You have the right to request a copy of all personal data we hold about you, and to have inaccuracies corrected.",
      "Requests will be processed within 30 days in accordance with applicable data protection laws.",
    ],
  },
  {
    id: "opt-out",
    icon: <Mail size={20} />,
    title: "10. How to Opt-Out of Data Collection, Use or Disclosure",
    content: [
      "In addition to the methods described in the previous section, we provide the following specific opt-out methods for the forms of collection, use, or disclosure of your personal data:",
      "1. You can opt-out of the use of your personal data for marketing emails. You can opt-out by clicking 'unsubscribe' on the bottom of any marketing email or updating your email preferences under 'Your Account'.",
      "2. You may disable cookies in your browser settings at any time.",
      "3. You can contact us directly to request removal from any mailing lists.",
      "Opting out of certain data collection may limit your ability to use certain features of our Site.",
    ],
  },
  {
    id: "cookies",
    icon: <Cookie size={20} />,
    title: "11. Cookie Policy",
    content: [
      "A cookie is a small file, stored on a user's hard drive by a website. Its purpose is to collect data relating to the user's browsing habits.",
      "You can choose to be notified each time a cookie is transmitted. You can also choose to disable cookies entirely in your Internet browser, but this may decrease the quality of your user experience.",
      "We use the following types of cookies on our Site:",
      "Third Party Cookies:",
      "Third-party cookies are created by a website other than ours. We may use third-party cookies to achieve the following purposes:",
      "1. Monitor user preferences to tailor advertisements around their interests",
      "2. Analyze website traffic and user behavior",
      "3. Provide analytics and performance metrics",
      "Most modern browsers allow you to refuse cookies or alert you when cookies are being sent. Please note that some features of our Site may not function properly without cookies enabled.",
    ],
  },
  {
    id: "modifications",
    icon: <FileText size={20} />,
    title: "12. Modifications",
    content: [
      "This Privacy Policy may be amended from time to time in order to maintain compliance with the law and to reflect any changes to our data collection process.",
      "When we amend this Privacy Policy we will update the 'Effective Date' at the top of this Privacy Policy.",
      "We recommend that our users periodically review our Privacy Policy to ensure that they are notified of any updates.",
      "If necessary, we may notify users by email of changes to this Privacy Policy.",
      "Your continued use of our services following notification of changes constitutes your acceptance of the updated Privacy Policy.",
    ],
  },
  {
    id: "contact",
    icon: <Phone size={20} />,
    title: "13. Contact Us",
    content: [
      "If you have any questions or concerns about this Privacy Policy, or if you wish to exercise your data rights, please contact our privacy officer:",
      "Email: info@cleaniqservices.com",
      "Phone: +44 (0) 7752 476 368",
      "Address: 20 Swan St, Manchester, M4 5JW",
      "We will respond to all inquiries within 30 days of receipt.",
    ],
  },
];

const PrivacyPolicy = () => {
  const [expandedSection, setExpandedSection] = useState(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="overflow-x-hidden bg-white">
      <Helmet>
        <title>Privacy Policy | Cleaniq Services</title>
        <meta
          name="description"
          content="Read our comprehensive privacy policy to understand how Cleaniq Services collects, uses, and protects your personal data."
        />
        <link
          rel="canonical"
          href="https://www.cleaniqservices.com/privacy-policy"
        />
        <meta property="og:title" content="Privacy Policy | Cleaniq Services" />
        <meta
          property="og:description"
          content="Our commitment to your privacy and data protection."
        />
      </Helmet>

      {/* Header Section */}
      <section className="relative pt-40 pb-20 bg-linear-to-br from-primary/5 to-secondary/5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-lg border border-primary/10 mb-8">
              <Lock size={16} className="text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-widest">
                Your Privacy Matters
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-primary-dark mb-6 tracking-tighter">
              Privacy Policy
            </h1>

            <p className="text-lg text-slate-600 font-medium mb-6">
              We are committed to protecting your personal data and respecting
              your privacy. This policy explains what information we collect,
              how we use it, and your rights regarding your data.
            </p>

            <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
              <span className="inline-block px-3 py-1.5 bg-slate-100 rounded-full">
                Last Updated: {LAST_UPDATED}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {sections.map((section, index) => (
              <motion.div key={section.id} variants={itemVariants}>
                <details
                  open={expandedSection === section.id}
                  onClick={(e) => {
                    e.preventDefault();
                    setExpandedSection(
                      expandedSection === section.id ? null : section.id,
                    );
                  }}
                  className="group p-6 md:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <summary className="list-none flex items-start justify-between gap-4 text-lg font-black text-primary-dark hover:text-primary transition-colors">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="text-primary mt-1 shrink-0">
                        {section.icon}
                      </div>
                      <span className="text-left text-base md:text-lg">
                        {section.title}
                      </span>
                    </div>
                    <ChevronDown
                      size={20}
                      className="text-slate-400 group-open:rotate-180 transition-transform shrink-0 mt-1"
                    />
                  </summary>

                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-6 pt-6 border-t border-slate-100"
                  >
                    <div className="space-y-4 text-slate-600 font-medium leading-relaxed">
                      {section.content.map((paragraph, pIndex) => (
                        <p
                          key={pIndex}
                          className={
                            paragraph.startsWith("1.") ||
                            paragraph.startsWith("2.") ||
                            paragraph.startsWith("3.") ||
                            paragraph.startsWith("4.") ||
                            paragraph.startsWith("5.") ||
                            paragraph.startsWith("6.")
                              ? "ml-4 text-sm"
                              : ""
                          }
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </motion.div>
                </details>
              </motion.div>
            ))}
          </motion.div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mt-20 pt-20 border-t border-slate-200"
          >
            <div className="bg-linear-to-br from-primary/5 to-secondary/5 rounded-3xl p-10 md:p-16">
              <h2 className="text-3xl md:text-4xl font-black text-primary-dark mb-6">
                Questions About Your Privacy?
              </h2>
              <p className="text-lg text-slate-600 font-medium mb-8">
                If you have any concerns or questions about how we handle your
                personal data, please don't hesitate to reach out to our privacy
                officer.
              </p>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="flex items-start gap-4">
                  <Mail className="text-primary shrink-0 mt-1" size={24} />
                  <div>
                    <h3 className="font-black text-primary-dark mb-1">Email</h3>
                    <a
                      href="mailto:info@cleaniqservices.com"
                      className="text-primary hover:text-primary-dark transition-colors font-bold"
                    >
                      info@cleaniqservices.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Phone className="text-primary shrink-0 mt-1" size={24} />
                  <div>
                    <h3 className="font-black text-primary-dark mb-1">Phone</h3>
                    <a
                      href="tel:+447752476368"
                      className="text-primary hover:text-primary-dark transition-colors font-bold"
                    >
                      +44 (0) 7752 476 368
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-primary-dark mb-6">
            Ready to experience professional cleaning?
          </h2>
          <p className="text-lg text-slate-600 font-medium mb-10 max-w-2xl mx-auto">
            Your data is safe with us. Start your booking today with confidence.
          </p>
          <Link
            to="/booking"
            className="inline-flex items-center gap-2 font-bold text-white bg-primary hover:bg-primary-dark px-10 py-5 rounded-full transition-colors shadow-lg shadow-primary/30"
          >
            Book Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
