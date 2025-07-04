import { Fragment, MarkType, Schema, Slice, Node as ProseMirrorNode } from "prosemirror-model";
import Utils from "./Utils.ts";
import UseTypeChecker from "./Object.js";
import { EditorState, NodeSelection, Selection, TextSelection, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import ContentSchema from "./ContentSchema.ts";
import { toggleMark, setBlockType, wrapIn, lift } from "prosemirror-commands";
import GlobalStyle, { GlobalConstants } from "./Global.ts";
import TransactionCallbackManager from './TransactionCallbackManager.ts';
import { redo, undo } from "prosemirror-history";
import { liftListItem, wrapInList } from "prosemirror-schema-list";


type FontFunction = {
    bold: (view: EditorView) => (Boolean);
    underline: (view: EditorView) => (Boolean);
    italic: (view: EditorView) => (Boolean);
    strike: (view: EditorView) => (Boolean);
    textColor: (view: EditorView, color: string) => (Boolean);
    bgColor: (view: EditorView, bgColor: string) => (Boolean);
    fontSize: (view: EditorView, fontSize: string) => (Boolean);
    align: (view: EditorView, align: string) => (Boolean);
}

export const FontCommand: FontFunction = {
    bold: (view: EditorView) => {
        const markType = ContentSchema.marks.strong;
        if (markType) {
            toggleMark(markType)(view.state, view.dispatch, view);
            return true;
        }
        return false;
    },
    underline: (view: EditorView) => {
        const markType = ContentSchema.marks.underline;
        if (markType) {
            toggleMark(markType)(view.state, view.dispatch, view);
            return true;
        }
        return false;
    },
    italic: (view: EditorView) => {
        const markType = ContentSchema.marks.em;
        if (markType) {
            toggleMark(markType)(view.state, view.dispatch, view);
            return true;
        }
        return false;
    },
    strike: (view: EditorView) => {
        const markType = ContentSchema.marks.strike || ContentSchema.marks.strikethrough;
        if (markType) {
            toggleMark(markType)(view.state, view.dispatch, view);
            return true;
        }
        return false;
    },
    textColor: (view: EditorView, color: string) => {
        const markType = ContentSchema.marks.textColor;
        if (markType) {
            setMark(markType, { color })(view.state, view.dispatch);
            return true;
        }
        return false;
    },
    bgColor: (view: EditorView, bgColor: string) => {
        const markType = ContentSchema.marks.bgColor || ContentSchema.marks.backgroundColor;
        if (markType) {
            setMark(markType, { bgColor })(view.state, view.dispatch);
            return true;
        }
        return false;
    },
    fontSize: (view: EditorView, fontSize: string) => {
        const markType = ContentSchema.marks.fontSize;
        if (!markType) return false;
        setMark(markType, { fontSize: GlobalStyle.convertToRem(Number(fontSize)) + 'rem' })(view.state, view.dispatch);
        return true;
    },
    align: (view: EditorView, align: string) => {
        const { state, dispatch } = view;
        const { schema } = state;
        const paragraph = schema.nodes.paragraph;
        if (!paragraph) return false;
        setBlockType(paragraph, { align })(state, dispatch);
        return true;
    }
};

export const PgcCommand = {
    settingH1: (view: EditorView, className: string) => {
        let { state, dispatch } = view;
        const { schema, selection } = state;
        const h1 = schema.nodes.heading;
        if (!h1) return false;

        let { from, to, empty } = selection;
        if (empty) {
            const $from = state.selection.$from;
            from = $from.start();
            to = $from.end();
        }

        // 1. 先移除所有 mark
        let tr = removeAllMarks(state.tr, schema, from, to);
        dispatch(tr);

        // 2. 如果在 blockquote 内，先提升
        downgradeToParagraph(view);


        // 3. setBlockType 为 h1（用最新的 view.state）
        setBlockType(h1, { level: 1, class: className })(view.state, dispatch);
        return true;
    },

    setBlockquote: (view: EditorView, className: string) => {
        let { state, dispatch } = view;
        const { schema, selection } = state;
        const blockquote = schema.nodes.blockquote;
        if (!blockquote) return false;

        let { from, to, empty } = selection;
        if (empty) {
            const $from = state.selection.$from;
            from = $from.start();
            to = $from.end();
        }

        // 1. 先移除所有 mark
        let tr = removeAllMarks(state.tr, schema, from, to);
        dispatch(tr);

        // 2. 如果在 blockquote 内，先提升
        // setParagraph(view, from, to);
        downgradeToParagraph(view);

        // 3. wrapIn blockquote
        return wrapIn(blockquote, { class: className })(view.state, view.dispatch);
    },

    setBulletList: (view: EditorView) => {
        const { state, dispatch } = view;
        const { schema, selection } = state;
        const bulletList = schema.nodes.bullet_list;
        if (!bulletList) return false;

        let { from, to, empty } = selection;
        if (empty) {
            const $from = state.selection.$from;
            from = $from.start();
            to = $from.end();
        }

        // 1. 先移除所有 mark
        let tr = removeAllMarks(state.tr, schema, from, to);
        dispatch(tr);

        // 先移除 blockquote/heading 等
        downgradeToParagraph(view);

        // 包裹为无序列表，带 class
        return wrapInList(bulletList, { class: GlobalConstants.bulletListCls })(view.state, dispatch);
    },

    setOrderedList: (view: EditorView) => {
        const { state, dispatch } = view;
        const { schema, selection } = state;
        const orderedList = schema.nodes.ordered_list;
        if (!orderedList) return false;

        let { from, to, empty } = selection;
        if (empty) {
            const $from = state.selection.$from;
            from = $from.start();
            to = $from.end();
        }

        // 1. 先移除所有 mark
        let tr = removeAllMarks(state.tr, schema, from, to);
        dispatch(tr);

        // 先移除 blockquote/heading 等
        downgradeToParagraph(view);

        // 包裹为有序列表，带 class
        return wrapInList(orderedList, { class: GlobalConstants.orderedListCls })(view.state, dispatch);
    },
};

export const FocusImageNextNode = (view: EditorView, node: ProseMirrorNode) => {
    const { state, dispatch } = view;
    const { tr } = state;
    let nextNode = Utils.findNextNode(state, node);
    dispatch(
        tr.setSelection(TextSelection.create(tr.doc, nextNode.posIndex + 1)).scrollIntoView()
    );
}

export const InsertImageCommand = (view: EditorView, imageUrl: string, currentSchema: Schema) => {
    const { state, dispatch } = view;
    const { tr, selection } = state;
    const { $from, $to, empty } = selection;

    // 判断当前段落是否为空段落
    const isEmptyParagraph = $from.parent.isTextblock && $from.parent.content.size === 0;

    // 判断光标/选区右侧是否有内容
    const rightHasContent = !empty
        ? $to.parentOffset < $to.parent.content.size
        : $from.parentOffset < $from.parent.content.size;

    // 判断是否在段落开头插入
    const atLeft = $from.parentOffset === 0;
    const atRight = $from.parentOffset === $from.parent.content.size;
    const isWholeParagraphSelected =
        $from.parent === $to.parent &&
        $from.parentOffset === 0 &&
        $to.parentOffset === $to.parent.content.size;
    // 判断选区是否选择到了段落最后
    const selectToEnd = $to.parentOffset === $to.parent.content.size;

    let needNextPara = false;
    let replaceCurrentPara = false;

    let leftPos = $from.pos;

    console.log('atLeft:', atLeft, 'rightHasContent:', rightHasContent, 'isEmptyParagraph:', isEmptyParagraph, 'empty:', empty);

    const imageUploadId = Date.now().toString();

    // 构造 imageContainer 节点
    const imageContainerNode = currentSchema.nodes.imageContainer.create({
        src: imageUrl,
        value: '',
        placeholder: GlobalConstants.imageContainerTextareaPlaceholder,
        cls: GlobalConstants.imageContainerTextareaCls,
        imgCls: GlobalConstants.imageContainerImgCls,
        upload_id: imageUploadId
    });
    if (!isEmptyParagraph) {
        if (atRight) {
            needNextPara = true;
            replaceCurrentPara = false;
        }
        else if (atLeft) {
            needNextPara = isWholeParagraphSelected;
            replaceCurrentPara = !empty;
        }
        else {
            needNextPara = selectToEnd;
            replaceCurrentPara = !empty;
        }
        if (isWholeParagraphSelected || atLeft) leftPos -= 1;
    } else {
        needNextPara = true;
        replaceCurrentPara = true;
        leftPos -= 1;
    }
    leftPos = Math.max(leftPos, 0);
    let fragment;
    if (needNextPara) {
        // 段落中间插入，且右侧没内容，插入空行
        const nextParagraph = currentSchema.nodes.paragraph.create();
        fragment = Fragment.fromArray([imageContainerNode, nextParagraph]);
    } else {
        // 其它情况只插入图片
        fragment = Fragment.fromArray([imageContainerNode]);
    }
    if (imageContainerNode) {
        let result;
        // result = tr.split(leftPos);
        if (replaceCurrentPara) {
            result = tr.replaceWith(leftPos, $to.pos, fragment);
        }
        else {
            result = tr.insert(leftPos, fragment);
        }
        TransactionCallbackManager.add((updateState, updateView) => {
            FocusImageNextNode(view, imageContainerNode);
            // settingTextareaDom(updateView);
        });
        dispatch(tr);
        return true;
    }
    return false;
};

export const UndoCommand = (view: EditorView) => {
    return undo(view.state, view.dispatch);
};

export const RedoCommand = (view: EditorView) => {
    return redo(view.state, view.dispatch);
};

// 强制设置 mark（如 fontSize）
function setMark(markType: MarkType, attrs: any) {
    return function (state: EditorState, dispatch: (tr: Transaction) => void) {
        const { from, to, empty } = state.selection;
        let tr = state.tr;

        // 1. 先移除已有的同类 mark
        tr.removeMark(from, to, markType);

        // 2. 再加上新的 mark
        if (!empty) {
            tr.addMark(from, to, markType.create(attrs));
        } else {
            tr.setStoredMarks([markType.create(attrs)]);
        }

        if (dispatch) dispatch(tr.scrollIntoView());
        return true;
    }
}

function setParagraph(view: EditorView, from: number, to: number): void {
    const { state, dispatch } = view;
    const { schema } = state;
    let $from = state.doc.resolve(from);
    for (let depth = $from.depth; depth > 0; depth--) {
        if ($from.node(depth).type === schema.nodes.blockquote || $from.node(depth).type === schema.nodes.heading) {
            let paragraphPos = $from.before(depth);
            let paragraphNode = $from.node(depth);
            let paragraphEnd = paragraphPos + paragraphNode.nodeSize;
            let sel = TextSelection.create(state.doc, paragraphPos + 1, paragraphEnd - 1);
            let tr = state.tr.setSelection(sel);
            dispatch(tr); // 先设置 selection
            lift(view.state, dispatch); // 再提升
            return;
        }
    }
}

function downgradeToParagraph(view: EditorView) {
    const { state, dispatch } = view;
    const { schema, selection } = state;
    let { from, empty } = selection;
    if (empty) {
        const $from = state.selection.$from;
        from = $from.start();
    }
    let $from = state.doc.resolve(from);

    // 1. 如果是 heading，直接变成段落
    if ($from.parent.type === schema.nodes.heading) {
        setBlockType(schema.nodes.paragraph)(state, dispatch);
        return;
    }

    // 2. 向上查找最近的 bullet_list 或 ordered_list，提升
    for (let depth = $from.depth; depth > 0; depth--) {
        const nodeType = $from.node(depth).type;
        if (
            nodeType === schema.nodes.bullet_list ||
            nodeType === schema.nodes.ordered_list ||
            nodeType === schema.nodes.list_item ||
            nodeType === schema.nodes.blockquote
        ) {
            // 选区覆盖整个列表
            let listPos = $from.before(depth);
            let listNode = $from.node(depth);
            let listEnd = listPos + listNode.nodeSize;
            let sel = TextSelection.create(state.doc, listPos + 1, listEnd - 1);
            let tr = state.tr.setSelection(sel);
            dispatch(tr); // 设置选区
            lift(view.state, dispatch); // 提升列表
            // 提升后再变成段落
            setBlockType(schema.nodes.paragraph)(view.state, dispatch);
            return;
        }
    }

    // 如果已经是 p，不处理
}

function removeAllMarks(tr: Transaction, schema: Schema, from: number, to: number): Transaction {
    if (schema.marks) {
        Object.values(schema.marks).forEach((mark) => {
            tr = tr.removeMark(from, to, mark);
        });
    }
    return tr;
}