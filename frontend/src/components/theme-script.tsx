"use client";

import { useLayoutEffect } from "react";

export const THEME_KEY = "nord:theme";

/** Сохранённый выбор или системная тема → data-theme на <html>. */
function applyTheme(key: string) {
  try {
    let theme = localStorage.getItem(key);
    if (theme !== "light" && theme !== "dark") {
      theme = matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    document.documentElement.dataset.theme = theme;
  } catch {}
}

const code = `(${applyTheme})(${JSON.stringify(THEME_KEY)})`;

/**
 * Выставляет data-theme до первой отрисовки. Без этого при загрузке
 * мигала бы светлая тема.
 *
 * Скрипт из серверного HTML выполняет браузер. Если React сам рисует
 * корневой layout на клиенте (например, после ошибки), <script> не
 * выполнится — там это неактивный блок данных, а тему ставит эффект.
 */
export function ThemeScript() {
  useLayoutEffect(() => {
    if (!document.documentElement.dataset.theme) applyTheme(THEME_KEY);
  }, []);

  return (
    <script
      type={typeof window === "undefined" ? undefined : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: code }}
    />
  );
}
