import { Plugin } from 'prosemirror-state';

function createCursorInfoPlugin(bridge) {
    return new Plugin({
        view(editorView) {
            let lastSelection = editorView.state.selection;
            return {
                update(view, prevState) {
                    const { state } = view;
                    // 判断 selection 是否变化
                    if (!state.selection.eq(lastSelection)) {
                        lastSelection = state.selection;
                        const { from, empty } = state.selection;
                        const $from = state.selection.$from;
                        console.log('parent node type:', $from.parent.type.name);
                        console.log('storedMarks:', state.storedMarks);
                        console.log('marks at cursor:', $from.marks());

                        let marks = empty
                            ? (state.storedMarks || $from.marks())
                            : state.doc.rangeHasMark(state.selection.from, state.selection.to, state.schema.marks.strong)
                                ? [state.schema.marks.strong.create()]
                                : [];

                        // 字体样式
                        let isBold = marks.some(mark => mark.type.name === 'strong');
                        let isItalic = marks.some(mark => mark.type.name === 'em');
                        let isUnderline = marks.some(mark => mark.type.name === 'underline');
                        let isStrike = marks.some(mark =>
                            mark.type.name === 'strike' || mark.type.name === 'strikethrough'
                        );

                        // 文字颜色和背景色
                        let colorMark = marks.find(mark => mark.type.name === 'textColor');
                        let bgColorMark = marks.find(mark => mark.type.name === 'bgColor' || mark.type.name === 'backgroundColor');
                        let textColor = colorMark ? colorMark.attrs.color : "";
                        let bgColor = bgColorMark ? (bgColorMark.attrs.bgColor || bgColorMark.attrs.backgroundColor) : "";

                        // 对齐方式（通常是段落节点的 attrs）
                        let align = $from.parent.attrs.align || $from.parent.attrs.textAlign || 'left';

                        let fontValue = $from.parent.attrs.fontSize || '16px';
                        let infoMap = {
                            bold: isBold,
                            italic: isItalic,
                            underline: isUnderline,
                            strike: isStrike,
                        }
                        infoMap[align] = true;
                        infoMap[fontValue] = true;
                        infoMap[textColor] = true;
                        infoMap[bgColor] = true;
                        bridge.asyncFontInfo(infoMap);
                        console.log('光标位置hahah marks:', marks, '加粗:', isBold, '斜体:', isItalic);
                    }
                }
            };
        }
    })
}

export default createCursorInfoPlugin;