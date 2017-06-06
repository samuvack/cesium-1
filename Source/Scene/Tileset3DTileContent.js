/*global define*/
define([
        '../Core/defaultValue',
        '../Core/defined',
        '../Core/defineProperties',
        '../Core/destroyObject',
        '../Core/DeveloperError',
        '../Core/getStringFromTypedArray',
        '../ThirdParty/when'
    ], function(
        defaultValue,
        defined,
        defineProperties,
        destroyObject,
        DeveloperError,
        getStringFromTypedArray,
        when) {
    'use strict';

    /**
     * Represents content for a tile in a
     * {@link https://github.com/AnalyticalGraphicsInc/3d-tiles/blob/master/README.md|3D Tiles} tileset whose
     * content points to another 3D Tiles tileset.
     *
     * @alias Tileset3DTileContent
     * @constructor
     *
     * @private
     */
    function Tileset3DTileContent(tileset, tile, url, arrayBuffer, byteOffset) {
        this._tileset = tileset;
        this._tile = tile;
        this._url = url;
        this._readyPromise = when.defer();

        /**
         * Part of the {@link Cesium3DTileContent} interface.
         */
        this.featurePropertiesDirty = false;

        initialize(this, arrayBuffer, byteOffset);
    }

    defineProperties(Tileset3DTileContent.prototype, {
        /**
         * Part of the {@link Cesium3DTileContent} interface.
         */
        featuresLength : {
            get : function() {
                return 0;
            }
        },

        /**
         * Part of the {@link Cesium3DTileContent} interface.
         */
        pointsLength : {
            get : function() {
                return 0;
            }
        },

        /**
         * Part of the {@link Cesium3DTileContent} interface.
         */
        trianglesLength : {
            get : function() {
                return 0;
            }
        },

        /**
         * Part of the {@link Cesium3DTileContent} interface.
         */
        geometryByteLength : {
            get : function() {
                return 0;
            }
        },

        /**
         * Part of the {@link Cesium3DTileContent} interface.
         */
        texturesByteLength : {
            get : function() {
                return 0;
            }
        },

        /**
         * Part of the {@link Cesium3DTileContent} interface.
         */
        batchTableByteLength : {
            get : function() {
                return 0;
            }
        },

        /**
         * Part of the {@link Cesium3DTileContent} interface.
         */
        innerContents : {
            get : function() {
                return undefined;
            }
        },

        /**
         * Part of the {@link Cesium3DTileContent} interface.
         */
        readyPromise : {
            get : function() {
                return this._readyPromise.promise;
            }
        },

        /**
         * Part of the {@link Cesium3DTileContent} interface.
         */
        tileset : {
            get : function() {
                return this._tileset;
            }
        },

        /**
         * Part of the {@link Cesium3DTileContent} interface.
         */
        tile : {
            get : function() {
                return this._tile;
            }
        },

        /**
         * Part of the {@link Cesium3DTileContent} interface.
         */
        url : {
            get : function() {
                return this._url;
            }
        },

        /**
         * Part of the {@link Cesium3DTileContent} interface.
         */
        batchTable : {
            get : function() {
                return undefined;
            }
        }
    });

    function initialize(content, arrayBuffer, byteOffset) {
        byteOffset = defaultValue(byteOffset, 0);
        var uint8Array = new Uint8Array(arrayBuffer);
        var jsonString = getStringFromTypedArray(uint8Array, byteOffset);
        var tilesetJson;

        try {
            tilesetJson = JSON.parse(jsonString);
        } catch (error) {
            content._readyPromise.reject(new DeveloperError('Invalid tile content.'));
            return;
        }

        content._tileset.loadTileset(content._url, tilesetJson, content._tile);
        content._readyPromise.resolve(content);
    }

    /**
     * Part of the {@link Cesium3DTileContent} interface.  <code>Tileset3DTileContent</code>
     * always returns <code>false</code> since a tile of this type does not have any features.
     */
    Tileset3DTileContent.prototype.hasProperty = function(batchId, name) {
        return false;
    };

    /**
     * Part of the {@link Cesium3DTileContent} interface.  <code>Tileset3DTileContent</code>
     * always returns <code>undefined</code> since a tile of this type does not have any features.
     */
    Tileset3DTileContent.prototype.getFeature = function(batchId) {
        return undefined;
    };

    /**
     * Part of the {@link Cesium3DTileContent} interface.
     */
    Tileset3DTileContent.prototype.applyDebugSettings = function(enabled, color) {
    };

    /**
     * Part of the {@link Cesium3DTileContent} interface.
     */
    Tileset3DTileContent.prototype.applyStyle = function(frameState, style) {
    };

    /**
     * Part of the {@link Cesium3DTileContent} interface.
     */
    Tileset3DTileContent.prototype.update = function(tileset, frameState) {
    };

    /**
     * Part of the {@link Cesium3DTileContent} interface.
     */
    Tileset3DTileContent.prototype.isDestroyed = function() {
        return false;
    };

    /**
     * Part of the {@link Cesium3DTileContent} interface.
     */
    Tileset3DTileContent.prototype.destroy = function() {
        return destroyObject(this);
    };

    return Tileset3DTileContent;
});
