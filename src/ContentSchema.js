import { Schema, Fragment } from 'prosemirror-model';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';

import { NodeView } from 'prosemirror-view';

const ContentSchema = new Schema({
    nodes: addListNodes(basicSchema.spec.nodes, 'paragraph block*', 'block').append({
        imageContainer: {
            content: 'block+',
            group: 'block',
            draggable: false,
            parseDOM: [
                {
                    tag: 'div',
                    getAttrs: (dom) => {
                        console.log('containerParse');
                        return ({
                        });
                    },
                }
            ],
            toDOM: (node) => {
                const domChildren = [];
                const childNodes = node.content.content;
                for (const childNode of childNodes) {
                    const childDOM = childNode.type.spec.toDOM(childNode);
                    if (childDOM) {
                        domChildren.push(childDOM);
                    }
                }
                let result = ['div', ...domChildren];
                return ['div', {class: 'imageContainer', 'contenteditable': 'false', 'draggable': 'false'}, 0];
            },
        },
        nestedImage: {
            attrs: {
                src: {}
            },
            inline: false,
            group: 'block',
            parseDOM: [{
                tag: 'img',
                getAttrs: (dom) => ({
                    src: dom.getAttribute('src')
                })
            }],
            toDOM: (node) => ['img', { src: node.attrs.src, class: 'custom-image-class' }]
        },
        nestedParagraph: {
            content: '', // 表示可以包含零个或多个文本节点
            group: 'block',
            attrs: {
                placeholder: { default: '' }, // 定义属性，比如设置placeholder（占位符）属性，可根据实际需求添加更多属性，如rows、cols等
                value: { default: '' }, // 用于存储textarea中的文本值
                cls: { default: ''}
            },
            draggable: false,
            parseDOM: [
                {
                    tag: 'textarea',
                    getAttrs: (dom) => ({
                        placeholder: dom.getAttribute('placeholder'),
                        value: dom.value, // 获取textarea的value属性值作为节点的对应属性值
                        cls: dom.cls
                    })
                }
            ],
            toDOM: (node) => {
                return ['textarea', {
                    placeholder: node.attrs.placeholder,
                    value: node.attrs.value,
                    class: node.attrs.cls
                }, 0];
            },
        },
        // image: {
        //     attrs: {
        //         src: {}
        //     },
        //     inline: false,
        //     group: 'block',
        //     draggable: true,
        //     parseDOM: [
        //         {
        //             tag: 'img',
        //             getAttrs: (dom) => ({
        //                 src: dom.getAttribute('src')
        //             })
        //         }
        //     ],
        //     toDOM: (node) => ['img', { src: node.attrs.src, class: 'custom-image-class'}]
        // }
    }),
    marks: basicSchema.spec.marks
});

export default ContentSchema;