/*global define*/
define([
        './defaultValue',
        './defined',
        './defineProperties',
        './RequestState',
        './RequestType'
    ], function(
        defaultValue,
        defined,
        defineProperties,
        RequestState,
        RequestType) {
    'use strict';

    /**
     * Stores information for making a request using {@link RequestScheduler}.
     *
     * @exports Request
     *
     * @private
     */
    function Request(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);
        /**
         * The URL to request.
         */
        this.url = options.url;

        /**
         * The actual function that makes the request. Returns a promise for the requested data.
         */
        this.requestFunction = options.requestFunction;

        /**
         * Type of request. Used for more fine-grained priority sorting.
         */
        this.type = defaultValue(options.type, RequestType.OTHER);

        /**
         * If false, the request will be sent immediately. If true, the request will be throttled and sent based
         * on priority.
         */
        this.throttle = defaultValue(options.throttle, false);

        /**
         * The distance from the camera, used to prioritize requests.
         */
        this.distance = defaultValue(options.distance, 0.0);

        /**
         * The screen-space-error, used to prioritize requests.
         */
        this.screenSpaceError = defaultValue(options.screenSpaceError, 0.0);

        /**
         * The current state of the request.
         */
        this.state = RequestState.INITIAL;

        /**
         * Reference to the underlying XMLHttpRequest so that it may be cancelled.
         */
        this.xhr = undefined;

        /**
         * The requests's deferred promise.
         */
        this.deferred = undefined;
    }

    /**
     * Mark the request as cancelled.
     */
    Request.prototype.cancel = function() {
        this.state = RequestState.CANCELLED;
    };

    return Request;
});
