import type { I18n as I18nType } from "@lingui/core";
import { setupI18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { English, Dutch } from "~/locales";
import { useMemo } from "react";

const messages = {
  en: English,
  nl: Dutch,
};
const supportedLocales = Object.keys(messages);

function activateLanguage(i18n: I18nType, language: string | undefined) {
  if (language?.includes("-") && !supportedLocales.includes(language)) {
    language = language.split("-")[0]!;
  }

  if (!language || !supportedLocales.includes(language)) {
    language = "en";
  }

  i18n.activate(language);
}

interface I18nProps {
  children?: React.ReactNode;
}

export function I18n({ children }: I18nProps) {
  const language = new URLSearchParams(location.search).get("language") ?? navigator.language;

  const i18n = useMemo(() => {
    const i18n = setupI18n({
      locales: supportedLocales,
      messages: messages,
    });
    activateLanguage(i18n, language);
    return i18n;
  }, [language]);

  return <I18nProvider i18n={i18n}>{children}</I18nProvider>;
}
