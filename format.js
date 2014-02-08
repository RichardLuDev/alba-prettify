(function() {
	// Reorder smaller map so it doesn't take up extra space.
	var smallMap = document.getElementsByClassName("overview")[0];
	var pSubtitle = smallMap.previousSibling.previousSibling;
	smallMap.parentNode.insertBefore(smallMap, pSubtitle);
	
	// Duplicate territory name.
	var smallMap = document.getElementsByClassName("overview")[0];
	var title = smallMap.previousSibling;
	if (title.tagName != 'H1') {
		// Accomodate optional territory "Notes".
		title = title.previousSibling;
	}
	var bigMap = title.previousSibling;
	var title2 = title.cloneNode(true);
	title2.children[1].innerText += ' Map';
	title.parentNode.insertBefore(title2, bigMap);
	
	// Remove "Name" in "Name & Telephone".
	var addressTable = document.getElementsByClassName("addresses")[0];
	var thead = addressTable.getElementsByTagName('thead')[0];
	var ths = thead.getElementsByTagName('th');
	for (var i = 0; i < ths.length; ++i) {
	  if (ths[i].innerText === "NAME & TELEPHONE") {
		ths[i].innerText = "TELEPHONE";
		break;
	  }
	}
	
	// Do not display names.
	var addressTable = document.getElementsByClassName("addresses")[0];
	var tbody = addressTable.getElementsByTagName('tbody')[0];
	var trs = tbody.getElementsByTagName('tr');
	for (var i = 0; i < trs.length; ++i) {
	  if (trs[i].children.length >= 4) {
		var td = trs[i].children[3];
		if (td.children.length >= 2 && td.children[0].tagName == 'STRONG') {
			td.removeChild(td.children[0]);
		}
	  }
	}
})();