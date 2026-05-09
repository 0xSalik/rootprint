/* -------------------------------------------------------------------------
 * Hunarmand — Sanad Provenance Page i18n.
 *
 * The Sanad page must work with NO JavaScript. Locale switching is
 * therefore done by separate pre-rendered routes, not a client widget.
 * This module holds the dictionary for every UI string on the page,
 * across the six languages the brief calls for:
 *
 *   en — English (default)
 *   hi — Hindi (Devanagari)
 *   ur — Urdu (Nastaliq, RTL)
 *   ja — Japanese
 *   fr — French
 *   de — German
 *
 * Translations are deliberately concise and dignified — this is a
 * verification certificate, not marketing copy.
 * ----------------------------------------------------------------------- */

export const SANAD_LOCALES = ["en", "hi", "ur", "ja", "fr", "de"] as const;
export type SanadLocale = (typeof SANAD_LOCALES)[number];

export const DEFAULT_LOCALE: SanadLocale = "en";

export interface LocaleMeta {
  code: SanadLocale;
  /** Native-script label (rendered in the language switcher). */
  native: string;
  /** Latin-script label (used as the accessible name + tooltip). */
  english: string;
  /** Reading direction. */
  dir: "ltr" | "rtl";
  /** Suggested font-family token for rendered body text. */
  font: "body" | "nastaliq" | "cjk";
}

export const LOCALE_META: Record<SanadLocale, LocaleMeta> = {
  en: { code: "en", native: "EN",       english: "English",  dir: "ltr", font: "body" },
  hi: { code: "hi", native: "हिन्दी",    english: "Hindi",    dir: "ltr", font: "body" },
  ur: { code: "ur", native: "اردو",     english: "Urdu",     dir: "rtl", font: "nastaliq" },
  ja: { code: "ja", native: "日本語",    english: "Japanese", dir: "ltr", font: "cjk" },
  fr: { code: "fr", native: "Français", english: "French",   dir: "ltr", font: "body" },
  de: { code: "de", native: "Deutsch",  english: "German",   dir: "ltr", font: "body" },
};

export interface SanadDict {
  /* Verification banner */
  verifiedTitle: string;
  verifiedBody: string;
  notFoundTitle: string;
  notFoundBody: string;

  /* Piece identity */
  piece: string;
  craft: string;
  technique: string;
  signed: string;
  completed: string;
  pieceId: string;

  /* Artisan block */
  master: string;
  generation: string;
  generationOrdinal: (n: number) => string;
  seeFullProfile: string;
  vaultClipTitle: string;
  vaultClipBody: string;

  /* Provenance chain */
  provenanceChainTitle: string;
  provenanceChainBlurb: string;
  step: string;
  stepMaterial: string;
  stepMaterialBlurb: string;
  stepTechnique: string;
  stepTechniqueBlurb: string;
  stepCompleted: string;
  stepSigned: string;
  stepSignedBlurb: string;
  stepSignature: string;
  stepSignatureBlurb: string;
  vaultRef: string;
  viewSignature: string;
  hideSignature: string;
  publicKey: string;
  signature: string;

  /* Fair price band */
  fairPriceTitle: string;
  fairPriceBlurb: (from: string, to: string) => string;
  fairPriceLow: string;
  fairPriceHigh: string;

  /* Footer / chrome */
  language: string;
  scanToVerify: string;
  poweredBy: string;
  termsAndPrivacy: string;
  back: string;
  status: string;
  rarity: string;
  notFoundHint: string;
  rarities: { rare: string; endangered: string; common: string };
  statuses: {
    "with buyer": string;
    "in transit": string;
    "in workshop": string;
    "in bazaar": string;
  };
}

/* ============================ ENGLISH ================================ */

const en: SanadDict = {
  verifiedTitle: "Hunarmand Sanad — Verified",
  verifiedBody: "This piece is authentic.",
  notFoundTitle: "No Sanad found for this piece.",
  notFoundBody: "Do not proceed without verification. Contact the seller.",

  piece: "Piece",
  craft: "Craft",
  technique: "Technique",
  signed: "Signed",
  completed: "Completed",
  pieceId: "Piece ID",

  master: "The Master",
  generation: "Generation",
  generationOrdinal: (n) => ordinalEn(n),
  seeFullProfile: "See full profile",
  vaultClipTitle: "Vault clip · Technique walkthrough",
  vaultClipBody: "30-second excerpt from the master's Vault session, demonstrating the exact technique used on this piece.",

  provenanceChainTitle: "Provenance chain",
  provenanceChainBlurb: "Every step from the raw material to your hands is recorded on Hunarmand's ledger.",
  step: "Step",
  stepMaterial: "Material origin",
  stepMaterialBlurb: "Where the raw material was sourced.",
  stepTechnique: "Technique applied",
  stepTechniqueBlurb: "The captured technique used to make this piece.",
  stepCompleted: "Date of completion",
  stepSigned: "Date of signing",
  stepSignedBlurb: "The day the master cryptographically signed the piece.",
  stepSignature: "Cryptographic signature",
  stepSignatureBlurb: "An Ed25519 signature linking this piece to the master's published key.",
  vaultRef: "Vault session",
  viewSignature: "View full signature",
  hideSignature: "Hide signature",
  publicKey: "Public key (Ed25519)",
  signature: "Signature",

  fairPriceTitle: "Fair price band",
  fairPriceBlurb: (from, to) =>
    `Pieces of this type and technique are valued by verified Hunarmand masters between ${from} and ${to}.`,
  fairPriceLow: "Low end",
  fairPriceHigh: "High end",

  language: "Language",
  scanToVerify: "Scanned from a Hunarmand QR code",
  poweredBy: "Hunarmand · the tacit knowledge OS",
  termsAndPrivacy: "Terms · Privacy · How verification works",
  back: "Back to artisan",
  status: "Status",
  rarity: "Rarity",
  notFoundHint: "If you scanned a QR from a real piece, take a clear photo of the tag and contact us.",
  rarities: { rare: "Rare", endangered: "Endangered", common: "Common" },
  statuses: {
    "with buyer": "With buyer",
    "in transit": "In transit",
    "in workshop": "In workshop",
    "in bazaar": "In bazaar",
  },
};

/* ============================ HINDI ================================== */

const hi: SanadDict = {
  verifiedTitle: "हुनरमंद सनद — प्रमाणित",
  verifiedBody: "यह कृति प्रामाणिक है।",
  notFoundTitle: "इस कृति के लिए कोई सनद नहीं मिली।",
  notFoundBody: "बिना सत्यापन के आगे न बढ़ें। विक्रेता से संपर्क करें।",

  piece: "कृति",
  craft: "शिल्प",
  technique: "तकनीक",
  signed: "हस्ताक्षरित",
  completed: "पूर्ण",
  pieceId: "कृति आईडी",

  master: "उस्ताद",
  generation: "पीढ़ी",
  generationOrdinal: (n) => `${n}वीं`,
  seeFullProfile: "पूरी प्रोफ़ाइल देखें",
  vaultClipTitle: "वॉल्ट क्लिप · तकनीक प्रदर्शन",
  vaultClipBody: "उस्ताद के वॉल्ट सत्र से 30-सेकंड का अंश, इस कृति में प्रयुक्त तकनीक दिखाते हुए।",

  provenanceChainTitle: "उत्पत्ति श्रृंखला",
  provenanceChainBlurb: "कच्चे माल से आपके हाथों तक — हर चरण हुनरमंद के बही में दर्ज है।",
  step: "चरण",
  stepMaterial: "सामग्री का स्रोत",
  stepMaterialBlurb: "कच्चा माल कहाँ से प्राप्त हुआ।",
  stepTechnique: "लागू तकनीक",
  stepTechniqueBlurb: "इस कृति को बनाने में प्रयुक्त सिद्ध तकनीक।",
  stepCompleted: "पूर्ण होने की तिथि",
  stepSigned: "हस्ताक्षर की तिथि",
  stepSignedBlurb: "जिस दिन उस्ताद ने कृति पर क्रिप्टोग्राफ़िक हस्ताक्षर किए।",
  stepSignature: "क्रिप्टोग्राफ़िक हस्ताक्षर",
  stepSignatureBlurb: "Ed25519 हस्ताक्षर जो इस कृति को उस्ताद की प्रकाशित कुंजी से जोड़ता है।",
  vaultRef: "वॉल्ट सत्र",
  viewSignature: "पूरा हस्ताक्षर देखें",
  hideSignature: "हस्ताक्षर छिपाएँ",
  publicKey: "सार्वजनिक कुंजी (Ed25519)",
  signature: "हस्ताक्षर",

  fairPriceTitle: "उचित मूल्य पट्टी",
  fairPriceBlurb: (from, to) =>
    `इस प्रकार और तकनीक की कृतियाँ हुनरमंद के सत्यापित उस्तादों द्वारा ${from} से ${to} के बीच आँकी जाती हैं।`,
  fairPriceLow: "न्यूनतम",
  fairPriceHigh: "अधिकतम",

  language: "भाषा",
  scanToVerify: "हुनरमंद QR कोड से स्कैन किया गया",
  poweredBy: "हुनरमंद · तकनीक की अनकही बही",
  termsAndPrivacy: "शर्तें · गोपनीयता · सत्यापन कैसे काम करता है",
  back: "उस्ताद की प्रोफ़ाइल पर लौटें",
  status: "स्थिति",
  rarity: "दुर्लभता",
  notFoundHint: "यदि आपने किसी असली कृति से QR स्कैन किया है, तो टैग की स्पष्ट तस्वीर लें और हमसे संपर्क करें।",
  rarities: { rare: "दुर्लभ", endangered: "लुप्तप्राय", common: "सामान्य" },
  statuses: {
    "with buyer": "खरीदार के पास",
    "in transit": "रास्ते में",
    "in workshop": "कार्यशाला में",
    "in bazaar": "बाज़ार में",
  },
};

/* ============================ URDU =================================== */

const ur: SanadDict = {
  verifiedTitle: "ہنرمند سند — تصدیق شدہ",
  verifiedBody: "یہ پارچہ اصلی ہے۔",
  notFoundTitle: "اس پارچے کے لیے کوئی سند نہیں ملی۔",
  notFoundBody: "تصدیق کے بغیر آگے نہ بڑھیں۔ بیچنے والے سے رابطہ کریں۔",

  piece: "پارچہ",
  craft: "کاریگری",
  technique: "تکنیک",
  signed: "دستخط شدہ",
  completed: "مکمل",
  pieceId: "پارچہ شناخت",

  master: "استاد",
  generation: "نسل",
  generationOrdinal: (n) => `${n}ویں`,
  seeFullProfile: "مکمل پروفائل دیکھیں",
  vaultClipTitle: "والٹ کلپ · تکنیک کی نمائش",
  vaultClipBody: "استاد کے والٹ سیشن سے ۳۰-سیکنڈ کا اقتباس، اس پارچے میں استعمال شدہ تکنیک کی وضاحت کرتا ہوا۔",

  provenanceChainTitle: "اصل کا سلسلہ",
  provenanceChainBlurb: "خام مال سے آپ کے ہاتھ تک — ہر مرحلہ ہنرمند کے رجسٹر میں درج ہے۔",
  step: "مرحلہ",
  stepMaterial: "خام مال کا منبع",
  stepMaterialBlurb: "خام مال کہاں سے حاصل کیا گیا۔",
  stepTechnique: "استعمال شدہ تکنیک",
  stepTechniqueBlurb: "اس پارچے کو بنانے میں استعمال ہونے والی محفوظ تکنیک۔",
  stepCompleted: "تکمیل کی تاریخ",
  stepSigned: "دستخط کی تاریخ",
  stepSignedBlurb: "جس دن استاد نے پارچے پر خفیہ نگاری دستخط ثبت کیے۔",
  stepSignature: "خفیہ نگاری دستخط",
  stepSignatureBlurb: "Ed25519 دستخط جو اس پارچے کو استاد کی شائع شدہ کلید سے جوڑتا ہے۔",
  vaultRef: "والٹ سیشن",
  viewSignature: "مکمل دستخط دیکھیں",
  hideSignature: "دستخط چھپائیں",
  publicKey: "عوامی کلید (Ed25519)",
  signature: "دستخط",

  fairPriceTitle: "منصفانہ قیمت کا دائرہ",
  fairPriceBlurb: (from, to) =>
    `اس قسم اور تکنیک کے پارچوں کی تصدیق شدہ قیمت ${from} سے ${to} کے درمیان ہے۔`,
  fairPriceLow: "کم سے کم",
  fairPriceHigh: "زیادہ سے زیادہ",

  language: "زبان",
  scanToVerify: "ہنرمند QR کوڈ سے اسکین کیا گیا",
  poweredBy: "ہنرمند · کاریگری کا غیر تحریری نظام",
  termsAndPrivacy: "شرائط · رازداری · تصدیق کیسے کام کرتی ہے",
  back: "استاد کی پروفائل پر واپس",
  status: "حالت",
  rarity: "نادری",
  notFoundHint: "اگر آپ نے کسی اصلی پارچے سے QR اسکین کیا ہے تو ٹیگ کی واضح تصویر لیں اور ہم سے رابطہ کریں۔",
  rarities: { rare: "نایاب", endangered: "خطرے میں", common: "عام" },
  statuses: {
    "with buyer": "خریدار کے پاس",
    "in transit": "راستے میں",
    "in workshop": "کاریگاہ میں",
    "in bazaar": "بازار میں",
  },
};

/* ============================ JAPANESE =============================== */

const ja: SanadDict = {
  verifiedTitle: "Hunarmand サナド — 認証済み",
  verifiedBody: "この作品は本物です。",
  notFoundTitle: "この作品のサナドは見つかりませんでした。",
  notFoundBody: "認証なしでお買い求めにならないでください。販売者にお問い合わせください。",

  piece: "作品",
  craft: "工芸",
  technique: "技法",
  signed: "署名日",
  completed: "完成日",
  pieceId: "作品ID",

  master: "親方",
  generation: "代",
  generationOrdinal: (n) => `第${n}`,
  seeFullProfile: "プロフィール全体を見る",
  vaultClipTitle: "Vault クリップ · 技法の説明",
  vaultClipBody: "親方の Vault セッションからの30秒の抜粋。この作品で用いた技法を実演しています。",

  provenanceChainTitle: "来歴の連鎖",
  provenanceChainBlurb: "原料からあなたの手元まで、すべての工程は Hunarmand の台帳に記録されています。",
  step: "工程",
  stepMaterial: "原材料の出処",
  stepMaterialBlurb: "原材料の調達元。",
  stepTechnique: "適用された技法",
  stepTechniqueBlurb: "この作品を仕上げるために用いた、記録された技法。",
  stepCompleted: "完成日",
  stepSigned: "署名日",
  stepSignedBlurb: "親方が暗号署名を行った日。",
  stepSignature: "暗号署名",
  stepSignatureBlurb: "この作品と親方の公開鍵を結ぶ Ed25519 署名。",
  vaultRef: "Vault セッション",
  viewSignature: "署名全体を表示",
  hideSignature: "署名を隠す",
  publicKey: "公開鍵 (Ed25519)",
  signature: "署名",

  fairPriceTitle: "適正価格帯",
  fairPriceBlurb: (from, to) =>
    `この種類・技法の作品は、Hunarmand 認定親方により ${from} から ${to} の範囲で評価されています。`,
  fairPriceLow: "下限",
  fairPriceHigh: "上限",

  language: "言語",
  scanToVerify: "Hunarmand の QR コードから読み取られました",
  poweredBy: "Hunarmand · 暗黙知の OS",
  termsAndPrivacy: "規約 · プライバシー · 認証の仕組み",
  back: "職人プロフィールに戻る",
  status: "状態",
  rarity: "希少度",
  notFoundHint: "実物の作品から QR を読み取った場合は、タグの鮮明な写真を撮ってお問い合わせください。",
  rarities: { rare: "希少", endangered: "絶滅危惧", common: "一般" },
  statuses: {
    "with buyer": "購入者所持",
    "in transit": "輸送中",
    "in workshop": "工房内",
    "in bazaar": "市場出品中",
  },
};

/* ============================ FRENCH ================================= */

const fr: SanadDict = {
  verifiedTitle: "Hunarmand Sanad — Vérifié",
  verifiedBody: "Cette pièce est authentique.",
  notFoundTitle: "Aucun Sanad trouvé pour cette pièce.",
  notFoundBody: "Ne procédez pas sans vérification. Contactez le vendeur.",

  piece: "Pièce",
  craft: "Métier",
  technique: "Technique",
  signed: "Signée le",
  completed: "Achevée le",
  pieceId: "Identifiant",

  master: "Le maître",
  generation: "Génération",
  generationOrdinal: (n) => (n === 1 ? "1ère" : `${n}ᵉ`),
  seeFullProfile: "Voir le profil complet",
  vaultClipTitle: "Extrait Vault · Démonstration de la technique",
  vaultClipBody: "Extrait de 30 secondes de la session Vault du maître, montrant la technique exacte utilisée sur cette pièce.",

  provenanceChainTitle: "Chaîne de provenance",
  provenanceChainBlurb: "De la matière première jusqu'à vos mains, chaque étape est consignée dans le registre Hunarmand.",
  step: "Étape",
  stepMaterial: "Origine du matériau",
  stepMaterialBlurb: "Provenance de la matière première.",
  stepTechnique: "Technique appliquée",
  stepTechniqueBlurb: "La technique enregistrée utilisée pour réaliser cette pièce.",
  stepCompleted: "Date d'achèvement",
  stepSigned: "Date de signature",
  stepSignedBlurb: "Le jour où le maître a signé la pièce cryptographiquement.",
  stepSignature: "Signature cryptographique",
  stepSignatureBlurb: "Une signature Ed25519 qui relie cette pièce à la clé publique du maître.",
  vaultRef: "Session Vault",
  viewSignature: "Voir la signature complète",
  hideSignature: "Masquer la signature",
  publicKey: "Clé publique (Ed25519)",
  signature: "Signature",

  fairPriceTitle: "Fourchette de prix équitable",
  fairPriceBlurb: (from, to) =>
    `Les pièces de ce type et de cette technique sont évaluées par les maîtres certifiés Hunarmand entre ${from} et ${to}.`,
  fairPriceLow: "Bas",
  fairPriceHigh: "Haut",

  language: "Langue",
  scanToVerify: "Scanné depuis un code QR Hunarmand",
  poweredBy: "Hunarmand · l'OS du savoir tacite",
  termsAndPrivacy: "Conditions · Confidentialité · Comment la vérification fonctionne",
  back: "Retour au profil de l'artisan",
  status: "Statut",
  rarity: "Rareté",
  notFoundHint: "Si vous avez scanné un code QR depuis une pièce réelle, prenez une photo nette de l'étiquette et contactez-nous.",
  rarities: { rare: "Rare", endangered: "Menacée", common: "Courante" },
  statuses: {
    "with buyer": "Chez l'acheteur",
    "in transit": "En transit",
    "in workshop": "À l'atelier",
    "in bazaar": "Au bazar",
  },
};

/* ============================ GERMAN ================================= */

const de: SanadDict = {
  verifiedTitle: "Hunarmand Sanad — Verifiziert",
  verifiedBody: "Dieses Stück ist echt.",
  notFoundTitle: "Für dieses Stück wurde kein Sanad gefunden.",
  notFoundBody: "Ohne Verifizierung nicht fortfahren. Kontaktieren Sie den Verkäufer.",

  piece: "Stück",
  craft: "Handwerk",
  technique: "Technik",
  signed: "Signiert am",
  completed: "Fertiggestellt am",
  pieceId: "Stück-ID",

  master: "Der Meister",
  generation: "Generation",
  generationOrdinal: (n) => `${n}.`,
  seeFullProfile: "Vollständiges Profil ansehen",
  vaultClipTitle: "Vault-Clip · Techniksvorführung",
  vaultClipBody: "30-Sekunden-Auszug aus der Vault-Sitzung des Meisters, der die genaue Technik dieses Stücks zeigt.",

  provenanceChainTitle: "Provenienzkette",
  provenanceChainBlurb: "Vom Rohmaterial bis in Ihre Hände — jeder Schritt ist im Hunarmand-Register vermerkt.",
  step: "Schritt",
  stepMaterial: "Materialherkunft",
  stepMaterialBlurb: "Wo das Rohmaterial bezogen wurde.",
  stepTechnique: "Angewandte Technik",
  stepTechniqueBlurb: "Die festgehaltene Technik, die für dieses Stück verwendet wurde.",
  stepCompleted: "Fertigstellungsdatum",
  stepSigned: "Signaturdatum",
  stepSignedBlurb: "Der Tag, an dem der Meister das Stück kryptografisch signiert hat.",
  stepSignature: "Kryptografische Signatur",
  stepSignatureBlurb: "Eine Ed25519-Signatur verbindet dieses Stück mit dem öffentlichen Schlüssel des Meisters.",
  vaultRef: "Vault-Sitzung",
  viewSignature: "Vollständige Signatur anzeigen",
  hideSignature: "Signatur ausblenden",
  publicKey: "Öffentlicher Schlüssel (Ed25519)",
  signature: "Signatur",

  fairPriceTitle: "Faires Preisband",
  fairPriceBlurb: (from, to) =>
    `Stücke dieser Art und Technik werden von verifizierten Hunarmand-Meistern zwischen ${from} und ${to} bewertet.`,
  fairPriceLow: "Untergrenze",
  fairPriceHigh: "Obergrenze",

  language: "Sprache",
  scanToVerify: "Von einem Hunarmand-QR-Code gescannt",
  poweredBy: "Hunarmand · das Betriebssystem des stillen Wissens",
  termsAndPrivacy: "Bedingungen · Datenschutz · So funktioniert die Verifizierung",
  back: "Zurück zum Künstlerprofil",
  status: "Status",
  rarity: "Seltenheit",
  notFoundHint: "Wenn Sie einen QR-Code von einem echten Stück gescannt haben, fotografieren Sie das Etikett deutlich und melden Sie sich bei uns.",
  rarities: { rare: "Selten", endangered: "Gefährdet", common: "Verbreitet" },
  statuses: {
    "with buyer": "Beim Käufer",
    "in transit": "Im Transit",
    "in workshop": "In der Werkstatt",
    "in bazaar": "Im Basar",
  },
};

/* ─────────────────────────── Registry ─────────────────────────────── */

export const SANAD_DICTS: Record<SanadLocale, SanadDict> = { en, hi, ur, ja, fr, de };

export function getSanadDict(locale: string | undefined): SanadDict {
  if (!locale || !(locale in SANAD_DICTS)) return SANAD_DICTS[DEFAULT_LOCALE];
  return SANAD_DICTS[locale as SanadLocale];
}

export function isSanadLocale(value: string | undefined): value is SanadLocale {
  return !!value && (SANAD_LOCALES as readonly string[]).includes(value);
}

/** Build the URL for a given locale of a given pieceId. The default
 *  locale lives at the unprefixed `/sanad/[pieceId]` so QR codes
 *  printed today never break. */
export function sanadHref(pieceId: string, locale: SanadLocale): string {
  if (locale === DEFAULT_LOCALE) return `/sanad/${pieceId}`;
  return `/sanad/${pieceId}/${locale}`;
}

/* ─────────────────────────── helpers ──────────────────────────────── */

function ordinalEn(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Format an ISO date using the locale's native conventions. */
export function formatDateLocale(iso: string, locale: SanadLocale): string {
  const d = new Date(iso);
  const tag =
    locale === "hi" ? "hi-IN"
    : locale === "ur" ? "ur-PK"
    : locale === "ja" ? "ja-JP"
    : locale === "fr" ? "fr-FR"
    : locale === "de" ? "de-DE"
    : "en-GB";
  try {
    return d.toLocaleDateString(tag, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
}

/** Format an INR price. Indian locales prefer the rupee symbol with
 *  Indian grouping; everywhere else we use international formatting. */
export function formatPriceLocale(n: number, locale: SanadLocale): string {
  if (locale === "hi" || locale === "ur") {
    return `₹ ${n.toLocaleString("en-IN")}`;
  }
  return `Rs. ${n.toLocaleString("en-IN")}`;
}
