import { Plugin } from 'prosemirror-state';

export const TextareaPlugin = new Plugin({
    props: {
        handleDOMEvents: {
            mousedown: (view, event) => {
                const pos = view.posAtDOM(event.target);
                if (pos) {
                    const node = view.state.doc.nodeAt(pos);
                    if (node && node.type.name === 'nestedParagraph') {
                        event.preventDefault(); // 阻止默认行为，比如ProseMirror默认的选择等操作
                        const target = event.target;
                        target.focus(); // 让textarea获取焦点
                        return true; // 表示已经处理了该事件，ProseMirror不再进行后续常规处理
                    }
                }
                return false; // 表示未处理该事件，ProseMirror继续按常规流程处理
            },
            input: (view, event) => {
                
                if (event.target != event.currentTarget) {
                    event.preventDefault();
                    event.stopPropagation();
                    console.log('input--'+event.target.className+'--'+event.currentTarget.className);
                    // console.log('----input'+view.dom);
                    return false;
                }
                return true;
            },
            keyup: (view, event) => {
                if (event.target != event.currentTarget) {
                    event.preventDefault();
                    event.stopPropagation();
                    console.log('----keyup'+view.focus);
                    return false;
                }
                return true;
            },
            keydown: (view, event) => {
                if (event.target != event.currentTarget) {
                    event.preventDefault();
                    event.stopPropagation();
                    console.log('----keydown'+view.focus);
                    return false;
                }
                return true
            },
            // touchstart: (view, event) => {
            //     const pos = view.posAtDOM(event.targetTouches[0].target);
            //     if (pos) {
            //         const node = view.state.doc.nodeAt(pos);
            //         if (node && node.type.name === 'nestedParagraph') {
            //             event.preventDefault();
            //             const target = event.targetTouches[0].target;
            //             target.focus();
            //             event.currentTarget = target;
            //             view.dom.contentEditable = false;
            //             return true;
            //         }
            //     }
            //     return false;
            // },
            // touchend: (view, event) => {
            //     const pos = view.posAtDOM(event.changedTouches[0].target);
            //     if (pos) {
            //         const node = view.state.doc.nodeAt(pos);
            //         if (node && node.type.name === 'nestedParagraph') {
            //             // 这里可以添加touchend时的更多处理逻辑，比如同步textarea内容到ProseMirror其他位置等
            //             const target = event.changedTouches[0].target;
            //             const textareaValue = target.value;
            //             // if (textareaValue.length > 0) {
            //             //     // 假设要将textarea中的文本添加到当前光标位置后的ProseMirror文档中（示例，可根据实际需求调整）
            //             //     const tr = view.state.tr;
            //             //     const cursorPos = view.state.selection.from;
            //             //     const textNode = view.state.schema.text(textareaValue);
            //             //     tr.insert(cursorPos + 1, textNode);
            //             //     view.dispatch(tr);
            //             // }
            //             console.log('touchend');
            //             return true;
            //         }
            //     }
            //     return false;
            // },
            // 可以根据需要添加更多事件处理，比如mouseup、click等，处理逻辑类似
            // mouseup: (view, event) => {... },
            // click: (view, event) => {... },
        }
    }
});