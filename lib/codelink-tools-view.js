'use babel';

import Uris from './uris';
import Connect from './connect';

export default class CodelinkToolsView {

    constructor(serializedState) {
        // Create root element
        this.element = document.createElement('div');
        this.element.classList.add('codelink-tools');

        const connectBtn = document.createElement('button');
        connectBtn.onclick = () => {
            let editor = atom.workspace.getActiveTextEditor();
            let fileContents = editor.getText();
            let fileName = editor.getFileName();

            let tcpData = {
                requestType: 'parseRequest',
                requestDate: new Date().toISOString(),
                sourceContent: fileContents,
                sourceID: fileName,
                parseLanguage: 1,
                objectFilePath: undefined
            };

            let udpData = {
                requestType: 'udpRequest',
                requestDate: new Date().toISOString()
            };

            let tcpInstance = Connect.getTCPInstance();

            let udpInstance = Connect.getUDPInstance();
            udpInstance.connectUDP(udpData, () => {
                tcpInstance.connectTCP(Connect.tcpIP, Connect.tcpPort, tcpData);
            });

            // let tcpInstance = Connect.getTCPInstance();
            // tcpInstance.connectTCP(tcpData);
        };
        this.element.appendChild(connectBtn);

        this.subscriptions = atom.workspace.getCenter().observeActivePaneItem(item => {
            if (!atom.workspace.isTextEditor(item)){
                connectBtn.innerHTML = 'Parse';
                connectBtn.disabled = true;

                return;
            }

            connectBtn.innerHTML = `Parse ${item.getFileName()}`;
            connectBtn.disabled = false;
        });
    }

    // Returns an object that can be retrieved when package is activated
    serialize() {
        return {
            deserializer: 'codelink-tools/CodelinkToolsView'
        };
    }

    // Tear down any state and detach
    destroy() {
        this.element.remove();
        this.subscriptions.dispose();
    }

    getElement() {
        return this.element;
    }

    getTitle() {
        return 'Codelink Tools';
    }

    getURI() {
        return Uris.toolsUri;
    }

    getDefaultLocation() {
        return 'bottom';
    }

    getAllowedLocations() {
        return ['bottom', 'right'];
    }

}
