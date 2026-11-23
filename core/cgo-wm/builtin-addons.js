const DEFAULT_PALETTE_COLORS = Object.freeze([
  { name: '底色蓝(较浅)', value: '#092f52' },
  { name: '文字蓝(较深)', value: '#002538' },
  { name: '白色', value: '#ffffff' },
  { name: '1号线八通线', value: '#c23a30' },
  { name: '2号线', value: '#006098' },
  { name: '3号线', value: '#e60033' },
  { name: '4号线大兴线', value: '#008e9c' },
  { name: '5号线', value: '#a6217f' },
  { name: '6号线', value: '#d29700' },
  { name: '7号线', value: '#fac671' },
  { name: '8号线', value: '#009b6b' },
  { name: '9号线', value: '#8fc31f' },
  { name: '10号线', value: '#009bc0' },
  { name: '11号线', value: '#ed796b' },
  { name: '12号线', value: '#c76b00' },
  { name: '13号线', value: '#f9e700' },
  { name: '14号线', value: '#d5a7a1' },
  { name: '15号线', value: '#6a357d' },
  { name: '16号线', value: '#76a32d' },
  { name: '17号线', value: '#00a9a9' },
  { name: '18号线', value: '#5654a2' },
  { name: '19号线', value: '#d6abc1' },
  { name: '22号线', value: '#f7c8ce' },
  { name: '亦庄线', value: '#e40077' },
  { name: '房山线燕房线', value: '#e46022' },
  { name: 'S1线', value: '#b25921' },
  { name: '昌平线', value: '#de82b2' },
  { name: '28号线', value: '#35570b' },
  { name: '有轨电车', value: '#e6081b' },
  { name: '首都机场线', value: '#a29bbb' },
  { name: '大兴机场线', value: '#004ba0' },
]);

const BASE_PALETTE_NAME = '北京地铁';
const BUILTIN_CITY_PALETTES = Object.freeze([
  { name: '天津轨道交通', file: 'plugin/PaletteDemo.json' },
  { name: '上海轨道交通', file: 'plugin/Palette-Shanghai.json' },
  { name: '广州地铁', file: 'plugin/Palette-Guangzhou.json' },
  { name: '深圳地铁', file: 'plugin/Palette-Shenzhen.json' },
  { name: '成都地铁', file: 'plugin/Palette-Chengdu.json' },
  { name: '重庆轨道交通', file: 'plugin/Palette-Chongqing.json' },
  { name: '杭州地铁', file: 'plugin/Palette-Hangzhou.json' },
  { name: '南京地铁', file: 'plugin/Palette-Nanjing.json' },
  { name: '武汉地铁', file: 'plugin/Palette-Wuhan.json' },
  { name: '西安地铁', file: 'plugin/Palette-Xian.json' },
  { name: '郑州地铁', file: 'plugin/Palette-Zhengzhou.json' },
  { name: '港铁 MTR', file: 'plugin/Palette-MTR.json' },
]);
const BUILTIN_CITY_PALETTE_NAMES = new Set(BUILTIN_CITY_PALETTES.map((p) => p.name));

function ensureTrailingSlash(path) {
  if (!path) return '/';
  return path.endsWith('/') ? path : `${path}/`;
}

export function resolveSiteRoot(manager) {
  const win = manager?.windowRef;
  const raw = manager?.host?.siteRoot || win?.SITE_ROOT || '/';
  return ensureTrailingSlash(raw);
}

export function resolveVitoolRoot(manager) {
  const siteRoot = resolveSiteRoot(manager);
  const raw = manager?.host?.vitoolRoot || `${siteRoot}vitool/`;
  return ensureTrailingSlash(raw);
}

export function resolveHostAssetUrl(baseRoot, relativePath, windowRef) {
  const baseHref = windowRef?.location?.href || 'https://centralgo.site/';
  try {
    const resolvedBase = new URL(ensureTrailingSlash(baseRoot), baseHref);
    return new URL(relativePath, resolvedBase).href;
  } catch {
    return `${ensureTrailingSlash(baseRoot)}${relativePath}`;
  }
}

async function writeClipboardText(windowRef, text) {
  const nav = windowRef?.navigator;
  if (nav?.clipboard?.writeText) {
    await nav.clipboard.writeText(text);
    return true;
  }
  return false;
}

function createBuiltinIconNode(doc, manager, name, size = 14) {
  if (manager?.host?.iconElementFactory) {
    const custom = manager.host.iconElementFactory(name, doc);
    if (custom) return custom;
  }
  const el = doc.createElement('cgo-icon');
  el.setAttribute('name', name);
  el.setAttribute('size', String(size));
  return el;
}

function createPaletteMount(manager, addonManager) {
  const canUsePalette = () => {
    const perm = manager.windowRef?.PermissionClient;
    return !perm || perm.canUse('plugin.palette.use');
  };
  const canCustomPalette = () => {
    const perm = manager.windowRef?.PermissionClient;
    return !perm || perm.canUse('plugin.palette.custom_edit');
  };

  function cloneDefaultColors() {
    return DEFAULT_PALETTE_COLORS.map((c) => ({ ...c }));
  }

  function loadPaletteStore() {
    const hasAdvanced = canCustomPalette();
    const shared = addonManager.getSharedData('palette', null);
    let library = { [BASE_PALETTE_NAME]: cloneDefaultColors() };
    let activeName = BASE_PALETTE_NAME;
    let hadSaved = false;

    if (shared && typeof shared === 'object' && shared.library && typeof shared.library === 'object') {
      hadSaved = true;
      library = {};
      for (const [name, list] of Object.entries(shared.library)) {
        if (!hasAdvanced && name !== BASE_PALETTE_NAME && !BUILTIN_CITY_PALETTE_NAMES.has(name)) continue;
        if (Array.isArray(list)) {
          library[name] = list.filter((c) => c && c.name && c.value).map((c) => ({ name: String(c.name), value: String(c.value) }));
        }
      }
      if (!library[BASE_PALETTE_NAME]) library[BASE_PALETTE_NAME] = cloneDefaultColors();
      activeName = shared.activeName && library[shared.activeName] ? shared.activeName : BASE_PALETTE_NAME;
    } else if (hasAdvanced && manager.storage) {
      // 从 vitool 旧版 localStorage 键值无损迁移到跨软件全局共享库
      try {
        const savedLibRaw = manager.storage.getItem('palette_plugin_library');
        const savedName = manager.storage.getItem('palette_plugin_active_name');
        const savedColorsRaw = manager.storage.getItem('palette_plugin_colors');
        if (savedLibRaw || savedName || savedColorsRaw) {
          hadSaved = true;
          if (savedLibRaw) {
            const parsed = JSON.parse(savedLibRaw);
            if (parsed && typeof parsed === 'object') library = parsed;
          }
          if (!library[BASE_PALETTE_NAME]) library[BASE_PALETTE_NAME] = cloneDefaultColors();
          if (savedName && library[savedName]) {
            activeName = savedName;
          } else if (savedColorsRaw) {
            const parsedColors = JSON.parse(savedColorsRaw);
            if (Array.isArray(parsedColors)) library[BASE_PALETTE_NAME] = parsedColors;
          }
          addonManager.setSharedData('palette', { schema: 1, activeName, library });
        }
      } catch {
        // 迁移失败回退内置色板
      }
    }

    const currentColors = [...(library[activeName] || library[BASE_PALETTE_NAME] || cloneDefaultColors())];
    return { library, activeName, currentColors, hadSaved };
  }

  function savePaletteStore(activeName, library) {
    addonManager.setSharedData('palette', {
      schema: 1,
      activeName,
      library,
    });
    if (manager.storage) {
      try {
        manager.storage.setItem('palette_plugin_active_name', activeName);
        manager.storage.setItem('palette_plugin_library', JSON.stringify(library));
        manager.storage.setItem('palette_plugin_colors', JSON.stringify(library[activeName] || []));
      } catch {
        // 同步兼容键失败不影响主存储
      }
    }
  }

  return function mountPalette(container) {
    const doc = manager.documentRef;
    const win = manager.windowRef;
    let isEditMode = false;
    let feedbackTimer = null;
    let store = loadPaletteStore();

    container.replaceChildren();
    const root = doc.createElement('div');
    root.className = 'cgowm-palette-root';

    const headerBar = doc.createElement('div');
    headerBar.className = 'cgowm-palette-header';
    const activeBadge = doc.createElement('span');
    activeBadge.className = 'cgowm-palette-active-name';
    const feedbackEl = doc.createElement('span');
    feedbackEl.className = 'cgowm-palette-feedback';
    feedbackEl.hidden = true;
    headerBar.append(activeBadge, feedbackEl);

    const scrollBox = doc.createElement('div');
    scrollBox.className = 'cgowm-palette-scroll';
    const grid = doc.createElement('div');
    grid.className = 'cgowm-palette-grid';
    scrollBox.appendChild(grid);

    const footer = doc.createElement('div');
    footer.className = 'cgowm-palette-footer';

    const addBtn = doc.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'cgowm-palette-btn is-primary';
    addBtn.textContent = '添加';

    const editBtn = doc.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'cgowm-palette-btn';
    editBtn.textContent = '编辑';

    const manageWrap = doc.createElement('div');
    manageWrap.className = 'cgowm-palette-manage-wrap';
    const manageBtn = doc.createElement('button');
    manageBtn.type = 'button';
    manageBtn.className = 'cgowm-palette-btn cgowm-palette-manage-btn';
    manageBtn.textContent = '管理';
    const dropdown = doc.createElement('div');
    dropdown.className = 'cgowm-palette-dropdown';
    dropdown.hidden = true;
    manageWrap.append(manageBtn, dropdown);

    footer.append(addBtn, editBtn, manageWrap);
    root.append(headerBar, scrollBox, footer);
    container.appendChild(root);

    function showFeedback(text) {
      feedbackEl.textContent = text;
      feedbackEl.hidden = false;
      if (feedbackTimer) win.clearTimeout(feedbackTimer);
      feedbackTimer = win.setTimeout(() => {
        feedbackEl.hidden = true;
      }, 2200);
    }

    function isOriginalColor(color) {
      return DEFAULT_PALETTE_COLORS.some((d) => d.name === color.name && d.value === color.value);
    }

    function render() {
      store = loadPaletteStore();
      const canUse = canUsePalette();
      const canCustom = canCustomPalette();
      footer.hidden = !canUse;
      footer.style.gridTemplateColumns = canCustom ? '' : '1fr';
      addBtn.hidden = !canCustom;
      editBtn.hidden = !canCustom;
      addBtn.disabled = !canCustom;
      editBtn.disabled = !canCustom;
      manageBtn.disabled = !canUse;
      manageBtn.textContent = canCustom ? '管理' : '切换色板';

      activeBadge.textContent = store.activeName;
      editBtn.textContent = isEditMode ? '完成' : '编辑';
      editBtn.classList.toggle('is-active', isEditMode);

      grid.replaceChildren();
      store.currentColors.forEach((color, index) => {
        const item = doc.createElement('div');
        item.className = 'cgowm-palette-item';
        const original = isOriginalColor(color);
        if (original) item.classList.add('is-original');
        if (isEditMode) item.classList.add('is-editing');
        item.title = `${color.name}: ${color.value}`;

        const swatch = doc.createElement('span');
        swatch.className = 'cgowm-palette-swatch';
        swatch.dataset.color = color.value;
        swatch.style.backgroundColor = color.value;

        const info = doc.createElement('div');
        info.className = 'cgowm-palette-info';
        const nameEl = doc.createElement('span');
        nameEl.className = 'cgowm-palette-name';
        nameEl.textContent = color.name;
        const hexEl = doc.createElement('span');
        hexEl.className = 'cgowm-palette-hex';
        hexEl.textContent = color.value;
        info.append(nameEl, hexEl);

        item.append(swatch, info);

        if (isEditMode && !original) {
          const delBtn = doc.createElement('button');
          delBtn.type = 'button';
          delBtn.className = 'cgowm-palette-del';
          delBtn.title = '删除此颜色';
          delBtn.setAttribute('aria-label', '删除此颜色');
          delBtn.appendChild(createBuiltinIconNode(doc, manager, 'close', 10));
          delBtn.addEventListener('click', async (event) => {
            event.stopPropagation();
            const ok = await manager.dialogApi.confirm(`确定要删除颜色“${color.name}”吗？`, { danger: true });
            if (!ok) return;
            store.currentColors.splice(index, 1);
            store.library[store.activeName] = [...store.currentColors];
            savePaletteStore(store.activeName, store.library);
            if (!store.currentColors.some((c) => !isOriginalColor(c))) {
              isEditMode = false;
            }
            render();
          });
          item.appendChild(delBtn);
        }

        item.addEventListener('click', async () => {
          if (isEditMode || !canUsePalette()) return;
          const result = await addonManager.invokeCapability('color.apply', {
            hex: color.value,
            name: color.name,
            source: 'palette',
          });
          if (result?.handled) {
            showFeedback(`已应用 ${color.name}`);
            return;
          }
          try {
            const copied = await writeClipboardText(win, color.value);
            showFeedback(copied ? `已复制 ${color.value}` : `${color.name} ${color.value}`);
          } catch {
            showFeedback(`${color.name} ${color.value}`);
          }
        });

        grid.appendChild(item);
      });
    }

    function renderManageMenu() {
      dropdown.replaceChildren();
      const canCustom = canCustomPalette();
      const names = Object.keys(store.library).sort((a, b) => {
        if (a === BASE_PALETTE_NAME) return -1;
        if (b === BASE_PALETTE_NAME) return 1;
        return a.localeCompare(b, 'zh-CN');
      });

      names.forEach((name) => {
        const row = doc.createElement('div');
        row.className = `cgowm-palette-menu-item${name === store.activeName ? ' is-active' : ''}`;

        const mark = doc.createElement('span');
        mark.className = 'cgowm-palette-menu-mark';
        if (name === store.activeName) {
          mark.appendChild(createBuiltinIconNode(doc, manager, 'check', 12));
        }

        const text = doc.createElement('span');
        text.className = 'cgowm-palette-menu-text';
        text.textContent = name;

        row.append(mark, text);

        if (canCustom && name === store.activeName && name !== BASE_PALETTE_NAME) {
          const delPaletteBtn = doc.createElement('button');
          delPaletteBtn.type = 'button';
          delPaletteBtn.className = 'cgowm-palette-menu-del';
          delPaletteBtn.title = '删除色板';
          delPaletteBtn.setAttribute('aria-label', '删除色板');
          delPaletteBtn.appendChild(createBuiltinIconNode(doc, manager, 'delete', 12));
          delPaletteBtn.addEventListener('click', async (event) => {
            event.stopPropagation();
            dropdown.hidden = true;
            const ok = await manager.dialogApi.confirm(`确定要彻底删除色板“${name}”吗？此操作不可恢复。`, { danger: true });
            if (!ok) return;
            delete store.library[name];
            savePaletteStore(BASE_PALETTE_NAME, store.library);
            render();
          });
          row.appendChild(delPaletteBtn);
        }

        row.addEventListener('click', (event) => {
          event.stopPropagation();
          dropdown.hidden = true;
          if (name !== store.activeName) {
            savePaletteStore(name, store.library);
            render();
          }
        });
        dropdown.appendChild(row);
      });

      const unloadedPresets = BUILTIN_CITY_PALETTES.filter((p) => !store.library[p.name]);
      if (unloadedPresets.length > 0) {
        const presetDivider = doc.createElement('div');
        presetDivider.className = 'cgowm-palette-menu-divider';
        dropdown.appendChild(presetDivider);

        unloadedPresets.forEach((preset) => {
          const btn = doc.createElement('button');
          btn.type = 'button';
          btn.className = 'cgowm-palette-menu-item cgowm-palette-menu-preset';
          btn.dataset.palettePreset = preset.name;
          const mark = doc.createElement('span');
          mark.className = 'cgowm-palette-menu-mark';
          const text = doc.createElement('span');
          text.className = 'cgowm-palette-menu-text';
          text.textContent = preset.name;
          btn.append(mark, text);
          btn.addEventListener('click', async (event) => {
            event.stopPropagation();
            dropdown.hidden = true;
            if (typeof win.fetch !== 'function') {
              showFeedback('当前环境未找到内置色板文件');
              return;
            }
            try {
              const url = resolveHostAssetUrl(resolveVitoolRoot(manager), preset.file, win);
              const res = await win.fetch(url);
              if (!res?.ok) throw new Error('fetch_failed');
              const data = await res.json();
              if (data?.type !== 'nalvitool-palette' || !data.PaletteName || !Array.isArray(data.PaletteColors)) {
                throw new Error('invalid_palette');
              }
              const latest = loadPaletteStore();
              const cleanColors = data.PaletteColors
                .filter((c) => c && c.name && c.value)
                .map((c) => ({ name: String(c.name), value: String(c.value) }));
              latest.library[String(data.PaletteName)] = cleanColors;
              savePaletteStore(String(data.PaletteName), latest.library);
              render();
              showFeedback(`已加载 ${data.PaletteName}`);
            } catch {
              showFeedback('当前环境未找到内置色板文件');
            }
          });
          dropdown.appendChild(btn);
        });
      }

      if (!canCustom) return;

      const divider = doc.createElement('div');
      divider.className = 'cgowm-palette-menu-divider';
      dropdown.appendChild(divider);

      const addMenuAction = (label, handler) => {
        const btn = doc.createElement('button');
        btn.type = 'button';
        btn.className = 'cgowm-palette-menu-item cgowm-palette-menu-action';
        btn.textContent = label;
        btn.addEventListener('click', (event) => {
          event.stopPropagation();
          dropdown.hidden = true;
          handler();
        });
        dropdown.appendChild(btn);
      };

      addMenuAction('新建色板…', async () => {
        const nextName = await manager.dialogApi.prompt('请输入新色板名称：', {
          title: '新建色板',
          placeholder: '例如：上海地铁 / 自定义色板',
        });
        const clean = nextName?.trim();
        if (!clean) return;
        if (!store.library[clean]) {
          store.library[clean] = [];
        }
        savePaletteStore(clean, store.library);
        render();
      });

      addMenuAction('导入 JSON…', () => {
        const input = doc.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.addEventListener('change', (e) => {
          const file = e.target.files?.[0];
          if (!file || typeof win.FileReader === 'undefined') return;
          const reader = new win.FileReader();
          reader.onload = async (ev) => {
            try {
              const data = JSON.parse(String(ev.target?.result || ''));
              if (data.type !== 'nalvitool-palette' || !data.PaletteName || !Array.isArray(data.PaletteColors)) {
                await manager.dialogApi.alert('无效的色板 JSON 格式（需为 nalvitool-palette）。', { title: '导入失败' });
                return;
              }
              store.library[String(data.PaletteName)] = data.PaletteColors.map((c) => ({
                name: String(c.name || ''),
                value: String(c.value || ''),
              })).filter((c) => c.name && c.value);
              savePaletteStore(String(data.PaletteName), store.library);
              render();
              showFeedback(`已导入 ${data.PaletteName}`);
            } catch {
              await manager.dialogApi.alert('导入失败：JSON 格式错误。', { title: '导入失败' });
            }
          };
          reader.readAsText(file);
        });
        input.click();
      });

      addMenuAction('导出 JSON', () => {
        const payload = {
          type: 'nalvitool-palette',
          PaletteName: store.activeName,
          PaletteColors: store.currentColors,
        };
        const blob = new win.Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = win.URL.createObjectURL(blob);
        const link = doc.createElement('a');
        link.href = url;
        link.download = `Palette_${store.activeName}.json`;
        doc.body.appendChild(link);
        link.click();
        link.remove();
        win.URL.revokeObjectURL(url);
      });
    }

    function openAddColorDialog() {
      const form = doc.createElement('form');
      form.className = 'cgowm-palette-add-form';
      form.innerHTML = `
        <div class="cgowm-palette-field">
          <label>颜色名称</label>
          <input type="text" class="cgowm-dialog-input" id="cgowm-pal-name" placeholder="请输入名称…" required>
        </div>
        <div class="cgowm-palette-field">
          <label>Hex 色值</label>
          <input type="text" class="cgowm-dialog-input" id="cgowm-pal-hex" placeholder="#008E9C" required>
        </div>
        <div class="cgowm-dialog-actions">
          <button type="button" class="cgowm-dialog-button cgowm-dialog-cancel">取消</button>
          <button type="submit" class="cgowm-dialog-button cgowm-dialog-confirm">确定</button>
        </div>
      `;

      const dialogInst = manager.dialogApi.dialog({
        panelId: 'cgowm-palette-add-color',
        title: '添加新颜色',
        icon: 'palette',
        className: 'cgowm-subdialog-window',
        width: 340,
        minWidth: 280,
        modal: true,
        destroyOnClose: true,
        closeOnEscape: true,
        closeOnOverlay: true,
        zGroup: 'dialog',
        content: form,
      });

      const nameInput = form.querySelector('#cgowm-pal-name');
      const hexInput = form.querySelector('#cgowm-pal-hex');
      const cancelBtn = form.querySelector('.cgowm-dialog-cancel');
      cancelBtn?.addEventListener('click', () => dialogInst.close());

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const name = nameInput?.value?.trim() || '';
        let hex = hexInput?.value?.trim() || '';
        if (!name || !hex) {
          await manager.dialogApi.alert('请填写颜色名称与 Hex 色值。', { title: '提示' });
          return;
        }
        if (!hex.startsWith('#')) hex = `#${hex}`;
        if (!/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(hex)) {
          await manager.dialogApi.alert('请输入有效的 Hex 色值（如 #C23A30）。', { title: '格式错误' });
          return;
        }
        store = loadPaletteStore();
        const nextList = [...store.currentColors, { name, value: hex }];
        store.library[store.activeName] = nextList;
        savePaletteStore(store.activeName, store.library);
        dialogInst.close();
        render();
      });

      win.requestAnimationFrame?.(() => nameInput?.focus?.());
    }

    addBtn.addEventListener('click', () => openAddColorDialog());
    editBtn.addEventListener('click', async () => {
      const hasCustom = store.currentColors.some((c) => !isOriginalColor(c));
      if (!isEditMode && !hasCustom) {
        await manager.dialogApi.alert('当前色板没有可编辑删除的自定义颜色。', { title: '提示' });
        return;
      }
      isEditMode = !isEditMode;
      render();
    });

    manageBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      if (!dropdown.hidden) {
        dropdown.hidden = true;
        return;
      }
      renderManageMenu();
      dropdown.hidden = false;
    });

    const handleDocClick = () => {
      dropdown.hidden = true;
    };
    doc.addEventListener('click', handleDocClick);

    const offData = manager.emitter.on('addonDataChange', (detail) => {
      if (detail?.addonId === 'palette') render();
    });
    const handlePerm = () => render();
    win.addEventListener?.('vitool:permissions-updated', handlePerm);

    render();

    return () => {
      if (feedbackTimer) win.clearTimeout(feedbackTimer);
      doc.removeEventListener('click', handleDocClick);
      offData();
      win.removeEventListener?.('vitool:permissions-updated', handlePerm);
    };
  };
}

function createJoiningMount(manager) {
  return function mountJoining(container) {
    const doc = manager.documentRef;
    const win = manager.windowRef;
    const passCode = '日照香炉生紫烟';

    container.replaceChildren();
    const wrap = doc.createElement('div');
    wrap.className = 'cgowm-joining-root';
    wrap.innerHTML = `
      <div class="cgowm-joining-lead"><strong>扫描下方二维码</strong><br>加入 Central Go 设计器交流群</div>
      <div class="cgowm-joining-qr">
        <div class="cgowm-joining-qr-placeholder">正在加载二维码…</div>
      </div>
      <div class="cgowm-joining-hint">点击下方按钮复制进群验证口令</div>
      <button type="button" class="cgowm-joining-copy-btn">获取进群口令</button>
    `;

    const qrBox = wrap.querySelector('.cgowm-joining-qr');
    const copyBtn = wrap.querySelector('.cgowm-joining-copy-btn');
    const qrUrl = resolveHostAssetUrl(resolveVitoolRoot(manager), 'docs/qq.svg', win);

    if (typeof win.fetch === 'function') {
      win.fetch(qrUrl)
        .then((res) => {
          if (!res.ok) throw new Error('qr_fetch_failed');
          return res.text();
        })
        .then((svgText) => {
          if (!qrBox?.isConnected) return;
          if (typeof win.DOMParser === 'function') {
            const parsed = new win.DOMParser().parseFromString(svgText, 'image/svg+xml');
            const svg = parsed.querySelector('svg');
            if (svg && !parsed.querySelector('parsererror')) {
              const imported = doc.importNode(svg, true);
              imported.style.width = '100%';
              imported.style.height = '100%';
              imported.style.display = 'block';
              qrBox.replaceChildren(imported);
              return;
            }
          }
          const img = doc.createElement('img');
          img.src = qrUrl;
          img.alt = 'QQ交流群二维码';
          qrBox.replaceChildren(img);
        })
        .catch(() => {
          if (!qrBox?.isConnected) return;
          qrBox.innerHTML = `<div class="cgowm-joining-fallback">加群口令：<strong>${passCode}</strong></div>`;
        });
    }

    let copyTimer = null;
    copyBtn?.addEventListener('click', async () => {
      try {
        const copied = await writeClipboardText(win, passCode);
        if (!copied) throw new Error('clipboard_unavailable');
        copyBtn.textContent = `${passCode} 已复制`;
        copyBtn.classList.add('is-copied');
        if (copyTimer) win.clearTimeout(copyTimer);
        copyTimer = win.setTimeout(() => {
          copyBtn.textContent = '获取进群口令';
          copyBtn.classList.remove('is-copied');
        }, 3000);
      } catch {
        await manager.dialogApi.alert(`请手动复制进群验证口令：${passCode}`, { title: '进群口令' });
      }
    });

    container.appendChild(wrap);
    return () => {
      if (copyTimer) win.clearTimeout(copyTimer);
    };
  };
}

export function getBuiltinAddonDefinitions(manager, options = {}) {
  if (!manager?.addons) throw new TypeError('需要有效的 CgoWindowManager 实例');
  const overrides = options.overrides || {};
  const urls = options.urls || {};

  const definitions = [
    {
      id: 'clr',
      name: '北京地铁色板参考',
      shortTitle: '标志色',
      description: '标准线路标志色与十六进制色值参考表（跨应用可用）',
      category: 'ref',
      categoryName: '参考信息',
      icon: 'palette',
      hosts: null,
      defaultEnabled: false,
      iframeSrc: () => urls.clr || resolveHostAssetUrl(resolveSiteRoot(manager), 'clr/index.html?embed=vitool', manager.windowRef),
      ...overrides.clr,
      window: {
        panelId: 'addon-clr',
        defaultWidth: 420,
        defaultHeight: 560,
        minWidth: 280,
        minHeight: 280,
        allowModes: ['float', 'sidebar'],
        sidebarSide: 'right',
        mobileMode: 'sheet',
        ...(overrides.clr?.window || {}),
      },
    },
    {
      id: 'staname',
      name: '北京地铁站名参考',
      shortTitle: '站名表',
      description: '地铁站中英文站名与规范拼写检索（跨应用可用）',
      category: 'ref',
      categoryName: '参考信息',
      icon: 'table',
      hosts: null,
      defaultEnabled: false,
      iframeSrc: () => urls.staname || resolveHostAssetUrl(resolveSiteRoot(manager), 'staname/index.html?embed=vitool', manager.windowRef),
      ...overrides.staname,
      window: {
        panelId: 'addon-staname',
        defaultWidth: 420,
        defaultHeight: 560,
        minWidth: 280,
        minHeight: 280,
        allowModes: ['float', 'sidebar'],
        sidebarSide: 'right',
        mobileMode: 'sheet',
        ...(overrides.staname?.window || {}),
      },
    },
    {
      id: 'palette',
      name: '调色板管理器',
      shortTitle: '调色板',
      description: '跨软件共享自定义色板库，支持画布实时改色与快捷取色',
      category: 'design',
      categoryName: '设计增强',
      icon: 'palette',
      hosts: null,
      defaultEnabled: false,
      mount: createPaletteMount(manager, manager.addons),
      ...overrides.palette,
      window: {
        panelId: 'addon-palette',
        title: '色彩管理面板',
        shortTitle: '调色板',
        defaultWidth: 300,
        defaultHeight: 'auto',
        minWidth: 210,
        minHeight: 160,
        allowModes: ['float', 'sidebar'],
        sidebarSide: 'right',
        mobileMode: 'sheet',
        ...(overrides.palette?.window || {}),
      },
    },
    {
      id: 'joining',
      name: '加入QQ群',
      shortTitle: '加群',
      description: '获取设计工作室交流群二维码与验证口令',
      category: 'support',
      categoryName: '获取支持',
      icon: 'chat',
      hosts: null,
      defaultEnabledHosts: ['vitool', 'wall', 'stasign', 'staline', 'trainlcd', 'project'],
      defaultEnabled: false,
      mount: createJoiningMount(manager),
      ...overrides.joining,
      window: {
        panelId: 'addon-joining',
        title: '加入群聊',
        shortTitle: '加群',
        defaultWidth: 248,
        defaultHeight: 'auto',
        minWidth: 190,
        minHeight: 180,
        allowModes: ['float', 'sidebar'],
        sidebarSide: 'right',
        mobileMode: 'sheet',
        ...(overrides.joining?.window || {}),
      },
    },
  ];

  if (Array.isArray(options.ids) && options.ids.length > 0) {
    return definitions.filter((item) => options.ids.includes(item.id));
  }
  return definitions;
}

export function registerBuiltinAddons(manager, options = {}) {
  const definitions = getBuiltinAddonDefinitions(manager, options);
  const registered = manager.addons.registerAddons(definitions);
  if (options.restore !== false && manager.initialized) {
    void manager.addons.syncAll({ openWindows: options.openWindows !== false });
  }
  return registered;
}
