'use babel';

import Connect from './connect';

export default {
    getUDPRequestObject() {
        return {
            requestType: 'udpRequest',
            requestDate: new Date().toISOString()
        };
    },

    getParseRequestObject(editor) {
        editor = editor ? editor : atom.workspace.getActiveTextEditor();
        let fileContents = editor.getText();
        let fileName = editor.getFileName();

        return {
            requestType: 'parseRequest',
            requestDate: new Date().toISOString(),
            sourceContent: fileContents,
            sourceID: fileName,
            parseLanguage: 1,
            objectFilePath: undefined
        };
    },

    sendParseRequest(editor) {
        return new Promise((resolve, reject) => {
            let parseObj = this.getParseRequestObject(editor);

            let tcpInstance = Connect.getTCPInstance();
            tcpInstance.connectTCP(Connect.tcpIP, Connect.tcpPort, parseObj).then(
                success => resolve(success),
                error => reject(error)
            );
        });
    }
};
