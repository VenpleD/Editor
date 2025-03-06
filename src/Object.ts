// typeChecker.js
import { useCallback } from 'react';

// 自定义 Hook 用于判断对象类型
const useTypeChecker = () => {
    // 使用 useCallback 来缓存 getType 函数，避免每次渲染时都重新创建
    const getType = useCallback((value: unknown): string => {
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
    }, []);

    // 用于判断值是否为自定义类的实例
    const isInstanceOfCustomClass = useCallback((value: unknown, customClass: new (...args: any[]) => any): boolean => {
        return value instanceof customClass;
    }, []);

    // 用于判断字符串相关情况
    const checkString = useCallback((str: unknown): {
        isString: boolean;
        isEmpty: boolean;
        isOnlyWhitespace: boolean;
    } => {
        const isString = typeof str === 'string';
        const isEmpty = isString && str.length === 0;
        const isOnlyWhitespace = isString && /^\s*$/.test(str);

        return {
            isString,
            isEmpty,
            isOnlyWhitespace
        };
    }, []);


    return { getType, isInstanceOfCustomClass, checkString };
};

export default useTypeChecker;