import React, { useEffect, useRef } from 'react';
import { Paper, Typography, Grid, FormControl, InputLabel, Select, MenuItem, TextField, Autocomplete } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';
import useGooglePlacesAutocomplete from '../hooks/useGooglePlacesAutocomplete';

const TravelerSection = ({ 
  travelers, 
  setTravelers, 
  groupSize, 
  setGroupSize, 
  homeLocation, 
  setHomeLocation, 
  budget, 
  setBudget 
}) => {
  const { t, language } = useLanguage();
  const autocompleteRef = useRef(null);
  const {
    value: autocompleteValue,
    setValue: setAutocompleteValue,
    options: autocompleteOptions,
    handleChange: handleAutocompleteChange,
    handleInputChange: handleAutocompleteInputChange,
  } = useGooglePlacesAutocomplete(homeLocation);

  // Load data from localStorage on component mount
  useEffect(() => {
    const loadedTravelers = localStorage.getItem('travelers');
    const loadedGroupSize = localStorage.getItem('groupSize');
    const loadedHomeLocation = localStorage.getItem('homeLocation');
    const loadedBudget = localStorage.getItem('budget');

    if (loadedTravelers) setTravelers(loadedTravelers);
    if (loadedGroupSize) setGroupSize(loadedGroupSize);
    if (loadedHomeLocation) {
      setHomeLocation(loadedHomeLocation);
      setAutocompleteValue(loadedHomeLocation);
    }
    if (loadedBudget) setBudget(loadedBudget);
  }, [setTravelers, setGroupSize, setHomeLocation, setAutocompleteValue, setBudget]);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('travelers', travelers);
    localStorage.setItem('groupSize', groupSize);
    localStorage.setItem('homeLocation', homeLocation);
    localStorage.setItem('budget', budget);
  }, [travelers, groupSize, homeLocation, budget]);

  const handleTravelersChange = (event) => {
    const value = event.target.value;
    setTravelers(value);
    if (value === 'Solo') {
      setGroupSize('1');
    } else if (value === 'Couple') {
      setGroupSize('2');
    } else if (value === 'Family') {
      setGroupSize('3');
    } else if (value === 'Group') {
      setGroupSize('5');
    }
  };

  const handleGroupSizeChange = (e) => {
    setGroupSize(e.target.value);
  };

  const handleHomeLocationChange = (event, newValue) => {
    setHomeLocation(newValue);
    handleAutocompleteChange(event, newValue);
  };

  const handleBudgetChange = (e) => {
    setBudget(e.target.value);
  };

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
          {language === 'en' ? (
            <Autocomplete
              value={autocompleteValue}
              onChange={handleHomeLocationChange}
              onInputChange={handleAutocompleteInputChange}
              options={autocompleteOptions}
              renderInput={(params) => (
                <TextField
                  {...params}
                  inputRef={autocompleteRef}
                  label={t('homeLocation')}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                />
              )}
              freeSolo
            />
          ) : (
            <TextField
              fullWidth
              margin="normal"
              label={t('homeLocation')}
              value={homeLocation}
              onChange={(e) => setHomeLocation(e.target.value)}
              placeholder={t('enterYourHomeCity')}
            />
          )}
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