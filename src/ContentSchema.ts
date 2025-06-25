import { Schema, Fragment, Node, NodeType, NodeSpec, DOMOutputSpec } from 'prosemirror-model';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { MarkSpec } from 'prosemirror-model';
// 1. 定义下划线、删除线、字体颜色、背景色、字号等 mark
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

// 2. 合并 marks
const allMarks = basicSchema.spec.marks
  .update("underline", underlineMark)
  .update("strike", strikeMark)
  .update("textColor", textColorMark)
  .update("bgColor", bgColorMark)
  .update("fontSize", fontSizeMark);

const ContentSchema = new Schema({
    nodes: addListNodes(basicSchema.spec.nodes, 'paragraph block*', 'block').append({
        imageContainer: {
            content: 'block+',
            group: 'block',
            draggable: false,
            parseDOM: [{
                tag: 'div',
                getAttrs: (dom) => {
                    console.log('containerParse');
                    return ({

                    });
                },
            }],
            toDOM: (node) => {
                let domChildren: DOMOutputSpec[] = [];
                node.content.forEach((childNode: Node) => {
                    if (childNode.type.spec.toDOM) {
                        let childDOM = childNode.type.spec.toDOM(childNode);
                        if (childDOM) {
                            domChildren.push(childDOM);
                        }
                    }
                });
                return ['div', { class: 'imageContainer', }, ...domChildren];
            },
        },
        nestedImage: {
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
            toDOM(node) { let { src, alt, title, cls } = node.attrs; return ["img", { src, alt, title, class: cls }]; }
        },
        nestedParagraph: {
            content: '', // 表示可以包含零个或多个文本节点
            group: 'block',
            attrs: {
                placeholder: { default: '' }, // 定义属性，比如设置placeholder（占位符）属性，可根据实际需求添加更多属性，如rows、cols等
                value: { default: '' }, // 用于存储textarea中的文本值
                cls: { default: '' },
            },
            draggable: false,
            parseDOM: [
                {
                    tag: 'textarea',
                    getAttrs: (dom) => ({
                        placeholder: dom.getAttribute('placeholder'),
                        value: dom.getAttribute('value'), // 获取textarea的value属性值作为节点的对应属性值
                        cls: dom.getAttribute('cls'),
                    })
                }
            ],
            toDOM: (node) => {
                return ['textarea', {
                    placeholder: node.attrs.placeholder,
                    value: node.attrs.value,
                    class: node.attrs.cls
                }, node.attrs.value];
            },
        },
    }),
    marks: allMarks
});

export default ContentSchema;