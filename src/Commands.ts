import { Fragment, Node, Schema } from "prosemirror-model";
import Utils from "./Utils.ts";
import useTypeChecker from "./Object.js";
import { Selection, TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

export const FocusLastedNode = (view: EditorView) => {
    let state1 = view.state;
    let dispatch1 = view.dispatch;
    let tr1  = state1.tr;
    let selection1 = state1.selection;
    let imageContainerNodeObj = Utils.findNodeWith(state1, "imageContainer");
    let lastPos = state1.doc.resolve(2);
    let resultNode;
    let resultPos;
    let resultPosIndex;
    state1.doc.descendants((node, pos) => {
      let tempResolvePos = state1.doc.resolve(pos);
      resultNode = node;
      resultPosIndex = pos;
      resultPos = tempResolvePos;
    });
    let lastSel = tr1.selection.constructor.create(tr1.doc, resultPosIndex + 1)
    dispatch1(tr1.setSelection(lastSel).scrollIntoView());
    // let nextParagraphPosIndex = imageContainerNodeObj.posIndex + imageContainerNodeObj.node.nodeSize + 1;
    // let nextParagraphPos = state1.doc.resolve(nextParagraphPosIndex);
    // // const { tr1, selection1} = state1;
    // let nextSel = TextSelection.create(tr1.doc, nextParagraphPosIndex, nextParagraphPosIndex);
    // let nextSel2 = tr1.selection.constructor.create(tr1.doc, nextParagraphPosIndex)
    // let nextSel4 = tr1.selection.constructor.create(tr1.doc, imageContainerNodeObj.posIndex + 1)
    // let nextSel3 = tr1.selection.constructor.create(tr1.doc, nextParagraphPosIndex + 1)
    // let newSelection = tr1.selection.constructor.create(tr1.doc, selection1.to);
    // dispatch1(tr1.setSelection(nextSel2));
}

export const InsertImageCommand = (view: EditorView, imageUrl: string, currentSchema: Schema) => {
    const { getType, isInstanceOfCustomClass, checkString, isObjectEmpty } = useTypeChecker();
    const { state, dispatch } = view;
    const { tr, selection} = state;
    const { $cursor, $from, $to } = selection;
    // let cutObj = Utils.findCutBefore(selection.$cursor);
    let currentNode = $cursor.node($cursor.depth).content.firstChild;
    let currentNodeEmpty = true;
    if (!isObjectEmpty(currentNode)) {
        let currentNodeContent = currentNode.content.text;
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