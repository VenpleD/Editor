import React from 'react';
import './promptBox.css'; // 假设你会创建一个对应的 CSS 文件来设置提示框样式

const promptBox = ({ show, text }) => {
    console.log('PromptBox 组件正在渲染');
    return (
        show && (
            <div id="promptBox">
                <p>{text}</p>
            </div>
        )
    );
};

export default promptBox;