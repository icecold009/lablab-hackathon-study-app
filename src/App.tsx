import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Setup from './pages/Setup';
import StudyPlanPage from './pages/StudyPlan';
import TopicQuiz from './pages/TopicQuiz';
import Progress from './pages/Progress';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Setup />} />
          <Route path="plan" element={<StudyPlanPage />} />
          <Route path="quiz" element={<TopicQuiz />} />
          <Route path="progress" element={<Progress />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}