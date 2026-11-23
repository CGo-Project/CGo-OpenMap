export const CGOWM_VERSION = '0.1.0';
export const STORAGE_SCHEMA_VERSION = 1;
export const DEFAULT_MOBILE_BREAKPOINT = 640;
export const DEFAULT_HOT_ZONE = 20;
export const DEFAULT_SNAP_THRESHOLD = 10;
export const DEFAULT_SIDEBAR_WIDTH = 280;
export const SIDEBAR_RAIL_WIDTH = 44;
export const MIN_SIDEBAR_WIDTH = 168;
export const MAX_SIDEBAR_WIDTH = 560;

export const DESKTOP_MODES = Object.freeze(['window', 'float', 'sidebar']);
export const MOBILE_MODES = Object.freeze(['sheet', 'modal', 'fullscreen', 'embedded', 'none']);
export const ALL_MODES = Object.freeze([...DESKTOP_MODES, ...MOBILE_MODES]);
export const LIFECYCLE_STATES = Object.freeze(['registered', 'visible', 'minimized', 'hidden', 'destroyed']);
export const MINIMIZE_MODES = Object.freeze(['statusbar', 'collapse', 'hide']);
export const MOBILE_DETENTS = Object.freeze(['collapsed', 'half', 'full']);

export const DEFAULT_CONFIG = Object.freeze({
  mode: 'float',
  allowModes: ['float'],
  showTitleBar: true,
  showClose: true,
  showMinimize: true,
  showMaximize: false,
  minimizeMode: 'collapse',
  statusBarTarget: '#status-bar .status-right, #status-bar .status-right',
  defaultWidth: 320,
  defaultHeight: 'auto',
  dockHeight: 'auto',
  minWidth: 240,
  minHeight: 120,
  resizable: true,
  groupable: true,
  defaultPosition: null,
  rememberPosition: true,
  zGroup: 'panel',
  mobileMode: 'sheet',
  mobileDetents: ['collapsed', 'half', 'full'],
  mobileDefaultDetent: 'half',
  mobileResizable: true,
  mobileShowTitleBar: true,
  mobileGrabber: true,
  mobileAlwaysAvailable: false,
  mobileGroup: 'primary',
  mobileSlot: 'pill',
  sidebarSide: 'left',
  shortTitle: '',
  badge: '',
  unavailable: false,
});

export const Z_GROUP_BASE = Object.freeze({
  panel: 1000,
  sidebar: 9000,
  overlay: 10000,
  dialog: 12000,
  snap: 99999,
});
