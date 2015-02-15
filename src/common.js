var DEBUG = false;
var DEBUG_ANALYTICS = false;

var getVersion = function() {
	return chrome.runtime.getManifest().version;
};

var isDevMode = function() {
    return !('update_url' in chrome.runtime.getManifest());
}