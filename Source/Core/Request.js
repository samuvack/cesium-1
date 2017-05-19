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
     * Stores information for making a request.
     *
     * @alias Request
     * @constructor
     *
     * @param {Object} [options] An object with the following properties:
     * @param {Boolean} [options.throttle=false] Whether to throttle and prioritize the request. If false, the request will be sent immediately. If true, the request will be throttled and sent based on priority.
     * @param {RequestType} [options.type=RequestType.OTHER] The type of request.
     * @param {Number} [options.distance=0.0] The distance from the camera, used to prioritize requests.
     * @param {Number} [options.screenSpaceError=0.0] The screen space error, used to prioritize requests.
     */
    function Request(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);
        /**
         * Whether to throttle and prioritize the request. If false, the request will be sent immediately. If true, the
         * request will be throttled and sent based on priority.
         *
         * @private
         */
        this.throttle = defaultValue(options.throttle, false);

        /**
         * Type of request.
         *
         * @private
         */
        this.type = defaultValue(options.type, RequestType.OTHER);

        /**
         * The distance from the camera, used to prioritize requests.
         *
         * @private
         */
        this.distance = defaultValue(options.distance, 0.0);

        /**
         * The screen space error, used to prioritize requests.
         *
         * @private
         */
        this.screenSpaceError = defaultValue(options.screenSpaceError, 0.0);

        /**
         * The URL to request. Set by the following load functions:
         *
         * @see loadWithXhr
         * @see loadImage
         * @see loadJsonp
         *
         * @private
         */
        this.url = undefined;

        /**
         * The actual function that makes the request. The function takes no arguments and returns a promise for the requested data.
         * Set by the following load functions:
         *
         * @see loadWithXhr
         * @see loadImage
         * @see loadJsonp
         *
         * @private
         */
        this.requestFunction = undefined;

        /**
         * The current state of the request.
         *
         * @private
         */
        this.state = RequestState.UNISSUED;

        /**
         * Reference to the underlying XMLHttpRequest so that it may be aborted in RequestScheduler.
         *
         * @private
         */
        this.xhr = undefined;

        /**
         * The requests's deferred promise.
         *
         * @private
         */
        this.deferred = undefined;
    }

    /**
     * Mark the request as cancelled.
     *
     * @private
     */
    Request.prototype.cancel = function() {
        this.state = RequestState.CANCELLED;
    };

    return Request;
});
