'use strict';

var campaignText = document.querySelector('input.input-medium');
campaignText.addEventListener('change', function(e) {
	var printAnchors =
			document.querySelectorAll('a.alba-prettify-print-shortcut-link');
	for (var idx = 0; idx < printAnchors.length; ++idx) {
		var printAnchor = printAnchors[idx];
		printAnchor.href = printAnchor.href.replace(/&c=.*$/, '');
		printAnchor.href += '&c=' + encodeURIComponent(campaignText.value);
	}
});

var addPrintButtons = function() {
	var buttonGroups = document.querySelectorAll('.btn-group');
	if (buttonGroups.length == 0) {
		setTimeout(addPrintButtons, 250);
	} else {
		for (var idx = 0; idx < buttonGroups.length; ++idx) {
			var buttonGroup = buttonGroups[idx];
			var printAnchor = document.createElement('a');
			printAnchor.className = 'alba-prettify-print-shortcut-link';
			printAnchor.href = buttonGroup.querySelector('a.cmd-print').rel;
			printAnchor.innerHTML = '<i class="icon-print"></i>';
			printAnchor.target = '_blank';
			printAnchor.title = 'Added by Alba Prettify';
			buttonGroup.insertBefore(printAnchor, buttonGroup.firstChild);
		}
	}
};

addPrintButtons();