import React from 'react';
import { Paper, Typography, Grid, FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';

const TravelerSection = ({ travelers, groupSize, homeLocation, budget, handleTravelersChange, handleGroupSizeChange, handleHomeLocationChange, handleBudgetChange }) => {
  const { t } = useLanguage();

  return (
    <Paper elevation={3} sx={{ p: 2, mb: 3, backgroundColor: '#f0f8ff' }}>
      <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
        {t('travelersInformation')}
      </Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="travelers-label">{t('whosTraveling')}</InputLabel>
            <Select
              labelId="travelers-label"
              value={travelers}
              label={t('whosTraveling')}
              onChange={handleTravelersChange}
            >
              <MenuItem value="Solo">{t('solo')}</MenuItem>
              <MenuItem value="Couple">{t('couple')}</MenuItem>
              <MenuItem value="Family">{t('family')}</MenuItem>
              <MenuItem value="Group">{t('group')}</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        {(travelers === 'Family' || travelers === 'Group') && (
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              margin="normal"
              label={t('groupSize')}
              value={groupSize}
              onChange={handleGroupSizeChange}
              placeholder={t('enterNumberOfTravelers')}
              type="number"
              InputProps={{ inputProps: { min: travelers === 'Family' ? 3 : 5 } }}
            />
          </Grid>
        )}
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            margin="normal"
            label={t('homeLocation')}
            value={homeLocation}
            onChange={handleHomeLocationChange}
            placeholder={t('enterYourHomeCity')}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="budget-label">{t('budget')}</InputLabel>
            <Select
              labelId="budget-label"
              value={budget}
              label={t('budget')}
              onChange={handleBudgetChange}
            >
              <MenuItem value="Budget">{t('budget')}</MenuItem>
              <MenuItem value="Mid-range">{t('midRange')}</MenuItem>
              <MenuItem value="Luxury">{t('luxury')}</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default TravelerSection;
