!function($, win, doc, undef) {
 function self(element, key) {
   this.settings = null;
   this.options = $.extend({}, self.Defaults, key);
   this.$element = $(element);
   this.drag = $.extend({}, o);
   this.state = $.extend({}, state);
   this.e = $.extend({}, details);
   this._plugins = {};
   this._supress = {};
   this._current = null;
   this._speed = null;
   this._coordinates = [];
   this._breakpoint = null;
   this._width = null;
   this._items = [];
   this._clones = [];
   this._mergers = [];
   this._invalidated = {};
   this._pipe = [];
   $.each(self.Plugins, $.proxy(function(tokens, dataAndEvents) {
     this._plugins[tokens[0].toLowerCase() + tokens.slice(1)] = new dataAndEvents(this);
   }, this));
   $.each(self.Pipe, $.proxy(function(dataAndEvents, opts) {
     this._pipe.push({
       filter : opts.filter,
       run : $.proxy(opts.run, this)
     });
   }, this));
   this.setup();
   this.initialize();
 }
 function getTouches(e) {
   if (e.touches !== undef) {
     return{
       x : e.touches[0].pageX,
       y : e.touches[0].pageY
     };
   }
   if (e.touches === undef) {
     if (e.pageX !== undef) {
       return{
         x : e.pageX,
         y : e.pageY
       };
     }
     if (e.pageX === undef) {
       return{
         x : e.clientX,
         y : e.clientY
       };
     }
   }
 }
 function testProps(opt_attributes) {
   var letter;
   var i;
   var testElement = doc.createElement("div");
   var map = opt_attributes;
   for (letter in map) {
     if (i = map[letter], "undefined" != typeof testElement.style[i]) {
       return testElement = null, [i, letter];
     }
   }
   return[false];
 }
 function setEventPrefix() {
   return testProps(["transition", "WebkitTransition", "MozTransition", "OTransition"])[1];
 }
 function checkCapabilities() {
   return testProps(["transform", "WebkitTransform", "MozTransform", "OTransform", "msTransform"])[0];
 }
 function testAll() {
   return testProps(["perspective", "webkitPerspective", "MozPerspective", "OPerspective", "MsPerspective"])[0];
 }
 function isTouch() {
   return "ontouchstart" in win || !!navigator.msMaxTouchPoints;
 }
 function isMSPointer() {
   return win.navigator.msPointerEnabled;
 }
 var o;
 var state;
 var details;
 o = {
   start : 0,
   startX : 0,
   startY : 0,
   current : 0,
   currentX : 0,
   currentY : 0,
   offsetX : 0,
   offsetY : 0,
   distance : null,
   startTime : 0,
   endTime : 0,
   updatedX : 0,
   targetEl : null
 };
 state = {
   isTouch : false,
   isScrolling : false,
   isSwiping : false,
   direction : false,
   inMotion : false
 };
 details = {
   _onDragStart : null,
   _onDragMove : null,
   _onDragEnd : null,
   _transitionEnd : null,
   _resizer : null,
   _responsiveCall : null,
   _goToLoop : null,
   _checkVisibile : null
 };
 self.Defaults = {
   items : 3,
   loop : false,
   center : false,
   mouseDrag : true,
   touchDrag : true,
   pullDrag : true,
   freeDrag : false,
   margin : 0,
   stagePadding : 0,
   merge : false,
   mergeFit : true,
   autoWidth : false,
   startPosition : 0,
   rtl : true,
   smartSpeed : 250,
   fluidSpeed : false,
   dragEndSpeed : false,
   responsive : {},
   responsiveRefreshRate : 200,
   responsiveBaseElement : win,
   responsiveClass : false,
   fallbackEasing : "swing",
   info : false,
   nestedItemSelector : false,
   itemElement : "div",
   stageElement : "div",
   themeClass : "owl-theme",
   baseClass : "owl-carousel",
   itemClass : "owl-item",
   centerClass : "center",
   activeClass : "active"
 };
 self.Width = {
   Default : "default",
   Inner : "inner",
   Outer : "outer"
 };
 self.Plugins = {};
 self.Pipe = [{
   filter : ["width", "items", "settings"],
   run : function(options) {
     options.current = this._items && this._items[this.relative(this._current)];
   }
 }, {
   filter : ["items", "settings"],
   run : function() {
     var ky = this._clones;
     var kx = this.$stage.children(".cloned");
     if (kx.length !== ky.length || !this.settings.loop && ky.length > 0) {
       this.$stage.children(".cloned").remove();
       this._clones = [];
     }
   }
 }, {
   filter : ["items", "settings"],
   run : function() {
     var b;
     var a;
     var props = this._clones;
     var inputs = this._items;
     var lon = this.settings.loop ? props.length - Math.max(2 * this.settings.items, 4) : 0;
     b = 0;
     a = Math.abs(lon / 2);
     for (;a > b;b++) {
       if (lon > 0) {
         this.$stage.children().eq(inputs.length + props.length - 1).remove();
         props.pop();
         this.$stage.children().eq(0).remove();
         props.pop();
       } else {
         props.push(props.length / 2);
         this.$stage.append(inputs[props[props.length - 1]].clone().addClass("cloned"));
         props.push(inputs.length - 1 - (props.length - 1) / 2);
         this.$stage.prepend(inputs[props[props.length - 1]].clone().addClass("cloned"));
       }
     }
   }
 }, {
   filter : ["width", "items", "settings"],
   run : function() {
     var length;
     var udataCur;
     var c;
     var base = this.settings.rtl ? 1 : -1;
     var smallestSize = (this.width() / this.settings.items).toFixed(3);
     var value = 0;
     this._coordinates = [];
     udataCur = 0;
     c = this._clones.length + this._items.length;
     for (;c > udataCur;udataCur++) {
       length = this._mergers[this.relative(udataCur)];
       length = this.settings.mergeFit && Math.min(length, this.settings.items) || length;
       value += (this.settings.autoWidth ? this._items[this.relative(udataCur)].width() + this.settings.margin : smallestSize * length) * base;
       this._coordinates.push(value);
     }
   }
 }, {
   filter : ["width", "items", "settings"],
   run : function() {
     var i;
     var ilen;
     var value = (this.width() / this.settings.items).toFixed(3);
     var style = {
       width : Math.abs(this._coordinates[this._coordinates.length - 1]) + 2 * this.settings.stagePadding,
       "padding-left" : this.settings.stagePadding || "",
       "padding-right" : this.settings.stagePadding || ""
     };
     if (this.$stage.css(style), style = {
       width : this.settings.autoWidth ? "auto" : value - this.settings.margin
     }, style[this.settings.rtl ? "margin-left" : "margin-right"] = this.settings.margin, !this.settings.autoWidth && $.grep(this._mergers, function(dataAndEvents) {
       return dataAndEvents > 1;
     }).length > 0) {
       i = 0;
       ilen = this._coordinates.length;
       for (;ilen > i;i++) {
         style.width = Math.abs(this._coordinates[i]) - Math.abs(this._coordinates[i - 1] || 0) - this.settings.margin;
         this.$stage.children().eq(i).css(style);
       }
     } else {
       this.$stage.children().css(style);
     }
   }
 }, {
   filter : ["width", "items", "settings"],
   run : function(options) {
     if (options.current) {
       this.reset(this.$stage.children().index(options.current));
     }
   }
 }, {
   filter : ["position"],
   run : function() {
     this.animate(this.coordinates(this._current));
   }
 }, {
   filter : ["width", "position", "items", "settings"],
   run : function() {
     var elem;
     var newVal;
     var p;
     var li;
     var progress = this.settings.rtl ? 1 : -1;
     var initial = 2 * this.settings.stagePadding;
     var oldMillis = this.coordinates(this.current()) + initial;
     var newMillis = oldMillis + this.width() * progress;
     var include = [];
     p = 0;
     li = this._coordinates.length;
     for (;li > p;p++) {
       elem = this._coordinates[p - 1] || 0;
       newVal = Math.abs(this._coordinates[p]) + initial * progress;
       if (this.op(elem, "<=", oldMillis) && this.op(elem, ">", newMillis) || this.op(newVal, "<", oldMillis) && this.op(newVal, ">", newMillis)) {
         include.push(p);
       }
     }
     this.$stage.children("." + this.settings.activeClass).removeClass(this.settings.activeClass);
     this.$stage.children(":eq(" + include.join("), :eq(") + ")").addClass(this.settings.activeClass);
     if (this.settings.center) {
       this.$stage.children("." + this.settings.centerClass).removeClass(this.settings.centerClass);
       this.$stage.children().eq(this.current()).addClass(this.settings.centerClass);
     }
   }
 }];
 self.prototype.initialize = function() {
   if (this.trigger("initialize"), this.$element.addClass(this.settings.baseClass).addClass(this.settings.themeClass).toggleClass("owl-rtl", this.settings.rtl), this.browserSupport(), this.settings.autoWidth && this.state.imagesLoaded !== true) {
     var temp;
     var e;
     var currentLevel;
     if (temp = this.$element.find("img"), e = this.settings.nestedItemSelector ? "." + this.settings.nestedItemSelector : undef, currentLevel = this.$element.children(e).width(), temp.length && 0 >= currentLevel) {
       return this.preloadAutoWidthImages(temp), false;
     }
   }
   this.$element.addClass("owl-loading");
   this.$stage = $("<" + this.settings.stageElement + ' class="owl-stage"/>').wrap('<div class="owl-stage-outer">');
   this.$element.append(this.$stage.parent());
   this.replace(this.$element.children().not(this.$stage.parent()));
   this._width = this.$element.width();
   this.refresh();
   this.$element.removeClass("owl-loading").addClass("owl-loaded");
   this.eventsCall();
   this.internalEvents();
   this.addTriggerableEvents();
   this.trigger("initialized");
 };
 self.prototype.setup = function() {
   var max = this.viewport();
   var values = this.options.responsive;
   var i = -1;
   var options = null;
   if (values) {
     $.each(values, function(val) {
       if (max >= val) {
         if (val > i) {
           i = Number(val);
         }
       }
     });
     options = $.extend({}, this.options, values[i]);
     delete options.responsive;
     if (options.responsiveClass) {
       this.$element.attr("class", function(dataAndEvents, lastLine) {
         return lastLine.replace(/\b owl-responsive-\S+/g, "");
       }).addClass("owl-responsive-" + i);
     }
   } else {
     options = $.extend({}, this.options);
   }
   if (null === this.settings || this._breakpoint !== i) {
     this.trigger("change", {
       property : {
         name : "settings",
         value : options
       }
     });
     this._breakpoint = i;
     this.settings = options;
     this.invalidate("settings");
     this.trigger("changed", {
       property : {
         name : "settings",
         value : this.settings
       }
     });
   }
 };
 self.prototype.optionsLogic = function() {
   this.$element.toggleClass("owl-center", this.settings.center);
   if (this.settings.loop) {
     if (this._items.length < this.settings.items) {
       this.settings.loop = false;
     }
   }
   if (this.settings.autoWidth) {
     this.settings.stagePadding = false;
     this.settings.merge = false;
   }
 };
 self.prototype.prepare = function(data) {
   var event = this.trigger("prepare", {
     content : data
   });
   return event.data || (event.data = $("<" + this.settings.itemElement + "/>").addClass(this.settings.itemClass).append(data)), this.trigger("prepared", {
     content : event.data
   }), event.data;
 };
 self.prototype.update = function() {
   var i = 0;
   var l = this._pipe.length;
   var filter = $.proxy(function(timeoutKey) {
     return this[timeoutKey];
   }, this._invalidated);
   var memory = {};
   for (;l > i;) {
     if (this._invalidated.all || $.grep(this._pipe[i].filter, filter).length > 0) {
       this._pipe[i].run(memory);
     }
     i++;
   }
   this._invalidated = {};
 };
 self.prototype.width = function(feature) {
   switch(feature = feature || self.Width.Default) {
     case self.Width.Inner:
     ;
     case self.Width.Outer:
       return this._width;
     default:
       return this._width - 2 * this.settings.stagePadding + this.settings.margin;
   }
 };
 self.prototype.refresh = function() {
   if (0 === this._items.length) {
     return false;
   }
   (new Date).getTime();
   this.trigger("refresh");
   this.setup();
   this.optionsLogic();
   this.$stage.addClass("owl-refresh");
   this.update();
   this.$stage.removeClass("owl-refresh");
   this.state.orientation = win.orientation;
   this.watchVisibility();
   this.trigger("refreshed");
 };
 self.prototype.eventsCall = function() {
   this.e._onDragStart = $.proxy(function(e) {
     this.onDragStart(e);
   }, this);
   this.e._onDragMove = $.proxy(function(node) {
     this.onDragMove(node);
   }, this);
   this.e._onDragEnd = $.proxy(function(walkers) {
     this.onDragEnd(walkers);
   }, this);
   this.e._onResize = $.proxy(function(e) {
     this.onResize(e);
   }, this);
   this.e._transitionEnd = $.proxy(function(e) {
     this.transitionEnd(e);
   }, this);
   this.e._preventClick = $.proxy(function(completeEvent) {
     this.preventClick(completeEvent);
   }, this);
 };
 self.prototype.onThrottledResize = function() {
   win.clearTimeout(this.resizeTimer);
   this.resizeTimer = win.setTimeout(this.e._onResize, this.settings.responsiveRefreshRate);
 };
 self.prototype.onResize = function() {
   return this._items.length ? this._width === this.$element.width() ? false : this.trigger("resize").isDefaultPrevented() ? false : (this._width = this.$element.width(), this.invalidate("width"), this.refresh(), void this.trigger("resized")) : false;
 };
 self.prototype.eventsRouter = function(e) {
   var eventType = e.type;
   if ("mousedown" === eventType || "touchstart" === eventType) {
     this.onDragStart(e);
   } else {
     if ("mousemove" === eventType || "touchmove" === eventType) {
       this.onDragMove(e);
     } else {
       if ("mouseup" === eventType || "touchend" === eventType) {
         this.onDragEnd(e);
       } else {
         if ("touchcancel" === eventType) {
           this.onDragEnd(e);
         }
       }
     }
   }
 };
 self.prototype.internalEvents = function() {
   var c = (isTouch(), isMSPointer());
   if (this.settings.mouseDrag) {
     this.$stage.on("mousedown", $.proxy(function(completeEvent) {
       this.eventsRouter(completeEvent);
     }, this));
     this.$stage.on("dragstart", function() {
       return false;
     });
     this.$stage.get(0).onselectstart = function() {
       return false;
     };
   } else {
     this.$element.addClass("owl-text-select-on");
   }
   if (this.settings.touchDrag) {
     if (!c) {
       this.$stage.on("touchstart touchcancel", $.proxy(function(completeEvent) {
         this.eventsRouter(completeEvent);
       }, this));
     }
   }
   if (this.transitionEndVendor) {
     this.on(this.$stage.get(0), this.transitionEndVendor, this.e._transitionEnd, false);
   }
   if (this.settings.responsive !== false) {
     this.on(win, "resize", $.proxy(this.onThrottledResize, this));
   }
 };
 self.prototype.onDragStart = function(event) {
   var e;
   var x;
   var y;
   var offsetX;
   if (e = event.originalEvent || (event || win.event), 3 === e.which || this.state.isTouch) {
     return false;
   }
   if ("mousedown" === e.type && this.$stage.addClass("owl-grab"), this.trigger("drag"), this.drag.startTime = (new Date).getTime(), this.speed(0), this.state.isTouch = true, this.state.isScrolling = false, this.state.isSwiping = false, this.drag.distance = 0, x = getTouches(e).x, y = getTouches(e).y, this.drag.offsetX = this.$stage.position().left, this.drag.offsetY = this.$stage.position().top, this.settings.rtl && (this.drag.offsetX = this.$stage.position().left + this.$stage.width() - this.width() +
   this.settings.margin), this.state.inMotion && this.support3d) {
     offsetX = this.getTransformProperty();
     this.drag.offsetX = offsetX;
     this.animate(offsetX);
     this.state.inMotion = true;
   } else {
     if (this.state.inMotion && !this.support3d) {
       return this.state.inMotion = false, false;
     }
   }
   this.drag.startX = x - this.drag.offsetX;
   this.drag.startY = y - this.drag.offsetY;
   this.drag.start = x - this.drag.startX;
   this.drag.targetEl = e.target || e.srcElement;
   this.drag.updatedX = this.drag.start;
   if ("IMG" === this.drag.targetEl.tagName || "A" === this.drag.targetEl.tagName) {
     this.drag.targetEl.draggable = false;
   }
   $(doc).on("mousemove.owl.dragEvents mouseup.owl.dragEvents touchmove.owl.dragEvents touchend.owl.dragEvents", $.proxy(function(completeEvent) {
     this.eventsRouter(completeEvent);
   }, this));
 };
 self.prototype.onDragMove = function(event) {
   var e;
   var currentX;
   var currentY;
   var beforeN;
   var slice;
   var len;
   if (this.state.isTouch) {
     if (!this.state.isScrolling) {
       e = event.originalEvent || (event || win.event);
       currentX = getTouches(e).x;
       currentY = getTouches(e).y;
       this.drag.currentX = currentX - this.drag.startX;
       this.drag.currentY = currentY - this.drag.startY;
       this.drag.distance = this.drag.currentX - this.drag.offsetX;
       if (this.drag.distance < 0) {
         this.state.direction = this.settings.rtl ? "right" : "left";
       } else {
         if (this.drag.distance > 0) {
           this.state.direction = this.settings.rtl ? "left" : "right";
         }
       }
       if (this.settings.loop) {
         if (this.op(this.drag.currentX, ">", this.coordinates(this.minimum())) && "right" === this.state.direction) {
           this.drag.currentX -= (this.settings.center && this.coordinates(0)) - this.coordinates(this._items.length);
         } else {
           if (this.op(this.drag.currentX, "<", this.coordinates(this.maximum()))) {
             if ("left" === this.state.direction) {
               this.drag.currentX += (this.settings.center && this.coordinates(0)) - this.coordinates(this._items.length);
             }
           }
         }
       } else {
         beforeN = this.coordinates(this.settings.rtl ? this.maximum() : this.minimum());
         slice = this.coordinates(this.settings.rtl ? this.minimum() : this.maximum());
         len = this.settings.pullDrag ? this.drag.distance / 5 : 0;
         this.drag.currentX = Math.max(Math.min(this.drag.currentX, beforeN + len), slice + len);
       }
       if (this.drag.distance > 8 || this.drag.distance < -8) {
         if (e.preventDefault !== undef) {
           e.preventDefault();
         } else {
           e.returnValue = false;
         }
         this.state.isSwiping = true;
       }
       this.drag.updatedX = this.drag.currentX;
       if (this.drag.currentY > 16 || this.drag.currentY < -16) {
         if (this.state.isSwiping === false) {
           this.state.isScrolling = true;
           this.drag.updatedX = this.drag.start;
         }
       }
       this.animate(this.drag.updatedX);
     }
   }
 };
 self.prototype.onDragEnd = function(obj) {
   var minuteOffset;
   var hourOffset;
   var udataCur;
   if (this.state.isTouch) {
     if ("mouseup" === obj.type && this.$stage.removeClass("owl-grab"), this.trigger("dragged"), this.drag.targetEl.removeAttribute("draggable"), this.state.isTouch = false, this.state.isScrolling = false, this.state.isSwiping = false, 0 === this.drag.distance && this.state.inMotion !== true) {
       return this.state.inMotion = false, false;
     }
     this.drag.endTime = (new Date).getTime();
     minuteOffset = this.drag.endTime - this.drag.startTime;
     hourOffset = Math.abs(this.drag.distance);
     if (hourOffset > 3 || minuteOffset > 300) {
       this.removeClick(this.drag.targetEl);
     }
     udataCur = this.closest(this.drag.updatedX);
     this.speed(this.settings.dragEndSpeed || this.settings.smartSpeed);
     this.current(udataCur);
     this.invalidate("position");
     this.update();
     if (!this.settings.pullDrag) {
       if (!(this.drag.updatedX !== this.coordinates(udataCur))) {
         this.transitionEnd();
       }
     }
     this.drag.distance = 0;
     $(doc).off(".owl.dragEvents");
   }
 };
 self.prototype.removeClick = function($window) {
   this.drag.targetEl = $window;
   $($window).on("click.preventClick", this.e._preventClick);
   win.setTimeout(function() {
     $($window).off("click.preventClick");
   }, 300);
 };
 self.prototype.preventClick = function(e) {
   if (e.preventDefault) {
     e.preventDefault();
   } else {
     e.returnValue = false;
   }
   if (e.stopPropagation) {
     e.stopPropagation();
   }
   $(e.target).off("click.preventClick");
 };
 self.prototype.getTransformProperty = function() {
   var match;
   var territory;
   return match = win.getComputedStyle(this.$stage.get(0), null).getPropertyValue(this.vendorName + "transform"), match = match.replace(/matrix(3d)?\(|\)/g, "").split(","), territory = 16 === match.length, territory !== true ? match[4] : match[12];
 };
 self.prototype.closest = function(b) {
   var g = -1;
   var left = 30;
   var width = this.width();
   var self = this.coordinates();
   return this.settings.freeDrag || $.each(self, $.proxy(function(v, right) {
     return b > right - left && right + left > b ? g = v : this.op(b, "<", right) && (this.op(b, ">", self[v + 1] || right - width) && (g = "left" === this.state.direction ? v + 1 : v)), -1 === g;
   }, this)), this.settings.loop || (this.op(b, ">", self[this.minimum()]) ? g = b = this.minimum() : this.op(b, "<", self[this.maximum()]) && (g = b = this.maximum())), g;
 };
 self.prototype.animate = function(x) {
   this.trigger("translate");
   this.state.inMotion = this.speed() > 0;
   if (this.support3d) {
     this.$stage.css({
       transform : "translate3d(" + x + "px,0px, 0px)",
       transition : this.speed() / 1E3 + "s"
     });
   } else {
     if (this.state.isTouch) {
       this.$stage.css({
         left : x + "px"
       });
     } else {
       this.$stage.animate({
         left : x
       }, this.speed() / 1E3, this.settings.fallbackEasing, $.proxy(function() {
         if (this.state.inMotion) {
           this.transitionEnd();
         }
       }, this));
     }
   }
 };
 self.prototype.current = function(value) {
   if (value === undef) {
     return this._current;
   }
   if (0 === this._items.length) {
     return undef;
   }
   if (value = this.normalize(value), this._current !== value) {
     var e = this.trigger("change", {
       property : {
         name : "position",
         value : value
       }
     });
     if (e.data !== undef) {
       value = this.normalize(e.data);
     }
     this._current = value;
     this.invalidate("position");
     this.trigger("changed", {
       property : {
         name : "position",
         value : this._current
       }
     });
   }
   return this._current;
 };
 self.prototype.invalidate = function(value) {
   this._invalidated[value] = true;
 };
 self.prototype.reset = function(value) {
   value = this.normalize(value);
   if (value !== undef) {
     this._speed = 0;
     this._current = value;
     this.suppress(["translate", "translated"]);
     this.animate(this.coordinates(value));
     this.release(["translate", "translated"]);
   }
 };
 self.prototype.normalize = function(value, deepDataAndEvents) {
   var range = deepDataAndEvents ? this._items.length : this._items.length + this._clones.length;
   return!$.isNumeric(value) || 1 > range ? undef : value = this._clones.length ? (value % range + range) % range : Math.max(this.minimum(deepDataAndEvents), Math.min(this.maximum(deepDataAndEvents), value));
 };
 self.prototype.relative = function(value) {
   return value = this.normalize(value), value -= this._clones.length / 2, this.normalize(value, true);
 };
 self.prototype.maximum = function(deepDataAndEvents) {
   var max;
   var c;
   var result0;
   var pos0 = 0;
   var o = this.settings;
   if (deepDataAndEvents) {
     return this._items.length - 1;
   }
   if (!o.loop && o.center) {
     max = this._items.length - 1;
   } else {
     if (o.loop || o.center) {
       if (o.loop || o.center) {
         max = this._items.length + o.items;
       } else {
         if (!o.autoWidth && !o.merge) {
           throw "Can not detect maximum absolute position.";
         }
         revert = o.rtl ? 1 : -1;
         c = this.$stage.width() - this.$element.width();
         for (;(result0 = this.coordinates(pos0)) && !(result0 * revert >= c);) {
           max = ++pos0;
         }
       }
     } else {
       max = this._items.length - o.items;
     }
   }
   return max;
 };
 self.prototype.minimum = function(deepDataAndEvents) {
   return deepDataAndEvents ? 0 : this._clones.length / 2;
 };
 self.prototype.items = function(data) {
   return data === undef ? this._items.slice() : (data = this.normalize(data, true), this._items[data]);
 };
 self.prototype.mergers = function(data) {
   return data === undef ? this._mergers.slice() : (data = this.normalize(data, true), this._mergers[data]);
 };
 self.prototype.clones = function(b) {
   var start = this._clones.length / 2;
   var end = start + this._items.length;
   var clone = function(deepDataAndEvents) {
     return deepDataAndEvents % 2 === 0 ? end + deepDataAndEvents / 2 : start - (deepDataAndEvents + 1) / 2;
   };
   return b === undef ? $.map(this._clones, function(dataAndEvents, deepDataAndEvents) {
     return clone(deepDataAndEvents);
   }) : $.map(this._clones, function(a, deepDataAndEvents) {
     return a === b ? clone(deepDataAndEvents) : null;
   });
 };
 self.prototype.speed = function(recurring) {
   return recurring !== undef && (this._speed = recurring), this._speed;
 };
 self.prototype.coordinates = function(offset) {
   var object = null;
   return offset === undef ? $.map(this._coordinates, $.proxy(function(dataAndEvents, arg2) {
     return this.coordinates(arg2);
   }, this)) : (this.settings.center ? (object = this._coordinates[offset], object += (this.width() - object + (this._coordinates[offset - 1] || 0)) / 2 * (this.settings.rtl ? -1 : 1)) : object = this._coordinates[offset - 1] || 0, object);
 };
 self.prototype.duration = function(s, val, n) {
   return Math.min(Math.max(Math.abs(val - s), 1), 6) * Math.abs(n || this.settings.smartSpeed);
 };
 self.prototype.to = function(key, duration) {
   if (this.settings.loop) {
     var y = key - this.relative(this.current());
     var x = this.current();
     var len = this.current();
     var i = this.current() + y;
     var c1 = 0 > len - i ? true : false;
     var m = this._clones.length + this._items.length;
     if (i < this.settings.items && c1 === false) {
       x = len + this._items.length;
       this.reset(x);
     } else {
       if (i >= m - this.settings.items) {
         if (c1 === true) {
           x = len - this._items.length;
           this.reset(x);
         }
       }
     }
     win.clearTimeout(this.e._goToLoop);
     this.e._goToLoop = win.setTimeout($.proxy(function() {
       this.speed(this.duration(this.current(), x + y, duration));
       this.current(x + y);
       this.update();
     }, this), 30);
   } else {
     this.speed(this.duration(this.current(), key, duration));
     this.current(key);
     this.update();
   }
 };
 self.prototype.next = function(event) {
   event = event || false;
   this.to(this.relative(this.current()) + 1, event);
 };
 self.prototype.prev = function(event) {
   event = event || false;
   this.to(this.relative(this.current()) - 1, event);
 };
 self.prototype.transitionEnd = function(e) {
   return e !== undef && (e.stopPropagation(), (e.target || (e.srcElement || e.originalTarget)) !== this.$stage.get(0)) ? false : (this.state.inMotion = false, void this.trigger("translated"));
 };
 self.prototype.viewport = function() {
   var width;
   if (this.options.responsiveBaseElement !== win) {
     width = $(this.options.responsiveBaseElement).width();
   } else {
     if (win.innerWidth) {
       width = win.innerWidth;
     } else {
       if (!doc.documentElement || !doc.documentElement.clientWidth) {
         throw "Can not detect viewport width.";
       }
       width = doc.documentElement.clientWidth;
     }
   }
   return width;
 };
 self.prototype.replace = function(el) {
   this.$stage.empty();
   this._items = [];
   if (el) {
     el = el instanceof jQuery ? el : $(el);
   }
   if (this.settings.nestedItemSelector) {
     el = el.find("." + this.settings.nestedItemSelector);
   }
   el.filter(function() {
     return 1 === this.nodeType;
   }).each($.proxy(function(dataAndEvents, nodes) {
     nodes = this.prepare(nodes);
     this.$stage.append(nodes);
     this._items.push(nodes);
     this._mergers.push(1 * nodes.find("[data-merge]").andSelf("[data-merge]").attr("data-merge") || 1);
   }, this));
   this.reset($.isNumeric(this.settings.startPosition) ? this.settings.startPosition : 0);
   this.invalidate("items");
 };
 self.prototype.add = function(item, i) {
   i = i === undef ? this._items.length : this.normalize(i, true);
   this.trigger("add", {
     content : item,
     position : i
   });
   if (0 === this._items.length || i === this._items.length) {
     this.$stage.append(item);
     this._items.push(item);
     this._mergers.push(1 * item.find("[data-merge]").andSelf("[data-merge]").attr("data-merge") || 1);
   } else {
     this._items[i].before(item);
     this._items.splice(i, 0, item);
     this._mergers.splice(i, 0, 1 * item.find("[data-merge]").andSelf("[data-merge]").attr("data-merge") || 1);
   }
   this.invalidate("items");
   this.trigger("added", {
     content : item,
     position : i
   });
 };
 self.prototype.remove = function(index) {
   index = this.normalize(index, true);
   if (index !== undef) {
     this.trigger("remove", {
       content : this._items[index],
       position : index
     });
     this._items[index].remove();
     this._items.splice(index, 1);
     this._mergers.splice(index, 1);
     this.invalidate("items");
     this.trigger("removed", {
       content : null,
       position : index
     });
   }
 };
 self.prototype.addTriggerableEvents = function() {
   var onErrorFnPrev = $.proxy(function(matcherFunction, dataAndEvents) {
     return $.proxy(function(mouseover) {
       if (mouseover.relatedTarget !== this) {
         this.suppress([dataAndEvents]);
         matcherFunction.apply(this, [].slice.call(arguments, 1));
         this.release([dataAndEvents]);
       }
     }, this);
   }, this);
   $.each({
     next : this.next,
     prev : this.prev,
     to : this.to,
     destroy : this.destroy,
     refresh : this.refresh,
     replace : this.replace,
     add : this.add,
     remove : this.remove
   }, $.proxy(function(openEvent, error) {
     this.$element.on(openEvent + ".owl.carousel", onErrorFnPrev(error, openEvent + ".owl.carousel"));
   }, this));
 };
 self.prototype.watchVisibility = function() {
   function close(dropdown) {
     return dropdown.offsetWidth > 0 && dropdown.offsetHeight > 0;
   }
   function tick() {
     if (close(this.$element.get(0))) {
       this.$element.removeClass("owl-hidden");
       this.refresh();
       win.clearInterval(this.e._checkVisibile);
     }
   }
   if (!close(this.$element.get(0))) {
     this.$element.addClass("owl-hidden");
     win.clearInterval(this.e._checkVisibile);
     this.e._checkVisibile = win.setInterval($.proxy(tick, this), 500);
   }
 };
 self.prototype.preloadAutoWidthImages = function(arr) {
   var completed;
   var module;
   var $img;
   var img;
   completed = 0;
   module = this;
   arr.each(function(dataAndEvents, selector) {
     $img = $(selector);
     img = new Image;
     img.onload = function() {
       completed++;
       $img.attr("src", img.src);
       $img.css("opacity", 1);
       if (completed >= arr.length) {
         module.state.imagesLoaded = true;
         module.initialize();
       }
     };
     img.src = $img.attr("src") || ($img.attr("data-src") || $img.attr("data-src-retina"));
   });
 };
 self.prototype.destroy = function() {
   if (this.$element.hasClass(this.settings.themeClass)) {
     this.$element.removeClass(this.settings.themeClass);
   }
   if (this.settings.responsive !== false) {
     $(win).off("resize.owl.carousel");
   }
   if (this.transitionEndVendor) {
     this.off(this.$stage.get(0), this.transitionEndVendor, this.e._transitionEnd);
   }
   var i;
   for (i in this._plugins) {
     this._plugins[i].destroy();
   }
   if (this.settings.mouseDrag || this.settings.touchDrag) {
     this.$stage.off("mousedown touchstart touchcancel");
     $(doc).off(".owl.dragEvents");
     this.$stage.get(0).onselectstart = function() {
     };
     this.$stage.off("dragstart", function() {
       return false;
     });
   }
   this.$element.off(".owl");
   this.$stage.children(".cloned").remove();
   this.e = null;
   this.$element.removeData("owlCarousel");
   this.$stage.children().contents().unwrap();
   this.$stage.children().unwrap();
   this.$stage.unwrap();
 };
 self.prototype.op = function(x, lhs, y) {
   var rtl = this.settings.rtl;
   switch(lhs) {
     case "<":
       return rtl ? x > y : y > x;
     case ">":
       return rtl ? y > x : x > y;
     case ">=":
       return rtl ? y >= x : x >= y;
     case "<=":
       return rtl ? x >= y : y >= x;
   }
 };
 self.prototype.on = function(target, type, callback, capture) {
   if (target.addEventListener) {
     target.addEventListener(type, callback, capture);
   } else {
     if (target.attachEvent) {
       target.attachEvent("on" + type, callback);
     }
   }
 };
 self.prototype.off = function(el, event, fn, capture) {
   if (el.removeEventListener) {
     el.removeEventListener(event, fn, capture);
   } else {
     if (el.detachEvent) {
       el.detachEvent("on" + event, fn);
     }
   }
 };
 self.prototype.trigger = function(name, expectedHashCode, type) {
   var op = {
     item : {
       count : this._items.length,
       index : this.current()
     }
   };
   var handlerName = $.camelCase($.grep(["on", name, type], function(dataAndEvents) {
     return dataAndEvents;
   }).join("-").toLowerCase());
   var e = $.Event([name, "owl", type || "carousel"].join(".").toLowerCase(), $.extend({
     relatedTarget : this
   }, op, expectedHashCode));
   return this._supress[name] || ($.each(this._plugins, function(dataAndEvents, m) {
     if (m.onTrigger) {
       m.onTrigger(e);
     }
   }), this.$element.trigger(e), this.settings && ("function" == typeof this.settings[handlerName] && this.settings[handlerName].apply(this, e))), e;
 };
 self.prototype.suppress = function(eventName) {
   $.each(eventName, $.proxy(function(dataAndEvents, timeoutKey) {
     this._supress[timeoutKey] = true;
   }, this));
 };
 self.prototype.release = function(marker) {
   $.each(marker, $.proxy(function(dataAndEvents, timeoutKey) {
     delete this._supress[timeoutKey];
   }, this));
 };
 self.prototype.browserSupport = function() {
   if (this.support3d = testAll(), this.support3d) {
     this.transformVendor = checkCapabilities();
     var eventNames = ["transitionend", "webkitTransitionEnd", "transitionend", "oTransitionEnd"];
     this.transitionEndVendor = eventNames[setEventPrefix()];
     this.vendorName = this.transformVendor.replace(/Transform/i, "");
     this.vendorName = "" !== this.vendorName ? "-" + this.vendorName.toLowerCase() + "-" : "";
   }
   this.state.orientation = win.orientation;
 };
 $.fn.owlCarousel = function(options) {
   return this.each(function() {
     if (!$(this).data("owlCarousel")) {
       $(this).data("owlCarousel", new self(this, options));
     }
   });
 };
 $.fn.owlCarousel.Constructor = self;
}(window.Zepto || window.jQuery, window, document), function($, w) {
 var postLink = function(attrs) {
   this._core = attrs;
   this._loaded = [];
   this._handlers = {
     "initialized.owl.carousel change.owl.carousel" : $.proxy(function(event) {
       if (event.namespace && (this._core.settings && (this._core.settings.lazyLoad && (event.property && "position" == event.property.name || "initialized" == event.type)))) {
         var settings = this._core.settings;
         var length = settings.center && Math.ceil(settings.items / 2) || settings.items;
         var index = settings.center && -1 * length || 0;
         var udataCur = (event.property && event.property.value || this._core.current()) + index;
         var cnl = this._core.clones().length;
         var clean = $.proxy(function(dataAndEvents, next) {
           this.load(next);
         }, this);
         for (;index++ < length;) {
           this.load(cnl / 2 + this._core.relative(udataCur));
           if (cnl) {
             $.each(this._core.clones(this._core.relative(udataCur++)), clean);
           }
         }
       }
     }, this)
   };
   this._core.options = $.extend({}, postLink.Defaults, this._core.options);
   this._core.$element.on(this._handlers);
 };
 postLink.Defaults = {
   lazyLoad : false
 };
 postLink.prototype.load = function(index) {
   var value = this._core.$stage.children().eq(index);
   var attrNames = value && value.find(".owl-lazy");
   if (!!attrNames) {
     if (!($.inArray(value.get(0), this._loaded) > -1)) {
       attrNames.each($.proxy(function(dataAndEvents, tagName) {
         var img;
         var el = $(tagName);
         var dataUrl = w.devicePixelRatio > 1 && el.attr("data-src-retina") || el.attr("data-src");
         this._core.trigger("load", {
           element : el,
           url : dataUrl
         }, "lazy");
         if (el.is("img")) {
           el.one("load.owl.lazy", $.proxy(function() {
             el.css("opacity", 1);
             this._core.trigger("loaded", {
               element : el,
               url : dataUrl
             }, "lazy");
           }, this)).attr("src", dataUrl);
         } else {
           img = new Image;
           img.onload = $.proxy(function() {
             el.css({
               "background-image" : "url(" + dataUrl + ")",
               opacity : "1"
             });
             this._core.trigger("loaded", {
               element : el,
               url : dataUrl
             }, "lazy");
           }, this);
           img.src = dataUrl;
         }
       }, this));
       this._loaded.push(value.get(0));
     }
   }
 };
 postLink.prototype.destroy = function() {
   var event;
   var unlock;
   for (event in this.handlers) {
     this._core.$element.off(event, this.handlers[event]);
   }
   for (unlock in Object.getOwnPropertyNames(this)) {
     if ("function" != typeof this[unlock]) {
       this[unlock] = null;
     }
   }
 };
 $.fn.owlCarousel.Constructor.Plugins.Lazy = postLink;
}(window.Zepto || window.jQuery, window, document), function($) {
 var render = function(rows) {
   this._core = rows;
   this._handlers = {
     "initialized.owl.carousel" : $.proxy(function() {
       if (this._core.settings.autoHeight) {
         this.update();
       }
     }, this),
     "changed.owl.carousel" : $.proxy(function(pair) {
       if (this._core.settings.autoHeight) {
         if ("position" == pair.property.name) {
           this.update();
         }
       }
     }, this),
     "loaded.owl.lazy" : $.proxy(function(c) {
       if (this._core.settings.autoHeight) {
         if (c.element.closest("." + this._core.settings.itemClass) === this._core.$stage.children().eq(this._core.current())) {
           this.update();
         }
       }
     }, this)
   };
   this._core.options = $.extend({}, render.Defaults, this._core.options);
   this._core.$element.on(this._handlers);
 };
 render.Defaults = {
   autoHeight : false,
   autoHeightClass : "owl-height"
 };
 render.prototype.update = function() {
   this._core.$stage.parent().height(this._core.$stage.children().eq(this._core.current()).height()).addClass(this._core.settings.autoHeightClass);
 };
 render.prototype.destroy = function() {
   var event;
   var unlock;
   for (event in this._handlers) {
     this._core.$element.off(event, this._handlers[event]);
   }
   for (unlock in Object.getOwnPropertyNames(this)) {
     if ("function" != typeof this[unlock]) {
       this[unlock] = null;
     }
   }
 };
 $.fn.owlCarousel.Constructor.Plugins.AutoHeight = render;
}(window.Zepto || window.jQuery, window, document), function($, root, d) {
 var fn = function(range) {
   this._core = range;
   this._videos = {};
   this._playing = null;
   this._fullscreen = false;
   this._handlers = {
     "resize.owl.carousel" : $.proxy(function(types) {
       if (this._core.settings.video) {
         if (!this.isInFullScreen()) {
           types.preventDefault();
         }
       }
     }, this),
     "refresh.owl.carousel changed.owl.carousel" : $.proxy(function() {
       if (this._playing) {
         this.stop();
       }
     }, this),
     "prepared.owl.carousel" : $.proxy(function(ui) {
       var content = $(ui.content).find(".owl-video");
       if (content.length) {
         content.css("display", "none");
         this.fetch(content, $(ui.content));
       }
     }, this)
   };
   this._core.options = $.extend({}, fn.Defaults, this._core.options);
   this._core.$element.on(this._handlers);
   this._core.$element.on("click.owl.video", ".owl-video-play-icon", $.proxy(function(name) {
     this.play(name);
   }, this));
 };
 fn.Defaults = {
   video : false,
   videoHeight : false,
   videoWidth : false
 };
 fn.prototype.fetch = function(element, options) {
   var type = element.attr("data-vimeo-id") ? "vimeo" : "youtube";
   var tag = element.attr("data-vimeo-id") || element.attr("data-youtube-id");
   var w = element.attr("data-width") || this._core.settings.videoWidth;
   var dialogHeight = element.attr("data-height") || this._core.settings.videoHeight;
   var name = element.attr("href");
   if (!name) {
     throw new Error("Missing video URL.");
   }
   if (tag = name.match(/(http:|https:|)\/\/(player.|www.)?(vimeo\.com|youtu(be\.com|\.be|be\.googleapis\.com))\/(video\/|embed\/|watch\?v=|v\/)?([A-Za-z0-9._%-]*)(\&\S+)?/), tag[3].indexOf("youtu") > -1) {
     type = "youtube";
   } else {
     if (!(tag[3].indexOf("vimeo") > -1)) {
       throw new Error("Video URL not supported.");
     }
     type = "vimeo";
   }
   tag = tag[6];
   this._videos[name] = {
     type : type,
     id : tag,
     width : w,
     height : dialogHeight
   };
   options.attr("data-video", name);
   this.thumbnail(element, this._videos[name]);
 };
 fn.prototype.thumbnail = function(element, file) {
   var tplElCompiled;
   var clone;
   var expectationResult;
   var failureMessage = file.width && file.height ? 'style="width:' + file.width + "px;height:" + file.height + 'px;"' : "";
   var $img = element.find("img");
   var srcAttr = "src";
   var optsData = "";
   var settings = this._core.settings;
   var after = function(result) {
     clone = '<div class="owl-video-play-icon"></div>';
     tplElCompiled = settings.lazyLoad ? '<div class="owl-video-tn ' + optsData + '" ' + srcAttr + '="' + result + '"></div>' : '<div class="owl-video-tn" style="opacity:1;background-image:url(' + result + ')"></div>';
     element.after(tplElCompiled);
     element.after(clone);
   };
   return element.wrap('<div class="owl-video-wrapper"' + failureMessage + "></div>"), this._core.settings.lazyLoad && (srcAttr = "data-src", optsData = "owl-lazy"), $img.length ? (after($img.attr(srcAttr)), $img.remove(), false) : void("youtube" === file.type ? (expectationResult = "http://img.youtube.com/vi/" + file.id + "/hqdefault.jpg", after(expectationResult)) : "vimeo" === file.type && $.ajax({
     type : "GET",
     url : "http://vimeo.com/api/v2/video/" + file.id + ".json",
     jsonp : "callback",
     dataType : "jsonp",
     success : function(json) {
       expectationResult = json[0].thumbnail_large;
       after(expectationResult);
     }
   }));
 };
 fn.prototype.stop = function() {
   this._core.trigger("stop", null, "video");
   this._playing.find(".owl-video-frame").remove();
   this._playing.removeClass("owl-video-playing");
   this._playing = null;
 };
 fn.prototype.play = function(event) {
   this._core.trigger("play", null, "video");
   if (this._playing) {
     this.stop();
   }
   var c;
   var file;
   var current = $(event.target || event.srcElement);
   var btn = current.closest("." + this._core.settings.itemClass);
   var testNode = this._videos[btn.attr("data-video")];
   var h = testNode.width || "100%";
   var i = testNode.height || this._core.$stage.height();
   if ("youtube" === testNode.type) {
     c = '<iframe width="' + h + '" height="' + i + '" src="http://www.youtube.com/embed/' + testNode.id + "?autoplay=1&v=" + testNode.id + '" frameborder="0" allowfullscreen></iframe>';
   } else {
     if ("vimeo" === testNode.type) {
       c = '<iframe src="http://player.vimeo.com/video/' + testNode.id + '?autoplay=1" width="' + h + '" height="' + i + '" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>';
     }
   }
   btn.addClass("owl-video-playing");
   this._playing = btn;
   file = $('<div style="height:' + i + "px; width:" + h + 'px" class="owl-video-frame">' + c + "</div>");
   current.after(file);
 };
 fn.prototype.isInFullScreen = function() {
   var toggle = d.fullscreenElement || (d.mozFullScreenElement || d.webkitFullscreenElement);
   return toggle && ($(toggle).parent().hasClass("owl-video-frame") && (this._core.speed(0), this._fullscreen = true)), toggle && (this._fullscreen && this._playing) ? false : this._fullscreen ? (this._fullscreen = false, false) : this._playing && this._core.state.orientation !== root.orientation ? (this._core.state.orientation = root.orientation, false) : true;
 };
 fn.prototype.destroy = function() {
   var event;
   var unlock;
   this._core.$element.off("click.owl.video");
   for (event in this._handlers) {
     this._core.$element.off(event, this._handlers[event]);
   }
   for (unlock in Object.getOwnPropertyNames(this)) {
     if ("function" != typeof this[unlock]) {
       this[unlock] = null;
     }
   }
 };
 $.fn.owlCarousel.Constructor.Plugins.Video = fn;
}(window.Zepto || window.jQuery, window, document), function($, exports, d, node) {
 var init = function(core) {
   this.core = core;
   this.core.options = $.extend({}, init.Defaults, this.core.options);
   this.swapping = true;
   this.previous = node;
   this.next = node;
   this.handlers = {
     "change.owl.carousel" : $.proxy(function(event) {
       if ("position" == event.property.name) {
         this.previous = this.core.current();
         this.next = event.property.value;
       }
     }, this),
     "drag.owl.carousel dragged.owl.carousel translated.owl.carousel" : $.proxy(function(statement) {
       this.swapping = "translated" == statement.type;
     }, this),
     "translate.owl.carousel" : $.proxy(function() {
       if (this.swapping) {
         if (this.core.options.animateOut || this.core.options.animateIn) {
           this.swap();
         }
       }
     }, this)
   };
   this.core.$element.on(this.handlers);
 };
 init.Defaults = {
   animateOut : false,
   animateIn : false
 };
 init.prototype.swap = function() {
   if (1 === this.core.settings.items && this.core.support3d) {
     this.core.speed(0);
     var originalLeft_;
     var oid = $.proxy(this.clear, this);
     var section = this.core.$stage.children().eq(this.previous);
     var divSpan = this.core.$stage.children().eq(this.next);
     var activeClassName = this.core.settings.animateIn;
     var css = this.core.settings.animateOut;
     if (this.core.current() !== this.previous) {
       if (css) {
         originalLeft_ = this.core.coordinates(this.previous) - this.core.coordinates(this.next);
         section.css({
           left : originalLeft_ + "px"
         }).addClass("animated owl-animated-out").addClass(css).one("webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend", oid);
       }
       if (activeClassName) {
         divSpan.addClass("animated owl-animated-in").addClass(activeClassName).one("webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend", oid);
       }
     }
   }
 };
 init.prototype.clear = function(event) {
   $(event.target).css({
     left : ""
   }).removeClass("animated owl-animated-out owl-animated-in").removeClass(this.core.settings.animateIn).removeClass(this.core.settings.animateOut);
   this.core.transitionEnd();
 };
 init.prototype.destroy = function() {
   var event;
   var unlock;
   for (event in this.handlers) {
     this.core.$element.off(event, this.handlers[event]);
   }
   for (unlock in Object.getOwnPropertyNames(this)) {
     if ("function" != typeof this[unlock]) {
       this[unlock] = null;
     }
   }
 };
 $.fn.owlCarousel.Constructor.Plugins.Animate = init;
}(window.Zepto || window.jQuery, window, document), function($, root, o) {
 var Plugin = function(config) {
   this.core = config;
   this.core.options = $.extend({}, Plugin.Defaults, this.core.options);
   this.handlers = {
     "translated.owl.carousel refreshed.owl.carousel" : $.proxy(function() {
       this.autoplay();
     }, this),
     "play.owl.autoplay" : $.proxy(function(dataAndEvents, name, suppressEvents) {
       this.play(name, suppressEvents);
     }, this),
     "stop.owl.autoplay" : $.proxy(function() {
       this.stop();
     }, this),
     "mouseover.owl.autoplay" : $.proxy(function() {
       if (this.core.settings.autoplayHoverPause) {
         this.pause();
       }
     }, this),
     "mouseleave.owl.autoplay" : $.proxy(function() {
       if (this.core.settings.autoplayHoverPause) {
         this.autoplay();
       }
     }, this)
   };
   this.core.$element.on(this.handlers);
 };
 Plugin.Defaults = {
   autoplay : false,
   autoplayTimeout : 5E3,
   autoplayHoverPause : false,
   autoplaySpeed : false
 };
 Plugin.prototype.autoplay = function() {
   if (this.core.settings.autoplay && !this.core.state.videoPlay) {
     root.clearInterval(this.interval);
     this.interval = root.setInterval($.proxy(function() {
       this.play();
     }, this), this.core.settings.autoplayTimeout);
   } else {
     root.clearInterval(this.interval);
   }
 };
 Plugin.prototype.play = function() {
   return o.hidden === true || (this.core.state.isTouch || (this.core.state.isScrolling || (this.core.state.isSwiping || this.core.state.inMotion))) ? void 0 : this.core.settings.autoplay === false ? void root.clearInterval(this.interval) : void this.core.next(this.core.settings.autoplaySpeed);
 };
 Plugin.prototype.stop = function() {
   root.clearInterval(this.interval);
 };
 Plugin.prototype.pause = function() {
   root.clearInterval(this.interval);
 };
 Plugin.prototype.destroy = function() {
   var event;
   var unlock;
   root.clearInterval(this.interval);
   for (event in this.handlers) {
     this.core.$element.off(event, this.handlers[event]);
   }
   for (unlock in Object.getOwnPropertyNames(this)) {
     if ("function" != typeof this[unlock]) {
       this[unlock] = null;
     }
   }
 };
 $.fn.owlCarousel.Constructor.Plugins.autoplay = Plugin;
}(window.Zepto || window.jQuery, window, document), function($) {
 var init = function(core) {
   this._core = core;
   this._initialized = false;
   this._pages = [];
   this._controls = {};
   this._templates = [];
   this.$element = this._core.$element;
   this._overrides = {
     next : this._core.next,
     prev : this._core.prev,
     to : this._core.to
   };
   this._handlers = {
     "prepared.owl.carousel" : $.proxy(function(ui) {
       if (this._core.settings.dotsData) {
         this._templates.push($(ui.content).find("[data-dot]").andSelf("[data-dot]").attr("data-dot"));
       }
     }, this),
     "add.owl.carousel" : $.proxy(function(e) {
       if (this._core.settings.dotsData) {
         this._templates.splice(e.position, 0, $(e.content).find("[data-dot]").andSelf("[data-dot]").attr("data-dot"));
       }
     }, this),
     "remove.owl.carousel prepared.owl.carousel" : $.proxy(function(exists) {
       if (this._core.settings.dotsData) {
         this._templates.splice(exists.position, 1);
       }
     }, this),
     "change.owl.carousel" : $.proxy(function(event) {
       if ("position" == event.property.name && (!this._core.state.revert && (!this._core.settings.loop && this._core.settings.navRewind))) {
         var height = this._core.current();
         var kMinHeight = this._core.maximum();
         var value = this._core.minimum();
         event.data = event.property.value > kMinHeight ? height >= kMinHeight ? value : kMinHeight : event.property.value < value ? kMinHeight : event.property.value;
       }
     }, this),
     "changed.owl.carousel" : $.proxy(function(pair) {
       if ("position" == pair.property.name) {
         this.draw();
       }
     }, this),
     "refreshed.owl.carousel" : $.proxy(function() {
       if (!this._initialized) {
         this.initialize();
         this._initialized = true;
       }
       this._core.trigger("refresh", null, "navigation");
       this.update();
       this.draw();
       this._core.trigger("refreshed", null, "navigation");
     }, this)
   };
   this._core.options = $.extend({}, init.Defaults, this._core.options);
   this.$element.on(this._handlers);
 };
 init.Defaults = {
   nav : false,
   navRewind : true,
   navText : ["prev", "next"],
   navSpeed : false,
   navElement : "div",
   navContainer : false,
   navContainerClass : "owl-nav",
   navClass : ["owl-prev", "owl-next"],
   slideBy : 1,
   dotClass : "owl-dot",
   dotsClass : "owl-dots",
   dots : true,
   dotsEach : false,
   dotData : false,
   dotsSpeed : false,
   dotsContainer : false,
   controlsClass : "owl-controls"
 };
 init.prototype.initialize = function() {
   var container;
   var key;
   var settings = this._core.settings;
   if (!settings.dotsData) {
     this._templates = [$("<div>").addClass(settings.dotClass).append($("<span>")).prop("outerHTML")];
   }
   if (!(settings.navContainer && settings.dotsContainer)) {
     this._controls.$container = $("<div>").addClass(settings.controlsClass).appendTo(this.$element);
   }
   this._controls.$indicators = settings.dotsContainer ? $(settings.dotsContainer) : $("<div>").hide().addClass(settings.dotsClass).appendTo(this._controls.$container);
   this._controls.$indicators.on("click", "div", $.proxy(function(evt) {
     var camelKey = $(evt.target).parent().is(this._controls.$indicators) ? $(evt.target).index() : $(evt.target).parent().index();
     evt.preventDefault();
     this.to(camelKey, settings.dotsSpeed);
   }, this));
   container = settings.navContainer ? $(settings.navContainer) : $("<div>").addClass(settings.navContainerClass).prependTo(this._controls.$container);
   this._controls.$next = $("<" + settings.navElement + ">");
   this._controls.$previous = this._controls.$next.clone();
   this._controls.$previous.addClass(settings.navClass[0]).html(settings.navText[0]).hide().prependTo(container).on("click", $.proxy(function() {
     this.prev(settings.navSpeed);
   }, this));
   this._controls.$next.addClass(settings.navClass[1]).html(settings.navText[1]).hide().appendTo(container).on("click", $.proxy(function() {
     this.next(settings.navSpeed);
   }, this));
   for (key in this._overrides) {
     this._core[key] = $.proxy(this[key], this);
   }
 };
 init.prototype.destroy = function() {
   var event;
   var prefixed;
   var unlock;
   var key;
   for (event in this._handlers) {
     this.$element.off(event, this._handlers[event]);
   }
   for (prefixed in this._controls) {
     this._controls[prefixed].remove();
   }
   for (key in this.overides) {
     this._core[key] = this._overrides[key];
   }
   for (unlock in Object.getOwnPropertyNames(this)) {
     if ("function" != typeof this[unlock]) {
       this[unlock] = null;
     }
   }
 };
 init.prototype.update = function() {
   var start;
   var index;
   var c;
   var o = this._core.settings;
   var offset = this._core.clones().length / 2;
   var y = offset + this._core.items().length;
   var inputLength = o.center || (o.autoWidth || o.dotData) ? 1 : o.dotsEach || o.items;
   if ("page" !== o.slideBy && (o.slideBy = Math.min(o.slideBy, o.items)), o.dots || "page" == o.slideBy) {
     this._pages = [];
     start = offset;
     index = 0;
     c = 0;
     for (;y > start;start++) {
       if (index >= inputLength || 0 === index) {
         this._pages.push({
           start : start - offset,
           end : start - offset + inputLength - 1
         });
         index = 0;
         ++c;
       }
       index += this._core.mergers(this._core.relative(start));
     }
   }
 };
 init.prototype.draw = function() {
   var scripts;
   var udataCur;
   var htmlString = "";
   var options = this._core.settings;
   var i = (this._core.$stage.children(), this._core.relative(this._core.current()));
   if (!options.nav || (options.loop || (options.navRewind || (this._controls.$previous.toggleClass("disabled", 0 >= i), this._controls.$next.toggleClass("disabled", i >= this._core.maximum())))), this._controls.$previous.toggle(options.nav), this._controls.$next.toggle(options.nav), options.dots) {
     if (scripts = this._pages.length - this._controls.$indicators.children().length, options.dotData && 0 !== scripts) {
       udataCur = 0;
       for (;udataCur < this._controls.$indicators.children().length;udataCur++) {
         htmlString += this._templates[this._core.relative(udataCur)];
       }
       this._controls.$indicators.html(htmlString);
     } else {
       if (scripts > 0) {
         htmlString = (new Array(scripts + 1)).join(this._templates[0]);
         this._controls.$indicators.append(htmlString);
       } else {
         if (0 > scripts) {
           this._controls.$indicators.children().slice(scripts).remove();
         }
       }
     }
     this._controls.$indicators.find(".active").removeClass("active");
     this._controls.$indicators.children().eq($.inArray(this.current(), this._pages)).addClass("active");
   }
   this._controls.$indicators.toggle(options.dots);
 };
 init.prototype.onTrigger = function(e) {
   var options = this._core.settings;
   e.page = {
     index : $.inArray(this.current(), this._pages),
     count : this._pages.length,
     size : options && (options.center || (options.autoWidth || options.dotData) ? 1 : options.dotsEach || options.items)
   };
 };
 init.prototype.current = function() {
   var LEVEL_LIST = this._core.relative(this._core.current());
   return $.grep(this._pages, function(o) {
     return o.start <= LEVEL_LIST && o.end >= LEVEL_LIST;
   }).pop();
 };
 init.prototype.getPosition = function(recurring) {
   var a;
   var b;
   var settings = this._core.settings;
   return "page" == settings.slideBy ? (a = $.inArray(this.current(), this._pages), b = this._pages.length, recurring ? ++a : --a, a = this._pages[(a % b + b) % b].start) : (a = this._core.relative(this._core.current()), b = this._core.items().length, recurring ? a += settings.slideBy : a -= settings.slideBy), a;
 };
 init.prototype.next = function(shallow) {
   $.proxy(this._overrides.to, this._core)(this.getPosition(true), shallow);
 };
 init.prototype.prev = function(shallow) {
   $.proxy(this._overrides.to, this._core)(this.getPosition(false), shallow);
 };
 init.prototype.to = function(value, attr, dataAndEvents) {
   var range;
   if (dataAndEvents) {
     $.proxy(this._overrides.to, this._core)(value, attr);
   } else {
     range = this._pages.length;
     $.proxy(this._overrides.to, this._core)(this._pages[(value % range + range) % range].start, attr);
   }
 };
 $.fn.owlCarousel.Constructor.Plugins.Navigation = init;
}(window.Zepto || window.jQuery, window, document), function($, win) {
 var handler = function(token) {
   this._core = token;
   this._hashes = {};
   this.$element = this._core.$element;
   this._handlers = {
     "initialized.owl.carousel" : $.proxy(function() {
       if ("URLHash" == this._core.settings.startPosition) {
         $(win).trigger("hashchange.owl.navigation");
       }
     }, this),
     "prepared.owl.carousel" : $.proxy(function(data) {
       var id = $(data.content).find("[data-hash]").andSelf("[data-hash]").attr("data-hash");
       this._hashes[id] = data.content;
     }, this)
   };
   this._core.options = $.extend({}, handler.Defaults, this._core.options);
   this.$element.on(this._handlers);
   $(win).on("hashchange.owl.navigation", $.proxy(function() {
     var i = win.location.hash.substring(1);
     var pos = this._core.$stage.children();
     var camelKey = this._hashes[i] && pos.index(this._hashes[i]) || 0;
     return i ? void this._core.to(camelKey, false, true) : false;
   }, this));
 };
 handler.Defaults = {
   URLhashListener : false
 };
 handler.prototype.destroy = function() {
   var event;
   var unlock;
   $(win).off("hashchange.owl.navigation");
   for (event in this._handlers) {
     this._core.$element.off(event, this._handlers[event]);
   }
   for (unlock in Object.getOwnPropertyNames(this)) {
     if ("function" != typeof this[unlock]) {
       this[unlock] = null;
     }
   }
 };
 $.fn.owlCarousel.Constructor.Plugins.Hash = handler;
}(window.Zepto || window.jQuery, window, document);
