(function() {
	var all_url = window.location.href + '&nv';
	var table = document.createElement('div');
	$(table).load(all_url + ' .addresses', function() {
		var subheading = document.createElement('h2');
		subheading.innerText = 'Non-Chinese Calls';
		table.insertBefore(subheading, table.firstChild);
	
		var addressTables = document.getElementsByClassName("addresses");
		
		for (var idx = addressTables.length - 1; idx >= 0; idx--) {
			var addressTable = addressTables[idx];
			
			// Remove "Name" in "Name & Telephone".
			var thead = addressTable.getElementsByTagName('thead')[0];
			var ths = thead.getElementsByTagName('th');
			for (var i = 0; i < ths.length; ++i) {
				//console.log(ths[i].innerText);
				if (ths[i].innerText === "NAME & TELEPHONE" || ths[i].innerText === "Name & Telephone") {
					ths[i].innerText = "TELEPHONE";
					break;
				}
			}
			
			// Do not display names.
			var tbody = addressTable.getElementsByTagName('tbody')[0];
			var trs = tbody.getElementsByTagName('tr');
			for (var i = trs.length - 1; i >= 0; --i) {
			  if (trs[i].children.length >= 4) {
				var td = trs[i].children[3];
				if (td.children.length >= 2 && td.children[0].tagName === 'STRONG') {
					td.removeChild(td.children[0]);
				}
				if (idx === 1) {
					var td = trs[i].children[0];
					td.removeChild(td.children[0]);
					trs[i].removeChild(trs[i].children[6]);
				}
				var lang = trs[i].children[2];
				if (lang.innerHTML.indexOf("Chinese") !== -1) {
					if (idx === 0) {
						var newLang = lang.innerHTML.split(" ")[1];
						lang.innerHTML = '<strong>' + newLang + '</strong>';
					} else {
						tbody.removeChild(trs[i]);
					}
				}
			  }
			}
		}
	});
	$('.card').append(table);
	
	var bigMap = document.getElementsByClassName("map")[0];
	var src = bigMap.getAttribute('SRC').split('?');
	src.shift();
	src = src.join('?');
	src = src.split('&');
	var parseQueryString = function(a) {
		if (a == "") return {};
		var b = {};
		for (var i = 0; i < a.length; ++i)
		{
			if (!a[i]) {
				continue;
			}
			var p=a[i].split('=');
			if (p.length != 2) continue;
			var name=p[0], value=decodeURIComponent(p[1].replace(/\+/g, " "));
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
	var bigMap = document.getElementsByClassName("map")[0];
	var newMap = bigMap.cloneNode(true);
	var mapSrc = newMap.getAttribute('SRC');
	mapSrc = mapSrc.replace('&path=', '&path=').replace(/markers=[^&]+&?/g, '').replace('staticmap?', 'staticmap?center=' + avgX.toString() + ',' + avgY.toString()) + '&zoom=15';
	var markerString = '&markers=size:tiny|color:black';
	for (var i=1;i<markers.length;i++) {
		markerString += '|' + markers[i].x.toString() + ',' + markers[i].y.toString();
	}
	mapSrc += markerString;
	newMap.setAttribute('SRC', mapSrc);
	bigMap.parentNode.insertBefore(newMap, bigMap.nextSibling);
	
	// Fix map.
	var bigMap = document.getElementsByClassName("map")[0];
	var mapSrc = bigMap.getAttribute('SRC');
	// Easier to see small black than small white.
	mapSrc = mapSrc.replace('color:white', 'color:black');
	// Zoom 15 is where you can see a lot more.
	//mapSrc = mapSrc.replace('&path=', '&path=').replace('color:white', 'color:black') + '&zoom=15';
	bigMap.setAttribute('SRC', mapSrc);

	// Reorder smaller map so it doesn't take up extra space.
	/*var smallMap = document.getElementsByClassName("overview")[0];
	var pSubtitle = smallMap.previousSibling.previousSibling;
	smallMap.parentNode.insertBefore(smallMap, pSubtitle);*/
	
	// Duplicate territory name.
	var smallMap = document.getElementsByClassName("overview")[0];
	var title = smallMap.previousSibling;
	while (title.tagName != 'H1') {
		// Accomodate optional territory "Notes".
		title = title.previousSibling;
	}
	var bigMap = document.getElementsByClassName("map")[0];
	var title2 = title.cloneNode(true);
	title2.children[1].innerText += ' Map';
	bigMap.parentNode.parentNode.insertBefore(title2, bigMap.parentNode);
	
	// Add new legend
	var smallMap = document.getElementsByClassName("overview")[0];
	var firstLegend = smallMap.nextSibling;
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
	var br = smallMap.previousSibling;
	br.parentNode.insertBefore(nn, br);
	br.parentNode.insertBefore(nc, br);
	br.parentNode.insertBefore(ncs, br);
	br.parentNode.insertBefore(dnc, br);
	
	// Remove old legend and small map
	var smallMap = document.getElementsByClassName("overview")[0];
	var container = smallMap.parentNode;
	var next = smallMap.previousSibling;
	while (next && next.tagName !== 'TABLE') {
		var toRemove = next;
		next = next.nextSibling;
		container.removeChild(toRemove);
	}
})();