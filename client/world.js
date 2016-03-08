"use strict";

var app = app || {};

(function () {

app.world = app.world || {};

var World = function (width, height) {
    this.gameObjects = [];

    this.quadtree = new app.Quadtree(0, {
        x      : 0,
        y      : 0,
        width  : width,
        height : height
    });

    this.camera = new app.world.Camera();
    this.parallaxBg = new app.parallax.ParallaxBg(this.camera);

    this.player = null;
};
Object.defineProperties(World, {
    FRICTION : {
        value : 0.925
    },

    MINIMAP : {
        value : Object.freeze({
            WIDTH      : 150,
            HEIGHT     : 100,
            SCALE      : 0.1,
            FILL_STYLE : "#192427"
        })
    }
});
World.prototype = Object.freeze(Object.create(World.prototype, {
    /**
     * Resets the world
     */
    reset : {
        value : function () {
            this.gameObjects = [];
        }
    },

    /**
     * Adds a game object to the world
     */
    addGameObject : {
        value : function (obj) {
            this.gameObjects.push(obj);

            // Put player back on top
            if (this.player) {
                this.removeGameObject(this.player);
                this.gameObjects.push(this.player);
            }
        }
    },

    /**
     * Removes a game object from the world
     */
    removeGameObject : {
        value : function (obj) {
            var objIndex = this.gameObjects.indexOf(obj);

            if (objIndex >= 0 && objIndex < this.gameObjects.length) {
                this.gameObjects.splice(objIndex, 1);
            }
        }
    },

    /**
     * Handles collisions between game objects
     */
    handleCollisions : {
        value : function () {
            for (var i = this.gameObjects.length - 1; i >= 0; i--) {
                var cur = this.gameObjects[i];

                // Skip over certain objects for collision detection because
                // other objects will check against them later
                if (!cur || !(cur instanceof app.gameobject.LivingObject)) {
                    continue;
                }

                var possibleCollisions = [];
                this.quadtree.retrieve(possibleCollisions, cur);

                for (var j = 0; j < possibleCollisions.length; j++) {
                    var obj0 = this.gameObjects[i];
                    var obj1 = possibleCollisions[j];

                    // One of the objects was removed upon collision, so
                    // continue through the loop because it cannot be used, or
                    // if both objects have a fixed location, ignore their
                    // collisions
                    if (!obj0 || !obj1 ||
                        (obj0.fixed && obj1.fixed) ||
                        (obj0 === obj1)) {

                        continue;
                    }

                    // Check collisions if one of the objects is solid
                    if (obj0.solid || obj1.solid) {
                        var colliding = obj0.handleCollision(obj1);

                        if (colliding) {
                            obj0.resolveCollision(obj1);
                            obj1.resolveCollision(obj0);
                        }
                    }
                }
            }
        }
    },

    /**
     * Updates the world and all game objects in it
     */
    update : {
        value : function (dt) {
            // Set up quadtree every update (to handle moving objects and allow
            // for collision checking)
            this.quadtree.clear();
            for (var i = 0; i < this.gameObjects.length; i++) {
                this.quadtree.insert(this.gameObjects[i]);
            }

            for (var i = this.gameObjects.length - 1; i >= 0; i--) {
                var obj = this.gameObjects[i];
                obj.acceleration.multiply(World.FRICTION);
                obj.velocity.multiply(World.FRICTION);
                obj.update(dt);
            }

            if (this.player) {
                this.camera.follow(this.player);
            }

            this.handleCollisions();
        }
    },

    /**
     * Draws the world and all game objects in it
     */
    draw : {
        value : function (ctx) {
            this.drawGameObjects(ctx);
            this.drawHUD(ctx);
        }
    },

    drawGameObjects : {
        value : function (ctx) {
            ctx.save();

            var cameraPos    = this.camera.position;
            var screenWidth  = ctx.canvas.width;
            var screenHeight = ctx.canvas.height;
            var offset       = new app.Vec2(
                screenWidth  * 0.5,
                screenHeight * 0.5
            );

            var screenDiagonalSquared =
                screenWidth  * screenWidth +
                screenHeight * screenHeight;

            this.parallaxBg.draw(ctx);

            // Move the screen to the camera's position, then center that
            // position in the middle of the screen
            ctx.translate(-cameraPos.x, -cameraPos.y);
            ctx.translate(offset.x, offset.y);

            for (var i = 0; i < this.gameObjects.length; i++) {
                var obj = this.gameObjects[i];
                var objOffset = new app.Vec2(
                    obj.position.x - cameraPos.x,
                    obj.position.y - cameraPos.y
                );
                var distanceSquared = objOffset.getMagnitudeSquared();

                // If the game object is too far away, don't draw it!
                if (distanceSquared <= screenDiagonalSquared) {
                    ctx.save();

                    ctx.translate(obj.position.x, obj.position.y);
                    obj.draw(ctx);

                    if (app.DEBUG) {
                        obj.drawDebug(ctx);
                    }

                    ctx.restore();
                }
            }

            ctx.restore();
        }
    },

    drawHUD : {
        value : function (ctx) {
            ctx.save();

            var cameraPos    = this.camera.position;
            var screenWidth  = ctx.canvas.width;
            var screenHeight = ctx.canvas.height;
            var offset       = new app.Vec2(
                World.MINIMAP.WIDTH  * 0.5,
                World.MINIMAP.HEIGHT * 0.5
            );

            var screenDiagonalSquared =
                screenWidth  * screenWidth +
                screenHeight * screenHeight;

            ctx.translate(screenWidth - World.MINIMAP.WIDTH, 0);
            ctx.beginPath();
            ctx.rect(0, 0, World.MINIMAP.WIDTH, World.MINIMAP.HEIGHT);
            ctx.clip();

            ctx.fillStyle = World.MINIMAP.FILL_STYLE;
            ctx.strokeStyle = "rgb(100, 100, 100)";
            ctx.globalAlpha = 0.9;
            ctx.beginPath();
            ctx.rect(0, 0, World.MINIMAP.WIDTH, World.MINIMAP.HEIGHT);
            ctx.fill();
            ctx.stroke();

            ctx.translate(offset.x, offset.y);

            ctx.scale(World.MINIMAP.SCALE, World.MINIMAP.SCALE);

            for (var i = 0; i < this.gameObjects.length; i++) {
                var obj = this.gameObjects[i];
                var objOffset = new app.Vec2(
                    obj.position.x - cameraPos.x,
                    obj.position.y - cameraPos.y
                );
                var distanceSquared = objOffset.getMagnitudeSquared();

                // If the game object is too far away, don't draw it!
                if (distanceSquared <= screenDiagonalSquared * 1.4) {
                    ctx.save();

                    ctx.translate(objOffset.x, objOffset.y);
                    obj.drawOnMinimap(ctx);

                    ctx.restore();
                }
            }

            ctx.restore();
        }
    }
}));
Object.freeze(World);

var Camera = function () {
    this.position = new app.Vec2();
    this.followRate = Camera.DEFAULT_FOLLOW_RATE;
};
Object.defineProperties(Camera, {
    DEFAULT_FOLLOW_RATE : {
        value : 0.5
    }
});
Camera.prototype = Object.freeze(Object.create(Camera.prototype, {
    /**
     * Moves the camera toward the game object passed in
     */
    follow : {
        value : function (gameObject) {
            var cameraDisplacement = app.Vec2.subtract(
                this.position,
                gameObject.position
            );
            cameraDisplacement.multiply(this.followRate);

            this.position.subtract(cameraDisplacement);
        }
    }
}));
Object.freeze(Camera);

app.world.World = World;
app.world.Camera = Camera;

})();