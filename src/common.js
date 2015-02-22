// Debug flags
var Debug = {
	ANALYTICS: false,
};

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
var STORAGE_ADD_ZOOM_MAP = 'add-zoom-map';

// Options: ID -> default value
var Options = {};
Options[STORAGE_REMOVE_NAMES] = false;
Options[STORAGE_REMOVE_MARKERS] = false;
Options[STORAGE_ADD_ZOOM_MAP] = true;

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