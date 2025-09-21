import React from 'react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="relative">
      <div className="max-w-3xl space-y-6 sm:space-y-7">
        <h1 className="h1-gradient text-3xl sm:text-4xl lg:text-5xl leading-tight">Navigate Your Cosmic & Numerological Insights</h1>
        <p className="text-base sm:text-lg leading-relaxed text-slate-300/90 dark:text-slate-400">
          Explore numerology name numbers, destiny matching and more upcoming astrology features. Use the
          menu above to begin your journey. Your profile keeps track of purchased reports and preferences.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link to="/numerology/name-number" className="btn-primary">Name Number</Link>
          <Link to="/numerology/destiny-match" className="btn-ghost">Destiny Match</Link>
          <Link to="/profile" className="btn-ghost">Profile</Link>
        </div>
      </div>

      <div className="mt-10 sm:mt-12 grid gap-5 sm:gap-6 md:grid-cols-3">
        <FeatureCard title="Fast Insights" desc="Get instant numerology calculations with clear explanations." />
        <FeatureCard title="Secure Profile" desc="Your data stays private and encrypted with modern auth." />
        <FeatureCard title="Extensible" desc="Architecture ready to plug in more astrology modules soon." />
      </div>
    </div>
  );
}

function FeatureCard({ title, desc }) {
  return (
    <div className="glass rounded-xl p-5 hover:shadow-2xl hover:shadow-brand-600/20 transition group">
      <h3 className="font-semibold text-slate-100 mb-2 group-hover:text-brand-300 tracking-wide">{title}</h3>
      <p className="text-sm text-slate-300/90 leading-relaxed">{desc}</p>
    </div>
  );
}
