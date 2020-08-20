'use babel';

import { CompositeDisposable } from 'atom';
import Uris from './uris';
import Connect from './connect';
import EditorMethods from './editor-methods';

export default class CodelinkToolsView {

    constructor(serializedState) {
        // Create root element
        this.element = document.createElement('div');
        this.element.classList.add('codelink-tools');

        const parseResultList = document.createElement('div');
        parseResultList.classList.add('parseResultList');
        this.element.appendChild(parseResultList);

        this.subscriptions = new CompositeDisposable();

        // get updated parse results
        this.subscriptions.add(atom.workspace.observeActiveTextEditor(editor => {
            if (!editor) return;

            if (EditorMethods.editorHash[editor.id]){
                const editorSubs = new CompositeDisposable();

                editorSubs.add(editor.onDidStopChanging(() => {
                    setTimeout(() => {
                        parseResultList.innerHTML = '';

                        console.log(EditorMethods.editorHash[editor.id].parseResults);
                        EditorMethods.editorHash[editor.id].parseResults.forEach(result => {
                            let resultDiv = document.createElement('div');
                            resultDiv.classList.add('parseResult');

                            let iconDiv = document.createElement('span');
                            let iconClass = 'icon-' + (result.Severity == 1 ? 'stop' : result.Severity == 2 ? 'alert' : 'info');
                            iconDiv.classList.add('icon');
                            iconDiv.classList.add(iconClass);
                            resultDiv.appendChild(iconDiv);

                            let textDiv = document.createElement('div');
                            textDiv.classList.add('resultText');
                            textDiv.innerHTML = result.Text;
                            resultDiv.appendChild(textDiv);

                            let locationDiv = document.createElement('div');
                            locationDiv.classList.add('resultLocation');

                            if (result.TokenArray){
                                let fileName = editor.getTitle();
                                let lineNum = result.TokenArray[0].LineNumber;
                                let colNum = result.TokenArray[0].ColumnNumber;
                                locationDiv.innerHTML = `${fileName}-${lineNum}:${colNum}`;
                                resultDiv.appendChild(locationDiv);
                            }

                            parseResultList.appendChild(resultDiv);
                        });
                    }, 200);
                }));

                editorSubs.add(editor.onDidDestroy(() => {
                    editorSubs.dispose();
                    this.subscriptions.remove(editorSubs);
                }));

                this.subscriptions.add(editorSubs);
            }
        }));
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
