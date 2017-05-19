/*global define*/
define([
        './Check',
        './defined',
        './defineProperties',
        './Heap',
        './isBlobUri',
        './isDataUri',
        './RequestState',
        '../ThirdParty/when'
    ], function(
        Check,
        defined,
        defineProperties,
        Heap,
        isBlobUri,
        isDataUri,
        RequestState,
        when) {
    'use strict';

    /**
     * Tracks the number of active requests and prioritizes incoming requests.
     *
     * @exports RequestScheduler
     *
     * @private
     */
    function RequestScheduler() {
    }

    /**
     * The maximum number of simultaneous active requests. Un-throttled requests do not observe this limit.
     * @type {Number}
     * @default 50
     */
    RequestScheduler.maximumRequests = 50;

    /**
     * The maximum size of the priority heap. This limits the number of requests that are sorted by priority. Only applies to requests that are not yet active.
     * @type {Number}
     * @default 20
     */
    RequestScheduler.priorityHeapSize = 20;

    /**
     * Specifies if the request scheduler should throttle incoming requests, or let the browser queue requests under its control.
     * @type {Boolean}
     * @default true
     */
    RequestScheduler.throttle = false;

    /**
     * When true, log statistics to the console every frame
     * @type {Boolean}
     * @default false
     */
    RequestScheduler.debugShowStatistics = false;

    function sortRequests(a, b) {
        // Sort requests by higher screen space error and then closer distance
        if (a.screenSpaceError !== b.screenSpaceError) {
            return b.screenSpaceError - a.screenSpaceError;
        }
        return a.distance - b.distance;
    }

    var statistics = {
        numberOfAttemptedRequests : 0,
        numberOfActiveRequests : 0,
        numberOfCancelledRequests : 0,
        numberOfCancelledActiveRequests : 0,
        numberOfFailedRequests : 0
    };

    var requestHeap = new Heap(sortRequests);
    requestHeap.maximumSize = RequestScheduler.priorityHeapSize;
    requestHeap.reserve(RequestScheduler.priorityHeapSize);
    var activeRequests = [];

    RequestScheduler.clearForSpecs = function() {
        requestHeap.reserve(0);
        var length = activeRequests.length;
        for (var i = 0; i < length; ++i) {
            cancelRequest(activeRequests[i]);
        }
        activeRequests.length = 0;
        clearStatistics();
    };

    function issueRequest(request) {
        if (request.state === RequestState.UNISSUED) {
            request.state = RequestState.ISSUED;
            request.deferred = when.defer();
        }
        return request.deferred.promise;
    }

    function startRequest(request) {
        var promise = issueRequest(request);
        request.state = RequestState.ACTIVE;
        activeRequests.push(request);
        ++statistics.numberOfActiveRequests;

        request.requestFunction().then(function(results) {
            request.state = RequestState.DONE;
            --statistics.numberOfActiveRequests;
            request.deferred.resolve(results);
        }).otherwise(function(error) {
            request.state = RequestState.FAILED;
            --statistics.numberOfActiveRequests;
            ++statistics.numberOfFailedRequests;
            request.deferred.reject(error);
        });

        return promise;
    }

    function cancelRequest(request) {
        if (request.state === RequestState.ACTIVE) {
            --statistics.numberOfActiveRequests;
            ++statistics.numberOfCancelledActiveRequests;
            if (xhrAbortSupported && defined(request.xhr)) {
                // TODO : make sure this doesn't trigger a failed promise, if so the deferred can be rejected first
                request.xhr.abort();
            }
        }
        request.state = RequestState.CANCELLED;
        ++statistics.numberOfCancelledRequests;
        request.deferred.reject('Cancelled');
    }

    /**
     * Issuers of a request should update properties of requests. At the end of the frame,
     * RequestScheduler.update is called to start, cancel, or defer requests.
     */
    RequestScheduler.update = function() {
        var request;

        // Loop over all active requests. Cancelled, failed, or done requests are removed from the array to make room for new requests.
        // If an active request is cancelled, its XMLHttpRequest will be aborted.
        var removeCount = 0;
        var activeLength = activeRequests.length;
        for (var i = 0; i < activeLength; ++i) {
            request = activeRequests[i];
            if (request.state === RequestState.CANCELLED) {
                cancelRequest(request);
            }
            if (request.state !== RequestState.ACTIVE) {
                ++removeCount;
                continue;
            }
            if (removeCount > 0) {
                // Shift back to fill in vacated slots from completed requests
                activeRequests[i - removeCount] = request;
            }
        }
        activeRequests.length -= removeCount;

        // Resort the heap since priority may have changed. Distance and sse are updated prior to getting here.
        requestHeap.heapify();

        // Get the number of open slots and fill with the highest priority requests.
        // Un-throttled requests are automatically added to activeRequests, so activeRequests.length may exceed maximumRequests
        var openSlots = Math.max(RequestScheduler.maximumRequests - activeRequests.length, 0);
        var count = 0;
        while (count < openSlots && requestHeap.length > 0) {
            request = requestHeap.pop();
            if (request.state === RequestState.CANCELLED) {
                cancelRequest(request);
                continue;
            }
            startRequest(request);
            ++count;
        }

        updateStatistics();
    };

    /**
     * Issue a request. If request.throttle is false, the request is sent immediately. Otherwise the request will be
     * queued and sorted by priority before being sent.
     *
     * @param {Request} request The request object.
     *
     * @returns {Promise|undefined} A Promise for the requested data, or undefined if this request does not have high enough priority to be issued.
     */
    RequestScheduler.request = function(request) {
        //>>includeStart('debug', pragmas.debug);
        Check.defined('request', request);
        //>>includeEnd('debug');

        ++statistics.numberOfRequestsThisFrame;

        if (!RequestScheduler.throttle || !request.throttle || isDataUri(request.url) || isBlobUri(request.url)) {
            return startRequest(request);
        }

        var removedRequest = requestHeap.insert(request);
        if (defined(removedRequest)) {
            if (removedRequest === request) {
                // Request does not have high enough priority to be issued
                return undefined;
            }
            // A previously issued request has been bumped off the priority heap, so cancel it
            cancelRequest(removedRequest);
        }

        return issueRequest(request);
    };

    function clearStatistics() {
        statistics.numberOfRequestsThisFrame = 0;
        statistics.numberOfCancelledRequests = 0;
        statistics.numberOfCancelledActiveRequests = 0;
    }

    function updateStatistics() {
        if (!RequestScheduler.debugShowStatistics) {
            return;
        }

        if (statistics.numberOfAttemptedRequests > 0) {
            console.log('Number of attempted requests: ' + statistics.numberOfAttemptedRequests);
        }
        if (statistics.numberOfActiveRequests > 0) {
            console.log('Number of active requests: ' + statistics.numberOfActiveRequests);
        }
        if (statistics.numberOfCancelledRequests > 0) {
            console.log('Number of cancelled requests: ' + statistics.numberOfCancelledRequests);
        }
        if (statistics.numberOfCancelledActiveRequests > 0) {
            console.log('Number of cancelled active requests: ' + statistics.numberOfCancelledActiveRequests);
        }
        if (statistics.numberOfFailedRequests > 0) {
            console.log('Number of failed requests: ' + statistics.numberOfFailedRequests);
        }

        clearStatistics();
    }

    // TODO : this check may not be needed
    var xhrAbortSupported = (function() {
        try {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', '#', true);
            xhr.send();
            xhr.abort();
            return (xhr.readyState === XMLHttpRequest.UNSENT);
        } catch (e) {
            return false;
        }
    })();

    return RequestScheduler;
});
