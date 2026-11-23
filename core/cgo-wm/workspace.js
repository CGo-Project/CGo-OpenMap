import { DEFAULT_SNAP_THRESHOLD } from './constants.js';
import { clamp } from './utils.js';

/**
 * 计算浮动窗口拖拽时的磁吸对齐位置（对齐安全工作区及周围可见浮动窗口）。
 */
export function snapFloatingRect(rect, otherRects = [], workArea = {}, threshold = DEFAULT_SNAP_THRESHOLD) {
  const width = Math.max(0, Number(rect.width) || 0);
  const height = Math.max(0, Number(rect.height) || 0);
  const minX = 0;
  const maxX = Math.max(0, (workArea.viewportWidth || 4000) - width);
  const minY = Number.isFinite(workArea.top) ? workArea.top : 0;
  const maxY = Math.max(minY, (Number.isFinite(workArea.bottom) ? workArea.bottom : (workArea.viewportHeight || 4000)) - Math.min(height || 32, 32));

  let nextX = Number(rect.x) || 0;
  let nextY = Number(rect.y) || 0;
  let bestDx = threshold + 1;
  let bestDy = threshold + 1;
  let snappedX = false;
  let snappedY = false;

  const trySnapX = (candidateX) => {
    const delta = Math.abs(candidateX - nextX);
    if (delta <= threshold && delta < bestDx) {
      bestDx = delta;
      nextX = candidateX;
      snappedX = true;
    }
  };

  const trySnapY = (candidateY) => {
    const delta = Math.abs(candidateY - nextY);
    if (delta <= threshold && delta < bestDy) {
      bestDy = delta;
      nextY = candidateY;
      snappedY = true;
    }
  };

  if (threshold > 0) {
    if (Number.isFinite(workArea.left)) trySnapX(workArea.left);
    if (Number.isFinite(workArea.right)) trySnapX(workArea.right - width);
    trySnapX(0);
    if (Number.isFinite(workArea.viewportWidth)) trySnapX(workArea.viewportWidth - width);

    trySnapY(minY);
    if (Number.isFinite(workArea.bottom)) trySnapY(workArea.bottom - height);

    for (const other of otherRects) {
      if (!other) continue;
      // 横向吸附仅在纵向有接近或重叠时更自然，但也允许全局边对齐。
      trySnapX(other.left);
      trySnapX(other.right);
      trySnapX(other.left - width);
      trySnapX(other.right - width);

      trySnapY(other.top);
      trySnapY(other.bottom);
      trySnapY(other.top - height);
      trySnapY(other.bottom - height);
    }
  }

  nextX = clamp(nextX, minX, maxX);
  nextY = clamp(nextY, minY, maxY);

  return {
    x: Math.round(nextX),
    y: Math.round(nextY),
    snappedX,
    snappedY,
    snapped: snappedX || snappedY,
  };
}

/**
 * 将 incomingKey 合并进 targetKey 所在的 Tab 组合。
 */
export function mergeWindowIntoGroup(groups = [], targetKey, incomingKey, makeId = () => `group-${Date.now()}`) {
  if (!targetKey || !incomingKey || targetKey === incomingKey) return groups;
  const cleaned = removeWindowFromGroups(groups, incomingKey);
  const existingIndex = cleaned.findIndex((group) => group.keys.includes(targetKey));
  if (existingIndex !== -1) {
    return cleaned.map((group, index) => {
      if (index !== existingIndex) return group;
      const keys = group.keys.includes(incomingKey) ? group.keys : [...group.keys, incomingKey];
      return { ...group, keys, activeKey: incomingKey };
    });
  }
  return [
    ...cleaned,
    {
      id: makeId(),
      keys: [targetKey, incomingKey],
      activeKey: incomingKey,
    },
  ];
}

/**
 * 从 Tab 组合中移除指定窗口；若剩余成员少于 2 个则自动解散组合。
 */
export function removeWindowFromGroups(groups = [], key) {
  const next = [];
  for (const group of groups) {
    if (!group?.keys?.includes(key)) {
      if (group?.keys?.length >= 2) next.push({ ...group, keys: [...group.keys] });
      continue;
    }
    const keys = group.keys.filter((item) => item !== key);
    if (keys.length >= 2) {
      const activeKey = group.activeKey === key ? keys[0] : group.activeKey;
      next.push({ ...group, keys, activeKey: keys.includes(activeKey) ? activeKey : keys[0] });
    }
  }
  return next;
}

/**
 * 将 bottomKey 紧接在 topKey 之后加入浮动串联栈。
 */
export function attachWindowToStack(stacks = [], topKey, bottomKey, makeId = () => `stack-${Date.now()}`) {
  if (!topKey || !bottomKey || topKey === bottomKey) return stacks;
  const cleaned = detachWindowFromStacks(stacks, bottomKey);
  const index = cleaned.findIndex((stack) => stack.keys.includes(topKey));
  if (index !== -1) {
    return cleaned.map((stack, i) => {
      if (i !== index) return stack;
      const keys = [...stack.keys];
      const targetIdx = keys.indexOf(topKey);
      keys.splice(targetIdx + 1, 0, bottomKey);
      return { ...stack, keys };
    });
  }
  return [
    ...cleaned,
    {
      id: makeId(),
      keys: [topKey, bottomKey],
    },
  ];
}

/**
 * 将 key 从浮动串联栈中分离；若剩余不足 2 个则解散该栈。
 */
export function detachWindowFromStacks(stacks = [], key) {
  const next = [];
  for (const stack of stacks) {
    if (!stack?.keys?.includes(key)) {
      if (stack?.keys?.length >= 2) next.push({ ...stack, keys: [...stack.keys] });
      continue;
    }
    const keys = stack.keys.filter((item) => item !== key);
    if (keys.length >= 2) next.push({ ...stack, keys });
  }
  return next;
}

/**
 * 在侧边栏排序列表中重新插入指定窗口键。
 */
export function reorderKeyList(list = [], movingKey, targetIndex = -1) {
  const filtered = list.filter((key) => key !== movingKey);
  if (targetIndex < 0 || targetIndex >= filtered.length) {
    filtered.push(movingKey);
  } else {
    filtered.splice(targetIndex, 0, movingKey);
  }
  return filtered;
}
