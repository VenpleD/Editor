import { Fragment, MarkType, Schema } from "prosemirror-model";
import Utils from "./Utils.ts";
import UseTypeChecker from "./Object.js";
import { Selection, TextSelection } from "prosemirror-state";
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
    let tr1  = state1.tr;
    let lastNodeObj = Utils.lastNodeWith(state1);
    if (!lastNodeObj.node) { return; }
    let resultPosIndex = lastNodeObj.posIndex + lastNodeObj.node.nodeSize;
    let lastSel = TextSelection.create(tr1.doc, resultPosIndex, resultPosIndex);
    dispatch1(tr1.setSelection(lastSel).scrollIntoView());
}

export const InsertImageCommand = (view: EditorView, imageUrl: string, currentSchema: Schema) => {
    const { getType, isInstanceOfCustomClass, checkString, isObjectEmpty } = UseTypeChecker();
    const { state, dispatch } = view;
    const { tr, selection} = state;
    const { $anchor, $from, $to } = selection;
    // let cutObj = Utils.findCutBefore(selection.$cursor);
    let currentNode = $anchor.node($anchor.depth).content.firstChild;
    let currentNodeEmpty = true;
    if (!isObjectEmpty(currentNode)) {
        let currentNodeContent = currentNode?.text;
        if (!checkString(currentNodeContent).isEmpty) {
            currentNodeEmpty = false
        }
    }

    // if (currentNode)
    // if (currentNode.)
    const from = selection.from;
    
    const imageNode = currentSchema.nodes.nestedImage.create({
      src: imageUrl
    });
    const imageBottomBreak = currentSchema.nodes.hard_break.create({
        class: 'ProseMirror-trailingBreak'
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
    const resultFragment = Fragment.fromArray([imageContainerNode, nextParagraph]);
    // const resultFragment = Fragment.fromArray([imageContainerNode, nextParagraphNode]);
    // let resultSlice = new Slice({
    //     content: Fragment.fromArray([imageContainerNode, nextParagraphNode]),
    //     openStart: 0,
    //     openEnd: 2
    // })
    if (imageContainerNode) {
        // const _tr = tr.replaceSelectionWith(imageContainerNode);
        let selTo = selection.to;
        let selFrom = selection.from - (currentNodeEmpty ? 1 : 0);
        dispatch(tr.replaceWith(selFrom, selTo, resultFragment).scrollIntoView());
        setTimeout(() => {
            // state要重新获取，因为view刷新过之后，state也会重新创建，并不会修改原有state，而是重新创建
            let state1 = view.state;
            let imageContainerNodeObj = Utils.findNodeWith(state1, 'nestedParagraph');
            if (imageContainerNodeObj.posIndex == -1) {
                return false;
            }
            let textAreaDom = view.domAtPos(imageContainerNodeObj.posIndex);
            textAreaDom.node.addEventListener('onclick', (e) => {  
                console.log('clickOn event on textarea:');
            });
            textAreaDom.node.addEventListener('keydown', (e) => {
                
                console.log('Keydown event on textarea:');
                // 在这里添加更多的事件处理逻辑
  
                // 阻止事件冒泡到父节点
                e.stopPropagation();
              });
              textAreaDom.node.addEventListener('blur', (e) => {
                console.log('blue event on textarea:');
                view.dom.contentEditable = 'true';
              });
        }, 0);
        // setTimeout(() => {
        //     let state1 = view.state;
        //     let dispatch1 = view.dispatch;
        //     let tr1  = state1.tr;
        //     let selection1 = state1.selection;
        //     let imageContainerNodeObj = Utils.findNodeWith(view, "imageContainer");
        //     let nextParagraphPosIndex = imageContainerNodeObj.posIndex + imageContainerNodeObj.node.nodeSize + 1;
        //     let nextParagraphPos = state1.doc.resolve(nextParagraphPosIndex);
        //     // const { tr1, selection1} = state1;
        //     let nextSel = TextSelection.create(tr1.doc, nextParagraphPosIndex, nextParagraphPosIndex);
        //     let nextSel2 = tr1.selection.constructor.create(tr1.doc, nextParagraphPosIndex)
        //     let nextSel4 = tr1.selection.constructor.create(tr1.doc, imageContainerNodeObj.posIndex + 1)
        //     let nextSel3 = tr1.selection.constructor.create(tr1.doc, nextParagraphPosIndex + 1)
        //     let newSelection = tr1.selection.constructor.create(tr1.doc, selection1.to);
        //     let tr2 = tr1.setSelection(nextSel3);
        //     dispatch(tr2.scrollIntoView());
        //     setTimeout(() => {
        //         let result = view.dispatch(view.state.tr.scrollIntoView());
        //         console.log("insetReulst"+ result);
        //     }, 2);
        // }, 0);

        // let newSelection = _tr.selection.create(_tr.doc);
        // const tr2 = tr.replaceSelectionWith(nextParagraphNode);
        // dispatch(tr2.scrollIntoView());
        // let textAreaDom = view.domAtPos(tr.selection.anchor).node.querySelector('.'+textClsName);
        // if (textAreaDom) {
        //     textAreaDom.addEventListener('onfocus', function (e) {
        //         // view.dom.contentEditable = 'false'
        //         // e.stopPropagation();
        //         // textAreaDom.focus();
        //     });
        //     textAreaDom.addEventListener('onblur', function (e) {
        //         view.dom.contentEditable = 'true'
        //     });
        // }
    //     const insertedNodes = tr.selection.content().content.content;
    // insertedNodes.forEach((node) => {
    //     const dom = node.domAtPos(0);
    //     console.log("dispatchAfter--"+dom.node)
    //     if (dom.node) {
    //         // dom.node.addEventListener('blur', function () {
    //         //     console.log('新插入节点失去焦点');
    //         //     // 在此处添加失去焦点后的处理逻辑
    //         // });
    //     }
    // });

        return true;
    }
};