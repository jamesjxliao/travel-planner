import React from 'react';
import { Button } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';
// Add import for icon
import { Send as SendIcon } from '@mui/icons-material';

const FinalizePlanButton = ({ onClick, isLoading, isDisabled }) => {
  const { t } = useLanguage();

  return (
    <Button 
      variant="contained" 
      onClick={onClick}
      sx={{
        mt: 2,
        width: '100%',
        mb: 3,
        fontSize: '1rem',
        fontWeight: 'bold',
        padding: '8px 16px',
        backgroundColor: '#1976d2',
        '&:hover': {
          backgroundColor: '#1565c0',
        },
      }}
      disabled={isLoading || isDisabled}
      endIcon={<SendIcon />}
    >
      {isLoading ? t('generatingTravelPlan') : t('finalizePlan')}
    </Button>
  );
};

export default FinalizePlanButton;
