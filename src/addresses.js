'use strict';

var ADDRESSES = 'addresses';
var SAVE_ID = 'alba-prettify-export-save';

var numToString = function(number, digits) {
	var string = number.toString();
	if (digits !== undefined && digits > string.length) {
		string = Array(digits - string.length + 1).join('0') + string;
	}
	return string;
};

var formatDate = function(date) {
	return [date.getFullYear(),
					numToString(date.getMonth() + 1, 2),
					numToString(date.getDate(), 2)].join('-');
};

var exportButton = document.querySelector('.cmd-export');
exportButton.addEventListener('click', function addStuff() {
	exportButton.removeEventListener('click', addStuff);
	console.log('addStuff');
	
	var saveElement = document.createElement('button');
	saveElement.id = SAVE_ID;
	saveElement.title = 'Added by Alba Prettify';
	var saveText = document.createTextNode('Save backup file');
	saveElement.appendChild(saveText);
	this.parentNode.insertBefore(saveElement, this);
	saveElement.disabled = true;
	
	saveElement.addEventListener('click', function(e) {
		// Download the textarea as file.
		var text = document.querySelector('#export').textContent;
		var blob = new Blob([text], {type: 'text/plain'});
		var date = new Date();
		var name = formatDate(date) + ' ' + 'Alba Backup.txt';
		var link = document.createElement('a');
		link.download = name;
		link.href = window.URL.createObjectURL(blob);
		link.click();
		// Prevent page from reloading.
		e.preventDefault();
		
		Analytics.recordEvent(ADDRESSES, 'click', SAVE_ID);
	});

	// Focus is the only event that reliably fires after pressing export.
	var exportBox = document.querySelector('#export');
	exportBox.addEventListener('focus', function disableSaveElement() {
		exportBox.removeEventListener('focus', disableSaveElement);
		saveElement.disabled = false;
	});
});