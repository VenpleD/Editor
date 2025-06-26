import { Plugin, EditorState, PluginView } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import GlobalStyle from './Global.ts';
import NativeBridge from './NativeBridge.ts';

// 提取获取 marks 信息的方法
export function getFontInfoMap(state: EditorState): Record<string, boolean> {
    const { $from, empty, $anchor } = state.selection;
    let marks;
    if (!empty) {
        marks = state.storedMarks || $anchor.marks();
    } else {
        marks = $from.marks();
    }
    let isBold = marks.some(mark => mark.type.name === 'strong');
    let isItalic = marks.some(mark => mark.type.name === 'em');
    let isUnderline = marks.some(mark => mark.type.name === 'underline');
    let isStrike = marks.some(mark =>
        mark.type.name === 'strike' || mark.type.name === 'strikethrough'
    );
    let colorMark = marks.find(mark => mark.type.name === 'textColor');
    let bgColorMark = marks.find(mark => mark.type.name === 'bgColor' || mark.type.name === 'backgroundColor');
    let textColor = colorMark ? colorMark.attrs.color : "textClearColor";
    let bgColor = bgColorMark ? (bgColorMark.attrs.bgColor || bgColorMark.attrs.backgroundColor) : "bgClearColor";
    let align = $anchor.parent.attrs.align || $anchor.parent.attrs.textAlign || 'left';
    let fontSizeMark = marks.find(mark => mark.type.name === 'fontSize');
    let fontValue = '16';
    if (fontSizeMark && fontSizeMark.attrs.fontSize) {
        fontValue = GlobalStyle.convertToPx(fontSizeMark.attrs.fontSize);
    }
    let fontId = GlobalStyle.styleIdMap[fontValue] || 'small';

    const infoMap: Record<string, boolean> = {
        bold: isBold,
        italic: isItalic,
        underline: isUnderline,
        strike: isStrike,
    };
    infoMap[align] = true;
    infoMap[fontId] = true;
    infoMap[textColor] = true;
    infoMap[bgColor] = true;
    return infoMap;
}

function CreateCursorInfoPlugin(bridge: NativeBridge): Plugin {
    return new Plugin({
        view(editorView: EditorView): PluginView {
            let lastSelection = editorView.state.selection;
            return {
                update(view: EditorView, prevState: EditorState) {
                    const { state } = view;
                    if (!state.selection.eq(lastSelection)) {
                        lastSelection = state.selection;
                        const infoMap = getFontInfoMap(state);
                        bridge.asyncFontInfo(infoMap);
                        console.log('光标位置:', infoMap);
                    }
                }
            };
        }
    });
}

export default CreateCursorInfoPlugin;