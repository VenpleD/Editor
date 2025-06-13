import { EditorView } from "prosemirror-view";
import { useRef } from "react";
import { InsertImageCommand, FocusLastedNode, FontCommand } from "./Commands.ts";
import ContentSchema from "./ContentSchema.ts";
import UseTypeChecker from "./Object.js";

export interface DDBridge {
    call(funcName: string, params: JSON, callback: Function | null): any;
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

    public asyncFontInfo (params: JSON) {
        if (!this.nativeBridge) { return;}
        this.nativeBridge.call('asyncFontInfo', params, null);
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

    private becomeFirstResponse = (params: any) => {
        const { getType } = UseTypeChecker()
        let view = this.viewRef.current
        if (view) {
            view.focus();
            console.log("========--");
            setTimeout(() => {
                if (getType(params) == 'function') {
                    params(true)
                }
            }, 0);

        }
    }

    private resignFirstResponse = (params: any) => {
        const { getType } = UseTypeChecker()
        let view = this.viewRef.current
        if (view) {
            view.dom.blur()
            setTimeout(() => {
                if (getType(params) == 'function') {
                    params(true)
                }
            }, 0);

        }
    }

    private hasFocused = (params: any) => {
        let view = this.viewRef.current
        const { getType } = UseTypeChecker()
        if (getType(params) == 'function') {
            if (view) {
                params(view.hasFocus())
            } else {
                params(false)
            }
        }
    }

    private settingFont =  (params: any) => {
        const { getType } = UseTypeChecker()
        let view = this.viewRef.current
        if (!view) {return}
        let funcName = params.funcName;
        let paramString = params.paramString;
        FontCommand[funcName](view, paramString);
    }

    private commonFunc() {
        this.nativeBridge.registerSync('insertLocalImage', this.insertImage);
        this.nativeBridge.registerAsync('becomeFirstResponse', this.becomeFirstResponse);
        this.nativeBridge.registerAsync('resignFirstResponse', this.resignFirstResponse);
        this.nativeBridge.registerAsync('hasFocused', this.hasFocused);
        this.nativeBridge.registerAsync('settingFont', this.settingFont);
    }

}

export default NativeBridge;