define(function() {
  'use strict';

  // Analytics reporting functions
  var Analytics = {};
  Analytics.recordEvent = function(category, action, label, value) {
    chrome.runtime.sendMessage({
      type: 'analytics',
      object: {
        hitType: 'event',
        eventCategory: category,
        eventAction: action,
        eventLabel: label,
        eventValue: value,
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
      type: 'analytics',
      object: {
        hitType: 'pageview',
        page: page,
        title: title,
      },
    });
  };
  
  return Analytics;
});  // define