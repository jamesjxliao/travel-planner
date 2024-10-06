import React from 'react';
import { Paper, Grid, TextField, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch, Typography } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';

const TripDetailsSection = ({
  destination,
  setDestination,
  numDays,
  setNumDays,
  timeToVisit,
  setTimeToVisit,
  transportationMode,
  setTransportationMode,
  accommodationType,
  setAccommodationType,
  isRoundTrip,
  setIsRoundTrip,
  isLoading
}) => {
  const { t } = useLanguage();

  return (
    <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label={t('destination')}
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            fullWidth
            margin="normal"
            disabled={isLoading}
            variant="outlined"
          />
        </Grid>
        <Grid item xs={6} sm={3} md={1}>
          <TextField
            label={t('numberOfDays')}
            value={numDays}
            onChange={(e) => setNumDays(e.target.value)}
            fullWidth
            margin="normal"
            type="number"
            InputProps={{ inputProps: { min: 1 } }}
            disabled={isLoading}
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="time-to-visit-label">{t('timetovisit')}</InputLabel>
            <Select
              labelId="time-to-visit-label"
              value={timeToVisit}
              label={t('timetovisit')}
              onChange={(e) => setTimeToVisit(e.target.value)}
              disabled={isLoading}
            >
              <MenuItem value="flexible">{t('accommodations.flexible')}</MenuItem>
              <MenuItem value="spring">{t('timetovisit.spring')}</MenuItem>
              <MenuItem value="summer">{t('timetovisit.summer')}</MenuItem>
              <MenuItem value="fall">{t('timetovisit.fall')}</MenuItem>
              <MenuItem value="winter">{t('timetovisit.winter')}</MenuItem>
              <MenuItem value="holidays">{t('timetovisit.holidays')}</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="transportation-label">{t('transportation')}</InputLabel>
            <Select
              labelId="transportation-label"
              value={transportationMode}
              label={t('transportation')}
              onChange={(e) => setTransportationMode(e.target.value)}
              disabled={isLoading}
            >
              <MenuItem value="flexible">{t('transportation.flexible')}</MenuItem>
              <MenuItem value="flight">{t('transportation.flight')}</MenuItem>
              <MenuItem value="driving">{t('transportation.driving')}</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="accommodation-label">{t('accommodations')}</InputLabel>
            <Select
              labelId="accommodation-label"
              value={accommodationType}
              label={t('accommodations')}
              onChange={(e) => setAccommodationType(e.target.value)}
              disabled={isLoading}
            >
              <MenuItem value="flexible">{t('accommodations.flexible')}</MenuItem>
              <MenuItem value="hotel">{t('accommodations.hotel')}</MenuItem>
              <MenuItem value="airbnb">{t('accommodations.airbnb')}</MenuItem>
              <MenuItem value="resort">{t('accommodations.resort')}</MenuItem>
              <MenuItem value="hostel">{t('accommodations.hostel')}</MenuItem>
              <MenuItem value="camping">{t('accommodations.camping')}</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <FormControlLabel
            control={
              <Switch
                checked={isRoundTrip}
                onChange={(e) => setIsRoundTrip(e.target.checked)}
                disabled={isLoading}
              />
            }
            label={
              <Typography noWrap>
                {t('roundTrip')}
              </Typography>
            }
            sx={{ mt: 2 }}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default TripDetailsSection;
