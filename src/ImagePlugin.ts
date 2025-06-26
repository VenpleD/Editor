import { Plugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import Utils from './Utils.ts';
import UseTypeChecker from './Object.js';

const ImagePlugin = new Plugin({
    props: {
        handleDOMEvents: {
            click(view: EditorView, event: MouseEvent): boolean {
                console.log("domClick");
                event.stopPropagation(); // 阻止事件冒泡到 App.js
                return false;
            },
            keydown(view: EditorView, event: KeyboardEvent): boolean {
                // 只处理 Backspace 和 Delete
                const { state, dispatch } = view;
                const { selection } = state;
                const { checkString } = UseTypeChecker();
                if (event.key !== 'Backspace' && event.key !== 'Delete') {
                    return false;
                }
                const { $from, $to, $anchor } = selection;
                let $cut = Utils.findCutBefore($anchor);
                if (!$cut) {
                    /// 如果没有前置节点，直接返回false，走框架自身删除逻辑
                    console.log("没有前置节点，走框架自身删除逻辑");
                    return false;
                }
                let rangeMax = Math.max($from.pos, $to.pos);
                let rangeMin = Math.min($from.pos, $to.pos);
                if (rangeMax != rangeMin && ($cut.pos < rangeMin || $cut.pos > rangeMax)) {
                    // 如果$cut位置不在当前选区范围内，直接返回false，走框架自身删除逻辑
                    console.log("没有前置节点，走框架自身删除逻辑");
                    return false;
                }
                /// 是否光标在当前节点的开始处
                let anchorAtHead = $anchor.pos == ($cut.pos + 1);

                let textContent = Utils.getNodeContent(view, $anchor);
                let beforeNode = $cut.nodeBefore ? $cut.nodeBefore : null;
                let needHandleImage = false;
                if (checkString(textContent).isEmpty) {
                    needHandleImage = true;
                } else {
                    /// 有内容，并且光标在开始位置也需要处理
                    needHandleImage = anchorAtHead;
                }
                if (needHandleImage && beforeNode && beforeNode.type.name == "imageContainer") {
                    console.log("删除图片容器");
                    let imageContainerNodeObj = Utils.findNodeWith(view.state, "imageContainer");
                    let imgContainerNode = imageContainerNodeObj.node;
                    let imgContainerPosIndex = imageContainerNodeObj.posIndex;
                    if (imgContainerNode) {
                        let disp = view.dispatch;
                        let trans = view.state.tr.deleteRange(
                            Math.max(imgContainerPosIndex - imgContainerNode.content.size + 1, 0),
                            imgContainerPosIndex + imgContainerNode.content.size + 1
                        );
                        let trans2 = trans.scrollIntoView();
                        disp(trans2);
                    }
                    /* 
                    <p>abc</p> 
                    <div class="imageContainer">...</div>
                    <p>def</p>
                    return true会出现以下情况
                    <p>abc<span>def</span></p>
                    会导致下次插入图片的逻辑出现问题
                    */
                    /// 这里也返回false，让他走一下系统的逻辑，不然会出现下一行的文字被span标签包裹放到上一个p标签
                    return false;
                }
                return false;
            }
        }
    }
});

export default ImagePlugin;