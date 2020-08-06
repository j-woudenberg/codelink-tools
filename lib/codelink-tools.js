'use babel';

import CodelinkToolsView from './codelink-tools-view';
import { CompositeDisposable } from 'atom';

export default {

  codelinkToolsView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.codelinkToolsView = new CodelinkToolsView(state.codelinkToolsViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.codelinkToolsView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'codelink-tools:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.codelinkToolsView.destroy();
  },

  serialize() {
    return {
      codelinkToolsViewState: this.codelinkToolsView.serialize()
    };
  },

  toggle() {
    console.log('CodelinkTools was toggled!');
    return (
      this.modalPanel.isVisible() ?
      this.modalPanel.hide() :
      this.modalPanel.show()
    );
  }

};
