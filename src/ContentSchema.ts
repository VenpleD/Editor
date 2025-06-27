import { Schema, Fragment, Node, NodeType, NodeSpec, DOMOutputSpec } from 'prosemirror-model';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { NodeView } from 'prosemirror-view';

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
  attrs: {
    src: { default: '' },
    value: { default: '' },
    placeholder: { default: '' },
    cls: { default: '' }
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
        cls: textarea ? textarea.getAttribute('class') : ''
      };
    }
  }],
  toDOM(node) {
    return [
      'div',
      { class: 'imageContainer' },
      ['img', { src: node.attrs.src }],
      ['textarea', {
        value: node.attrs.value,
        placeholder: node.attrs.placeholder,
        class: node.attrs.cls
      }, node.attrs.value]
    ] as const;
  }
};

const nestedImageNode = {
  inline: true,
  attrs: {
    src: { validate: "string" },
    alt: { default: null, validate: "string|null" },
    title: { default: null, validate: "string|null" },
    cls: { default: 'custom-image-class' }
  },
  group: "inline",
  draggable: true,
  parseDOM: [{
    tag: "img[src]", getAttrs(dom) {
      return {
        src: dom.getAttribute("src"),
        title: dom.getAttribute("title"),
        alt: dom.getAttribute("alt")
      };
    }
  }],
  toDOM(node) {
    let { src, alt, title, cls } = node.attrs;
    return ["img", { src, alt, title, class: cls }] as const;
  }
};

const nestedParagraphNode = {
  content: '', // 可以包含零个或多个文本节点
  group: 'block',
  attrs: {
    placeholder: { default: '' },
    value: { default: '' },
    cls: { default: '' },
  },
  draggable: false,
  parseDOM: [
    {
      tag: 'textarea',
      getAttrs: (dom) => ({
        placeholder: dom.getAttribute('placeholder'),
        value: dom.getAttribute('value'),
        cls: dom.getAttribute('cls'),
      })
    }
  ],
  toDOM: (node) => {
    return ['textarea', {
      placeholder: node.attrs.placeholder,
      value: node.attrs.value,
      class: node.attrs.cls
    }, node.attrs.value] as const;
  },
};

// 合并 nodes
const allNodes = addListNodes(basicSchema.spec.nodes, 'paragraph block*', 'block')
  .update("paragraph", paragraphWithAlign)
  .append({
    imageContainer: imageContainerNode,
    nestedImage: nestedImageNode,
    nestedParagraph: nestedParagraphNode
  });

const ContentSchema = new Schema({
  nodes: allNodes,
  marks: allMarks
});

export default ContentSchema;

export class ImageContainerView implements NodeView {
  dom: HTMLElement;
  constructor(node, view, getPos) {
    // 创建外层 div
    this.dom = document.createElement('div');
    this.dom.className = 'imageContainer';

    // 创建 img
    const img = document.createElement('img');
    img.src = node.attrs.src || '';
    img.className = node.attrs.cls || 'custom-image-class';
    this.dom.appendChild(img);

    // 创建 textarea
    const textarea = document.createElement('textarea');
    textarea.value = node.attrs.value || '';
    textarea.placeholder = node.attrs.placeholder || '';
    textarea.className = node.attrs.cls || '';
    textarea.addEventListener('input', (e) => {
      // 更新节点属性
      const tr = view.state.tr.setNodeMarkup(getPos(), undefined, {
        ...node.attrs,
        value: textarea.value
      });
      view.dispatch(tr);
    });
    this.dom.appendChild(textarea);
  }
}