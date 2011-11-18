


var application = function() {

};



// TODO implement save as a jquery method
// TODO maybe remove jquery
// TODO support for browsers without pushstate
// TODO tab support
// TODO support for push state navigation
// TODO layerX and layerY fix warnings
var save = function(data, callback) {
  var high = hljs.highlightAuto(data);
  var pack = {
    language: high.language,
    data: data
  };
  pack.value = high.value;
  pack.uuid = '123456';
  callback(pack);
};

$(function() {

  $('textarea').focus();

  $('textarea').keyup(function(evt) {
    if (evt.ctrlKey && evt.which === 76) {
      save($('textarea').val(), function(ret) {
        if (ret) {
          $('#box code').html(ret.value);
          // window.history.pushState(null, 'Heist - ' + ret.language, '/~john/heist/' + ret.uuid);
          document.title = 'heist - ' + ret.language;
          $('textarea').hide();
          $('#box').show();	
        }
      });
    }
  });

  $('textarea').keydown(function(evt) {
    if (evt.keyCode === 9) {
      evt.preventDefault();
      var myValue = '  ';
      // Inspired by http://stackoverflow.com/questions/946534/insert-text-into-textarea-with-jquery
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
        this.value = this.value.substring(0, startPos)+myValue+this.value.substring(endPos,this.value.length);
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
