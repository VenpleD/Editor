import { Fragment, MarkType, Schema } from "prosemirror-model";
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
    const { getType, isInstanceOfCustomClass, checkString, isObjectEmpty } = UseTypeChecker();
    const { state, dispatch } = view;
    const { tr, selection } = state;
    const { $anchor, $from, $to } = selection;
    console.log("insertImage" + "anchor:" + $anchor.pos + " from:" + $from.pos + " to:" + $to.pos + "empty:" + selection.empty);
    /// 是否需要图片后面空行
    let needNextP = false;

    // 当前是否有选择范围
    let selectEmpty = selection.empty;

    /// 在现有内容后面追加内容
    let appendAtContentTrail = false;

    let rangeMax = Math.max($from.pos, $to.pos);
    let rangeMin = Math.min($from.pos, $to.pos);

    let currentNode = $anchor.node($anchor.depth).content.firstChild;
    if (!isObjectEmpty(currentNode) && !checkString(currentNode?.text).isEmpty) {
        let contentLength = currentNode?.nodeSize ?? 0;
        let rightPos = contentLength + 1;
        let selectAll = (rangeMax - rangeMin) == contentLength;

        // 如果光标在最右边
        let atRight = $anchor.parentOffset === $anchor.parent.content.size;
        let atLeft = $anchor.parentOffset === 0;

        if (atRight) {
            needNextP = true;
            appendAtContentTrail = !selectEmpty;
        } else if (atLeft) {
            /// 光标再左，全选
            needNextP = selectAll;
            appendAtContentTrail = false;
        } else {
            /// 光标再中间，就看是否选择到了最后
            needNextP = rangeMax == rightPos;
            appendAtContentTrail = !selectEmpty;
        }
        /// 如果全选了内容，并且光标在最左边，或者光标在最右边，则需要将rangeMin减1
        if (selectAll || atLeft) rangeMin -= 1;
    } else {
        needNextP = true;
        /// 这里当前行为空，也需要减1去掉当前行
        rangeMin -= 1;
    }

    const imageNode = currentSchema.nodes.nestedImage.create({
        src: imageUrl
    });
    let textClsName = 'imageContainerTextarea';
    const nestedParagraphNode = currentSchema.nodes.nestedParagraph.create({
        placeholder: '请输入内容',
        value: '哈哈',
        cls: textClsName,
    });
    const fragment = Fragment.fromArray([imageNode, nestedParagraphNode]);
    let imageContainerNode = currentSchema.nodes.imageContainer.create(null, fragment);
    const nextParagraph = currentSchema.nodes.paragraph.create();
    const resultFragment = needNextP ? Fragment.fromArray([imageContainerNode, nextParagraph]) : Fragment.fromArray([imageContainerNode]);
    if (imageContainerNode) {
        if (appendAtContentTrail) {
            dispatch(tr.insert(Math.max(rangeMax, $anchor.pos), resultFragment).scrollIntoView());
        } else {
            dispatch(tr.replaceWith(rangeMin, rangeMax, resultFragment).scrollIntoView());
        }
        setTimeout(() => {
            settingTextareaDom(view);
        }, 0);
        return true;
    }
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