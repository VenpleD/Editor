import React, { useState } from "react";
import logo from './logo.svg';
import './App.css';
import './Placeholder/placeholder.css';
import ArticleTitle from './ArticleTitle.tsx';
import ContentEditor from './ContentEditor.tsx';
import GlobalStyle from './Global.ts';
import NativeBridge from './NativeBridge.ts';
import GlobalLoading from "./components/GlobalLoading.tsx";

GlobalStyle.setCssVars();
window.addEventListener('resize', GlobalStyle.setCssVars);

function App() {
  const [loading, setLoading] = useState(false);

  // 让 AppManager 能控制 loading
  import("./AppManager.ts").then((mod) => {
    mod.default.setLoading = setLoading;
  });

  // 统一 click 事件处理
  const handleAppClick = (e) => {
    // 你可以在这里判断 e.target，做全局点击处理
    NativeBridge.getInstance().asyncCurrentTarget('app')
  };
  return (
    <div className="App" onClick={handleAppClick}>
      <GlobalLoading visible={loading} text="图片上传中，请稍候..." />
      <ArticleTitle />
      <ContentEditor />
    </div>
  );
}

export default App;
