'use strict';

var BACKGROUND = 'background';

// Google analytics tracking only for live extension or testing.
if (!Extension.isDevMode() || DEBUG_ANALYTICS) {
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-12588142-8', 'auto');
  ga('set', 'checkProtocolTask', null);  // http://stackoverflow.com/a/22152353
  
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === 'analytics') {
      ga('send', request.object);
    }
  });
}

chrome.runtime.onInstalled.addListener(function(details) {
  // Record version change events exactly once per user.
  chrome.storage.sync.get(STORAGE_VERSION, function(items) {
    var version = Extension.getVersion();
    if (items[STORAGE_VERSION] !== version) {
      var items = {};
      items[STORAGE_VERSION] = version;
      chrome.storage.sync.set(items, function() {
        Analytics.recordEvent(BACKGROUND, 'start', version);
      });
    }
  });
  
  // Show page action only on baseloc print page
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: { urlMatches: 'http://www.baseloc.com/alba/print*' },
        }),
      ],
      actions: [ new chrome.declarativeContent.ShowPageAction() ],
    }]);
  });
});