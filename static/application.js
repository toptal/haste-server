/* global $, hljs, window, document */

const workersUrl = 'https://api.knx.cool/';

///// represents a single document
var haste_document = function() {
  this.locked = false;
};

// Escapes HTML tag characters
htmlEscape = function(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/>/g, '&gt;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
};

// Get this document from the server and lock it here
haste_document.prototype.load = function(key, callback, lang) {
  var _this = this;
  $.ajax(workersUrl + key, {
    type: 'get',
    dataType: 'json',
    success: function(res) {
      _this.locked = true;
      _this.key = key;
      _this.data = res.data;

      callback({
        value: htmlEscape(_this.data),
        key: key,
        language: lang,
        lineCount: _this.data.split('\n').length
      });
    },
    error: function(xhr, status, error) {
      callback(false);
    }
  });
};

// Save this document to the server and lock it here
haste_document.prototype.save = function(data, callback) {
  if (this.locked) {
    return false;
  }
  this.data = data;
  var _this = this;
  $.ajax(workersUrl + 'documents', {
    type: 'put',
    data: data,
    dataType: 'json',
    contentType: 'text/plain; charset=utf-8',
    success: function(res) {
      _this.locked = true;
      _this.key = res.key;
      callback(null, {
        value: data,
        key: res.key,
        language: null,
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
  this.configureKey(['new', 'duplicate', 'raw']);
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

// Remove the current document (if there is one)
// and set up for a new one
haste.prototype.newDocument = function(hideHistory) {
  const elements = document.getElementsByTagName('code');
  while(elements.length > 0){
    elements[0].parentNode.removeChild(elements[0]);
  }
  this.$box.hide();
  this.doc = new haste_document();
  this.setTitle();
  this.lightKey();
  this.$textarea.val('').show('fast', function() {
    this.focus();
  });
  this.removeLineNumbers();
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
  removeElementsByClass('linenumber');

  if(window.location.hash) {
    const hash = window.location.hash.substring(1);
    highlightNew(getLineElement(hash));

    /*document.getElementById('line' + hash).scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });*/
  }
  /*for (var i = 0; i < lineCount; i++) {
    let div = document.createElement('a');
    div.classList.add('linenumber');
    div.style.marginTop = i * 16 + 'px';
    let line = i + 1;
    div.id = 'line' + line;
    div.href = '#' + line;
    div.onclick = function() {
        highlightLine(line);
    }
    let text = document.createTextNode(line.toString());
    div.appendChild(text);
    document.body.appendChild(div)
  }

  if(window.location.hash) {
    const hash = window.location.hash.substring(1);
    highlightLine(hash)

    /*document.getElementById('line' + hash).scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });*/
  //}
};

function highlightLine(line) {
  var box = document.getElementById("box");
  // create highlight div
  removeElementsByClass('highlight');
  let highlight = document.createElement('div');
  highlight.classList.add('highlight');
  highlight.style.marginTop = ((line - 1) * 16) + 'px';
  box.insertBefore(highlight, box.firstChild);
}

function removeElementsByClass(className){
  const elements = document.getElementsByClassName(className);
  while(elements.length > 0){
    elements[0].parentNode.removeChild(elements[0]);
  }
}

// Remove the line numbers
haste.prototype.removeLineNumbers = function() {
  removeElementsByClass("highlight");
  removeElementsByClass('linenumber');
  let div = document.createElement('a');
  div.classList.add('linenumber');
  let text = document.createTextNode('>');
  div.appendChild(text);
  document.body.appendChild(div)
};

// Load a document and show it
haste.prototype.loadDocument = function(key) {
  // Split the key up
  var parts = key.split('.', 2);
  // Ask for what we want
  var _this = this;
  _this.doc = new haste_document();
  _this.doc.load(parts[0], function(ret) {
    if (ret) {
      const lines = ret.value.split(/\r\n|\r|\n/);
      for (let i = 0; i < lines.length; i++) {
        let code = document.createElement('code');
        code.innerHTML = lines[i];
        let pre = document.getElementById("box");
        pre.appendChild(code);

        code.onclick = function() {
          var file = '/' + ret.key + "#" + (i + 1).toString();
          window.history.pushState(null, _this.appName + '-' + ret.key, file);
          highlightNew(code);
        }
      }

      _this.setTitle(ret.key);
      _this.fullKey();
      _this.$textarea.val('').hide();
      _this.$box.show().focus();
      _this.addLineNumbers(ret.lineCount);
      //hljs.highlightAll();
    }
    else {
      _this.newDocument();
    }
  }, this.lookupTypeByExtension(parts[1]));
};

// Duplicate the current document - only if locked
haste.prototype.duplicateDocument = function() {
  if (this.doc.locked) {
    var currentData = this.doc.data;
    this.newDocument();
    this.$textarea.val(currentData);
  }
};

// Lock the current document
haste.prototype.lockDocument = function() {
  var _this = this;
  this.doc.save(this.$textarea.val(), function(err, ret) {
    if (err) {
      _this.showMessage(err.message, 'error');
    }
    else if (ret) {
      //_this.$code.html(htmlEscape(ret.value));
      const lines = ret.value.split(/\r\n|\r|\n/);
      for (let i = 0; i < lines.length; i++) {
        let code = document.createElement('code');
        code.innerHTML = lines[i];
        let pre = document.getElementById("box");
        pre.appendChild(code);

        code.onclick = function() {
          var file = '/' + ret.key + "#" + (i + 1).toString();
          window.history.pushState(null, _this.appName + '-' + ret.key, file);
          highlightNew(code);
        }
      }

      _this.setTitle(ret.key);
      var file = '/' + ret.key;
      window.history.pushState(null, _this.appName + '-' + ret.key, file);
      _this.fullKey();
      _this.$textarea.val('').hide();
      _this.$box.show().focus();
      _this.addLineNumbers(ret.lineCount);
     // hljs.highlightAll();
    }
  });
};

function highlightNew(code) {
  const codes = document.getElementsByTagName("code");
  let maxWidth = 0;
  for (let i = 0; i < codes.length; i++) {
    if (codes[i].offsetWidth > maxWidth) {
      maxWidth = codes[i].offsetWidth;
    }
    codes[i].style.removeProperty("background-color");
  }
  const windowWidth = $(document).width();
  if(windowWidth > maxWidth)
    maxWidth = windowWidth;

  for (let i = 0; i < codes.length; i++) {
    codes[i].style.width = maxWidth + 'px';
  }
  code.style.backgroundColor = "rgba(187, 128, 9, 0.25)";
}

function getLineElement(line) {
  return document.getElementsByTagName("code")[line - 1];
}

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
        _this.newDocument(!_this.doc.key);
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
        window.location.href = workersUrl + 'raw/' + _this.doc.key;
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
