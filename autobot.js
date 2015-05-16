(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['jquery', 'hljs'], function(jQuery, hljs) {
      return (root.Autobot = factory(root, jQuery, hljs));
    });
  } else if (typeof exports === 'object') {
    module.exports = factory(root, require('jquery'), require('hljs'));
  } else {
    root.Autobot = factory(root, root.jQuery, root.hljs);
  }
}(this, function (window, $, hljs) {
  Autobot.DEFAULT_OPTS = {
    keystrokeMs: 20,
    periodMs: 600,
    endCommentMs: 1000,
    renderTemplate: $('<pre>', {'class': 'autobot-code'})
  };
  function Autobot ($els, opts) {
    var self = this;
    self.opts = $.extend(true, null, Autobot.DEFAULT_OPTS, opts);
    self.data = {};
    self.pending = [];
    $els.each(function (i, el) {
      var $el = $(el);
      var name = $el.attr('data-autobot');
      self.data[name] = {
        name: name,
        $el: $el,
        $renderEl: $(self.opts.renderTemplate).clone().appendTo('body'),
        content: $el.html(),
        i: 0
      };
      $el.html('');
      self.pending[$el.is('data-autobot-current') ? 'unshift' : 'push'](name);
    });
  }
  Autobot.prototype.animate = function () {
    var self = this;
    self.step(self.animate.bind(self));
  };
  Autobot.prototype.step = function (fn) {
    var self = this;
    var opts = self.opts;

    if (!self.pending.length) return;
    var current = self.pending[0];
    var data = self.data[current];
    var currentContent = data.content.slice(0, data.i++);
    data.$el.html(currentContent);
    data.$renderEl.text(currentContent);

    if (typeof opts.step === 'function') opts.step.call(self, data);

    if (data.i >= data.content.length) self.pending.shift();
    else {
      var next = (currentContent.match(/autobot-next=(\w+)\W$/) || [])[1];
      if (next) self.pending = self.pending
        .splice(self.pending.indexOf(next) || Infinity, 1)
        .concat(self.pending);
    }

    setTimeout(fn, self.getTimeout(currentContent));
  };
  Autobot.prototype.getTimeout = function (content) {
    var self = this;
    var opts = self.opts;
    if (content.match(/(\.|\n)$/)) return opts.periodMs;
    if (content.match(/(\*\/|-->)$/)) return opts.endCommentMs;
    if (content.match(/\s+$/)) return 0; // skip whitespace
    return opts.keystrokeMs;
  };

  $(function () {
    new Autobot($('[data-autobot]')).animate();
  });

  return Autobot;
}));
