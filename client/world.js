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
        }
    },

    /**
     * Draws the world and all game objects in it
     */
    draw : {
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