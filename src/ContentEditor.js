import React, { useRef, useEffect } from 'react';
import { EditorState, Plugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema, DOMParser, ResolvedPos } from 'prosemirror-model';
import { schema as basicSchema } from "prosemirror-schema-basic"
import { addListNodes } from 'prosemirror-schema-list';
import { keymap } from 'prosemirror-keymap';
import { history } from 'prosemirror-history';
import { baseKeymap } from 'prosemirror-commands';
import placeholder from './Placeholder/placeholder.js';
import NativeBridge from './NativeBridge.js';
import ContentSchema from './ContentSchema.js';
import ImagePlugin from './ImagePlugin.js';
import { InsertImageCommand, FocusLastedNode } from './Commands.ts';
import { TextSelection } from 'prosemirror-state';
import { PluginKey } from 'prosemirror-state';
import Utils from './Utils.ts';

const ContentEditor = () => {
  const editorRef = useRef(null);
  const viewRef = useRef(null)
  const nativeBridge = new NativeBridge();
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
    
            if (event.key === 'Backspace' || event.key === 'Delete') {
              const { $from, $to, $cursor } = selection;
              
              let $cut = Utils.findCutBefore($cursor);
              let textContent = Utils.getNodeContent(view, $cut);
              let beforeNode = null;
              if ($cut.nodeBefore) {
                beforeNode = $cut.nodeBefore;
              }
              if (!textContent.trim() && beforeNode && beforeNode.type.name == "imageContainer") {
                setTimeout(() => {
                  let imageContainerNodeObj = Utils.findNodeWith(view, "imageContainer");
                  let imgCNode = imageContainerNodeObj.node;
                  let imgCPos = imageContainerNodeObj.pos;                  
                  if (imgCNode) {
                    let disp = view.dispatch;
                    let trans =view.state.tr.deleteRange(Math.max(imgCPos-imgCNode.content.size + 1, 0), imgCPos + imgCNode.content.size + 1);
                    let trans2 = trans.scrollIntoView();
                    disp(trans2);
                  }
                }, 0);
              }
            }
    
            return false;
          }
        },
        handleClickOn(view, pos, node, nodePos, event) {
          return true;
          console.log("clickOn" + node);
          if (node.attrs.cls == "imageContainerTextarea") {
            let textAreaDom = view.domAtPos(pos).node.querySelector('.'+node.attrs.cls);
            setTimeout(() => {
              let parentNode = view.domAtPos(pos).node.parentNode;
              // let textAreaDom = parentNode.querySelector('.' + node.attrs.cls);
              if (textAreaDom) {
                // 使 EditorView 失去焦点
                view.dom.blur();
                view.dom.contentEditable = 'false';
    
                // 聚焦到 textarea 元素
                textAreaDom.focus();
    
                // 确保事件传播被正确处理
                // event.preventDefault();
                // event.stopPropagation();
    
                // 绑定 keydown 事件监听器
                textAreaDom.addEventListener('keydown', function (e) {
                  console.log('Keydown event on textarea:', e.key);
                  // 在这里添加更多的事件处理逻辑
    
                  // 阻止事件冒泡到父节点
                  e.stopPropagation();
                });
                textAreaDom.addEventListener('blur', function (e) {
                  console.log('blue event on textarea:', e.key);
                  view.dom.contentEditable = 'true';
                });
              }
            }, 0);

          } else {

          }
          return true;
        },
        handleClick(view, pos, node, event) {
          console.log("click"+node);
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
      doc: DOMParser.fromSchema(ContentSchema).parse(document.querySelector(".contentWrapper")),
      plugins: [
        keymap({
          // 定义一些额外的键盘快捷键，可根据需求调整
          'Mod-z': () => history.undo(state),
          'Mod-y': () => history.redo(state),
        }),
        history(),
        keymap(baseKeymap),  // 添加基础的键盘快捷键，如回车键换行等默认操作
        myPlugin,
        placeholder('请输入正文', 'contentPlaceholderClass'),
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
      }
    });
    viewRef.current = view;
    const insertLocalImage = (params) => {
      InsertImageCommand(view, params.imageLocalPath, ContentSchema);
      setTimeout(() => {
        FocusLastedNode(view);
      }, 200);

    }
    nativeBridge.register('insertLocalImage', insertLocalImage);

    const handlePageClick = (event) => {
      const target = event.target;
      console.log('click--'+event.target.className+'--'+event.currentTarget.className);
      if (target.tagName === 'TEXTAREA') {
        target.focus();
        target.composing = true;
        view.editable = false;
        // view.dom.contentEditable = 'false';
        target.addEventListener('blur', (e) => {
          view.editable= true;
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
      console.log('input--'+event.target.className+'--'+event.currentTarget.className);
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

  return (
    <div className='contentWrapper' ref={editorRef}>

    </div>


  );
};

export default ContentEditor;