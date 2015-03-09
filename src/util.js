var Util = (function() {
  var self = Object.freeze({
    getStreetFromAddress: function(address) {
      // /[,?#\d]* / - Matches the first bits of the street number, enforcing
      //    ending in space.
      // /[,\d]+[a-zA-Z]? / - All street addresses need at least one number, possibly
      //    followed by a unit letter.
      // /[\d]*[a-zA-Z]+(?!\d)/ - Street names can start with numbers, 1st,
      //    etc, but must not contain any letters followed by numbers, as
      //    those are postal codes.
      // ((?:[\d]*[a-zA-Z]+(?!\d) ?)*) - Capture the full street name,
      //    which can start with any numbers (132nd) but cannot contain numbers in
      //    the middle or end, must have at least one letter (excludes US postal
      //    code), and possibly repeats with 'St W'.
      return /[,?#\d ]*[,\d]+[a-zA-Z]? ((?:[\d]*[a-zA-Z]+(?!\d) ?)*)/.exec(address)[1].trim();
    },
    
    replaceNumber: function(original, number) {
      return original.replace(/[\d]+/, number);
    },
    
    parseQueryString: function(queryString) {
      var params = {};
      var queries = queryString.split("&");
      for (var i = 0; i < queries.length; i++ ) {
        var temp = queries[i].split('=');
        if (temp.length === 1) {
          params[temp[0]] = '';
        } else {
          params[temp[0]] = temp[1];
        }
      }
      return params;
    },
    
    removeElement: function(element) {
      // Using parentNode instead of parentElement it covers the document case
      // as well.
      return element.parentNode.removeChild(element);
    },
    
    removeElements: function(elements) {
      for (var i = 0; i < elements.length; ++i) {
        self.removeElement(elements[i]);
      }
    },
    
    insertAfter: function(element, reference) {
      return reference.parentNode.insertBefore(element, reference.nextSibling);
    },
  });
  return self;
})();