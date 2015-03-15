module.exports = (function() {
  'use strict';

  var Prettify = function() {};

  // A single address.
  Prettify.Address = function(properties) {
    for (var property in properties) {
      this[property] = properties[property];
    }
  };

  Prettify.Address.Status = {
    NEW: 'New',
    NOT_VALID: 'Not valid',
  };

  Prettify.Address.filter = function(addresses) {
    var goodAddresses = [];
    for (var i = 0; i < addresses.length; ++i) {
      if (addresses[i].status !== Prettify.Address.Status.NOT_VALID) {
        goodAddresses.push(addresses[i]);
      }
    }
    return goodAddresses;
  };

  Prettify.Address.extremes = function(addresses) {
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    var avgX = 0, avgY = 0;
    var geocode;
    for (var i = 0; i < addresses.length; ++i) {
      geocode = addresses[i].geocode.map(parseFloat);
      minX = Math.min(minX, geocode[0]);
      minY = Math.min(minY, geocode[1]);
      maxX = Math.max(maxX, geocode[0]);
      maxY = Math.max(maxY, geocode[1]);
      avgX += geocode[0];
      avgY += geocode[1];
    }
    if (addresses.length > 0) {
      avgX /= addresses.length;
      avgY /= addresses.length;
    }
    return {
      avg: [avgX, avgY],
      min: [minX, minY],
      max: [maxX, maxY],
    };
  };
  
  return Prettify;
})();