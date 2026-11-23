import { clamp } from './utils.js';

export function createLeaf(windowId) {
  if (!windowId) throw new TypeError('windowId 不能为空');
  return { type: 'leaf', windowId: String(windowId) };
}

export function createSplit(axis, ratio, first, second, id = null) {
  if (!['horizontal', 'vertical'].includes(axis)) throw new TypeError('axis 必须是 horizontal 或 vertical');
  if (!first || !second) throw new TypeError('分割节点必须有两个子节点');
  return {
    type: 'split',
    id: id || `split-${Math.random().toString(36).slice(2, 10)}`,
    axis,
    ratio: clamp(ratio, 0.1, 0.9),
    first,
    second,
  };
}

export function splitLeaf(tree, targetWindowId, newWindowId, options = {}) {
  if (!tree) return createLeaf(newWindowId);
  if (tree.type === 'leaf') {
    if (tree.windowId !== targetWindowId) return tree;
    const existing = createLeaf(tree.windowId);
    const incoming = createLeaf(newWindowId);
    return createSplit(
      options.axis || 'vertical',
      options.ratio ?? 0.5,
      options.position === 'before' ? incoming : existing,
      options.position === 'before' ? existing : incoming,
      options.id,
    );
  }
  return {
    ...tree,
    first: splitLeaf(tree.first, targetWindowId, newWindowId, options),
    second: splitLeaf(tree.second, targetWindowId, newWindowId, options),
  };
}

export function removeLeaf(tree, windowId) {
  if (!tree) return null;
  if (tree.type === 'leaf') return tree.windowId === windowId ? null : tree;
  const first = removeLeaf(tree.first, windowId);
  const second = removeLeaf(tree.second, windowId);
  if (!first) return second;
  if (!second) return first;
  return { ...tree, first, second };
}

export function updateSplitRatio(tree, splitId, ratio) {
  if (!tree || tree.type === 'leaf') return tree;
  if (tree.id === splitId) return { ...tree, ratio: clamp(ratio, 0.1, 0.9) };
  return {
    ...tree,
    first: updateSplitRatio(tree.first, splitId, ratio),
    second: updateSplitRatio(tree.second, splitId, ratio),
  };
}

export function listLeaves(tree, result = []) {
  if (!tree) return result;
  if (tree.type === 'leaf') result.push(tree.windowId);
  else {
    listLeaves(tree.first, result);
    listLeaves(tree.second, result);
  }
  return result;
}

export function calculateLayout(tree, bounds, options = {}, result = { windows: new Map(), handles: [] }) {
  if (!tree) return result;
  if (tree.type === 'leaf') {
    result.windows.set(tree.windowId, { ...bounds });
    return result;
  }
  const handleSize = options.handleSize ?? 6;
  const minSize = options.minSize ?? 120;
  const total = tree.axis === 'vertical' ? bounds.width : bounds.height;
  const available = Math.max(0, total - handleSize);
  const firstSize = clamp(available * tree.ratio, Math.min(minSize, available), Math.max(0, available - minSize));
  const secondSize = Math.max(0, available - firstSize);
  let firstBounds;
  let secondBounds;
  let handle;
  if (tree.axis === 'vertical') {
    firstBounds = { ...bounds, width: firstSize };
    secondBounds = { ...bounds, x: bounds.x + firstSize + handleSize, width: secondSize };
    handle = { id: tree.id, axis: tree.axis, x: bounds.x + firstSize, y: bounds.y, width: handleSize, height: bounds.height };
  } else {
    firstBounds = { ...bounds, height: firstSize };
    secondBounds = { ...bounds, y: bounds.y + firstSize + handleSize, height: secondSize };
    handle = { id: tree.id, axis: tree.axis, x: bounds.x, y: bounds.y + firstSize, width: bounds.width, height: handleSize };
  }
  result.handles.push(handle);
  calculateLayout(tree.first, firstBounds, options, result);
  calculateLayout(tree.second, secondBounds, options, result);
  return result;
}

export function validateLayoutTree(value, knownWindowIds = null, depth = 0) {
  if (!value || depth > 32) return null;
  if (value.type === 'leaf') {
    if (typeof value.windowId !== 'string') return null;
    if (knownWindowIds && !knownWindowIds.has(value.windowId)) return null;
    return createLeaf(value.windowId);
  }
  if (value.type !== 'split' || !['horizontal', 'vertical'].includes(value.axis)) return null;
  const first = validateLayoutTree(value.first, knownWindowIds, depth + 1);
  const second = validateLayoutTree(value.second, knownWindowIds, depth + 1);
  if (!first || !second) return first || second;
  return createSplit(value.axis, value.ratio, first, second, typeof value.id === 'string' ? value.id : null);
}
