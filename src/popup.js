'use strict';

var POPUP = 'popup';
var BUTTON_RESET_DEFAULT = 'reset-default';

Analytics.recordEvent(POPUP, 'open');

var addClickHandlersForOptions = function() {
	for (var property in Options) {
		// Must use closure here to capture current property value.
		(function(name) {
			// Must check click event in order to have the checked attribute.
			var optionElement = document.getElementById(name);
			optionElement.addEventListener('click', function() {
				var items = {};
				items[name] = this.checked;
				chrome.storage.sync.set(items, function() {
					Analytics.recordEvent(POPUP, 'click', name);
				});
			});
		})(property);
	}
};

var loadAndSetOptionValues = function(callback) {
	chrome.storage.sync.get(Object.keys(Options), function(items) {
		// Iterate over Options since items may not contain all the keys.
		for (var name in Options) {
			// Difference between default and user selected is in whether the value is
			// undefined or whether it has a value.
			var value = items[name];
			if (value === undefined) {
				value = Options[name];
			}
			var optionElement = document.getElementById(name);
			optionElement.checked = value;
		}
		if (callback !== undefined) {
			callback();
		}
	});
};

var resetButton = document.getElementById(BUTTON_RESET_DEFAULT);
resetButton.addEventListener('click', function() {
	resetButton.disabled = true;
	chrome.storage.sync.clear(function() {
		loadAndSetOptionValues(function() {
			resetButton.disabled = false;
		});
	})
});

(function() {
	// Add version number to subject of feedback email.
	var feedbackLink = document.getElementById('feedback-link');
	feedbackLink.href += '?subject=v' + Extension.getVersion() + ' Feedback';
	
	addClickHandlersForOptions();
	loadAndSetOptionValues();
})();