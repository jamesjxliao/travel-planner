import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';

const DebugSection = ({ currentPrompt }) => {
  const { t } = useLanguage();

  return (
    <Card sx={{ mt: 2, backgroundColor: '#f0f0f0' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>{t('currentLLMPrompt')}</Typography>
        <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {currentPrompt}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default DebugSection;
