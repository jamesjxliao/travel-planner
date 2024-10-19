import React, { useEffect, useRef, useState } from 'react';
import { Paper, Grid, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch, Typography, Autocomplete, TextField } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';
import useGooglePlacesAutocomplete from '../hooks/useGooglePlacesAutocomplete';

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
  isLoading,
  setIsDestinationValid
}) => {
  const { t, language } = useLanguage();
  const autocompleteRef = useRef(null);
  const {
    value: autocompleteValue,
    setValue: setAutocompleteValue,
    options: autocompleteOptions,
    handleChange: handleAutocompleteChange,
    handleInputChange: handleAutocompleteInputChange,
  } = useGooglePlacesAutocomplete(destination);

  const [localDestination, setLocalDestination] = useState(destination);

  // Load data from localStorage on component mount
  useEffect(() => {
    const loadedDestination = localStorage.getItem('destination');
    const loadedNumDays = localStorage.getItem('numDays');
    const loadedTimeToVisit = localStorage.getItem('timeToVisit');
    const loadedTransportationMode = localStorage.getItem('transportationMode');
    const loadedAccommodationType = localStorage.getItem('accommodationType');

    if (loadedDestination) {
      setDestination(loadedDestination);
      setLocalDestination(loadedDestination);
      setAutocompleteValue(loadedDestination);
    }
    if (loadedNumDays) setNumDays(loadedNumDays);
    if (loadedTimeToVisit) setTimeToVisit(loadedTimeToVisit);
    if (loadedTransportationMode) setTransportationMode(loadedTransportationMode);
    if (loadedAccommodationType) setAccommodationType(loadedAccommodationType);
  }, [setDestination, setAutocompleteValue, setNumDays, setTimeToVisit, setTransportationMode, setAccommodationType]);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('destination', localDestination);
    localStorage.setItem('numDays', numDays);
    localStorage.setItem('timeToVisit', timeToVisit);
    localStorage.setItem('transportationMode', transportationMode);
    localStorage.setItem('accommodationType', accommodationType);
  }, [localDestination, numDays, timeToVisit, transportationMode, accommodationType]);

  useEffect(() => {
    const isValid = localDestination.trim().length > 0;
    setIsDestinationValid(isValid);
    if (isValid) {
      setDestination(localDestination);
    }
  }, [localDestination, setDestination, setIsDestinationValid]);

  const handleDestinationChange = (event, newValue) => {
    const updatedDestination = newValue || '';
    setLocalDestination(updatedDestination);
    setDestination(updatedDestination);
    handleAutocompleteChange(event, newValue);
  };

  const handleNumDaysChange = (e) => {
    setNumDays(e.target.value);
  };

  const handleTimeToVisitChange = (e) => {
    setTimeToVisit(e.target.value);
  };

  const handleTransportationModeChange = (e) => {
    setTransportationMode(e.target.value);
  };

  const handleAccommodationTypeChange = (e) => {
    setAccommodationType(e.target.value);
  };

  return (
    <Paper elevation={3} sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
      <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
        {t('tripDetails')}
      </Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md={3}>
          {language === 'en' ? (
            <Autocomplete
              value={localDestination}
              onChange={handleDestinationChange}
              onInputChange={(event, newInputValue) => {
                setLocalDestination(newInputValue);
                handleAutocompleteInputChange(event, newInputValue);
              }}
              options={autocompleteOptions}
              renderInput={(params) => (
                <TextField
                  {...params}
                  inputRef={autocompleteRef}
                  label={t('destination')}
                  fullWidth
                  margin="normal"
                  disabled={isLoading}
                  variant="outlined"
                  error={localDestination.trim().length === 0}
                  sx={{ '& .MuiOutlinedInput-root': { '&.Mui-focused fieldset': { borderColor: 'primary.main' } } }}
                />
              )}
              disabled={isLoading}
              freeSolo
            />
          ) : (
            <TextField
              label={t('destination')}
              value={localDestination}
              onChange={(e) => {
                setLocalDestination(e.target.value);
                setDestination(e.target.value);
              }}
              fullWidth
              margin="normal"
              disabled={isLoading}
              variant="outlined"
              error={localDestination.trim().length === 0}
              sx={{ '& .MuiOutlinedInput-root': { '&.Mui-focused fieldset': { borderColor: 'primary.main' } } }}
            />
          )}
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <TextField
            label={t('numberOfDays')}
            value={numDays}
            onChange={handleNumDaysChange}
            fullWidth
            margin="normal"
            type="number"
            InputProps={{ inputProps: { min: 1 } }}
            disabled={isLoading}
            variant="outlined"
          />
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="time-to-visit-label">{t('timetovisit')}</InputLabel>
            <Select
              labelId="time-to-visit-label"
              value={timeToVisit}
              label={t('timetovisit')}
              onChange={handleTimeToVisitChange}
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
        <Grid item xs={6} sm={6} md={2.5}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="transportation-label">{t('transportation')}</InputLabel>
            <Select
              labelId="transportation-label"
              value={transportationMode}
              label={t('transportation')}
              onChange={handleTransportationModeChange}
              disabled={isLoading}
            >
              <MenuItem value="flexible">{t('transportation.flexible')}</MenuItem>
              <MenuItem value="flight">{t('transportation.flight')}</MenuItem>
              <MenuItem value="driving">{t('transportation.driving')}</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} sm={6} md={2.5}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="accommodation-label">{t('accommodations')}</InputLabel>
            <Select
              labelId="accommodation-label"
              value={accommodationType}
              label={t('accommodations')}
              onChange={handleAccommodationTypeChange}
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
      </Grid>
      {localDestination.trim().length === 0 && (
        <Typography color="error" sx={{ mt: 1, ml: 1 }}>
          {t('destinationRequired')}
        </Typography>
      )}
    </Paper>
  );
};

export default TripDetailsSection;
