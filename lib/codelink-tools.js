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

export default {
    subscriptions: null,
    // initialized: false,

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
        let initializeService = () => {
            let exePath = atom.config.get('codelink-tools.exePath').replace('/', '\\');
            let exePathArr = exePath.split('\\');
            let exeFile = exePathArr[exePathArr.length - 1];

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
        };
        initializeService();

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

            // // check when panes are added
            // atom.workspace.onDidOpen(evt => {
            //     if (evt.uri == Uris.parserUri){
            //         if (this.initialized){
            //             let curEditor = atom.workspace.getActiveTextEditor();
            //
            //             let cachedEditor = EditorMethods.editorHash[curEditor.id];
            //             if (cachedEditor){
            //                 let listDiv = Parser.getElement().firstChild;
            //
            //                 ParserMethods.buildParseResultList(listDiv, cachedEditor.parseResults, cachedEditor.editor);
            //             }
            //         }
            //         else {
            //             this.initialized = true;
            //         }
            //     }
            // }),

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

        // console.log('Trying to kill child process on deactivate');
        // console.log(exeProcess);
        // console.log('I hope this works...');
        // exeProcess.kill('SIGINT');
    },

    toggleParser() {
        atom.workspace.toggle(Uris.parserUri);
    },

    deserializeParser(serialized) {
        // return new Parser();
    }

};
