window.Haste = {
  Models: {},
  Views: {},
  Routers: {},

  extensionMap: {
    clj: 'clojure', coffee: 'coffeescript', css: 'css', diff: 'diff', go: 'go',
    hs: 'haskell', html: 'htmlmixed', js: 'javascript', lua: 'lua',
    md: 'markdown', markdown: 'markdown', sql: 'mysql', pl: 'perl', php: 'php',
    py: 'python', r: 'r', rb: 'ruby', scm: 'scheme', xml: 'xml', yml: 'yaml'
  },

  init: function() {
    new Haste.Routers.Document();
    Backbone.history.start({ pushState: true });
  }
};

Haste.Models.Document = Backbone.Model.extend({
  idAttribute: 'key',
  urlRoot: '/documents'
});

Haste.Routers.Document = Backbone.Router.extend({
  routes: {
    ':id.:extension': 'show',
    ':id': 'show',
    '': 'new'
  },

  initialize: function() {
    this.editor = new Haste.Views.EditorView();
  },

  show: function(id, extension) {
    this.editor.load(id, extension);
  },

  new: function() {
    this.editor.new();
  }
});

Haste.Views.ActionsView = Backbone.View.extend({
  el: 'header',

  events: {
    'click .new': 'new',
    'click .save': 'save',
    'click .edit': 'edit',
    'click .raw': 'raw',
    'click .twitter': 'raw'
  },

  initialize: function() {
    this.parent = this.options.parent;
  },

  toggleActions: function() {
    var klass = 'disabled';

    if (this.parent.model.isNew()) {
      $('.save', this.el).removeClass(klass);
      $('.edit, .raw, .twitter', this.el).addClass(klass);
    } else {
      $('.save', this.el).addClass(klass);
      $('.edit, .raw, .twitter', this.el).removeClass(klass);
    }

    this.setLink('.raw', 'raw/' + this.parent.model.id);
    this.setLink('.twitter', 'https://twitter.com/share?url=' + encodeURI(window.location.href));
  },

  setLink: function(el, href) {
    if (this.parent.model.isNew()) {
      href = '#';
    }

    $(el, this.el).attr('href', href);
  },

  new: function(event) {
    event.preventDefault();
    this.parent.new();
    Backbone.history.navigate('');
  },

  save: function(event) {
    event.preventDefault();

    if (!this.parent.model.isNew()) { return; }

    this.parent.save();
  },

  edit: function(event) {
    event.preventDefault();

    if (this.parent.model.isNew()) { return; }

    this.parent.model.set('key', null);
    Backbone.history.navigate('/');
  },

  raw: function(event) {
    if (this.model.isNew()) {
      event.preventDefault();
    }
  },
});

Haste.Views.EditorView = Backbone.View.extend({
  el: 'textarea',

  initialize: function() {
    this.codeMirror = CodeMirror.fromTextArea(this.el, {
      mode: 'null',
      lineNumbers: true,
      theme: 'solarized-dark'
    });

    this.actionsView = new Haste.Views.ActionsView({ parent: this });
  },

  render: function() {
    this.codeMirror.setOption('mode', this.model.get('mode') || 'null');
    this.codeMirror.setValue(this.model.get('data') || '');

    return this;
  },

  new: function() {
    this.model = new Haste.Models.Document();

    this.model.on('change', this.render, this);
    this.model.on('change', this.toggleLock, this);
    this.model.on('change', this.actionsView.toggleActions, this.actionsView);

    this.model.trigger('change');
  },

  load: function(key, extension) {
    this.new();

    var mode = Haste.extensionMap[extension];
    this.model.set({ key: key, mode: mode }, { silent: true });

    this.model.fetch();
  },

  save: function() {
    var data = this.codeMirror.getValue();

    if (!data) { return; }

    this.model.save('data', data, {
      success: function(model, response) {
        Backbone.history.navigate(model.id);
      }
    });
  },

  toggleLock: function() {
    this.codeMirror.setOption('readOnly', !this.model.isNew());
    this.actionsView.toggleActions();
  }
});

$(function() {
  Haste.init();
});
