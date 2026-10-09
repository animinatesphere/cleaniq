// /worker-app — where cleaners download Cleaniq Service Pro (shared in the staff welcome email
// and from admin → Staff). The Android button uses our permanent link, which always points to the
// latest APK (server/utils/appLinks.js).
import { Helmet } from "react-helmet-async";
import { Apple, Smartphone, ShieldCheck, LogIn, Download, Settings2 } from "lucide-react";

const ANDROID = "https://api.cleaniqservices.com/api/app/worker/android";
const IOS = "https://apps.apple.com/gb/app/cleaniq-service-pro/id6784165706";

const Step = ({ n, icon, title, children }) => (
  <li className="flex gap-4">
    <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black">{n}</div>
    <div>
      <p className="font-black text-primary-dark flex items-center gap-2">{icon}{title}</p>
      <p className="text-slate-600 text-sm mt-1 leading-relaxed">{children}</p>
    </div>
  </li>
);

export default function WorkerApp() {
  return (
    <section className="bg-slate-50 py-14 md:py-20 px-4">
      <Helmet>
        <title>Download Cleaniq Service Pro | For Cleaniq Cleaners</title>
        <meta name="description" content="Download the Cleaniq Service Pro app for Cleaniq cleaners on iPhone or Android." />
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="max-w-2xl mx-auto">
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">For Cleaniq cleaners</p>
          <h1 className="mt-3 text-3xl md:text-5xl font-black text-primary-dark tracking-tight">Download Cleaniq Service Pro</h1>
          <p className="mt-4 text-slate-600 md:text-lg">Find, accept and manage your cleaning jobs in one app. Choose your phone below.</p>
        </div>

        <div className="mt-10 grid sm:grid-cols-2 gap-4">
          <a href={IOS} target="_blank" rel="noreferrer"
            className="group rounded-3xl bg-slate-900 text-white p-6 flex items-center gap-4 hover:-translate-y-0.5 transition-transform shadow-lg">
            <Apple size={36} />
            <span>
              <span className="block text-lg font-black">iPhone</span>
              <span className="block text-sm text-slate-300">Download on the App Store</span>
            </span>
          </a>
          <a href={ANDROID}
            className="group rounded-3xl bg-primary text-white p-6 flex items-center gap-4 hover:-translate-y-0.5 transition-transform shadow-lg">
            <Smartphone size={36} />
            <span>
              <span className="block text-lg font-black">Android</span>
              <span className="block text-sm text-emerald-100">Download the app (APK)</span>
            </span>
          </a>
        </div>

        <div className="mt-10 bg-white rounded-3xl border border-slate-200 p-6 md:p-8">
          <h2 className="text-xl font-black text-primary-dark">Installing on Android</h2>
          <ol className="mt-5 space-y-5">
            <Step n="1" icon={<Download size={16} />} title="Tap the Android button">
              Your phone downloads the app file. If it asks, tap <strong>Download</strong> or <strong>Download anyway</strong>.
            </Step>
            <Step n="2" icon={<Settings2 size={16} />} title="Allow the install">
              Open the downloaded file. If your phone says the app is from an unknown source, tap <strong>Settings</strong>, turn on <strong>Allow from this source</strong>, then go back.
            </Step>
            <Step n="3" icon={<ShieldCheck size={16} />} title="Tap Install">
              The app is installed as <strong>Cleaniq Pro</strong>. Updates arrive automatically after this.
            </Step>
            <Step n="4" icon={<LogIn size={16} />} title="Log in">
              Use the email and temporary password from your welcome email, then set your own password.
            </Step>
          </ol>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Need help? Email <a className="font-bold text-primary" href="mailto:info@cleaniqservices.com">info@cleaniqservices.com</a>.
        </p>
      </div>
    </section>
  );
}
