import logo from './logo.svg';
import './App.css';
import './Placeholder/placeholder.css';
import ArticleTitle from './ArticleTitle.tsx';
import ContentEditor from './ContentEditor.tsx';
import GlobalStyle from './Global.ts';
import NativeBridge from './NativeBridge.ts';

GlobalStyle.setCssVars();
window.addEventListener('resize', GlobalStyle.setCssVars);

function App() {
    // 统一 click 事件处理
  const handleAppClick = (e) => {
    // 你可以在这里判断 e.target，做全局点击处理
    NativeBridge.getInstance().asyncCurrentTarget('app')
  };
  return (
    <div className="App" onClick={handleAppClick}>
      <ArticleTitle />
      <ContentEditor />
    </div>
  );
}

export default App;
