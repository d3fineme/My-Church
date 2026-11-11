import React, { useState } from 'react';
import { X, Mail, Lock, User, Globe, AlertCircle, CheckCircle2, KeyRound, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { TermsModal } from './TermsModal';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalTab,
    closeAuthModal,
    openAuthModal,
    login,
    register,
    forgotPassword,
    resetPassword,
    bootstrapAdmin,
  } = useAuth();
  const { t } = useLanguage();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [countryOfOrigin, setCountryOfOrigin] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [bootstrapKey, setBootstrapKey] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTerms, setActiveTerms] = useState<'terms' | 'privacy' | null>(null);
  const [generatedResetCode, setGeneratedResetCode] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleTabChange = (tab: 'login' | 'register' | 'forgot' | 'bootstrap') => {
    setErrorMessage(null);
    setSuccessMessage(null);
    openAuthModal(tab);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    const res = await login(email, password);
    setIsSubmitting(false);
    if (!res.success) {
      setErrorMessage(res.error || t.common.error);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!fullName.trim() || !email.trim() || !password || !countryOfOrigin.trim()) {
      setErrorMessage(t.common.required);
      return;
    }

    if (password.length < 6) {
      setErrorMessage(t.auth.passwordPlaceholder);
      return;
    }

    setIsSubmitting(true);
    const res = await register({
      fullName,
      email,
      password,
      countryOfOrigin,
    });
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || t.common.error);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email) {
      setErrorMessage('Please enter your email.');
      return;
    }

    setIsSubmitting(true);
    const res = await forgotPassword(email);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage('Recovery code generated.');
      if (res.demoResetCode) {
        setGeneratedResetCode(res.demoResetCode);
        setResetCode(res.demoResetCode);
      }
    } else {
      setErrorMessage(res.error || t.common.error);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!resetCode || !newPassword) {
      setErrorMessage('Please enter the reset code and new password.');
      return;
    }

    setIsSubmitting(true);
    const res = await resetPassword(resetCode, newPassword);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage(t.auth.passwordChanged);
      setTimeout(() => {
        handleTabChange('login');
      }, 1500);
    } else {
      setErrorMessage(res.error || t.common.error);
    }
  };

  const handleBootstrapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!bootstrapKey || !email) {
      setErrorMessage('Secret key and email are required.');
      return;
    }

    setIsSubmitting(true);
    const res = await bootstrapAdmin(bootstrapKey, email);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage('User promoted to Administrator successfully! You can now log in.');
      setTimeout(() => {
        handleTabChange('login');
      }, 1500);
    } else {
      setErrorMessage(res.error || 'Invalid bootstrap key or email.');
    }
  };

  // Demo credential autofills
  const fillAdmin = () => {
    setEmail('admin@aogimdublin.org');
    setPassword('adminAogim2026!');
    setErrorMessage(null);
  };

  const fillMember = () => {
    setEmail('lucas.silva@example.com');
    setPassword('member2026!');
    setErrorMessage(null);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="bg-[#0A192F] text-white p-6 pb-5 relative shrink-0">
            <button
              onClick={closeAuthModal}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1E3A8A] to-[#0A192F] border border-[#D4AF37]/50 flex items-center justify-center mb-3">
              <span className="text-[#D4AF37] font-bold text-lg">✝</span>
            </div>
            <h2 className="font-display font-bold text-xl text-white">
              {authModalTab === 'login' && t.auth.welcomeBack}
              {authModalTab === 'register' && t.auth.createYourAccount}
              {authModalTab === 'forgot' && t.auth.resetPasswordTitle}
              {authModalTab === 'bootstrap' && t.auth.adminBootstrapTitle}
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Assembly of God Ireland Ministry (AOGIM Dublin)
            </p>

            {/* Tabs for Login / Register */}
            {(authModalTab === 'login' || authModalTab === 'register') && (
              <div className="grid grid-cols-2 gap-1 p-1 bg-white/10 rounded-xl mt-4">
                <button
                  type="button"
                  onClick={() => handleTabChange('login')}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                    authModalTab === 'login'
                      ? 'bg-white text-[#0A192F] shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {t.auth.signIn}
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('register')}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                    authModalTab === 'register'
                      ? 'bg-white text-[#0A192F] shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {t.auth.signUp}
                </button>
              </div>
            )}
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-4">
            {/* Alerts */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* TAB: LOGIN */}
            {authModalTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t.auth.email}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.auth.emailPlaceholder}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F2648]/20 focus:border-[#0F2648]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      {t.auth.password}
                    </label>
                    <button
                      type="button"
                      onClick={() => handleTabChange('forgot')}
                      className="text-[11px] font-medium text-[#1E3A8A] hover:underline"
                    >
                      {t.auth.forgotPassword}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t.auth.passwordPlaceholder}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F2648]/20 focus:border-[#0F2648]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-[#0F2648] hover:bg-[#1E3A8A] text-white font-semibold text-xs transition-colors shadow-md shadow-[#0F2648]/10 disabled:opacity-50"
                >
                  {isSubmitting ? t.common.loading : t.auth.signIn}
                </button>

                {/* Demo quick access buttons for fast testing */}
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-500 mb-2">
                    {t.auth.adminQuickAccess}:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={fillAdmin}
                      className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-900 text-[11px] font-medium rounded-lg text-left"
                    >
                      👑 Admin Demo
                    </button>
                    <button
                      type="button"
                      onClick={fillMember}
                      className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 text-[11px] font-medium rounded-lg text-left"
                    >
                      👤 Member Demo
                    </button>
                  </div>
                </div>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => handleTabChange('bootstrap')}
                    className="text-[11px] text-slate-400 hover:text-slate-700 flex items-center justify-center gap-1 mx-auto"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{t.auth.adminBootstrapTitle}</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB: REGISTER */}
            {authModalTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.auth.fullName} *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t.auth.fullNamePlaceholder}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F2648]/20 focus:border-[#0F2648]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.auth.email} *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.auth.emailPlaceholder}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F2648]/20 focus:border-[#0F2648]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.auth.countryOfOrigin} *
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={countryOfOrigin}
                      onChange={(e) => setCountryOfOrigin(e.target.value)}
                      placeholder="e.g. Ireland, Brazil, Portugal, Nigeria, Romania..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F2648]/20 focus:border-[#0F2648]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.auth.password} *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t.auth.passwordPlaceholder}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F2648]/20 focus:border-[#0F2648]"
                    />
                  </div>
                </div>

                {/* Terms notice */}
                <p className="text-[11px] text-slate-500 leading-tight">
                  {t.auth.termsNotice}{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTerms('terms')}
                    className="text-[#1E3A8A] font-medium underline"
                  >
                    {t.auth.termsOfUse}
                  </button>{' '}
                  {t.auth.and}{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTerms('privacy')}
                    className="text-[#1E3A8A] font-medium underline"
                  >
                    {t.auth.privacyPolicy}
                  </button>
                  .
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-[#0F2648] hover:bg-[#1E3A8A] text-white font-semibold text-xs transition-colors shadow-md shadow-[#0F2648]/10 disabled:opacity-50"
                >
                  {isSubmitting ? t.common.loading : t.auth.signUp}
                </button>
              </form>
            )}

            {/* TAB: FORGOT PASSWORD */}
            {authModalTab === 'forgot' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-600">
                  {t.auth.resetPasswordDesc}
                </p>

                {!generatedResetCode ? (
                  <form onSubmit={handleForgotSubmit} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t.auth.email}
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t.auth.emailPlaceholder}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F2648]/20"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 rounded-xl bg-[#0F2648] hover:bg-[#1E3A8A] text-white font-semibold text-xs transition-colors"
                    >
                      {isSubmitting ? t.common.loading : t.auth.sendResetCode}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                      <strong>Code generated:</strong> {generatedResetCode}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t.auth.resetToken}
                      </label>
                      <input
                        type="text"
                        required
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        placeholder="6-digit code"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t.auth.enterNewPassword}
                      </label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={t.auth.passwordPlaceholder}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 rounded-xl bg-[#0F2648] hover:bg-[#1E3A8A] text-white font-semibold text-xs transition-colors"
                    >
                      {isSubmitting ? t.common.loading : t.auth.submitNewPassword}
                    </button>
                  </form>
                )}

                <button
                  type="button"
                  onClick={() => handleTabChange('login')}
                  className="w-full text-center text-xs text-[#1E3A8A] font-semibold hover:underline"
                >
                  ← {t.common.back} {t.auth.signIn}
                </button>
              </div>
            )}

            {/* TAB: BOOTSTRAP FIRST ADMIN */}
            {authModalTab === 'bootstrap' && (
              <form onSubmit={handleBootstrapSubmit} className="space-y-3.5">
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t.auth.adminBootstrapDesc}
                </p>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500">
                  Default church setup key: <code className="font-mono font-bold text-slate-800">AOGIM2026ADMIN</code>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.auth.email}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Registered member email to promote"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.auth.adminSecretKey}
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={bootstrapKey}
                      onChange={(e) => setBootstrapKey(e.target.value)}
                      placeholder="Enter church bootstrap key"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-[#D4AF37] hover:bg-[#c59b27] text-[#0A192F] font-bold text-xs transition-colors"
                >
                  {isSubmitting ? t.common.loading : t.auth.bootstrapAdminBtn}
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('login')}
                  className="w-full text-center text-xs text-[#1E3A8A] font-semibold hover:underline"
                >
                  ← {t.common.back} {t.auth.signIn}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Terms & Privacy Modal */}
      <TermsModal
        isOpen={!!activeTerms}
        onClose={() => setActiveTerms(null)}
        type={activeTerms || 'terms'}
      />
    </>
  );
};
