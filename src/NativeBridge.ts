import { EditorView } from "prosemirror-view";
import { InsertImageCommand, UndoCommand, FontCommand, RedoCommand, PgcCommand, InsertTextAtCursor, InsertHashTagInline } from "./Commands.ts";
import ContentSchema from "./ContentSchema.ts";
import UseTypeChecker from "./Object.js";
import GlobalStyle from "./Global.ts";
import AppManager from "./AppManager.ts";

export interface DDBridge {
    call(funcName: string, params: object, callback: Function | null): any;
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
    private static instance: NativeBridge;
    public titleViewRef: React.RefObject<EditorView | null> | null = null;
    public contentViewRef: React.RefObject<EditorView | null> | null = null;
    private nativeBridge: DDBridge = window.ddBridge;

    private constructor() {
        if (this.nativeBridge) {
            this.commonFunc();
        }
    }

    public static getInstance() {
        if (!NativeBridge.instance) {
            NativeBridge.instance = new NativeBridge();
        }
        return NativeBridge.instance;
    }

    // 设置 title 编辑器的 ref
    public setTitleViewRef(ref: React.RefObject<EditorView | null>) {
        this.titleViewRef = ref;
    }

    // 设置 content 编辑器的 ref
    public setContentViewRef(ref: React.RefObject<EditorView | null>) {
        this.contentViewRef = ref;
    }

    public asyncFontInfo (params: object) {
        if (!this.nativeBridge) { return;}
        this.nativeBridge.call('asyncFontInfo', params, null);
    }

    private insertImage = (params: InsertImageParams) => {
        if (this.contentViewRef?.current) {
            InsertImageCommand(this.contentViewRef.current, params.imageLocalPath, ContentSchema);
        }
    }

    private becomeFirstResponse = (params: any) => {
        const { getType } = UseTypeChecker()
        let view = this.contentViewRef?.current
        if (view) {
            view.focus();
            setTimeout(() => {
                if (getType(params) === 'function') {
                    params(true)
                }
            }, 0);

        }
    }

    private resignFirstResponse = (params: any) => {
        const { getType } = UseTypeChecker()
        let view = this.contentViewRef?.current
        if (view) {
            view.dom.blur()
            setTimeout(() => {
                if (getType(params) === 'function') {
                    params(true)
                }
            }, 0);

        }
    }

    private hasFocused = (params: any) => {
        let view = this.contentViewRef?.current
        const { getType } = UseTypeChecker()
        if (getType(params) === 'function') {
            if (view) {
                params(view.hasFocus())
            } else {
                params(false)
            }
        }
    }

    private settingFont =  (params: any, callback: Function) => {
        const { getType, checkString } = UseTypeChecker()
        let view = this.contentViewRef?.current
        if (!view) {return}
        let funcName = params.funcName;
        let paramString = params.paramString;
        console.log('settingFont', funcName, paramString);
        let styleValue = GlobalStyle.styleAllMap[paramString];       
        if (checkString(funcName).isEmpty || checkString(paramString).isEmpty) {
            console.error('settingFont: funcName or paramString is empty');
            return; 
        }
         if (checkString(styleValue).isNotEmpty) {
            console.error('settingFont: paramString is not a valid style value');
            return;
        }
        let result = FontCommand[funcName](view, styleValue);
        if (callback && getType(callback) === 'function') {
            callback(result);
        }
    }

    private settingPgc = (params: any, callback: Function) => {
        const { getType, checkString } = UseTypeChecker()
        let view = this.contentViewRef?.current
        if (!view) {
            console.error('settingPgc: contentViewRef is not set');
            return;
        }
        let funcName = params.funcName;
        let paramString = params.paramString;
        console.log('settingPgc', funcName, paramString);
        if (checkString(funcName).isEmpty || checkString(paramString).isEmpty) {
            console.error('settingPgc: funcName or paramString is empty');
            return;
        }
        let styleValue = GlobalStyle.styleAllMap[paramString];
        if (checkString(styleValue).isEmpty) {
            console.error('settingPgc: paramString is not a valid style value');
            return;
        }
        let result = PgcCommand[funcName](view, styleValue);
        if (callback && getType(callback) === 'function') {
            callback(result);
        }
    }

    private undoClick = (params: any, callback: Function) => {
        const { getType } = UseTypeChecker()
        let view = this.contentViewRef?.current;
        if (!view) {
            console.error('undoClick: contentViewRef is not set');
            return;
        }
        if (getType(callback) === 'function') {
            callback(UndoCommand(view));
        }
    }

    private redoClick = (params: any, callback: Function) => {
        const { getType } = UseTypeChecker()
        let view = this.contentViewRef?.current;
        if (!view) {
            console.error('redoClick: contentViewRef is not set');
            return;
        }
        if (getType(callback) === 'function') {
            callback(RedoCommand(view));
        }
    }

    private nextStep = (params: any, callback: Function) => {
        const { getType } = UseTypeChecker()
        let contentView = this.contentViewRef?.current;
        let titleView = this.titleViewRef?.current;
        if (!contentView || !titleView) {
            console.error('nextStep: contentViewRef or titleViewRef is not set');
            return;
        }
        AppManager.handleNextStep();
    }

    /**
     * 同步编辑器区域点击/状态信息
     * @param type 区域类型，如 'title' | 'content' | 'image' | 'textarea'
     * @param extra 额外信息（可选）
     */
    public asyncCurrentTarget(type: string, extra?: object) {
        console.log('[asyncCurrentTarget]', { type, ...extra });
        if (!this.nativeBridge) return;
        if (type === 'app') {
            this.nativeBridge.call('jsSetFirstResponse', { 'set': false }, null);
            return;
        }
        this.nativeBridge.call('jsSetToolBar', { 'hide': type !== 'content' }, null);
    }

    public async getTOSConfigAsync(): Promise<any> {
        if (!this.nativeBridge) return null;
        return new Promise((resolve) => {
            this.nativeBridge.call('getTOSConfig', {}, (result: any) => {
                if (result && result.code === 0) {
                    resolve(result.data);
                } else {
                    console.error('getTOSConfig failed:', result);
                    resolve(null);
                }
            });
        });
    }

    public pushDetailPage(content: string) {
        if (!this.nativeBridge) return;
        this.nativeBridge.call('pushWebVC', { content }, null);
    }

    public topicClick(topicId: string, topicName: string) {
        if (!this.nativeBridge) return;
        this.nativeBridge.call('topicClick', { topicId, topicName }, null);
    }
    
    private insertText = (params: any, callback: Function) => {
        const { getType, checkString } = UseTypeChecker()
        let view = this.contentViewRef?.current;
        if (!view) {
            console.error('insertText: contentViewRef is not set');
            return;
        }
        const { text } = params;
        if (getType(text) !== 'string' || checkString(text).isEmpty) {
            console.error('insertText: invalid text parameter');
            return;
        }
        InsertTextAtCursor(view, text);
    }

    private insertTopic = (params: any, callback: Function) => {
        const { getType, checkString } = UseTypeChecker()
        let view = this.contentViewRef?.current;
        if (!view) {
            console.error('insertTopic: contentViewRef is not set');
            return;
        }
        const { topicId, topicName } = params;
        if (getType(topicName) !== 'string' || checkString(topicName).isEmpty) {
            console.error('insertTopic: invalid topicName parameter');
            return;
        }
        InsertHashTagInline(view, topicName, topicId);
    }

    private commonFunc() {
        this.nativeBridge.registerSync('insertLocalImage', this.insertImage);
        this.nativeBridge.registerAsync('becomeFirstResponse', this.becomeFirstResponse);
        this.nativeBridge.registerAsync('resignFirstResponse', this.resignFirstResponse);
        this.nativeBridge.registerAsync('hasFocused', this.hasFocused);
        this.nativeBridge.registerAsync('settingFont', this.settingFont);
        this.nativeBridge.registerAsync('settingPgc', this.settingPgc);
        this.nativeBridge.registerAsync('undoClick', this.undoClick);
        this.nativeBridge.registerAsync('redoClick', this.redoClick);
        this.nativeBridge.registerAsync('nextStep', this.nextStep);
        this.nativeBridge.registerAsync('insertText', this.insertText);
        this.nativeBridge.registerAsync('insertTopic', this.insertTopic);
    }

}


export default NativeBridge;