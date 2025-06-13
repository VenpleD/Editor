import React, { useRef, useEffect as useEffect } from 'react';
import { EditorState, Plugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { DOMParser, Node } from 'prosemirror-model';
import { keymap } from 'prosemirror-keymap';
import { history, undo, redo } from 'prosemirror-history';
import { baseKeymap } from 'prosemirror-commands';
import placeholder from './Placeholder/placeholder.js';
import ContentSchema from './ContentSchema.ts';
import { PluginKey } from 'prosemirror-state';
import Utils from './Utils.ts';
import UseTypeChecker from './Object.js';
import NativeBridge from './NativeBridge.ts';
import { FocusLastedNode } from './Commands.ts';
import CursorInfoPlugin from './CursorInfoPlugin.js';

const ContentEditor = () => {
  const editorRef = useRef(null);
  const viewRef = useRef<EditorView | null>(null)
  const nativeBridge = new NativeBridge(viewRef);
  // var prosemirrorState = require('prosemirror-state');

  var backspaceKey = new PluginKey("'backspace'");
  useEffect(() => {

    let myPlugin = new Plugin({
      key: backspaceKey,
      props: {
        handleDOMEvents: {
          keydown(view, event) {
            // console.log("A key was pressed!");
            const { state, dispatch } = view;
            const { selection } = state;
            const { getType, isInstanceOfCustomClass, checkString, isObjectEmpty } = UseTypeChecker();
            if (event.key !== 'Backspace' && event.key !== 'Delete') {
              return false;
            }
            const { $from, $to, $anchor } = selection;
            let $cut = Utils.findCutBefore($anchor);
            if (!$cut) {
              /// 如果没有前置节点，直接返回false，走框架自身删除逻辑
              return false;
            }
            let textContent = Utils.getNodeContent(view, $anchor);
            let beforeNode: Node | null = null;
            if ($cut.nodeBefore) {
              beforeNode = $cut.nodeBefore;
            }
            if (checkString(textContent).isEmpty && beforeNode && beforeNode.type.name == "imageContainer") {
              setTimeout(() => {
                let imageContainerNodeObj = Utils.findNodeWith(view.state, "imageContainer");
                let imgContainerNode = imageContainerNodeObj.node;
                let imgContainerPosIndex = imageContainerNodeObj.posIndex;
                if (imgContainerNode) {
                  let disp = view.dispatch;
                  let trans = view.state.tr.deleteRange(Math.max(imgContainerPosIndex - imgContainerNode.content.size + 1, 0), imgContainerPosIndex + imgContainerNode.content.size + 1);
                  let trans2 = trans.scrollIntoView();
                  disp(trans2);
                }
              }, 0);
              return true;
            }

            return false;
          }
        },
        handleClickOn(view, pos, node, nodePos, event) {

          console.log("clickOn" + node);
          return false;
          // if (node.attrs.cls == "imageContainerTextarea") {
          //   let textAreaDom = (view.domAtPos(pos).node as Element).querySelector('.'+node.attrs.cls);
          //   setTimeout(() => {
          //     let parentNode = view.domAtPos(pos).node.parentNode;
          //     // let textAreaDom = parentNode.querySelector('.' + node.attrs.cls);
          //     if (textAreaDom) {
          //       // 使 EditorView 失去焦点
          //       view.dom.blur();
          //       view.dom.contentEditable = 'false';

          //       // 聚焦到 textarea 元素
          //       textAreaDom.focus();

          //       // 确保事件传播被正确处理
          //       // event.preventDefault();
          //       // event.stopPropagation();

          //       // 绑定 keydown 事件监听器
          //       textAreaDom.addEventListener('keydown', function (e) {
          //         console.log('Keydown event on textarea:', e.key);
          //         // 在这里添加更多的事件处理逻辑

          //         // 阻止事件冒泡到父节点
          //         e.stopPropagation();
          //       });
          //       textAreaDom.addEventListener('blur', function (e) {
          //         console.log('blue event on textarea:', e.key);
          //         view.dom.contentEditable = 'true';
          //       });
          //     }
          //   }, 0);

          // } else {

          // }
          // return true;
        },
        handleClick(view, pos, event) {
          console.log("click" + pos);
        },
        handleKeyDown(view, event) {
          console.log("A key was pressed!");
        },
        // handleTextInput(view, from, to, text) {
        //   console.log("A key was input!");
        //   if (text === 'a') {
        //     return true;
        //   }
        //   return false;
        // }
      }
    })
    const state = EditorState.create({
      doc: DOMParser.fromSchema(ContentSchema).parse(document.querySelector(".contentWrapper")!),
      plugins: [
        keymap({
          // 定义一些额外的键盘快捷键，可根据需求调整
          'Mod-z': undo,
          'Mod-y': redo,
        }),
        history(),
        keymap(baseKeymap),  // 添加基础的键盘快捷键，如回车键换行等默认操作
        myPlugin,
        placeholder('请输入正文', 'contentPlaceholderClass'),
        CursorInfoPlugin(nativeBridge)
        // ImagePlugin,
        // TextareaPlugin,
      ]
    });



    // 创建编辑器视图并挂载到DOM元素上
    const view = new EditorView(editorRef.current, {
      state,
      dispatchTransaction: (transaction) => {
        console.log("Document size went from", transaction.before.content.size,
          "to", transaction.doc.content.size)
        const newState = view.state.apply(transaction);
        view.updateState(newState);
      },
      attributes: {
        id: 'editor-view-id' // 设置 EditorView 的 id
      }
    });
    viewRef.current = view;
    // const insertLocalImage = (params) => {
    //   InsertImageCommand(view, params.imageLocalPath, ContentSchema);
    //   setTimeout(() => {
    //     FocusLastedNode(view);
    //   }, 200);

    // }
    // nativeBridge.register('insertLocalImage', insertLocalImage);

    const handlePageClick = (event) => {
      const target = event.target;
      console.log('click--' + event.target.className + '--' + event.currentTarget.className);
      if (target.tagName === 'TEXTAREA') {
        target.focus();
        target.composing = true;
        view.editable = false;
        // view.dom.contentEditable = 'false';
        target.addEventListener('blur', (e) => {
          view.editable = true;
          // view.dom.contentEditable = 'true';
        }, false);
        target.addEventListener('keydown', (e) => {
          // view.editable= true;
          // view.dom.contentEditable = 'true';
          event.stopPropagation();
          event.preventDefault();
        }, false);
        // let sub = editorRef.current.childNodes[0];
        // let dom = view.dom;
        // sub.contentEditable = false;
        // sub.blur();
        // event.stopPropagation(); // 阻止点击事件继续传播，不让EditorView响应此次点击
        // event.preventDefault();
        // if (event.target.className != event.currentTarget.className) {
        //   setTimeout(() => {
        //     target.focus();
        //   }, 100);
        // }

      } else {
        // view.dom.focus();
      }
    }

    const handleInputEvent = (event) => {
      const target = event.target;
      console.log('input--' + event.target.className + '--' + event.currentTarget.className);
      if (target.tagName === 'TEXTAREA') {
        // event.stopPropagation(); // 阻止点击事件继续传播，不让EditorView响应此次点击
      }
    }
    // document.addEventListener('click', handlePageClick);
    // document.addEventListener('input', handleInputEvent);
    // const parentEle = editorRef.current.parentNode;
    // if (parentEle) {
    //   parentEle.addEventListener('input', handleInputEvent, true);
    // }
    return () => {
      // if (parentEle) {
      //   parentEle.removeEventListener('input', handleInputEvent, true);
      // }
      view.destroy();
    };
  }, []);
  function hideKeyboard() {
    let tempView = viewRef.current;
    if (tempView) {
      tempView.focus();
      // tempView.dom.blur();
      setTimeout(() => {
        let temp1View = viewRef.current;
        if (temp1View) {
          temp1View.focus();
        } 
        
        // FocusLastedNode(tempView)
      }, 0);
    }

  }
  return (
    <div>
    <div className='contentWrapper' ref={editorRef}></div>
    </div>

  );
};

export default ContentEditor;