'use babel';

import CodelinkToolsView from './codelink-tools-view';
import { CompositeDisposable, Disposable } from 'atom';
import Uris from './uris';

export default {

    subscriptions: null,

    activate(state) {
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
