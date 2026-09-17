export const THEME_KEY = "nord:theme";

/**
 * Выставляет data-theme до первой отрисовки: сохранённый выбор
 * или системная тема. Без этого при загрузке мигала бы светлая тема.
 * Серверный компонент — скрипт попадает только в HTML.
 */
export function ThemeScript() {
  const code = `try{var t=localStorage.getItem("${THEME_KEY}");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
