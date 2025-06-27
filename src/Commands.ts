import { Fragment, MarkType, Schema, Slice } from "prosemirror-model";
import Utils from "./Utils.ts";
import UseTypeChecker from "./Object.js";
import { EditorState, NodeSelection, Selection, TextSelection, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import ContentSchema from "./ContentSchema.ts";
import { toggleMark, setBlockType } from "prosemirror-commands";
import GlobalStyle from "./Global.ts";

type FontFunction = {
    bold: (view: EditorView) => (Boolean);
    underline: (view: EditorView) => (Boolean);
    italic: (view: EditorView) => (Boolean);
    strike: (view: EditorView) => (Boolean);
    textColor: (view: EditorView, color: string) => (Boolean);
    bgColor: (view: EditorView, bgColor: string) => (Boolean);
    fontSize: (view: EditorView, fontSize: string) => (Boolean);
    align: (view: EditorView, align: string) => (Boolean);
}

export const FontCommand: FontFunction = {
    bold: (view: EditorView) => {
        const markType = ContentSchema.marks.strong;
        if (markType) {
            toggleMark(markType)(view.state, view.dispatch, view);
            return true;
        }
        return false;
    },
    underline: (view: EditorView) => {
        const markType = ContentSchema.marks.underline;
        if (markType) {
            toggleMark(markType)(view.state, view.dispatch, view);
            return true;
        }
        return false;
    },
    italic: (view: EditorView) => {
        const markType = ContentSchema.marks.em;
        if (markType) {
            toggleMark(markType)(view.state, view.dispatch, view);
            return true;
        }
        return false;
    },
    strike: (view: EditorView) => {
        const markType = ContentSchema.marks.strike || ContentSchema.marks.strikethrough;
        if (markType) {
            toggleMark(markType)(view.state, view.dispatch, view);
            return true;
        }
        return false;
    },
    textColor: (view: EditorView, color: string) => {
        const markType = ContentSchema.marks.textColor;
        if (markType) {
            toggleMark(markType, { color })(view.state, view.dispatch, view);
            return true;
        }
        return false;
    },
    bgColor: (view: EditorView, bgColor: string) => {
        const markType = ContentSchema.marks.bgColor || ContentSchema.marks.backgroundColor;
        if (markType) {
            toggleMark(markType, { bgColor })(view.state, view.dispatch, view);
            return true;
        }
        return false;
    },
    fontSize: (view: EditorView, fontSize: string) => {
        const markType = ContentSchema.marks.fontSize;
        if (!markType) return false;
        setMark(markType, { fontSize: GlobalStyle.convertToRem(Number(fontSize)) + 'rem' })(view.state, view.dispatch);
        return true;
    },
    align: (view: EditorView, align: string) => {
        const { state, dispatch } = view;
        const { schema } = state;
        const paragraph = schema.nodes.paragraph;
        if (!paragraph) return false;
        setBlockType(paragraph, { align })(state, dispatch);
        return true;
    }
};

export const FocusLastedNode = (view: EditorView) => {
    let state1 = view.state;
    let dispatch1 = view.dispatch;
    let tr1 = state1.tr;
    let lastNodeObj = Utils.lastNodeWith(state1);
    if (!lastNodeObj.node || !lastNodeObj.pos) { return; }
    let lastNodeContent = lastNodeObj.node.text;
    const { checkString } = UseTypeChecker();
    let resultPosIndex = lastNodeObj.posIndex + lastNodeObj.node.nodeSize - 1;
    if (!checkString(lastNodeContent).isEmpty) {
        // 如果最后一个节点内容为空，则直接选中该节点
        resultPosIndex = lastNodeObj.posIndex;
    }
    let lastSel = TextSelection.create(tr1.doc, resultPosIndex);
    dispatch1(tr1.setSelection(lastSel).scrollIntoView());
}

export const InsertImageCommand = (view: EditorView, imageUrl: string, currentSchema: Schema) => {
    const { state, dispatch } = view;
    const { tr, selection } = state;
    const { $from, $to, empty } = selection;

    // 判断当前段落是否为空段落
    const isEmptyParagraph = $from.parent.isTextblock && $from.parent.content.size === 0;

    // 判断光标/选区右侧是否有内容
    const rightHasContent = !empty
        ? $to.parentOffset < $to.parent.content.size
        : $from.parentOffset < $from.parent.content.size;

    // 判断是否在段落开头插入
    const atLeft = $from.parentOffset === 0;
    const atRight = $from.parentOffset === $from.parent.content.size;
    const isWholeParagraphSelected =
        $from.parent === $to.parent &&
        $from.parentOffset === 0 &&
        $to.parentOffset === $to.parent.content.size;
    // 判断选区是否选择到了段落最后
    const selectToEnd = $to.parentOffset === $to.parent.content.size;

    let needNextPara = false;
    let replaceCurrentPara = false;

    let leftPos = $from.pos;

    console.log('atLeft:', atLeft, 'rightHasContent:', rightHasContent, 'isEmptyParagraph:', isEmptyParagraph, 'empty:', empty);

    // 构造 imageContainer 节点
    const imageContainerNode = currentSchema.nodes.imageContainer.create({
        src: imageUrl,
        value: '',
        placeholder: '请输入内容',
        cls: 'imageContainerTextarea'
    });
    if (!isEmptyParagraph) {
        if (atRight) {
            needNextPara = true;
            replaceCurrentPara = false;
        }
        else if (atLeft) {
            needNextPara = isWholeParagraphSelected;
            replaceCurrentPara = !empty;
        }
        else {
            needNextPara = selectToEnd;
            replaceCurrentPara = !empty;
        }
        if (isWholeParagraphSelected || atLeft) leftPos -= 1;
    } else {
        needNextPara = true;
        replaceCurrentPara = true;
        leftPos -= 1;
    }
    let fragment;
    if (needNextPara) {
        // 段落中间插入，且右侧没内容，插入空行
        const nextParagraph = currentSchema.nodes.paragraph.create();
        fragment = Fragment.fromArray([imageContainerNode, nextParagraph]);
    } else {
        // 其它情况只插入图片
        fragment = Fragment.fromArray([imageContainerNode]);
    }
    if (imageContainerNode) {
        let result;
        result = tr.split(leftPos);
        if (replaceCurrentPara) {
            result = tr.replaceWith(leftPos, $to.pos, fragment);
        }
        else {
            result = tr.insert(leftPos, fragment);
        }
        dispatch(tr.scrollIntoView());
        setTimeout(() => settingTextareaDom(view), 0);
        return true;
    }
    return false;
    // 只有在不是段落结尾且不是段落开头时才插入空行
    // let fragment;
    // if (!rightHasContent && !atLeft && !isEmptyParagraph) {
    //     // 段落中间插入，且右侧没内容，插入空行
    //     const nextParagraph = currentSchema.nodes.paragraph.create();
    //     fragment = Fragment.fromArray([imageContainerNode, nextParagraph]);
    // } else {
    //     // 其它情况只插入图片
    //     fragment = Fragment.fromArray([imageContainerNode]);
    // }

    // if (!empty) {
    //     // 有选区，先删除选区内容，再插入
    //     tr.deleteSelection();
    //     tr.insert(tr.selection.from, fragment);
    //     dispatch(tr.scrollIntoView());
    //     setTimeout(() => settingTextareaDom(view), 0);
    //     return true;
    // }

    // if (isEmptyParagraph) {
    //     // 直接替换当前空段落
    //     const paraPos = $from.before();
    //     dispatch(tr.replaceWith(paraPos, paraPos + $from.parent.nodeSize, fragment).scrollIntoView());
    //     setTimeout(() => settingTextareaDom(view), 0);
    //     return true;
    // }

    // // 其它情况（段落非空）
    // let insertPos = $from.pos;

    // if (!atLeft && !atRight) {
    //     tr.split(insertPos);
    //     insertPos += 1;
    // } else if (atRight) {
    //     insertPos = $from.end();
    // }
    // // atLeft 时 insertPos 就是 $from.pos

    // tr.insert(insertPos, fragment);
    // dispatch(tr.scrollIntoView());
    // setTimeout(() => settingTextareaDom(view), 0);
    // return true;
};

function settingTextareaDom(view: EditorView) {
    // state要重新获取，因为view刷新过之后，state也会重新创建，并不会修改原有state，而是重新创建
    let state1 = view.state;
    let imageContainerNode = Utils.findNodeWith(state1, 'imageContainer');
    if (!imageContainerNode.node) {
        console.warn('没有找到 imageContainer 节点');
        return;
    }

    let imageContainerDom = view.nodeDOM(imageContainerNode.posIndex) as HTMLElement;
    // imageContainerDom as DOMNode
    let textareaDom = imageContainerDom.querySelector('.imageContainerTextarea');
    if (!textareaDom) {
        console.warn('没有找到 imageContainerTextarea 节点');
        return;
    }
    textareaDom.addEventListener('click', (e) => {
        console.log('clickOn event on textarea:');
    });
    textareaDom.addEventListener('keydown', (e) => {

        console.log('Keydown event on textarea:');
        // 在这里添加更多的事件处理逻辑

        // 阻止事件冒泡到父节点
        e.stopPropagation();
    });
    textareaDom.addEventListener('blur', (e) => {
        console.log('blue event on textarea:');
        // view.dom.contentEditable = 'true';
    });
}

// 强制设置 mark（如 fontSize）
function setMark(markType: MarkType, attrs: any) {
    return function (state: EditorState, dispatch: (tr: Transaction) => void) {
        const { from, to, empty } = state.selection;
        let tr = state.tr;

        // 1. 先移除已有的同类 mark
        tr.removeMark(from, to, markType);

        // 2. 再加上新的 mark
        if (!empty) {
            tr.addMark(from, to, markType.create(attrs));
        } else {
            tr.setStoredMarks([markType.create(attrs)]);
        }

        if (dispatch) dispatch(tr.scrollIntoView());
        return true;
    }
}