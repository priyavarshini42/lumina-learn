import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type LanguageOption = { code: string; name: string; native: string };

/** All 22 scheduled Indian languages + English. */
export const LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ" },
  { code: "ur", name: "Urdu", native: "اردو" },
  { code: "as", name: "Assamese", native: "অসমীয়া" },
  { code: "kok", name: "Konkani", native: "कोंकणी" },
  { code: "mni", name: "Manipuri", native: "মৈতৈলোন্" },
  { code: "sa", name: "Sanskrit", native: "संस्कृतम्" },
  { code: "brx", name: "Bodo", native: "बड़ो" },
  { code: "doi", name: "Dogri", native: "डोगरी" },
  { code: "ks", name: "Kashmiri", native: "کٲشُر" },
  { code: "mai", name: "Maithili", native: "मैथिली" },
  { code: "ne", name: "Nepali", native: "नेपाली" },
  { code: "sat", name: "Santali", native: "ᱥᱟᱱᱛᱟᱲᱤ" },
  { code: "sd", name: "Sindhi", native: "سنڌي" },
];

export function languageName(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.name ?? "English";
}

export function languageNative(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.native ?? "English";
}

type Dict = Record<string, string>;

const en: Dict = {
  "nav.home": "Home",
  "nav.classroom": "AI Classroom",
  "nav.lens": "AI Lens",
  "nav.tutor": "Doubt Solver",
  "nav.dashboard": "Dashboard",
  "nav.exams": "Exams",
  "nav.skills": "Skills",
  "nav.wellness": "Wellness",
  "nav.stories": "Stories",
  "nav.parents": "Parents",
  "cta.signIn": "Sign In",
  "cta.profile": "Profile",
  "cta.signOut": "Sign Out",
  "auth.welcome": "Welcome back",
  "auth.signInTitle": "Sign in to Vidya AI",
  "auth.createTitle": "Create your student account",
  "auth.username": "Username",
  "auth.password": "Password",
  "auth.confirmPassword": "Confirm password",
  "auth.remember": "Remember me",
  "auth.forgot": "Forgot password?",
  "auth.createAccount": "Create Account",
  "auth.haveAccount": "Already have an account?",
  "auth.noAccount": "New to Vidya AI?",
  "auth.fullName": "Student full name",
  "auth.education": "Education",
  "auth.school": "School",
  "auth.intermediate": "Intermediate",
  "auth.grade": "Grade",
  "auth.year": "Year",
  "auth.stream": "Stream",
  "auth.language": "Preferred language",
  "auth.available": "Username available",
  "auth.taken": "Username already exists",
  "auth.checking": "Checking availability…",
  "auth.match": "Passwords match",
  "auth.noMatch": "Passwords do not match",
  "profile.title": "My Profile",
  "profile.changePassword": "Change Password",
  "profile.oldPassword": "Old password",
  "profile.newPassword": "New password",
  "profile.phone": "Phone number",
  "profile.save": "Save changes",
  "profile.saved": "Profile updated",
  "profile.created": "Account created",
  "profile.privacy": "Privacy",
  "common.loading": "Loading…",
  "common.cancel": "Cancel",
  "greeting.hello": "Hello",
  "greeting.welcomeBack": "Welcome back.",
  "greeting.learnTogether": "Let's learn together today.",
};

const hi: Dict = {
  "cta.signIn": "साइन इन करें",
  "cta.profile": "प्रोफ़ाइल",
  "cta.signOut": "साइन आउट",
  "auth.signInTitle": "विद्या AI में साइन इन करें",
  "auth.createTitle": "अपना छात्र खाता बनाएँ",
  "auth.username": "यूज़रनेम",
  "auth.password": "पासवर्ड",
  "auth.confirmPassword": "पासवर्ड की पुष्टि करें",
  "auth.remember": "मुझे याद रखें",
  "auth.forgot": "पासवर्ड भूल गए?",
  "auth.createAccount": "खाता बनाएँ",
  "auth.fullName": "छात्र का पूरा नाम",
  "auth.education": "शिक्षा",
  "auth.school": "स्कूल",
  "auth.intermediate": "इंटरमीडिएट",
  "auth.grade": "कक्षा",
  "auth.year": "वर्ष",
  "auth.stream": "स्ट्रीम",
  "auth.language": "पसंदीदा भाषा",
  "profile.title": "मेरी प्रोफ़ाइल",
  "greeting.hello": "नमस्ते",
  "greeting.welcomeBack": "वापसी पर स्वागत है।",
  "greeting.learnTogether": "आज मिलकर सीखें।",
};

const te: Dict = {
  "cta.signIn": "సైన్ ఇన్",
  "cta.profile": "ప్రొఫైల్",
  "cta.signOut": "సైన్ అవుట్",
  "auth.signInTitle": "విద్య AI లోకి సైన్ ఇన్ అవ్వండి",
  "auth.createTitle": "మీ విద్యార్థి ఖాతాను సృష్టించండి",
  "auth.username": "యూజర్‌నేమ్",
  "auth.password": "పాస్‌వర్డ్",
  "auth.confirmPassword": "పాస్‌వర్డ్ నిర్ధారించండి",
  "auth.remember": "నన్ను గుర్తుంచుకో",
  "auth.forgot": "పాస్‌వర్డ్ మర్చిపోయారా?",
  "auth.createAccount": "ఖాతా సృష్టించండి",
  "auth.fullName": "విద్యార్థి పూర్తి పేరు",
  "auth.education": "విద్య",
  "auth.school": "పాఠశాల",
  "auth.intermediate": "ఇంటర్మీడియట్",
  "auth.grade": "తరగతి",
  "auth.year": "సంవత్సరం",
  "auth.stream": "గ్రూప్",
  "auth.language": "ఇష్టమైన భాష",
  "profile.title": "నా ప్రొఫైల్",
  "greeting.hello": "నమస్తే",
  "greeting.welcomeBack": "తిరిగి స్వాగతం.",
  "greeting.learnTogether": "ఈరోజు కలిసి నేర్చుకుందాం.",
};

const ta: Dict = {
  "cta.signIn": "உள்நுழை",
  "cta.profile": "சுயவிவரம்",
  "cta.signOut": "வெளியேறு",
  "auth.signInTitle": "வித்யா AI-இல் உள்நுழையுங்கள்",
  "auth.createTitle": "உங்கள் மாணவர் கணக்கை உருவாக்குங்கள்",
  "auth.username": "பயனர்பெயர்",
  "auth.password": "கடவுச்சொல்",
  "auth.confirmPassword": "கடவுச்சொல்லை உறுதிப்படுத்துங்கள்",
  "auth.createAccount": "கணக்கை உருவாக்கு",
  "auth.fullName": "மாணவர் முழுப் பெயர்",
  "auth.education": "கல்வி",
  "auth.school": "பள்ளி",
  "auth.grade": "வகுப்பு",
  "auth.language": "விருப்ப மொழி",
  "profile.title": "என் சுயவிவரம்",
  "greeting.hello": "வணக்கம்",
  "greeting.welcomeBack": "மீண்டும் வருக.",
  "greeting.learnTogether": "இன்று ஒன்றாகக் கற்போம்.",
};

const kn: Dict = {
  "cta.signIn": "ಸೈನ್ ಇನ್",
  "cta.profile": "ಪ್ರೊಫೈಲ್",
  "cta.signOut": "ಸೈನ್ ಔಟ್",
  "auth.signInTitle": "ವಿದ್ಯಾ AI ಗೆ ಸೈನ್ ಇನ್ ಆಗಿ",
  "auth.createTitle": "ನಿಮ್ಮ ವಿದ್ಯಾರ್ಥಿ ಖಾತೆ ರಚಿಸಿ",
  "auth.username": "ಬಳಕೆದಾರ ಹೆಸರು",
  "auth.password": "ಪಾಸ್‌ವರ್ಡ್",
  "auth.createAccount": "ಖಾತೆ ರಚಿಸಿ",
  "auth.fullName": "ವಿದ್ಯಾರ್ಥಿಯ ಪೂರ್ಣ ಹೆಸರು",
  "auth.education": "ಶಿಕ್ಷಣ",
  "auth.school": "ಶಾಲೆ",
  "auth.grade": "ತರಗತಿ",
  "auth.language": "ಆದ್ಯತೆಯ ಭಾಷೆ",
  "profile.title": "ನನ್ನ ಪ್ರೊಫೈಲ್",
  "greeting.hello": "ನಮಸ್ಕಾರ",
  "greeting.welcomeBack": "ಮತ್ತೆ ಸ್ವಾಗತ.",
  "greeting.learnTogether": "ಇಂದು ಒಟ್ಟಿಗೆ ಕಲಿಯೋಣ.",
};

const ml: Dict = {
  "cta.signIn": "സൈൻ ഇൻ",
  "cta.profile": "പ്രൊഫൈൽ",
  "auth.username": "യൂസർനെയിം",
  "auth.password": "പാസ്‌വേഡ്",
  "auth.createAccount": "അക്കൗണ്ട് ഉണ്ടാക്കുക",
  "greeting.hello": "നമസ്കാരം",
  "greeting.learnTogether": "ഇന്ന് ഒരുമിച്ച് പഠിക്കാം.",
};

const bn: Dict = {
  "cta.signIn": "সাইন ইন",
  "cta.profile": "প্রোফাইল",
  "auth.username": "ইউজারনেম",
  "auth.password": "পাসওয়ার্ড",
  "auth.createAccount": "অ্যাকাউন্ট তৈরি করুন",
  "greeting.hello": "নমস্কার",
  "greeting.learnTogether": "চলো আজ একসাথে শিখি।",
};

const mr: Dict = {
  "cta.signIn": "साइन इन",
  "cta.profile": "प्रोफाइल",
  "auth.username": "युजरनेम",
  "auth.password": "पासवर्ड",
  "auth.createAccount": "खाते तयार करा",
  "greeting.hello": "नमस्कार",
  "greeting.learnTogether": "आज एकत्र शिकूया.",
};

const DICTS: Record<string, Dict> = { en, hi, te, ta, kn, ml, bn, mr };

const STORAGE_KEY = "vidya.language";

type LanguageContextValue = {
  language: string;
  setLanguage: (code: string) => void;
  t: (key: keyof typeof en | string) => string;
  languages: LanguageOption[];
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState("en");

  // Read the stored choice after hydration to avoid SSR mismatches.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && LANGUAGES.some((l) => l.code === stored)) setLanguageState(stored);
  }, []);

  const setLanguage = useCallback((code: string) => {
    setLanguageState(code);
    window.localStorage.setItem(STORAGE_KEY, code);
  }, []);

  const t = useCallback(
    (key: string) => DICTS[language]?.[key] ?? en[key] ?? key,
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t, languages: LANGUAGES }),
    [language, setLanguage, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}
