import logo from './logo.svg';
import './App.css';
import './Placeholder/placeholder.css';
import ArticleTitle from './ArticleTitle';
import ContentEditor from './ContentEditor';

function App() {
  return (
    <div className="App">
      <ArticleTitle />      
      <ContentEditor />
    </div>
  );
}

export default App;
