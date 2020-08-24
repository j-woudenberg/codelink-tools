'use babel';

import { Point, Range } from 'atom';
import EditorMethods from './editor-methods';

export default {
    buildParseResultList(listElem, results, editor) {
        listElem.innerHTML = '';

        if (!Array.isArray(results)) results = [];

        results.forEach(result => {
            // add parse result to list
            let resultDiv = document.createElement('div');
            resultDiv.classList.add('parseResult');

            // icon
            let iconDiv = document.createElement('span');
            let iconClass = 'icon-' + (result.Severity == 1 ? 'stop' : result.Severity == 2 ? 'alert' : 'info');
            iconDiv.classList.add('icon');
            iconDiv.classList.add(iconClass);
            resultDiv.appendChild(iconDiv);

            // text
            let textDiv = document.createElement('div');
            textDiv.classList.add('resultText');
            textDiv.innerHTML = result.Text;
            resultDiv.appendChild(textDiv);

            if (result.TokenArray && result.TokenArray.length){
                // location
                let locationDiv = document.createElement('div');
                locationDiv.classList.add('resultLocation');

                let addParseMarkersResult = this.addParseMarkers(editor, result.TokenArray, locationDiv, result.Severity);

                resultDiv.appendChild(addParseMarkersResult.location);

                resultDiv.onclick = () => {
                    let startPoint = addParseMarkersResult.range[0].start;
                    editor.setCursorBufferPosition(startPoint);

                    editor.setSelectedBufferRanges(addParseMarkersResult.range);
                };
            }

            listElem.appendChild(resultDiv);
        });
    },

    addParseResults(data, editor) {
        EditorMethods.editorHash[editor.id].parseResults = data.resultList.slice();
    },

    createParseMarker(editor, resultMarker, type) {
        let typeClass = type == 1 ? 'parseError' : type == 2 ? 'parseWarning' : 'parseInfo';

        return editor.decorateMarker(resultMarker, {
            type: 'highlight',
            class: `parseMarker ${typeClass}`
        });
    },

    addParseMarkers(editor, tokens, locDiv, type) {
        let fileName = editor.getTitle();
        let selectRange = [];

        let numTokens = tokens.length;
        switch (numTokens){
            case (numTokens > 2 ? numTokens : null): {
                let locHTML = `${fileName}`;

                tokens.forEach((token, idx) => {
                    let lineNum = token.LineNumber;
                    let colNum = token.ColumnNumber;

                    locHTML += `(${lineNum}:${colNum})`;

                    let startPoint = new Point(lineNum - 1, colNum - 1);
                    let endPoint = new Point(lineNum - 1, colNum - 1 + token.Text.length);
                    selectRange.push(new Range(startPoint, endPoint));
                    let resultMarker = editor.markBufferRange(selectRange[idx]);

                    let parseMarker = this.createParseMarker(editor, resultMarker, type);
                    EditorMethods.editorHash[editor.id].parseMarkers.push(parseMarker);
                });

                locDiv.innerHTML = locHTML;

                break;
            }
            case 2: {
                let startToken = tokens[0];
                let startLineNum = startToken.LineNumber;
                let startColNum = startToken.ColumnNumber;

                let endToken = tokens[1];
                let endLineNum = endToken.LineNumber;
                let endColNum = endToken.ColumnNumber;

                locDiv.innerHTML = `${fileName}(${startLineNum}:${startColNum}-${endLineNum}:${endColNum})`;

                let startPoint = new Point(startLineNum - 1, startColNum - 1);
                let endPoint = new Point(endLineNum - 1, endColNum - 1 + endToken.Text.length);
                selectRange.push(new Range(startPoint, endPoint));
                let resultMarker = editor.markBufferRange(selectRange[0]);

                let parseMarker = this.createParseMarker(editor, resultMarker, type);
                EditorMethods.editorHash[editor.id].parseMarkers.push(parseMarker);

                break;
            }
            default: {
                let token = tokens[0];
                let lineNum = token.LineNumber;
                let colNum = token.ColumnNumber;

                locDiv.innerHTML = `${fileName}(${lineNum}:${colNum})`;

                let startPoint = new Point(lineNum - 1, colNum - 1);
                let endPoint = new Point(lineNum - 1, colNum - 1 + token.Text.length);
                selectRange.push(new Range(startPoint, endPoint));
                let resultMarker = editor.markBufferRange(selectRange[0]);

                let parseMarker = this.createParseMarker(editor, resultMarker, type);
                EditorMethods.editorHash[editor.id].parseMarkers.push(parseMarker);

                break;
            }
        };

        return {
            location: locDiv,
            range: selectRange
        };
    },

    destroyParseMarkers(editor) {
        EditorMethods.editorHash[editor.id].parseMarkers.forEach(marker => marker.destroy());
        EditorMethods.editorHash[editor.id].parseMarkers = [];
    }
};
