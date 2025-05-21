import { useState } from 'react';
import Opening from './Opening';
import App from './App';

function AppWrapper({ currentStage }: { currentStage: number }) {
  const [isOpeningSeen, setIsOpeningSeen] = useState(false);

  return isOpeningSeen ? (
    <App currentStage={currentStage} />
  ) : (
    <Opening onFinish={() => setIsOpeningSeen(true)} />
  );
}

export default AppWrapper;
