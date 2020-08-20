'use babel';

import CodelinkToolsView from './codelink-tools-view';
import { CompositeDisposable, Disposable } from 'atom';
import Uris from './uris';
import EditorMethods from './editor-methods';
import Connect from './connect';
import RequestMethods from './request-methods';

const path = require('path');
const { execFile, exec } = require('child_process');

let exeProcess;

export default {
    subscriptions: null,

    activate(state) {
        // start CodeLink_ServiceCmd.exe
        let exeFile = 'CodeLink_ServiceCmd.exe';
        let exePath = path.win32.resolve(`${__dirname}\\dlls\\${exeFile}`);
        execFile(exePath);
        let exeRunning = false;
        let runningCheck = false;

        let isExeRunning = () => {
            exec('tasklist', (err, stdout, stderr) => {
                exeRunning = stdout.toLowerCase().indexOf(exeFile.toLowerCase()) > -1;

                if (!exeRunning){
                    if (!runningCheck){
                        exeProcess = execFile(exePath);
                        runningCheck = true;
                    }

                    setTimeout(isExeRunning, 500);
                }
                else {
                    // setup UDP connection to collect TCP connection credentials
                    let initUDPInst = Connect.getUDPInstance();
                    let udpData = RequestMethods.getUDPRequestObject();

                    initUDPInst.connectUDP(udpData, () => {
                        initUDPInst.client.close();
                        initUDPInst = undefined;

                        atom.workspace.open(Uris.toolsUri);
                    });
                }
            });
        };
        isExeRunning();

        // add init subscription items to package
        this.subscriptions = new CompositeDisposable(
            // add view opener
            atom.workspace.addOpener(uri => {
                if (uri === Uris.toolsUri){
                    return new CodelinkToolsView();
                }
            }),

            // register command to toggle view
            atom.commands.add('atom-workspace', {
                'codelink-tools:toggle': () => this.toggle()
            }),

            // watch for keyup to handle codelink parsing
            atom.workspace.observeTextEditors(editor => {
                if (EditorMethods.isCodelinkFile(editor)){
                    EditorMethods.initializeCodelinkFile(editor);
                }

                editor.onDidChangeTitle(() => {
                    if (EditorMethods.isCodelinkFile(editor)) EditorMethods.initializeCodelinkFile(editor);
                    else EditorMethods.destroyCodelinkFile(editor);
                });
            }),

            // destroy any CodelinkToolsViews when the package is deactivated
            new Disposable(() => {
                atom.workspace.getPaneItems().forEach(item => {
                    if (item instanceof CodelinkToolsView){
                        item.destroy();
                    }
                });
            })
        );
    },

    deactivate() {
        this.subscriptions.dispose();

        console.log('Trying to kill child process on deactivate');
        console.log(exeProcess);
        console.log('I hope this works...');
        exeProcess.kill('SIGINT');
    },

    toggle() {
        atom.workspace.toggle(Uris.toolsUri);
    },

    deserializeCodelinkToolsView(serialized) {
        return new CodelinkToolsView();
    }

};
