'use strict';

var parseQueryString = function(queryString) {
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
};

// Enforce we load the right page with as much data as possible.
chrome.storage.sync.get(STORAGE_ENABLE_EXTENSION, function(items) {
	if (items[STORAGE_ENABLE_EXTENSION] !== false) {
		var params = parseQueryString(location.search.substring(1));
		var needRefresh = false;
		var requiredParams = {
			nv: '',
			m: '1',  // Primary map
			o: '1',  // Overview map
			l: '1',  // Legend
			d: '1',  // Mobile QR code
			g: '1',  // GPS coordinates
		};
		for (var key in requiredParams) {
			if (params[key] === undefined ||
					params[key] !== requiredParams[key]) {
				params[key] = requiredParams[key];
				needRefresh = true;
			}
		}
		if (needRefresh) {
			var queryString = [];
			for (var key in params) {
				queryString.push(key + '=' + params[key]);
			}
			location.replace(
					location.origin + location.pathname + '?' + queryString.join('&'));
		}
	}
});

chrome.storage.onChanged.addListener(function(changes, areaName) {
	if (areaName === 'sync') {
		for (var property in changes) {
			if (property in Options) {
				chrome.storage.sync.get(STORAGE_AUTO_REFRESH, function(items) {
					if (items[STORAGE_AUTO_REFRESH] === false) {
						return;
					}
					location.reload();
				});
				return;
			}
		}
	}
});

var main = function(options) {
	Analytics.recordPageView();
	
	// Add custom CSS.
	var cssLink = document.createElement('link');
	cssLink.rel = 'stylesheet';
	cssLink.href = chrome.extension.getURL('res/print.css');
	document.head.appendChild(cssLink);

	/* Grab all elements that are to be manipulated later. */
	var bigMap = document.querySelector('.map');
	var overallCard = document.querySelector('.card');
	var campaignText = document.querySelector('.campaign');
	var smallMap = document.querySelector('.overview');
	var mobileCode = document.querySelector('.directions');
	var addressTable = document.querySelector('.addresses');
	
	var bigMapSrc = bigMap.getAttribute('SRC');
	var bigMapParent = bigMap.parentElement;
	var bigMapParentParent = bigMapParent.parentElement;
	var smallMapParent = smallMap.parentElement;
	var smallMapParentParent = smallMapParent.parentElement;
	var firstLegend = smallMapParent.nextSibling;
	var brElement = smallMapParent.previousSibling;
	var brElementParent = brElement.parentElement;
	var mobileCodeParent = mobileCode.parentElement;
	// Accommodate optional territory 'Notes'.
	var actualTitle = smallMapParent.previousSibling;  
	while (actualTitle.tagName != 'H1') {
		actualTitle = actualTitle.previousSibling;
	}
	var noteOrInfo = actualTitle.nextSibling;
	
	var orderedIds = [];
	var addressData = {};
	var addressRows = addressTable.querySelectorAll('tr');
	for (var idx = 0; idx < addressRows.length; ++idx) {
		var addressRow = addressRows[idx];
		var addressCells = addressRow.children;
		
		var idField = addressCells[0];
		var statusField = addressCells[1];
		var languageField = addressCells[2];
		var nameAndTelephoneField = addressCells[3];
		var addressField = addressCells[4];
		var notesField = addressCells[5];
		var boxesField = addressCells[6];
		
		var id = idField.querySelector('.muted').textContent;
		var status = statusField.querySelector('.status').textContent;
		var language = languageField.textContent;
		var name = nameAndTelephoneField.querySelector('strong').textContent;
		var telephone = nameAndTelephoneField.querySelector('span').textContent;
		var address = addressField.childNodes[0].trim();  // Text Node
		var geocode = addressField.querySelector('span').textContent
				.replace(/°/g, '').split(' ');
		var notes = notesField.textContent;
		
		orderedIds.push(id);
		addressData[id] = {
			status: status,
			language: language,
			name: name,
			telephone: telephone,
			address: address,
			geocode: geocode,
			notes: notes,
		};
	}
	
	var newTable = document.createElement('div');
	var invalidAddressTable = addressTable.cloneNode(true);
	newTable.appendChild(invalidAddressTable);
	var subheading = document.createElement('h2');
	subheading.innerText = 'Not Valid Calls';
	newTable.insertBefore(subheading, newTable.firstChild);
	var VALID_TABLE = 0;
	var INVALID_TABLE = 1;
	var NOT_VALID_STATUS = 'Not valid';
	var addressTables = [addressTable, invalidAddressTable];
	for (var idx = addressTables.length - 1; idx >= 0; idx--) {
		var addressTable = addressTables[idx];
		
		var thead = addressTable.getElementsByTagName('thead')[0];
		var headingRow = thead.getElementsByTagName('tr')[0];
		var headings = thead.getElementsByTagName('th');
		if (idx === INVALID_TABLE) {
			// Remove all but the status and address columns for invalids.
			for (var i = headings.length - 1; i >= 0; --i) {
				if (headings[i].innerText.toLowerCase() !== 'language' &&
						headings[i].innerText.toLowerCase() !== 'address' &&
						headings[i].innerText.toLowerCase() !== 'notes') {
					headingRow.removeChild(headings[i]);
				}
			}
			// Duplicate headings for second row.
			var len = headings.length;
			for (var i = 0; i < len; ++i) {
				headingRow.appendChild(headings[i].cloneNode(true));
			}
			// Add CSS class to separate the tables
			addressTable.classList.add('invalid');
		} else {
			if (options[STORAGE_REMOVE_NAMES]) {
				// Remove 'Name' in 'Name & Telephone'.
				for (var i = 0; i < headings.length; ++i) {
					if (headings[i].innerText.toLowerCase() ===
							'name & telephone') {
						headings[i].innerText = 'TELEPHONE';
						break;
					}
				}
			}
		}
		
		var tbody = addressTable.getElementsByTagName('tbody')[0];
		var trs = tbody.getElementsByTagName('tr');
		for (var i = trs.length - 1; i >= 0; --i) {
			var idField = trs[i].children[0];
			var statusField = trs[i].children[1];
			var language = trs[i].children[2];
			var nameAndTelephone = trs[i].children[3];
			var address = trs[i].children[4];
			var notes = trs[i].children[5];
			var checkboxes = trs[i].children[6];
			
			var status = statusField.innerText;
			// Separate rows based on table.
			if ((idx === INVALID_TABLE && status !== NOT_VALID_STATUS) ||
					(idx === VALID_TABLE && status === NOT_VALID_STATUS)) {
				tbody.removeChild(trs[i]);
				continue;
			}

			// Remove content.
			if (idx === INVALID_TABLE) {
				// Only keep language, address, and notes for invalid calls.
				trs[i].removeChild(idField);
				trs[i].removeChild(statusField);
				trs[i].removeChild(nameAndTelephone);
				trs[i].removeChild(checkboxes);
			} else {
				// Remove extra identifier for valid calls.
				if (idField.children.length > 1) {
					idField.removeChild(idField.children[1]);
				}
				
				if (options[STORAGE_REMOVE_NAMES]) {
					// Remove name.
					if (nameAndTelephone.children.length >= 2 &&
							nameAndTelephone.children[0].tagName === 'STRONG') {
						nameAndTelephone.removeChild(
								nameAndTelephone.children[0]);
					}
				}
			}
			
			// Bold language column.
			var languageText = language.innerText;
			if (languageText.indexOf('Chinese') !== -1) {
				// Chinese is redundant for Mandarin and Cantonese.
				languageText = languageText.split(' ')[1];
			}
			language.innerHTML = '<strong>' + languageText + '</strong>';

			// Remove geocode for both.
			if (address.children.length >= 1) {
				if (address.children[0].tagName === 'SPAN') {
					address.removeChild(address.children[0]);
				} else if (address.children[0].tagName === 'STRIKE') {
					var child = address.children[0];
					if (child.children.length >= 1 &&
							child.children[0].tagName === 'SPAN') {
						child.removeChild(child.children[0]);
					}
				}
			}
		}
		
		// Split invalid table into two.
		if (idx === INVALID_TABLE) {
			var mid = Math.ceil(trs.length / 2);
			for (var i = 0; i < mid; ++i) {
				var curRow = trs[i];
				// Account for odd numbered tables.
				if (mid >= trs.length) {
					for (var j = curRow.children.length - 1; j >= 0; --j) {
						curRow.appendChild(document.createElement('td'));
					}
					break;
				}
				var nextRow = trs[mid];
				for (var j = 0; j < nextRow.children.length; ++j) {
					curRow.appendChild(nextRow.children[j].cloneNode(true));
				}
				tbody.removeChild(nextRow);
			}
		// Color changes when street changes
		} else {
			// /[,?#\d]* / - Matches the first bits of the street number, enforcing
			//		ending in space.
			// /[\d]*[a-zA-Z]+(?!\d)/ - Street names can start with numbers, 1st,
			//		etc, but must not contain any letters followed by numbers, as
			//		those are postal codes.
			// ((?:[\d]*[a-zA-Z]+(?!\d) ?)*) - Capture the full street name,
			//		possibly repeats with 'St W'.
			var STREET_ADDRESS = /[,?#\d ]* ((?:[\d]*[a-zA-Z]+(?!\d) ?)*)/;
			var CSS_CLASSES = ['light', 'dark'];
			var css_index = 1;
			for (var i = 0; i < trs.length - 1; ++i) {
				trs[i].classList.add(CSS_CLASSES[css_index]);
				var curStreet = STREET_ADDRESS.exec(trs[i].children[4].innerText);
				var nextStreet = STREET_ADDRESS.exec(
						trs[i + 1].children[4].innerText);
				if (curStreet[1] !== nextStreet[1]) {
					css_index = 1 - css_index;
				}
			}
			if (trs.length) {
				trs[trs.length - 1].classList.add(CSS_CLASSES[css_index]);
			}
		}
	}
	
	// Only add Not Valid table if it is non-empty.
	if (newTable.getElementsByTagName('tr').length > 1) {
		overallCard.appendChild(newTable);
	}
	
	// Fix campaign text.
	if (campaignText) {
		var campaignTextParent = campaignText.parentElement;
		overallCard.insertBefore(campaignText, overallCard.firstChild);
		overallCard.removeChild(campaignTextParent);
	}
	
	// Remove territory notes
	if (noteOrInfo.children.length === 1 &&
			noteOrInfo.children[0].tagName === 'STRONG' &&
			noteOrInfo.children[0].innerText === 'Notes:') {
		var info = noteOrInfo.nextSibling;
		overallCard.removeChild(noteOrInfo);
		noteOrInfo = info;
	}
	
	// Remove mobile QR code
	if (options[STORAGE_ADD_MOBILE_CODE]) {
		overallCard.insertBefore(mobileCode, overallCard.firstChild);
	} else {
		if (mobileCode.firstElementChild) {
			mobileCode.firstElementChild.src = '';
		}
		mobileCodeParent.removeChild(mobileCode);
	}
	
	// Add assignment box with Name and stuff.
	if (options[STORAGE_ADD_ASSIGNMENT_BOX]) {
		var assignmentBox = document.createElement('DIV');
		assignmentBox.innerHTML =
				'Name:<span class="assignment-box-separator"></span>Return By:';
		assignmentBox.classList.add('assignment-box');
		overallCard.insertBefore(assignmentBox, overallCard.firstChild);
	}
	
	// Parse all markers.
	var src = bigMapSrc.split('?');
	src.shift();
	src = src.join('?');
	
	var params = parseQueryString(src);
	var markers = params.markers;
	if (typeof markers === 'string') {
		var vals = markers.split('|');
		markers = [''];
		var initial = '';
		for (var i=0;i<vals.length;i++) {
			if (vals[i][0] < '1' || vals[i][0] > '9') {
				initial += vals[i] + '|';
			} else {
				markers.push(vals[i]);
			}
		}
		markers[0] = initial;
	}
	var avgX = 0, avgY = 0;
	for (var i=1;i<markers.length;i++) {
		var vals = markers[i].split('|');
		var obj = {};
		obj.original = markers[i];
		for (var j=0;j<vals.length;j++) {
			if (vals[j].indexOf(',') !== -1) {
				var v = vals[j].split(',');
				obj.x = parseFloat(v[0]);
				obj.y = parseFloat(v[1]);
				avgX += obj.x;
				avgY += obj.y;
			} else {
				obj[j] = vals[j];
			}
		}
		markers[i] = obj;
	}
	if (markers.length > 1) {
		avgX /= markers.length - 1;
		avgY /= markers.length - 1;
	}
	
	if (options[STORAGE_ADD_ZOOM_MAP]) {
		// Make separate density map but with modified src.
		var newMap = bigMap.cloneNode(true);
		var avgLoc = avgX.toString() + ',' + avgY.toString();
		
		var mapSrc = bigMapSrc.replace('color:white', 'color:black');
		// Cleanup unused fields.
		mapSrc = mapSrc.replace(/format=[^&]+&?/g, '');
		mapSrc = mapSrc.replace(/sensor=[^&]+&?/g, '');
		if (options[STORAGE_REMOVE_MARKERS]) {
			mapSrc = mapSrc.replace(/markers=[^&]+&?/g, '');
		}
		mapSrc = mapSrc.replace(
				'staticmap?',
				'staticmap?center=' + avgLoc) + '&zoom=15';

		newMap.setAttribute('SRC', mapSrc);
		bigMapParentParent.insertBefore(newMap, bigMapParent.nextSibling);
		
		var title2 = actualTitle.cloneNode(true);
		title2.children[1].innerText += ' Zoomed-In Map';
		newMap.parentElement.insertBefore(title2, newMap);
	}
	
	if (options[STORAGE_ADD_MAP]) {
		// Easier to see small black than small white.
		var mapSrc = bigMapSrc.replace('color:white', 'color:black');
		// Cleanup unused fields.
		mapSrc = mapSrc.replace(/format=[^&]+&?/g, '');
		mapSrc = mapSrc.replace(/sensor=[^&]+&?/g, '');
		if (options[STORAGE_REMOVE_MARKERS]) {
			mapSrc = mapSrc.replace(/markers=[^&]+&?/g, '');
		}
		bigMap.setAttribute('SRC', mapSrc);

		// Duplicate territory name.
		var title3 = actualTitle.cloneNode(true);
		title3.children[1].innerText += ' Map';
		bigMapParentParent.insertBefore(title3, bigMapParent);

		// Move stats to first page.
		bigMapParentParent.insertBefore(noteOrInfo, bigMapParent);
	} else {
		// No Big Map
		bigMapParentParent.removeChild(bigMapParent);
	}
	
	// Remove legend
	if (options[STORAGE_REMOVE_LEGEND]) {
		var next = smallMapParent.nextSibling;
		while (next && next.tagName !== 'TABLE') {
			var toRemove = next;
			next = next.nextSibling;
			smallMapParentParent.removeChild(toRemove);
		}
		
		// Add better Chinese legend
		/*if (actualTitle.innerText.indexOf('Chinese') !== -1) {
			var nn = firstLegend.cloneNode(true);
			nn.children[0].innerText = 'NN';
			nn.children[1].innerText = 'New Number';
			nn.childNodes[1].textContent = ' 新地址 ';
			var nc = nn.cloneNode(true);
			nc.children[0].innerText = 'NC';
			nc.children[1].innerText = 'Not Chinese (does not look Chinese)';
			nc.childNodes[1].textContent = ' 不是中国人 ';
			var ncs = nn.cloneNode(true);
			ncs.children[0].innerText = 'NCS';
			ncs.children[1].innerText =
					'Not Chinese Speaking (looks Chinese but doesn\'t speak it)';
			ncs.childNodes[1].textContent = ' 看似中国人但不说中文 ';
			var dnc = nn.cloneNode(true);
			dnc.children[0].innerText = 'DNC';
			dnc.children[1].innerText = 'Do Not Call';
			dnc.childNodes[1].textContent = ' 住户请我们不要再来 ';
			
			brElementParent.insertBefore(nn, brElement);
			brElementParent.insertBefore(nc, brElement);
			brElementParent.insertBefore(ncs, brElement);
			brElementParent.insertBefore(dnc, brElement);
		}*/
	}
	
	// Remove break
	brElementParent.removeChild(brElement);
	
	// Remove small map
	smallMap.setAttribute('src', '');
	smallMapParentParent.removeChild(smallMapParent);
};

document.addEventListener("DOMContentLoaded", function(event) {
	chrome.storage.sync.get(Object.keys(Options), function(items) {
		if (items[STORAGE_ENABLE_EXTENSION] !== false) {
			var options = {};
			for (var property in Options) {
				if (items[property] !== undefined) {
					options[property] = items[property];
				} else {
					options[property] = Options[property];
				}
			}
			main(options);
		}
	});
});