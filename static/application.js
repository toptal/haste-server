/* global $, hljs, window, document */

///// represents a single document

var haste_document = function() {
  this.locked = false;
};

// Escapes HTML tag characters
haste_document.prototype.htmlEscape = function(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/>/g, '&gt;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
};

// Get this document from the server and lock it here
haste_document.prototype.load = function(key, callback, lang) {
  var _this = this;
  $.ajax('/documents/' + key, {
    type: 'get',
    dataType: 'json',
    success: function(res) {
      _this.locked = true;
      _this.key = key;
      _this.data = res.data;
      try {
        var high;
        if (lang === 'txt') {
          high = { value: _this.htmlEscape(res.data) };
        }
        else if (lang) {
          high = hljs.highlight(lang, res.data);
        }
        else {
          high = hljs.highlightAuto(res.data);
        }
      } catch(err) {
        // failed highlight, fall back on auto
        high = hljs.highlightAuto(res.data);
      }
      callback({
        value: high.value,
        key: key,
        language: high.language || lang,
        lineCount: res.data.split('\n').length
      });
    },
    error: function() {
      callback(false);
    }
  });
};

// Save this document to the server and lock it here
haste_document.prototype.save = function(key, data, callback) {
  if (this.locked) {
    return false;
  }
  this.data = data;
  var _this = this;
  $.ajax('/documents/' + key, {
    type: 'post',
    data: data,
    dataType: 'json',
    contentType: 'text/plain; charset=utf-8',
    success: function(res) {
      _this.key = res.key;
      var high = hljs.highlightAuto(data);
      callback(null, {
        value: high.value,
        key: res.key,
        language: high.language,
        lineCount: data.split('\n').length
      });
    },
    error: function(res) {
      try {
        callback($.parseJSON(res.responseText));
      }
      catch (e) {
        callback({message: 'Something went wrong!'});
      }
    }
  });
};

// Save this document to the server and lock it here
haste_document.prototype.deleteDocument = function(key, callback) {
  if (!this.locked) {
    return false;
  }
  var _this = this;
  $.ajax('/documents/' + key, {
    type: 'delete',
    success: function(res) {
      callback(null, res);
    },
    error: function(res) {
      try {
        callback($.parseJSON(res.responseText));
      }
      catch (e) {
        callback({message: 'Something went wrong!'});
      }
    }
  });
};

// get a valid key from server
haste_document.prototype.getkey = function(callback) {
  $.ajax('/key/', {
    type: 'get',
    success: function(res) {
      callback(null, res);
    },
    error: function(res) {
      try {
        callback($.parseJSON(res.responseText));
      }
      catch (e) {
        callback({message: 'Something went wrong!'});
      }
    }
  });
};

///// represents the paste application

var haste = function(appName, options) {
  this.appName = appName;
  this.$textarea = $('textarea');
  this.$box = $('#box');
  this.$code = $('#box code');
  this.$linenos = $('#linenos');
  this.options = options;
  this.configureShortcuts();
  this.configureButtons();
  // If twitter is disabled, hide the button
  if (!options.twitter) {
    $('#box2 .twitter').hide();
  }
};

// Set the page title - include the appName
haste.prototype.setTitle = function(ext) {
  var title = ext ? this.appName + ' - ' + ext : this.appName;
  document.title = title;
};

// Show a message box
haste.prototype.showMessage = function(msg, cls) {
  var msgBox = $('<li class="'+(cls || 'info')+'">'+msg+'</li>');
  $('#messages').prepend(msgBox);
  setTimeout(function() {
    msgBox.slideUp('fast', function() { $(this).remove(); });
  }, 3000);
};

// Show the light key
haste.prototype.lightKey = function() {
  this.configureKey(['new', 'save']);
};

// Show the full key
haste.prototype.fullKey = function() {
  this.configureKey(['new', 'duplicate', 'edit', 'raw', 'delete']);
};

// Show all the keys
haste.prototype.allKey = function() {
  this.configureKey(['new', 'save', 'duplicate', 'edit', 'raw', 'delete']);
};

// Set the key up for certain things to be enabled
haste.prototype.configureKey = function(enable) {
  var $this, i = 0;
  $('#box2 .function').each(function() {
    $this = $(this);
    for (i = 0; i < enable.length; i++) {
      if ($this.hasClass(enable[i])) {
        $this.addClass('enabled');
        return true;
      }
    }
    $this.removeClass('enabled');
  });
};

haste.prototype.getCurrentKey = function () {
  var key = window.location.pathname;
  if (key == "/")
    key = null;
  else
    key = key.substr(1);

  return key;
}


// Get this document from the server and lock it here
haste.prototype.getList = function(callback) {
  var _this = this;
  $.ajax('/documents/', {
    type: 'get',
    dataType: 'json',
    success: function(res) {
      callback(res);
    },
    error: function() {
      callback(false);
    }
  });
};

// Remove the current document (if there is one)
// and set up for a new one
haste.prototype.newDocument = function(forcenewkey, callback) {
  var _this = this;

  var key = this.getCurrentKey();
  var newdoc = function(key) {
    window.history.pushState(null, _this.appName, '/'+key);
    _this.$box.hide();
    _this.doc = new haste_document();
    _this.setTitle();
    _this.lightKey();
    _this.$textarea.val('').show('fast', function() {
      this.focus();
    });
    _this.removeLineNumbers();
    if (callback) {
      callback(_this.doc);
    }
  }
  if (key&&!forcenewkey) {
    newdoc(key);
  } else {
    haste_document.prototype.getkey(function (err, key) {
      newdoc(key);
    });
  }
  _this.updateList();
};

// Map of common extensions
// Note: this list does not need to include anything that IS its extension,
// due to the behavior of lookupTypeByExtension and lookupExtensionByType
// Note: optimized for lookupTypeByExtension
haste.extensionMap = {
  rb: 'ruby', py: 'python', pl: 'perl', php: 'php', scala: 'scala', go: 'go',
  xml: 'xml', html: 'xml', htm: 'xml', css: 'css', js: 'javascript', vbs: 'vbscript',
  lua: 'lua', pas: 'delphi', java: 'java', cpp: 'cpp', cc: 'cpp', m: 'objectivec',
  vala: 'vala', sql: 'sql', sm: 'smalltalk', lisp: 'lisp', ini: 'ini',
  diff: 'diff', bash: 'bash', sh: 'bash', tex: 'tex', erl: 'erlang', hs: 'haskell',
  md: 'markdown', txt: '', coffee: 'coffee', swift: 'swift'
};

// Look up the extension preferred for a type
// If not found, return the type itself - which we'll place as the extension
haste.prototype.lookupExtensionByType = function(type) {
  for (var key in haste.extensionMap) {
    if (haste.extensionMap[key] === type) return key;
  }
  return type;
};

// Look up the type for a given extension
// If not found, return the extension - which we'll attempt to use as the type
haste.prototype.lookupTypeByExtension = function(ext) {
  return haste.extensionMap[ext] || ext;
};

// Add line numbers to the document
// For the specified number of lines
haste.prototype.addLineNumbers = function(lineCount) {
  var h = '';
  for (var i = 0; i < lineCount; i++) {
    h += (i + 1).toString() + '<br/>';
  }
  $('#linenos').html(h);
};

// Remove the line numbers
haste.prototype.removeLineNumbers = function() {
  $('#linenos').html('&gt;');
};

// Load a document and show it
haste.prototype.loadDocument = function(key) {
  // Split the key up
  var parts = key.split('.', 2);
  // Ask for what we want
  var _this = this;
  _this.doc = new haste_document();
  _this.doc.load(key, function(ret) {
    if (ret) {
      _this.$code.html(ret.value);
      _this.setTitle(ret.key);
      _this.fullKey();
      _this.$textarea.val('').hide();
      _this.$box.show().focus();
      _this.addLineNumbers(ret.lineCount);
    }
    else {
      _this.newDocument();
    }
  }, this.lookupTypeByExtension(parts[1]));
  this.updateList();
};

// Duplicate the current document - only if locked
haste.prototype.duplicateDocument = function() {
  var _this = this;
  if (_this.doc.locked) {
    var currentData = _this.doc.data;
    _this.newDocument(true, function () {
      _this.$textarea.val(currentData);
    });
  }
};

// Lock the current document
haste.prototype.lockDocument = function() {
  var _this = this;
  this.doc.save(this.getCurrentKey(), this.$textarea.val(), function(err, ret) {
    if (err) {
      _this.showMessage(err.message, 'error');
    }
    else if (ret) {
      _this.doc.locked = true;
      _this.$code.html(ret.value);
      _this.setTitle(ret.key);
      _this.fullKey();
      _this.$textarea.val('').hide();
      _this.$box.show().focus();
      _this.addLineNumbers(ret.lineCount);
    }
  });
};

// UnLock the current document
haste.prototype.unlockDocument = function() {
  var _this = this;
  _this.$textarea.val(_this.$code.text()).show().focus();
  _this.$box.hide();
  _this.lightKey();
  _this.removeLineNumbers();
  _this.doc.locked = false;
};

haste.prototype.configureButtons = function() {
  var _this = this;
  this.buttons = [
    {
      $where: $('#box2 .save'),
      label: 'Save',
      shortcutDescription: 'control + s',
      shortcut: function(evt) {
        return evt.ctrlKey && (evt.keyCode === 83);
      },
      action: function() {
        if (_this.$textarea.val().replace(/^\s+|\s+$/g, '') !== '') {
          _this.lockDocument();
        }
      }
    },
    {
      $where: $('#box2 .new'),
      label: 'New',
      shortcut: function(evt) {
        return evt.ctrlKey && evt.keyCode === 78;
      },
      shortcutDescription: 'control + n',
      action: function() {
        _this.newDocument(true);
      }
    },
    {
      $where: $('#box2 .duplicate'),
      label: 'Duplicate & Edit',
      shortcut: function(evt) {
        return _this.doc.locked && evt.ctrlKey && evt.keyCode === 68;
      },
      shortcutDescription: 'control + d',
      action: function() {
        _this.duplicateDocument();
      }
    },
    {
      $where: $('#box2 .raw'),
      label: 'Just Text',
      shortcut: function(evt) {
        return evt.ctrlKey && evt.shiftKey && evt.keyCode === 82;
      },
      shortcutDescription: 'control + shift + r',
      action: function() {
        window.location.href = '/raw/' + _this.doc.key;
      }
    },
    {
      $where: $('#box2 .edit'),
      label: 'Edit',
      shortcut: function(evt) {
        return _this.doc.locked && evt.shiftKey && evt.ctrlKey && evt.keyCode == 84;
      },
      shortcutDescription: 'control + shift + t',
      action: function() {
        _this.unlockDocument();
      }
    },
    {
      $where: $('#box2 .delete'),
      label: 'Delete',
      shortcut: function(evt) {
        return false;
      },
      shortcutDescription: 'none',
      action: function() {
        _this.doc.deleteDocument(_this.getCurrentKey(), function () { 
          _this.$box.html('');
          _this.removeLineNumbers();
          _this.showMessage("Deleted");
          _this.updateList();
        });
      }
    }
  ];
  for (var i = 0; i < this.buttons.length; i++) {
    this.configureButton(this.buttons[i]);
  }
};

haste.prototype.configureButton = function(options) {
  // Handle the click action
  options.$where.click(function(evt) {
    evt.preventDefault();
    if (!options.clickDisabled && $(this).hasClass('enabled')) {
      options.action();
    }
  });
  // Show the label
  options.$where.mouseenter(function() {
    $('#box3 .label').text(options.label);
    $('#box3 .shortcut').text(options.shortcutDescription || '');
    $('#box3').show();
    $(this).append($('#pointer').remove().show());
  });
  // Hide the label
  options.$where.mouseleave(function() {
    $('#box3').hide();
    $('#pointer').hide();
  });
};

haste.prototype.updateList = function () {
  var _this = this;
  _this.getList(function (lst) {
    if (lst) {
      var lis = "";
      var cnt = 0;
      lst.forEach(function (file) {
        if (cnt < 150)
          lis+= '<li><a href="'+file+'">'+file+'</a></li>';
        cnt++;
      });
      $('#list').html(lis);
    }
  });
};

// Configure keyboard shortcuts for the textarea
haste.prototype.configureShortcuts = function() {
  var _this = this;
  $(document.body).keydown(function(evt) {
    var button;
    for (var i = 0 ; i < _this.buttons.length; i++) {
      button = _this.buttons[i];
      if (button.shortcut && button.shortcut(evt)) {
        evt.preventDefault();
        button.action();
        return;
      }
    }
  });
};

haste.prototype.autosave = function() {
  var _this = this;
  _this.$textarea.on('keydown', function () {
    _this.doc.changed = true;
  });

  var cycle = function () {
    if ((_this.doc)&&(!_this.doc.locked)&&(_this.doc.changed)) {
      _this.doc.save(_this.getCurrentKey(), _this.$textarea.val(), function (err, data) {
        if (err) {
          _this.showMessage("Error "+err);
        }
      });
      _this.doc.changed = false;
    }
    window.setTimeout(cycle, 5000);  
  };

  window.setTimeout(cycle, 5000);
};

///// Tab behavior in the textarea - 2 spaces per tab
$(function() {

  $('textarea').keydown(function(evt) {
    if (evt.keyCode === 9) {
      evt.preventDefault();
      var myValue = '  ';
      // http://stackoverflow.com/questions/946534/insert-text-into-textarea-with-jquery
      // For browsers like Internet Explorer
      if (document.selection) {
        this.focus();
        var sel = document.selection.createRange();
        sel.text = myValue;
        this.focus();
      }
      // Mozilla and Webkit
      else if (this.selectionStart || this.selectionStart == '0') {
        var startPos = this.selectionStart;
        var endPos = this.selectionEnd;
        var scrollTop = this.scrollTop;
        this.value = this.value.substring(0, startPos) + myValue +
          this.value.substring(endPos,this.value.length);
        this.focus();
        this.selectionStart = startPos + myValue.length;
        this.selectionEnd = startPos + myValue.length;
        this.scrollTop = scrollTop;
      }
      else {
        this.value += myValue;
        this.focus();
      }
    }
  });

});
