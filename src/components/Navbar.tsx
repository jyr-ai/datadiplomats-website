import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { ArrowRight, Menu, X, Shield, Sparkles, FileSpreadsheet } from 'lucide-react';

interface NavbarProps {
  onOpenConsultation: () => void;
  onExploreArchitecture: () => void;
  onOpenGoogleSheets?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenConsultation,
  onExploreArchitecture,
  onOpenGoogleSheets,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Top Notification Announcement Bar */}
      <div className="bg-[#0A192F] text-white text-xs font-medium py-2 px-4 border-b border-slate-800 tracking-tight">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FF6B35]/20 text-[#FF6B35] font-mono text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-2.5 h-2.5" /> 2026 Initiative
            </span>
            <span className="text-slate-300">
              Data Diplomats expands Subsidized Frontier AI Deployments for 501(c)(3) Charities & NGOs.
            </span>
          </div>
          <a
            href="#architecture"
            onClick={(e) => {
              e.preventDefault();
              onExploreArchitecture();
            }}
            className="hidden md:inline-flex items-center gap-1 text-[#FF6B35] hover:text-white transition-colors text-xs font-semibold"
          >
            Explore AI Blueprints <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Main Sticky Navigation Bar */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-[#FAF9F6]/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs py-3.5'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Brand Logo */}
            <a href="#" className="focus:outline-hidden group">
              <Logo size={42} />
            </a>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-[#0A192F]">
              <a
                href="#our-work"
                className="text-slate-700 hover:text-[#FF6B35] transition-colors py-1 relative group"
              >
                Our Work
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#FF6B35] transition-all duration-200 group-hover:w-full"></span>
              </a>
              <a
                href="#approach"
                className="text-slate-700 hover:text-[#FF6B35] transition-colors py-1 relative group"
              >
                Our Approach
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#FF6B35] transition-all duration-200 group-hover:w-full"></span>
              </a>
              <a
                href="#architecture"
                className="text-slate-700 hover:text-[#FF6B35] transition-colors py-1 relative group inline-flex items-center gap-1.5"
              >
                <span>AI Sandbox</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-orange-100 text-[#FF6B35] font-bold">
                  Interactive
                </span>
              </a>
              <a
                href="#ethics"
                className="text-slate-700 hover:text-[#FF6B35] transition-colors py-1 relative group inline-flex items-center gap-1"
              >
                <Shield className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#FF6B35]" />
                Ethics Charter
              </a>
              <a
                href="#google-sheets"
                onClick={(e) => {
                  if (onOpenGoogleSheets) {
                    e.preventDefault();
                    onOpenGoogleSheets();
                  }
                }}
                className="text-slate-700 hover:text-[#FF6B35] transition-colors py-1 relative group inline-flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Google Sheets</span>
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 font-bold">
                  Sync
                </span>
              </a>
              <a
                href="#leadership"
                className="text-slate-700 hover:text-[#FF6B35] transition-colors py-1 relative group"
              >
                Leadership
              </a>
            </nav>

            {/* Right Action CTA */}
            <div className="hidden sm:flex items-center gap-3">
              <button
                type="button"
                onClick={onOpenConsultation}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#0A192F] text-white text-sm font-semibold hover:bg-[#162B4D] active:scale-98 transition-all shadow-sm group cursor-pointer"
              >
                <span>Accelerate Your AI Roadmap</span>
                <ArrowRight className="w-4 h-4 text-[#FF6B35] transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </div>

            {/* Mobile Hamburger Toggle */}
            <div className="flex items-center lg:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-[#0A192F] hover:bg-slate-200/60 focus:outline-hidden"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Slide-down Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#FAF9F6] border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 shadow-lg">
            <div className="flex flex-col space-y-3 font-semibold text-slate-800">
              <a
                href="#our-work"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-md hover:bg-slate-100"
              >
                Our Work & Case Studies
              </a>
              <a
                href="#approach"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-md hover:bg-slate-100"
              >
                Our Approach
              </a>
              <a
                href="#architecture"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onExploreArchitecture();
                }}
                className="px-3 py-2 rounded-md hover:bg-slate-100 flex items-center justify-between text-[#FF6B35]"
              >
                <span>Interactive AI Sandbox</span>
                <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-orange-100 font-bold">
                  Blueprint
                </span>
              </a>
              <a
                href="#ethics"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-md hover:bg-slate-100"
              >
                Ethics & Beneficiary Privacy
              </a>
              <a
                href="#google-sheets"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenGoogleSheets) onOpenGoogleSheets();
                }}
                className="px-3 py-2 rounded-md hover:bg-slate-100 flex items-center justify-between text-emerald-700"
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Google Sheets Hub</span>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-100 font-bold text-emerald-800">
                  Live
                </span>
              </a>
              <a
                href="#leadership"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-md hover:bg-slate-100"
              >
                Leadership & Fellows
              </a>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenConsultation();
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0A192F] text-white text-sm font-semibold hover:bg-[#162B4D]"
              >
                <span>Accelerate Your AI Roadmap</span>
                <ArrowRight className="w-4 h-4 text-[#FF6B35]" />
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
