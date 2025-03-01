// iOSInjectedObjectBridge.js

class NativeBridge {
    constructor() {
        // 在构造函数中获取注入对象并赋值给实例属性，添加空判断逻辑
        this.bridge = window.ddBridge;
        if (!window.ddBridge) {
            console.warn('iOS 注入对象尚未准备好或者不存在，请检查相关配置');
        } else {

        }
    }
    call(funcName, params, callback) {
        if (this.bridge) {
            this.bridge.call(funcName, params, callback);
        } else {
            console.warn('注入对象中不存在 call 方法，请确认注入对象的接口规范');
        }
    }
    register(funcName, funcObj, callback) {
        if (this.bridge) {
            this.bridge.register(funcName, funcObj, callback);
        } else {
            console.warn('注入对象中不存在 register 方法，请确认注入对象的接口规范');
        }
    }
    registerAsync(funcName, funcObj) {
        if (this.bridge) {
            this.bridge.registerAsyn(funcName, funcObj);
        } else {
            console.warn('注入对象中不存在 registerAsyn 方法，请确认注入对象的接口规范');
        }
    }
}

// 导出桥接类，方便在其他文件中使用
export default NativeBridge;