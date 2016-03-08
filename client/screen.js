"use strict";

var app = app || {};

(function () {

app.screen = app.screen || {};

var Screen = function (canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
};
Screen.prototype = Object.freeze(Object.create(Screen.prototype, {
    update : {
        value : function (dt) { }
    },

    draw : {
        value : function (ctx) { }
    }
}));
Object.freeze(Screen);

var PauseScreen = function (canvas) {
    Screen.call(this, canvas);
};
PauseScreen.prototype = Object.freeze(Object.create(Screen.prototype, {
    draw : {
        value : function (ctx) {
            ctx.save();

            ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            ctx.font = "36px Ubuntu";
            ctx.textAlign = "center";

            ctx.fillText(
                "Paused",
                this.canvas.width * 0.5,
                this.canvas.height * 0.5
            );

            ctx.restore();
        }
    }
}));
Object.freeze(PauseScreen);

var GameScreen = function (canvas) {
    Screen.call(this, canvas);

    this.world = new app.world.NetworkWorld(
        this.canvas.width,
        this.canvas.height
    );
    this.world.parallaxBg.img = app.getImage(app.IMAGES.bgTile);
    this.world.player = app.network.localClient.gameObject;
    this.world.addGameObject(this.world.player);
};
GameScreen.prototype = Object.freeze(Object.create(Screen.prototype, {
    update : {
        value : function (dt) {
            this.handleInput();

            this.world.update(dt);

            this.draw(this.ctx);
        }
    },

    draw : {
        value : function (ctx) {
            ctx.save();

            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            this.world.draw(ctx);

            ctx.restore();
        }
    },

    handleInput : {
        value : function () {
            var player       = this.world.player;
            var keyboard     = app.keyboard;
            var leftPressed  = keyboard.isPressed(keyboard.LEFT);
            var rightPressed = keyboard.isPressed(keyboard.RIGHT);
            var upPressed    = keyboard.isPressed(keyboard.UP);
            var downPressed  = keyboard.isPressed(keyboard.DOWN);

            // Left/ Right Key -- Player turns
            if (leftPressed || rightPressed) {
                var rotation = 0;

                if (leftPressed) {
                    rotation -= app.gameobject.Player.TURN_SPEED;
                }

                if (rightPressed) {
                    rotation += app.gameobject.Player.TURN_SPEED;
                }

                player.rotate(rotation);
            }

            // Up Key -- Player goes forward
            if (upPressed) {
                var movementForce = app.Vec2.fromAngle(player.getRotation());
                movementForce.multiply(
                    app.gameobject.Player.BOOST_ACCELERATION * player.mass
                );

                player.addForce(movementForce);
            }

            // Down Key -- Apply brakes to player
            if (downPressed) {
                player.velocity.multiply(app.gameobject.Player.BRAKE_RATE);
            }
        }
    }
}));
Object.freeze(GameScreen);

app.screen.GameScreen  = GameScreen;
app.screen.PauseScreen = PauseScreen;

})();