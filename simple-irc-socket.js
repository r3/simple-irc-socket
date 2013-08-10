var net = require('net');
var events = require('events');
var util = require('util');

var log = function (msg, input) {
    var date = new Date();
    console.log(Date().toString() + "|" + (input ? "<-" : "->") + "|" + msg);
};

var create = function (prototype, properties) {
    if (typeof properties !== 'object') {
        return Object.create(prototype);
    }

    var props = {};
    Object.keys(properties).forEach(function (key) {
        props[key] = { value: properties[key] };
    });
    return Object.create(prototype, props);
};

var Socket = module.exports = function Socket (network, GenericSocket) {
    GenericSocket = GenericSocket || net.Socket;

    var socket = create(Socket.prototype); // no new needed.
    socket.port = network.port || 6667;
    socket.netname = network.server;
    socket.genericSocket = new GenericSocket();
    socket.connected = false;

    var bufferDescription = {
        partialMessage: {
            writable: true,
            configurable: true
        },

        receiveBlock: {
            enumerable: true,
            value: function (block) {
                var messages = block.split('\r\n')
                    .filter(function (line) { return line !== ''; })
                    .filter(function (line) {
                        if (line.slice(0, 4) === 'PING') {
                            var msg = ['PONG', line.slice(line.indexOf(':'))];
                            socket.raw(msg);
                            return false;
                        }

                        return true;
                    })

                if (this.partialMessage) {
                    messages[0] = this.partialMessage + messages[0];
                    this.partialMessage = null;
                }

                if (block.substring(block.length - 2, block.length) != '\r\n') {
                    this.partialMessage = messages.pop();
                }

                messages.forEach(function (msg) {
                    socket.emit('message', msg);
                });
            }
        }
    }

    var ircBuffer = Object.create(events.EventEmitter.prototype,
                                  bufferDescription);

    void function readyEvent () {
        var emitWhenReady = function (data) {
            if (Socket.isReady(data)) {
                socket.emit('ready');
            }
        };

        socket.genericSocket.on('data', emitWhenReady);
        socket.on('ready', function remove () {
            socket.genericSocket.removeListener('data', emitWhenReady);
        });
    }();


    socket.genericSocket.once('connect', function () {
        socket.connected = true;
        socket.raw(["NICK", network.nick]);
        socket.raw(["USER", network.user || "user", "8 * :" + network.realname]);
    });

    socket.genericSocket.once('close', function () {
        socket.connected = false;
    });

    // TODO: Can this be cleaned up? Some way to set `this` for callbacks?
    socket.genericSocket.on('data', function (block) {
        ircBuffer.receiveBlock(block);
    });
    socket.genericSocket.setEncoding('ascii');
    socket.genericSocket.setNoDelay();

    socket.on('message', log);

    return socket;
};

Socket.isReady = function (data) {
    // We are 'ready' when we get a 001 message.
    return data.split('\r\n')
    .filter(function (line) { return line !== ''; })
    .some(function (line) { return line.split(' ')[1] === '001'; });
};

Socket.prototype = create(events.EventEmitter.prototype, {
    connect : function () {
        if (this.isConnected()) {
            return;
        }

        this.genericSocket.connect(this.port, this.netname);
    },

    end : function () {
        if (!this.isConnected()) {
            return;
        }

        this.genericSocket.end();
    },

    raw : function (message) {
        if (!this.connected) {
            return;
        }

        if (util.isArray(message)) {
            message = message.join(" ");
        }

        if (message.indexOf('\n') !== -1) {
            throw new Error('Newline detected in message. Use multiple raws instead.');
        }

        log(message, true);
        this.genericSocket.write(message + '\n', 'ascii');
    },

    isConnected : function () {
        return this.connected;
    },

    getRealName : function () {
        return this._realname;
    }
});
