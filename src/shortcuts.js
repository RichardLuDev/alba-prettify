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
	$('input.next').click();
};
var rep = function(action, timeout, next) {
	return function() {
		action();
		setTimeout(next, timeout);
	};
};
var auto = function() {
	rep(expandAll, 1000,
	rep(clearPostalCode, 1000,
	rep(saveAll, 20000,
	rep(nextPage, 1000,
		auto))))();
};
auto();