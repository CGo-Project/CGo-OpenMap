/**
 * CGo OpenMap - 内置 Markdown 文档阅读器 (core/markdown-viewer.js)
 *
 * 职责：
 *   1. 为系统内部提供轻量、安全、零第三方依赖的 Markdown 渲染引擎（标题/TOC、
 *      代码块复制、表格、列表、任务列表、引用与 GitHub Alert、相对图片与 HTML 白名单）；
 *   2. 拦截页面中及阅读器内部的 `.md` 文档链接（如「贡献与主理人」CONTRIBUTING.md、
 *      「移植手册」PORTING.md、QUALITY_STANDARDS.md），弹出内置 CGoWM 窗口原地阅读；
 *   3. 支持多文档栈历史后退、标题目录快速跳转与原生新标签页打开出口。
 */
(function (global) {
    'use strict';

    var docCache = new Map();
    var activeState = null;

    function escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function escapeAttr(str) {
        return escapeHtml(str).replace(/`/g, '&#96;');
    }

    function resolveUrl(href, baseUrl) {
        var raw = String(href || '').trim();
        if (!raw) return '';
        if (raw.charAt(0) === '#') return raw;
        try {
            var refBase = baseUrl || (global.location ? global.location.href : 'http://localhost/');
            return new URL(raw, refBase).href;
        } catch (_) {
            return raw;
        }
    }

    function isSafeUrl(url) {
        var trimmed = String(url || '').trim();
        if (!trimmed) return false;
        if (trimmed.charAt(0) === '#') return true;
        var lower = trimmed.toLowerCase();
        if (
            lower.indexOf('javascript:') === 0 ||
            lower.indexOf('vbscript:') === 0 ||
            lower.indexOf('data:text/html') === 0
        ) {
            return false;
        }
        if (/^(https?:|mailto:|blob:|data:image\/)/i.test(trimmed)) return true;
        return !/^[a-z][a-z0-9+.-]*:/i.test(trimmed);
    }

    function isMarkdownTarget(href) {
        var clean = String(href || '').split('#')[0].split('?')[0].toLowerCase();
        return clean.endsWith('.md');
    }

    function slugify(text, usedSlugs) {
        var base = String(text || '')
            .replace(/<[^>]*>/g, '')
            .trim()
            .toLowerCase()
            .replace(/[\s/]+/g, '-')
            .replace(/[^\w\u4e00-\u9fff-]/g, '') || 'section';
        var slug = base;
        var idx = 1;
        while (usedSlugs.has(slug)) {
            idx += 1;
            slug = base + '-' + idx;
        }
        usedSlugs.add(slug);
        return slug;
    }

    function sanitizeInlineHtml(fragment, baseUrl) {
        var allowedTags = new Set([
            'p', 'div', 'span', 'br', 'hr', 'strong', 'b', 'em', 'i', 'del', 's',
            'code', 'sub', 'sup', 'img', 'a', 'details', 'summary', 'ul', 'ol', 'li'
        ]);
        return fragment.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, function (_, slash, tagRaw, attrsRaw) {
            var tag = tagRaw.toLowerCase();
            if (!allowedTags.has(tag)) return '';
            if (slash) return '</' + tag + '>';
            if (tag === 'br' || tag === 'hr') return '<' + tag + '>';

            var attrs = [];
            var attrRe = /([a-zA-Z_:][\w:.-]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
            var m;
            while ((m = attrRe.exec(attrsRaw)) !== null) {
                var name = m[1].toLowerCase();
                if (name.indexOf('on') === 0 || name === 'style' && /expression|javascript:|url\(/i.test(m[2] || m[3] || '')) {
                    continue;
                }
                var val = m[2] != null ? m[2] : (m[3] != null ? m[3] : (m[4] || ''));
                if (name === 'href' || name === 'src') {
                    var resolved = resolveUrl(val, baseUrl);
                    if (!isSafeUrl(resolved)) continue;
                    attrs.push(name + '="' + escapeAttr(resolved) + '"');
                    if (tag === 'a' && !isMarkdownTarget(resolved) && resolved.charAt(0) !== '#') {
                        attrs.push('target="_blank" rel="noopener noreferrer"');
                    }
                } else if (
                    name === 'alt' ||
                    name === 'title' ||
                    name === 'width' ||
                    name === 'height' ||
                    name === 'align' ||
                    name === 'open' ||
                    name === 'style'
                ) {
                    attrs.push(val === '' && name === 'open' ? 'open' : (name + '="' + escapeAttr(val) + '"'));
                }
            }
            return '<' + tag + (attrs.length ? ' ' + attrs.join(' ') : '') + '>';
        });
    }

    function formatInlineEmphasis(str) {
        return str
            .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
            .replace(/__([^_\n]+)__/g, '<strong>$1</strong>')
            .replace(/~~([^~\n]+)~~/g, '<del>$1</del>')
            .replace(/(^|[^\*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
            .replace(/(^|[^a-zA-Z0-9_])_([^_\n]+?)_(?![a-zA-Z0-9_])/g, '$1<em>$2</em>');
    }

    function renderInline(text, baseUrl) {
        var codePlaceholders = [];
        var work = String(text || '').replace(/`([^`]+)`/g, function (_, code) {
            var token = '\u0000CODE' + codePlaceholders.length + '\u0000';
            codePlaceholders.push('<code>' + escapeHtml(code) + '</code>');
            return token;
        });

        var htmlPlaceholders = [];
        work = work.replace(/<(\/?(?:p|div|span|br|hr|strong|b|em|i|del|s|sub|sup|img|a|details|summary)\b[^>]*|\/(?:p|div|span|strong|b|em|i|del|s|sub|sup|a|details|summary))>/gi, function (tagStr) {
            var token = '\u0000HTML' + htmlPlaceholders.length + '\u0000';
            htmlPlaceholders.push(sanitizeInlineHtml(tagStr, baseUrl));
            return token;
        });

        work = escapeHtml(work);

        var linkPlaceholders = [];
        work = work.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, function (_, alt, src, title) {
            var url = resolveUrl(src, baseUrl);
            if (!isSafeUrl(url)) return escapeHtml(alt);
            var token = '\u0000LINK' + linkPlaceholders.length + '\u0000';
            linkPlaceholders.push('<img src="' + escapeAttr(url) + '" alt="' + escapeAttr(alt) + '"'
                + (title ? ' title="' + escapeAttr(title) + '"' : '') + ' loading="lazy">');
            return token;
        });

        work = work.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, function (_, label, href, title) {
            var resolved = resolveUrl(href, baseUrl);
            if (!isSafeUrl(resolved)) return label;
            var external = resolved.charAt(0) !== '#' && !isMarkdownTarget(resolved);
            var token = '\u0000LINK' + linkPlaceholders.length + '\u0000';
            linkPlaceholders.push('<a href="' + escapeAttr(resolved) + '"'
                + (title ? ' title="' + escapeAttr(title) + '"' : '')
                + (external ? ' target="_blank" rel="noopener noreferrer"' : '')
                + '>' + formatInlineEmphasis(label) + '</a>');
            return token;
        });

        work = formatInlineEmphasis(work);

        work = work.replace(/\u0000LINK(\d+)\u0000/g, function (_, idx) {
            return linkPlaceholders[Number(idx)] || '';
        });
        work = work.replace(/\u0000HTML(\d+)\u0000/g, function (_, idx) {
            return htmlPlaceholders[Number(idx)] || '';
        });
        work = work.replace(/\u0000CODE(\d+)\u0000/g, function (_, idx) {
            return codePlaceholders[Number(idx)] || '';
        });
        return work;
    }

    function splitTableCells(rowLine) {
        var trimmed = rowLine.trim().replace(/^\|/, '').replace(/\|$/, '');
        return trimmed.split(/\|/).map(function (c) { return c.trim(); });
    }

    function isTableSeparator(line) {
        return /^\s*\|?(?:\s*:?-{2,}:?\s*\|)+\s*:?-{2,}:?\s*\|?\s*$/.test(line)
            || /^\s*\|?\s*:?-{2,}:?\s*\|?\s*$/.test(line) && line.indexOf('|') !== -1;
    }

    function parseList(lines, startIdx, baseUrl, toc, usedSlugs) {
        var items = [];
        var baseLine = lines[startIdx];
        var baseIndent = baseLine.match(/^(\s*)/)[1].length;
        var ordered = /^\s*\d+\.\s+/.test(baseLine);
        var tag = ordered ? 'ol' : 'ul';
        var i = startIdx;

        while (i < lines.length) {
            var line = lines[i];
            if (!line.trim()) break;
            var indent = line.match(/^(\s*)/)[1].length;
            if (indent < baseIndent) break;

            if (indent > baseIndent) {
                if (items.length && /^(\s*)(?:[-*+]|\d+\.)\s+/.test(line)) {
                    var nested = parseList(lines, i, baseUrl, toc, usedSlugs);
                    items[items.length - 1] += nested.html;
                    i = nested.nextIndex;
                    continue;
                }
                break;
            }

            var match = ordered
                ? line.match(/^\s*\d+\.\s+(.*)$/)
                : line.match(/^\s*[-*+]\s+(.*)$/);
            if (!match) break;

            var content = match[1];
            var taskMatch = !ordered ? content.match(/^\[( |x|X)\]\s+(.*)$/) : null;
            var liHtml;
            if (taskMatch) {
                var checked = taskMatch[1].toLowerCase() === 'x';
                liHtml = '<li class="cgo-md-task"><label><input type="checkbox" disabled'
                    + (checked ? ' checked' : '') + '> ' + renderInline(taskMatch[2], baseUrl) + '</label>';
            } else {
                liHtml = '<li>' + renderInline(content, baseUrl);
            }
            items.push(liHtml);
            i += 1;

            while (i < lines.length && lines[i].trim() && !/^(\s*)(?:[-*+]|\d+\.)\s+/.test(lines[i])) {
                var contIndent = lines[i].match(/^(\s*)/)[1].length;
                if (contIndent <= baseIndent) break;
                items[items.length - 1] += ' ' + renderInline(lines[i].trim(), baseUrl);
                i += 1;
            }
        }

        var out = '<' + tag + '>' + items.map(function (it) { return it + '</li>'; }).join('') + '</' + tag + '>';
        return { html: out, nextIndex: i };
    }

    function renderMarkdown(mdText, opts) {
        opts = opts || {};
        var baseUrl = opts.baseUrl || (global.location ? global.location.href : 'http://localhost/');
        var lines = String(mdText || '').replace(/\r\n?/g, '\n').split('\n');
        var out = [];
        var toc = [];
        var usedSlugs = new Set();
        var i = 0;

        while (i < lines.length) {
            var line = lines[i];
            if (!line.trim()) {
                i += 1;
                continue;
            }

            // 1. 围栏代码块 ```
            var fenceMatch = line.match(/^\s*```([A-Za-z0-9_+-]*)\s*$/);
            if (fenceMatch) {
                var lang = fenceMatch[1] || 'text';
                var codeLines = [];
                i += 1;
                while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) {
                    codeLines.push(lines[i]);
                    i += 1;
                }
                i += 1;
                out.push(
                    '<div class="cgo-md-codewrap">'
                    + '<div class="cgo-md-codebar"><span>' + escapeHtml(lang) + '</span>'
                    + '<button type="button" class="cgo-md-copy-btn">复制</button></div>'
                    + '<pre><code>' + escapeHtml(codeLines.join('\n')) + '</code></pre>'
                    + '</div>'
                );
                continue;
            }

            // 2. 分隔线
            if (/^\s*(?:[-*_]\s*){3,}$/.test(line) && !/\|/.test(line)) {
                out.push('<hr>');
                i += 1;
                continue;
            }

            // 3. 标题 h1..h6
            var headMatch = line.match(/^\s*(#{1,6})\s+(.+?)\s*#*\s*$/);
            if (headMatch) {
                var level = headMatch[1].length;
                var rawHeading = headMatch[2];
                var plainHeading = rawHeading.replace(/`([^`]+)`/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
                var slug = slugify(plainHeading, usedSlugs);
                toc.push({ level: level, id: slug, text: plainHeading });
                out.push('<h' + level + ' id="' + escapeAttr(slug) + '">' + renderInline(rawHeading, baseUrl) + '</h' + level + '>');
                i += 1;
                continue;
            }

            // 4. 块级原生 HTML（如居中的二维码 <p align="center">...</p> / <details>）
            if (/^\s*<(p|div|details|table|figure)\b/i.test(line)) {
                var tagNameMatch = line.match(/^\s*<([a-zA-Z]+)/);
                var openTag = tagNameMatch ? tagNameMatch[1].toLowerCase() : 'p';
                var blockLines = [line];
                var closeRe = new RegExp('</' + openTag + '\\s*>', 'i');
                if (!closeRe.test(line)) {
                    i += 1;
                    while (i < lines.length && lines[i].trim() !== '') {
                        blockLines.push(lines[i]);
                        if (closeRe.test(lines[i])) {
                            i += 1;
                            break;
                        }
                        i += 1;
                    }
                } else {
                    i += 1;
                }
                out.push(sanitizeInlineHtml(blockLines.join('\n'), baseUrl));
                continue;
            }

            // 5. 引用与 GitHub Alert
            if (/^\s*>\s?/.test(line)) {
                var quoteLines = [];
                while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
                    quoteLines.push(lines[i].replace(/^\s*>\s?/, ''));
                    i += 1;
                }
                var firstQuote = quoteLines[0] || '';
                var alertMatch = firstQuote.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)$/i);
                if (alertMatch) {
                    var kind = alertMatch[1].toLowerCase();
                    var titleMap = { note: '说明', tip: '提示', important: '重要', warning: '注意', caution: '警告' };
                    var rest = [alertMatch[2]].concat(quoteLines.slice(1)).filter(Boolean);
                    out.push(
                        '<div class="cgo-md-alert cgo-md-alert-' + kind + '">'
                        + '<div class="cgo-md-alert-title">' + (titleMap[kind] || kind.toUpperCase()) + '</div>'
                        + '<div>' + rest.map(function (q) { return renderInline(q, baseUrl); }).join('<br>') + '</div>'
                        + '</div>'
                    );
                } else {
                    out.push('<blockquote>' + quoteLines.map(function (q) { return renderInline(q, baseUrl); }).join('<br>') + '</blockquote>');
                }
                continue;
            }

            // 6. GFM 表格
            if (line.indexOf('|') !== -1 && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
                var headers = splitTableCells(line);
                i += 2;
                var rows = [];
                while (i < lines.length && lines[i].trim() && lines[i].indexOf('|') !== -1) {
                    rows.push(splitTableCells(lines[i]));
                    i += 1;
                }
                var thead = '<thead><tr>' + headers.map(function (h) {
                    return '<th>' + renderInline(h, baseUrl) + '</th>';
                }).join('') + '</tr></thead>';
                var tbody = '<tbody>' + rows.map(function (r) {
                    return '<tr>' + headers.map(function (_, idx) {
                        return '<td>' + renderInline(r[idx] || '', baseUrl) + '</td>';
                    }).join('') + '</tr>';
                }).join('') + '</tbody>';
                out.push('<div class="cgo-md-table-wrap"><table>' + thead + tbody + '</table></div>');
                continue;
            }

            // 7. 有序/无序/任务列表
            if (/^\s*(?:[-*+]|\d+\.)\s+/.test(line)) {
                var listRes = parseList(lines, i, baseUrl, toc, usedSlugs);
                out.push(listRes.html);
                i = listRes.nextIndex;
                continue;
            }

            // 8. 普通段落
            var paraLines = [line.trim()];
            i += 1;
            while (
                i < lines.length
                && lines[i].trim()
                && !/^\s*(?:#{1,6}\s|```|>\s?|[-*+]\s|\d+\.\s|<(?:p|div|details|table|figure)\b)/i.test(lines[i])
                && !(lines[i].indexOf('|') !== -1 && i + 1 < lines.length && isTableSeparator(lines[i + 1]))
            ) {
                paraLines.push(lines[i].trim());
                i += 1;
            }
            out.push('<p>' + renderInline(paraLines.join(' '), baseUrl) + '</p>');
        }

        return { html: out.join('\n'), toc: toc };
    }

    function fileTitleFromUrl(url) {
        try {
            var clean = String(url || '').split('#')[0].split('?')[0];
            var seg = clean.split('/').pop() || '文档预览';
            return decodeURIComponent(seg);
        } catch (_) {
            return '文档预览';
        }
    }

    function createShellDom() {
        var shell = document.createElement('div');
        shell.className = 'cgo-md-shell';
        shell.innerHTML = ''
            + '<div class="cgo-md-toolbar">'
            + '<button type="button" class="cgo-md-tool-btn cgo-md-back-btn" disabled>← 返回</button>'
            + '<select class="cgo-md-toc-select" aria-label="文档目录"><option value="">文档目录</option></select>'
            + '<a class="cgo-md-tool-btn cgo-md-raw-link" target="_blank" rel="noopener noreferrer" data-md-raw="1">新标签页打开</a>'
            + '</div>'
            + '<div class="cgo-md-scroll"><article class="cgo-md-body"></article></div>';
        return shell;
    }

    async function loadAndRender(state, targetUrl, opts) {
        opts = opts || {};
        var fullUrl = resolveUrl(targetUrl);
        var parts = fullUrl.split('#');
        var docUrl = parts[0];
        var anchor = opts.anchor || parts[1] || '';

        if (opts.pushHistory && state.currentDocUrl && state.currentDocUrl !== docUrl) {
            state.history.push({ url: state.currentDocUrl, title: state.currentTitle });
        }
        state.currentDocUrl = docUrl;
        state.currentTitle = opts.title || fileTitleFromUrl(docUrl);

        state.backBtn.disabled = state.history.length === 0;
        state.rawLink.href = fullUrl;
        state.bodyEl.innerHTML = '<div class="cgo-md-state">正在加载文档…</div>';
        if (state.setTitle) state.setTitle(state.currentTitle);

        try {
            var mdText;
            if (docCache.has(docUrl)) {
                mdText = docCache.get(docUrl);
            } else {
                var resp = await global.fetch(docUrl);
                if (!resp.ok) {
                    throw new Error('HTTP ' + resp.status);
                }
                mdText = await resp.text();
                docCache.set(docUrl, mdText);
            }

            var rendered = renderMarkdown(mdText, { baseUrl: docUrl });
            state.bodyEl.innerHTML = rendered.html || '<div class="cgo-md-state">文档内容为空</div>';

            var titleHeading = rendered.toc.find(function (item) { return item.level === 1; });
            if (!opts.title && titleHeading) {
                state.currentTitle = titleHeading.text;
                if (state.setTitle) state.setTitle(state.currentTitle);
            }

            state.tocSelect.innerHTML = '<option value="">跳转到章节…</option>' + rendered.toc
                .filter(function (item) { return item.level <= 3; })
                .map(function (item) {
                    var prefix = item.level === 2 ? '· ' : (item.level === 3 ? '  · ' : '');
                    return '<option value="' + escapeAttr(item.id) + '">' + escapeHtml(prefix + item.text) + '</option>';
                })
                .join('');

            if (anchor) {
                var targetEl = state.bodyEl.querySelector('#' + (global.CSS?.escape ? global.CSS.escape(anchor) : anchor));
                if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                state.scrollEl.scrollTop = 0;
            }
        } catch (err) {
            state.bodyEl.innerHTML = ''
                + '<div class="cgo-md-state">'
                + '无法在内置阅读器中加载文档（' + escapeHtml(err && err.message ? err.message : String(err)) + '）。<br><br>'
                + '<a href="' + escapeAttr(fullUrl) + '" target="_blank" rel="noopener noreferrer" data-md-raw="1">尝试在新标签页打开原文档 &rarr;</a>'
                + '</div>';
        }
    }

    function openFallbackDialog(shell, initialTitle) {
        var overlay = document.createElement('div');
        overlay.className = 'cgo-md-fallback-overlay';
        var card = document.createElement('div');
        card.className = 'cgo-md-fallback-card';
        var head = document.createElement('div');
        head.className = 'cgo-md-fallback-head';
        var titleSpan = document.createElement('span');
        titleSpan.textContent = initialTitle || '文档阅读器';
        var closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'cgo-md-tool-btn';
        closeBtn.textContent = '关闭';
        head.append(titleSpan, closeBtn);
        card.append(head, shell);
        overlay.appendChild(card);
        document.body.appendChild(overlay);

        var close = function () {
            overlay.remove();
            document.removeEventListener('keydown', onKey);
            activeState = null;
        };
        var onKey = function (ev) {
            if (ev.key === 'Escape') close();
        };
        closeBtn.addEventListener('click', close);
        overlay.addEventListener('click', function (ev) {
            if (ev.target === overlay) close();
        });
        document.addEventListener('keydown', onKey);
        return {
            setTitle: function (t) { titleSpan.textContent = t; },
            close: close
        };
    }

    function open(url, opts) {
        opts = opts || {};
        var initialTitle = opts.title || fileTitleFromUrl(url);
        if (activeState && activeState.shell && activeState.shell.isConnected) {
            void loadAndRender(activeState, url, { title: opts.title, anchor: opts.anchor, pushHistory: true });
            return activeState.dialogInst || null;
        }

        var shell = createShellDom();
        var state = {
            shell: shell,
            backBtn: shell.querySelector('.cgo-md-back-btn'),
            tocSelect: shell.querySelector('.cgo-md-toc-select'),
            rawLink: shell.querySelector('.cgo-md-raw-link'),
            scrollEl: shell.querySelector('.cgo-md-scroll'),
            bodyEl: shell.querySelector('.cgo-md-body'),
            history: [],
            currentDocUrl: '',
            currentTitle: initialTitle,
            dialogInst: null,
            setTitle: null
        };

        var usedWmDialog = false;
        if (global.CGoDialogs && typeof global.CGoDialogs.dialog === 'function') {
            var dlg = global.CGoDialogs.dialog({
                panelId: 'markdown-viewer',
                title: initialTitle,
                icon: 'file',
                className: 'openmap-markdown-dialog',
                content: shell,
                modal: true,
                width: 780,
                height: 640,
                minWidth: 340,
                minHeight: 320,
                resizable: true,
                closeOnEscape: true,
                closeOnOverlay: true,
                destroyOnClose: true,
                onClose: function () {
                    activeState = null;
                }
            });
            if (dlg) {
                usedWmDialog = true;
                state.dialogInst = dlg;
                state.setTitle = function (t) {
                    if (typeof dlg.update === 'function') dlg.update({ title: t });
                };
            }
        }
        if (!usedWmDialog) {
            var fb = openFallbackDialog(shell, initialTitle);
            state.dialogInst = fb;
            state.setTitle = fb.setTitle;
        }

        state.backBtn.addEventListener('click', function () {
            if (!state.history.length) return;
            var prev = state.history.pop();
            void loadAndRender(state, prev.url, { title: prev.title, pushHistory: false });
        });

        state.tocSelect.addEventListener('change', function () {
            var id = state.tocSelect.value;
            if (!id) return;
            var targetEl = state.bodyEl.querySelector('#' + (global.CSS?.escape ? global.CSS.escape(id) : id));
            if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        shell.addEventListener('click', function (ev) {
            var copyBtn = ev.target.closest('.cgo-md-copy-btn');
            if (copyBtn) {
                var codeEl = copyBtn.closest('.cgo-md-codewrap')?.querySelector('pre > code');
                if (codeEl && global.navigator?.clipboard?.writeText) {
                    global.navigator.clipboard.writeText(codeEl.textContent || '').then(function () {
                        var orig = copyBtn.textContent;
                        copyBtn.textContent = '已复制';
                        setTimeout(function () { copyBtn.textContent = orig; }, 1400);
                    }).catch(function () {});
                }
                return;
            }

            var anchor = ev.target.closest('a[href]');
            if (!anchor || anchor.dataset.mdRaw) return;
            if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0) return;

            var href = anchor.getAttribute('href') || '';
            if (href.charAt(0) === '#') {
                ev.preventDefault();
                var targetId = href.slice(1);
                var el = state.bodyEl.querySelector('#' + (global.CSS?.escape ? global.CSS.escape(targetId) : targetId));
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
            if (isMarkdownTarget(href)) {
                ev.preventDefault();
                var parts = href.split('#');
                void loadAndRender(state, parts[0], {
                    title: anchor.dataset.mdTitle || '',
                    anchor: parts[1] || '',
                    pushHistory: true
                });
            }
        });

        activeState = state;
        void loadAndRender(state, url, { title: opts.title, anchor: opts.anchor, pushHistory: false });
        return state.dialogInst;
    }

    var globalBound = false;
    function bindLinks() {
        if (globalBound || typeof document === 'undefined') return;
        globalBound = true;
        document.addEventListener('click', function (ev) {
            if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
            var link = ev.target.closest('a[href$=".md"], a[href*=".md#"], a[data-md-doc]');
            if (!link || link.dataset.mdRaw) return;
            if (activeState && activeState.shell && activeState.shell.contains(link)) return;
            var rawHref = link.dataset.mdDoc || link.getAttribute('href') || '';
            if (!rawHref) return;
            ev.preventDefault();
            ev.stopPropagation();

            document.querySelectorAll('.options-dropdown .dropdown-content.show').forEach(function (dd) {
                dd.classList.remove('show');
            });
            document.getElementById('options-btn')?.setAttribute('aria-expanded', 'false');

            var parts = rawHref.split('#');
            open(parts[0], {
                title: link.dataset.mdTitle || link.textContent.trim(),
                anchor: parts[1] || ''
            });
        });
    }

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', bindLinks);
        } else {
            bindLinks();
        }
    }

    global.CGoMarkdownViewer = Object.freeze({
        open: open,
        renderMarkdown: renderMarkdown,
        bindLinks: bindLinks
    });
})(typeof window !== 'undefined' ? window : globalThis);
