import React from 'react';
import { useParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import GenericHabitLog from './GenericHabitLog'; // New generic component
import NotFound from './NotFound'; // Fallback for unknown habit keys

const LogHabit = () => {
  const { habitKey } = useParams<{ habitKey: string }>();

  if (!habitKey) {
    return <NotFound />;
  }

  return (
    <Layout>
      <GenericHabitLog habitKey={habitKey} />
    </Layout>
  );
};

export default LogHabit;