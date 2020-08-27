'use babel';

import ParserMethods from './parser-methods';
import Connect from './connect';

export default {
    editorHash: {},

    initializeCodelinkFile(editor) {
        if (!editor) return;

        if (!this.editorHash[editor.id]){
            this.editorHash[editor.id] = {
                editor: editor,
                parseResults: [],
                parseMarkers: [],
                parseTooltip: undefined,
                tooltipHash: {}
            };
            ParserMethods.resetParseMarkerTooltip(this.editorHash[editor.id]);

            editor.component.element.onmousemove = (evt) => {
                ParserMethods.parseMarkerListener(evt);
            };
        }
    },

    destroyCodelinkFile(editor) {
        if (!editor) return;

        if (this.editorHash[editor.id]){
            ParserMethods.destroyParseMarkers(editor, true);
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
    }
};
