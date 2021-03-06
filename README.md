Simple IRC Socket - handles communication between an IRC server and consumers.

The socket is a thin wrapper around a generic socket, 

## Installation ##

```
npm install simple-irc-socket
```

## Instantiation ##

```javascript
var IrcSocket = require('simple-irc-socket');
var myConnection = IrcSocket({
    server: 'irc.yournet.net',
    nick: 'aBot',
    user: 'node',
    realname: 'Node Simple Socket'
    port: 6667
});
```
### Dependency Injection ###

A simple irc socket uses a `net.Socket` socket by default. You can pass a
seperate generic socket instead in the second parameter.

## Starting and Closing the Socket ##

```javascript
var myConnection = IrcSocket(...);
mySocket.start();
mySocket.once('ready', function () {
    mySocket.end();
}
```

## Writing to the Server ##
To send messages to the server, use socket.raw(). It accepts either a
string or an array which it will convert into a string by joining with
a space. The message '''must''' follow the 
[IRC protocol](https://irc-wiki.org/RFC 1459).

```javascript
var details = {...};
var myConnection = Ircsocket(details);

myConnection.start();
myConnection.once('ready', function () {
    // Using a string.
    myConnection.raw("JOIN #biscuits");
}

myConnection.on('message', function (message) {
    message = message.split(" ");

    // Numeric 333 is sent when a user joins a channel.
    if (message[1] === "333" &&
        message[2] === details.nick &&
        message[3] === "#biscuits")
    {
        // Using an array instead of a string.
        myConnection.raw(["PRIVMSG", "#biscuits", ":Hello world."])
    }
});

myConnection.on('message', function (message) {
    // This is sent when you do /quit too.
    if (message.slice(0, 5) === "ERROR") {
        myConnection.end();
    }
})
```

The raw method does not allow the usage of newline characters. This is
mostly a security concern, so that if the user of the Socket doesn't
validate input, an evil user can't send a command causing the bot to quit:

```
<eviluser>!say SUCKAS \nQUIT :Mua ha ha
```

## Reading from the Server ##

You do not need to handle PING messages. They are filtered from the messages
emitted by the socket.

All other messages are emitted via a 'message' event. Callbacks invoked by
this event will be passed the message as the first parameter.

Examples of reading messages are in the previous example. Messages generally
look like the following:

```
:irc.uk.mibbit.net 376 Havvy :End of /MOTD command.
:NyanCat!Mibbit@mib-FFFFFFFF.redacted.com QUIT :Quit: http://www.mibbit.com ajax IRC Client
ERROR :Closing Link: Havvy[127-00-00-00.redacted.com] (Quit: I got the messages I want.)
```

## Utility Methods ##

### isConnected() ###

This method will return true when the socket is started, but not ended. It
will otherwise return false.

### getRealname() ###

This method returns the realname (also called gecos) of the connection.

## Events ##

The basic-irc-socket is an event emitter. It emits two events.

+ ready(): Once the first 001 message has been acknowledged.

+ message(msg: String): Every message (including the 001) from the
sender (inclusive) the the newline (exclusive).

## Testing ##

Install jasmine-node globally, and then test via npm.

```
npm install -g jasmine-node
npm test
```
