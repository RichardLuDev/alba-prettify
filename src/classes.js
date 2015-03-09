'use strict';

// Namespace for classes
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