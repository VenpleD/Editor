import { Fragment, Slice } from "prosemirror-model";

export const insertImageCommand = (view, imageUrl, currentSchema) => {
    const { state, dispatch } = view;
    const { tr, selection} = state;
    const from = selection.from;
    const imageContainerNode = currentSchema.nodes.imageContainer.create();
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
    const nextParagraph = currentSchema.nodes.paragraph.create();
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
        const _tr = tr.replaceWith(tr.selection.from, selTo, resultFragment);
        let newSelection = _tr.selection.constructor.create(_tr.doc, selTo + resultFragment.size, selTo + resultFragment.size);
        _tr.setSelection(newSelection);
        dispatch(_tr.scrollIntoView());
        setTimeout(() => {
            let textAreaDom = view.domAtPos(_tr.selection.anchor).node.querySelector('.' + textClsName);
            if (textAreaDom) {
                textAreaDom.addEventListener('keydown', function (e) {
                    console.log('Key down event detected:', e);
                    // 在这里添加你的处理逻辑
                });
            }
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