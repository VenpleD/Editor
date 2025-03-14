import React, { useRef, useEffect, useState } from 'react';
import { EditorState, Plugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema, DOMParser } from 'prosemirror-model';
import { schema as basicSchema } from "prosemirror-schema-basic"
import { addListNodes } from 'prosemirror-schema-list';
import { keymap } from 'prosemirror-keymap';
import { history } from 'prosemirror-history';
import { baseKeymap } from 'prosemirror-commands';
import placeholder from './Placeholder/placeholder';
import NativeBridge from './NativeBridge.js';

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

// const ArticleTitle = () => {
//     const editorRef = useRef(null);

//     const [showPrompt, setShowPrompt] = useState(false); // 用于控制提示框是否显示
//     const [promptText, setPromptText] = useState(''); // 用于存储提示框的文本内容

//     useEffect(() => {
//         // const textContentArray = '初始内容，在这里输入文本'.split(' ');
//         // 使用Fragment来构建段落节点内容
//         // const fragment = basicSchema.nodes.text? basicSchema.nodes.text.createFragment(textContentArray.map(word => basicSchema.nodes.text.createChecked(word))) : Fragment.empty;
//         // 创建初始的编辑器状态
//         var myParser = DOMParser.fromSchema(mySchema);
//         console.log(myParser);
//         let myPlugin = new Plugin({
//             props: {
//                 // handleKeyDown(view, event) {
//                 //     console.log("A key was pressed!");
//                 //     return false;
//                 // },
//                 // handleTextInput(view, from, to, text) {
//                 //     console.log("A key was input!");
//                 //     if (text === 'a') {
//                 //         return true;
//                 //     }
//                 //     return false;
//                 // }
//             }
//         })
//         const state = EditorState.create({
//             doc: DOMParser.fromSchema(mySchema).parse(document.querySelector(".titleWrapper")),
//             plugins: [
//                 keymap({
//                     // 定义一些额外的键盘快捷键，可根据需求调整
//                     'Mod-z': () => history.undo(state),
//                     'Mod-y': () => history.redo(state),
//                 }),
//                 history(),
//                 keymap(baseKeymap),  // 添加基础的键盘快捷键，如回车键换行等默认操作
//                 myPlugin,
//                 placeholder('请输入标题（2~30个字）', 'titlePlaceholderClass'),
//             ]
//         });

//         // 创建编辑器视图并挂载到DOM元素上
//         const view = new EditorView(editorRef.current, {
//             state,
//             dispatchTransaction: (transaction) => {
//                 const newState = view.state.apply(transaction);
//                 view.updateState(newState);
//                 const contentLength = newState.doc.textContent.length;
//                 if (contentLength > 30) {
//                     setShowPrompt(true);
//                     setPromptText(`内容已超过 30 个字符，当前字符数：${contentLength}`);
//                 } else {
//                     setShowPrompt(false);
//                 }
//             }
//         });

//         return () => {
//             view.destroy();
//         };
//     }, []);

//     return (
//         <div className='titleWithPromptWrapper'>
//             <div className='titleWrapper' ref={editorRef}>

//             </div>
//             {showPrompt && (
//                 <div class="promptBox">
//                     <p>{promptText}</p>
//                 </div>
//             )}
//         </div>

//     );
// };

// export default ArticleTitle;