export type DesktopMode = 'window' | 'float' | 'sidebar';
export type MobileMode = 'sheet' | 'modal' | 'fullscreen' | 'embedded' | 'none';
export type MobileDetent = 'collapsed' | 'half' | 'full';
export type LifecycleState = 'registered' | 'visible' | 'minimized' | 'hidden' | 'destroyed';

export interface ElementContent { kind: 'element'; element: HTMLElement }
export interface FactoryContent {
  kind: 'factory';
  mount(container: HTMLElement, context: unknown): void | (() => void);
  unmount?(container: HTMLElement, context: unknown): void;
}
export interface IframeContent {
  kind: 'iframe';
  src: string;
  title?: string;
  sandbox?: string;
  allow?: string;
  loading?: 'eager' | 'lazy';
  referrerPolicy?: ReferrerPolicy;
}

export interface CgoWindowConfig {
  programId: string;
  panelId: string;
  title?: string;
  shortTitle?: string;
  badge?: string;
  unavailable?: boolean;
  titleSvg?: string;
  icon?: string;
  className?: string;
  elementId?: string;
  content?: HTMLElement | ElementContent | FactoryContent | IframeContent;
  mode?: DesktopMode;
  allowModes?: DesktopMode[];
  mobileMode?: MobileMode;
  mobileDetents?: MobileDetent[];
  mobileDefaultDetent?: MobileDetent;
  mobileSlot?: 'pill' | 'action';
  showTitleBar?: boolean;
  showClose?: boolean;
  showMinimize?: boolean;
  showMaximize?: boolean;
  minimizeMode?: 'statusbar' | 'collapse' | 'hide';
  statusBarTarget?: string;
  defaultWidth?: number;
  defaultHeight?: number | 'auto';
  dockHeight?: number | 'auto';
  minWidth?: number;
  minHeight?: number;
  resizable?: boolean;
  groupable?: boolean;
  rememberPosition?: boolean;
  openOnRegister?: boolean;
  [key: string]: unknown;
}

export class CgoWindowInstance {
  readonly key: string;
  readonly element: HTMLElement;
  readonly contentElement: HTMLElement;
  readonly state: Record<string, unknown>;
  open(options?: { restoreLifecycle?: boolean; focusMobile?: boolean; scrollIntoView?: boolean }): this;
  close(): boolean;
  destroy(): boolean;
  minimize(): boolean;
  restore(options?: { scrollIntoView?: boolean }): boolean;
  setMode(mode: DesktopMode, options?: { side?: 'left' | 'right' }): boolean;
  setMobileDetent(detent: MobileDetent): boolean;
  update(patch: Partial<CgoWindowConfig>): boolean;
  toggleMaximize(): boolean;
  bringToFront(): boolean;
  applyGeometry(): void;
}

export class CgoWindowManager {
  constructor(options?: Record<string, unknown>);
  init(hostConfig?: Record<string, unknown>): CgoWmApi;
  register(config: CgoWindowConfig): CgoWindowInstance;
  dispose(): void;
}

export interface CgoWmApi {
  version: string;
  register(config: CgoWindowConfig): CgoWindowInstance;
  update(key: string, patch: Partial<CgoWindowConfig>): boolean;
  open(key: string, options?: { restoreLifecycle?: boolean; focusMobile?: boolean; scrollIntoView?: boolean }): CgoWindowInstance | null;
  close(key: string): boolean;
  destroy(key: string): boolean;
  minimize(key: string): boolean;
  restore(key: string, options?: { scrollIntoView?: boolean }): boolean;
  isMinimized(key: string): boolean;
  setMode(key: string, mode: DesktopMode, options?: { side?: 'left' | 'right' }): boolean;
  get(key: string): CgoWindowInstance | null;
  list(): CgoWindowInstance[];
  bringToFront(key: string): boolean;
  setMobileDetent(key: string, detent: MobileDetent): boolean;
  getMobileDetent(key: string): MobileDetent | null;
  on(event: string, handler: (detail: unknown) => void): () => void;
  off(event: string, handler: (detail: unknown) => void): void;
  alert(message: string, options?: Record<string, unknown>): Promise<boolean>;
  confirm(message: string, options?: Record<string, unknown>): Promise<boolean>;
  prompt(message: string, options?: Record<string, unknown>): Promise<string | null>;
  dialog(options?: Record<string, unknown>): CgoWindowInstance;
  openRemote(...args: unknown[]): Promise<Record<string, unknown>>;
  getWorkArea(): { top: number; bottom: number; left: number; right: number; width: number; height: number; viewportWidth: number; viewportHeight: number };
  getSidebarWidth(side: 'left' | 'right'): number;
  setSidebarWidth(side: 'left' | 'right', width: number): number;
  isSingleSidebarActive(): boolean;
  getSidebarDisplayState(side: 'left' | 'right'): 'hidden' | 'expanded' | 'rail';
  activateSidebar(side: 'left' | 'right', options?: { persist?: boolean }): boolean;
  collapseSidebarToRail(side: 'left' | 'right'): boolean;
  focusSidebarPanel(key: string, options?: { expandIfMinimized?: boolean; scrollIntoView?: boolean }): boolean;
  groupWindows(targetKey: string, incomingKey: string): boolean;
  ungroupWindow(key: string): boolean;
  setActiveTab(hostKey: string, tabKey: string, options?: { scrollIntoView?: boolean }): boolean;
  hasPersistedState(key: string): boolean;
  isWorkspaceInitialized(): boolean;
  markWorkspaceInitialized(): void;
  resetWorkspace(options?: { preserveAddons?: boolean }): void;
  getWorkspaceSnapshot(): Record<string, unknown> | null;
  configureHost(patch: Record<string, unknown>): CgoWmApi;
  setMobileDockDucking(active: boolean): boolean;
  setActiveMobilePanel(key: string, options?: { expandIfCollapsed?: boolean; persist?: boolean }): boolean;
  getMobileWorkspaceState(): { schema: number; activeKey: string | null; detent: MobileDetent } | null;
  readonly addons: Record<string, unknown>;
  registerAddon(manifest: Record<string, unknown>): Record<string, unknown>;
  registerAddons(list: Record<string, unknown>[]): Record<string, unknown>[];
  openAddonManager(options?: Record<string, unknown>): CgoWindowInstance;
  registerCapability(name: string, handler: (payload: unknown, ctx: unknown) => unknown): () => void;
  invokeCapability(name: string, payload?: unknown): Promise<Record<string, unknown>>;
}

export function createCgoWindowManager(options?: Record<string, unknown>): CgoWindowManager;
export function getDefaultManager(windowRef?: Window): CgoWindowManager;
export function init(hostConfig?: Record<string, unknown>, windowRef?: Window): CgoWmApi;
export function registerBuiltinAddons(manager: CgoWindowManager, options?: Record<string, unknown>): Record<string, unknown>[];
export function resolveSiteRoot(manager: CgoWindowManager): string;
export function resolveVitoolRoot(manager: CgoWindowManager): string;
export function resolveCgoWmFlag(componentId: string, options?: Record<string, unknown>): boolean;
export function runWithCgoWmFallback(options: Record<string, unknown>): unknown;
export function createSidebarStateStore(options?: Record<string, unknown>): {
  storageKey: string;
  getSnapshot(): { schema: number; left: string[]; right: string[]; pinned: boolean; minimized: Record<string, boolean> };
  setLayout(patch: Record<string, unknown>): unknown;
  setMinimized(panelKey: string, minimized: boolean): unknown;
  remove(panelKey: string): unknown;
  clear(): unknown;
};
