"use strict";

var app = app || {};

(function () {

app.gameobject = app.gameobject || {};

var Player = function () {
    app.gameobject.LivingObject.call(this);

    this.solid = true;

    // Create default state
    this.defaultGraphic = app.getImage(app.IMAGES.player);

    var w = this.defaultGraphic.width;
    var h = this.defaultGraphic.height;
    var verts = [
        new app.Vec2(-w * 0.5, -h * 0.5),
        new app.Vec2(w * 0.5, 0),
        new app.Vec2(-w * 0.5, h * 0.5)
    ];
    var frameObj = new app.FrameObject(this.defaultGraphic, 1, false);
    frameObj.vertices = verts;

    this.defaultState = new app.GameObjectState();
    this.defaultState.addFrame(frameObj);
    this.addState(app.gameobject.GameObject.STATE.DEFAULT, this.defaultState);

    this.lastSentPosition = new app.Vec2(-Infinity, -Infinity);

    this.rotate(-Math.PI * 0.5);
};
Object.defineProperties(Player, {
    TURN_SPEED : {
        value : 0.05
    },

    BRAKE_RATE : {
        value : 0.95
    },

    BOOST_ACCELERATION : {
        value : 0.0002
    },

    POSITION_UPDATE_DISTANCE : {
        value : 1
    }
});
Player.prototype = Object.freeze(Object.create(app.gameobject.LivingObject.prototype, {
    update : {
        value : function (dt) {
            app.gameobject.LivingObject.prototype.update.call(this, dt);

            // If the player is connected to the network, send out updates to
            // other players when necessary
            if (app.network.connected) {
                var displacementSinceUpdate = app.Vec2.subtract(
                    this.position,
                    this.lastSentPosition
                );
                var distanceSquaredSinceUpdate =
                    displacementSinceUpdate.getMagnitudeSquared();
                var maxUpdateDistance = Player.POSITION_UPDATE_DISTANCE;

                // If player has moved too far since last sending out an update
                // for its position, send out a new position update and update
                // the last-sent position
                if (distanceSquaredSinceUpdate >=
                    maxUpdateDistance * maxUpdateDistance) {

                    app.network.socket.emit('updateOther', {
                        x        : this.position.x,
                        y        : this.position.y,
                        rotation : this.getRotation()
                    });

                    this.lastSentPosition = this.position.clone();
                }
            }
        }
    }
}));
Object.freeze(Player);

var ClientPlayer = function () {
    app.gameobject.LivingObject.call(this);

    // Create default state
    this.defaultGraphic = app.getImage(app.IMAGES.client);

    var w = this.defaultGraphic.width;
    var h = this.defaultGraphic.height;
    var verts = [
        new app.Vec2(-w * 0.5, -h * 0.5),
        new app.Vec2(w * 0.5, 0),
        new app.Vec2(-w * 0.5, h * 0.5)
    ];
    var frameObj = new app.FrameObject(this.defaultGraphic, 1, false);
    frameObj.vertices = verts;

    this.defaultState = new app.GameObjectState();
    this.defaultState.addFrame(frameObj);
    this.addState(app.gameobject.GameObject.STATE.DEFAULT, this.defaultState);


    this.rotate(-Math.PI * 0.5);

    this.desiredPosition = new app.Vec2();
};
Object.defineProperties(ClientPlayer, {
    ARRIVAL_SLOWING_RADIUS : {
        value : 250
    },

    MIN_ARRIVAL_RADIUS : {
        value : 10
    }
});
ClientPlayer.prototype = Object.freeze(Object.create(
    app.gameobject.LivingObject.prototype, {

    update : {
        value : function (dt) {
            this.arrivalSteer();

            app.gameobject.LivingObject.prototype.update.call(this, dt);

            // Only update the forward direction of the client player if
            // they're moving fast enough
            if (this.velocity.getMagnitudeSquared() > 0.00001) {
                // Rotate the client player
                var angleDifference =
                    this.velocity.getAngle() -
                    this.forward.getAngle();
                this.rotate(angleDifference);
            }
        }
    },

    arrivalSteer : {
        value : function () {
            var desiredVelocity = app.Vec2.subtract(
                this.desiredPosition,
                this.position
            );
            var distanceSquared = desiredVelocity.getMagnitudeSquared();
            var slowingRadius = ClientPlayer.ARRIVAL_SLOWING_RADIUS;

            // Arrive to the desired position if far enough away
            if (distanceSquared > ClientPlayer.MIN_ARRIVAL_RADIUS) {
                // Set desired velocity to how quickly the player can move
                desiredVelocity.setMagnitude(
                    Player.BOOST_ACCELERATION * this.mass
                );

                if (distanceSquared < slowingRadius * slowingRadius) {
                    desiredVelocity.multiply(
                        app.world.World.FRICTION *
                        distanceSquared / (slowingRadius * slowingRadius)
                    );
                }

                this.addForce(desiredVelocity);

            // Force brakes when too close
            } else {
                this.velocity.multiply(app.world.World.FRICTION);
            }
        }
    }
}));
Object.freeze(ClientPlayer);

app.gameobject.Player       = Player;
app.gameobject.ClientPlayer = ClientPlayer;

})();