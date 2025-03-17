import React from 'react';

// 自定义 Hook 用于判断对象类型
const UseTypeChecker = () => {
    // 获取对象类型的函数
    const getType = (value) => {
        if (typeof value === 'undefined') {
            return 'undefined';
        }
        if (value === null) {
            return 'null';
        }
        if (Array.isArray(value)) {
            return 'array';
        }
        if (value instanceof Date) {
            return 'date';
        }
        if (typeof value === 'function') {
            return 'function';
        }
        // 使用 Object.prototype.toString.call 获取对象的类型字符串，并处理成小写
        return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
    };

    // 用于判断值是否为自定义类的实例
    const isInstanceOfCustomClass = (value, customClass) => {
        return value instanceof customClass;
    };

    // 用于判断字符串相关情况
    const checkString = (str) => {
        const isString = typeof str === 'string';
        const isEmpty = isString && str.length === 0;
        const isOnlyWhitespace = isString && /^\s*$/.test(str);

        return {
            isString,
            isEmpty,
            isOnlyWhitespace
        };
    };

    // 新增：判断对象是否为空（null 或 undefined）
    const isObjectEmpty = (obj) => {
        return obj === null || typeof obj === 'undefined';
    };

    return { getType, isInstanceOfCustomClass, checkString, isObjectEmpty };
};

export default UseTypeChecker;