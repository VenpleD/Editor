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
import CreateCursorInfoPlugin from './CursorInfoPlugin.ts';
import ImagePlugin from './ImagePlugin.ts';

const ContentEditor = () => {
  const editorRef = useRef(null);
  const viewRef = useRef<EditorView | null>(null)
  const nativeBridge = new NativeBridge(viewRef);
  // var prosemirrorState = require('prosemirror-state');

  var backspaceKey = new PluginKey("'backspace'");
  useEffect(() => {
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
        ImagePlugin,
        placeholder('请输入正文', 'contentPlaceholderClass'),
        CreateCursorInfoPlugin(nativeBridge)
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
    return () => {
      view.destroy();
    };
  }, []);
  return (
    <div>
      <div className='contentWrapper' ref={editorRef}></div>
    </div>
  );
};

export default ContentEditor;