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

// Add custom CSS.
var loadPrintCss = function() {
	var cssLink = document.createElement('link');
	cssLink.rel = 'stylesheet';
	cssLink.href = chrome.extension.getURL('res/print.css');
	document.head.appendChild(cssLink);
}

var removeElement = function(element) {
	element.parentElement.removeChild(element);
}

var main = function(options) {
	/* Grab all elements that are to be manipulated later. */
	
	var overallCard = document.querySelector('.card');
	var actualTitle = overallCard.querySelector('h1');
	var possibleBadge = actualTitle.querySelector('.badge');
	if (possibleBadge && possibleBadge.textContent.find('Telephone') !== -1) {
		// Do no work for telephone territories.
		return;
	}
	
	// Stop map loading ASAP.
	var bigMap = overallCard.querySelector('.map');
	var bigMapSrc = bigMap.src;
	if (options[STORAGE_ADD_MAP] || options[STORAGE_ADD_ZOOM_MAP]) {
		bigMap.src = '';
	}
	
	var campaignText = overallCard.querySelector('.campaign');
	var mobileCode = overallCard.querySelector('.directions');
	var addressTable = overallCard.querySelector('.addresses');
	var bigMapParent = bigMap.parentElement;
	var firstLegend = mobileCode.nextSibling;
	var brElement = mobileCode.previousSibling;
	var brElementParent = brElement.parentElement;
	var mobileCodeParent = mobileCode.parentElement;
	var noteOrInfo = actualTitle.nextSibling;
	
	var parseGeocode = function(geocode) {
		return [parseFloat(geocode[0]), parseFloat(geocode[1])];
	}
	
	var formatGeocode = function(geocode, precision) {
		if (precision === undefined) {
			precision = 6;
		}
		return geocode[0].toPrecision(precision) + ',' + 
					 geocode[1].toPrecision(precision);
	};
	
	var getStreetFromAddress = function(address) {
		// /[,?#\d]* / - Matches the first bits of the street number, enforcing
		//		ending in space.
		// /[\d]*[a-zA-Z]+(?!\d)/ - Street names can start with numbers, 1st,
		//		etc, but must not contain any letters followed by numbers, as
		//		those are postal codes.
		// ((?:[\d]*[a-zA-Z]+(?!\d) ?)*) - Capture the full street name,
		//		possibly repeats with 'St W'.
		var STREET_ADDRESS = /[,?#\d ]* ((?:[\d]*[a-zA-Z]+(?!\d) ?)*)/;
		return STREET_ADDRESS.exec(address)[1];
	}
	
	var randomArrayChoice = function(array) {
		return array[Math.floor(Math.random() * array.length)];
	}
	
	var orderedIds = [];
	var addressData = {};
	var addressRows = addressTable.querySelectorAll('tbody tr');
	var numAddresses = addressRows.length;
	for (var idx = 0; idx < numAddresses; ++idx) {
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
		var address = addressField.childNodes[0].textContent.trim();  // Text Node
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
	
	var lastGeocode = [null, null];
	var lastAddress = null;
	var DOT = '•';
	var markerLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' + DOT;
	var NOT_VALID_STATUS = 'Not valid';
	var avgX = 0, avgY = 0;
	var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
	var totalLocations = 0;
	var potentials = {};
	for (var idx = 0; idx < numAddresses; ++idx) {
		var addressInfo = addressData[orderedIds[idx]];
		
		var parsed = parseGeocode(addressInfo.geocode);
		avgX += parsed[0];
		avgY += parsed[1];
		minX = Math.min(minX, parsed[0]);
		minY = Math.min(minY, parsed[1]);
		maxX = Math.max(maxX, parsed[0]);
		maxY = Math.max(maxY, parsed[1]);
		
		if (addressInfo.status !== NOT_VALID_STATUS &&
				(addressInfo.geocode[0] !== lastGeocode[0] ||
				 addressInfo.geocode[1] !== lastGeocode[1])) {
			var address = getStreetFromAddress(addressInfo.address);
			if (lastAddress !== address) {
				potentials[address] = [addressInfo];
				lastAddress = address;
			} else {
				potentials[address].push(addressInfo);
			}
			totalLocations += 1;
			lastGeocode = addressInfo.geocode;
		}
	}
	if (numAddresses !== 0) {
		avgX /= numAddresses;
		avgY /= numAddresses;
	}
	
	var markersLeft = markerLabels.length;
	var totalAddresses = Object.keys(potentials).length;
	if (markersLeft < totalAddresses) {
		for (var key in potentials) {
			var addressInfos = potentials[key];
			if (markersLeft > 0) {
				addressInfos[0].label = '';
				markersLeft--;
			}
		}
	} else if (markersLeft >= totalLocations) {
		for (var key in potentials) {
			var addressInfos = potentials[key];
			for (var i = 0; i < addressInfos.length; ++i) {
				addressInfos[i].label = '';
			}
		}
	} else {
		var allotted = {};
		for (var key in potentials) {
			allotted[key] = 0;
		}
		while (markersLeft > 0) {
			for (var key in potentials) {
				var addressInfos = potentials[key];
				if (markersLeft > 0 && allotted[key] < addressInfos.length) {
					allotted[key] += 1;
					markersLeft--;
				}
			}
		}
		// We want to hit the first and last items, if possible.
		// Given 3 more addresses to pick out of 8, 8/3 ~= 2.66
		// Ideally we pick 0, 2/3, 4/5, 7.
		for (var key in potentials) {
			var addressInfos = potentials[key];
			var got = allotted[key];
			var skip = (addressInfos.length - 1) / (got - 1);
			for (var i = 0; i < addressInfos.length; i += skip) {
				if (got > 0) {
					addressInfos[Math.floor(i)].label = '';
					got--;
				}
			}
		}
	}
	var markerLabelIdx = 0;
	for (var idx = 0; idx < numAddresses; ++idx) {
		var addressInfo = addressData[orderedIds[idx]];
		if (addressInfo.label === '') {
			if (markerLabelIdx < markerLabels.length) {
				addressInfo.label = markerLabels[markerLabelIdx++];
			} else {
				// Theoretically there should be at most one of these.
				addressInfo.label = DOT;
			}
		}
	}
	
	var generateMarkers = function(lengthLimit) {
		var markers = [];
		var smallMarkers = [];
		for (var idx = 0; idx < numAddresses; ++idx) {
			var addressInfo = addressData[orderedIds[idx]];
			if (addressInfo.label !== undefined) {
				if (addressInfo.label === DOT) {
					smallMarkers.push(formatGeocode(parseGeocode(addressInfo.geocode)));
				} else {
					markers.push(
						'markers=label:' + addressInfo.label + '|' + 
						formatGeocode(parseGeocode(addressInfo.geocode)));
				}
			}
		};
		markers.push('visible=' + formatGeocode([minX, minY]));
		markers.push('visible=' + formatGeocode([maxX, maxY]));
		if (smallMarkers.length > 0) {
			markers.push('markers=' + smallMarkers.join('|'));
		}
		return '&' + markers.join('&');
	};
	
	var newTable = document.createElement('div');
	var invalidAddressTable = addressTable.cloneNode(true);
	newTable.appendChild(invalidAddressTable);
	var subheading = document.createElement('h2');
	subheading.innerText = 'Not Valid Calls';
	newTable.insertBefore(subheading, newTable.firstChild);
	var VALID_TABLE = 0;
	var INVALID_TABLE = 1;
	var addressTables = [addressTable, invalidAddressTable];
	for (var idx = addressTables.length - 1; idx >= 0; idx--) {
		var addressTable = addressTables[idx];
		
		var thead = addressTable.getElementsByTagName('thead')[0];
		var headingRow = thead.getElementsByTagName('tr')[0];
		var headings = thead.getElementsByTagName('th');
		if (idx === INVALID_TABLE) {
			// Remove all but the status and address columns for invalids.
			for (var i = headings.length - 1; i >= 0; --i) {
				if (headings[i].textContent.toLowerCase() === 'name & telephone' &&
						options[STORAGE_ADD_NOT_VALID_NAMES]) {
					headings[i].innerText = 'NAME';
					continue;
				}
				if (headings[i].textContent.toLowerCase() !== 'language' &&
						headings[i].textContent.toLowerCase() !== 'address' &&
						headings[i].textContent.toLowerCase() !== 'notes') {
					removeElement(headings[i]);
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
					if (headings[i].textContent.toLowerCase() ===
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
			var id = idField.querySelector('.muted').textContent;
			var addressInfo = addressData[id];
			
			var statusField = trs[i].children[1];
			var language = trs[i].children[2];
			var nameAndTelephone = trs[i].children[3];
			var address = trs[i].children[4];
			var notes = trs[i].children[5];
			var checkboxes = trs[i].children[6];
			
			var status = statusField.textContent;
			// Separate rows based on table.
			if ((idx === INVALID_TABLE && status !== NOT_VALID_STATUS) ||
					(idx === VALID_TABLE && status === NOT_VALID_STATUS)) {
				removeElement(trs[i]);
				continue;
			}

			// Remove content.
			if (idx === INVALID_TABLE) {
				// Only keep language, address, and notes for invalid calls.
				trs[i].removeChild(idField);
				trs[i].removeChild(statusField);
				trs[i].removeChild(checkboxes);
				if (options[STORAGE_ADD_NOT_VALID_NAMES]) {
					if (nameAndTelephone.children.length >= 2 &&
							nameAndTelephone.children[0].tagName === 'STRONG') {
						removeElement(nameAndTelephone.children[1]);
					}
					trs[i].children[3].classList.add('border');
				} else {
					trs[i].removeChild(nameAndTelephone);
					trs[i].children[2].classList.add('border');
				}
			} else {
				// Remove id and replace label.
				if (idField.children.length > 1) {
					removeElement(idField.children[1]);
					if (addressInfo.label !== undefined) {
						idField.firstElementChild.innerText = addressInfo.label;
					} else {
						removeElement(idField.firstElementChild);
					}
				}
				
				// Remove contacted.
				var contactedDate = nameAndTelephone.querySelector('small');
				if (contactedDate) {
					removeElement(contactedDate);
				}
				
				if (options[STORAGE_REMOVE_NAMES]) {
					// Remove name.
					var strongName = nameAndTelephone.querySelector('strong');
					if (strongName) {
						removeElement(strongName);
					}
				}
			}
			
			// Bold language column.
			var languageText = language.textContent;
			if (languageText.indexOf('Chinese') !== -1) {
				// Chinese is redundant for Mandarin and Cantonese.
				languageText = languageText.split(' ')[1];
			}
			language.innerHTML = '<strong>' + languageText + '</strong>';

			// Remove geocode for both.
			if (options[STORAGE_REMOVE_GEOCODE]) {
				var geocodeSpan = address.querySelector('span');
				if (geocodeSpan) {
					removeElement(geocodeSpan);
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
				removeElement(nextRow);
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
				var curStreet = getStreetFromAddress(trs[i].children[4].textContent);
				var nextStreet = getStreetFromAddress(trs[i + 1].children[4].textContent);
				if (curStreet !== nextStreet) {
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
		removeElement(campaignTextParent);
	}
	
	// Remove territory notes
	if (noteOrInfo.children.length === 1 &&
			noteOrInfo.children[0].tagName === 'STRONG' &&
			noteOrInfo.children[0].textContent === 'Notes:') {
		var info = noteOrInfo.nextSibling;
		removeElement(noteOrInfo);
		noteOrInfo = info;
	}
	
	// Remove mobile QR code
	if (options[STORAGE_ADD_MOBILE_CODE]) {
		overallCard.insertBefore(mobileCode, overallCard.firstChild);
	} else {
		if (mobileCode.firstElementChild) {
			mobileCode.firstElementChild.src = '';
		}
		removeElement(mobileCode);
	}
	
	// Add assignment box with Name and stuff.
	if (options[STORAGE_ADD_ASSIGNMENT_BOX]) {
		var assignmentBox = document.createElement('DIV');
		assignmentBox.innerHTML =
				'Name:<span class="assignment-box-separator"></span>Return By:';
		assignmentBox.classList.add('assignment-box');
		overallCard.insertBefore(assignmentBox, overallCard.firstChild);
	}
	
	var MAX_URL_LENGTH = 2048;
	
	if (options[STORAGE_ADD_ZOOM_MAP]) {
		var newZoomMap = bigMap.cloneNode(true);
		// Cleanup unused fields.
		var mapSrc = bigMapSrc.replace(/\?&/g, '?');
		mapSrc = mapSrc.replace(
				'staticmap?',
				'staticmap?center=' + formatGeocode([avgX, avgY], 5) + '&zoom=15&');
		mapSrc = mapSrc.replace(/format=[^&]+&?/g, '');
		mapSrc = mapSrc.replace(/sensor=[^&]+&?/g, '');
		mapSrc = mapSrc.replace(/markers=[^&]+&?/g, '');
		mapSrc = mapSrc.replace(/path=[^&]+&?/g, '');
		mapSrc = mapSrc.replace(/enc:[^&]+&?/g, '');
		if (!options[STORAGE_REMOVE_MARKERS]) {
			mapSrc += generateMarkers(MAX_URL_LENGTH - mapSrc.length);
		}
		newZoomMap.src = mapSrc;
		overallCard.insertBefore(newZoomMap, bigMapParent.nextSibling);
		
		var title2 = actualTitle.cloneNode(true);
		title2.children[1].innerText += ' Zoomed-In';
		newZoomMap.parentElement.insertBefore(title2, newZoomMap);
	}
	
	if (options[STORAGE_ADD_MAP]) {
		// Cleanup unused fields.
		var mapSrc = bigMapSrc.replace(/\?&/g, '?');
		mapSrc = mapSrc.replace(/format=[^&]+&?/g, '');
		mapSrc = mapSrc.replace(/sensor=[^&]+&?/g, '');
		mapSrc = mapSrc.replace(/markers=[^&]+&?/g, '');
		if (options[STORAGE_REMOVE_PATH]) {
			mapSrc = mapSrc.replace(/path=[^&]+&?/g, '');
			mapSrc = mapSrc.replace(/enc:[^&]+&?/g, '');
		}
		if (!options[STORAGE_REMOVE_MARKERS]) {
			mapSrc += generateMarkers(MAX_URL_LENGTH - mapSrc.length);
		}
		bigMap.src = mapSrc;

		// Duplicate territory name.
		var title3 = actualTitle.cloneNode(true);
		overallCard.insertBefore(title3, bigMapParent);

		// Move stats to first page.
		overallCard.insertBefore(noteOrInfo, bigMapParent);
	} else {
		removeElement(bigMapParent);
	}
	
	// Remove legend
	if (options[STORAGE_REMOVE_LEGEND]) {
		var next = firstLegend;
		while (next && next.tagName !== 'TABLE') {
			var toRemove = next;
			next = next.nextSibling;
			removeElement(toRemove);
		}
	}
	
	// Remove break
	removeElement(brElement);
	
	loadPrintCss();
	Analytics.recordPageView();
};

var documentReady = new Promise(function documentReadyPromise(resolve) {
	if (document.readyState === 'complete') {
		resolve();
	} else {
		document.addEventListener('DOMContentLoaded', resolve);
	}
});

var optionsReady = new Promise(function optionsReadyPromise(resolve) {
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
			resolve(options);
		} else {
			resolve();
		}
	});
});

optionsReady.then(function(options) {
	if (options === undefined) {
		return;
	}
	// Enforce we load the right page with as much data as possible.
	if (!options[STORAGE_ENABLE_EXTENSION]) {
		return;
	}
	var params = parseQueryString(location.search.substring(1));
	var needRefresh = false;
	var requiredParams = {
		nv: '',
		m: '1',  // Primary map
		o: '0',  // Overview map
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
		return;
	}
	documentReady.then(function() {
		main(options);
	});
});

chrome.storage.onChanged.addListener(function(changes, areaName) {
	if (areaName !== 'sync') {
		return;
	}
	for (var property in changes) {
		if (Options[property] === undefined) {
			continue;
		}
		chrome.storage.sync.get(STORAGE_AUTO_REFRESH, function(items) {
			if (items[STORAGE_AUTO_REFRESH] === false) {
				return;
			}
			location.reload();
		});
		break;
	}
});