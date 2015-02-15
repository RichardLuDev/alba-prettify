var recordEvent = function(category, action, label, value) {
	chrome.runtime.sendMessage({
		'type': 'analytics',
		'object': {
			'hitType': 'event',
			'category': category,
			'action': action,
			'label': label,
			'value': value,
		},
	});
};

var recordPageView = function() {
	chrome.runtime.sendMessage({
		'type': 'analytics',
		'object': {
			'hitType': 'pageview',
			'page': location.pathname + location.search + location.hash,
			'title': document.title,
		},
	});
};