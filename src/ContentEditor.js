import React, { useRef, useEffect } from 'react';
import { EditorState, Plugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema, DOMParser } from 'prosemirror-model';
import { schema as basicSchema } from "prosemirror-schema-basic"
import { addListNodes } from 'prosemirror-schema-list';
import { keymap } from 'prosemirror-keymap';
import { history } from 'prosemirror-history';
import { baseKeymap } from 'prosemirror-commands';
import placeholder from './Placeholder/placeholder';
import NativeBridge from './NativeBridge';
import ContentSchema from './ContentSchema';
import ImagePlugin from './ImagePlugin';
import { insertImageCommand } from './Commands';
import { TextareaPlugin } from './TextareaPlugin';

// 扩展基本的schema以包含列表相关节点
// const mySchema = new Schema({
//   nodes: addListNodes(basicSchema.spec.nodes, 'paragraph block*', 'block'),
//   marks: basicSchema.spec.marks
// });
// const mySchema = new Schema({
//     nodes: {
//         // 文档顶层节点，必须有
//         doc: {
//             // 内容由0个或者多个text节点组成
//             content: 'text*'
//         },
//         // text 节点
//         text: {}
//     }
// })
const ContentEditor = () => {
  const editorRef = useRef(null);
  const nativeBridge = new NativeBridge();

  useEffect(() => {
    // const textContentArray = '初始内容，在这里输入文本'.split(' ');
    // 使用Fragment来构建段落节点内容
    // const fragment = basicSchema.nodes.text? basicSchema.nodes.text.createFragment(textContentArray.map(word => basicSchema.nodes.text.createChecked(word))) : Fragment.empty;
    // 创建初始的编辑器状态
    let myPlugin = new Plugin({
      canEdit: true,
      props: {
        handleClickOn(view, pos, node, nodePos, event) {
          console.log("clickOn" + node);
          if (node.attrs.cls == "imageContainerTextarea") {
            let textAreaDom = view.domAtPos(pos).node.querySelector('.'+node.attrs.cls);
            if (textAreaDom) {
              setTimeout(() => {
                view.dom.blur();
                view.dom.contentEditable = 'false';
                
            //     textAreaDom.focus();
            //     // 确保事件传播被正确处理
            // event.preventDefault();
            // event.stopPropagation();
                // setTimeout(() => {
                  
                // }, 0);
              }, 0);
              return false;
              // view.dom.composing = false;
              // textAreaDom.focus();
              // textAreaDom.composing = true;
              // event.stopPropagation();
            }

          } else {

          }
          return true;
        },
        handleClick(view, pos, node, event) {
          console.log("click"+node);
        },
        handleKeyDown(view, event) {
          console.log("A key was pressed!");
          return false;
        },
        editable(state) { 
          console.log("editable"+this.canEdit);
          return this.canEdit;
        }
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
    const insertLocalImage = (params) => {
      console.log('---' + params + '----');
      insertImageCommand(view, params.imageLocalPath, ContentSchema);

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