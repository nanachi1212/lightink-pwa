
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ProjectDashboard from './pages/ProjectDashboard';
import Editor from './pages/Editor';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/project/:id" element={<ProjectDashboard />} />
        <Route path="/project/:projectId/editor/:chapterId" element={<Editor />} />
      </Routes>
    </Router>
  );
}

export default App;
