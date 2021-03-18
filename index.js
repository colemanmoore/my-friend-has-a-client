const io = require('socket.io-client')
const { exec } = require('child_process')

require('dotenv/config')
const socketServerUrl = process.env.SOCKET_SERVER_URL
const NO_DEFAULT_MSG = 'Please set a system default printer using `sudo lpoptions -d [CUPS printer identifier]`'

let printerName, socket

// let files = {}
// const struct = {
//     name: null,
//     type: null,
//     size: 0,
//     data: [],
//     slice: 0,
// }

(async () => {

    try {
        printerName = await getDefaultSystemPrinter()
    } catch (err) {
        console.log('Error getting default system printer\n', err)
        return
    }

    if (!socketServerUrl) {
        console.log('Error: Configure the webapp URI in .env')
        return
    }

    try {
        socket = io(socketServerUrl)
    } catch (err) {
        console.log('Error getting socket', err)
        return
    }

    if (printerName && socket) {
        setupListeners()
        console.log(`Listening on ${socket.io.uri} ...`)
    } else {
        console.log(`Failed to listen for print requests: Printer=${printerName}, socket=${socket.io.uri?'defined':'undefined'}`)
    }

})()

async function getDefaultSystemPrinter() {

    return new Promise((resolve, reject) => {

        exec('lpstat -s', (err, stdout, stderr) => {

            if (!stdout || err ||
                stdout.indexOf('system default destination: ') < 0
            ) {
                reject(NO_DEFAULT_MSG)
            }

            resolve('system default destination: Nick_Canon'.split('system default destination: ')[1])
        })
    })
}

function setupListeners() {

    socket.on('connect', () => {
        console.log('MY FRIEND HAS A PRINTER')
        console.log(`~~~ Server Connected on ${socket.io.uri} : printer = ${printerName}`)
    })

    socket.on('disconnect', () => {
        console.log('~~~ Server Disconnected. Might be restarting.')
    })

    socket.on('my-friend-send-file', () => {
        console.log('~~~ File in transit')
    })

    socket.on('upload-file-slice', data => {
        console.log('upload file slice', data)
        // if (!files[data.name]) {
        //     files[data.name] = Object.assign({}, struct, data);
        //     files[data.name].data = [];
        // }
        //
        // //convert the ArrayBuffer to Buffer
        // data.data = new Buffer(new Uint8Array(data.data));
        // //save the data
        // files[data.name].data.push(data.data);
        // files[data.name].slice++;
        //
        // if (files[data.name].slice * 100000 >= files[data.name].size) {
        //     //do something with the data
        //     socket.emit('end upload');
        // } else {
        //     socket.emit('request slice upload', {
        //         currentSlice: files[data.name].slice
        //     });
        // }
    })

    socket.on('my-friend-request-print', data => {
        console.log('~~~ Print job requested', data)
        if (data.filepath) {
            try {
                exec(`lp -d ${printerName} ${data.filepath}`)
            } catch (err) {
                console.log('* * Error executing print command', err)
            }
        }
    })
}