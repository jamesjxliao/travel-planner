import React from 'react';
import { Card, CardContent, TextField, Box, Chip } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';
import CloseIcon from '@mui/icons-material/Close';

const SpecialRequirementsSection = ({ 
  specialRequirements, 
  setSpecialRequirements, 
  isLoading, 
  commonPreferences,
  handleCommonPreferenceClick 
}) => {
  const { t } = useLanguage();

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {commonPreferences.map((prefKey, index) => {
              const isSelected = specialRequirements.includes(t(prefKey));
              return (
                <Chip
                  key={index}
                  label={t(prefKey)}
                  onClick={() => handleCommonPreferenceClick(prefKey)}
                  onDelete={isSelected ? () => handleCommonPreferenceClick(prefKey) : undefined}
                  deleteIcon={<CloseIcon />}
                  color={isSelected ? "primary" : "default"}
                  sx={{
                    fontSize: '0.8125rem',
                    height: '28px',
                    '& .MuiChip-label': { padding: '8px 12px' },
                    '& .MuiChip-deleteIcon': { fontSize: '1.2rem' },
                    '&:hover': { backgroundColor: isSelected ? 'primary.light' : 'action.hover', cursor: 'pointer' }
                  }}
                />
              );
            })}
          </Box>
          <TextField
            label={t('specialRequirements')}
            value={specialRequirements}
            onChange={(e) => setSpecialRequirements(e.target.value)}
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
