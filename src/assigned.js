'use strict';

var PRINT_LINK_CLASS = 'alba-prettify-print-shortcut-link';
var INTERVAL = 500;

var campaignText = document.querySelector('input.input-medium');
campaignText.addEventListener('change', function(e) {
	var printAnchors =
			document.querySelectorAll('a.' + PRINT_LINK_CLASS);
	for (var idx = 0; idx < printAnchors.length; ++idx) {
		var printAnchor = printAnchors[idx];
		printAnchor.href = printAnchor.href.replace(/&c=.*$/, '');
		printAnchor.href += '&c=' + encodeURIComponent(campaignText.value);
	}
});

var checkPrintButtons = (function check() {
	var buttonGroups = document.querySelectorAll('.btn-group');
	if (buttonGroups.length !== 0) {
		var printAnchors = document.querySelectorAll('.' + PRINT_LINK_CLASS);
		if (printAnchors.length === 0) {
			for (var idx = 0; idx < buttonGroups.length; ++idx) {
				var buttonGroup = buttonGroups[idx];
				var printAnchor = document.createElement('a');
				printAnchor.className = PRINT_LINK_CLASS;
				printAnchor.href = buttonGroup.querySelector('a.cmd-print').rel;
				printAnchor.innerHTML = '<i class="icon-print"></i>';
				printAnchor.target = '_blank';
				printAnchor.title = ADDED_BY;
				buttonGroup.insertBefore(printAnchor, buttonGroup.firstChild);
			}
		}
	}
	setTimeout(check, INTERVAL);
})();