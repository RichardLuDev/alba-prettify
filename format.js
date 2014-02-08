(function() {
	var smallMap = document.getElementsByClassName("overview")[0];
	var pSubtitle = smallMap.previousSibling.previousSibling;
	var title = pSubtitle.previousSibling;
	var bigMap = title.previousSibling;
	
	// Reorder smaller map so it doesn't take up extra space
	smallMap.parentNode.insertBefore(smallMap, pSubtitle);
	
	// Duplicate territory name
	var title2 = title.cloneNode(true);
	title2.children[1].innerText += ' Map';
	title.parentNode.insertBefore(title2, bigMap);
	
	// Remove "Name" in "Name & Telephone"
	var addressTable = document.getElementsByClassName("addresses")[0];
	var thead = addressTable.getElementsByTagName('thead')[0];
	var ths = thead.getElementsByTagName('th');
	for (var i = 0; i < ths.length; ++i) {
	  if (ths[i].innerText === "NAME & TELEPHONE") {
		ths[i].innerText = "TELEPHONE";
		break;
	  }
	}
})();