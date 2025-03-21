import { EditorView } from "prosemirror-view";
import { useRef } from "react";
import { InsertImageCommand, FocusLastedNode } from "./Commands.ts";
import ContentSchema from "./ContentSchema.ts";
import UseTypeChecker from "./Object.js";

export interface DDBridge {
    call(funcName: string, params: JSON, callback: Function): any;
    registerSync(funcName: string, funcObj: Function): void;
    registerAsync(funcName: string, funcObj: Function): void;
}

declare global {
    export interface Window {
        ddBridge: DDBridge;
    }
}

interface InsertImageParams {
    imageLocalPath: string;
}

class NativeBridge {
    viewRef: React.RefObject<EditorView | null>;
    private nativeBridge: DDBridge = window.ddBridge;
    constructor(viewRef: React.RefObject<EditorView | null>) {
        this.viewRef = viewRef;
        if (this.nativeBridge) {
            this.commonFunc();
        }
    }

    private insertImage = (params: InsertImageParams) => {
        if (this.viewRef.current) {
            InsertImageCommand(this.viewRef.current, params.imageLocalPath, ContentSchema);
            setTimeout(() => {
                if (this.viewRef.current) {
                    FocusLastedNode(this.viewRef.current);
                }
            }, 200);
        }
    }

    private becomeFirstResponse = (params:any) => {
        const {getType} = UseTypeChecker()
        let view = this.viewRef.current
        if (view) {
            // const {state, dispatch} = view
            view.focus();
            // FocusLastedNode(view)
            // document.getElementById('editor-view-id')?.focus();
            setTimeout(() => {
                if (getType(params) == 'function') {
                    params('')
                }
            }, 0);

        }
    }

    private commonFunc() {
        this.nativeBridge.registerSync('insertLocalImage', this.insertImage);
        this.nativeBridge.registerAsync('becomeFirstResponse', this.becomeFirstResponse);
    }

}

export default NativeBridge;