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
      if ($el.is('data-autobot-current') || !self.current) self.current = name;
    });
  }
  Autobot.prototype.animate = function () {
    var self = this;
    self.step(self.animate.bind(self));
  };
  Autobot.prototype.step = function (fn) {
    var self = this;
    var opts = self.opts;

    var currentData = self.data[self.current];
    var currentContent = currentData.content.slice(0, currentData.i++);
    currentData.$el.html(currentContent);
    currentData.$renderEl.text(currentContent);

    if (typeof opts.step === 'function') opts.step();

    var currentMatch = currentContent.match(/autobot-current=(\w+)\W$/);
    if (currentMatch) self.current = currentMatch[1];
    else if (currentData.i >= currentData.content.length) return;

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
