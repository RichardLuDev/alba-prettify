(function() {
	// http://networkprogramming.wordpress.com/2013/09/03/exceeding-the-maximum-size-for-google-static-maps/
	/*var MERCATOR_RANGE = 256;

	var bound = function (value, opt_min, opt_max) {
		if (opt_min != null) value = Math.max(value, opt_min);
		if (opt_max != null) value = Math.min(value, opt_max);
		return value;
	}

	var degreesToRadians = function (deg) {
		return deg * (Math.PI / 180);
	}

	var radiansToDegrees = function (rad) {
		return rad / (Math.PI / 180);
	}

	var MercatorProjection = function () {
		this.pixelOrigin_ = {x: MERCATOR_RANGE / 2, y: MERCATOR_RANGE / 2};
		this.pixelsPerLonDegree_ = MERCATOR_RANGE / 360;
		this.pixelsPerLonRadian_ = MERCATOR_RANGE / (2 * Math.PI);
	};

	MercatorProjection.prototype.fromLatLngToPoint = function(latLng) {
		var me = this;

		var point = {x:0,y:0};

		var origin = me.pixelOrigin_;
		point.x = origin.x + latLng.lng * me.pixelsPerLonDegree_;
		// NOTE(appleton): Truncating to 0.9999 effectively limits latitude to
		// 89.189. This is about a third of a tile past the edge of the world tile.
		var siny = bound(Math.sin(degreesToRadians(latLng.lat)), -0.9999, 0.9999);
		point.y = origin.y + 0.5 * Math.log((1 + siny) / (1 - siny)) * -me.pixelsPerLonRadian_;
		return point;
	};

	MercatorProjection.prototype.fromPointToLatLng = function(point) {
		var me = this;
		var origin = me.pixelOrigin_;
		var lng = (point.x - origin.x) / me.pixelsPerLonDegree_;
		var latRadians = (point.y - origin.y) / -me.pixelsPerLonRadian_;
		var lat = radiansToDegrees(2 * Math.atan(Math.exp(latRadians)) - Math.PI / 2);
		return {lat:lat, lng:lng};
	};
	
	var GetTileDelta = function (center,zoom,mapWidth,mapHeight,delta){
		var proj = new MercatorProjection();
		var scale = Math.pow(2,zoom);
		var centerPx = proj.fromLatLngToPoint(center);
		var DeltaPx = {
			x: (centerPx.x + ((mapWidth / scale) * delta.x)) ,
			y: (centerPx.y + ((mapHeight/ scale) * delta.y))
		};
		var DeltaLatLon = proj.fromPointToLatLng(DeltaPx);
		return DeltaLatLon;
	}
	
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
	var params = parseQueryString(src);*/
	
	// Fix map.
	var bigMap = document.getElementsByClassName("map")[0];
	var mapSrc = bigMap.getAttribute('SRC');
	// Easier to see small black than small white.
	mapSrc = mapSrc.replace('color:white', 'color:black');
	// Zoom 15 is where you can see a lot more.
	//mapSrc = mapSrc.replace('&path=', '&path=').replace('color:white', 'color:black') + '&zoom=15';
	bigMap.setAttribute('SRC', mapSrc);

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