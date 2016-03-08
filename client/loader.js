"use strict";

var app = app || {};

window.addEventListener('load', function () {
    // Set up preloader
	app.queue = new createjs.LoadQueue(false);

    // Once everything has been preloaded, start the application
	app.queue.on("complete", function () {
        // Create shortcut reference for getting images
        app.getImage = app.queue.getResult.bind(app.queue);

        // Start the application
        app.main.init();

        window.onblur = function() {
            app.main.pause();
        };

        window.onfocus = function() {
            app.network.onFocusUpdate();
            app.main.resume();
        };
	});

    var needToLoad = [];

    // Prepare to load images
    for (var img in app.IMAGES) {
        var imgObj = {
            id : img,
            src : app.IMAGES[img]
        }

        needToLoad.push(imgObj);
    }

	app.queue.loadManifest(needToLoad);
});