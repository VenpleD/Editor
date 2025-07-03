import { Schema, Fragment, Node, NodeType, NodeSpec, DOMOutputSpec } from 'prosemirror-model';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { NodeView } from 'prosemirror-view';
import NativeBridge from './NativeBridge.ts';
import { GlobalConstants } from './Global.ts';

// 1. 定义所有 marks
const underlineMark = {
  parseDOM: [
    { tag: "u" },
    { style: "text-decoration=underline" }
  ],
  toDOM() { return ["u", 0] as const; }
};

const strikeMark = {
  parseDOM: [
    { tag: "s" },
    { tag: "del" },
    { style: "text-decoration=line-through" }
  ],
  toDOM() { return ["s", 0] as const; }
};

const textColorMark = {
  attrs: { color: {} },
  parseDOM: [
    {
      style: "color",
      getAttrs: value => ({ color: value })
    }
  ],
  toDOM(mark) {
    return ["span", { style: `color: ${mark.attrs.color}` }, 0] as const;
  }
};

const bgColorMark = {
  attrs: { bgColor: {} },
  parseDOM: [
    {
      style: "background-color",
      getAttrs: value => ({ bgColor: value })
    }
  ],
  toDOM(mark) {
    return ["span", { style: `background-color: ${mark.attrs.bgColor}` }, 0] as const;
  }
};

const fontSizeMark = {
  attrs: { fontSize: {} },
  parseDOM: [
    {
      style: "font-size",
      getAttrs: value => ({ fontSize: value })
    }
  ],
  toDOM(mark) {
    return ["span", { style: `font-size: ${mark.attrs.fontSize}` }, 0] as const;
  }
};

// 合并 marks
const allMarks = basicSchema.spec.marks
  .update("underline", underlineMark)
  .update("strike", strikeMark)
  .update("textColor", textColorMark)
  .update("bgColor", bgColorMark)
  .update("fontSize", fontSizeMark);

// 2. 定义所有 nodes
// 扩展 paragraph，支持 align 属性
const paragraphWithAlign = {
  ...basicSchema.spec.nodes.get("paragraph"),
  attrs: {
    ...(basicSchema.spec.nodes.get("paragraph")?.attrs || {}),
    align: { default: "left" }
  },
  parseDOM: [
    {
      tag: "p",
      getAttrs(dom: HTMLElement) {
        return { align: dom.style.textAlign || dom.getAttribute("align") || "left" };
      }
    }
  ],
  toDOM(node: any) {
    const { align } = node.attrs;
    return ["p", { style: `text-align: ${align}` }, 0] as const;
  }
};

// 其它自定义节点
const imageContainerNode = {
  group: 'block',
  draggable: false,
  selectable: false,
  attrs: {
    src: { default: '' },
    value: { default: '' },
    placeholder: { default: '' },
    cls: { default: '' },
    imgCls: { default: GlobalConstants.imageContainerImgCls },
    upload_id: { default: '' }
  },
  parseDOM: [{
    tag: 'div.imageContainer',
    getAttrs(dom) {
      const img = dom.querySelector('img');
      const textarea = dom.querySelector('textarea');
      return {
        src: img ? img.getAttribute('src') : '',
        value: textarea ? textarea.value : '',
        placeholder: textarea ? textarea.getAttribute('placeholder') : '',
        cls: textarea ? textarea.getAttribute('class') : '',
        upload_id: img ? img.getAttribute('upload_id') || '' : '',
        imgCls: img ? img.getAttribute('class') || '' : ''
      };
    }
  }],
  toDOM(node) {
    return [
      'div',
      { class: GlobalConstants.imageContainerCls },
      ['img', { 
        src: node.attrs.src,
        upload_id: node.attrs.upload_id,
        class: node.attrs.imgCls
      }],
      ['textarea', {
        value: node.attrs.value,
        placeholder: node.attrs.placeholder,
        class: node.attrs.cls
      }, node.attrs.value]
    ] as const;
  }
};

// 合并 nodes
const allNodes = addListNodes(basicSchema.spec.nodes, 'paragraph block*', 'block')
  .update("paragraph", paragraphWithAlign)
  .append({
    imageContainer: imageContainerNode,
  });

// 关键：doc 节点的 content 要包含 imageContainer
const nodesWithDoc = allNodes.update("doc", {
  content: "(paragraph | imageContainer | heading | blockquote | ordered_list | bullet_list | code_block | horizontal_rule)*"
});

const ContentSchema = new Schema({
  nodes: nodesWithDoc,
  marks: allMarks
});

export default ContentSchema;

export class ImageContainerView implements NodeView {
  dom: HTMLElement;

  constructor(node, view, getPos) {
    // 创建外层 div
    this.dom = document.createElement('div');
    this.dom.className = GlobalConstants.imageContainerCls;
    this.dom.contentEditable = "false"; // 关键！

    // 创建 img
    const img = document.createElement('img');
    img.src = node.attrs.src || '';
    img.className = node.attrs.imgCls || GlobalConstants.imageContainerImgCls;
    img.setAttribute('upload_id', node.attrs.upload_id || '');
    img.setAttribute('referrerpolicy', 'no-referrer'); // 避免跨域问题
    this.dom.appendChild(img);

    // 创建 textarea
    const textarea = document.createElement('textarea');
    textarea.value = node.attrs.value || '';
    textarea.placeholder = node.attrs.placeholder || '';
    textarea.className = node.attrs.cls || '';
    textarea.addEventListener('click', (e) => {
      NativeBridge.getInstance().asyncCurrentTarget('textarea');
    });
    this.dom.appendChild(textarea);
  }

  // 关键：阻止 ProseMirror 处理 textarea 的事件
  stopEvent(event: Event) {
    return event.target instanceof HTMLTextAreaElement;
  }
}