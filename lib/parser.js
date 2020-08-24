'use babel';

import { CompositeDisposable } from 'atom';
import Uris from './uris';
import Connect from './connect';
import EditorMethods from './editor-methods';
import ParserMethods from './parser-methods';
import RequestMethods from './request-methods';

export default class Parser {

    constructor(serializedState) {
        // Create root element
        this.element = document.createElement('div');
        this.element.classList.add('parser');

        let parseResultList = document.createElement('div');
        parseResultList.classList.add('parseResultList');
        this.element.appendChild(parseResultList);

        this.subscriptions = new CompositeDisposable();

        // get updated parse results
        this.subscriptions.add(atom.workspace.observeActiveTextEditor(editor => {
            if (!editor) return;

            let cachedEditor = EditorMethods.editorHash[editor.id];
            const editorSubs = new CompositeDisposable();

            if (cachedEditor){
                ParserMethods.buildParseResultList(parseResultList, cachedEditor.parseResults, cachedEditor.editor);
            }
            else if (EditorMethods.isCodelinkFile(editor)){
                EditorMethods.initializeCodelinkFile(editor);
                cachedEditor = EditorMethods.editorHash[editor.id];

                RequestMethods.sendParseRequest(editor).then(
                    success => {
                        ParserMethods.addParseResults(success, editor);
                        ParserMethods.buildParseResultList(parseResultList, cachedEditor.parseResults, cachedEditor.editor);
                    }, error => {
                        console.error(error);
                    }
                );

                editorSubs.add(editor.onDidStopChanging(() => {
                    RequestMethods.sendParseRequest(editor).then(
                        success => {
                            ParserMethods.destroyParseMarkers(editor);
                            ParserMethods.addParseResults(success, editor);
                            ParserMethods.buildParseResultList(parseResultList, cachedEditor.parseResults, cachedEditor.editor);
                        }, error => {
                            console.log(error);
                        }
                    );
                }));

                editorSubs.add(editor.onDidDestroy(() => {
                    EditorMethods.destroyCodelinkFile(editor);
                    editorSubs.dispose();
                    this.subscriptions.remove(editorSubs);
                }));

                this.subscriptions.add(editorSubs);
            }
            else {
                ParserMethods.buildParseResultList(parseResultList);
            }
        }));
    }

    // Returns an object that can be retrieved when package is activated
    serialize() {
        return {
            deserializer: 'codelink-tools/Parser'
        };
    }

    // Tear down any state and detach
    destroy() {
        atom.workspace.getTextEditors().forEach(editor => {
            if (EditorMethods.editorHash[editor.id]){
                ParserMethods.destroyParseMarkers(editor);
                delete EditorMethods.editorHash[editor.id];
            }
        });

        this.element.remove();
        this.subscriptions.dispose();
    }

    getElement() {
        return this.element;
    }

    getTitle() {
        return 'CodeLink Parser';
    }

    getURI() {
        return Uris.parserUri;
    }

    getDefaultLocation() {
        return 'bottom';
    }

    getAllowedLocations() {
        return ['bottom', 'right'];
    }

}
