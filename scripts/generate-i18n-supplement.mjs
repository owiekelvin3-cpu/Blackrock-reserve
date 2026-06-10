/**
 * Generates/updates src/lib/i18n/translations/supplement.ts with translations
 * for keys missing from LOCALE_TRANSLATIONS in all.ts.
 * Merges with existing supplement entries — never drops prior translations.
 *
 * Run: node scripts/generate-i18n-supplement.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { translate } from "@vitalets/google-translate-api";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

function toImportUrl(relativePath) {
  return pathToFileURL(path.join(ROOT, relativePath)).href;
}

const LOCALE_BCP47 = {
  fr: "fr",
  es: "es",
  pt: "pt",
  de: "de",
  it: "it",
  nl: "nl",
  ru: "ru",
  ar: "ar",
  zh: "zh-CN",
  ja: "ja",
  ko: "ko",
  hi: "hi",
  tr: "tr",
  sw: "sw",
};

async function loadEnFlat() {
  const { flattenMessages, applyFlatTranslations } = await import(toImportUrl("src/lib/i18n/flatten.ts"));
  const extMod = await import(toImportUrl("src/lib/i18n/messages/extensions.ts"));
  // Parse enBase from en.ts without executing its default export chain
  const enPath = path.join(ROOT, "src/lib/i18n/messages/en.ts");
  const raw = fs.readFileSync(enPath, "utf8");
  const baseMatch = raw.match(/const enBase = (\{[\s\S]*?\n\});/);
  if (!baseMatch) throw new Error("Could not parse enBase from en.ts");
  const enBase = Function(`"use strict"; return (${baseMatch[1]});`)();
  const merged = applyFlatTranslations(enBase, flattenMessages(extMod.default));
  return flattenMessages(merged);
}

async function loadExisting() {
  const allMod = await import(toImportUrl("src/lib/i18n/translations/all.ts"));
  const supMod = await import(toImportUrl("src/lib/i18n/translations/supplement.ts"));
  return { all: allMod.LOCALE_TRANSLATIONS, supplement: supMod.LOCALE_SUPPLEMENT };
}

function escapeStr(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

/** Keep {year}, {email}, etc. from English source if translator corrupts placeholders */
function preservePlaceholders(source, translated) {
  const placeholders = source.match(/\{[a-zA-Z_]+\}/g);
  if (!placeholders?.length) return translated;
  let out = translated;
  const translatedPlaceholders = translated.match(/\{[^}]+\}/g) ?? [];
  placeholders.forEach((ph, i) => {
    if (!out.includes(ph) && translatedPlaceholders[i]) {
      out = out.replace(translatedPlaceholders[i], ph);
    }
  });
  return out;
}

async function translateText(text, to) {
  if (!text.trim()) return text;
  try {
    const res = await translate(text, { to, from: "en" });
    return preservePlaceholders(text, res.text);
  } catch (e) {
    console.warn(`  translate failed (${to}): ${text.slice(0, 40)}…`, e.message);
    return text;
  }
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const enFlat = await loadEnFlat();
  const { all: existing, supplement: existingSupplement } = await loadExisting();
  const locales = Object.keys(LOCALE_BCP47);

  const missingByLocale = {};
  for (const loc of locales) {
    const covered = { ...(existing[loc] ?? {}), ...(existingSupplement[loc] ?? {}) };
    const missing = Object.keys(enFlat).filter((k) => !(k in covered));
    missingByLocale[loc] = missing;
    console.log(`${loc}: ${missing.length} missing keys`);
  }

  const allMissing = [...new Set(Object.values(missingByLocale).flat())];
  console.log(`Unique missing keys: ${allMissing.length}`);
  if (allMissing.length === 0) {
    console.log("All keys covered. Nothing to generate.");
    return;
  }

  const supplement = {};
  for (const loc of locales) {
    supplement[loc] = { ...(existingSupplement[loc] ?? {}) };
  }

  for (const loc of locales) {
    const missing = missingByLocale[loc];
    if (missing.length === 0) continue;
    console.log(`\nTranslating ${missing.length} keys for ${loc}…`);

    for (let i = 0; i < missing.length; i++) {
      const key = missing[i];
      const enText = enFlat[key];
      const translated = await translateText(enText, LOCALE_BCP47[loc]);
      supplement[loc][key] = translated;
      if ((i + 1) % 10 === 0) {
        console.log(`  ${loc}: ${i + 1}/${missing.length}`);
        await sleep(500);
      } else {
        await sleep(150);
      }
    }
  }

  const outPath = path.join(ROOT, "src/lib/i18n/translations/supplement.ts");
  let out = `/** Auto-generated — missing translation keys. Run: node scripts/generate-i18n-supplement.mjs */\n`;
  out += `import type { LocaleCode } from "@/lib/i18n/locales";\n\n`;
  out += `export const LOCALE_SUPPLEMENT: Partial<Record<Exclude<LocaleCode, "en">, Record<string, string>>> = {\n`;

  for (const loc of locales) {
    out += `  ${loc}: {\n`;
    for (const [key, value] of Object.entries(supplement[loc]).sort(([a], [b]) => a.localeCompare(b))) {
      out += `    "${key}": "${escapeStr(value)}",\n`;
    }
    out += `  },\n`;
  }
  out += `};\n`;

  fs.writeFileSync(outPath, out, "utf8");
  console.log(`\nWrote ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
