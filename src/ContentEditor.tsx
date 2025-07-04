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
import NativeBridge from './NativeBridge.ts';
import CreateCursorInfoPlugin from './CursorInfoPlugin.ts';
import ImagePlugin from './ImagePlugin.ts';
import { ImageContainerView } from './ContentSchema.ts';
import TransactionCallbackManager from './TransactionCallbackManager.ts';
import AppManager from './AppManager.ts';
import { GlobalConstants } from './Global.ts';
import createPasteTransformPlugin from './PasteTransformPlugin.ts';
import { splitListItem } from 'prosemirror-schema-list';

const ContentEditor = () => {
  const editorRef = useRef(null);
  const viewRef = useRef<EditorView | null>(null)
  NativeBridge.getInstance().setContentViewRef(viewRef);
  AppManager.contentViewRef = viewRef;
  // var prosemirrorState = require('prosemirror-state');

  var backspaceKey = new PluginKey("'backspace'");
  useEffect(() => {
    const state = EditorState.create({
      doc: DOMParser.fromSchema(ContentSchema).parse(document.querySelector(".contentWrapper")!),
      plugins: [
        ImagePlugin,
        history(),
        keymap({
          "Enter": splitListItem(ContentSchema.nodes.list_item)
        }),
        keymap(baseKeymap),  // 添加基础的键盘快捷键，如回车键换行等默认操作        
        placeholder('请输入正文', 'contentPlaceholderClass'),
        CreateCursorInfoPlugin(NativeBridge.getInstance()),
        new Plugin({
          props: {
            handleDOMEvents: {
              click(view: EditorView, event: MouseEvent): boolean {
                event.stopPropagation();
                return false;
              }
            },
            handleClick(view, pos, event) {
              const target = event.target as HTMLElement;
              if (target.classList.contains(GlobalConstants.imageContainerTextareaCls)) {
                NativeBridge.getInstance().asyncCurrentTarget('textarea', { a: "1" });
              } else if (target.closest(GlobalConstants.imageContainerCls)) {
                NativeBridge.getInstance().asyncCurrentTarget('image');
              } else {
                NativeBridge.getInstance().asyncCurrentTarget('content');
              }

              return false;
            }
          }
        }),
        createPasteTransformPlugin(),
      ]
    });
    // 创建编辑器视图并挂载到DOM元素上
    const view = new EditorView(editorRef.current, {
      state,
      nodeViews: {
        imageContainer(node, view, getPos) {
          return new ImageContainerView(node, view, getPos);
        }
      },
      dispatchTransaction: (transaction) => {
        const newState = view.state.apply(transaction);
        view.updateState(newState);
        /// DOM渲染2次之后，执行callBack操作
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              TransactionCallbackManager.runAll(newState, view);
            });
          });
        });

      },
      attributes: {
        id: 'editor-view-id' // 设置 EditorView 的 id
      }
    });
    viewRef.current = view;
    return () => {
      view.destroy();
    };
  }, []);
  return (
    <div className='contentWrapper' ref={editorRef}></div>
  );
};

export default ContentEditor;