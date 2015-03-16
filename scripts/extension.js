module.exports = (function() {
  var Extension = {};
  Extension.getVersion = function() {
    return chrome.runtime.getManifest().version;
  };
  Extension.isDevMode = function() {
    return !('update_url' in chrome.runtime.getManifest());
  };
  return Extension;
})();