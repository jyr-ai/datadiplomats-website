import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  RefreshCw,
  ExternalLink,
  Table,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowRight,
  Sparkles,
  Download,
  Trash2,
  Lock,
  Layers,
  Search,
  Filter,
  LogOut,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  WORKSPACE_SCOPES
} from '../lib/googleAuth';
import {
  listSpreadsheets,
  getSpreadsheetMetadata,
  getSheetValues,
  createSpreadsheet,
  appendRow,
  deleteSpreadsheet,
  DriveFile,
  SpreadsheetMetadata,
  SheetValuesResult
} from '../lib/sheetsService';
import { GoogleSignInButton } from './GoogleSignInButton';
import { WorkspaceConfirmModal, ConfirmModalProps } from './WorkspaceConfirmModal';

interface SheetsHubProps {
  onOpenConsultation?: () => void;
}

export const SheetsHub: React.FC<SheetsHubProps> = ({ onOpenConsultation }) => {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sheets data state
  const [spreadsheets, setSpreadsheets] = useState<DriveFile[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Active selected spreadsheet
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState<DriveFile | null>(null);
  const [metadata, setMetadata] = useState<SpreadsheetMetadata | null>(null);
  const [selectedSheetTitle, setSelectedSheetTitle] = useState<string>('');
  const [sheetData, setSheetData] = useState<SheetValuesResult | null>(null);
  const [loadingSheetData, setLoadingSheetData] = useState(false);

  // New row input state
  const [newRowInput, setNewRowInput] = useState<string>('');
  const [isAddingRow, setIsAddingRow] = useState(false);

  // Confirmation modal state (MANDATORY for mutating/destructive actions per Workspace skill)
  const [modalConfig, setModalConfig] = useState<ConfirmModalProps>({
    isOpen: false,
    title: '',
    description: '',
    actionType: 'create',
    onConfirm: () => {},
    onCancel: () => {}
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Show toast notification
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Initialize auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (authenticatedUser, token) => {
        setUser(authenticatedUser);
        setAccessToken(token);
        setAuthLoading(false);
        setAuthError(null);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setAuthLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Fetch spreadsheets once authenticated
  useEffect(() => {
    if (accessToken) {
      loadSpreadsheetList(accessToken);
    } else {
      setSpreadsheets([]);
      setSelectedSpreadsheet(null);
      setMetadata(null);
      setSheetData(null);
    }
  }, [accessToken]);

  const loadSpreadsheetList = async (token: string) => {
    setLoadingList(true);
    try {
      const files = await listSpreadsheets(token);
      setSpreadsheets(files);
      if (files.length > 0 && !selectedSpreadsheet) {
        handleSelectSpreadsheet(files[0], token);
      }
    } catch (err: any) {
      console.error('Error listing spreadsheets:', err);
      showToast(err.message || 'Unable to load spreadsheets from Google Drive', 'error');
    } finally {
      setLoadingList(false);
    }
  };

  const handleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        showToast('Successfully authenticated with Google Sheets & Drive.');
      }
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      setAuthError(err.message || 'Authentication was interrupted or denied.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setSelectedSpreadsheet(null);
    setMetadata(null);
    setSheetData(null);
    showToast('Signed out of Google Workspace.');
  };

  const handleSelectSpreadsheet = async (file: DriveFile, token = accessToken) => {
    if (!token) return;
    setSelectedSpreadsheet(file);
    setLoadingSheetData(true);
    try {
      // Best practice: Always inspect metadata to discover real tab titles, not assuming "Sheet1"
      const meta = await getSpreadsheetMetadata(token, file.id);
      setMetadata(meta);
      const firstTab = meta.sheets[0]?.title || 'Sheet1';
      setSelectedSheetTitle(firstTab);
      
      const values = await getSheetValues(token, file.id, firstTab);
      setSheetData(values);
    } catch (err: any) {
      console.error('Failed to load spreadsheet details:', err);
      showToast(err.message || 'Failed to read sheet contents', 'error');
    } finally {
      setLoadingSheetData(false);
    }
  };

  const handleSelectTab = async (tabTitle: string) => {
    if (!accessToken || !selectedSpreadsheet) return;
    setSelectedSheetTitle(tabTitle);
    setLoadingSheetData(true);
    try {
      const values = await getSheetValues(accessToken, selectedSpreadsheet.id, tabTitle);
      setSheetData(values);
    } catch (err: any) {
      console.error('Failed to load tab:', err);
      showToast(err.message || 'Failed to read tab values', 'error');
    } finally {
      setLoadingSheetData(false);
    }
  };

  // Pre-configured civic templates
  const TEMPLATES = [
    {
      id: 'intake-tracker',
      title: 'Data Diplomats - Intake & Casework Triage',
      sheetName: 'Inquiries Log',
      headers: ['Timestamp', 'Organization', 'Mission Sector', 'Contact Email', 'Priority Tier', 'AI Readiness', 'Workflow Bottleneck', 'Triage Status'],
      sampleRows: [
        [new Date().toISOString().split('T')[0], 'Bronx Food Pantry Collective', 'Food Relief', 'director@bronxfood.org', 'Urgent', 'Early Pilot', 'Cold-chain dispatch route routing', 'Reviewing'],
        [new Date().toISOString().split('T')[0], 'Harlem Community Legal Defenders', 'Legal Aid', 'intake@harlemlegal.org', 'High', 'Planning', 'Eviction notice parsing & bilingual OCR', 'Assigned Fellow']
      ],
      description: 'Structured repository for logging non-profit discovery briefs, urgent caseloads, and casework triage stages.'
    },
    {
      id: 'blueprint-tracker',
      title: 'Civic AI Architecture & ROI Ledger',
      sheetName: 'AI Blueprints',
      headers: ['Date Created', 'Organization Sector', 'Team Size', 'Core Bottleneck', 'Model Tier', 'Privacy Architecture', 'Est. Monthly Hours Saved', 'Annual Philanthropic Value ($)'],
      sampleRows: [
        [new Date().toISOString().split('T')[0], 'Emergency Medical Response NGO', '15-40 staff', 'Dispatch Routing & Supply', 'Gemini 1.5 Flash + Local Air-gap', 'PII Zero Retention', '140 hrs', '$67,200'],
        [new Date().toISOString().split('T')[0], 'Immigrant Rights Advocacy Fund', '5-15 staff', 'Grant Proposal Drafts', 'Custom Grounded RAG', 'Air-gapped Vector DB', '85 hrs', '$40,800']
      ],
      description: 'Tracks technical feasibility scores, recommended open-weights vs cloud models, and projected foundation cost savings.'
    },
    {
      id: 'food-rescue',
      title: 'NYC Food Surplus Rescue Dispatch Log',
      sheetName: 'Active Dispatches',
      headers: ['Dispatch ID', 'Donor Grocery / Wholesaler', 'Borough', 'Food Type', 'Quantity (Lbs)', 'Cold Storage Req.', 'Destination Shelter', 'Status'],
      sampleRows: [
        ['DSP-2026-081', 'Hunts Point Wholesale Produce', 'Bronx', 'Fresh Vegetables', '1,450 lbs', 'Yes (Refrigerated)', 'City Harvest Hub #4', 'In Transit'],
        ['DSP-2026-082', 'Brooklyn Bakery Co-op', 'Brooklyn', 'Artisan Bread / Grains', '320 lbs', 'No (Ambient)', 'Bed-Stuy Pantry', 'Delivered']
      ],
      description: 'Operational dispatch roster syncing dynamic surplus food donations with receiving community kitchens.'
    }
  ];

  // Open Confirmation Modal to Create a Spreadsheet
  const promptCreateTemplate = (template: typeof TEMPLATES[0]) => {
    if (!accessToken) {
      handleSignIn();
      return;
    }

    setModalConfig({
      isOpen: true,
      title: `Create Google Spreadsheet?`,
      description: `This will create a new Google Sheet named "${template.title}" in your Google Drive root folder with pre-formatted column headers and initial records.`,
      actionType: 'create',
      confirmLabel: 'Create in Google Drive',
      confirmVariant: 'orange',
      details: {
        spreadsheetTitle: template.title,
        sheetTab: template.sheetName,
        items: [`Columns: ${template.headers.join(', ')}`, `Sample Rows: ${template.sampleRows.length} initial records`],
        affectedCount: template.sampleRows.length + 1
      },
      onCancel: () => setModalConfig(prev => ({ ...prev, isOpen: false })),
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const res = await createSpreadsheet(
            accessToken,
            template.title,
            template.sheetName,
            template.headers,
            template.sampleRows
          );
          setModalConfig(prev => ({ ...prev, isOpen: false }));
          showToast(`Successfully created "${template.title}" in your Google Drive!`);
          await loadSpreadsheetList(accessToken);
        } catch (err: any) {
          console.error('Failed to create sheet:', err);
          showToast(err.message || 'Failed to create spreadsheet', 'error');
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  // Open Confirmation Modal to Append a Row
  const promptAppendRow = () => {
    if (!accessToken || !selectedSpreadsheet || !selectedSheetTitle) return;
    if (!newRowInput.trim()) {
      showToast('Please provide comma-separated values to append.', 'error');
      return;
    }

    const rowValues = newRowInput.split(',').map(s => s.trim());

    setModalConfig({
      isOpen: true,
      title: 'Append Record to Google Sheet?',
      description: `You are about to append 1 new row to tab "${selectedSheetTitle}" in spreadsheet "${selectedSpreadsheet.name}".`,
      actionType: 'append',
      confirmLabel: 'Confirm Append',
      confirmVariant: 'primary',
      details: {
        spreadsheetTitle: selectedSpreadsheet.name,
        sheetTab: selectedSheetTitle,
        items: rowValues.map((v, i) => `Col ${i + 1}: ${v}`),
        affectedCount: 1
      },
      onCancel: () => setModalConfig(prev => ({ ...prev, isOpen: false })),
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await appendRow(accessToken, selectedSpreadsheet.id, selectedSheetTitle, rowValues);
          setModalConfig(prev => ({ ...prev, isOpen: false }));
          setNewRowInput('');
          setIsAddingRow(false);
          showToast('Row appended to Google Sheet successfully!');
          // Refresh sheet values
          const updated = await getSheetValues(accessToken, selectedSpreadsheet.id, selectedSheetTitle);
          setSheetData(updated);
        } catch (err: any) {
          console.error('Failed to append row:', err);
          showToast(err.message || 'Failed to append record', 'error');
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  // Open Confirmation Modal to Delete a Spreadsheet
  const promptDeleteSpreadsheet = (file: DriveFile) => {
    if (!accessToken) return;

    setModalConfig({
      isOpen: true,
      title: 'Delete Spreadsheet from Google Drive?',
      description: `Are you sure you want to delete "${file.name}"? This file will be permanently removed or moved to trash on your Google Drive.`,
      actionType: 'delete',
      confirmLabel: 'Delete Spreadsheet',
      confirmVariant: 'danger',
      details: {
        spreadsheetTitle: file.name,
        items: [`File ID: ${file.id}`],
        affectedCount: 1
      },
      onCancel: () => setModalConfig(prev => ({ ...prev, isOpen: false })),
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await deleteSpreadsheet(accessToken, file.id);
          setModalConfig(prev => ({ ...prev, isOpen: false }));
          showToast(`Deleted "${file.name}" from Google Drive.`);
          if (selectedSpreadsheet?.id === file.id) {
            setSelectedSpreadsheet(null);
            setMetadata(null);
            setSheetData(null);
          }
          await loadSpreadsheetList(accessToken);
        } catch (err: any) {
          console.error('Failed to delete spreadsheet:', err);
          showToast(err.message || 'Failed to delete file', 'error');
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  // Filter spreadsheets
  const filteredSpreadsheets = spreadsheets.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section id="google-sheets" className="py-24 bg-[#FAF9F6] border-t border-slate-200 relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs sm:text-sm font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-[#0A192F] text-white border-slate-700'
                : 'bg-rose-900 text-white border-rose-700'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <WorkspaceConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        description={modalConfig.description}
        actionType={modalConfig.actionType}
        details={modalConfig.details}
        confirmLabel={modalConfig.confirmLabel}
        confirmVariant={modalConfig.confirmVariant}
        isLoading={actionLoading}
        onConfirm={modalConfig.onConfirm}
        onCancel={modalConfig.onCancel}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-slate-200">
          <div className="space-y-4 max-w-2xl">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF6B35] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FF6B35]" />
              Frontier Workspace Integration
            </div>
            
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#0A192F] tracking-tight leading-[1.1]">
              Google Sheets for{' '}
              <span className="font-serif-editorial italic font-normal text-[#FF6B35]">
                Civic Operations.
              </span>
            </h2>

            <p className="text-base text-slate-600 leading-relaxed font-normal">
              Connect your Google Workspace account to review incoming non-profit casework, export AI deployment blueprints, or seed pre-built social sector triage spreadsheets with full data sovereignty.
            </p>
          </div>

          {/* Auth State Action Bar */}
          <div className="shrink-0 flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 p-2 pl-3 rounded-full bg-white border border-slate-200 shadow-xs">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#FF6B35]/20 text-[#FF6B35] font-bold flex items-center justify-center text-xs">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div className="text-left pr-2">
                  <div className="text-xs font-bold text-[#0A192F] truncate max-w-[140px]">
                    {user.displayName || user.email}
                  </div>
                  <div className="text-[10px] font-mono text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    Connected
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  title="Sign Out"
                  className="p-2 rounded-full text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <GoogleSignInButton
                onClick={handleSignIn}
                disabled={authLoading}
                label="Connect Google Sheets"
              />
            )}
          </div>
        </div>

        {/* If Not Signed In Prompt Banner */}
        {!user && !authLoading && (
          <div className="mt-8 p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF6B35] flex items-center justify-center shrink-0 mt-0.5">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#0A192F]">
                  Authorize Google Sheets & Drive Access
                </h3>
                <p className="text-sm text-slate-600 max-w-xl leading-relaxed">
                  Sign in with your Google account to browse spreadsheets in your Google Drive, create pre-structured non-profit triage templates, and sync casework data.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-500">
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Zero Data Retention
                  </span>
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" /> In-Memory Tokens Only
                  </span>
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Full User Confirmation Before Writes
                  </span>
                </div>
              </div>
            </div>

            <div className="shrink-0">
              <GoogleSignInButton onClick={handleSignIn} />
            </div>
          </div>
        )}

        {/* Main Interactive Workspace Area */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Spreadsheets Directory & Template Starter (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Template Starters Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF6B35] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Nonprofit Templates
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  1-Click Seed
                </span>
              </div>

              <div className="space-y-3">
                {TEMPLATES.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-[#FAF9F6] hover:border-[#FF6B35]/60 transition-all space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-xs text-[#0A192F] group-hover:text-[#FF6B35] transition-colors leading-tight">
                        {tmpl.title}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      {tmpl.description}
                    </p>
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400">
                        {tmpl.headers.length} columns
                      </span>
                      <button
                        type="button"
                        onClick={() => promptCreateTemplate(tmpl)}
                        className="px-3 py-1.5 rounded-full bg-[#0A192F] text-white text-[11px] font-bold hover:bg-[#FF6B35] transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Create Sheet</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* User's Google Drive Spreadsheets List */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#FF6B35]" />
                  Your Spreadsheets
                </div>

                {user && (
                  <button
                    type="button"
                    onClick={() => accessToken && loadSpreadsheetList(accessToken)}
                    disabled={loadingList}
                    title="Refresh List"
                    className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingList ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </div>

              {user ? (
                <>
                  {/* Search filter */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Filter spreadsheets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#FAF9F6] border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#FF6B35]"
                    />
                  </div>

                  {/* List of files */}
                  <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                    {loadingList ? (
                      <div className="py-8 text-center text-xs text-slate-400 font-mono">
                        Querying Google Drive files...
                      </div>
                    ) : filteredSpreadsheets.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        {spreadsheets.length === 0
                          ? 'No Google Sheets found in your Drive. Create one using the templates above!'
                          : 'No spreadsheets matching search.'}
                      </div>
                    ) : (
                      filteredSpreadsheets.map((file) => {
                        const isSelected = selectedSpreadsheet?.id === file.id;
                        return (
                          <div
                            key={file.id}
                            className={`w-full p-2.5 rounded-xl text-left text-xs transition-all flex items-center justify-between group ${
                              isSelected
                                ? 'bg-orange-50/80 border border-[#FF6B35] text-[#0A192F]'
                                : 'bg-[#FAF9F6] hover:bg-slate-100 border border-transparent text-slate-700'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleSelectSpreadsheet(file)}
                              className="grow text-left truncate mr-2 cursor-pointer"
                            >
                              <div className="font-semibold truncate">
                                {file.name}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {file.modifiedTime
                                  ? new Date(file.modifiedTime).toLocaleDateString()
                                  : 'Recent'}
                              </div>
                            </button>

                            <div className="flex items-center gap-1 shrink-0">
                              {file.webViewLink && (
                                <a
                                  href={file.webViewLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Open in Google Sheets"
                                  className="p-1 rounded text-slate-400 hover:text-[#FF6B35]"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => promptDeleteSpreadsheet(file)}
                                title="Delete Sheet"
                                className="p-1 rounded text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400 space-y-2">
                  <Lock className="w-5 h-5 mx-auto text-slate-300" />
                  <p>Sign in with Google to view spreadsheets from your Drive.</p>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Live Sheet Viewer & Row Appender (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              
              {/* Viewer Header */}
              <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAF9F6]">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base sm:text-lg text-[#0A192F] truncate max-w-md">
                      {selectedSpreadsheet ? selectedSpreadsheet.name : 'No Spreadsheet Selected'}
                    </h3>
                    {selectedSpreadsheet?.webViewLink && (
                      <a
                        href={selectedSpreadsheet.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#FF6B35] hover:underline"
                      >
                        <span>Open in Google Sheets</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {metadata
                      ? `${metadata.sheets.length} sheet tab(s) detected via Sheets API v4`
                      : 'Select a spreadsheet or create one from the templates on the left'}
                  </p>
                </div>

                {/* Tab selector pills */}
                {metadata && metadata.sheets.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {metadata.sheets.map((tab) => (
                      <button
                        key={tab.sheetId}
                        type="button"
                        onClick={() => handleSelectTab(tab.title)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                          selectedSheetTitle === tab.title
                            ? 'bg-[#0A192F] text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {tab.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Data Table View */}
              <div className="p-5">
                {loadingSheetData ? (
                  <div className="py-16 text-center space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-[#FF6B35] mx-auto" />
                    <div className="text-xs font-mono text-slate-500">
                      Reading cells from Google Sheets API...
                    </div>
                  </div>
                ) : !selectedSpreadsheet ? (
                  <div className="py-20 text-center space-y-3">
                    <Table className="w-10 h-10 text-slate-300 mx-auto" />
                    <div className="text-sm font-bold text-[#0A192F]">
                      No Active Spreadsheet Selected
                    </div>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Choose an existing spreadsheet from the list on the left, or seed one using our non-profit civic templates.
                    </p>
                  </div>
                ) : !sheetData || sheetData.values.length === 0 ? (
                  <div className="py-16 text-center space-y-2">
                    <div className="text-xs font-mono text-slate-400">
                      Tab "{selectedSheetTitle}" contains no cell data yet.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                      <span>Range: {sheetData.range}</span>
                      <span>{sheetData.values.length} row(s) loaded</span>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs max-h-96">
                      <table className="w-full text-left text-xs border-collapse">
                        {/* Header Row */}
                        {sheetData.values.length > 0 && (
                          <thead className="bg-[#0A192F] text-white font-mono sticky top-0 z-10">
                            <tr>
                              <th className="p-3 border-b border-slate-700 w-10 text-slate-400 font-normal">#</th>
                              {sheetData.values[0].map((header, idx) => (
                                <th
                                  key={idx}
                                  className="p-3 border-b border-slate-700 font-semibold tracking-wider whitespace-nowrap"
                                >
                                  {header || `Col ${idx + 1}`}
                                </th>
                              ))}
                            </tr>
                          </thead>
                        )}
                        {/* Data Rows */}
                        <tbody className="divide-y divide-slate-200 bg-white font-sans">
                          {sheetData.values.slice(1).map((row, rowIdx) => (
                            <tr
                              key={rowIdx}
                              className="hover:bg-orange-50/40 transition-colors"
                            >
                              <td className="p-3 text-slate-400 font-mono bg-slate-50/50">
                                {rowIdx + 2}
                              </td>
                              {row.map((cell, cellIdx) => (
                                <td
                                  key={cellIdx}
                                  className="p-3 text-slate-700 whitespace-nowrap max-w-xs truncate"
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Append Row Footer Area */}
              {selectedSpreadsheet && selectedSheetTitle && user && (
                <div className="p-4 bg-[#FAF9F6] border-t border-slate-200">
                  {isAddingRow ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#0A192F]">
                          Append New Row Values (Comma-Separated)
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsAddingRow(false)}
                          className="text-xs text-slate-500 hover:text-slate-800"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newRowInput}
                          onChange={(e) => setNewRowInput(e.target.value)}
                          placeholder="e.g. 2026-09-08, Brooklyn Tenant Defense, Legal Aid, contact@ngo.org, High"
                          className="grow px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-[#0A192F] placeholder-slate-400 focus:outline-hidden focus:border-[#FF6B35]"
                        />
                        <button
                          type="button"
                          onClick={promptAppendRow}
                          disabled={actionLoading || !newRowInput.trim()}
                          className="px-4 py-2 rounded-xl bg-[#FF6B35] text-white text-xs font-bold hover:bg-[#E8551E] disabled:opacity-50 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Append Row</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        An explicit confirmation prompt will appear before the write is sent to Google Sheets API.
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-500 font-medium">
                        Need to insert fresh triage records or export casework updates?
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddingRow(true)}
                        className="px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-[#0A192F] hover:border-[#FF6B35] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#FF6B35]" />
                        <span>Add Row to Sheet</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Quick Export Blueprint Banner */}
            <div className="p-6 rounded-2xl bg-[#0A192F] text-white border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-mono font-bold text-[#FF6B35] uppercase tracking-wider">
                  AI Architecture Exporter
                </div>
                <h4 className="text-base font-bold text-white">
                  Sync your custom AI Sandbox Blueprint into Google Sheets
                </h4>
                <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
                  Design an air-gapped system in our interactive Architecture Sandbox, then export your staffing requirements and model costs directly to your Google Drive.
                </p>
              </div>

              <a
                href="#architecture"
                className="px-4 py-2.5 rounded-full bg-[#FF6B35] text-white text-xs font-bold hover:bg-[#E8551E] transition-colors shrink-0 flex items-center gap-1.5"
              >
                <span>Configure in Sandbox</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
