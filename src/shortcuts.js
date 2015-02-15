var DEBUG = true;
var expandAll = function() {
	DEBUG && console.log('expand');
	$($('#addresses')[0].childNodes).each(function(index, element) {
		element.click();
	});
};
var clearPostalCode = function() {
	DEBUG && console.log('clear');
	$('input[name="postcode"]').val(function(index, value) {
		return '';
	})
};
var saveAll = function() {
	DEBUG && console.log('save');
	$(".cmd-save").each(function(index, element) {
		element.click();
	})
};
var nextPage = function() {
	DEBUG && console.log('next');
	if ($('input.next').prop('disabled')) {
		return false;
	}
	$('input.next').click();
};
var prevPage = function() {
	DEBUG && console.log('prev');
	if ($('input.prev').prop('disabled')) {
		return false;
	}
	$('input.prev').click();
};
var rep = function(action, timeout, next) {
	return function() {
		if (action() !== false) {
			setTimeout(next, timeout);
		}
	};
};
var stopAll = function() {
	var id = window.setTimeout(function() {}, 0);
	while (id--) {
		window.clearTimeout(id); // will do nothing if no timeout with id is present
	}
};
var auto = function() {
	rep(expandAll, 1000,
	rep(clearPostalCode, 1000,
	rep(saveAll, 20000,
	rep(nextPage, 1000,
		auto))))();
};