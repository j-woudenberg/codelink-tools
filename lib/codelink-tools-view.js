'use babel';

import Uris from './uris';
import Connect from './connect';

let connectId = 1;

export default class CodelinkToolsView {

    constructor(serializedState) {
        // Create root element
        this.element = document.createElement('div');
        this.element.classList.add('codelink-tools');

        const connectBtn = document.createElement('button');
        connectBtn.onclick = () => {
            // connectBtn.disabled = true;

            let filePath = atom.workspace.getActiveTextEditor().getPath();

            let connection = Connect.getConnectInstance();
            connection.connectTCP(connectId, filePath);
            connectId++;

            // connectBtn.disabled = false;
        };
        this.element.appendChild(connectBtn);

        this.subscriptions = atom.workspace.getCenter().observeActivePaneItem(item => {
            if (!atom.workspace.isTextEditor(item)){
                connectBtn.innerHTML = 'Connect';
                connectBtn.disabled = true;

                return;
            }

            connectBtn.innerHTML = `Connect ${item.getFileName()}`;
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
