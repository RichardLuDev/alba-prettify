'use strict';

// Add custom CSS.
var loadPrintCss = function() {
  let cssLink = document.createElement('link');
  cssLink.rel = 'stylesheet';
  cssLink.href = chrome.extension.getURL('res/print.css');
  document.head.appendChild(cssLink);
}

var main = function(options, queryParams) {
  /* Grab all elements that are to be manipulated later. */
  
  let overallCard = document.querySelector('.card');
  let actualTitle = document.querySelector('.card > h1');
  let possibleBadge = actualTitle.querySelector('.badge');
  if (possibleBadge && possibleBadge.textContent.search('Assigned') !== -1) {
    // Do no work for assigned territories.
    return;
  }
  
  // Stop map loading ASAP.
  let bigMap = overallCard.querySelector('.map');
  let bigMapSrc = bigMap.src;
  if (options[STORAGE_ADD_MAP] || options[STORAGE_ADD_ZOOM_MAP]) {
    bigMap.src = '';
  }
  
  let mobileCode = overallCard.querySelector('.directions');
  let addressTable = overallCard.querySelector('table.addresses');
  let coopTable = overallCard.querySelector('table.other');
  let bigMapParent = bigMap.parentElement;
  let brElements = document.querySelectorAll('.card > br');
  let note = null;
  let info = null;
  
  {
    let noteOrInfo = actualTitle.nextSibling;
    if (noteOrInfo.children.length === 1 &&
        noteOrInfo.children[0].tagName === 'STRONG' &&
        noteOrInfo.children[0].textContent === 'Notes:') {
      note = noteOrInfo;
      info = noteOrInfo.nextSibling;
    } else {
      info = noteOrInfo;
    }
  }
  
  let firstLegend;
  if (mobileCode) {
    let mobileCodeParent = mobileCode.parentElement;
    if (mobileCode.parentElement != overallCard) {
      overallCard.insertBefore(mobileCode, mobileCodeParent);
      Util.removeElement(mobileCodeParent);
    }
    firstLegend = mobileCode.nextSibling;
    // Remove mobile QR code
    if (options[STORAGE_ADD_MOBILE_CODE]) {
      overallCard.insertBefore(mobileCode, overallCard.firstChild);
    } else {
      if (mobileCode.firstElementChild) {
        mobileCode.firstElementChild.src = '';
      }
      Util.removeElement(mobileCode);
    }
  } else {
    firstLegend = brElements[0].nextSibling.nextSibling;
  }
  
  let defaultDecimals = 3;
  if (options[STORAGE_ACCURATE_MARKERS]) {
    defaultDecimals = 4;
  }
  let formatGeocode = function(geocode, decimals) {
    if (decimals === undefined) {
      decimals = defaultDecimals;
    }
    return [geocode[0].toFixed(decimals),
            geocode[1].toFixed(decimals)];
  };
  
  let orderedIds = [];
  let addressData = {};
  let allAddresses = [];
  let addressRows = addressTable.querySelectorAll('tbody tr');
  for (let idx = 0; idx < addressRows.length; ++idx) {
    let addressRow = addressRows[idx];
    let addressCells = addressRow.children;
    
    let idField = addressCells[0];
    let statusField = addressCells[1];
    let languageField = addressCells[2];
    let nameAndTelephoneField = addressCells[3];
    let addressField = addressCells[4];
    let notesField = addressCells[5];
    //let boxesField = addressCells[6];
    
    let id = idField.querySelector('.muted').textContent;
    let status = statusField.querySelector('.status').textContent;
    let language = languageField.textContent;
    let name = nameAndTelephoneField.querySelector('strong').textContent;
    let telephone = nameAndTelephoneField.querySelector('span').textContent;
    let address = addressField.childNodes[0].textContent.trim();  // Text Node
    let geocode = addressField.querySelector('span').textContent
        .replace(/°/g, '').split(' ');
    let notes = notesField.textContent;
    
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
  let goodAddresses = Prettify.Address.filter(allAddresses);
  
  let coopIds = [];
  if (coopTable != null) {
    if (options[STORAGE_INCLUDE_COOP]) {
      let coopRows = coopTable.querySelectorAll('tbody tr');
      for (let idx = 0; idx < coopRows.length; ++idx) {
        let coopRow = coopRows[idx];
        let coopCells = coopRow.children;
        
        let idField = coopCells[0];
        let statusField = coopCells[1];
        let accountField = coopCells[2];
        let languageField = coopCells[3];
        let nameAndTelephoneField = coopCells[4];
        let addressField = coopCells[5];
        
        let id = idField.querySelector('.muted').textContent;
        let status = statusField.querySelector('.status').textContent;
        let account = accountField.textContent;
        let language = languageField.textContent;
        let name = nameAndTelephoneField.querySelector('strong').textContent;
        let telephone = nameAndTelephoneField.childNodes[0].nodeValue;
        let address = addressField.childNodes[0].textContent.trim();  // Text Node
        
        if (status != Prettify.Address.Status.VALID) {
          continue;
        }
        
        orderedIds.push(id);
        coopIds.push(id);
        addressData[id] = new Prettify.Address({
          status: Prettify.Address.Status.NOT_VALID,  // Force not valid for coop calls
          language: language,
          name: name,
          telephone: telephone,
          address: address,
          geocode: [0, 0],
        });
        
        allAddresses.push(addressData[id]);
      }
    }
    Util.removeElement(coopTable);
  }
  
  let lastGeocode = [null, null];
  let lastAddress = null;
  let DOT = '•';
  let markerLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' + DOT;
  let totalLocations = 0;
  let potentials = {};
  for (let idx = 0; idx < orderedIds.length; ++idx) {
    let addressInfo = addressData[orderedIds[idx]];
    if (addressInfo.status !== Prettify.Address.Status.NOT_VALID &&
        (addressInfo.geocode[0] !== lastGeocode[0] ||
         addressInfo.geocode[1] !== lastGeocode[1])) {
      let address = Util.getStreetFromAddress(addressInfo.address);
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
  
  let markersLeft = markerLabels.length;
  let totalAddresses = Object.keys(potentials).length;
  if (markersLeft < totalAddresses) {
    for (let key in potentials) {
      let addressInfos = potentials[key];
      if (markersLeft > 0) {
        addressInfos[0].label = '';
        markersLeft--;
      }
    }
  } else if (markersLeft >= totalLocations) {
    for (let key in potentials) {
      let addressInfos = potentials[key];
      for (let i = 0; i < addressInfos.length; ++i) {
        addressInfos[i].label = '';
      }
    }
  } else {
    let allotted = {};
    for (let key in potentials) {
      allotted[key] = 0;
    }
    while (markersLeft > 0) {
      for (let key in potentials) {
        let addressInfos = potentials[key];
        if (markersLeft > 0 && allotted[key] < addressInfos.length) {
          allotted[key] += 1;
          markersLeft--;
        }
      }
    }
    // We want to hit the first and last items, if possible.
    // Given 3 more addresses to pick out of 8, 8/3 ~= 2.66
    // Ideally we pick 0, 2/3, 4/5, 7.
    for (let key in potentials) {
      let addressInfos = potentials[key];
      let got = allotted[key];
      let skip = (addressInfos.length - 1) / (got - 1);
      for (let i = 0; i < addressInfos.length; i += skip) {
        if (got > 0) {
          addressInfos[Math.floor(i)].label = '';
          got--;
        }
      }
    }
  }
  let markerLabelIdx = 0;
  let geocodeToLabel = {};
  let serializeGeocode = function(geocode) {
    return geocode[0] + '|' + geocode[1];
  };
  for (let idx = 0; idx < orderedIds.length; ++idx) {
    let addressInfo = addressData[orderedIds[idx]];
    let serialized = serializeGeocode(addressInfo.geocode);
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
  for (let idx = 0; idx < orderedIds.length; ++idx) {
    let addressInfo = addressData[orderedIds[idx]];
    let serialized = serializeGeocode(addressInfo.geocode);
    if (geocodeToLabel[serialized] !== undefined) {
      addressInfo.label = geocodeToLabel[serialized];
    }
  }
  
  let generateMarkers = function(lengthLimit) {
    let seen = {};
    let markers = [];
    let smallMarkers = [];
    let extras = 'color:gray|';
    for (let idx = 0; idx < orderedIds.length; ++idx) {
      let addressInfo = addressData[orderedIds[idx]];
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
    let extremes = Prettify.Address.extremes(goodAddresses);
    markers.push('visible=' + formatGeocode(extremes.min).join(','));
    markers.push('visible=' + formatGeocode(extremes.max).join(','));
    if (smallMarkers.length > 0) {
      markers.push('markers=' + extras + smallMarkers.join('|'));
    }
    return '&' + markers.join('&');
  };
  
  let newTable = document.createElement('div');
  let invalidAddressTable = addressTable.cloneNode(true);
  if (coopIds) {
    let normalRow = addressTable.querySelector('tbody tr');
    // Assuming that there is at least one normal call.
    for (let idx = 0; idx < coopIds.length; ++idx) {
      let addressInfo = addressData[coopIds[idx]];
      let newRow = normalRow.cloneNode(true);
      
      newRow.children[1].innerHTML = addressInfo.status;
      newRow.children[2].innerHTML = addressInfo.language;
      newRow.children[4].innerHTML = addressInfo.address;
      newRow.children[5].innerHTML = '';
      
      for (let i = 0; i < newRow.children.length; ++i) {
        newRow.children[i].classList.add('muted');
      }
      
      // Append to tbody.
      invalidAddressTable.children[1].appendChild(newRow);
    }
  }
  
  newTable.appendChild(invalidAddressTable);
  let subheading = document.createElement('h2');
  subheading.textContent = 'Not Valid Calls';
  newTable.insertBefore(subheading, newTable.firstChild);
  let VALID_TABLE = 0;
  let INVALID_TABLE = 1;
  let addressTables = [addressTable, invalidAddressTable];
  for (let idx = addressTables.length - 1; idx >= 0; idx--) {
    let table = addressTables[idx];
    
    let thead = table.getElementsByTagName('thead')[0];
    let headingRow = thead.getElementsByTagName('tr')[0];
    let headings = thead.getElementsByTagName('th');
    for (let i = headings.length - 1; i >= 0; --i) {
      if (headings[i].textContent.toLowerCase() === 'name & telephone') {
        headings[i].textContent = 'CONTACT';
        break;
      }
    }
    if (idx === INVALID_TABLE) {
      // Remove all but the status and address columns for invalids.
      for (let i = headings.length - 1; i >= 0; --i) {
        if (headings[i].textContent.toLowerCase() === 'language' ||
            headings[i].textContent.toLowerCase() === 'address' ||
            headings[i].textContent.toLowerCase() === 'notes') {
          continue;
        } else if (options[STORAGE_ADD_NOT_VALID_NAMES] &&
            headings[i].textContent.toLowerCase() === 'contact') {
          continue;
        }
        Util.removeElement(headings[i]);
      }
      // Duplicate headings for second row.
      let len = headings.length;
      for (let i = 0; i < len; ++i) {
        headingRow.appendChild(headings[i].cloneNode(true));
      }
      // Add CSS class to separate the tables
      table.classList.add('invalid');
    }
    
    let tbody = table.getElementsByTagName('tbody')[0];
    let trs = tbody.getElementsByTagName('tr');
    for (let i = trs.length - 1; i >= 0; --i) {
      let idField = trs[i].children[0];
      let id = idField.querySelector('.muted').textContent;
      let addressInfo = addressData[id];
      
      let statusField = trs[i].children[1];
      let language = trs[i].children[2];
      let nameAndTelephone = trs[i].children[3];
      let address = trs[i].children[4];
      let notes = trs[i].children[5];
      let checkboxes = trs[i].children[6];
      
      let status = statusField.textContent;
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
        if (!options[STORAGE_DISPLAY_LAST_CONTACTED]) {
          let contactedDate = nameAndTelephone.querySelector('small');
          if (contactedDate) {
            Util.removeElement(contactedDate);
          }
        }
        
        if (options[STORAGE_REMOVE_NAMES]) {
          // Remove name.
          let strongName = nameAndTelephone.querySelector('strong');
          if (strongName) {
            Util.removeElement(strongName);
          }
        }
      }
      
      // Bold language column.
      let languageText = language.textContent;
      if (languageText.indexOf('Chinese') !== -1) {
        // Chinese is redundant for Mandarin and Cantonese.
        let potentialReplacement = languageText.split(' ')[1];
        if (potentialReplacement) {
          languageText = potentialReplacement;
        }
      }
      language.innerHTML = '<strong>' + languageText + '</strong>';

      // Remove geocode for both.
      if (options[STORAGE_REMOVE_GEOCODE]) {
        let geocodeSpan = address.querySelector('span');
        if (geocodeSpan) {
          Util.removeElement(geocodeSpan);
        }
      }
    }
    
    // Split invalid table into two.
    if (idx === INVALID_TABLE) {
      let mid = Math.ceil(trs.length / 2);
      for (let i = 0; i < mid; ++i) {
        let curRow = trs[i];
        // Account for odd numbered tables.
        if (mid >= trs.length) {
          for (let j = curRow.children.length - 1; j >= 0; --j) {
            curRow.appendChild(document.createElement('td'));
          }
          break;
        }
        let nextRow = trs[mid];
        for (let j = 0; j < nextRow.children.length; ++j) {
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
      let STREET_ADDRESS = /[,?#\d ]* ((?:[\d]*[a-zA-Z]+(?!\d) ?)*)/;
      let CSS_CLASSES = ['light', 'dark'];
      let css_index = 1;
      for (let i = 0; i < trs.length - 1; ++i) {
        trs[i].classList.add(CSS_CLASSES[css_index]);
        let curStreet = Util.getStreetFromAddress(
            trs[i].children[4].textContent);
        let nextStreet = Util.getStreetFromAddress(
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
  let campaignText = overallCard.querySelector('.campaign');
  if (campaignText && campaignText.parentElement !== overallCard) {
    let campaignTextParent = campaignText.parentElement;
    overallCard.insertBefore(campaignText, overallCard.firstChild);
    Util.removeElement(campaignTextParent);
  }
  
  // Remove territory notes
  
  if (!options[STORAGE_DISPLAY_TERRITORY_NOTES]) {
    Util.removeElement(note);
    note = null;
  }
  
  // Must be info by now
  let addressesText = info.querySelector('strong');
  addressesText.textContent = Util.replaceNumber(
      addressesText.textContent, goodAddresses.length);
  
  // Remove legend
  if (options[STORAGE_REMOVE_LEGEND]) {
    let next = firstLegend;
    while (next && next.tagName !== 'TABLE') {
      let toRemove = next;
      next = next.nextSibling;
      Util.removeElement(toRemove);
    }
  }
  
  // Remove break
  Util.removeElements(brElements);
  
  // Add assignment box with Name and stuff.
  if (options[STORAGE_ADD_ASSIGNMENT_BOX]) {
    let assignmentBox = document.createElement('DIV');
    assignmentBox.innerHTML =
        'Name:<span class="assignment-box-separator"></span>Return By:';
    assignmentBox.classList.add('assignment-box');
    overallCard.insertBefore(assignmentBox, overallCard.firstChild);
  }
  
  let MAX_URL_LENGTH = 2048;

  // Move stats to first page.
  overallCard.insertBefore(actualTitle, bigMapParent);
  if (note != null)
    overallCard.insertBefore(note, bigMapParent);
  if (info != null)
    overallCard.insertBefore(info, bigMapParent);
  
  if (options[STORAGE_ADD_ZOOM_MAP]) {
    let newZoomMap = bigMap.cloneNode(true);
    // Cleanup unused fields.
    let mapSrc = bigMapSrc.replace(/\?&/g, '?');
    
    let extremes = Prettify.Address.extremes(goodAddresses);
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
      let title2 = actualTitle.cloneNode(true);
      title2.children[1].textContent += ' Zoomed-In';
      overallCard.insertBefore(title2, newZoomMap);
    }
  }
  
  if (options[STORAGE_ADD_MAP]) {
    // Cleanup unused fields.
    let mapSrc = bigMapSrc.replace(/\?&/g, '?');
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
      let options = {};
      for (let property in Options) {
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
  let params = Util.parseQueryString(location.search.substring(1));
  let needRefresh = false;
  let requiredParams = {
    nv: '',  // Show all non-valid calls
    m: '1',  // Primary map
    o: '0',  // Overview map
    l: '1',  // Legend
    d: '1',  // Mobile QR code
    g: '1',  // GPS coordinates
    coop: '1',  // Co-op calls
  };
  for (let key in requiredParams) {
    if (params[key] === undefined ||
        params[key] !== requiredParams[key]) {
      params[key] = requiredParams[key];
      needRefresh = true;
    }
  }
  if (needRefresh) {
    let queryString = [];
    for (let key in params) {
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
    for (let property in changes) {
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