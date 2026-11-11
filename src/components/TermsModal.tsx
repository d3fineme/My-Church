import React from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy';
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose, type }) => {
  const { language, t } = useLanguage();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#0F2648]" />
            <h3 className="font-display font-bold text-base text-slate-900">
              {type === 'terms' ? t.auth.termsOfUse : t.auth.privacyPolicy}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto text-sm text-slate-600 leading-relaxed space-y-4">
          {type === 'terms' ? (
            language === 'en' ? (
              <>
                <p>
                  <strong>Assembly of God Ireland Ministry (AOGIM Dublin)</strong> welcomes you to our official mobile application. By accessing or registering on our platform, you agree to these Terms of Use.
                </p>
                <h4 className="font-semibold text-slate-800">1. Community Conduct</h4>
                <p>
                  Our digital platform exists to facilitate spiritual edification, event registration, and fellowship among church members and visitors. Users must act respectfully and honestly in all communications.
                </p>
                <h4 className="font-semibold text-slate-800">2. Event Attendance & Registrations</h4>
                <p>
                  Confirming attendance for events reserves limited physical capacity in our sanctuary or venues. If you are unable to attend an event you registered for, please cancel your registration in advance so others may participate.
                </p>
                <h4 className="font-semibold text-slate-800">3. Account Integrity</h4>
                <p>
                  You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate registration details (name, email, and country of origin).
                </p>
                <h4 className="font-semibold text-slate-800">4. Modifications</h4>
                <p>
                  AOGIM Dublin reserves the right to update these terms to reflect church community guidelines and regulatory requirements in Ireland.
                </p>
              </>
            ) : (
              <>
                <p>
                  A <strong>Assembly of God Ireland Ministry (AOGIM Dublin)</strong> dá as boas-vindas ao nosso aplicativo oficial. Ao acessar ou se cadastrar na plataforma, você concorda com estes Termos de Uso.
                </p>
                <h4 className="font-semibold text-slate-800">1. Conduta Comunitária</h4>
                <p>
                  Nossa plataforma digital tem o propósito de facilitar a edificação espiritual, a confirmação de presença em eventos e a comunhão entre membros e visitantes da igreja em Dublin.
                </p>
                <h4 className="font-semibold text-slate-800">2. Inscrições e Participação em Eventos</h4>
                <p>
                  A confirmação de presença reserva vagas com capacidade limitada em nosso templo e auditórios. Caso não possa comparecer, solicitamos o cancelamento da inscrição previamente para liberar a vaga para outro irmão.
                </p>
                <h4 className="font-semibold text-slate-800">3. Segurança da Conta</h4>
                <p>
                  Você é responsável pela confidencialidade de sua senha. Todos os dados cadastrais (nome, e-mail e país de origem) devem ser verídicos.
                </p>
              </>
            )
          ) : language === 'en' ? (
            <>
              <p>
                Your privacy is paramount to <strong>AOGIM Dublin</strong>. This Privacy Policy details how your personal data is collected, stored, and protected in accordance with Irish and European GDPR regulations.
              </p>
              <h4 className="font-semibold text-slate-800">1. Data We Collect</h4>
              <p>
                We collect your full name, email address, country of origin, and optional profile photo to manage membership communications and event attendance.
              </p>
              <h4 className="font-semibold text-slate-800">2. How We Use Data</h4>
              <p>
                Your information is used strictly for church pastoral care, event seating management, and official ministry notices. We never sell, lease, or share personal data with commercial third parties.
              </p>
              <h4 className="font-semibold text-slate-800">3. Your Rights</h4>
              <p>
                You may review, update, or request the deletion of your account and registration history at any time through your Profile tab or by contacting administration.
              </p>
            </>
          ) : (
            <>
              <p>
                Sua privacidade é fundamental para a <strong>AOGIM Dublin</strong>. Esta Política de Privacidade descreve como seus dados pessoais são coletados, tratados e protegidos, em conformidade com as normas do GDPR na Irlanda e União Europeia.
              </p>
              <h4 className="font-semibold text-slate-800">1. Dados Coletados</h4>
              <p>
                Coletamos seu nome completo, e-mail, país de origem e foto de perfil opcional para gerenciamento de membros e controle de presenças em eventos.
              </p>
              <h4 className="font-semibold text-slate-800">2. Finalidade dos Dados</h4>
              <p>
                Suas informações são utilizadas estritamente para o cuidado pastoral, avisos institucionais e gestão de cultos e conferências. Seus dados nunca são comercializados com terceiros.
              </p>
              <h4 className="font-semibold text-slate-800">3. Seus Direitos</h4>
              <p>
                Você pode atualizar suas informações ou solicitar a exclusão de sua conta a qualquer momento diretamente na aba Meu Perfil.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#0F2648] text-white font-medium text-xs hover:bg-[#1E3A8A] transition-colors"
          >
            {t.common.close}
          </button>
        </div>
      </div>
    </div>
  );
};
