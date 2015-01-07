/*!
 * jQuery UI Touch Punch 0.2.3
 *
 * Copyright 2011-2014, Dave Furfero
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Depends:
 *  jquery.ui.widget.js
 *  jquery.ui.mouse.js
 */
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {

    var pointerEnabled = window.navigator.pointerEnabled
            || window.navigator.msPointerEnabled,
        msPointerEnabled = window.navigator.msPointerEnabled;

    // Detect touch support
    $.support.touch = $.support.touch || ((typeof Modernizr !== 'undefined') ? Modernizr.touch : ('ontouchend' in document || 'createTouch' in document || pointerEnabled));

    // Ignore browsers without touch support
    if (!$.support.touch && !pointerEnabled) {
        return;
    }

    var mouseProto = $.ui.mouse.prototype,
        _mouseInit = mouseProto._mouseInit,
        _mouseDestroy = mouseProto._mouseDestroy,
        touchHandled;

    // see http://stackoverflow.com/a/12714084/220825
    function fixTouch (touch) {
        var winPageX = window.pageXOffset,
            winPageY = window.pageYOffset,
            x = touch.clientX,
            y = touch.clientY;

        if (touch.pageY === 0 && Math.floor(y) > Math.floor(touch.pageY) || touch.pageX === 0 && Math.floor(x) > Math.floor(touch.pageX)) {
            // iOS4 clientX/clientY have the value that should have been
            // in pageX/pageY. While pageX/page/ have the value 0
            x = x - winPageX;
            y = y - winPageY;
        } else if (y < (touch.pageY - winPageY) || x < (touch.pageX - winPageX)) {
            // Some Android browsers have totally bogus values for clientX/Y
            // when scrolling/zooming a page. Detectable since clientX/clientY
            // should never be smaller than pageX/pageY minus page scroll
            x = touch.pageX - winPageX;
            y = touch.pageY - winPageY;
        }

        return {
            clientX: x,
            clientY: y
        };
    }

    /**
     * Simulate a mouse event based on a corresponding touch event
     * @param {Object} event A touch event
     * @param {String} simulatedType The corresponding mouse event
     */
    function simulateMouseEvent (event, simulatedType) {

        // Ignore multi-touch events
        if ((!pointerEnabled && event.originalEvent.touches && event.originalEvent.touches.length > 1) || (pointerEnabled && !event.isPrimary)) {
            return;
        }

        var evt;
        if (pointerEnabled) {
            evt = event.originalEvent;
        } else if (event.originalEvent.changedTouches) {
            evt = event.originalEvent.changedTouches[0];
        } else {
            evt = event;
        }
        var simulatedEvent = document.createEvent('MouseEvents'),
            coord = fixTouch(evt);

        // Check if element is an input or a textarea
        if ($(evt.target).is("input") || $(evt.target).is("textarea")) {
            event.stopPropagation();
        } else {
            event.preventDefault();
        }

        // Initialize the simulated mouse event using the touch event's coordinates
        simulatedEvent.initMouseEvent(
            simulatedType,                     // type
            true,                              // bubbles
            true,                              // cancelable
            window,                            // view
            1,                                 // detail
            event.screenX || evt.screenX,      // screenX
            event.screenY || evt.screenY,      // screenY
            event.clientX || coord.clientX,    // clientX
            event.clientY || coord.clientY,    // clientY
            false,                             // ctrlKey
            false,                             // altKey
            false,                             // shiftKey
            false,                             // metaKey
            0,                                 // button
            null                               // relatedTarget
        );

        // Dispatch the simulated event to the target element
        event.target.dispatchEvent(simulatedEvent);
    }

    /**
     * Handle the jQuery UI widget's touchstart events
     * @param {Object} event The widget element's touchstart event
     */
    mouseProto._touchStart = function (event) {

        var self = this;

        // Ignore the event if another widget is already being handled
        if (touchHandled || (!pointerEnabled && !self._mouseCapture(event.originalEvent.changedTouches[0]))) {
            return;
        }

        // Set the flag to prevent other widgets from inheriting the touch event
        touchHandled = true;

        // Track movement to determine if interaction was a click
        self._touchMoved = false;

        // Simulate the mouseover event
        simulateMouseEvent(event, 'mouseover');

        // Simulate the mousemove event
        simulateMouseEvent(event, 'mousemove');

        // Simulate the mousedown event
        simulateMouseEvent(event, 'mousedown');
    };

    /**
     * Handle the jQuery UI widget's touchmove events
     * @param {Object} event The document's touchmove event
     */
    mouseProto._touchMove = function (event) {

        // Ignore event if not handled
        if (!touchHandled) {
            return;
        }

        // Interaction was not a click
        this._touchMoved = true;

        // Simulate the mousemove event
        simulateMouseEvent(event, 'mousemove');
    };

    /**
     * Handle the jQuery UI widget's touchend events
     * @param {Object} event The document's touchend event
     */
    mouseProto._touchEnd = function (event) {

        // Ignore event if not handled
        if (!touchHandled) {
            return;
        }

        // Simulate the mouseup event
        simulateMouseEvent(event, 'mouseup');

        // Simulate the mouseout event
        simulateMouseEvent(event, 'mouseout');

        // If the touch interaction did not move, it should trigger a click
        if (!this._touchMoved) {

            // Simulate the click event
            simulateMouseEvent(event, 'click');
        }

        // Unset the flag to allow other widgets to inherit the touch event
        touchHandled = false;
    };

    /**
     * A duck punch of the $.ui.mouse _mouseInit method to support touch events.
     * This method extends the widget with bound touch event handlers that
     * translate touch events to mouse events and pass them to the widget's
     * original mouse event handling methods.
     */
    mouseProto._mouseInit = function () {

        var self = this;

        // Un-delegate the global touch events in
        self.element
            .off('touchstart')
            .off('touchmove')
            .off('touchend');

        // Delegate the touch handlers to the widget's element
        if (pointerEnabled) {
            self.element
                .on('pointerDown', $.proxy(self, '_touchStart'))
                .on('pointerMove', $.proxy(self, '_touchMove'))
                .on('pointerUp', $.proxy(self, '_touchEnd'))
                .on('MSPointerDown', $.proxy(self, '_touchStart'))
                .on('MSPointerMove', $.proxy(self, '_touchMove'))
                .on('MSPointerUp', $.proxy(self, '_touchEnd'));
        } else {
            self.element
                .on(msPointerEnabled ? 'MSPointerDown' : 'touchstart', $.proxy(self, '_touchStart'))
                .on(msPointerEnabled ? 'MSPointerMove' : 'touchmove', $.proxy(self, '_touchMove'))
                .on(msPointerEnabled ? 'MSPointerUp' : 'touchend', $.proxy(self, '_touchEnd'));
            // Add -ms-touch-action: none for touch devices on IE10
            self.element.css('-ms-touch-action', 'none');
        }

        // Call the original $.ui.mouse init method
        _mouseInit.call(self);
    };

    /**
     * Remove the touch event handlers
     */
    mouseProto._mouseDestroy = function () {

        var self = this;

        // Un-delegate the touch handlers to the widget's element
        if (pointerEnabled) {
            self.element
                .off('pointerDown', $.proxy(self, '_touchStart'))
                .off('pointerMove', $.proxy(self, '_touchMove'))
                .off('pointerUp', $.proxy(self, '_touchEnd'))
                .off('MSPointerDown', $.proxy(self, '_touchStart'))
                .off('MSPointerMove', $.proxy(self, '_touchMove'))
                .off('MSPointerUp', $.proxy(self, '_touchEnd'));
        } else {
            self.element
                .off(msPointerEnabled ? 'MSPointerDown' : 'touchstart', $.proxy(self, '_touchStart'))
                .off(msPointerEnabled ? 'MSPointerMove' : 'touchmove', $.proxy(self, '_touchMove'))
                .off(msPointerEnabled ? 'MSPointerUp' : 'touchend', $.proxy(self, '_touchEnd'));
        }

        // Call the original $.ui.mouse destroy method
        _mouseDestroy.call(self);
    };

}));
