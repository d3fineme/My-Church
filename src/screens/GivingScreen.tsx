import React, { useState } from 'react';
import {
  HeartHandshake,
  CreditCard,
  Copy,
  Check,
  QrCode,
  Upload,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowRight,
  Eye,
  X,
  FileText,
  Ticket,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useChurchData } from '../context/ChurchDataContext';
import { TabType } from '../components/BottomNav';
import { ContributionType } from '../types';

interface GivingScreenProps {
  onNavigateTab: (tab: TabType) => void;
}

export const GivingScreen: React.FC<GivingScreenProps> = ({ onNavigateTab }) => {
  const { user, openAuthModal } = useAuth();
  const { t } = useLanguage();
  const {
    bankingSettings,
    myContributions,
    createContribution,
  } = useChurchData();

  const [contributionType, setContributionType] = useState<ContributionType>('Tithe');
  const [amount, setAmount] = useState<string>('50');
  const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [proofDataUrl, setProofDataUrl] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState<string | null>(null);

  // Copy feedback
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // QR Modal
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Proof Viewer Modal
  const [viewingProofUrl, setViewingProofUrl] = useState<string | null>(null);

  // Submit feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const bank = bankingSettings || {
    beneficiaryName: 'Assembly of God Ireland Ministry',
    bankName: 'Bank of Ireland (Dublin South)',
    iban: 'IE29 BOFI 9000 1712 3456 78',
    bicSwift: 'BOFIIE2D',
    paymentReference: 'AOGIM-DUBLIN',
    additionalInstructions: 'Please include your Full Name and purpose in the transfer description.',
    bankQrCodeImage: null,
  };

  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setSubmitFeedback({ type: 'error', message: 'File is too large. Maximum size is 10MB.' });
        return;
      }
      setProofFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setSubmitFeedback({ type: 'error', message: 'Please enter a valid positive contribution amount.' });
      return;
    }

    setIsSubmitting(true);
    setSubmitFeedback(null);

    const defaultRef = paymentReference.trim() || `${contributionType} - ${user.fullName}`;

    const res = await createContribution({
      contributionType,
      amount: numAmount,
      transferDate,
      paymentReference: defaultRef,
      paymentProof: proofDataUrl,
    });

    setIsSubmitting(false);

    if (res.success) {
      setSubmitFeedback({ type: 'success', message: t.giving.submissionSuccess });
      setProofDataUrl(null);
      setProofFileName(null);
    } else {
      setSubmitFeedback({ type: 'error', message: res.message || t.common.error });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Under Review':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Submitted':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Rejected':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto">
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
          {t.giving.title}
        </h1>
        <p className="text-xs text-slate-500">
          Assembly of God Ireland Ministry · AOGIM Dublin
        </p>
      </div>

      {/* Contribution Type Toggle (Tithe vs Offering) */}
      <div className="bg-slate-200/80 p-1.5 rounded-2xl flex items-center shadow-inner">
        <button
          onClick={() => {
            setContributionType('Tithe');
            setSubmitFeedback(null);
          }}
          className={`flex-1 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
            contributionType === 'Tithe'
              ? 'bg-[#0F2648] text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <HeartHandshake className="w-4 h-4 text-[#D4AF37]" />
          <span>{t.giving.tithe}</span>
        </button>

        <button
          onClick={() => {
            setContributionType('Offering');
            setSubmitFeedback(null);
          }}
          className={`flex-1 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
            contributionType === 'Offering'
              ? 'bg-[#0F2648] text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4 text-[#D4AF37]" />
          <span>{t.giving.offering}</span>
        </button>
      </div>

      {/* Welcoming Institutional Message */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-[#0A192F] via-[#0F2648] to-[#1E3A8A] text-white shadow-lg border border-white/10 space-y-2 relative overflow-hidden">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#D4AF37] uppercase tracking-wider">
          <span>✝</span>
          <span>{contributionType === 'Tithe' ? t.giving.tithe : t.giving.offering}</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-medium">
          {contributionType === 'Tithe' ? t.giving.titheWelcome : t.giving.offeringWelcome}
        </p>
      </div>

      {/* Bank Details Card with Copy Buttons */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#0F2648]" />
            <h2 className="font-display font-bold text-sm sm:text-base text-slate-900">
              {t.giving.bankDetailsTitle}
            </h2>
          </div>
          {bank.bankQrCodeImage && (
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="text-xs font-semibold text-[#1E3A8A] hover:underline flex items-center gap-1"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{t.giving.viewQrCode}</span>
            </button>
          )}
        </div>

        {/* Bank rows */}
        <div className="space-y-2.5 text-xs">
          {[
            { key: 'beneficiary', label: t.giving.beneficiary, value: bank.beneficiaryName },
            { key: 'bankName', label: t.giving.bankName, value: bank.bankName },
            { key: 'iban', label: t.giving.iban, value: bank.iban, highlight: true },
            { key: 'bic', label: t.giving.bicSwift, value: bank.bicSwift },
            {
              key: 'ref',
              label: t.giving.paymentRef,
              value: user ? `${contributionType} - ${user.fullName}` : bank.paymentReference,
            },
          ].map((row) => (
            <div
              key={row.key}
              className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  {row.label}
                </span>
                <span
                  className={`font-semibold block truncate ${
                    row.highlight ? 'font-mono text-xs sm:text-sm text-[#0F2648] font-bold' : 'text-slate-800'
                  }`}
                >
                  {row.value}
                </span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(row.value, row.key)}
                className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[11px] shrink-0 flex items-center gap-1 transition-colors shadow-2xs"
                title="Copy to clipboard"
              >
                {copiedField === row.key ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">{t.giving.copied}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{t.giving.copy}</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Bank QR Code preview if available */}
        {bank.bankQrCodeImage ? (
          <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white p-1 border border-amber-200 shrink-0 shadow-2xs overflow-hidden">
                <img
                  src={bank.bankQrCodeImage}
                  alt="Bank QR Code"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <strong className="text-xs font-bold text-amber-950 block">
                  {t.giving.bankQrCode}
                </strong>
                <span className="text-[11px] text-amber-800">
                  Scan directly from your mobile banking app
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-900 text-white font-semibold text-xs shrink-0"
            >
              {t.giving.viewQrCode}
            </button>
          </div>
        ) : (
          <p className="text-[11px] text-slate-400 italic">
            {t.giving.instructions}: {bank.additionalInstructions}
          </p>
        )}
      </div>

      {/* Contribution Submission Form */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <ShieldCheck className="w-4 h-4 text-[#0F2648]" />
          <h2 className="font-display font-bold text-sm sm:text-base text-slate-900">
            {t.giving.submitContribution}
          </h2>
        </div>

        {/* Feedback alert */}
        {submitFeedback && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2 ${
              submitFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {submitFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{submitFeedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmitContribution} className="space-y-4">
          {/* Amount input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.giving.enterAmount} (EUR €) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                €
              </span>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50.00"
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F2648]/20 focus:border-[#0F2648]"
              />
            </div>

            {/* Quick amount buttons */}
            <div className="flex items-center gap-1.5 mt-2">
              {['20', '50', '100', '200', '500'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                    amount === preset
                      ? 'bg-[#0F2648] text-white border-[#0F2648]'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  €{preset}
                </button>
              ))}
            </div>
          </div>

          {/* Transfer Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.giving.transferDate} *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                required
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F2648]/20"
              />
            </div>
          </div>

          {/* Transfer Proof (optional) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              {t.giving.attachProof}
            </label>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center text-center space-y-2">
              <Upload className="w-6 h-6 text-slate-400 stroke-[1.5]" />
              <div className="text-xs text-slate-600">
                {proofFileName ? (
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    {proofFileName}
                  </span>
                ) : (
                  <span>Click to select image or receipt document</span>
                )}
              </div>
              <label className="cursor-pointer px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 shadow-2xs">
                <span>{proofFileName ? 'Change File' : 'Browse Files'}</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleProofUpload}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              {t.giving.proofNotice}
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-[#0F2648] hover:bg-[#1E3A8A] text-white font-bold text-xs sm:text-sm shadow-md transition-all disabled:opacity-50"
          >
            {isSubmitting ? t.common.loading : t.giving.submitContribution}
          </button>
        </form>
      </div>

      {/* Member's Contribution History: "My Contributions" */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#0F2648]" />
            <h2 className="font-display font-bold text-sm sm:text-base text-slate-900">
              {t.giving.myContributions}
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {myContributions.length} records
          </span>
        </div>

        {myContributions.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            <p>{t.giving.noContributions}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myContributions.map((cnt) => (
              <div
                key={cnt.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        €{cnt.amount.toFixed(2)} {cnt.currency}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0F2648]/10 text-[#0F2648]">
                        {cnt.contributionType}
                      </span>
                    </div>
                    <span className="text-slate-500 text-[11px] block mt-0.5">
                      Transfer Date: {cnt.transferDate}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(
                      cnt.status
                    )}`}
                  >
                    {cnt.status}
                  </span>
                </div>

                {/* If rejection reason exists */}
                {cnt.status === 'Rejected' && cnt.rejectionReason && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] leading-snug">
                    <strong>{t.financial.rejectionReason}:</strong> {cnt.rejectionReason}
                  </div>
                )}

                {/* Proof preview link */}
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Ref: {cnt.paymentReference}</span>
                  {cnt.paymentProof ? (
                    <button
                      type="button"
                      onClick={() => setViewingProofUrl(cnt.paymentProof!)}
                      className="text-[#1E3A8A] font-semibold hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{t.financial.viewProof}</span>
                    </button>
                  ) : (
                    <span className="text-slate-400 italic">No proof attached</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Third Area: Paid Events Gateway */}
      <div
        onClick={() => onNavigateTab('events')}
        className="p-5 rounded-3xl bg-gradient-to-r from-amber-950 via-[#0F2648] to-[#0A192F] text-white flex items-center justify-between gap-4 cursor-pointer hover:shadow-lg transition-all border border-amber-500/30"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/40">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-[#D4AF37]">
              {t.giving.paidEventsNotice}
            </h3>
            <p className="text-xs text-slate-200">
              Conferences, workshops & couples dinners with bank transfer reservations.
            </p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-amber-400 shrink-0" />
      </div>

      {/* QR Code Enlarged Modal */}
      {isQrModalOpen && bank.bankQrCodeImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-display font-bold text-base text-slate-900">
                {t.giving.bankQrCode}
              </h3>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-64 h-64 mx-auto bg-white p-3 rounded-2xl border border-slate-200 shadow-inner flex items-center justify-center overflow-hidden">
              <img
                src={bank.bankQrCodeImage}
                alt="Church Bank QR Code"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Open your banking application (Bank of Ireland, AIB, Revolut, etc.) and scan to pay.
            </p>

            <a
              href={bank.bankQrCodeImage}
              download="AOGIM_Dublin_Bank_QR.png"
              className="w-full py-2.5 rounded-xl bg-[#0F2648] text-white text-xs font-semibold block transition-colors"
            >
              {t.giving.saveQrCode}
            </a>
          </div>
        </div>
      )}

      {/* Payment Proof Viewer Modal */}
      {viewingProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#0A192F] text-white">
              <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#D4AF37]" />
                <span>{t.financial.proofDocument}</span>
              </h3>
              <button
                onClick={() => setViewingProofUrl(null)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex items-center justify-center bg-slate-900 min-h-[300px]">
              {viewingProofUrl.startsWith('data:application/pdf') ? (
                <iframe
                  src={viewingProofUrl}
                  title="PDF Proof"
                  className="w-full h-96 rounded-xl border border-slate-700"
                />
              ) : (
                <img
                  src={viewingProofUrl}
                  alt="Proof document"
                  className="max-h-[70vh] max-w-full object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
