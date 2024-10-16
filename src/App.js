import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import TravelPlannerApp from './TravelPlannerApp';
import { LanguageProvider } from './contexts/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      <ThemeProvider theme={theme}>
        <TravelPlannerApp />
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;
