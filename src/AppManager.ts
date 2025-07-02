import { EditorView } from "prosemirror-view";
import { DOMSerializer, Node as ProseMirrorNode } from "prosemirror-model";
import UploadManager from "./UploadSource/UploadManager.ts";
import { GolobalConstants } from "./Global.ts";

class AppManager {
    public titleViewRef: React.RefObject<EditorView | null> | null = null;
    public contentViewRef: React.RefObject<EditorView | null> | null = null;
    public setLoading: ((loading: boolean) => void) | null = null;

    public async handleNextStep() {
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
        const halfSize = Math.ceil(node.nodeSize / 2);
        let currentSize = 0;
        const children: ProseMirrorNode[] = [];
        node.forEach((child) => {
            if (currentSize < halfSize) {
                children.push(child);
                currentSize += child.nodeSize;
            }
        });
        // 创建一个新的 node，类型与原 node 相同，内容为前半部分的子节点
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