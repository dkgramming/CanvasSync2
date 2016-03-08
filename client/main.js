"use strict";

var app = app || {};

app.main = {
    keyboard       : undefined,
    network        : undefined,
    currentScreen  : undefined,
    pauseScreen    : undefined,
    paused         : false,
    prevUpdateTime : -1,
    animationId    : 0,

    init : function () {
        app.DEBUG     = false;
        app.CAN_PAUSE = true;

        this.keyboard = app.keyboard;

        var canvas = document.querySelector("#game-canvas");
        this.pauseScreen = new app.screen.PauseScreen(canvas);

        this.network = app.network;
        $(this.network).on(
            this.network.event.CONNECT,
            this.onNetworkConnect.bind(this)
        );
        this.network.init();
    },

    /**
     * Callback for when this client has successfully connected to the network
     */
    onNetworkConnect : function () {
        var canvas = document.querySelector("#game-canvas");

        this.currentScreen = new app.screen.GameScreen(canvas);
        this.animationId = requestAnimationFrame(this.update.bind(this));
    },

    /**
     * Updates the game
     */
    update : function (time) {
	 	this.animationID = requestAnimationFrame(this.update.bind(this));

        // Initialize the delta time if the previous update time is "negative"
        if (this.prevUpdateTime === -1) {
            this.prevUpdateTime = time;
        }

        if (this.currentScreen) {
            this.currentScreen.update(time - this.prevUpdateTime);
        }

        this.prevUpdateTime = time;

        // Shift + Space + D -- Toggle debug mode
        if (this.keyboard.isPressed(this.keyboard.SHIFT) &&
            this.keyboard.isPressed(this.keyboard.SPACEBAR) &&
            this.keyboard.justPressed(this.keyboard.D)) {

            app.DEBUG = !app.DEBUG;
        }

        // Shift + P -- Disable pause screen
        if (this.keyboard.isPressed(this.keyboard.SHIFT) &&
            this.keyboard.justPressed(this.keyboard.P)) {

            app.CAN_PAUSE = false;
        }

        this.keyboard.update();
    },

    /**
     * Pauses the game
     */
    pause : function () {
        if (app.CAN_PAUSE) {
            this.paused = true;

            // Stop the animation loop
            cancelAnimationFrame(this.animationID);

            this.pauseScreen.draw(this.pauseScreen.canvas.getContext("2d"));
        }
    },

    /**
     * Resumes the game
     */
    resume : function () {
        this.paused = false;

        // Stop the animation loop, just in case it's running
        cancelAnimationFrame(this.animationID);

        // Reset the previous update time so that "dt" is forced to 0 on the
        // next update
        this.prevUpdateTime = -1;

        // Restart the loop
	 	this.animationID = requestAnimationFrame(this.update.bind(this));
    }

};