"use strict";

var app = app || {};

(function () {

app.parallax = app.parallax || {};

var ParallaxBg = function (camera, backgroundImg) {
    this.camera  = camera;
    this.img     = backgroundImg;
    this.panRate = ParallaxBg.DEFAULT_PAN_RATE;
};
Object.defineProperties(ParallaxBg, {
    DEFAULT_PAN_RATE : {
        value : 0.125
    }
});
ParallaxBg.prototype = Object.freeze(Object.create(ParallaxBg.prototype, {
    draw : {
        value : function (ctx) {
            if (this.img) {
                ctx.save();

                var tileWidth       = this.img.width;
                var tileHeight      = this.img.height;

                var cameraPos       = this.camera.position;
                var parallaxX       = cameraPos.x * this.panRate;
                var parallaxY       = cameraPos.y * this.panRate;

                // Add 2 to both to cover edges of screen when the parallax BG
                // is moving
                var totalHorizontal = ctx.canvas.width / tileWidth + 2;
                var totalVertical   = ctx.canvas.height / tileHeight + 2;

                for (var i = -1; i < totalHorizontal - 1; i++) {
                    for (var j = -1; j < totalVertical - 1; j++) {
                        var x = i * tileWidth - parallaxX % tileWidth;
                        var y = j * tileHeight - parallaxY % tileHeight;

                        ctx.drawImage(this.img, Math.round(x), Math.round(y));
                    }
                }

                ctx.restore();
            }
        }
    }
}));
Object.freeze(ParallaxBg);

app.parallax.ParallaxBg = ParallaxBg;

})();