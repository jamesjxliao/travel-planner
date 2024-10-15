import React from 'react';
import { Button } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';

const FinalizePlanButton = ({ onClick, isLoading, isDisabled }) => {
  const { t } = useLanguage();

  return (
    <Button 
      variant="contained" 
      onClick={onClick}
      sx={{ mt: 2, width: '100%', mb: 4 }}
      disabled={isLoading || isDisabled}
    >
      {isLoading ? t('generatingTravelPlan') : t('finalizePlan')}
    </Button>
  );
};

export default FinalizePlanButton;
