'use babel';

import CodelinkToolsView from './codelink-tools-view';
import { CompositeDisposable, Disposable } from 'atom';
import Uris from './uris';
import EditorMethods from './editor-methods';

export default {

    subscriptions: null,

    activate(state) {
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
            // atom.workspace.observeTextEditors(editor => {
            //     EditorMethods.initializeCodelinkFile(editor);
            //
            //     let consoleLog = evt => {
            //         console.log(evt.text);
            //     };
            //     EditorMethods.onCodelinkTextAdd(editor, consoleLog);
            //
            //     editor.onDidChangeTitle(() => {
            //         EditorMethods.onCodelinkTextAdd(editor, consoleLog);
            //     });
            // }),

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
    },

    toggle() {
        atom.workspace.toggle(Uris.toolsUri);
    },

    deserializeCodelinkToolsView(serialized) {
        return new CodelinkToolsView();
    }

};
