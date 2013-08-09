var IrcSocket = require('./simple-irc-socket');
var myConnection = IrcSocket({
    server: 'irc.mibbit.net',
    nick: 'r3_testing_socket',
    user: 'node',
    realname: 'r3',
    port: 6667
});

myConnection.once('ready', function () {
    myConnection.raw("JOIN #havvy");
});

myConnection.connect();
