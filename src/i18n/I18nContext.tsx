import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Language = 'en' | 'ta' | 'si';
const LANGUAGE_KEY = 'swd-language';

const messages = {
  en: {
    language: 'Language',
    phase_project: 'Project',
    phase_people: 'People & Use',
    phase_sources: 'Water Sources & Reuse',
    phase_storage: 'Storage, Pumping & Pipework',
    phase_review: 'Review & Report',
    not_started: 'Not started',
    in_progress: 'In progress',
    needs_attention: 'Needs attention',
    complete: 'Complete',
    load_sample: 'Load sample project',
    quick_tour: 'Quick tour',
    tour_intro: 'Start with project details, add people and water uses, then record sources, tanks and pipework. Review the issues before using a report.',
    next: 'Next',
    back: 'Back',
    preliminary: 'Preliminary design only — verify with a qualified engineer.',
  },
  ta: {
    language: 'மொழி',
    phase_project: 'திட்டம்',
    phase_people: 'மக்கள் மற்றும் பயன்பாடு',
    phase_sources: 'நீர் ஆதாரங்கள் மற்றும் மறுபயன்பாடு',
    phase_storage: 'சேமிப்பு, பம்புகள் மற்றும் குழாய்கள்',
    phase_review: 'மதிப்பாய்வு மற்றும் அறிக்கை',
    not_started: 'தொடங்கவில்லை',
    in_progress: 'நடைபெறுகிறது',
    needs_attention: 'கவனம் தேவை',
    complete: 'முடிந்தது',
    load_sample: 'மாதிரி திட்டத்தை ஏற்றவும்',
    quick_tour: 'விரைவு அறிமுகம்',
    tour_intro: 'திட்ட விவரங்களுடன் தொடங்கி, மக்கள் மற்றும் நீர் பயன்பாட்டைச் சேர்க்கவும். பின்னர் ஆதாரங்கள், தொட்டிகள், குழாய்களைப் பதிவு செய்து அறிக்கைக்கு முன் சிக்கல்களை மதிப்பாய்வு செய்யவும்.',
    next: 'அடுத்து',
    back: 'பின்',
    preliminary: 'முன்னோட்ட வடிவமைப்பு மட்டுமே — தகுதியான பொறியாளரால் சரிபார்க்கவும்.',
  },
  si: {
    language: 'භාෂාව',
    phase_project: 'ව්‍යාපෘතිය',
    phase_people: 'පුද්ගලයින් සහ භාවිතය',
    phase_sources: 'ජල මූලාශ්‍ර සහ නැවත භාවිතය',
    phase_storage: 'ගබඩා, පොම්ප සහ නළ පද්ධතිය',
    phase_review: 'සමාලෝචනය සහ වාර්තාව',
    not_started: 'ආරම්භ කර නැත',
    in_progress: 'සිදුවෙමින් පවතී',
    needs_attention: 'අවධානය අවශ්‍යයි',
    complete: 'සම්පූර්ණයි',
    load_sample: 'නියැදි ව්‍යාපෘතිය පූරණය කරන්න',
    quick_tour: 'කෙටි මාර්ගෝපදේශය',
    tour_intro: 'ව්‍යාපෘති විස්තරයෙන් ආරම්භ කර පුද්ගලයින් සහ ජල භාවිතය එක් කරන්න. ඉන්පසු මූලාශ්‍ර, ටැංකි සහ නළ සටහන් කර වාර්තාවට පෙර ගැටලු සමාලෝචනය කරන්න.',
    next: 'ඊළඟ',
    back: 'ආපසු',
    preliminary: 'මූලික සැලසුමක් පමණි — සුදුසුකම් ලත් ඉංජිනේරුවෙකුගෙන් තහවුරු කරන්න.',
  },
} as const;

type MessageKey = keyof typeof messages.en;
interface I18nValue { language: Language; setLanguage: (language: Language) => void; t: (key: MessageKey) => string; }
const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_KEY);
      return saved === 'ta' || saved === 'si' ? saved : 'en';
    } catch { return 'en'; }
  });
  const setLanguage = (next: Language) => {
    setLanguageState(next);
    try { localStorage.setItem(LANGUAGE_KEY, next); } catch { /* language remains active for this session */ }
  };
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  const value = useMemo<I18nValue>(() => ({ language, setLanguage, t: (key) => messages[language][key] ?? messages.en[key] }), [language]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
}
