var socketServerUrl = 'https://myfriendhasaprinter.herokuapp.com';
var PRINTER_NAME = 'Nick_Canon';

var socket = require('socket.io-client')(socketServerUrl);

socket.on('connect', function() {
    console.log('MYFRIENDHASAPRINTER Server Connected.');
});

socket.on('disconnect', function() {
    console.log('MYFRIENDHASAPRINTER Server Disconnected. Might be restarting.');
});

socket.on('request-print-job', function(data) {
    console.log('Print job requested', data);
    exec('lp -d ' + PRINTER_NAME + ' ' + FILE_PATH);
});