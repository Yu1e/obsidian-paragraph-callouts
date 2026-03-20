/* Paragraph Callouts Plus — bundled */
"use strict";

var obsidian = require("obsidian");
var view = require("@codemirror/view");
var state = require("@codemirror/state");

function uid() {
  return "r" + Math.random().toString(36).substring(2, 11);
}

function hexToRgba(hex, opacity) {
  if (!hex || !hex.startsWith("#") || hex.length < 7)
    return "rgba(128,128,128," + opacity / 100 + ")";
  var r = parseInt(hex.slice(1, 3), 16);
  var g = parseInt(hex.slice(3, 5), 16);
  var b = parseInt(hex.slice(5, 7), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b))
    return "rgba(128,128,128," + opacity / 100 + ")";
  return "rgba(" + r + "," + g + "," + b + "," + opacity / 100 + ")";
}

function newRule() {
  return {
    id: uid(),
    name: "New callout",
    prefix: ">>",
    synonyms: "",
    backgroundColor: "#e8f4f8",
    backgroundOpacity: 100,
    textColor: "#1a1a1a",
    borderEnabled: true,
    borderColor: "#4a9eba",
    borderWidth: 2,
    borderOpacity: 100,
    borderStyle: "solid",
    borderRadius: 6,
    leftAccentEnabled: true,
    leftAccentColor: "#4a9eba",
    leftAccentWidth: 4,
    leftAccentOpacity: 100,
    prefixMode: "hide",
    replacementText: "",
    replacementSvg: "",
    paddingH: 16,
    paddingV: 8,
  };
}

/* ═══════════════════════════════════════════
   Localization
   ═══════════════════════════════════════════ */

var LANG = {
  en: {
    title: "Paragraph Callouts Plus",
    langLabel: "Interface language",
    langDesc: "Switch between English and Russian",
    addRule: "Add new rule",
    addRuleBtn: "＋ Add rule",
    general: "General",
    name: "Name",
    prefix: "Prefix",
    prefixPlaceholder: ">>",
    synonyms: "Synonyms",
    synonymsDesc: "Extra prefixes (space-separated). E.g.: ⚠ WRN warning:",
    synonymsPlaceholder: "⚠ WRN note:",
    prefixMode: "Prefix display",
    prefixModeDesc: "How the prefix is shown in rendered text",
    prefixModeShow: "Show as typed",
    prefixModeHide: "Hide completely",
    prefixModeReplace: "Replace with…",
    replacementText: "Replacement text",
    replacementTextDesc: "Text, emoji or symbols to show instead of prefix",
    replacementTextPlaceholder: "💡 ",
    replacementSvg: "Replacement SVG",
    replacementSvgDesc: "Paste SVG markup or upload an .svg file. Takes priority over text replacement.",
    uploadSvg: "Upload SVG",
    clearSvg: "Clear",
    svgPreview: "SVG preview",
    prefixNote: "Prefix activates only when followed by a space. E.g.: \"! text\" triggers, \"!text\" does not.",
    colors: "Colors",
    background: "Background",
    text: "Text",
    bgOpacity: "Background opacity",
    borderAccent: "Border & Accent",
    border: "Border",
    leftAccent: "Left accent",
    borderColor: "Border color",
    width: "Width",
    opacity: "Opacity",
    style: "Style",
    styleSolid: "Solid",
    styleDashed: "Dashed",
    styleDotted: "Dotted",
    styleDouble: "Double",
    accentColor: "Accent color",
    accentOpacity: "Accent opacity",
    shape: "Shape",
    radius: "Radius",
    padH: "Pad H",
    padV: "Pad V",
    duplicate: "Duplicate",
    delete: "Delete",
    preview: "Preview",
    previewText: "The quick brown fox jumps over the lazy dog.",
    invalidColor: "Invalid colour — use #RRGGBB",
  },
  ru: {
    title: "Paragraph Callouts Plus",
    langLabel: "Язык интерфейса",
    langDesc: "Переключение между английским и русским",
    addRule: "Добавить новое правило",
    addRuleBtn: "＋ Добавить правило",
    general: "Общее",
    name: "Название",
    prefix: "Префикс",
    prefixPlaceholder: ">>",
    synonyms: "Синонимы",
    synonymsDesc: "Дополнительные префиксы (через пробел). Напр.: ⚠ ВНМ важно:",
    synonymsPlaceholder: "⚠ ВНМ заметка:",
    prefixMode: "Отображение префикса",
    prefixModeDesc: "Как показывать префикс в отрендеренном тексте",
    prefixModeShow: "Показывать как есть",
    prefixModeHide: "Скрывать полностью",
    prefixModeReplace: "Заменить на…",
    replacementText: "Текст замены",
    replacementTextDesc: "Текст, эмодзи или символы вместо префикса",
    replacementTextPlaceholder: "💡 ",
    replacementSvg: "SVG замена",
    replacementSvgDesc: "Вставьте SVG-разметку или загрузите .svg файл. Приоритет над текстовой заменой.",
    uploadSvg: "Загрузить SVG",
    clearSvg: "Очистить",
    svgPreview: "Предпросмотр SVG",
    prefixNote: "Префикс срабатывает только если после него стоит пробел. Напр.: «! текст» — сработает, «!текст» — нет.",
    colors: "Цвета",
    background: "Фон",
    text: "Текст",
    bgOpacity: "Прозрачность фона",
    borderAccent: "Рамка и акцент",
    border: "Рамка",
    leftAccent: "Левый акцент",
    borderColor: "Цвет рамки",
    width: "Толщина",
    opacity: "Прозрачность",
    style: "Стиль",
    styleSolid: "Сплошной",
    styleDashed: "Штрих",
    styleDotted: "Точечный",
    styleDouble: "Двойной",
    accentColor: "Цвет акцента",
    accentOpacity: "Прозрачность акцента",
    shape: "Форма",
    radius: "Скругление",
    padH: "Отступ Г",
    padV: "Отступ В",
    duplicate: "Дублировать",
    delete: "Удалить",
    preview: "Предпросмотр",
    previewText: "Съешь ещё этих мягких французских булок, да выпей чаю.",
    invalidColor: "Неверный цвет — используйте #RRGGBB",
  },
};

/** Get all prefixes for a rule: main + synonyms */
function getAllPrefixes(rule) {
  var list = [];
  if (rule.prefix) list.push(rule.prefix);
  if (rule.synonyms) {
    var parts = rule.synonyms.split(" ");
    for (var i = 0; i < parts.length; i++) {
      var s = parts[i].trim();
      if (s.length > 0) list.push(s);
    }
  }
  return list;
}

/** Build a flat list of {prefix, rule} sorted longest-first */
function buildPrefixIndex(rules) {
  var entries = [];
  for (var i = 0; i < rules.length; i++) {
    var prefixes = getAllPrefixes(rules[i]);
    for (var j = 0; j < prefixes.length; j++) {
      entries.push({ prefix: prefixes[j], rule: rules[i] });
    }
  }
  entries.sort(function (a, b) { return b.prefix.length - a.prefix.length; });
  return entries;
}

var DEFAULT_SETTINGS = {
  lang: "en",
  rules: [
    Object.assign(newRule(), {
      name: "Default callout",
      prefix: ">>",
      synonyms: "",
    }),
    Object.assign(newRule(), {
      name: "Warning",
      prefix: "!!",
      synonyms: "⚠ WRN",
      backgroundColor: "#fff3e0",
      textColor: "#5d4037",
      borderColor: "#ff9800",
      leftAccentColor: "#ff9800",
    }),
  ],
};

/* ═══════════════════════════════════════════
   CM6 Widget for prefix replacement
   ═══════════════════════════════════════════ */

class PrefixReplacementWidget extends view.WidgetType {
  constructor(content, isSvg) {
    super();
    this.content = content;
    this.isSvg = isSvg;
  }
  toDOM() {
    var span = document.createElement("span");
    span.className = "paragraph-callout-prefix-replacement";
    if (this.isSvg) {
      span.classList.add("paragraph-callout-prefix-svg");
      span.innerHTML = this.content;
    } else {
      span.textContent = this.content;
    }
    return span;
  }
  eq(other) {
    return this.content === other.content && this.isSvg === other.isSvg;
  }
  get estimatedHeight() { return -1; }
  ignoreEvent() { return false; }
}

/* ═══════════════════════════════════════════
   Plugin
   ═══════════════════════════════════════════ */

class ParagraphCalloutsPlugin extends obsidian.Plugin {
  async onload() {
    this.cmExtensions = [];
    this.styleEl = null;
    await this.loadSettings();
    this.registerEditorExtension(this.cmExtensions);
    this.rebuildCM();
    this.registerMarkdownPostProcessor(this.postProcess.bind(this));
    this.injectCSS();
    this.addSettingTab(new CalloutsSettingTab(this.app, this));
  }

  onunload() {
    if (this.styleEl) { this.styleEl.remove(); this.styleEl = null; }
  }

  async loadSettings() {
    var raw = await this.loadData();
    this.settings = { lang: "en", rules: [] };
    if (raw) {
      if (raw.lang) this.settings.lang = raw.lang;
      if (Array.isArray(raw.rules)) {
        var template = newRule();
        this.settings.rules = raw.rules.map(function (r) {
          var merged = Object.assign({}, template, r);
          /* Migration: old removePrefix → new prefixMode */
          if (merged.prefixMode === undefined || merged.prefixMode === null) {
            merged.prefixMode = (r.removePrefix === false) ? "show" : "hide";
          }
          if (!merged.replacementText) merged.replacementText = "";
          if (!merged.replacementSvg) merged.replacementSvg = "";
          return merged;
        });
      }
    }
    if (this.settings.rules.length === 0) {
      this.settings.rules = DEFAULT_SETTINGS.rules.map(function (r) {
        return Object.assign({}, r, { id: uid() });
      });
    }
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.injectCSS();
    this.rebuildCM();
  }

  /** Helper: get localized string */
  t(key) {
    var lang = this.settings.lang || "en";
    var dict = LANG[lang] || LANG.en;
    return dict[key] || LANG.en[key] || key;
  }

  /* ── CSS injection ── */

  injectCSS() {
    if (this.styleEl) this.styleEl.remove();
    var el = document.createElement("style");
    el.id = "paragraph-callouts-plus-css";
    var css = "";

    for (var i = 0; i < this.settings.rules.length; i++) {
      var r = this.settings.rules[i];
      var bg = hexToRgba(r.backgroundColor, r.backgroundOpacity);
      var bd = hexToRgba(r.borderColor, r.borderOpacity);
      var la = hexToRgba(r.leftAccentColor, r.leftAccentOpacity);
      var cls = "paragraph-callout-" + r.id;

      var borderCSS = "border:none;";
      if (r.borderEnabled && !r.leftAccentEnabled) {
        borderCSS = "border:" + r.borderWidth + "px " + r.borderStyle + " " + bd + ";";
      } else if (!r.borderEnabled && r.leftAccentEnabled) {
        borderCSS = "border:none;border-left:" + r.leftAccentWidth + "px " + r.borderStyle + " " + la + ";";
      } else if (r.borderEnabled && r.leftAccentEnabled) {
        borderCSS = "border:" + r.borderWidth + "px " + r.borderStyle + " " + bd + ";"
          + "border-left:" + r.leftAccentWidth + "px " + r.borderStyle + " " + la + ";";
      }

      css += "." + cls + "{"
        + "background-color:" + bg + ";"
        + "color:" + r.textColor + ";"
        + borderCSS
        + "border-radius:" + r.borderRadius + "px;"
        + "padding:" + r.paddingV + "px " + r.paddingH + "px;"
        + "margin:2px 0;"
        + "transition:all .15s ease;"
        + "}\n";

      css += "." + cls + "+." + cls + "{"
        + "margin-top:0;border-top-left-radius:0;border-top-right-radius:0;"
        + (r.borderEnabled ? "border-top:none;" : "")
        + "}\n";
      css += "." + cls + ":has(+." + cls + "){"
        + "margin-bottom:0;border-bottom-left-radius:0;border-bottom-right-radius:0;"
        + (r.borderEnabled ? "border-bottom:none;" : "")
        + "}\n";
    }

    el.textContent = css;
    document.head.appendChild(el);
    this.styleEl = el;
  }

  /* ── CM6 ── */

  rebuildCM() {
    this.cmExtensions.length = 0;
    this.cmExtensions.push(this.buildViewPlugin());
    this.app.workspace.updateOptions();
  }

  buildViewPlugin() {
    var plugin = this;
    return view.ViewPlugin.fromClass(
      class {
        constructor(ev) { this.decorations = this.build(ev); }
        update(upd) {
          if (upd.docChanged || upd.viewportChanged || upd.selectionSet)
            this.decorations = this.build(upd.view);
        }
        build(ev) {
          var builder = new state.RangeSetBuilder();
          var doc = ev.state.doc;
          var index = buildPrefixIndex(plugin.settings.rules);
          var activeLine = new Set();
          for (var s = 0; s < ev.state.selection.ranges.length; s++) {
            var sel = ev.state.selection.ranges[s];
            var sn = doc.lineAt(sel.from).number;
            var en = doc.lineAt(sel.to).number;
            for (var n = sn; n <= en; n++) activeLine.add(n);
          }
          for (var i = 1; i <= doc.lines; i++) {
            var line = doc.line(i);
            var text = line.text;
            for (var j = 0; j < index.length; j++) {
              var entry = index[j];
              var fullPrefix = entry.prefix + " ";
              if (!text.startsWith(fullPrefix)) continue;
              var rule = entry.rule;
              builder.add(line.from, line.from,
                view.Decoration.line({ class: "paragraph-callout-" + rule.id }));

              var mode = rule.prefixMode || "hide";
              if (mode !== "show" && !activeLine.has(i)) {
                var end = line.from + fullPrefix.length;
                if (mode === "hide") {
                  builder.add(line.from, end, view.Decoration.replace({}));
                } else if (mode === "replace") {
                  var hasSvg = rule.replacementSvg && rule.replacementSvg.trim().length > 0;
                  var hasText = rule.replacementText && rule.replacementText.trim().length > 0;
                  if (hasSvg) {
                    builder.add(line.from, end, view.Decoration.replace({
                      widget: new PrefixReplacementWidget(rule.replacementSvg, true)
                    }));
                  } else if (hasText) {
                    builder.add(line.from, end, view.Decoration.replace({
                      widget: new PrefixReplacementWidget(rule.replacementText + " ", false)
                    }));
                  } else {
                    builder.add(line.from, end, view.Decoration.replace({}));
                  }
                }
              }
              break;
            }
          }
          return builder.finish();
        }
      },
      { decorations: function (v) { return v.decorations; } }
    );
  }

  /* ── Reading view ── */

  postProcess(el, ctx) {
    var index = buildPrefixIndex(this.settings.rules);
    var paragraphs = el.querySelectorAll("p");
    paragraphs.forEach(function (p) {
      var txt = p.textContent || "";
      for (var j = 0; j < index.length; j++) {
        var entry = index[j];
        var fullPrefix = entry.prefix + " ";
        if (!txt.startsWith(fullPrefix)) continue;
        var rule = entry.rule;
        p.classList.add("paragraph-callout-" + rule.id);

        var mode = rule.prefixMode || "hide";
        if (mode === "show") break; /* prefix stays visible */

        var walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
        var first = walker.nextNode();
        if (!first || !first.textContent) break;
        first.textContent = first.textContent.substring(fullPrefix.length);

        if (mode === "replace") {
          var hasSvg = rule.replacementSvg && rule.replacementSvg.trim().length > 0;
          var hasText = rule.replacementText && rule.replacementText.trim().length > 0;
          if (hasSvg || hasText) {
            var span = document.createElement("span");
            span.className = "paragraph-callout-prefix-replacement";
            if (hasSvg) {
              span.classList.add("paragraph-callout-prefix-svg");
              span.innerHTML = rule.replacementSvg;
            } else {
              span.textContent = rule.replacementText + " ";
            }
            first.parentNode.insertBefore(span, first);
          }
        }
        break;
      }
    });
  }
}

/* ═══════════════════════════════════════════
   Settings Tab
   ═══════════════════════════════════════════ */

class CalloutsSettingTab extends obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
    this.openRuleId = null;
  }

  t(key) { return this.plugin.t(key); }

  display() {
    var containerEl = this.containerEl;
    containerEl.empty();
    containerEl.addClass("paragraph-callouts-settings");

    containerEl.createEl("h1", { text: this.t("title") });

    var self = this;

    new obsidian.Setting(containerEl)
      .setName(this.t("langLabel"))
      .setDesc(this.t("langDesc"))
      .addDropdown(function (d) {
        d.addOptions({ en: "English", ru: "Русский" })
          .setValue(self.plugin.settings.lang || "en")
          .onChange(async function (v) {
            self.plugin.settings.lang = v;
            await self.plugin.saveSettings();
            self.display();
          });
      });

    new obsidian.Setting(containerEl)
      .setName(this.t("addRule"))
      .addButton(function (b) {
        b.setButtonText(self.t("addRuleBtn")).setCta().onClick(async function () {
          var nr = newRule();
          self.plugin.settings.rules.push(nr);
          self.openRuleId = nr.id;
          await self.plugin.saveSettings();
          self.display();
        });
      });

    var rules = this.plugin.settings.rules;
    for (var i = 0; i < rules.length; i++) {
      this.renderRule(containerEl, rules[i], i);
    }
  }

  renderRule(parent, rule, idx) {
    var self = this;
    var wrap = parent.createDiv({ cls: "callout-rule-container" });
    var details = wrap.createEl("details");

    if (this.openRuleId === rule.id) details.open = true;
    details.addEventListener("toggle", function () {
      if (details.open) self.openRuleId = rule.id;
    });

    var summary = details.createEl("summary", { cls: "callout-rule-summary" });
    summary.createEl("span", { text: (idx + 1) + ". ", cls: "callout-rule-index" });
    summary.createEl("strong", { text: rule.name });
    summary.createEl("code", { text: rule.prefix, cls: "callout-rule-prefix-code" });

    var body = details.createDiv({ cls: "callout-rule-body" });

    /* ── Sticky Preview ── */
    var stickyWrap = body.createDiv({ cls: "callout-preview-sticky" });
    stickyWrap.createDiv({ cls: "callout-live-preview-label", text: self.t("preview") });
    var preview = stickyWrap.createDiv({ cls: "paragraph-callout-" + rule.id + " callout-live-preview" });

    var mode = rule.prefixMode || "hide";
    if (mode === "show") {
      preview.setText(rule.prefix + " " + self.t("previewText"));
    } else if (mode === "replace") {
      var hasSvg = rule.replacementSvg && rule.replacementSvg.trim().length > 0;
      var hasText = rule.replacementText && rule.replacementText.trim().length > 0;
      if (hasSvg) {
        var svgSpan = preview.createEl("span", {
          cls: "paragraph-callout-prefix-replacement paragraph-callout-prefix-svg"
        });
        svgSpan.innerHTML = rule.replacementSvg;
        preview.appendText(self.t("previewText"));
      } else if (hasText) {
        preview.setText(rule.replacementText + " " + self.t("previewText"));
      } else {
        preview.setText(self.t("previewText"));
      }
    } else {
      preview.setText(self.t("previewText"));
    }

    /* ── General ── */
    body.createEl("h4", { text: self.t("general") });

    var genRow = body.createDiv({ cls: "inline-row" });

    new obsidian.Setting(genRow)
      .setName(self.t("name"))
      .addText(function (t) {
        t.setValue(rule.name).onChange(async function (v) {
          rule.name = v;
          await self.save(rule.id);
        });
      });

    new obsidian.Setting(genRow)
      .setName(self.t("prefix"))
      .addText(function (t) {
        t.setPlaceholder(self.t("prefixPlaceholder")).setValue(rule.prefix).onChange(async function (v) {
          rule.prefix = v;
          await self.save(rule.id);
        });
      });

    body.createDiv({ cls: "callout-prefix-note", text: self.t("prefixNote") });

    new obsidian.Setting(body)
      .setName(self.t("synonyms"))
      .setDesc(self.t("synonymsDesc"))
      .addText(function (t) {
        t.setPlaceholder(self.t("synonymsPlaceholder")).setValue(rule.synonyms || "").onChange(async function (v) {
          rule.synonyms = v;
          await self.save(rule.id);
        });
      });

    /* ── Prefix Mode ── */
    new obsidian.Setting(body)
      .setName(self.t("prefixMode"))
      .setDesc(self.t("prefixModeDesc"))
      .addDropdown(function (d) {
        var opts = {};
        opts["show"] = self.t("prefixModeShow");
        opts["hide"] = self.t("prefixModeHide");
        opts["replace"] = self.t("prefixModeReplace");
        d.addOptions(opts)
          .setValue(rule.prefixMode || "hide")
          .onChange(async function (v) {
            rule.prefixMode = v;
            await self.plugin.saveSettings();
            self.display();
          });
      });

    if (rule.prefixMode === "replace") {
      new obsidian.Setting(body)
        .setName(self.t("replacementText"))
        .setDesc(self.t("replacementTextDesc"))
        .addText(function (t) {
          t.setPlaceholder(self.t("replacementTextPlaceholder"))
            .setValue(rule.replacementText || "")
            .onChange(async function (v) {
              rule.replacementText = v;
              await self.save(rule.id);
            });
        });

      /* SVG setting row: label + upload/clear buttons */
      var svgSetting = new obsidian.Setting(body)
        .setName(self.t("replacementSvg"))
        .setDesc(self.t("replacementSvgDesc"));

      svgSetting.addButton(function (b) {
        b.setButtonText(self.t("uploadSvg")).onClick(function () {
          var input = document.createElement("input");
          input.type = "file";
          input.accept = ".svg";
          input.style.display = "none";
          document.body.appendChild(input);
          input.addEventListener("change", async function () {
            if (input.files && input.files[0]) {
              var reader = new FileReader();
              reader.onload = async function (e) {
                rule.replacementSvg = e.target.result;
                await self.plugin.saveSettings();
                self.display();
              };
              reader.readAsText(input.files[0]);
            }
            document.body.removeChild(input);
          });
          input.click();
        });
      });

      if (rule.replacementSvg && rule.replacementSvg.trim().length > 0) {
        svgSetting.addButton(function (b) {
          b.setButtonText(self.t("clearSvg")).setWarning().onClick(async function () {
            rule.replacementSvg = "";
            await self.plugin.saveSettings();
            self.display();
          });
        });
      }

      /* SVG textarea */
      var svgTextareaWrap = body.createDiv({ cls: "callout-svg-textarea-wrap" });
      var textarea = svgTextareaWrap.createEl("textarea", {
        cls: "callout-svg-textarea",
        attr: { rows: 4, placeholder: "<svg>...</svg>", spellcheck: "false" }
      });
      textarea.value = rule.replacementSvg || "";
      textarea.addEventListener("change", async function () {
        rule.replacementSvg = textarea.value;
        await self.plugin.saveSettings();
        self.display();
      });

      /* SVG preview */
      if (rule.replacementSvg && rule.replacementSvg.trim().length > 0) {
        var svgPreviewWrap = body.createDiv({ cls: "callout-svg-preview-wrap" });
        svgPreviewWrap.createDiv({ cls: "callout-svg-preview-label", text: self.t("svgPreview") });
        var svgPreviewBox = svgPreviewWrap.createDiv({ cls: "callout-svg-preview" });
        svgPreviewBox.innerHTML = rule.replacementSvg;
      }
    }

    /* ── Colors ── */
    body.createEl("h4", { text: self.t("colors") });

    var colRow = body.createDiv({ cls: "inline-row" });
    self.colorPicker(colRow, self.t("background"), rule.backgroundColor, async function (v) {
      rule.backgroundColor = v; await self.save(rule.id);
    });
    self.colorPicker(colRow, self.t("text"), rule.textColor, async function (v) {
      rule.textColor = v; await self.save(rule.id);
    });

    new obsidian.Setting(body)
      .setName(self.t("bgOpacity"))
      .addSlider(function (s) {
        s.setLimits(0, 100, 5).setValue(rule.backgroundOpacity).setDynamicTooltip()
          .onChange(async function (v) { rule.backgroundOpacity = v; await self.save(rule.id); });
      });

    /* ── Border ── */
    body.createEl("h4", { text: self.t("borderAccent") });

    var borderToggles = body.createDiv({ cls: "inline-row" });

    new obsidian.Setting(borderToggles)
      .setName(self.t("border"))
      .addToggle(function (t) {
        t.setValue(rule.borderEnabled).onChange(async function (v) {
          rule.borderEnabled = v;
          await self.plugin.saveSettings();
          self.display();
        });
      });

    new obsidian.Setting(borderToggles)
      .setName(self.t("leftAccent"))
      .addToggle(function (t) {
        t.setValue(rule.leftAccentEnabled).onChange(async function (v) {
          rule.leftAccentEnabled = v;
          await self.plugin.saveSettings();
          self.display();
        });
      });

    if (rule.borderEnabled) {
      var bdRow = body.createDiv({ cls: "inline-row" });
      self.colorPicker(bdRow, self.t("borderColor"), rule.borderColor, async function (v) {
        rule.borderColor = v; await self.save(rule.id);
      });
      new obsidian.Setting(bdRow)
        .setName(self.t("width"))
        .addSlider(function (s) {
          s.setLimits(1, 10, 1).setValue(rule.borderWidth).setDynamicTooltip()
            .onChange(async function (v) { rule.borderWidth = v; await self.save(rule.id); });
        });

      var bdRow2 = body.createDiv({ cls: "inline-row" });
      new obsidian.Setting(bdRow2)
        .setName(self.t("opacity"))
        .addSlider(function (s) {
          s.setLimits(0, 100, 5).setValue(rule.borderOpacity).setDynamicTooltip()
            .onChange(async function (v) { rule.borderOpacity = v; await self.save(rule.id); });
        });
      new obsidian.Setting(bdRow2)
        .setName(self.t("style"))
        .addDropdown(function (d) {
          var opts = {};
          opts["solid"] = self.t("styleSolid");
          opts["dashed"] = self.t("styleDashed");
          opts["dotted"] = self.t("styleDotted");
          opts["double"] = self.t("styleDouble");
          d.addOptions(opts)
            .setValue(rule.borderStyle)
            .onChange(async function (v) { rule.borderStyle = v; await self.save(rule.id); });
        });
    }

    if (rule.leftAccentEnabled) {
      var laRow = body.createDiv({ cls: "inline-row" });
      self.colorPicker(laRow, self.t("accentColor"), rule.leftAccentColor, async function (v) {
        rule.leftAccentColor = v; await self.save(rule.id);
      });
      new obsidian.Setting(laRow)
        .setName(self.t("width"))
        .addSlider(function (s) {
          s.setLimits(1, 12, 1).setValue(rule.leftAccentWidth).setDynamicTooltip()
            .onChange(async function (v) { rule.leftAccentWidth = v; await self.save(rule.id); });
        });
      if (!rule.borderEnabled) {
        new obsidian.Setting(body)
          .setName(self.t("accentOpacity"))
          .addSlider(function (s) {
            s.setLimits(0, 100, 5).setValue(rule.leftAccentOpacity).setDynamicTooltip()
              .onChange(async function (v) { rule.leftAccentOpacity = v; await self.save(rule.id); });
          });
      }
    }

    /* ── Shape ── */
    body.createEl("h4", { text: self.t("shape") });

    var shapeRow = body.createDiv({ cls: "inline-row" });
    new obsidian.Setting(shapeRow)
      .setName(self.t("radius"))
      .addSlider(function (s) {
        s.setLimits(0, 28, 1).setValue(rule.borderRadius).setDynamicTooltip()
          .onChange(async function (v) { rule.borderRadius = v; await self.save(rule.id); });
      });
    new obsidian.Setting(shapeRow)
      .setName(self.t("padH"))
      .addSlider(function (s) {
        s.setLimits(0, 48, 2).setValue(rule.paddingH).setDynamicTooltip()
          .onChange(async function (v) { rule.paddingH = v; await self.save(rule.id); });
      });
    new obsidian.Setting(shapeRow)
      .setName(self.t("padV"))
      .addSlider(function (s) {
        s.setLimits(0, 28, 2).setValue(rule.paddingV).setDynamicTooltip()
          .onChange(async function (v) { rule.paddingV = v; await self.save(rule.id); });
      });

    /* ── Actions ── */
    var danger = body.createDiv({ cls: "callout-danger-zone" });

    new obsidian.Setting(danger)
      .addButton(function (b) {
        b.setButtonText(self.t("duplicate")).onClick(async function () {
          var clone = Object.assign({}, rule, { id: uid(), name: rule.name + " copy" });
          self.plugin.settings.rules.splice(idx + 1, 0, clone);
          self.openRuleId = clone.id;
          await self.plugin.saveSettings();
          self.display();
        });
      });

    new obsidian.Setting(danger)
      .addButton(function (b) {
        b.setButtonText(self.t("delete")).setWarning().onClick(async function () {
          self.plugin.settings.rules.splice(idx, 1);
          self.openRuleId = null;
          await self.plugin.saveSettings();
          self.display();
        });
      });
  }

  async save(ruleId) {
    this.openRuleId = ruleId;
    await this.plugin.saveSettings();
  }

  colorPicker(parent, label, initial, onChange) {
    var self = this;
    var setting = new obsidian.Setting(parent).setName(label);
    var wrapper = setting.controlEl.createDiv({ cls: "color-picker-wrapper" });
    var picker = wrapper.createEl("input");
    picker.type = "color";
    picker.className = "color-picker-native";
    picker.value = initial;
    var hex = wrapper.createEl("input");
    hex.type = "text";
    hex.className = "color-picker-hex";
    hex.value = initial;
    hex.maxLength = 7;
    picker.addEventListener("input", async function () {
      hex.value = picker.value;
      await onChange(picker.value);
    });
    hex.addEventListener("change", async function () {
      var v = hex.value.trim();
      if (!v.startsWith("#")) v = "#" + v;
      if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
        picker.value = v;
        await onChange(v);
      } else {
        hex.value = picker.value;
        new obsidian.Notice(self.t("invalidColor"));
      }
    });
  }
}

module.exports = ParagraphCalloutsPlugin;
