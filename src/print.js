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

var main = function() {
	recordPageView();

	/* Grab all elements that are to be manipulated later. */
	var bigMap = document.getElementsByClassName('map')[0];
	var bigMapSrc = bigMap.getAttribute('SRC');
	var bigMapParent = bigMap.parentElement;
	var bigMapParentParent = bigMapParent.parentElement;
	var smallMap = document.getElementsByClassName('overview')[0];
	var smallMapParent = smallMap.parentElement;
	var smallMapParentParent = smallMapParent.parentElement;
	var firstLegend = smallMapParent.nextSibling;
	var brElement = smallMapParent.previousSibling;
	var brElementParent = brElement.parentElement;
	var mobileCode = document.getElementsByClassName('directions')[0];
	var mobileCodeParent = mobileCode.parentElement;
	var overallCard = document.getElementsByClassName('card')[0];
	var all_url = window.location.href + '&nv';
	var actualTitle = smallMapParent.previousSibling;  // Accommodate optional territory 'Notes'.
	while (actualTitle.tagName != 'H1') {
		actualTitle = actualTitle.previousSibling;
	}
	var noteOrInfo = actualTitle.nextSibling;

	var table = document.createElement('div');
	$(table).load(all_url + ' .addresses', function() {
		var subheading = document.createElement('h2');
		subheading.innerText = 'Not Valid Calls';
		table.insertBefore(subheading, table.firstChild);

		var addressTables = document.getElementsByClassName('addresses');

		var VALID_TABLE = 0;
		var INVALID_TABLE = 1;
		var NOT_VALID_STATUS = 'Not valid';
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
				// Remove 'Name' in 'Name & Telephone'.
				for (var i = 0; i < headings.length; ++i) {
					if (headings[i].innerText.toLowerCase() === 'name & telephone') {
						headings[i].innerText = 'TELEPHONE';
						break;
					}
				}
			}
			
			var tbody = addressTable.getElementsByTagName('tbody')[0];
			var trs = tbody.getElementsByTagName('tr');
			for (var i = trs.length - 1; i >= 0; --i) {
				var idField = trs[i].children[0];
			  	var status = trs[i].children[1];
				var language = trs[i].children[2];
				var nameAndTelephone = trs[i].children[3];
				var address = trs[i].children[4];
				var notes = trs[i].children[5];
				var checkboxes = trs[i].children[6];
				
				// Separate rows based on table.
				if ((idx === INVALID_TABLE && status.innerText !== NOT_VALID_STATUS) ||
						(idx === VALID_TABLE && status.innerText === NOT_VALID_STATUS)) {
					tbody.removeChild(trs[i]);
					continue;
				}

				// Remove content.
				if (idx === INVALID_TABLE) {
					// Only keep language, address, and notes for invalid calls.
					trs[i].removeChild(idField);
					trs[i].removeChild(status);
					trs[i].removeChild(nameAndTelephone);
					trs[i].removeChild(checkboxes);
				} else {
					// Remove extra identifier for valid calls.
					if (idField.children.length > 1) {
						idField.removeChild(idField.children[1]);
					}
					// Remove name.
					if (nameAndTelephone.children.length >= 2 &&
							nameAndTelephone.children[0].tagName === 'STRONG') {
						nameAndTelephone.removeChild(nameAndTelephone.children[0]);
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
						if (child.children.length >= 1 && child.children[0].tagName === 'SPAN') {
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
			}
		}
	});
	overallCard.appendChild(table);

	// Remove mobile QR code
	if (mobileCode.children.length > 0) {
		mobileCode.children[0].setAttribute('SRC', '');
	}
	mobileCodeParent.removeChild(mobileCode);
	
	// Remove territory notes
	if (noteOrInfo.children.length === 1 &&
			noteOrInfo.children[0].tagName === 'STRONG' &&
			noteOrInfo.children[0].innerText === 'Notes:') {
		var info = noteOrInfo.nextSibling;
		overallCard.removeChild(noteOrInfo);
		noteOrInfo = info;
	}
	
	// Parse all markers.
	var src = bigMapSrc.split('?');
	src.shift();
	src = src.join('?');
	src = src.split('&');
	var parseQueryString = function(a) {
		if (a == '') return {};
		var b = {};
		for (var i = 0; i < a.length; ++i)
		{
			if (!a[i]) {
				continue;
			}
			var p=a[i].split('=');
			if (p.length != 2) continue;
			var name=p[0], value=decodeURIComponent(p[1].replace(/\+/g, ' '));
			if (b[name]) {
				if (b[name] instanceof Array) {
					b[name].push(value);
				} else {
					b[name] = [b[name], value];
				}
			} else {
				b[name] = value;
			}
		}
		return b;
	};
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
	var avgX = 0, avgY = 0, minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
	for (var i=1;i<markers.length;i++) {
		var vals = markers[i].split('|');
		var obj = {};
		obj.original = markers[i];
		for (var j=0;j<vals.length;j++) {
			if (vals[j].indexOf(',') !== -1) {
				var v = vals[j].split(',');
				obj.x = parseFloat(v[0]);
				obj.y = parseFloat(v[1]);
				minX = Math.min(minX, obj.x);
				minY = Math.min(minY, obj.y);
				maxX = Math.max(maxX, obj.x);
				maxY = Math.max(maxY, obj.y);
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
	var midX = (maxX + minX) / 2;
	var midY = (maxY + minY) / 2;
	
	// Easier to see small black than small white.
	var mapSrc = bigMapSrc.replace('color:white', 'color:black');
	mapSrc = mapSrc.replace(/format=[^&]+&?/g, '');
	mapSrc = mapSrc.replace(/sensor=[^&]+&?/g, '');
	if (window.APKEY !== undefined) {
		mapSrc += '&key=' + window.APKEY;
	}
	bigMap.setAttribute('SRC', mapSrc);
	
	// Make separate density map but with modified src.
	var newMap = bigMap.cloneNode(true);
	mapSrc = mapSrc.replace('staticmap?', 'staticmap?center=' + avgX.toString() + ',' + avgY.toString()) + '&zoom=15';

	newMap.setAttribute('SRC', mapSrc);
	bigMapParentParent.insertBefore(newMap, bigMapParent.nextSibling);

	// Move stats to second page.
	var title2 = actualTitle.cloneNode(true);
	title2.children[1].innerText += ' Zoomed-In Map';
	newMap.parentElement.insertBefore(title2, newMap);
	newMap.parentElement.insertBefore(noteOrInfo, newMap);
	
	// Duplicate territory name.
	var title3 = actualTitle.cloneNode(true);
	title3.children[1].innerText += ' Map';
	bigMapParentParent.insertBefore(title3, bigMapParent);
	
	// Add assignment box with Name and stuff.
	var assignmentBox = document.createElement('DIV');
	assignmentBox.innerHTML = 'Name:<br><br>Return By:<br>';
	assignmentBox.className = 'assignment-box';
	bigMapParentParent.insertBefore(assignmentBox, bigMapParent);
	
	// Add new legend
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
	ncs.children[1].innerText = 'Not Chinese Speaking (looks Chinese but doesn\'t speak it)';
	ncs.childNodes[1].textContent = ' 看似中国人但不说中文 ';
	var dnc = nn.cloneNode(true);
	dnc.children[0].innerText = 'DNC';
	dnc.children[1].innerText = 'Do Not Call';
	dnc.childNodes[1].textContent = ' 住户请我们不要再来 ';
	
	brElementParent.insertBefore(nn, brElement);
	brElementParent.insertBefore(nc, brElement);
	brElementParent.insertBefore(ncs, brElement);
	brElementParent.insertBefore(dnc, brElement);
	
	// Cancel small map loading.
	smallMap.setAttribute('SRC', '');
	
	// Remove old legend and small map
	var next = smallMapParent.previousSibling;
	while (next && next.tagName !== 'TABLE') {
		var toRemove = next;
		next = next.nextSibling;
		smallMapParentParent.removeChild(toRemove);
	}
};

main();