import React from 'react';
import { AlertTriangle, Check, X, ShieldAlert, FileSpreadsheet, Trash2, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  actionType: 'create' | 'append' | 'delete' | 'update';
  details?: {
    spreadsheetTitle?: string;
    sheetTab?: string;
    items?: string[];
    affectedCount?: number;
  };
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary' | 'orange';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const WorkspaceConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  actionType,
  details,
  confirmLabel = 'Confirm Action',
  confirmVariant = 'primary',
  isLoading = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const isDestructive = actionType === 'delete';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className={`p-6 border-b ${isDestructive ? 'bg-rose-50/70 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isDestructive ? 'bg-rose-100 text-rose-600' : 'bg-orange-100 text-[#FF6B35]'
              }`}>
                {isDestructive ? (
                  <Trash2 className="w-5 h-5" />
                ) : actionType === 'create' ? (
                  <FileSpreadsheet className="w-5 h-5" />
                ) : (
                  <PlusCircle className="w-5 h-5" />
                )}
              </div>
              <div className="grow">
                <h3 className="text-base sm:text-lg font-bold text-[#0A192F]">
                  {title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  {description}
                </p>
              </div>
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body with specific details */}
          <div className="p-6 space-y-4 text-xs sm:text-sm">
            {details && (
              <div className="rounded-xl bg-[#FAF9F6] border border-slate-200 p-4 space-y-2 font-mono text-xs">
                {details.spreadsheetTitle && (
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-500">Spreadsheet:</span>
                    <span className="font-bold text-[#0A192F] truncate max-w-[240px]">
                      {details.spreadsheetTitle}
                    </span>
                  </div>
                )}
                {details.sheetTab && (
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-500">Target Tab:</span>
                    <span className="font-semibold text-emerald-700">
                      {details.sheetTab}
                    </span>
                  </div>
                )}
                {details.affectedCount !== undefined && (
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-500">Records to mutate:</span>
                    <span className="font-bold text-[#FF6B35]">
                      {details.affectedCount} row(s)
                    </span>
                  </div>
                )}

                {details.items && details.items.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 space-y-1">
                    <div className="text-slate-500 text-[11px] uppercase tracking-wider">
                      Payload Preview:
                    </div>
                    <div className="max-h-28 overflow-y-auto space-y-1 pr-1 font-sans text-xs">
                      {details.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-slate-800 truncate"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                Changes will be executed directly via Google Workspace APIs on your authorized account.
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-full border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 ${
                isDestructive
                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                  : confirmVariant === 'orange'
                  ? 'bg-[#FF6B35] text-white hover:bg-[#E8551E]'
                  : 'bg-[#0A192F] text-white hover:bg-[#162B4D]'
              }`}
            >
              {isLoading ? (
                <span>Executing API Call...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{confirmLabel}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
