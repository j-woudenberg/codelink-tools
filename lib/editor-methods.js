'use babel';

import RequestMethods from './request-methods';
import Connect from './connect';

export default {
    editorHash: {},

    initializeCodelinkFile(editor) {
        if (!editor) return;

        if (!this.editorHash[editor.id]){
            this.editorHash[editor.id] = {
                editor: editor,
                disposables: {},
                parseResults: []
            };

            this.addCodelinkTextHandler(editor);
        }
    },

    destroyCodelinkFile(editor) {
        if (!editor) return;

        if (this.editorHash[editor.id]){
            removeCodelinkTextHandler(editor);
            delete this.editorHash[editor.id];
        }
    },

    getExtension(editor) {
        if (!editor) return;

        let titleArr = editor.getTitle().split('.');
        return titleArr[titleArr.length - 1];
    },

    isCodelinkFile(editor) {
        if (!editor) return;

        return this.getExtension(editor) == 'lcs';
    },

    addCodelinkTextHandler(editor) {
        if (!editor) return;

        let callback = (data) => {
            this.editorHash[editor.id].parseResults = data.resultList.slice();
        };

        let insertTextHandler = editor.onDidStopChanging(evt => {
            RequestMethods.sendParseRequest(editor, evt, callback);
        });

        this.editorHash[editor.id].disposables['insertTextHandler'] = insertTextHandler;
    },

    removeCodelinkTextHandler(editor) {
        if (!editor) return;

        if (this.editorHash[editor.id]){
            if (this.editorHash[editor.id].disposables['insertTextHandler']){
                this.editorHash[editor.id].disposables['insertTextHandler'].dispose();
            }
        }
    }
};
