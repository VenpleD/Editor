import { EditorView } from "prosemirror-view";
import { DOMSerializer, Node as ProseMirrorNode } from "prosemirror-model";
import UploadManager from "./UploadSource/UploadManager.ts";
import { GolobalConstants } from "./Global.ts";
import { EditorState } from "prosemirror-state";
import NativeBridge from "./NativeBridge.ts";

class AppManager {
    public titleViewRef: React.RefObject<EditorView | null> | null = null;
    public contentViewRef: React.RefObject<EditorView | null> | null = null;
    public setLoading: ((loading: boolean) => void) | null = null;

    public async handleNextStep() {
        // NativeBridge.getInstance().pushDetailPage('<div class=\"imageContainer\"><img src=\"https://img.dingnews.net/image/20250702/BCE9EDAE-B61E-4B53-B730-CD34D8256146.jpg\" upload_id=\"1751439622109\" class=\"customImage\"><textarea value=\"\" placeholder=\"请输入内容\" class=\"imageContainerTextarea\"></textarea></div><p style=\"text-align: center\"><strong><span style=\"font-size: 0.74rem\">一次又不一样不开心我真的不想吃</span></strong></p><p style=\"text-align: left\">不想要一个人</p><p style=\"text-align: left\"></p><p style=\"text-align: left\"></p><p style=\"text-align: left\">也不<em><strong><u>要想什么就做吧……也不能为任何</u></strong></em></p><p style=\"text-align: left\"></p><p style=\"text-align: left\"><em><strong><u>在</u></strong></em>下楼梯面前又一个人也在</p><p style=\"text-align: left\">这里就是你最</p>');
        if (!this.titleViewRef || !this.contentViewRef) return;

        const titleView = this.titleViewRef.current;
        const contentView = this.contentViewRef.current;

        if (!titleView || !contentView) return;

        if (this.setLoading) this.setLoading(true);
        try {
            let result = await UploadManager.settingClient();
            if (!result) {
                console.error("Failed to set TOS client");
                return;
            }
            // 1. 收集所有本地图片
            const imageList = this.getAllImageContainerIdsAndSrcs(contentView.state.doc);
            if (imageList.length === 0) {
                this.setLoading?.(false);
                return;
            }

            // 2. 上传所有图片，记录 upload_id -> 新url
            const idToUrl: { [upload_id: string]: string } = {};
            for (const { upload_id, src } of imageList) {
                try {
                    const newUrl = await UploadManager.addToQueue(src);
                    if (typeof newUrl === "string") {
                        idToUrl[upload_id] = newUrl;
                    } else {
                        console.error("UploadManager.addToQueue did not return a URL string", src, newUrl);
                    }
                } catch (e) {
                    console.error("上传失败", src, e);
                }
            }

            // 3. 替换文档中的 src
            this.replaceImageSrcsById(contentView, idToUrl);
            // Perform actions with titleView and contentView

            let htmlContent = this.getContentHtml(contentView);
            // 4. 获取半个文档内容
            const halfDoc = this.getHalfDocByNode(contentView.state.doc);
            const halfHtmlContent = this.getContentHtml(new EditorView(null, {
                state: EditorState.create({
                    doc: halfDoc,
                    schema: contentView.state.schema,
                    plugins: contentView.state.plugins
                })
            }));
            // 5. 获取标题内容
            const titleHtml = this.getContentHtml(titleView);
            NativeBridge.getInstance().pushDetailPage(htmlContent);
            setTimeout(() => {
                NativeBridge.getInstance().pushDetailPage(halfHtmlContent);
            }, 500);

        } finally {
            if (this.setLoading) this.setLoading(false);
        }
    }

    private replaceImageSrcsById(view: EditorView, idToUrl: { [upload_id: string]: string }) {
        const { state } = view;
        let tr = state.tr;
        state.doc.descendants((node, pos) => {
            if (node.type.name === "imageContainer" && node.attrs.upload_id && idToUrl[node.attrs.upload_id]) {
                tr = tr.setNodeMarkup(pos, undefined, {
                    ...node.attrs,
                    src: idToUrl[node.attrs.upload_id]
                });
            }
            return true;
        });
        if (tr.docChanged) {
            view.dispatch(tr);
        }
    }

    private getAllImageContainerIdsAndSrcs(doc: ProseMirrorNode): Array<{ pos: number, upload_id: string, src: string }> {
        const imageContainers: Array<{ pos: number, upload_id: string, src: string }> = [];
        doc.descendants((node, pos) => {
            if (node.type.name === GolobalConstants.imageContainerCls) {
                const uploadId = node.attrs["upload_id"];
                const src = node.attrs["src"];
                if (uploadId && src) {
                    imageContainers.push({ pos, upload_id: uploadId, src });
                }
            }
        });
        return imageContainers;
    }
    // 获取半个文档的内容
    public getHalfDocByNode(node: ProseMirrorNode): ProseMirrorNode {
        const totalSize = node.content.size;
        let currentSize = 0;
        const children: ProseMirrorNode[] = [];

        node.forEach((child, offset, index) => {
            if (currentSize >= totalSize / 2) return;

            // 如果加上这个子节点会超过一半，并且子节点有内容，可以递归分割
            const childSize = child.nodeSize; // 用 nodeSize 统计

            if (currentSize + childSize > totalSize / 2 && child.childCount > 0) {
                const halfChild = this.getHalfDocByNode(child);
                children.push(halfChild);
                currentSize += halfChild.nodeSize;
            } else {
                children.push(child);
                currentSize += childSize;
            }
        });

        return node.type.create(node.attrs, children.length > 0 ? children : node.content, node.marks);
    }
    // 获取当前编辑器内容的 HTML
    private getContentHtml(view: EditorView): string {
        const serializer = DOMSerializer.fromSchema(view.state.schema);
        const fragment = serializer.serializeFragment(view.state.doc.content);
        const div = document.createElement("div");
        div.appendChild(fragment);
        return div.innerHTML;
    }
}

export default new AppManager();