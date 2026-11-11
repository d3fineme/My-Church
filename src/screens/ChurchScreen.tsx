import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  ExternalLink,
  Copy,
  Check,
  Navigation,
  MessageCircle,
  Video,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useChurchData } from '../context/ChurchDataContext';

export const ChurchScreen: React.FC = () => {
  const { t } = useLanguage();
  const { churchProfile } = useChurchData();
  const [copied, setCopied] = useState(false);

  if (!churchProfile) return null;

  const fullAddressString = `${churchProfile.address}, ${churchProfile.city}, ${churchProfile.postalCode}, ${churchProfile.country}`;

  const copyAddressToClipboard = () => {
    navigator.clipboard.writeText(fullAddressString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const openGoogleMapsDirections = () => {
    const encoded = encodeURIComponent(fullAddressString);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-20 max-w-3xl mx-auto">
      {/* Hero Header with Sanctuary Photo */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-200/80 shadow-md">
        <div className="h-48 sm:h-64 w-full relative">
          <img
            src="/src/assets/images/dublin_church_building_1794307703454.jpg"
            alt="AOGIM Dublin Sanctuary"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />

          {/* Logo overlay & Name */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#0A192F] border-2 border-[#D4AF37] shadow-xl flex items-center justify-center shrink-0 overflow-hidden">
              {churchProfile.logo ? (
                <img
                  src={churchProfile.logo}
                  alt={churchProfile.churchName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-[#D4AF37] font-bold text-2xl">✝</span>
              )}
            </div>
            <div>
              <span className="text-xs font-semibold text-[#D4AF37] tracking-wider uppercase block">
                {churchProfile.shortName}
              </span>
              <h1 className="font-display font-bold text-lg sm:text-xl text-white leading-tight">
                {churchProfile.churchName}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* About Description */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
        <h2 className="font-display font-bold text-base text-slate-900">
          {t.church.institutionalInfo}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
          {churchProfile.description}
        </p>
      </div>

      {/* Address & Location Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#0F2648]" />
            <h2 className="font-display font-bold text-base text-slate-900">
              {t.church.ourSanctuary}
            </h2>
          </div>
          <button
            onClick={copyAddressToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{t.common.copyAddress}</span>
              </>
            )}
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-800 space-y-1">
          <p className="font-bold text-[#0F2648]">{churchProfile.churchName}</p>
          <p>{churchProfile.address}</p>
          <p>
            {churchProfile.city}, {churchProfile.postalCode}
          </p>
          <p className="text-slate-500 font-medium">{churchProfile.country}</p>
        </div>

        {/* Static Map View Frame */}
        <div className="rounded-2xl overflow-hidden border border-slate-200 h-44 sm:h-52 w-full relative bg-slate-100">
          <iframe
            title="AOGIM Dublin Location Map"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src="https://maps.google.com/maps?q=Park+West+Enterprise+Centre+Nangor+Road+Dublin+12&t=&z=14&ie=UTF8&iwloc=&output=embed"
          />
        </div>

        <button
          onClick={openGoogleMapsDirections}
          className="w-full py-3.5 px-4 rounded-2xl bg-[#0F2648] hover:bg-[#1E3A8A] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-[#0F2648]/15"
        >
          <Navigation className="w-4 h-4 text-[#D4AF37]" />
          <span>{t.common.getDirections}</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* Direct Contact Cards */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="font-display font-bold text-base text-slate-900">
          {t.church.contactInfo}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href={`tel:${churchProfile.phone}`}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-400 block">Telephone</span>
              <span className="text-xs font-bold text-slate-800 truncate block">
                {churchProfile.phone}
              </span>
            </div>
          </a>

          <a
            href={`mailto:${churchProfile.email}`}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-400 block">Email</span>
              <span className="text-xs font-bold text-slate-800 truncate block">
                {churchProfile.email}
              </span>
            </div>
          </a>

          <a
            href={churchProfile.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-400 block">Website</span>
              <span className="text-xs font-bold text-slate-800 truncate block">
                {churchProfile.website.replace('https://', '')}
              </span>
            </div>
          </a>

          <a
            href={churchProfile.socialLinks.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-emerald-700 block">WhatsApp</span>
              <span className="text-xs font-bold text-emerald-900 truncate block">
                Message Church Pastoral Team
              </span>
            </div>
          </a>
        </div>
      </div>

      {/* Social Media Channels */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="font-display font-bold text-base text-slate-900">
          {t.church.socialChannels}
        </h2>

        <div className="grid grid-cols-3 gap-3">
          <a
            href={churchProfile.socialLinks.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-center transition-colors"
          >
            <span className="font-display font-bold text-xs">Instagram</span>
            <span className="text-[10px] text-rose-600 mt-0.5">@aogimdublin</span>
          </a>

          <a
            href={churchProfile.socialLinks.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-center transition-colors"
          >
            <span className="font-display font-bold text-xs">Facebook</span>
            <span className="text-[10px] text-blue-600 mt-0.5">aogimdublin</span>
          </a>

          <a
            href={churchProfile.socialLinks.youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-center transition-colors"
          >
            <Video className="w-4 h-4 mb-1 text-red-600" />
            <span className="font-display font-bold text-xs">YouTube</span>
          </a>
        </div>
      </div>
    </div>
  );
};
