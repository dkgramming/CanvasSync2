"use strict";

var app = app || {};

(function () {

app.world = app.world || {};

var NetworkWorld = function (width, height) {
    app.world.World.call(this, width, height);

    $(app.network).on(
        app.network.event.ADD_CLIENT,
        this.onAddClient.bind(this)
    );
    $(app.network).on(
        app.network.event.REMOVE_CLIENT,
        this.onRemoveClient.bind(this)
    );

    // Add other clients that are already connected
    var keys = Object.keys(app.network.clients);

    for (var i = 0; i < keys.length; i++) {
        var id = parseInt(keys[i]);
        var client = app.network.clients[id];

        if (client !== app.network.localClient) {
            this.addGameObject(client.gameObject);
        }
    }
};
NetworkWorld.prototype = Object.freeze(Object.create(app.world.World.prototype, {
    onAddClient : {
        value : function (e, client) {
            if (client) {
                this.addGameObject(client.gameObject);
            }
        }
    },

    onRemoveClient : {
        value : function (e, client) {
            if (client) {
                this.removeGameObject(client.gameObject);
            }
        }
    }
}));
Object.freeze(NetworkWorld);

app.world.NetworkWorld = NetworkWorld;

})();