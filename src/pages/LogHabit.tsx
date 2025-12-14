import React from 'react';
import { useParams } from 'react-router-dom';
import PushupLog from './PushupLog';
import MeditationLog from './MeditationLog';
import StudyLog from './StudyLog'; // KinesiologyLog
import PianoLog from './PianoLog';
import HouseworkLog from './HouseworkLog';
import ProjectWorkLog from './ProjectWorkLog';
import TeethBrushingLog from './TeethBrushingLog';
import MedicationLog from './MedicationLog';
import NotFound from './NotFound'; // Fallback for unknown habit keys
// Layout is now handled by the ProtectedRoute in App.tsx, so it's not needed here.

const LogHabit = () => {
  const { habitKey } = useParams<{ habitKey: string }>();

  const renderHabitLogComponent = () => {
    switch (habitKey) {
      case 'pushups':
        return <PushupLog />;
      case 'meditation':
        return <MeditationLog />;
      case 'kinesiology': // Corresponds to StudyLog
        return <StudyLog />;
      case 'piano':
        return <PianoLog />;
      case 'housework':
        return <HouseworkLog />;
      case 'projectwork':
        return <ProjectWorkLog />;
      case 'teeth-brushing':
        return <TeethBrushingLog />;
      case 'medication':
        return <MedicationLog />;
      default:
        return <NotFound />; // Handle unknown habit keys
    }
  };

  return (
    <>
      {renderHabitLogComponent()}
    </>
  );
};

export default LogHabit;