'use babel';

export default {
    editorHash: {},

    initializeCodelinkFile(editor) {
        if (!editor) return;

        if (!this.editorHash[editor.id]){
            this.editorHash[editor.id] = {
                editor: editor,
                disposables: {}
            };
        }
    },

    getExtension(editor) {
        let titleArr = editor.getTitle().split('.');
        return titleArr[titleArr.length - 1];
    },

    isCodelinkFile(editor) {
        return this.getExtension(editor) == 'lcs';
    },

    onCodelinkTextAdd(editor, func) {
        if (this.isCodelinkFile(editor)){
            editor.onDidInsertText(evt => {
                if (func){
                    func(evt);
                }
            });
        }
        else {
            console.log(editor);
        }
    }
};
