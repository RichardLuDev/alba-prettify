'use strict';

describe('Prettify.Address', function(){
  var Prettify = require('../scripts/prettify');
  
  var address;
  var status = Prettify.Address.Status.NEW;
  var language = 'Chinese Mandarin';
  var geocode = ['40', '-80'];
  
  beforeEach(function() {
    address = new Prettify.Address({
      status: status,
      language: language,
      geocode: geocode,
    });
  });
  
  afterEach(function() {
    address = undefined;
  });
  
  it('is created from a dictionary of properties', function() {
    expect(address.status).toEqual(status);
    expect(address.language).toEqual(language);
    expect(address.geocode).toEqual(geocode);
  });
  
  it('has a static method to filter doable calls by default', function() {
    expect(Prettify.Address.filter([address])).toEqual([address]);
    address.status = Prettify.Address.Status.NOT_VALID;
    expect(Prettify.Address.filter([address])).toEqual([]);
  });
  
  it('has a static method to get the extreme values of lat and lng', function() {
    var address2 = new Prettify.Address({
      geocode: ['50', '-90'],
    });
    expect(Prettify.Address.extremes([address, address2])).toEqual({
      avg: [45, -85],
      min: [40, -90],
      max: [50, -80],
    });
  });
});