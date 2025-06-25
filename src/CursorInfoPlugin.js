import { Plugin } from 'prosemirror-state';
import GlobalStyle from './Global.ts';

function CreateCursorInfoPlugin(bridge) {
    return new Plugin({
        view(editorView) {
            let lastSelection = editorView.state.selection;
            return {
                update(view, prevState) {
                    const { state } = view;
                    // 判断 selection 是否变化
                    if (!state.selection.eq(lastSelection)) {
                        lastSelection = state.selection;
                        const { $from, empty, $anchor } = state.selection;
                        console.log('parent node type:', $anchor.parent.type.name);
                        console.log('storedMarks:', state.storedMarks);
                        console.log('marks at cursor:', $anchor.marks());

                        let marks;
                        if (!empty) {
                            // 光标插入点，优先取 storedMarks，否则取当前位置 marks
                            marks = state.storedMarks || $anchor.marks();
                        } else {
                            // 有选区，取选区起点 marks（也可以遍历选区所有 marks）
                            marks = $from.marks();
                        }

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
                        let textColor = colorMark ? colorMark.attrs.color : "textClearColor";
                        let bgColor = bgColorMark ? (bgColorMark.attrs.bgColor || bgColorMark.attrs.backgroundColor) : "bgClearColor";

                        // 对齐方式（通常是段落节点的 attrs）
                        let align = $anchor.parent.attrs.align || $anchor.parent.attrs.textAlign || 'left';

                        let fontSizeMark = marks.find(mark => mark.type.name === 'fontSize');
                        let fontValue = '16px'; // 默认字体大小
                        if (fontSizeMark && fontSizeMark.attrs.fontSize) {
                            fontValue = GlobalStyle.convertToPx(fontSizeMark.attrs.fontSize) + 'px';
                        }
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
                        console.log('光标位置:', infoMap);
                    }
                }
            };
        }
    })
}

export default CreateCursorInfoPlugin;