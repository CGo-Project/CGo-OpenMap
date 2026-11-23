export class EventEmitter {
  constructor(onError = null) {
    this.listeners = new Map();
    this.onError = onError;
  }

  on(event, handler) {
    if (typeof handler !== 'function') throw new TypeError('事件处理器必须是函数');
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    handlers.delete(handler);
    if (!handlers.size) this.listeners.delete(event);
  }

  emit(event, detail) {
    const handlers = [...(this.listeners.get(event) || []), ...(this.listeners.get('*') || [])];
    for (const handler of handlers) {
      try {
        handler(detail, event);
      } catch (error) {
        this.onError?.(error, { event, detail });
      }
    }
  }

  clear() {
    this.listeners.clear();
  }
}
