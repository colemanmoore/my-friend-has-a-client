const socketClient = require('socket.io-client')
const { exec } = require('child_process')

require('dotenv/config')
const socketServerUrl = process.env.SOCKET_SERVER_URL
const NO_DEFAULT_MSG = 'Please set a system default printer using `sudo lpoptions -d [CUPS printer identifier]`'

let printerName = process.env.PRINTER_NAME, socket

(async () => {

    try {
        printerName = await getDefaultSystemPrinter()
    } catch (err) {
        console.log('Error getting default system printer\n', err)
        return
    }

    try {
        socket = socketClient(socketServerUrl)
    } catch (err) {
        console.log('Error getting socket', err)
        return
    }

    if (printerName && socket) {
        setupListeners()
        console.log('Done setting up listeners')
    } else {
        console.log('printerName', printerName, 'socket', socket)
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
    console.log('setting up listeners...')

    socket.on('connect', () => {
        console.log(`MYFRIENDHASAPRINTER Server Connected on ${socket.url} : printer = ${printerName}`)
    })

    socket.on('disconnect', () => {
        console.log('MYFRIENDHASAPRINTER Server Disconnected. Might be restarting.')
    })

    socket.on('my-friend-send-file', () => {
        console.log('MYFRIENDHASAPRINTER File in transit')
    })

    socket.on('my-friend-request-print', function(data) {
        console.log('MYFRIENDHASAPRINTER Print job requested', data)
        if (data.filepath) {
            try {
                exec(`lp -d ${printerName} ${data.filepath}`)
            } catch (err) {
                console.log('Error executing print command', err)
            }
        }
    })
}