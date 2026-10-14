import React from 'react';
import { X } from 'lucide-react';
import { LegalView, LegalTab } from '../Legal/LegalView';

interface LegalModalProps {
  isOpen: boolean;
  initialTab?: LegalTab;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  initialTab = 'terms',
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Dokumen Legal Rintik"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-kartu border border-garis rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-xl text-teks-sekunder hover:text-teks-utama hover:bg-kartu-muted border border-transparent hover:border-garis transition-all"
          aria-label="Tutup dokumen legal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Document Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <LegalView initialTab={initialTab} onBack={onClose} isModal={true} />
        </div>
      </div>
    </div>
  );
};
