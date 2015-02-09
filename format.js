(function() {
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
	var actualTitle = smallMapParent.previousSibling;  // Accomodate optional territory 'Notes'.
	while (actualTitle.tagName != 'H1') {
		actualTitle = actualTitle.previousSibling;
	}
	var possibleNote = actualTitle.nextSibling;
	var overallCard = document.getElementsByClassName('card')[0];

	var all_url = window.location.href + '&nv';
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
			
			// Remove 'Name' in 'Name & Telephone'.
			var thead = addressTable.getElementsByTagName('thead')[0];
			var ths = thead.getElementsByTagName('th');
			for (var i = 0; i < ths.length; ++i) {
				//console.log(ths[i].innerText);
				if (ths[i].innerText === 'NAME & TELEPHONE' || ths[i].innerText === 'Name & Telephone') {
					ths[i].innerText = 'TELEPHONE';
					break;
				}
			}
			
			// Do not display names.
			var tbody = addressTable.getElementsByTagName('tbody')[0];
			var trs = tbody.getElementsByTagName('tr');
			for (var i = trs.length - 1; i >= 0; --i) {
			  	if (trs[i].children.length < 5) {
			  		continue;
			  	}
				var idField = trs[i].children[0];
			  	var status = trs[i].children[1];
				var language = trs[i].children[2];
				var nameAndTelephone = trs[i].children[3];
				var address = trs[i].children[4];

				// Filter rows based on table
				if ((idx === INVALID_TABLE && status.innerText !== NOT_VALID_STATUS) ||
						(idx === VALID_TABLE && status.innerText === NOT_VALID_STATUS)) {
					tbody.removeChild(trs[i]);
					continue;
				}

				// Remove the boxes and the letter labels for invalid calls.
				if (idx === INVALID_TABLE) {
					trs[i].removeChild(trs[i].children[6]);
					idField.removeChild(idField.children[0]);
				}
				
				// Chinese is redundant
				if (language.innerText.indexOf('Chinese') !== -1) {
					var contracted = language.innerText.split(' ')[1];
					language.innerHTML = '<strong>' + contracted + '</strong>';
				}

				// Remove name
				if (nameAndTelephone.children.length >= 2 &&
						nameAndTelephone.children[0].tagName === 'STRONG') {
					nameAndTelephone.removeChild(nameAndTelephone.children[0]);
				}

				// Remove geocode
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
		}
	});
	$('.card').append(table);
	
	// Remove mobile QR code
	mobileCodeParent.removeChild(mobileCode);
	
	// Remove territory notes
	if (possibleNote.children.length === 1 &&
			possibleNote.children[0].tagName === 'STRONG' &&
			possibleNote.children[0].innerText === 'Notes:') {
		overallCard.removeChild(possibleNote);
	}
	
	// Easier to see small black than small white.
	var mapSrc = bigMapSrc.replace('color:white', 'color:black');
	bigMap.setAttribute('SRC', mapSrc);
	
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
	
	// Make separate density map.
	var newMap = bigMap.cloneNode(true);

	// We want bigger markers, even on the second map!
	var mapSrc = bigMapSrc.replace('staticmap?', 'staticmap?center=' + avgX.toString() + ',' + avgY.toString()) + '&zoom=15';
	mapSrc = mapSrc.replace('color:white', 'color:black');

	newMap.setAttribute('SRC', mapSrc);
	bigMapParentParent.insertBefore(newMap, bigMapParent.nextSibling);

	// Duplicate territory name.
	var title2 = actualTitle.cloneNode(true);
	title2.children[1].innerText += ' Map';
	bigMapParentParent.insertBefore(title2, bigMapParent);
	
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
	
	// Remove old legend and small map
	var next = smallMapParent.previousSibling;
	while (next && next.tagName !== 'TABLE') {
		var toRemove = next;
		next = next.nextSibling;
		smallMapParentParent.removeChild(toRemove);
	}
})();