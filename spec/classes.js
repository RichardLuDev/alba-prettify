'use strict';

describe('Prettify.Address', function(){
  var address;
  var status = Prettify.Address.Status.NEW;
  var language = 'Chinese Mandarin';
  
  beforeEach(function() {
    address = new Prettify.Address({
      status: status,
      language: language,
    });
  });
  
  afterEach(function() {
    address = undefined;
  });
  
  it('is created from a dictionary of properties', function() {
    expect(address.status).toEqual(status);
    expect(address.language).toEqual(language);
  });
  
  it('has a static method to filter doable calls by default', function() {
    expect(Prettify.Address.filter([address])).toEqual([address]);
    address.status = Prettify.Address.Status.NOT_VALID;
    expect(Prettify.Address.filter([address])).toEqual([]);
  });
});