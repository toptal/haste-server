///// represents a single document

var haste_document = function() {
  this.locked = false;
};

// Get this document from the server and lock it here
haste_document.prototype.load = function(key, callback) {
  var _this = this;
  $.ajax('/documents/' + key, {
    type: 'get',
    dataType: 'json',
    success: function(res) {
      _this.locked = true;
      _this.data = res.data;
      var high = hljs.highlightAuto(res.data);
      callback({
        value: high.value,
        key: key,
        language: high.language
      });
    },
    error: function(err) {
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
  $.ajax('/documents', {
    type: 'post',
    data: data,
    dataType: 'json',
    success: function(res) {
      _this.locked = true;
      var high = hljs.highlightAuto(data);
      callback({
        value: high.value,
        key: res.key,
        language: high.language
      });
    }
  });
};

///// represents the paste application

var haste = function(appName) {
  this.appName = appName;
  this.$textarea = $('textarea');
  this.$box = $('#box');
  this.$code = $('#box code');
  this.configureShortcuts();
};

// Set the page title - include the appName
haste.prototype.setTitle = function(ext) {
  var title = ext ? this.appName + ' - ' + ext : this.appName;
  document.title = title;
};

// Remove the current document (if there is one)
// and set up for a new one
haste.prototype.newDocument = function(hideHistory) {
  this.doc = new haste_document();
  this.$box.hide();
  if (!hideHistory) {
    window.history.pushState(null, this.appName, '/');
  }
  this.setTitle();
  this.$textarea.val('').show().focus();
}

// Load a document and show it
haste.prototype.loadDocument = function(key) {
  var _this = this;
  _this.doc = new haste_document();
  _this.doc.load(key, function(ret) {
    if (ret) {
      _this.$code.html(ret.value);
      var title = ret.key;
      if (ret.language) {
        title += ' - ' + ret.language;
      }
      _this.setTitle(title);
      _this.$textarea.val('').hide();
      _this.$box.show();
    }
    else {
      _this.newDocument();
    }
  });
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
  this.doc.save(this.$textarea.val(), function(ret) {
    if (ret) {
      _this.$code.html(ret.value);
      var title = ret.key;
      if (ret.language) {
        title += ' - ' + ret.language;
      }
      _this.setTitle(title);
      window.history.pushState(null, _this.appName + '-' + ret.key, '/' + ret.key);
      _this.$textarea.val('').hide();
      _this.$box.show();
    }
  });
};

// Configure keyboard shortcuts for the textarea
haste.prototype.configureShortcuts = function() {
  var _this = this;
  $('body').keyup(function(evt) {
    // ^L or ^S for lock
    if (evt.ctrlKey && (evt.keyCode === 76 || evt.keyCode === 83)) {
      if (_this.$textarea.val().replace(/^\s+|\s+$/g, '') !== '') {
        evt.preventDefault();
        _this.lockDocument();
      }
    }
    // ^N for new document
    else if (evt.ctrlKey && evt.keyCode === 78) {
      evt.preventDefault();
      _this.newDocument();
    }
    // ^D for duplicate - only when locked
    else if (_this.doc.locked && evt.ctrlKey && evt.keyCode === 68) {
      evt.preventDefault();
      _this.duplicateDocument();
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
        sel = document.selection.createRange();
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
