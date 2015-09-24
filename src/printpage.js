'use strict';

// Add custom CSS.
var loadPrintCss = function() {
  var cssLink = document.createElement('link');
  cssLink.rel = 'stylesheet';
  cssLink.href = chrome.extension.getURL('res/print.css');
  document.head.appendChild(cssLink);
}

var main = function(options, queryParams) {
  /* Grab all elements that are to be manipulated later. */
  
  var overallCard = document.querySelector('.card');
  var actualTitle = document.querySelector('.card > h1');
  var possibleBadge = actualTitle.querySelector('.badge');
  if (possibleBadge && possibleBadge.textContent.search('Assigned') !== -1) {
    // Do no work for assigned territories.
    return;
  }
  
  // Stop map loading ASAP.
  var bigMap = overallCard.querySelector('.map');
  var bigMapSrc = bigMap.src;
  if (options[STORAGE_ADD_MAP] || options[STORAGE_ADD_ZOOM_MAP]) {
    bigMap.src = '';
  }
  
  var mobileCode = overallCard.querySelector('.directions');
  var addressTable = overallCard.querySelector('table.addresses');
  var coopTable = overallCard.querySelector('table.other');
  var bigMapParent = bigMap.parentElement;
  var brElements = document.querySelectorAll('.card > br');
  var mobileCodeParent = mobileCode.parentElement;
  var noteOrInfo = actualTitle.nextSibling;
  
  if (mobileCode.parentElement != overallCard) {
    var mobileCodeParent = mobileCode.parentElement;
    overallCard.insertBefore(mobileCode, mobileCodeParent);
    Util.removeElement(mobileCodeParent);
  }
  var firstLegend = mobileCode.nextSibling;
  
  var defaultDecimals = 3;
  if (options[STORAGE_ACCURATE_MARKERS]) {
    defaultDecimals = 4;
  }
  var formatGeocode = function(geocode, decimals) {
    if (decimals === undefined) {
      decimals = defaultDecimals;
    }
    return [geocode[0].toFixed(decimals),
            geocode[1].toFixed(decimals)];
  };
  
  var randomArrayChoice = function(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
  
  var orderedIds = [];
  var addressData = {};
  var allAddresses = [];
  var addressRows = addressTable.querySelectorAll('tbody tr');
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
    var address = addressField.childNodes[0].textContent.trim();  // Text Node
    var geocode = addressField.querySelector('span').textContent
        .replace(/°/g, '').split(' ');
    var notes = notesField.textContent;
    
    geocode = geocode.map(parseFloat);
    geocode = formatGeocode(geocode);
    
    orderedIds.push(id);
    addressData[id] = new Prettify.Address({
      status: status,
      language: language,
      name: name,
      telephone: telephone,
      address: address,
      geocode: geocode,
      notes: notes,
    });
    allAddresses.push(addressData[id]);
  }
  var goodAddresses = Prettify.Address.filter(allAddresses);
  
  var coopIds = [];
  if (coopTable != null) {
    if (options[STORAGE_INCLUDE_COOP]) {
      var coopRows = coopTable.querySelectorAll('tbody tr');
      for (var idx = 0; idx < coopRows.length; ++idx) {
        var coopRow = coopRows[idx];
        var coopCells = coopRow.children;
        
        var idField = coopCells[0];
        var statusField = coopCells[1];
        var accountField = coopCells[2];
        var languageField = coopCells[3];
        var nameAndTelephoneField = coopCells[4];
        var addressField = coopCells[5];
        
        var id = idField.querySelector('.muted').textContent;
        var status = statusField.querySelector('.status').textContent;
        var account = accountField.textContent;
        var language = languageField.textContent;
        var name = nameAndTelephoneField.querySelector('strong').textContent;
        var telephone = nameAndTelephoneField.childNodes[0].nodeValue;
        var address = addressField.childNodes[0].textContent.trim();  // Text Node
        
        orderedIds.push(id);
        coopIds.push(id);
        addressData[id] = new Prettify.Address({
          status: Prettify.Address.Status.NOT_VALID,  // Force not valid for coop calls
          language: language,
          name: name,
          telephone: telephone,
          address: address,
          geocode: [0, 0],
          notes: '[' + account + ']',
        });
        allAddresses.push(addressData[id]);
      }
    }
    Util.removeElement(coopTable);
  }
  
  var lastGeocode = [null, null];
  var lastAddress = null;
  var DOT = '•';
  var markerLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' + DOT;
  var totalLocations = 0;
  var potentials = {};
  for (var idx = 0; idx < orderedIds.length; ++idx) {
    var addressInfo = addressData[orderedIds[idx]];
    if (addressInfo.status !== Prettify.Address.Status.NOT_VALID &&
        (addressInfo.geocode[0] !== lastGeocode[0] ||
         addressInfo.geocode[1] !== lastGeocode[1])) {
      var address = Util.getStreetFromAddress(addressInfo.address);
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
  var geocodeToLabel = {};
  var serializeGeocode = function(geocode) {
    return geocode[0] + '|' + geocode[1];
  };
  for (var idx = 0; idx < orderedIds.length; ++idx) {
    var addressInfo = addressData[orderedIds[idx]];
    var serialized = serializeGeocode(addressInfo.geocode);
    if (addressInfo.label === '') {
      if (geocodeToLabel[serialized] !== undefined) {
        addressInfo.label = geocodeToLabel[serialized];
      } else {
        if (markerLabelIdx < markerLabels.length) {
          addressInfo.label = markerLabels[markerLabelIdx++];
        } else {
          // Theoretically there should be at most one of these.
          addressInfo.label = DOT;
        }
        geocodeToLabel[serializeGeocode(addressInfo.geocode)] = addressInfo.label;
      }
    }
  }
  for (var idx = 0; idx < orderedIds.length; ++idx) {
    var addressInfo = addressData[orderedIds[idx]];
    var serialized = serializeGeocode(addressInfo.geocode);
    if (geocodeToLabel[serialized] !== undefined) {
      addressInfo.label = geocodeToLabel[serialized];
    }
  }
  
  var generateMarkers = function(lengthLimit) {
    var seen = {};
    var markers = [];
    var smallMarkers = [];
    var extras = 'color:gray|';
    for (var idx = 0; idx < orderedIds.length; ++idx) {
      var addressInfo = addressData[orderedIds[idx]];
      if (addressInfo.label !== undefined) {
        if (seen[addressInfo.label]) {
          continue;
        } else {
          seen[addressInfo.label] = true;
        }
        if (addressInfo.label === DOT) {
          smallMarkers.push(addressInfo.geocode.join(','));
        } else {
          markers.push('markers=' + extras + 'label:' + addressInfo.label + '|' + 
            addressInfo.geocode.join(','));
        }
      }
    };
    var extremes = Prettify.Address.extremes(goodAddresses);
    markers.push('visible=' + formatGeocode(extremes.min).join(','));
    markers.push('visible=' + formatGeocode(extremes.max).join(','));
    if (smallMarkers.length > 0) {
      markers.push('markers=' + extras + smallMarkers.join('|'));
    }
    return '&' + markers.join('&');
  };
  
  var newTable = document.createElement('div');
  var invalidAddressTable = addressTable.cloneNode(true);
  if (coopIds) {
    var normalRow = addressTable.querySelector('tbody tr');
    // Assuming that there is at least one normal call.
    for (var idx = 0; idx < coopIds.length; ++idx) {
      var addressInfo = addressData[coopIds[idx]];
      var newRow = normalRow.cloneNode(true);
      
      newRow.children[2].innerHTML = addressInfo.language;
      newRow.children[4].innerHTML = addressInfo.address;
      newRow.children[5].innerHTML = addressInfo.notes;
      
      // Append to tbody.
      invalidAddressTable.children[1].appendChild(newRow);
    }
  }
  
  newTable.appendChild(invalidAddressTable);
  var subheading = document.createElement('h2');
  subheading.textContent = 'Not Valid Calls';
  newTable.insertBefore(subheading, newTable.firstChild);
  var VALID_TABLE = 0;
  var INVALID_TABLE = 1;
  var addressTables = [addressTable, invalidAddressTable];
  for (var idx = addressTables.length - 1; idx >= 0; idx--) {
    var addressTable = addressTables[idx];
    
    var thead = addressTable.getElementsByTagName('thead')[0];
    var headingRow = thead.getElementsByTagName('tr')[0];
    var headings = thead.getElementsByTagName('th');
    for (var i = headings.length - 1; i >= 0; --i) {
      if (headings[i].textContent.toLowerCase() === 'name & telephone') {
        headings[i].textContent = 'CONTACT';
        break;
      }
    }
    if (idx === INVALID_TABLE) {
      // Remove all but the status and address columns for invalids.
      for (var i = headings.length - 1; i >= 0; --i) {
        if (headings[i].textContent.toLowerCase() !== 'language' &&
            headings[i].textContent.toLowerCase() !== 'address' &&
            headings[i].textContent.toLowerCase() !== 'notes') {
          Util.removeElement(headings[i]);
        }
      }
      // Duplicate headings for second row.
      var len = headings.length;
      for (var i = 0; i < len; ++i) {
        headingRow.appendChild(headings[i].cloneNode(true));
      }
      // Add CSS class to separate the tables
      addressTable.classList.add('invalid');
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
      if ((idx === INVALID_TABLE && status !== Prettify.Address.Status.NOT_VALID) ||
          (idx === VALID_TABLE && status === Prettify.Address.Status.NOT_VALID)) {
        Util.removeElement(trs[i]);
        continue;
      }

      // Remove content.
      if (idx === INVALID_TABLE) {
        // Only keep language, address, and notes for invalid calls.
        Util.removeElement(idField);
        Util.removeElement(statusField);
        Util.removeElement(checkboxes);
        if (options[STORAGE_ADD_NOT_VALID_NAMES]) {
          if (nameAndTelephone.children.length >= 2 &&
              nameAndTelephone.children[0].tagName === 'STRONG') {
            Util.removeElement(nameAndTelephone.children[1]);
          }
          trs[i].children[3].classList.add('border');
        } else {
          Util.removeElement(nameAndTelephone);
          trs[i].children[2].classList.add('border');
        }
      } else {
        // Remove id and replace label.
        if (addressInfo.label !== undefined) {
          idField.textContent = addressInfo.label;
        } else {
          idField.textContent = '';
        }
        
        // Remove contacted.
        var contactedDate = nameAndTelephone.querySelector('small');
        if (contactedDate) {
          Util.removeElement(contactedDate);
        }
        
        if (options[STORAGE_REMOVE_NAMES]) {
          // Remove name.
          var strongName = nameAndTelephone.querySelector('strong');
          if (strongName) {
            Util.removeElement(strongName);
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
          Util.removeElement(geocodeSpan);
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
        Util.removeElement(nextRow);
      }
    // Color changes when street changes
    } else {
      // /[,?#\d]* / - Matches the first bits of the street number, enforcing
      //    ending in space.
      // /[\d]*[a-zA-Z]+(?!\d)/ - Street names can start with numbers, 1st,
      //    etc, but must not contain any letters followed by numbers, as
      //    those are postal codes.
      // ((?:[\d]*[a-zA-Z]+(?!\d) ?)*) - Capture the full street name,
      //    possibly repeats with 'St W'.
      var STREET_ADDRESS = /[,?#\d ]* ((?:[\d]*[a-zA-Z]+(?!\d) ?)*)/;
      var CSS_CLASSES = ['light', 'dark'];
      var css_index = 1;
      for (var i = 0; i < trs.length - 1; ++i) {
        trs[i].classList.add(CSS_CLASSES[css_index]);
        var curStreet = Util.getStreetFromAddress(
            trs[i].children[4].textContent);
        var nextStreet = Util.getStreetFromAddress(
            trs[i + 1].children[4].textContent);
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
  
  // Move campaign text out of its wrapper.
  var campaignText = overallCard.querySelector('.campaign');
  if (campaignText && campaignText.parentElement !== overallCard) {
    var campaignTextParent = campaignText.parentElement;
    overallCard.insertBefore(campaignText, overallCard.firstChild);
    Util.removeElement(campaignTextParent);
  }
  
  // Remove territory notes
  if (noteOrInfo.children.length === 1 &&
      noteOrInfo.children[0].tagName === 'STRONG' &&
      noteOrInfo.children[0].textContent === 'Notes:') {
    var info = noteOrInfo.nextSibling;
    Util.removeElement(noteOrInfo);
    noteOrInfo = info;
  }
  
  // Must be info by now
  var addressesText = noteOrInfo.querySelector('strong');
  addressesText.textContent = Util.replaceNumber(
      addressesText.textContent, goodAddresses.length);
  
  // Remove mobile QR code
  if (options[STORAGE_ADD_MOBILE_CODE]) {
    overallCard.insertBefore(mobileCode, overallCard.firstChild);
  } else {
    if (mobileCode.firstElementChild) {
      mobileCode.firstElementChild.src = '';
    }
    Util.removeElement(mobileCode);
  }
  
  // Remove legend
  if (options[STORAGE_REMOVE_LEGEND]) {
    var next = firstLegend;
    while (next && next.tagName !== 'TABLE') {
      var toRemove = next;
      next = next.nextSibling;
      Util.removeElement(toRemove);
    }
  }
  
  // Remove break
  Util.removeElements(brElements);
  
  // Add assignment box with Name and stuff.
  if (options[STORAGE_ADD_ASSIGNMENT_BOX]) {
    var assignmentBox = document.createElement('DIV');
    assignmentBox.innerHTML =
        'Name:<span class="assignment-box-separator"></span>Return By:';
    assignmentBox.classList.add('assignment-box');
    overallCard.insertBefore(assignmentBox, overallCard.firstChild);
  }
  
  var MAX_URL_LENGTH = 2048;

  // Move stats to first page.
  overallCard.insertBefore(actualTitle, bigMapParent);
  overallCard.insertBefore(noteOrInfo, bigMapParent);
  
  if (options[STORAGE_ADD_ZOOM_MAP]) {
    var newZoomMap = bigMap.cloneNode(true);
    // Cleanup unused fields.
    var mapSrc = bigMapSrc.replace(/\?&/g, '?');
    
    var extremes = Prettify.Address.extremes(goodAddresses);
    mapSrc = mapSrc.replace(
        'staticmap?',
        'staticmap?center=' + formatGeocode(extremes.avg).join(',') + '&zoom=15&');
    mapSrc = mapSrc.replace(/format=[^&]+&?/g, '');
    mapSrc = mapSrc.replace(/sensor=[^&]+&?/g, '');
    mapSrc = mapSrc.replace(/markers=[^&]+&?/g, '');
    mapSrc = mapSrc.replace(/path=[^&]+&?/g, '');
    mapSrc = mapSrc.replace(/enc:[^&]+&?/g, '');
    if (!options[STORAGE_REMOVE_MARKERS]) {
      mapSrc += generateMarkers(MAX_URL_LENGTH - mapSrc.length);
    }
    newZoomMap.src = mapSrc;
    Util.insertAfter(newZoomMap, bigMapParent);
    
    if (options[STORAGE_ADD_MAP]) {
      var title2 = actualTitle.cloneNode(true);
      title2.children[1].textContent += ' Zoomed-In';
      overallCard.insertBefore(title2, newZoomMap);
    }
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
  } else {
    Util.removeElement(bigMapParent);
  }
  
  if (options[STORAGE_ADD_CHINESE_LEGEND]) {
    let legend = document.createElement('div');
    legend.classList.add('legend');
    legend.innerHTML = `
<p>
  <strong>NC (Not Chinese):</strong>
  <span class="muted">Householder does not speak Chinese and does not look Chinese</span>
</p>
<p>
  <strong>NCS (Not Chinese Speaking):</strong>
  <span class="muted">Householder does not speak Chinese but looks Chinese. Indicate ethnicity if possible.</span>
</p>
<p>
  <strong>NN (New Number):</strong>
  <span class="muted">Newly found address. Draw crossed box beside number if householder was contacted. Draw empty box if not.</span>
</p>
`;
    overallCard.insertBefore(legend, addressTable);
  }
  
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
  var params = Util.parseQueryString(location.search.substring(1));
  var needRefresh = false;
  var requiredParams = {
    nv: '',  // Show all non-valid calls
    m: '1',  // Primary map
    o: '0',  // Overview map
    l: '1',  // Legend
    d: '1',  // Mobile QR code
    g: '1',  // GPS coordinates
    coop: '1',  // Co-op calls
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
    main(options, params);
  });
});

documentReady.then(function() {
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
});