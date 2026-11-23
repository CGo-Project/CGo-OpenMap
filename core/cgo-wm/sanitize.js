const ALLOWED_TAGS = new Set([
  'svg', 'g', 'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon', 'title', 'desc', 'defs',
  'lineargradient', 'radialgradient', 'stop', 'clippath', 'mask', 'use',
]);

const ALLOWED_ATTRIBUTES = new Set([
  'viewbox', 'width', 'height', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'd',
  'points', 'fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
  'stroke-opacity', 'opacity', 'transform', 'preserveaspectratio', 'role', 'aria-hidden', 'aria-label',
  'focusable', 'id', 'offset', 'stop-color', 'stop-opacity', 'clip-path', 'mask', 'href', 'xlink:href',
]);

const SAFE_COLOR_OR_REFERENCE = /^(?:none|currentColor|transparent|#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%deg]+\)|url\(#[a-zA-Z0-9_.:-]+\))$/i;

function isSafeAttribute(name, value) {
  const lowerName = name.toLowerCase();
  if (!ALLOWED_ATTRIBUTES.has(lowerName) || lowerName.startsWith('on')) return false;
  if (lowerName === 'href' || lowerName === 'xlink:href') return /^#[a-zA-Z0-9_.:-]+$/.test(value);
  if (['fill', 'stroke', 'stop-color', 'clip-path', 'mask'].includes(lowerName)) {
    return SAFE_COLOR_OR_REFERENCE.test(value.trim());
  }
  return !/javascript:|data:text\/html|<|>/i.test(value);
}

export function createSanitizedSvg(documentRef, markup) {
  if (!documentRef?.defaultView?.DOMParser || typeof markup !== 'string' || markup.length > 50_000) return null;
  const parser = new documentRef.defaultView.DOMParser();
  const parsed = parser.parseFromString(markup, 'image/svg+xml');
  const root = parsed.documentElement;
  if (!root || root.localName.toLowerCase() !== 'svg' || parsed.querySelector('parsererror')) return null;

  for (const element of [...root.querySelectorAll('*'), root]) {
    const tagName = element.localName.toLowerCase();
    if (!ALLOWED_TAGS.has(tagName)) {
      element.remove();
      continue;
    }
    for (const attribute of [...element.attributes]) {
      if (!isSafeAttribute(attribute.name, attribute.value)) element.removeAttribute(attribute.name);
    }
  }

  const imported = documentRef.importNode(root, true);
  imported.setAttribute('aria-hidden', 'true');
  imported.setAttribute('focusable', 'false');
  return imported;
}

export function appendSafeVisual(container, value, options = {}) {
  if (!container || !value) return false;
  const documentRef = container.ownerDocument;
  if (typeof value === 'string' && value.trim().startsWith('<svg')) {
    const svg = createSanitizedSvg(documentRef, value);
    if (!svg) return false;
    container.replaceChildren(svg);
    return true;
  }
  if (options.iconElementFactory && typeof value === 'string') {
    const icon = options.iconElementFactory(value, documentRef);
    if (icon) {
      container.replaceChildren(icon);
      return true;
    }
  }
  return false;
}
