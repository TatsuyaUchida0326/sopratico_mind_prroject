import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import App from './App';
import LessonPage from './LessonPage';
import Opening from './Opening';

function Root() {
  const [currentStage, setCurrentStage] = useState(0);

  return (
    <Routes>
      {/* ✅ オープニング動画ルート */}
      <Route path="/opening" element={<Opening onFinish={() => window.location.href = '/'} />} />

      {/* ✅ 地図画面（App） */}
      <Route path="/" element={<App currentStage={currentStage} />} />

      {/* ✅ 各レッスンページ */}
      <Route
        path="/lesson/:name"
        element={
          <LessonPage
            currentStage={currentStage}
            setCurrentStage={setCurrentStage}
          />
        }
      />
    </Routes>
  );
}

export default Root;
