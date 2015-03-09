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
  for (let address of addresses) {
    if (address.status !== Prettify.Address.Status.NOT_VALID) {
      goodAddresses.push(address);
    }
  }
  return goodAddresses;
};