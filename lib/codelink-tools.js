'use babel';

import Parser from './parser';
import { CompositeDisposable, Disposable } from 'atom';
import Uris from './uris';
import EditorMethods from './editor-methods';
import Connect from './connect';
import RequestMethods from './request-methods';

const path = require('path');
const { execFile, exec } = require('child_process');

let exeProcess;
let exeRunning = false;

export default {
    subscriptions: null,

    config: {
        'exePath': {
            'title': 'CodeLink Service Path',
            'description': 'The path of the CodeLink service .exe file',
            'type': 'string',
            'default': path.win32.resolve(`${__dirname}\\dlls\\CodeLink_ServiceCmd.exe`)
        }
    },

    activate(state) {
        // start CodeLink_ServiceCmd.exe
        this.startCodelinkProcess();

        // add init subscription items to package
        this.subscriptions = new CompositeDisposable(
            // add view opener
            atom.workspace.addOpener(uri => {
                if (uri === Uris.parserUri){
                    return new Parser();
                }
            }),

            // register command to toggle view
            atom.commands.add('atom-workspace', {
                'codelink-tools:toggleParser': () => this.toggleParser()
            }),

            // watch for changes to config
            // atom.config.onDidChange('codelink-tools.exePath', (evt) => {
            //     if (evt.newValue.endsWith('.exe')){
            //         initializeService();
            //     }
            // }),

            // kill codelink child process if on settings tab
            atom.workspace.onDidChangeActivePaneItem(item => {
                if (!item || !item.element) return;

                let isSettings = item.element.className.includes('settings-view');
                let txtEditor = atom.workspace.isTextEditor(item) ? item : undefined;
                let isCodelinkFile = EditorMethods.isCodelinkFile(txtEditor);

                if (isSettings) this.killCodelinkProcess();
                else if (!exeRunning && isCodelinkFile) this.startCodelinkProcess();
            }),

            // destroy any Parsers when the package is deactivated
            new Disposable(() => {
                atom.workspace.getPaneItems().forEach(item => {
                    if (item instanceof Parser){
                        item.destroy();
                    }
                });

                atom.workspace.getTextEditors().forEach(editor => {
                    if (EditorMethods.isCodelinkFile(editor)){
                        EditorMethods.destroyCodelinkFile(editor);
                    }
                });
            })
        );
    },

    deactivate() {
        this.subscriptions.dispose();

        // kill codelink background process
        return killCodelinkProcess();
    },

    toggleParser() {
        atom.workspace.toggle(Uris.parserUri);
    },

    startCodelinkProcess() {
        let exePath = atom.config.get('codelink-tools.exePath').replace('/', '\\');
        let exePathArr = exePath.split('\\');
        let exeFile = exePathArr[exePathArr.length - 1];

        exeRunning = false;
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

                    initUDPInst.connectUDP(udpData).then(
                        success => {
                            initUDPInst.client.close();
                            initUDPInst = undefined;

                            atom.workspace.open(Uris.parserUri);
                        }, error => {
                            console.error(error);
                        }
                    );
                }
            });
        };
        isExeRunning();
    },

    killCodelinkProcess() {
        async function killCodelink() {
            let killed = await exeProcess.kill();

            if (!killed){
                killCodelink();
            }
            else {
                exeRunning = false;
                return killed;
            }
        };

        return killCodelink();
    },

    deserializeParser(serialized) {
        // return new Parser();
    }

};
