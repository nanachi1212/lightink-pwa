
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ProjectDashboard from './pages/ProjectDashboard';
import Editor from './pages/Editor';
import Characters from './pages/Characters';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/project/:id" element={<ProjectDashboard />} />
        <Route path="/project/:projectId/characters" element={<Characters />} />
        <Route path="/project/:projectId/editor/:chapterId" element={<Editor />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}

export default App;
