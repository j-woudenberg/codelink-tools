'use babel';

const tcp = require('net');
const udp = require('dgram');

export default {
    getConnectInstance() {
        return {
            id: null,
            client: null,
            filePath: null,
            dataString: null,
            dataObject: null,

            connectTCP(id, path) {
                this.id = id;
                this.client = new tcp.Socket();
                this.filePath = path;
                this.dataString = undefined;
                this.dataObject = undefined;

                this.client.connect({
                    port: 43855,
                    host: '192.168.1.161',
                    family: 4
                });

                this.client.setEncoding('utf8');

                this.client.on('ready', () => {
                    this.sendData(this.filePath);
                });

                this.client.on('data', data => {
                    this.receiveData(data);
                });

                this.client.on('error', error => {
                    console.error('Error with connection: ' + error);

                    this.endTCP();
                    this.client = undefined;
                    this.dataSent = undefined;
                    this.dataString = undefined;
                    this.dataObject = undefined;
                });
            },

            sendData(data) {
                this.client.write(data);
            },

            receiveData(data) {
                if (typeof data != 'string'){
                    console.log('Error with data received. Data is not of type string.');
                    console.log(data);
                    this.endTCP();

                    return;
                }

                this.dataString += data;

                console.log(this);
                if (this.dataString.endsWith('|null')){
                    this.endTCP();
                    this.dataObject = JSON.parse(this.dataString);
                }
            },

            endTCP() {
                this.client.destroy();
            }
        };
    }
};
