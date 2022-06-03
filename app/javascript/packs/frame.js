import "core-js/stable";
import "regenerator-runtime/runtime";

import jQuery from "jquery";

// jQuery aliases
window.jQuery = jQuery;
window.jquery = jQuery;
window.$ = jQuery;

// bootstrap
import { Alert, Button, Collapse, Dropdown, Modal, Popover, Tab, Tooltip } from "bootstrap";
const bootstrap = { Alert, Button, Collapse, Dropdown, Modal, Popover, Tab, Tooltip };
window.bootstrap = bootstrap;

import { initTooltips, onReady } from "util.js";
import { initClipboard } from "copy";

// Use a global dodona object to prevent polluting the global na
const dodona = window.dodona || {};
dodona.initTooltips = initTooltips;
dodona.onReady = onReady;
window.dodona = dodona;

// Initialize clipboard.js
initClipboard();

$(initTooltips);
