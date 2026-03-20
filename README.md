# Paragraph Callouts Plus (English)

**Plugin for [Obsidian](https://obsidian.md)** — style paragraphs as callouts based on a prefix character at the beginning of a line.

> Based on [obsidian-paragraph-callouts](https://github.com/CodyBontecou/obsidian-paragraph-callouts) by **CodyBontecou**. Paragraph Callouts Plus is a fork with extended functionality.

---

## Features

- **Callout rules** — create unlimited rules, each with its own prefix and style.
- **Prefix + space** — a callout is triggered only when the prefix is followed by a space (`! text` → callout, `!text` → plain paragraph).
- **Synonyms** — multiple prefixes per rule, space-separated (e.g. `⚠ WRN warning:`).
- **Three prefix display modes:**
  - **Show as-is** — the prefix remains in the text.
  - **Hide** — the prefix is completely removed from display.
  - **Replace** — the prefix is replaced with a custom character, emoji, text, or inline SVG icon.
- **SVG icons** — paste SVG code directly in settings; it renders inline in place of the prefix.
- **Flexible styling:**
  - Background color with adjustable opacity.
  - Text color.
  - Border — color, width, style (solid / dashed / dotted / double), opacity.
  - Left accent — separate color, width, opacity.
  - Border radius, padding.
- **Merging** — consecutive paragraphs with the same rule are visually joined.
- **Works everywhere** — both in editing mode (CM6) and reading mode.
- **Duplicate & delete** rules in one click.
- **Localization** — settings UI in English and Russian.

## Installation

1. Copy `main.js`, `styles.css`, and `manifest.json` into `.obsidian/plugins/paragraph-callouts-plus/` in your vault.
2. In Obsidian settings → "Community plugins", enable **Paragraph Callouts Plus**.

## Usage

1. Open the plugin settings.
2. Create a rule: set a prefix (e.g. `>>` or `!`), configure colors and style.
3. In a note, start a paragraph with the prefix followed by a space:

```
>> This paragraph becomes a callout.
! And this one — a different callout with a different style.
```

4. The paragraph is automatically highlighted according to the rule.

## Screenshots

*(coming soon)*

## Credits

- [CodyBontecou](https://github.com/CodyBontecou) — author of the original [obsidian-paragraph-callouts](https://github.com/CodyBontecou/obsidian-paragraph-callouts) plugin, which served as the foundation.

## License

MIT

# Paragraph Callouts Plus (Russian/Русский)

**Плагин для [Obsidian](https://obsidian.md)** — стилизация абзацев как выносок (callouts) по символу-префиксу в начале строки.

> За основу взят плагин [obsidian-paragraph-callouts](https://github.com/CodyBontecou/obsidian-paragraph-callouts) от **CodyBontecou**. Paragraph Callouts Plus — это форк с расширенной функциональностью.

---

## Возможности

- **Правила-выноски** — создавайте неограниченное количество правил, каждое со своим префиксом и стилем.
- **Префикс + пробел** — выноска срабатывает только если после префикса стоит пробел (`! текст` → выноска, `!текст` → обычный абзац).
- **Синонимы** — несколько префиксов для одного правила (через пробел, например `⚠ WRN warning:`).
- **Три режима отображения префикса:**
  - **Показывать как есть** — префикс остаётся в тексте.
  - **Скрывать** — префикс полностью убирается из отображения.
  - **Заменять** — вместо префикса показывается произвольный символ, эмодзи, текст или встроенный SVG-значок.
- **SVG-значки** — вставляйте SVG-код прямо в настройках, он отобразится вместо префикса в тексте.
- **Гибкая стилизация:**
  - Цвет фона с регулируемой прозрачностью.
  - Цвет текста.
  - Рамка — цвет, толщина, стиль (solid / dashed / dotted / double), прозрачность.
  - Левый акцент — отдельный цвет, толщина, прозрачность.
  - Скругление углов, внутренние отступы.
- **Склейка** — идущие подряд абзацы с одним правилом визуально объединяются.
- **Работает везде** — и в режиме редактирования (CM6), и в режиме чтения.
- **Дублирование и удаление** правил в один клик.
- **Локализация** — интерфейс настроек на русском и английском языках.

## Установка

1. Скопируйте файлы `main.js`, `styles.css` и `manifest.json` в папку `.obsidian/plugins/paragraph-callouts-plus/` вашего хранилища.
2. В настройках Obsidian → «Сторонние плагины» включите **Paragraph Callouts Plus**.

## Использование

1. Откройте настройки плагина.
2. Создайте правило: задайте префикс (например `>>` или `!`), настройте цвета и стиль.
3. В заметке начните абзац с префикса и пробела:

```
>> Этот абзац станет выноской.
! А этот — другой выноской с другим стилем.
```

4. Абзац автоматически подсветится в соответствии с правилом.

## Скриншоты

*(скоро)*

## Благодарности

- [CodyBontecou](https://github.com/CodyBontecou) — автор оригинального плагина [obsidian-paragraph-callouts](https://github.com/CodyBontecou/obsidian-paragraph-callouts), который послужил основой.

## Лицензия

MIT
