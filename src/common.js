// Debug flags
var DEBUG_ANALYTICS = false;

// Extension property shortcuts
var Extension = {};
Extension.getVersion = function() {
	return chrome.runtime.getManifest().version;
};
Extension.isDevMode = function() {
    return !('update_url' in chrome.runtime.getManifest());
};

// Storage keys, using variables as typos become errors.
var STORAGE_VERSION = 'version';
var STORAGE_REMOVE_MARKERS = 'remove-markers';
var STORAGE_REMOVE_NAMES = 'remove-names';
var STORAGE_REMOVE_LEGEND = 'remove-legend';
var STORAGE_ADD_ASSIGNMENT_BOX = 'add-assignment-box';
var STORAGE_ADD_MAP = 'add-map';
var STORAGE_ADD_ZOOM_MAP = 'add-zoom-map';
var STORAGE_ADD_MOBILE_CODE = 'add-mobile-code';

// Options: ID -> default value
var Options = {};
Options[STORAGE_REMOVE_NAMES] = false;
Options[STORAGE_REMOVE_MARKERS] = false;
Options[STORAGE_REMOVE_LEGEND] = true;
Options[STORAGE_ADD_ASSIGNMENT_BOX] = true;
Options[STORAGE_ADD_MAP] = true;
Options[STORAGE_ADD_ZOOM_MAP] = true;
Options[STORAGE_ADD_MOBILE_CODE] = false;

// Analytics reporting functions
var Analytics = {};
Analytics.recordEvent = function(category, action, label, value) {
	chrome.runtime.sendMessage({
		'type': 'analytics',
		'object': {
			'hitType': 'event',
			'eventCategory': category,
			'eventAction': action,
			'eventLabel': label,
			'eventValue': value,
		},
	});
};
Analytics.recordPageView = function(page, title) {
	if (page === undefined) {
		page = location.pathname + location.search + location.hash;
	}
	if (title === undefined) {
		title = document.title;
	}
	chrome.runtime.sendMessage({
		'type': 'analytics',
		'object': {
			'hitType': 'pageview',
			'page': page,
			'title': title,
		},
	});
};