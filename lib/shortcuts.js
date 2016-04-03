var expandAll = function() {
  console.log('expand');
  $($('#addresses')[0].childNodes).each(function(index, element) {
    element.click();
  });
};
var clearPostalCode = function() {
  console.log('clear');
  $('input[name="postcode"]').val(function(index, value) {
    return '';
  });
};
var reGeocode = function() {
  console.log('geocode');
  var time = 100;
  $('.cmd-geocode').each(function(index, element) {
    setTimeout(function(){element.click()}, time);
    time += 100;
  });
};
var saveAll = function() {
  console.log('save');
  $(".cmd-save").each(function(index, element) {
    element.click();
  });
};
var nextPage = function() {
  console.log('next');
  if ($('input.next').prop('disabled')) {
    return false;
  }
  $('input.next').click();
};
var prevPage = function() {
  console.log('prev');
  if ($('input.prev').prop('disabled')) {
    return false;
  }
  $('input.prev').click();
};
var stopAll = function() {
  var id = window.setTimeout(function() {}, 0);
  while (id--) {
    window.clearTimeout(id); // will do nothing if no timeout with id is present
  }
};
var deleteAll = function() {
  var ids = document.querySelectorAll('td.muted small');
  for (var i = 0; i < ids.length; ++i) {
    var id = ids[i].textContent;
    fetch('http://www.baseloc.com/alba/ts?mod=addresses&cmd=delete&id=' + id, {  
      credentials: 'include'  
    }).then(function() {
      console.log('Deleted ' + id);
    });
  }
};
var rep = function(action, timeout, next) {
  return function() {
    if (action() !== false && next != null) {
      setTimeout(next, timeout);
    }
  };
};
var autoClearPostalCode = function() {
  rep(expandAll, 1000,
      rep(clearPostalCode, 1000,
          rep(saveAll, 20000,
              rep(nextPage, 1000, autoClearPostalCode))))();
};
var autoReGeocodePage = function() {
  rep(expandAll, 1000,
      rep(reGeocode, 10000,
          rep(saveAll, 0, null)))();
};