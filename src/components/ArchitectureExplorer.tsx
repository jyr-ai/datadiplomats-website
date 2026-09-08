import React, { useState } from 'react';
import { SECTOR_BLUEPRINTS } from '../data/blueprints';
import { Sparkles, ArrowRight, ShieldCheck, Check, Layers, Cpu, Clock, HelpCircle, Download, Copy, CheckCheck, FileSpreadsheet, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAccessToken, googleSignIn } from '../lib/googleAuth';
import { listSpreadsheets, createSpreadsheet, appendRow } from '../lib/sheetsService';
import { WorkspaceConfirmModal } from './WorkspaceConfirmModal';

interface ArchitectureExplorerProps {
  onOpenConsultation: () => void;
}

export const ArchitectureExplorer: React.FC<ArchitectureExplorerProps> = ({ onOpenConsultation }) => {
  const [selectedSectorIndex, setSelectedSectorIndex] = useState(0);
  const [selectedPainPointIndex, setSelectedPainPointIndex] = useState(0);
  const [staffSize, setStaffSize] = useState<number>(15);
  const [copied, setCopied] = useState(false);
  
  // Google Sheets Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessUrl, setExportSuccessUrl] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [exportStatusText, setExportStatusText] = useState<string>('');

  const currentSector = SECTOR_BLUEPRINTS[selectedSectorIndex];
  const currentPainPoint = currentSector.painPoints[selectedPainPointIndex] || currentSector.painPoints[0];

  // Calculated dynamic impact based on staff size
  const calculatedHoursSaved = Math.round(staffSize * 3.5 * 4.3); // hours/month
  const calculatedDollarSavings = Math.round(calculatedHoursSaved * 42); // at $42/hr non-profit staff rate

  const handleStartExport = async () => {
    let token = await getAccessToken();
    if (!token) {
      try {
        const res = await googleSignIn();
        if (!res) return;
        token = res.accessToken;
      } catch (err) {
        console.error('Sign-in cancelled or failed:', err);
        return;
      }
    }
    // Open explicit user confirmation dialog required by Google Workspace guidelines
    setShowConfirmModal(true);
  };

  const handleConfirmExport = async () => {
    setIsExporting(true);
    setShowConfirmModal(false);
    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('No active Google authentication token available');
      }

      const files = await listSpreadsheets(token);
      const ledgerTitle = 'Civic AI Architecture & ROI Ledger';
      const existing = files.find(f => f.name.toLowerCase() === ledgerTitle.toLowerCase());

      const rowValues = [
        new Date().toISOString().split('T')[0],
        currentSector.sector,
        `${staffSize} staff`,
        currentPainPoint.title,
        currentPainPoint.suggestedModel,
        currentPainPoint.privacyTier,
        `${calculatedHoursSaved} hrs/mo`,
        `$${calculatedDollarSavings.toLocaleString()}/mo`
      ];

      if (existing) {
        await appendRow(token, existing.id, 'AI Blueprints', rowValues);
        setExportSuccessUrl(existing.webViewLink || '#google-sheets');
        setExportStatusText(`Appended blueprint to "${existing.name}"`);
      } else {
        const created = await createSpreadsheet(
          token,
          ledgerTitle,
          'AI Blueprints',
          ['Date Created', 'Organization Sector', 'Team Size', 'Core Bottleneck', 'Model Tier', 'Privacy Architecture', 'Est. Monthly Hours Saved', 'Annual Philanthropic Value ($)'],
          [rowValues]
        );
        setExportSuccessUrl(created.webViewLink || '#google-sheets');
        setExportStatusText(`Created new spreadsheet "${ledgerTitle}" in Google Drive`);
      }
    } catch (err: any) {
      console.error('Export to Google Sheets failed:', err);
      setExportStatusText(err.message || 'Failed to export to Google Sheets');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyBlueprint = () => {
    const blueprintText = `--- NON-PROFIT AI SYSTEM BLUEPRINT ---
Organization Sector: ${currentSector.sector}
Core Workflow Bottleneck: ${currentPainPoint.title}
Estimated Impact: ${currentPainPoint.impactMetric}
Estimated Hours Saved: ${calculatedHoursSaved} hours / month (for ${staffSize} team members)
Value Unlocked: $${calculatedDollarSavings.toLocaleString()} / month

Recommended Architecture:
${currentPainPoint.architectureType}
Model Tier: ${currentPainPoint.suggestedModel}
Privacy Standard: ${currentPainPoint.privacyTier}

Subsystems & Connectors:
${currentPainPoint.components.map((c) => `- ${c}`).join('\n')}

Generated via Data Diplomats for Nonprofits (The Ode of Nonprofits)
https://ais-dev-tu57qjas5btjythdqg52kt-585790079879.us-east1.run.app`;

    navigator.clipboard.writeText(blueprintText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section id="architecture" className="py-24 bg-[#FAF9F6] relative border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF6B35] mb-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#FF6B35]" />
            Interactive AI Sandbox & Architecture Generator
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#0A192F] tracking-tight leading-[1.1]">
            Architect your non-profit’s{' '}
            <span className="font-serif-editorial italic font-normal text-[#FF6B35]">
              AI blueprint.
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Select your mission sector and core operational bottleneck to preview the customized frontier AI system architecture, privacy requirements, and projected staff time recovered.
          </p>
        </div>

        {/* Sector Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {SECTOR_BLUEPRINTS.map((sec, idx) => (
            <button
              key={sec.sector}
              type="button"
              onClick={() => {
                setSelectedSectorIndex(idx);
                setSelectedPainPointIndex(0);
              }}
              className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                selectedSectorIndex === idx
                  ? 'bg-[#0A192F] text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
              }`}
            >
              <span>{sec.sector}</span>
            </button>
          ))}
        </div>

        {/* Main Interactive Studio Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Problem Selector & Team Sliders */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Bottleneck Selector */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 block">
                1. Select Operational Bottleneck
              </label>

              <div className="space-y-2">
                {currentSector.painPoints.map((pp, idx) => (
                  <button
                    key={pp.id}
                    type="button"
                    onClick={() => setSelectedPainPointIndex(idx)}
                    className={`w-full p-3.5 rounded-xl text-left transition-all border text-xs font-semibold flex items-start gap-3 cursor-pointer ${
                      selectedPainPointIndex === idx
                        ? 'bg-orange-50/70 border-[#FF6B35] text-[#0A192F]'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                        selectedPainPointIndex === idx
                          ? 'border-[#FF6B35] bg-[#FF6B35]'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {selectedPainPointIndex === idx && <Check className="w-2.5 h-2.5 text-white" />}
                    </span>
                    <div>
                      <div className="font-bold text-[#0A192F]">{pp.title}</div>
                      <div className="text-[11px] text-slate-500 font-normal mt-0.5 leading-snug">
                        {pp.typicalBottleneck}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Team Size Slider & Real-Time Impact Calculator */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                  2. Organization Team Size
                </label>
                <span className="text-xs font-mono font-bold text-[#FF6B35] bg-orange-50 px-2 py-0.5 rounded">
                  {staffSize} Full-Time Staff
                </span>
              </div>

              <input
                type="range"
                min="3"
                max="100"
                value={staffSize}
                onChange={(e) => setStaffSize(Number(e.target.value))}
                className="w-full accent-[#FF6B35] cursor-pointer"
              />

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-[#FAF9F6] border border-slate-100">
                  <div className="text-xl font-extrabold text-[#0A192F] font-sans">
                    ~{calculatedHoursSaved.toLocaleString()} hrs
                  </div>
                  <div className="text-[11px] font-bold text-slate-600">
                    Monthly Admin Time Saved
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <div className="text-xl font-extrabold text-emerald-800 font-sans">
                    ${calculatedDollarSavings.toLocaleString()}
                  </div>
                  <div className="text-[11px] font-bold text-emerald-700">
                    Monthly Value Recaptured
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Generated Architecture Blueprint Card */}
          <div className="lg:col-span-7">
            <motion.div
              key={`${selectedSectorIndex}-${selectedPainPointIndex}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="p-6 sm:p-8 rounded-2xl bg-[#0A192F] text-white shadow-xl border border-slate-800 space-y-6"
            >
              {/* Header Badge & Action */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF6B35] bg-[#FF6B35]/20 px-2.5 py-1 rounded">
                    Architecture Blueprint
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {currentPainPoint.implementationWeeks}-Week Deployment
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleStartExport}
                    disabled={isExporting}
                    className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    title="Export this architecture ledger directly to Google Sheets"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isExporting ? 'Exporting...' : 'Export to Sheets'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyBlueprint}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Blueprint</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {exportStatusText && (
                <div className="p-3 rounded-xl bg-emerald-900/40 border border-emerald-700/60 flex items-center justify-between text-xs text-emerald-200">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{exportStatusText}</span>
                  </div>
                  {exportSuccessUrl && exportSuccessUrl !== '#google-sheets' && (
                    <a
                      href={exportSuccessUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-300 font-bold hover:underline flex items-center gap-1 ml-2"
                    >
                      <span>Open Sheet</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {/* Blueprint Title & Architecture Type */}
              <div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1">
                  {currentPainPoint.title}
                </h3>
                <p className="text-xs font-mono text-[#FF6B35]">
                  Architecture Paradigm: {currentPainPoint.architectureType}
                </p>
              </div>

              {/* Recommended Intelligence Engine & Privacy Tier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-[#FF6B35]" /> Recommended Model Tier
                  </div>
                  <div className="text-xs font-bold text-slate-100">
                    {currentPainPoint.suggestedModel}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Privacy & Compliance
                  </div>
                  <div className="text-xs font-bold text-slate-100">
                    {currentPainPoint.privacyTier}
                  </div>
                </div>
              </div>

              {/* Subsystems Diagram / Components List */}
              <div className="space-y-2.5">
                <div className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-[#FF6B35]" /> Core Subsystems & Connectors
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentPainPoint.components.map((comp, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-center gap-2.5 text-xs text-slate-200"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35]" />
                      <span className="font-medium">{comp}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Projected Mission Impact */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#FF6B35]/15 to-transparent border border-[#FF6B35]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#FF6B35] font-bold">
                    Projected Mission Impact
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {currentPainPoint.impactMetric}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenConsultation}
                  className="px-5 py-2.5 rounded-full bg-[#FF6B35] hover:bg-[#E8551E] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span>Build This System</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </motion.div>
          </div>

        </div>

      </div>

      {/* Confirmation modal for exporting data to Google Sheets */}
      <WorkspaceConfirmModal
        isOpen={showConfirmModal}
        title="Export AI Blueprint to Google Sheets?"
        description={`This will write the current architecture configuration (${currentSector.sector} · ${currentPainPoint.title}) into your Google Sheet ledger "Civic AI Architecture & ROI Ledger".`}
        actionType="append"
        confirmLabel="Confirm Export to Sheets"
        confirmVariant="orange"
        details={{
          spreadsheetTitle: 'Civic AI Architecture & ROI Ledger',
          sheetTab: 'AI Blueprints',
          items: [
            `Sector: ${currentSector.sector}`,
            `Bottleneck: ${currentPainPoint.title}`,
            `Model Tier: ${currentPainPoint.suggestedModel}`,
            `Privacy: ${currentPainPoint.privacyTier}`,
            `Staff: ${staffSize} members (~${calculatedHoursSaved} hrs/mo)`
          ],
          affectedCount: 1
        }}
        isLoading={isExporting}
        onConfirm={handleConfirmExport}
        onCancel={() => setShowConfirmModal(false)}
      />
    </section>
  );
};
