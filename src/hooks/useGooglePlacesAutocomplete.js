import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';

const useGooglePlacesAutocomplete = (initialValue = '') => {
  const [value, setValue] = useState(initialValue);
  const [options, setOptions] = useState([]);
  const { language } = useLanguage();

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      console.error('Google Maps JavaScript API is not loaded');
      return;
    }
  }, []);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleInputChange = async (event, newInputValue) => {
    if (language === 'en' && newInputValue.length > 2) {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
        const response = await axios.get(`${backendUrl}/api/autocomplete?input=${encodeURIComponent(newInputValue)}`);
        const predictions = response.data.predictions.map(prediction => prediction.description);
        setOptions(predictions);
      } catch (error) {
        console.error('Error fetching autocomplete suggestions:', error);
      }
    }
  };

  return {
    value,
    setValue,
    options,
    handleChange,
    handleInputChange,
  };
};

export default useGooglePlacesAutocomplete;
