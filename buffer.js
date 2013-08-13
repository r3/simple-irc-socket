var events = require('events');

var Buffer = module.exports = function (separationToken) {
    this.sepToken = separationToken;
    return this
}

Buffer.prototype = Object.create(events.EventEmitter.prototype, {
    partialMessage: {
        writable: true,
        configurable: true
    },

    receiveBlock: {
        enumerable: true,
        value: function (block) {
            var that = this;
            var messages = block.split(this.sepToken)
                .filter(function (line) { return line !== ''; })
                .filter(function (line) {
                    if (line.slice(0, 4) === 'PING') {
                        var msg = ['PONG', line.slice(line.indexOf(':'))];
                        that.emit('ping', msg)
                        return false;
                    }

                    return true;
                })

            if (this.partialMessage) {
                messages[0] = this.partialMessage + messages[0];
                this.partialMessage = null;
            }

            if (!block.match(this.sepToken + '$')) {
                this.partialMessage = messages.pop();
            }

            messages.forEach(function (msg) {
                that.emit('message', msg);
            });
        }
    }
})

// TEST!
//var x = new Buffer('y');
//x.on('messages', console.log);
//x.receiveBlock('testingythisythingyout');
//console.assert(x.partialMessage === 'out');
//console.log("IT WORKS!");
