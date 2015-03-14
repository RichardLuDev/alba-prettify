define(function() {
  'use strict';

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

  var ADDED_BY = 'Added by Alba Prettify';

  // Storage keys, using variables as typos become errors.
  var STORAGE_VERSION = 'version';
  var STORAGE_ENABLE_EXTENSION = 'enable-extension';
  var STORAGE_AUTO_REFRESH = 'auto-refresh';
  var STORAGE_ACCURATE_MARKERS = 'accurate-markers';
  var STORAGE_REMOVE_PATH = 'remove-path';
  var STORAGE_REMOVE_MARKERS = 'remove-markers';
  var STORAGE_REMOVE_NAMES = 'remove-names';
  var STORAGE_REMOVE_LEGEND = 'remove-legend';
  var STORAGE_REMOVE_GEOCODE = 'remove-geocode';
  var STORAGE_SORT_STREET = 'sort-street';
  var STORAGE_ADD_ASSIGNMENT_BOX = 'add-assignment-box';
  var STORAGE_ADD_MAP = 'add-map';
  var STORAGE_ADD_ZOOM_MAP = 'add-zoom-map';
  var STORAGE_ADD_MOBILE_CODE = 'add-mobile-code';
  var STORAGE_ADD_NOT_VALID_NAMES = 'add-not-valid-names';

  // Options: ID -> default value
  var Options = {};
  Options[STORAGE_ENABLE_EXTENSION] = true;
  Options[STORAGE_AUTO_REFRESH] = true;
  Options[STORAGE_REMOVE_NAMES] = false;
  Options[STORAGE_REMOVE_PATH] = false;
  Options[STORAGE_ACCURATE_MARKERS] = true;
  Options[STORAGE_REMOVE_MARKERS] = false;
  Options[STORAGE_REMOVE_LEGEND] = true;
  Options[STORAGE_REMOVE_GEOCODE] = true;
  Options[STORAGE_SORT_STREET] = true;
  Options[STORAGE_ADD_ASSIGNMENT_BOX] = true;
  Options[STORAGE_ADD_MAP] = true;
  Options[STORAGE_ADD_ZOOM_MAP] = true;
  Options[STORAGE_ADD_MOBILE_CODE] = false;
  Options[STORAGE_ADD_NOT_VALID_NAMES] = false;
});  // define
