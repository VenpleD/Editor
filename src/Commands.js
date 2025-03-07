import { Fragment, Slice } from "prosemirror-model";
import Utils from "./Utils.ts";
import useTypeChecker from "./Object";

export const InsertImageCommand = (view, imageUrl, currentSchema) => {
    const { getType, isInstanceOfCustomClass, checkString, isObjectEmpty } = useTypeChecker();
    const { state, dispatch } = view;
    const { tr, selection} = state;
    const { $cursor, $from, $to } = selection;
    // let cutObj = Utils.findCutBefore(selection.$cursor);
    let currentNode = $cursor.node($cursor.depth).content.firstChild;
    let currentNodeEmpty = false;
    if (!isObjectEmpty(currentNode)) {
        let currentNodeContent = currentNode.content.text;
        if (checkString(currentNodeContent).isEmpty) {
            currentNodeEmpty = true;
        }
    }

    // if (currentNode)
    // if (currentNode.)
    const from = selection.from;
    let imageContainerNode = currentSchema.nodes.imageContainer.create();
    const imageNode = currentSchema.nodes.nestedImage.create({
      src: imageUrl
    });
    let textClsName = 'imageContainerTextarea';
    const nestedParagraphNode = currentSchema.nodes.nestedParagraph.create({
        placeholder: '请输入内容',
        cls: textClsName
    });
    const fragment = Fragment.fromArray([imageNode, nestedParagraphNode]);
    imageContainerNode.content = fragment;
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
        let selTo = tr.selection.to;
        dispatch(tr.replaceWith(tr.selection.from, selTo, resultFragment));
        setTimeout(() => {
            let state1 = view.state;
            let dispatch1 = view.dispatch;
            let tr1  = state1.tr;
            let selection1 = state1.selection;
            // const { tr1, selection1} = state1;
            let newSelection = tr1.selection.constructor.create(tr1.doc, selTo + resultFragment.size, selTo + resultFragment.size);
            let tr2 = tr1.setSelection(newSelection);
            dispatch(tr2);
            setTimeout(() => {
                let result = view.dispatch(view.state.tr.scrollIntoView());
                console.log("insetReulst"+ result);
            }, 2);
        }, 0);

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