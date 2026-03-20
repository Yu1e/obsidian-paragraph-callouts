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
    removePrefix: true,
    paddingH: 16,
    paddingV: 8,
  };
}

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
    this.settings = { rules: [] };
    if (raw && Array.isArray(raw.rules)) {
      var template = newRule();
      this.settings.rules = raw.rules.map(function (r) {
        return Object.assign({}, template, r);
      });
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

      /* 4 combos: none / left only / border only / both */
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

      /* Merge consecutive */
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
              if (!text.startsWith(entry.prefix)) continue;
              var rule = entry.rule;
              builder.add(line.from, line.from,
                view.Decoration.line({ class: "paragraph-callout-" + rule.id }));
              if (rule.removePrefix && !activeLine.has(i)) {
                var end = line.from + entry.prefix.length;
                if (text.length > entry.prefix.length && text[entry.prefix.length] === " ") end++;
                if (end > line.from) builder.add(line.from, end, view.Decoration.replace({}));
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
        if (!txt.startsWith(entry.prefix)) continue;
        var rule = entry.rule;
        p.classList.add("paragraph-callout-" + rule.id);
        if (rule.removePrefix) {
          var walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
          var first = walker.nextNode();
          if (first && first.textContent) {
            var cut = entry.prefix.length;
            if (first.textContent.charAt(cut) === " ") cut++;
            first.textContent = first.textContent.substring(cut);
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
    this.openRuleId = null; // track which rule is open
  }

  display() {
    var containerEl = this.containerEl;
    containerEl.empty();
    containerEl.addClass("paragraph-callouts-settings");

    containerEl.createEl("h1", { text: "Paragraph Callouts Plus" });

    var self = this;
    new obsidian.Setting(containerEl)
      .setName("Add new rule")
      .addButton(function (b) {
        b.setButtonText("＋ Add rule").setCta().onClick(async function () {
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

    // Keep open the rule that was last interacted with
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
    stickyWrap.createDiv({ cls: "callout-live-preview-label", text: "Preview" });
    var preview = stickyWrap.createDiv({ cls: "paragraph-callout-" + rule.id + " callout-live-preview" });
    preview.setText((rule.removePrefix ? "" : rule.prefix + " ") + "The quick brown fox jumps over the lazy dog.");

    /* ── General ── */
    body.createEl("h4", { text: "General" });

    var genRow = body.createDiv({ cls: "inline-row" });

    new obsidian.Setting(genRow)
      .setName("Name")
      .addText(function (t) {
        t.setValue(rule.name).onChange(async function (v) {
          rule.name = v;
          await self.save(rule.id);
        });
      });

    new obsidian.Setting(genRow)
      .setName("Prefix")
      .addText(function (t) {
        t.setPlaceholder(">>").setValue(rule.prefix).onChange(async function (v) {
          rule.prefix = v;
          await self.save(rule.id);
        });
      });

    new obsidian.Setting(body)
      .setName("Synonyms")
      .setDesc("Extra prefixes (space-separated). E.g.: ⚠ WRN warning:")
      .addText(function (t) {
        t.setPlaceholder("⚠ WRN note:").setValue(rule.synonyms || "").onChange(async function (v) {
          rule.synonyms = v;
          await self.save(rule.id);
        });
      });

    new obsidian.Setting(body)
      .setName("Hide prefix")
      .setDesc("Strip prefix from displayed text")
      .addToggle(function (t) {
        t.setValue(rule.removePrefix).onChange(async function (v) {
          rule.removePrefix = v;
          await self.save(rule.id);
        });
      });

    /* ── Colors ── */
    body.createEl("h4", { text: "Colors" });

    var colRow = body.createDiv({ cls: "inline-row" });
    self.colorPicker(colRow, "Background", rule.backgroundColor, async function (v) {
      rule.backgroundColor = v; await self.save(rule.id);
    });
    self.colorPicker(colRow, "Text", rule.textColor, async function (v) {
      rule.textColor = v; await self.save(rule.id);
    });

    new obsidian.Setting(body)
      .setName("Background opacity")
      .addSlider(function (s) {
        s.setLimits(0, 100, 5).setValue(rule.backgroundOpacity).setDynamicTooltip()
          .onChange(async function (v) { rule.backgroundOpacity = v; await self.save(rule.id); });
      });

    /* ── Border ── */
    body.createEl("h4", { text: "Border & Accent" });

    var borderToggles = body.createDiv({ cls: "inline-row" });

    new obsidian.Setting(borderToggles)
      .setName("Border")
      .addToggle(function (t) {
        t.setValue(rule.borderEnabled).onChange(async function (v) {
          rule.borderEnabled = v;
          await self.plugin.saveSettings();
          self.display();
        });
      });

    new obsidian.Setting(borderToggles)
      .setName("Left accent")
      .addToggle(function (t) {
        t.setValue(rule.leftAccentEnabled).onChange(async function (v) {
          rule.leftAccentEnabled = v;
          await self.plugin.saveSettings();
          self.display();
        });
      });

    if (rule.borderEnabled) {
      var bdRow = body.createDiv({ cls: "inline-row" });
      self.colorPicker(bdRow, "Border color", rule.borderColor, async function (v) {
        rule.borderColor = v; await self.save(rule.id);
      });
      new obsidian.Setting(bdRow)
        .setName("Width")
        .addSlider(function (s) {
          s.setLimits(1, 10, 1).setValue(rule.borderWidth).setDynamicTooltip()
            .onChange(async function (v) { rule.borderWidth = v; await self.save(rule.id); });
        });

      var bdRow2 = body.createDiv({ cls: "inline-row" });
      new obsidian.Setting(bdRow2)
        .setName("Opacity")
        .addSlider(function (s) {
          s.setLimits(0, 100, 5).setValue(rule.borderOpacity).setDynamicTooltip()
            .onChange(async function (v) { rule.borderOpacity = v; await self.save(rule.id); });
        });
      new obsidian.Setting(bdRow2)
        .setName("Style")
        .addDropdown(function (d) {
          d.addOptions({ solid: "Solid", dashed: "Dashed", dotted: "Dotted", double: "Double" })
            .setValue(rule.borderStyle)
            .onChange(async function (v) { rule.borderStyle = v; await self.save(rule.id); });
        });
    }

    if (rule.leftAccentEnabled) {
      var laRow = body.createDiv({ cls: "inline-row" });
      self.colorPicker(laRow, "Accent color", rule.leftAccentColor, async function (v) {
        rule.leftAccentColor = v; await self.save(rule.id);
      });
      new obsidian.Setting(laRow)
        .setName("Width")
        .addSlider(function (s) {
          s.setLimits(1, 12, 1).setValue(rule.leftAccentWidth).setDynamicTooltip()
            .onChange(async function (v) { rule.leftAccentWidth = v; await self.save(rule.id); });
        });
      if (!rule.borderEnabled) {
        new obsidian.Setting(body)
          .setName("Accent opacity")
          .addSlider(function (s) {
            s.setLimits(0, 100, 5).setValue(rule.leftAccentOpacity).setDynamicTooltip()
              .onChange(async function (v) { rule.leftAccentOpacity = v; await self.save(rule.id); });
          });
      }
    }

    /* ── Shape ── */
    body.createEl("h4", { text: "Shape" });

    var shapeRow = body.createDiv({ cls: "inline-row" });
    new obsidian.Setting(shapeRow)
      .setName("Radius")
      .addSlider(function (s) {
        s.setLimits(0, 28, 1).setValue(rule.borderRadius).setDynamicTooltip()
          .onChange(async function (v) { rule.borderRadius = v; await self.save(rule.id); });
      });
    new obsidian.Setting(shapeRow)
      .setName("Pad H")
      .addSlider(function (s) {
        s.setLimits(0, 48, 2).setValue(rule.paddingH).setDynamicTooltip()
          .onChange(async function (v) { rule.paddingH = v; await self.save(rule.id); });
      });
    new obsidian.Setting(shapeRow)
      .setName("Pad V")
      .addSlider(function (s) {
        s.setLimits(0, 28, 2).setValue(rule.paddingV).setDynamicTooltip()
          .onChange(async function (v) { rule.paddingV = v; await self.save(rule.id); });
      });

    /* ── Actions ── */
    var danger = body.createDiv({ cls: "callout-danger-zone" });

    new obsidian.Setting(danger)
      .addButton(function (b) {
        b.setButtonText("Duplicate").onClick(async function () {
          var clone = Object.assign({}, rule, { id: uid(), name: rule.name + " copy" });
          self.plugin.settings.rules.splice(idx + 1, 0, clone);
          self.openRuleId = clone.id;
          await self.plugin.saveSettings();
          self.display();
        });
      });

    new obsidian.Setting(danger)
      .addButton(function (b) {
        b.setButtonText("Delete").setWarning().onClick(async function () {
          self.plugin.settings.rules.splice(idx, 1);
          self.openRuleId = null;
          await self.plugin.saveSettings();
          self.display();
        });
      });
  }

  /** Save without closing the open rule */
  async save(ruleId) {
    this.openRuleId = ruleId;
    await this.plugin.saveSettings();
  }

  colorPicker(parent, label, initial, onChange) {
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
        new obsidian.Notice("Invalid colour — use #RRGGBB");
      }
    });
  }
}

module.exports = ParagraphCalloutsPlugin;