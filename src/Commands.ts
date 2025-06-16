import { Fragment, MarkType, Schema } from "prosemirror-model";
import Utils from "./Utils.ts";
import UseTypeChecker from "./Object.js";
import { NodeSelection, Selection, TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import ContentSchema from "./ContentSchema.ts";
import { toggleMark, setBlockType } from "prosemirror-commands";
import { undo } from "prosemirror-history";

type FontFunction = {
    bold: (view: EditorView) => (void);
    underline: (view: EditorView) => (void);
    italic: (view: EditorView) => (void);
    strike: (view: EditorView) => (void);
    textColor: (view: EditorView, color: string) => (void);
    bgColor: (view: EditorView, bgColor: string) => (void);
    fontSize: (view: EditorView, fontSize: string) => (void);
    align: (view: EditorView, align: string) => (void);
}

export const FontCommand: FontFunction = {
    bold: (view: EditorView) => {
        const markType = ContentSchema.marks.strong;
        if (markType) toggleMark(markType)(view.state, view.dispatch, view);
    },
    underline: (view: EditorView) => {
        const markType = ContentSchema.marks.underline;
        if (markType) toggleMark(markType)(view.state, view.dispatch, view);
    },
    italic: (view: EditorView) => {
        const markType = ContentSchema.marks.em;
        if (markType) toggleMark(markType)(view.state, view.dispatch, view);
    },
    strike: (view: EditorView) => {
        const markType = ContentSchema.marks.strike || ContentSchema.marks.strikethrough;
        if (markType) toggleMark(markType)(view.state, view.dispatch, view);
    },
    textColor: (view: EditorView, color: string) => {
        const markType = ContentSchema.marks.textColor;
        if (markType) toggleMark(markType, { color })(view.state, view.dispatch, view);
    },
    bgColor: (view: EditorView, bgColor: string) => {
        const markType = ContentSchema.marks.bgColor || ContentSchema.marks.backgroundColor;
        if (markType) toggleMark(markType, { bgColor })(view.state, view.dispatch, view);
    },
    fontSize: (view: EditorView, fontSize: string) => {
        const markType = ContentSchema.marks.fontSize;
        if (markType) toggleMark(markType, { fontSize })(view.state, view.dispatch, view);
    },
    align: (view: EditorView, align: string) => {
        const { state, dispatch } = view;
        const { schema } = state;
        const paragraph = schema.nodes.paragraph;
        if (!paragraph) return;
        setBlockType(paragraph, { align })(state, dispatch);
    }
};

// export const SettingBold = (view: EditorView) => {
//     const markType = ContentSchema.marks.strong;
//     toggleMark(markType)(view.state, view.dispatch, view);
//     // const { state, dispatch } = view;
//     // const { tr, selection} = state;
//     // const { from, to, $anchor } = selection;
//     // let index = $anchor.index($anchor.depth - 1)
//     // let maskArray = state.storedMarks
//     // const markType: MarkType = ContentSchema.marks.strong;
//     // let aa = Utils.findCurrentNode(selection.$anchor)
//     // dispatch(tr.addNodeMark(from, markType.create()))
//     console.log("blod");
// }
// // 下划线
// export const toggleUnderline = (view: EditorView) => {
//   const markType = ContentSchema.marks.underline;
//   if (markType) toggleMark(markType)(view.state, view.dispatch, view);
// };

// // 斜体
// export const toggleItalic = (view: EditorView) => {
//   const markType = ContentSchema.marks.em;
//   if (markType) toggleMark(markType)(view.state, view.dispatch, view);
// };

// // 删除线
// export const toggleStrike = (view: EditorView) => {
//   const markType = ContentSchema.marks.strike || ContentSchema.marks.strikethrough;
//   if (markType) toggleMark(markType)(view.state, view.dispatch, view);
// };
// // 字体颜色
// export const setTextColor = (view: EditorView, color: string) => {
//   const markType: MarkType = ContentSchema.marks.textColor;
//   if (!markType) return;
//   toggleMark(markType, { color })(view.state, view.dispatch, view);
// };

// // 背景色
// export const setBgColor = (view: EditorView, bgColor: string) => {
//   const markType: MarkType = ContentSchema.marks.bgColor || ContentSchema.marks.backgroundColor;
//   if (!markType) return;
//   toggleMark(markType, { bgColor })(view.state, view.dispatch, view);
// };

// // 字号
// export const setFontSize = (view: EditorView, fontSize: string) => {
//   const markType: MarkType = ContentSchema.marks.fontSize;
//   if (!markType) return;
//   toggleMark(markType, { fontSize })(view.state, view.dispatch, view);
// };


// // 假设段落节点支持 align 属性
// export const setAlign = (view: EditorView, align: string) => {
//   const { state, dispatch } = view;
//   const { schema } = state;
//   const paragraph = schema.nodes.paragraph;
//   if (!paragraph) return;
//   setBlockType(paragraph, { align })(state, dispatch);
// };
export const FocusLastedNode = (view: EditorView) => {
    let state1 = view.state;
    let dispatch1 = view.dispatch;
    let tr1 = state1.tr;
    let lastNodeObj = Utils.lastNodeWith(state1);
    if (!lastNodeObj.node || !lastNodeObj.pos) { return; }
    let lastNodeContent = lastNodeObj.node.text ;
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

    /// 是否需要图片后面空行
    let needNextP = false;

    /// 在现有内容后面追加内容
    let appendAtContentTrail = false;

    let rangeMax = Math.max($from.pos, $to.pos);
    let rangeMin = Math.min($from.pos, $to.pos);

    let currentNode = $anchor.node($anchor.depth).content.firstChild;
    if (!isObjectEmpty(currentNode) && !checkString(currentNode?.text).isEmpty) {
        let rightPos = (currentNode?.nodeSize ?? 0) + 1;
        // 如果有选择范围，并且最大的是在当前节点最右边，这个时候替换这款内容需要换行
        let hasRangeNext = rangeMax != rangeMin && rangeMax == rightPos;

        // 如果光标在最右边
        let atRight = $anchor.pos == rightPos;
        if (atRight || hasRangeNext) {
            needNextP = true;
            appendAtContentTrail = true;
        }
    } else {
        needNextP = true;
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
    const nextParagraph = currentSchema.nodes.paragraph.create({
        class: 'containerNextP'
    });
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