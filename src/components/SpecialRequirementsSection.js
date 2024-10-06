import React from 'react';
import { Card, CardContent, Box, Chip, TextField } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';

const SpecialRequirementsSection = ({ specialRequirements, handleSpecialRequirementsChange, handleCommonPreferenceClick, allCommonPreferences, isLoading }) => {
  const { t } = useLanguage();

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {allCommonPreferences.map((prefKey, index) => (
              <Chip
                key={index}
                label={t(prefKey)}
                size="small"
                onClick={() => handleCommonPreferenceClick(prefKey)}
                color={specialRequirements.includes(t(prefKey)) ? "primary" : "default"}
                sx={{ '&:hover': { backgroundColor: 'primary.light', cursor: 'pointer' } }}
              />
            ))}
          </Box>
          <TextField
            label={t('specialRequirements')}
            value={specialRequirements}
            onChange={handleSpecialRequirementsChange}
            fullWidth
            margin="normal"
            disabled={isLoading}
            variant="outlined"
            rows={1}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default SpecialRequirementsSection;
