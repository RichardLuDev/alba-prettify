'use strict';

var ADDRESSES = 'addresses';
var SAVE_ID = 'alba-prettify-export-save';
var OLD_FILE_ID = 'alba-prettify-old-file';
var NEW_FILE_ID = 'alba-prettify-new-file';
var DIFF_ID = 'alba-prettify-diff';
var EXPORT_BOX_ID = 'export';
var LINE_ENDING_REGEX = /\r\n|\r|\n/;
var TAB_REGEX = /\t/;
var ADDRESS_ID = 'Address_ID';
var DATA_STRING = 'data-string';
var CARE_FIELDS = {
  'Suite': true,
  'Address': true,
  'City': true,
  'Province': true,
  'Postal_code': true,
  'Country': true,
};

var exportButton = document.querySelector('.cmd-export');

var numToString = function(number, digits) {
  var string = number.toString();
  if (digits !== undefined && digits > string.length) {
    string = Array(digits - string.length + 1).join('0') + string;
  }
  return string;
};

var formatDate = function(date) {
  return [date.getFullYear(),
          numToString(date.getMonth() + 1, 2),
          numToString(date.getDate(), 2)].join('-');
};

var addFileInputs = function() {
  var oldFileInput = document.createElement('input');
  var newFileInput = document.createElement('input');
  var compareButton = document.createElement('button');
  var exportBox = document.getElementById(EXPORT_BOX_ID);
  
  oldFileInput.id = OLD_FILE_ID;
  newFileInput.id = NEW_FILE_ID;
  oldFileInput.type = newFileInput.type = 'file';
  oldFileInput.title = 'Older Backup';
  newFileInput.title = 'Newer Backup';
  compareButton.title = ADDED_BY;
  compareButton.textContent = 'Compare';
  
  var processText = function(text) {
    var lines = text.split(LINE_ENDING_REGEX);
    var data = {};
    var headers = lines[0].split(TAB_REGEX);
    for (var i = 1; i < lines.length; ++i) {
      var values = lines[i].split(TAB_REGEX);
      var info = {};
      info[DATA_STRING] = [];
      for (var j = 0; j < headers.length; ++j) {
        if (CARE_FIELDS[headers[j]]) {
          info[headers[j]] = values[j];
          if (values[j]) {
            info[DATA_STRING].push(values[j]);
          }
        }
      }
      info[DATA_STRING] = info[DATA_STRING].join(', ');
      data[values[0]] = info;
    }
    return data;
  };
  
  var infoEqual = function(info1, info2) {
    // Assuming same properties.
    for (var property in info1) {
      if (info1[property] !== info2[property]) {
        return false;
      }
    }
    return true;
  };
  
  var displayDiff = function(added, removed, changedFrom, changedTo) {
    var diffElement = document.getElementById(DIFF_ID);
    if (diffElement === null) {
      diffElement = document.createElement('div');
      diffElement.id = DIFF_ID;
      exportBox.parentElement.insertBefore(diffElement, exportBox);
    } else {
      while (diffElement.firstChild) {
        diffElement.removeChild(diffElement.firstChild);
      }
    }
    var printElements = function(className, from, to) {
      for (var i = 0; i < from.length; ++i) {
        var fromElement = document.createElement('div');
        fromElement.classList.add(className);
        fromElement.textContent = from[i][DATA_STRING];
        diffElement.appendChild(fromElement);
        if (to) {
          var toElement = document.createElement('div');
          toElement.classList.add(className);
          toElement.textContent = '=>\t' + to[i][DATA_STRING];
          diffElement.appendChild(toElement);
        }
      }
    };
    printElements('added', added);
    printElements('removed', removed);
    printElements('changed', changedFrom, changedTo);
  };
  
  compareButton.addEventListener('click', function(e) {
    e.preventDefault();
    var oldFile = oldFileInput.files[0];
    var newFile = newFileInput.files[0];
    if (oldFile === undefined || newFile === undefined) {
      // Um... fail.
      return;
    }
    var getReadFile = function(file) {
      return new Promise(function(resolve) {
        var reader = new FileReader();
        reader.onload = function(e) {
          resolve(e.target.result);
        };
        reader.readAsText(file);
      })
    };
    var readOldFile = getReadFile(oldFile);
    var readNewFile = getReadFile(newFile);
    readNewFile.then(function(newText) {
      readOldFile.then(function(oldText) {
        var newData = processText(newText);
        var oldData = processText(oldText);
        var added = [];
        var removed = [];
        var changedTo = [];
        var changedFrom = [];
        for (var id in newData) {
          var newInfo = newData[id];
          if (oldData[id] === undefined) {
            added.push(newInfo);
          } else if (!infoEqual(oldData[id], newInfo)) {
            changedFrom.push(oldData[id]);
            changedTo.push(newInfo);
          }
        }
        for (var id in oldData) {
          var oldInfo = oldData[id];
          if (newData[id] === undefined) {
            removed.push(oldInfo);
          }
        }
        displayDiff(added, removed, changedFrom, changedTo);
      });
    });
  });
  
  exportBox.parentElement.insertBefore(oldFileInput, exportBox);
  exportBox.parentElement.insertBefore(newFileInput, exportBox);
  exportBox.parentElement.insertBefore(compareButton, exportBox);
};

var addSaveButton = function() {
  var saveElement = document.createElement('button');
  saveElement.id = SAVE_ID;
  saveElement.title = ADDED_BY;
  var saveText = document.createTextNode('Save backup file');
  saveElement.appendChild(saveText);
  exportButton.parentElement.insertBefore(saveElement, exportButton);
  saveElement.disabled = true;
  
  saveElement.addEventListener('click', function(e) {
    // Download the textarea as file.
    var text = document.querySelector('#export').textContent;
    var blob = new Blob([text], {type: 'text/plain'});
    var date = new Date();
    var name = formatDate(date) + ' ' + 'Alba Backup.txt';
    var link = document.createElement('a');
    link.download = name;
    link.href = window.URL.createObjectURL(blob);
    link.click();
    // Prevent page from reloading.
    e.preventDefault();
    
    Analytics.recordEvent(ADDRESSES, 'click', SAVE_ID);
  });

  // Focus is the only event that reliably fires after pressing export.
  var exportBox = document.getElementById(EXPORT_BOX_ID);
  exportBox.addEventListener('focus', function disableSaveElement() {
    exportBox.removeEventListener('focus', disableSaveElement);
    saveElement.disabled = false;
  });
};

exportButton.addEventListener('click', function addStuff() {
  exportButton.removeEventListener('click', addStuff);
  addSaveButton();
  addFileInputs();
});