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

// Storage key names
var Storage = {
	VERSION: 'version',
	REMOVE_MARKERS: 'remove-markers',
	REMOVE_NAMES: 'remove-names',
};

// Options: ID -> default value
var Options = {};
Options[Storage.REMOVE_NAMES] = false;
Options[Storage.REMOVE_MARKERS] = false;

// Analytics reporting functions
var Analytics = {};
Analytics.recordEvent = function(category, action, label, value) {
	chrome.runtime.sendMessage({
		'type': 'analytics',
		'object': {
			'hitType': 'event',
			'category': category,
			'action': action,
			'label': label,
			'value': value,
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