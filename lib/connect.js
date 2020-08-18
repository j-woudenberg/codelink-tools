'use babel';

const tcp = require('net');
const udp = require('dgram');

export default {
    tcpPort: null,
    tcpIP: null,
    udpPort: 9999,
    udpIP: '127.0.0.1',

    getTCPInstance() {
        return {
            client: null,
            sendDataObject: null,
            sendDataString: null,
            recDataObject: null,
            recDataString: null,
            parentObj: this,

            connectTCP(ip, port, data, callback) {
                this.client = new tcp.Socket();
                this.sendDataObject = data;
                this.sendDataString = JSON.stringify(data);
                this.recDataObject = undefined;
                this.recDataString = undefined;

                this.client.setEncoding('utf8');

                this.client.connect({
                    port: port,
                    host: ip,
                    family: 4
                });

                this.client.on('ready', () => {
                    this.sendData(this.sendDataString);
                });

                this.client.on('data', data => {
                    this.receiveData(data);
                });

                this.client.on('error', error => {
                    console.error('Error with connection: ' + error);

                    this.endTCP();
                    this.client = undefined;
                    this.sendDataObject = undefined;
                    this.sendDataString = undefined;
                    this.recDataObject = undefined;
                    this.recDataString = undefined;
                });

                this.client.on('end', () => {
                    console.log('Received');

                    this.recDataObject = JSON.parse(this.recDataString);

                    if (callback){
                        callback(this.recDataObject);
                    }

                    this.endTCP();
                });
            },

            sendData(data) {
                console.log('Sent');
                console.log(this.sendDataObject);

                this.client.write(data, 'utf8');
            },

            receiveData(data) {
                if (typeof data != 'string'){
                    console.log('Error with data received. Data is not of type string.');
                    console.log(data);
                    this.endTCP();

                    return;
                }

                if (this.recDataString === undefined){
                    this.recDataString = data;
                }
                else {
                    this.recDataString += data;
                }
            },

            endTCP() {
                console.log('TCP connection destroyed');

                this.client.destroy();
            }
        };
    },

    getUDPInstance() {
        return {
            client: null,
            address: null,
            sendData: null,
            sendDataObj: null,
            recData: null,
            recDataObj: null,
            parentObj: this,

            connectUDP(data, callback) {
                let createClient = (instance) => {
                    instance.client = new udp.createSocket({
                        type: 'udp4',
                        reuseAddr: true
                    });
                    instance.recData = undefined;
                    instance.recDataObj = undefined;
                    instance.sendDataObj = data;
                    instance.sendData = JSON.stringify(data);

                    instance.client.on('listening', () => {
                        let address = instance.client.address();
                        instance.address = address;

                        instance.client.setBroadcast(true);

                        instance.client.send(instance.sendData, address.port, address.address);
                    });

                    instance.client.on('message', (msg, info) => {
                        this.recData = msg.toString('utf8');
                        this.recDataObj = JSON.parse(this.recData);

                        if (this.recDataObj.requestType && this.recDataObj.requestType == 'udpResponse'){
                            let connectionArr = this.recDataObj.connection.split(':');
                            this.parentObj.tcpIP = connectionArr[0];
                            this.parentObj.tcpPort = parseInt(connectionArr[1]);
                        }

                        if (callback){
                            callback();
                        }
                    });

                    instance.client.on('error', err => {
                        console.log('Error: ' + err);
                        instance.client.close();

                        if (err.code == 'EADDRINUSE' || err.code == 'EACCES'){
                            createClient(instance);

                            this.parentObj.udpPort++;
                            instance.client.bind(this.parentObj.udpPort, this.parentObj.udpIP);
                        }
                    });
                };

                createClient(this);
                this.client.bind(this.parentObj.udpPort, this.parentObj.udpIP);
            }
        };
    }
};
