"use strict";

var app = app || {};

(function () {

    app.gameobject = app.gameobject || {};

    /**
     * Generic object for the game's canvas
     */
    var GameObject = function () {
        this.graphic = undefined;
        this.vertices = undefined;
        this.states = {};
        this.currentState = undefined;
    };
    Object.defineProperties(GameObject, {
        STATE : {
            value : {
                DEFAULT : "DEFAULT"
            }
        },

        name : {
            value : "GameObject"
        }
    });
    GameObject.prototype = Object.freeze(Object.create(GameObject.prototype, {
        update : {
            value : function (dt) {
                if (this.currentState !== undefined) {
                    this.currentState.update(dt);
                    this.graphic = this.currentState.getGraphic();
                    this.vertices = this.currentState.getVertices();
                }
            }
        },

        draw : {
            value : function (ctx) {
                if (this.graphic !== undefined) {
                    ctx.drawImage(this.graphic, -this.graphic.width * 0.5, -this.graphic.height * 0.5);
                }
            }
        },

        getWidth : {
            value : function () {
                if (this.graphic === undefined) {
                    return 0;
                }
                return this.graphic.width;
            }
        },

        getHeight : {
            value : function () {
                if (this.graphic === undefined) {
                    return 0;
                }
                return this.graphic.height;
            }
        },

        createImageFromSrc : {
            value : function (src) {
                var img = new Image();
                img.src = src;
                return img;
            }
        },

        getState : {
            value : function (stateName) {
                return this.states[stateName];
            }
        },

        setState : {
            value : function (stateName) {
                var newState = this.states[stateName];

                if (this.currentState !== newState) {
                    this.currentState = newState;
                    this.currentState.setFrame(0);
                }
            }
        },

        addState : {
            value : function (stateName, state) {
                this.states[stateName] = state;
                state.setName(stateName);

                // No current state yet, so initialize game object with newly
                // added state
                if (this.currentState === undefined) {
                    this.setState(stateName);

                    this.vertices = this.currentState.getVertices();
                    this.graphic = this.currentState.getGraphic();
                }
            }
        }
    }));
    Object.freeze(GameObject);

    /**
     * A game object with basic 2D physics
     */
    var PhysicsObject = function () {
        GameObject.call(this);

        this.position = new app.Vec2();
        this.velocity = new app.Vec2();
        this.acceleration = new app.Vec2();
        this.maxSpeed = PhysicsObject.DEFAULT_MAX_SPEED;
        this.maxAcceleration = PhysicsObject.DEFAULT_MAX_ACCELERATION;
        this.forward = new app.Vec2(1, 0);
        this.mass = 1000.0;
        this.solid = true;
        this.fixed = false;
        this.vertices = [];
    };
    Object.defineProperties(PhysicsObject, {
        DEFAULT_MAX_ACCELERATION : {
            value : 0.025
        },
        DEFAULT_MAX_SPEED : {
            value : 0.4
        },

        // The amount of angles at which the physics object can be rendered
        TOTAL_DISPLAY_ANGLES : {
            value : 32
        },

        MINIMAP_FILL_STYLE : {
            value : "#d59df8"
        },

        MINIMAP_STROKE_STYLE : {
            value : "#8a41b8"
        }
    });
    PhysicsObject.prototype = Object.freeze(Object.create(GameObject.prototype, {
        addForce : {
            value : function (force) {
                force.divide(this.mass);
                this.acceleration.add(force);
            }
        },

        addImpulse : {
            value : function (impulse) {
                impulse.divide(this.mass);
                this.velocity.add(impulse);
            }
        },

        rotate : {
            value : function (theta) {
                this.forward.rotate(theta);

                for (var stateName in this.states) {
                    var state = this.states[stateName];

                    for (var i = 0; i < state.frameObjects.length; i++) {
                        var frameObject = state.frameObjects[i];

                        for (var j = 0; j < frameObject.vertices.length; j++) {
                            frameObject.vertices[j].rotate(theta);
                        }
                    }
                }

                return this;
            }
        },

        getRotation : {
            value : function () {
                return this.forward.getAngle();
            }
        },

        setRotation : {
            value : function (angle) {
                this.rotate(angle - this.getRotation());
            }
        },

        getDisplayAngle : {
            value : function (angle) {
                // The angle increment for rounding the rotation
                var roundingAngle = 2 * Math.PI / PhysicsObject.TOTAL_DISPLAY_ANGLES;

                var displayedAngle = Math.round(angle / roundingAngle) * roundingAngle;
                return displayedAngle;
            }
        },

        update : {
            value : function (dt) {
                GameObject.prototype.update.call(this, dt);

                // Limit acceleration to max acceleration
                this.acceleration.limit(this.maxAcceleration);

                // Apply an acceleration matching the displayed direction for the physics object
                var displayAcceleration = this.acceleration.clone().setAngle(this.getDisplayAngle(this.acceleration.getAngle()));
                this.velocity.add(displayAcceleration.multiply(dt));

                // Limit velocity to max speed
                this.velocity.limit(this.maxSpeed);

                // Apply the current velocity
                this.position.add(this.velocity.clone().multiply(dt));
            }
        },

        draw : {
            value : function (ctx) {
                ctx.save();

                ctx.rotate(this.getRotation());

                if (this.graphic === undefined) {
                    ctx.beginPath();
                    ctx.fillStyle = "rgb(256, 0, 0)";
                    ctx.rect(0, 0, 25, 25);
                    ctx.fill();
                } else {
                    GameObject.prototype.draw.call(this, ctx);
                }

                ctx.restore();
            }
        },

        drawOnMinimap : {
            value : function (ctx) {
            }
        },

        drawDebug : {
            value : function (ctx) {
                if (this.vertices.length > 0) {
                    ctx.strokeStyle = "white";
                    ctx.beginPath();
                    ctx.moveTo(this.vertices[0].x, this.vertices[0].y);

                    for (var i = 1; i < this.vertices.length; i++) {
                        ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
                    }
                    ctx.closePath();
                    ctx.stroke();
                }
            }
        },

        handleCollision : {
            value : function (physObj) {
                var colliding;

                // (Optimization) If the objects are close enough and may collide, we will do
                // more intensive checking next (A^2 + B^2 = C^2)
                var thisW = this.getWidth();
                var thisH = this.getHeight();
                var thatW = physObj.getWidth();
                var thatH = physObj.getHeight();
                var radiusSquared1 = (thisW * thisW + thisH * thisH) * 0.25;
                var radiusSquared2 = (thatW * thatW + thatH * thatH) * 0.25;
                var distanceSquared = new app.Vec2.subtract(this.position, physObj.position).getMagnitudeSquared();
                var mayCollide = (distanceSquared <= radiusSquared1 + radiusSquared2);

                if (!mayCollide) {
                    return false;
                }

                // The two vertices on this physics object that define a segment that
                // intersects with the given physics object
                var intersectionSegmentV1 = null;
                var intersectionSegmentV2 = null;

                for (var i = 0; i < this.vertices.length; i++) {
                    var q1 = app.Vec2.add(this.vertices[i], this.position);
                    var q2 = app.Vec2.add(this.vertices[(i + 1) % this.vertices.length], this.position);

                    // Equation for general form of a line Ax + By = C;
                    var a1 = q2.y - q1.y;
                    var b1 = q1.x - q2.x;
                    var c1 = a1 * q1.x + b1 * q1.y;

                    for (var j = 0; j < physObj.vertices.length; j++) {
                        var p1 = app.Vec2.add(physObj.vertices[j], physObj.position);
                        var p2 = app.Vec2.add(physObj.vertices[(j + 1) % physObj.vertices.length], physObj.position);

                        // Equation for general form of a line Ax + By = C;
                        var a2 = p2.y - p1.y;
                        var b2 = p1.x - p2.x;
                        var c2 = a2 * p1.x + b2 * p1.y;

                        var determinant = a1 * b2 - a2 * b1;

                        // If lines are not parallel
                        if (determinant !== 0) {
                            var intersectX = (b2 * c1 - b1 * c2) / determinant;
                            var intersectY = (a1 * c2 - a2 * c1) / determinant;

                            var intersecting = (
                                Math.min(p1.x, p2.x) <= intersectX && intersectX <= Math.max(p1.x, p2.x) &&
                                Math.min(p1.y, p2.y) <= intersectY && intersectY <= Math.max(p1.y, p2.y) &&
                                Math.min(q1.x, q2.x) <= intersectX && intersectX <= Math.max(q1.x, q2.x) &&
                                Math.min(q1.y, q2.y) <= intersectY && intersectY <= Math.max(q1.y, q2.y)
                            );

                            if (intersecting) {
                                intersectionSegmentV1 = p1;
                                intersectionSegmentV2 = p2;
                                colliding = true;
                                break;
                            }
                        }
                    }

                    if (colliding) {
                        break;
                    }
                }

                // Resolve collision when both objects are solid
                if (colliding && physObj.solid && this.solid) {
                    var collisionPush = new app.Vec2();
                    var orthogonalVector = app.Vec2.subtract(intersectionSegmentV2, intersectionSegmentV1).getOrthogonal();
                    orthogonalVector.normalize()

                    if (!this.fixed) {
                        this.acceleration.multiply(0);
                        this.velocity.x = orthogonalVector.x;
                        this.velocity.y = orthogonalVector.y;
                        this.position.add(orthogonalVector.multiply(2));
                    }
                    if (!physObj.fixed) {
                        orthogonalVector.multiply(-1);
                        physObj.acceleration.multiply(0);
                        physObj.velocity.x = orthogonalVector.x;
                        physObj.velocity.y = orthogonalVector.y;
                        physObj.position.add(orthogonalVector.multiply(2));
                    }
                }

                return colliding;
            }
        },

        resolveCollision : {
            value : function (physObj) {

            }
        }
    }));
    Object.freeze(PhysicsObject);

    /**
     * A physics object that has health, and blinks upon getting hit (with "invincibility frames")
     */
    var LivingObject = function () {
        PhysicsObject.call(this);

        this.damageTimer = 0;
        this.maxDamageTimer = LivingObject.DEFAULT_MAX_DAMAGE_TIMER;
        this.health = LivingObject.DEFAULT_MAX_HEALTH;
        this.maxHealth = LivingObject.DEFAULT_MAX_HEALTH;
    };
    Object.defineProperties(LivingObject, {
        DEFAULT_MAX_HEALTH : {
            value : 1
        },

        // Amount of time after being hit until the living object's temporary invincibility runs out
        DEFAULT_MAX_DAMAGE_TIMER : {
            value : 100
        },

        INVINCIBILITY_BLINK_TIMER : {
            value : 6
        }
    });
    LivingObject.prototype = Object.freeze(Object.create(PhysicsObject.prototype, {
        update : {
            value : function (dt) {
                PhysicsObject.prototype.update.call(this, dt);

                // Update damage timer when just got hit
                if (this.justGotHit()) {
                    this.damageTimer++;

                    if (this.damageTimer >= this.maxDamageTimer) {
                        this.damageTimer = 0;
                    }
                }
            }
        },

        draw : {
            value : function (ctx) {
                ctx.save();

                // Make the living object blink when it has taken damage
                if ((this.damageTimer % (LivingObject.INVINCIBILITY_BLINK_TIMER * 2)) > LivingObject.INVINCIBILITY_BLINK_TIMER) {
                    ctx.globalAlpha = 0.25;
                }

                // The rendered angle for the graphic
                var displayedAngle = this.getDisplayAngle(this.getRotation());

                ctx.rotate(displayedAngle);
                ctx.drawImage(this.graphic, -this.graphic.width * 0.5, -this.graphic.height * 0.5);

                ctx.restore();
            }
        },

        /**
         * Returns whether or not the living object has just gotten hit by something
         */
        justGotHit : {
            value : function () {
                return (this.damageTimer > 0);
            }
        },

        takeDamage : {
            value : function (damage) {
                if (!this.justGotHit()) {
                    this.health -= damage;
                    this.damageTimer = 1;

                    // Prevent health from dropping below 0
                    if (this.health < 0) {
                        this.health = 0;
                    }
                }
            }
        },

        heal : {
            value : function (amount) {
                this.health += amount;

                if (this.health > this.maxHealth) {
                    this.health = this.maxHealth;
                }
            }
        },
    }));
    Object.freeze(LivingObject);

    app.gameobject.GameObject    = GameObject;
    app.gameobject.PhysicsObject = PhysicsObject;
    app.gameobject.LivingObject  = LivingObject;

}());