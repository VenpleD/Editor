import { Plugin } from 'prosemirror-state';
import { insertImageCommand } from './Commands.js';

const ImagePlugin = new Plugin({
    props: {
        // handleClick: (view, pos, event) => {
        //     const target = event.target;
        //     if (target.tagName === 'IMG') {
        //         // 这里可以添加点击图片后的相关操作逻辑，比如显示图片编辑菜单等，暂时先不详细展开
        //         return false;
        //     }
        //     return false;
        // },
        // handleDrop: (view, event) => {
        //     const items = event.dataTransfer.items;
        //     for (let i = 0; i < items.length; i++) {
        //         const item = items[i];
        //         if (item.kind === 'file') {
        //             const file = item.getAsFile();
        //             if (file.type.startsWith('image/')) {
        //                 const reader = new FileReader();
        //                 reader.onload = (e) => {
        //                     const imageUrl = e.target.result;
        //                     insertImageCommand(view, imageUrl);
        //                 };
        //                 reader.readAsDataURL(file);
        //                 return true;
        //             }
        //         }
        //     }
        //     return false;
        // },
        // handlePaste: (view, event) => {
        //     const clipboardData = event.clipboardData;
        //     const items = clipboardData.items;
        //     for (let i = 0; i < items.length; i++) {
        //         const item = items[i];
        //         if (item.kind === 'file') {
        //             const file = item.getAsFile();
        //             if (file.type.startsWith('image/')) {
        //                 const reader = new FileReader();
        //                 reader.onload = (e) => {
        //                     const imageUrl = e.target.result;
        //                     insertImageCommand(view, imageUrl);
        //                 };
        //                 reader.readAsDataURL(file);
        //                 return true;
        //             }
        //         }
        //     }
        //     return false;
        // },
        // keyBindings: {
        //     'Ctrl-Enter': (view) => {
        //         const imageUrl = prompt('请输入图片链接：');
        //         if (imageUrl) {
        //             insertImageCommand(view, imageUrl);
        //             return true;
        //         }
        //         return false;
        //     }
        // }
    }
});

export default ImagePlugin;