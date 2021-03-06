"use strict";

var app = app || {};

(function () {

    /**
     * Represents a key frame in an animation, with a duration
     */
    var FrameObject = function (graphic, duration, createBoundingBox) {
        if (isNaN(duration) || duration < 1) {
            duration = 1;
        }

        if (typeof createBoundingBox !== "boolean") {
            createBoundingBox = true;
        }

        this.graphic = graphic;
        this.duration = duration;
        this.vertices = [];

        if (createBoundingBox) {
            var w = this.graphic.width;
            var h = this.graphic.height;

            this.vertices.push(
                new app.Vec2(-w * 0.5, -h * 0.5),
                new app.Vec2(w * 0.5, -h * 0.5),
                new app.Vec2(w * 0.5, h * 0.5),
                new app.Vec2(-w * 0.5, h * 0.5)
            );
        }
    };
    Object.freeze(FrameObject);

    /**
     * Represents a state for a game object
     */
    var GameObjectState = function () {
        this.frameObjects = [];
        this.graphic = undefined;
        this.animationTimer = 0;
        this.frameId = 0;
        this.name = "";
    };
    GameObjectState.prototype = Object.freeze(Object.create(GameObjectState.prototype, {
        update : {
            value : function (dt) {
                this.animationTimer++;

                // If it's time to switch to the next frame in the animation, switch!
                if (this.animationTimer >= this.frameObjects[this.frameId].duration) {
                    this.animationTimer = 0;
                    this.frameId++;
                    this.frameId %= this.frameObjects.length;
                }
            }
        },

        addFrame : {
            value : function (frame) {
                this.frameObjects.push(frame);
            }
        },

        getGraphic : {
            value : function () {
                return this.frameObjects[this.frameId].graphic;
            }
        },

        getVertices : {
            value : function () {
                return this.frameObjects[this.frameId].vertices;
            }
        },

        getFrame : {
            value : function () {
                var frameCounter = 0;

                // Add the durations for all previous frames
                for (var i = 0; i < this.frameId; i++) {
                    var curFrame = this.frameObjects[i];
                    frameCounter += curFrame.duration;
                }

                // Add the remaining duration for how far we are into the current frame
                frameCounter += this.animationTimer;
                return frameCounter;
            }
        },

        setFrame : {
            value : function (frame) {
                var frameCounter = 0;

                for (var i = 0; i < this.frameObjects.length; i++) {
                    var curFrame = this.frameObjects[i];
                    frameCounter += curFrame.duration;

                    // If current frame object extends past the newly set frame, stop at this frame
                    if (frameCounter >= frame) {
                        this.frameId = i;
                        this.animationTimer = curFrame.duration - (frameCounter - frame);
                        return;
                    }
                }

                // If the desired frame is out of bounds, set the animation to the beginning
                this.frameId = 0;
                this.animationTimer = 0;
            }
        },

        getName : {
            value : function () {
                return this.name;
            }
        },

        setName : {
            value : function (value) {
                this.name = value;
            }
        }
    }));
    Object.freeze(GameObjectState);

    app.FrameObject = FrameObject;
    app.GameObjectState = GameObjectState;

})();