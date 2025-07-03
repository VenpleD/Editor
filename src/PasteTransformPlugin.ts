import { Plugin } from "prosemirror-state";
import { DOMParser, Node as ProseMirrorNode, Schema, Slice, Fragment } from "prosemirror-model";
import ContentSchema from "./ContentSchema.ts";
import { GlobalConstants } from "./Global.ts";
import { splitBlock } from "prosemirror-commands";
import TransactionCallbackManager from "./TransactionCallbackManager.ts";

// 遍历并替换 image 节点为 imageContainer
function transformImagesToImageContainer(node: ProseMirrorNode, schema: Schema): ProseMirrorNode | ProseMirrorNode[] {
  if (node.type.name === "image") {
    return schema.nodes.imageContainer.create({
      src: node.attrs.src,
      upload_id: Date.now().toString(),
      placeholder: GlobalConstants.imageContainerTextareaPlaceholder,
      cls: GlobalConstants.imageContainerTextareaCls,
      imgCls: GlobalConstants.imageContainerImgCls,
    });
  }
  if (node.childCount === 0) return node;

  // 递归处理所有子节点
  const children: ProseMirrorNode[] = [];
  node.content.forEach(child => {
    const result = transformImagesToImageContainer(child, schema);
    if (Array.isArray(result)) {
      children.push(...result);
    } else {
      children.push(result);
    }
  });

  // 如果当前是 paragraph，且唯一子节点是 imageContainer，则“提升”出去
  if (
    node.type.name === "paragraph" &&
    children.length === 1 &&
    children[0].type.name === "imageContainer"
  ) {
    return children[0];
  }

  return node.type.create(node.attrs, Fragment.fromArray(children), node.marks);
}

function cleanHtml(html: string): string {
  const dom = document.createElement("div");
  dom.innerHTML = html;

  // 移除所有 <style> 和 <script> 标签
  dom.querySelectorAll("style,script,meta").forEach(el => el.remove());

  // 递归移除所有节点的 style、class、id、data-* 属性
  function cleanNode(node: Element) {
    node.removeAttribute("style");
    node.removeAttribute("class");
    node.removeAttribute("id");
    // 移除所有 data-* 属性
    Array.from(node.attributes)
      .filter(attr => attr.name.startsWith("data-"))
      .forEach(attr => node.removeAttribute(attr.name));
    // 递归处理子节点
    node.childNodes.forEach(child => {
      if (child.nodeType === 1) cleanNode(child as Element);
    });
  }
  dom.querySelectorAll("*").forEach(cleanNode);

  return dom.innerHTML;
}

export default function createPasteTransformPlugin() {
  return new Plugin({
    props: {
      handlePaste(view, event, slice) {
        const clipboardData = event.clipboardData;
        if (clipboardData && clipboardData.types.includes("text/html")) {
          const html = clipboardData.getData("text/html");
          const cleanedHtml = cleanHtml(html);
          const dom = document.createElement("div");
          dom.innerHTML = cleanedHtml;
          const parser = DOMParser.fromSchema(ContentSchema);
          const parsed = parser.parse(dom);
          const transformed = transformImagesToImageContainer(parsed, ContentSchema);

          // 关键：粘贴前 splitBlock，避免包裹
          splitBlock(view.state, view.dispatch);

          // 可能返回单个节点或数组，统一处理
          const nodes = Array.isArray(transformed) ? transformed : [transformed];
          const slice = new Slice(Fragment.fromArray(nodes), 0, 0);
          const tr = view.state.tr.replaceSelection(slice);
          view.dispatch(tr);
          TransactionCallbackManager.add((updateState, updateView) => {
            view.dispatch(view.state.tr.scrollIntoView());
          });
          return true; // 阻止默认粘贴
        }
        return false;
      }
    }
  });
}