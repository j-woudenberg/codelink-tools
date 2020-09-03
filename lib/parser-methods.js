'use babel';

import { Point, Range } from 'atom';
import EditorMethods from './editor-methods';

export default {
    buildParserHeader(headerElem, results) {
        headerElem.innerHTML = '';

        let probElem = document.createElement('div');
        if (results && results.length){
            probElem.innerHTML = results.length + ' Problems';
        }
        else {
            probElem.innerHTML = 'Problems';
        }

        headerElem.appendChild(probElem);
    },

    buildParseResultList(listElem, results, editor) {
        listElem.innerHTML = '';

        if (!editor){
            let editor = atom.workspace.getActiveTextEditor();
            let title = editor.getTitle();

            let notLCSMsg = document.createElement('div');
            notLCSMsg.classList.add('notLCSMsg');

            let msgText = document.createElement('h4');
            msgText.innerHTML = `'${title}' is not a CodeLink file`;

            notLCSMsg.appendChild(msgText);
            listElem.appendChild(notLCSMsg);

            return;
        }

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

                let addParseMarkersResult = this.addParseMarkers(editor, result, locationDiv);

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

    createParseMarker(editor, resultMarker, result) {
        let type = result.Severity;
        let typeClass = type == 1 ? 'parseError' : type == 2 ? 'parseWarning' : 'parseInfo';

        let markerId = resultMarker.id;
        let tooltipRef = `tooltip${markerId}`;
        EditorMethods.editorHash[editor.id].tooltipHash[markerId] = result.Text;

        return editor.decorateMarker(resultMarker, {
            type: 'highlight',
            class: `parseMarker ${typeClass} ${tooltipRef}`
        });
    },

    addParseMarkers(editor, result, locDiv) {
        let tokens = result.TokenArray;
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

                    let parseMarker = this.createParseMarker(editor, resultMarker, result);
                    EditorMethods.editorHash[editor.id].parseMarkers.push(resultMarker);
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

                let parseMarker = this.createParseMarker(editor, resultMarker, result);
                EditorMethods.editorHash[editor.id].parseMarkers.push(resultMarker);

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
                let resultMarker = editor.markBufferRange(selectRange[0], {
                    invalidate: 'never'
                });

                let parseMarker = this.createParseMarker(editor, resultMarker, result);
                EditorMethods.editorHash[editor.id].parseMarkers.push(resultMarker);

                break;
            }
        };

        return {
            location: locDiv,
            range: selectRange
        };
    },

    parseMarkerListener(evt) {
        let editor = atom.workspace.getActiveTextEditor();
        let cachedEditor = EditorMethods.editorHash[editor.id];

        let xPos = evt.clientX;
        let yPos = evt.clientY;

        let markerElem = undefined;
        let targetMarker = cachedEditor.parseMarkers.find(marker => {
            let markerId = marker.id;
            markerElem = editor.component.element.getElementsByClassName(`region tooltip${markerId}`)[0];

            if (markerElem){
                let markerPos = markerElem.getBoundingClientRect();
                let markerLeft = markerPos.left;
                let markerRight = markerPos.right;
                let markerTop = markerPos.top;
                let markerBottom = markerPos.bottom;

                let inX = xPos >= markerLeft && xPos <= markerRight;
                let inY = yPos >= markerTop && yPos <= markerBottom;

                return inX && inY;
            }
            else return false;
        });

        if (!!targetMarker && !cachedEditor.parseTooltip.tooltip){
            cachedEditor.parseTooltip.tooltip = atom.tooltips.add(markerElem, {
                title: cachedEditor.tooltipHash[targetMarker.id],
                trigger: 'manual',
                placement: 'auto top'
            });

            cachedEditor.parseTooltip.marker = targetMarker;
        }
        else if (!targetMarker && cachedEditor.parseTooltip.tooltip){
            cachedEditor.parseTooltip.tooltip.dispose();
            this.resetParseMarkerTooltip(cachedEditor);
        }
        else if (!!targetMarker && cachedEditor.parseTooltip.tooltip && cachedEditor.parseTooltip.marker.id != targetMarker.id){
            cachedEditor.parseTooltip.tooltip.dispose();
            this.resetParseMarkerTooltip(cachedEditor);

            cachedEditor.parseTooltip.tooltip = atom.tooltips.add(markerElem, {
                title: cachedEditor.tooltipHash[targetMarker.id],
                trigger: 'manual',
                placement: 'auto top'
            });

            cachedEditor.parseTooltip.marker = targetMarker;
        }
    },

    resetParseMarkerTooltip(editor) {
        editor.parseTooltip = {
            marker: undefined,
            tooltip: undefined
        };
    },

    destroyParseMarkers(editor, killObserver) {
        let cachedEditor = EditorMethods.editorHash[editor.id];

        if (cachedEditor.parseTooltip.tooltip){
            cachedEditor.parseTooltip.tooltip.dispose();
            this.resetParseMarkerTooltip(cachedEditor);
        }
        cachedEditor.tooltipHash = {};

        cachedEditor.parseMarkers.forEach(marker => marker.destroy());
        cachedEditor.parseMarkers = [];
    }
};
