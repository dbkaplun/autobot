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
  Autobot.RENDER_CLASS = 'autobot-code';
  Autobot.RENDER_SELECTOR = '.'+Autobot.RENDER_CLASS;
  Autobot.DEFAULT_OPTS = {
    keystrokeMs: 20,
    punctuationMs: 1000,
    renderTemplate: $('<pre>', {'class': Autobot.RENDER_CLASS})
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
    if (hljs) hljs.highlightBlock(data.$renderEl[0]);
    data.$renderEl.trigger('resize');

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
    if (content.match(/[.?!]\s$/)) return opts.punctuationMs;
    if (content.match(/\s+$/)) return 0; // skip whitespace
    return opts.keystrokeMs;
  };

  $.fn.scrollBottom = function (fn) {
    var scrolledToBottom = this.scrollTop() >= this[0].scrollHeight - this.innerHeight();
    fn();
    if (scrolledToBottom) this.scrollTop(this[0].scrollHeight - this.innerHeight());
  };

  $(function () {
    $(document).on('resize', Autobot.RENDER_SELECTOR, function () {
      var $code = $(this);
      var data = $code.data();
      if (!data.autobot) data.autobot = {};
      data = data.autobot;
      var scrollTopMax = $code[0].scrollHeight - $code.innerHeight();
      if (data.scrolledToBottom) $code.scrollTop(scrollTopMax);
      data.scrolledToBottom = $code.scrollTop() >= scrollTopMax;
    });

    if (hljs) hljs.configure({classPrefix: ''});
    new Autobot($('[data-autobot]')).animate();
  });

  return Autobot;
}));
