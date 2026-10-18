import React, { useState } from 'react';
import { Logo } from './Logo';
import { ArrowRight, Check, ShieldCheck, Mail, Heart, Github } from 'lucide-react';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="bg-[#0A192F] text-white pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-14 border-b border-slate-800">
          
          {/* Col 1: Brand & Mission */}
          <div className="md:col-span-5 space-y-4">
            <Logo size={40} theme="dark" />
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm pt-2">
              The Ode of Nonprofits. Deploying frontier AI systems for charities, NGOs, and mission-driven institutions with absolute data sovereignty and measurable social impact.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
              <span>Headquartered in New York City · Serving Global NGOs</span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="md:col-span-3 space-y-3 text-xs sm:text-sm">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF6B35] mb-2">
              Platform & Work
            </div>
            <ul className="space-y-2.5 font-medium text-slate-300">
              <li>
                <a href="#our-work" className="hover:text-white transition-colors">
                  Production Case Studies
                </a>
              </li>
              <li>
                <a href="#approach" className="hover:text-white transition-colors">
                  12-Week Deployment Framework
                </a>
              </li>
              <li>
                <a href="#architecture" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span>Interactive AI Sandbox</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#FF6B35]/20 text-[#FF6B35]">
                    NEW
                  </span>
                </a>
              </li>
              <li>
                <a href="#ethics" className="hover:text-white transition-colors">
                  Ethical AI & Privacy Charter
                </a>
              </li>
              <li>
                <a href="#leadership" className="hover:text-white transition-colors">
                  Fellows & Leadership
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Newsletter / Briefing */}
          <div className="md:col-span-4 space-y-3">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF6B35]">
              Civic AI Briefing
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Quarterly insights on frontier model benchmarks, prompt engineering for social casework, and privacy architectures for 501(c)(3) leaders.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-2 pt-1">
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="executive@foundation.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-[#FF6B35]"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#FF6B35] text-white text-xs font-bold hover:bg-[#E8551E] transition-colors shrink-0 cursor-pointer flex items-center justify-center"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              {subscribed && (
                <div className="text-xs text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Subscribed to Civic AI Briefing
                </div>
              )}
            </form>
          </div>

        </div>

        {/* Bottom Bar & 501(c)(3) Disclosures */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} Data Diplomats for Nonprofits, Inc. All rights reserved. 501(c)(3) Tax-Exempt Status.
          </div>

          <div className="flex items-center gap-6">
            <a href="/privacy/" className="hover:text-slate-400 transition-colors">
              Privacy Policy
            </a>
            <a href="/ai-policy/" className="hover:text-slate-400 transition-colors">
              AI Policy
            </a>
            <a href="#ethics" className="hover:text-slate-400 transition-colors">
              Zero-Retention Terms
            </a>
            <a href="#contact" className="hover:text-slate-400 transition-colors">
              Security Disclosure
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
