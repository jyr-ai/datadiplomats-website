import React, { useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProblemStatement } from './components/ProblemStatement';
import { CaseStudies } from './components/CaseStudies';
import { Approach } from './components/Approach';
import { ArchitectureExplorer } from './components/ArchitectureExplorer';
import { EthicsCharter } from './components/EthicsCharter';
import { Leadership } from './components/Leadership';
import { SheetsHub } from './components/SheetsHub';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';

export default function App() {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0A192F] flex flex-col font-sans selection:bg-[#FF6B35]/20 selection:text-[#0A192F]">
      {/* Navigation Header */}
      <Navbar
        onOpenConsultation={() => scrollToSection('contact')}
        onExploreArchitecture={() => scrollToSection('architecture')}
        onOpenGoogleSheets={() => scrollToSection('google-sheets')}
      />

      {/* Main Content Area */}
      <main className="grow">
        {/* Hero Section */}
        <Hero
          onOpenConsultation={() => scrollToSection('contact')}
          onExploreWork={() => scrollToSection('our-work')}
          onExploreSandbox={() => scrollToSection('architecture')}
        />

        {/* Problem Statement: The Social Sector AI Gap */}
        <ProblemStatement />

        {/* Case Studies: Our Work in Production */}
        <CaseStudies onOpenConsultation={() => scrollToSection('contact')} />

        {/* Deployment Methodology: The 12-Week Framework */}
        <Approach onOpenConsultation={() => scrollToSection('contact')} />

        {/* Interactive Architecture Sandbox & Blueprint Generator */}
        <ArchitectureExplorer onOpenConsultation={() => scrollToSection('contact')} />

        {/* Ethical AI & Privacy Charter */}
        <EthicsCharter />

        {/* Leadership, Fellows & FAQ */}
        <Leadership />

        {/* Google Sheets Integration: Civic Data & Architecture Ledger */}
        <SheetsHub />

        {/* Contact & Consultation Scheduler */}
        <ContactSection />
      </main>

      {/* Editorial Footer */}
      <Footer />
    </div>
  );
}
