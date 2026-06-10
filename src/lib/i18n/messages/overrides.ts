import type { Messages } from "@/lib/i18n/messages/en";
import { deepMerge, type MessagePatch } from "@/lib/i18n/utils";
import en from "@/lib/i18n/messages/en";
import type { LocaleCode } from "@/lib/i18n/locales";

const fr: MessagePatch = {
  common: { save: "Enregistrer", cancel: "Annuler", search: "Rechercher", filter: "Filtrer", viewMore: "Voir plus", signIn: "Connexion", signUp: "S'inscrire", language: "Langue", settings: "Paramètres", loading: "Chargement…" },
  nav: { home: "Accueil", about: "À propos", features: "Fonctionnalités", investments: "Investissements", contact: "Contact", dashboard: "Tableau de bord", deposit: "Dépôt", withdraw: "Retrait", markets: "Marchés", menu: "Menu", loans: "Prêts" },
  dashboard: { title: "Tableau de bord", myBalance: "Mon solde", recentActivity: "Activité récente", savings: "Épargne", saveToSavings: "Épargner", loadMore: "Charger plus", noActivity: "Aucune transaction récente." },
  settings: { profile: "Profil", security: "Sécurité", notifications: "Notifications", profilePhoto: "Photo de profil", languagePreference: "Langue préférée" },
};

const es: MessagePatch = {
  common: { save: "Guardar", cancel: "Cancelar", search: "Buscar", filter: "Filtrar", viewMore: "Ver más", signIn: "Iniciar sesión", signUp: "Registrarse", language: "Idioma", settings: "Ajustes" },
  nav: { home: "Inicio", about: "Nosotros", features: "Funciones", investments: "Inversiones", contact: "Contacto", dashboard: "Panel", deposit: "Depósito", withdraw: "Retiro", markets: "Mercados", menu: "Menú", loans: "Préstamos" },
  dashboard: { title: "Panel", myBalance: "Mi saldo", recentActivity: "Actividad reciente", savings: "Ahorros", saveToSavings: "Ahorrar", loadMore: "Cargar más" },
  settings: { profile: "Perfil", profilePhoto: "Foto de perfil", languagePreference: "Idioma preferido" },
};

const pt: MessagePatch = {
  common: { save: "Salvar", cancel: "Cancelar", search: "Buscar", signIn: "Entrar", signUp: "Cadastrar", language: "Idioma" },
  nav: { home: "Início", dashboard: "Painel", deposit: "Depósito", withdraw: "Saque", markets: "Mercados" },
  dashboard: { myBalance: "Meu saldo", recentActivity: "Atividade recente", savings: "Poupança" },
};

const de: MessagePatch = {
  common: { save: "Speichern", cancel: "Abbrechen", search: "Suchen", signIn: "Anmelden", signUp: "Registrieren", language: "Sprache" },
  nav: { home: "Start", dashboard: "Dashboard", deposit: "Einzahlung", withdraw: "Auszahlung" },
  dashboard: { myBalance: "Mein Guthaben", recentActivity: "Letzte Aktivitäten", savings: "Sparen" },
};

const it: MessagePatch = {
  common: { save: "Salva", cancel: "Annulla", signIn: "Accedi", language: "Lingua" },
  nav: { home: "Home", dashboard: "Dashboard", deposit: "Deposito", withdraw: "Prelievo" },
  dashboard: { myBalance: "Il mio saldo", recentActivity: "Attività recenti", savings: "Risparmi" },
};

const nl: MessagePatch = {
  common: { save: "Opslaan", cancel: "Annuleren", signIn: "Inloggen", language: "Taal" },
  nav: { dashboard: "Dashboard", deposit: "Storting", withdraw: "Opname" },
  dashboard: { myBalance: "Mijn saldo", recentActivity: "Recente activiteit", savings: "Sparen" },
};

const ru: MessagePatch = {
  common: { save: "Сохранить", cancel: "Отмена", search: "Поиск", signIn: "Войти", language: "Язык" },
  nav: { home: "Главная", dashboard: "Панель", deposit: "Депозит", withdraw: "Вывод" },
  dashboard: { myBalance: "Мой баланс", recentActivity: "Недавняя активность", savings: "Сбережения" },
};

const ar: MessagePatch = {
  common: { save: "حفظ", cancel: "إلغاء", search: "بحث", signIn: "تسجيل الدخول", signUp: "إنشاء حساب", language: "اللغة", settings: "الإعدادات" },
  nav: { home: "الرئيسية", dashboard: "لوحة التحكم", deposit: "إيداع", withdraw: "سحب", markets: "الأسواق" },
  dashboard: { myBalance: "رصيدي", recentActivity: "النشاط الأخير", savings: "الادخار", saveToSavings: "ادخار" },
  settings: { profile: "الملف الشخصي", profilePhoto: "صورة الملف الشخصي", languagePreference: "اللغة المفضلة" },
};

const zh: MessagePatch = {
  common: { save: "保存", cancel: "取消", search: "搜索", signIn: "登录", language: "语言" },
  nav: { home: "首页", dashboard: "仪表板", deposit: "存款", withdraw: "提款" },
  dashboard: { myBalance: "我的余额", recentActivity: "最近活动", savings: "储蓄" },
};

const ja: MessagePatch = {
  common: { save: "保存", cancel: "キャンセル", signIn: "ログイン", language: "言語" },
  nav: { dashboard: "ダッシュボード", deposit: "入金", withdraw: "出金" },
  dashboard: { myBalance: "残高", recentActivity: "最近の活動", savings: "貯蓄" },
};

const ko: MessagePatch = {
  common: { save: "저장", cancel: "취소", signIn: "로그인", language: "언어" },
  nav: { dashboard: "대시보드", deposit: "입금", withdraw: "출금" },
  dashboard: { myBalance: "잔액", recentActivity: "최근 활동", savings: "저축" },
};

const hi: MessagePatch = {
  common: { save: "सहेजें", cancel: "रद्द करें", signIn: "साइन इन", language: "भाषा" },
  nav: { dashboard: "डैशबोर्ड", deposit: "जमा", withdraw: "निकासी" },
  dashboard: { myBalance: "मेरा बैलेंस", recentActivity: "हाल की गतिविधि", savings: "बचत" },
};

const tr: MessagePatch = {
  common: { save: "Kaydet", cancel: "İptal", signIn: "Giriş", language: "Dil" },
  nav: { dashboard: "Panel", deposit: "Yatırma", withdraw: "Çekme" },
  dashboard: { myBalance: "Bakiyem", recentActivity: "Son işlemler", savings: "Tasarruf" },
};

const sw: MessagePatch = {
  common: { save: "Hifadhi", cancel: "Ghairi", signIn: "Ingia", language: "Lugha" },
  nav: { dashboard: "Dashibodi", deposit: "Weka", withdraw: "Toa" },
  dashboard: { myBalance: "Salio langu", recentActivity: "Shughuli za hivi karibuni", savings: "Akiba" },
};

const yo: MessagePatch = {
  common: { save: "Fi pamọ́", cancel: "Fagilee", signIn: "Wọlé", language: "Èdè" },
  nav: { dashboard: "Dasibodu", deposit: "Fi sílẹ̀", withdraw: "Yọ kúrò" },
  dashboard: { myBalance: "Ìdíwọ́n mi", recentActivity: "Iṣẹ́ tuntun", savings: "Ìpamọ́" },
};

const ig: MessagePatch = {
  common: { save: "Chekwaa", cancel: "Kagbuo", signIn: "Banye", language: "Asụsụ" },
  nav: { dashboard: "Dashboard", deposit: "Tinye", withdraw: "Wepụ" },
  dashboard: { myBalance: "Ego m", recentActivity: "Ọrụ na-adịbeghị anya", savings: "Nchekwa" },
};

const ha: MessagePatch = {
  common: { save: "Ajiye", cancel: "Soke", signIn: "Shiga", language: "Harshe" },
  nav: { dashboard: "Allon sarrafawa", deposit: "Saka", withdraw: "Cire" },
  dashboard: { myBalance: "Ma'aunina", recentActivity: "Ayyukan kwanan nan", savings: "Tanadi" },
};

const PATCHES: Record<LocaleCode, MessagePatch | undefined> = {
  en: undefined,
  fr, es, pt, de, it, nl, ru, ar, zh, ja, ko, hi, tr, sw, yo, ig, ha,
};

export function buildMessages(locale: LocaleCode): Messages {
  const patch = PATCHES[locale];
  if (!patch) return en;
  return deepMerge(en, patch);
}

export const allMessages: Record<LocaleCode, Messages> = Object.fromEntries(
  (Object.keys(PATCHES) as LocaleCode[]).map((code) => [code, buildMessages(code)])
) as Record<LocaleCode, Messages>;
