import { Schema, Fragment, Node, NodeType, NodeSpec, DOMOutputSpec } from 'prosemirror-model';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { NodeView } from 'prosemirror-view';

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
    marks: basicSchema.spec.marks
});

export default ContentSchema;