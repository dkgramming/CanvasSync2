"use strict";

var app = app || {};

app.network = {
    socket      : undefined,
    localClient : {},
    clients     : {},
    connected   : false,
    event       : {
        CONNECT       : "connect",
        REMOVE_CLIENT : "removeClient",
        ADD_CLIENT    : "addClient"
    },

    init : function () {
        this.socket = io.connect();

        this.socket.on('confirm', this.onConfirmClient.bind(this));
        this.socket.on('addOther', this.onAddOtherClient.bind(this));
        this.socket.on('removeOther', this.onRemoveOtherClient.bind(this));
        this.socket.on('loadPrevious', this.onLoadPreviousClients.bind(this));
        this.socket.on('updateOther', this.onUpdateOtherClient.bind(this));

        this.socket.emit('init', {
            user : "user"
        });
    },

    onConfirmClient : function (data) {
        var id = data.id;
        this.localClient = new app.network.LocalClient(id, data);
        this.clients[id] = this.localClient;

        this.connected = true;

        $(app.network).trigger(
            this.event.CONNECT
        );
    },

    onAddOtherClient : function (data) {
        var id = data.id;
        var newClient = new app.network.Client(id, data);

        newClient.gameObject.position.x = data.x;
        newClient.gameObject.position.y = data.y;
        newClient.gameObject.desiredPosition.x = data.x;
        newClient.gameObject.desiredPosition.y = data.y;
        newClient.gameObject.setRotation(data.rotation);

        this.clients[data.id] = newClient;

        $(app.network).trigger(
            this.event.ADD_CLIENT,
            this.clients[data.id]
        );
    },

    onRemoveOtherClient : function (data) {
        $(app.network).trigger(
            this.event.REMOVE_CLIENT,
            this.clients[data.id]
        );

        this.clients[data.id] = undefined;
        delete this.clients[data.id];
    },

    onLoadPreviousClients : function (data) {
        var keys = Object.keys(data);

        for (var i = 0; i < keys.length; i++) {
            var id = parseInt(keys[i]);
            var userData = data[id];

            this.onAddOtherClient(userData);
        }
    },

    onUpdateOtherClient : function (data) {
        var id = data.id;
        var client = this.clients[id];

        client.data.x = data.x;
        client.data.y = data.y;
        client.gameObject.desiredPosition.x = data.x;
        client.gameObject.desiredPosition.y = data.y;
        client.data.rotation = data.rotation;
    },

    /**
     * Callback for when the application gains focus and needs all clients to
     * snap into current location
     */
    onFocusUpdate : function () {
        var keys = Object.keys(this.clients);

        for (var i = 0; i < keys.length; i++) {
            var id = parseInt(keys[i]);
            var client = this.clients[id];

            if (client !== this.localClient) {
                var gameObject = client.gameObject;
                gameObject.position.x = client.data.x;
                gameObject.position.y = client.data.y;
                gameObject.setRotation(client.data.rotation);
                gameObject.velocity.multiply(0);
                gameObject.acceleration.multiply(0);
            }
        }
    }
};

// Create network components
(function () {

var Client = function (id, data) {
    this.id = id;
    this.data = data;
    this.gameObject = new app.gameobject.ClientPlayer();
};
Object.freeze(Client);

var LocalClient = function (id, data) {
    this.id = id;
    this.data = data;
    this.gameObject = new app.gameobject.Player();
};
Object.freeze(LocalClient);

app.network.Client      = Client;
app.network.LocalClient = LocalClient;

})();