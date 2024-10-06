import React, { useState, useEffect, useRef, useCallback } from 'react';
import OpenAI from 'openai';
import ReactGA from "react-ga4";
import { Button, Card, CardContent, Typography, Grid, Box, useMediaQuery, Drawer, IconButton, AppBar, Toolbar, FormControl, Select, MenuItem, Tooltip, CircularProgress, Backdrop, Paper } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import PersonIcon from '@mui/icons-material/Person';
import RefreshIcon from '@mui/icons-material/Refresh';
import BugReportIcon from '@mui/icons-material/BugReport';
import ReactMarkdown from 'react-markdown';
import CardMedia from '@mui/material/CardMedia';
import Skeleton from '@mui/material/Skeleton';
import Pagination from '@mui/material/Pagination';
import { useLanguage, LanguageProvider } from './contexts/LanguageContext';
import TravelerSection from './components/TravelerSection';
import TripDetailsSection from './components/TripDetailsSection';
import SpecialRequirementsSection from './components/SpecialRequirementsSection';
import GoogleAnalytics from './components/GoogleAnalytics';
import { createLogger } from './utils/logger';

const client = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const commonPreferences = {
  "Food": ["food.localcuisine", "food.finedining", "food.streetfood", "food.vegetarian", "food.familyfriendly"],
  "Attractions": ["attractions.museums", "attractions.nature", "attractions.historicalsites", "attractions.themeparks", "attractions.shopping"]
};

if (process.env.NODE_ENV === 'production') {
  ReactGA.initialize("G-5FTTLPJ62P");
}

const ScrollableBox = styled(Box)(({ theme }) => ({
  height: '375px',
  overflowY: 'auto',
  marginTop: '10px',
}));

const createGoogleSearchLink = (text) => {
  const searchQuery = encodeURIComponent(text);
  return `https://www.google.com/search?q=${searchQuery}`;
};

const TravelPlannerApp = () => {
  const [destination, setDestination] = useState('');
  const [homeLocation, setHomeLocation] = useState('');
  const [currentAspect, setCurrentAspect] = useState('');
  const [options, setOptions] = useState({});
  const [selectedOptions, setSelectedOptions] = useState({});
  const [conversationHistory, setConversationHistory] = useState([]);
  const [finalPlan, setFinalPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [aspectPreferences, setAspectPreferences] = useState({});
  const [isGeneratingOptions, setIsGeneratingOptions] = useState({});
  const [showDebug, setShowDebug] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [travelers, setTravelers] = useState('Family');
  const [groupSize, setGroupSize] = useState('3');
  const [numDays, setNumDays] = useState('3');
  const [newOptionIndices, setNewOptionIndices] = useState({});
  const scrollRefs = useRef({});
  const [isRoundTrip, setIsRoundTrip] = useState(true);
  const [budget, setBudget] = useState('Mid-range');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [timeToVisit, setTimeToVisit] = useState('flexible');
  const [accommodationType, setAccommodationType] = useState('flexible');
  const [transportationMode, setTransportationMode] = useState('flexible');
  const [coveredAspects, setCoveredAspects] = useState(new Set());
  const [regeneratingAspect, setRegeneratingAspect] = useState(null);
  const [regeneratingItinerary, setRegeneratingItinerary] = useState({ day: null, timeOfDay: null });
  const [isFullPlanGeneration, setIsFullPlanGeneration] = useState(false);
  const [dayVersions, setDayVersions] = useState({});
  const [currentPages, setCurrentPages] = useState({});
  const [attractionImages, setAttractionImages] = useState({});

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const finalPlanRef = useRef(null);
  const isProduction = process.env.NODE_ENV === 'production';
  const logger = createLogger(process.env.NODE_ENV);
  const { language, setLanguage, t } = useLanguage();

  const fetchAttractionImage = useCallback(async (attraction, day, timeOfDay) => {
    console.log(`Fetching image for: ${attraction}, Day: ${day}, Time: ${timeOfDay}`);
    const apiKey = process.env.REACT_APP_GOOGLE_PLACES_API_KEY;
    console.log('API Key:', apiKey ? 'Set' : 'Not set');
    
    if (!apiKey) {
      console.error('API key is not set');
      return;
    }

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
      const searchUrl = `${backendUrl}/api/places?input=${encodeURIComponent(attraction)}&apiKey=${apiKey}`;
      console.log('Search URL:', searchUrl);
      
      const searchResponse = await fetch(searchUrl);
      console.log('Search Response status:', searchResponse.status);
      
      if (!searchResponse.ok) {
        throw new Error(`HTTP error! status: ${searchResponse.status}`);
      }
      
      const searchData = await searchResponse.json();
      console.log('Search Data:', searchData);

      if (searchData.candidates && searchData.candidates.length > 0) {
        const place = searchData.candidates[0];
        console.log('Place found:', place.name);

        if (place.photos && place.photos.length > 0) {
          const photoReference = place.photos[0].photo_reference;
          console.log('Photo Reference:', photoReference);
          
          if (photoReference) {
            const imageUrl = `${backendUrl}/api/photo?maxwidth=600&photoreference=${photoReference}&key=${apiKey}`;
            console.log('Image URL:', imageUrl);

            setAttractionImages(prev => {
              const newState = {
                ...prev,
                [day]: {
                  ...(prev[day] || {}),
                  [timeOfDay]: imageUrl
                }
              };
              console.log('Updated attractionImages state:', newState);
              return newState;
            });
          } else {
            console.log('Photo reference is missing');
          }
        } else {
          console.log('No photos found for this place');
        }
      } else {
        console.log('No place found for this attraction');
      }
    } catch (error) {
      console.error('Error fetching image:', error);
    }
  }, []);

  useEffect(() => {
    console.log('useEffect triggered. finalPlan:', finalPlan);

    if (finalPlan && finalPlan.itinerary) {
      console.log('Itinerary found, processing days...');
      finalPlan.itinerary.forEach((day, index) => {
        console.log(`Processing day ${index + 1}`);
        ['morning', 'afternoon', 'evening'].forEach((timeOfDay) => {
          const content = day[timeOfDay];
          console.log(`Full content for Day ${index + 1}, ${timeOfDay}:`, content);
          
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = content;
          const textContent = tempDiv.textContent || tempDiv.innerText || '';

          const linkedAttractions = Array.from(tempDiv.querySelectorAll('a'))
            .map(a => a.textContent)
            .filter(text => text.trim() !== '');

          console.log(`Linked attractions:`, linkedAttractions);

          let firstAttraction = linkedAttractions[0] || textContent.split('.')[0].trim().slice(0, 100);
          console.log(`Day ${index + 1}, ${timeOfDay}: First attraction - ${firstAttraction}`);

          if (firstAttraction && !attractionImages[index + 1]?.[timeOfDay]) {
            console.log(`Conditions met, fetching image for ${firstAttraction}`);
            fetchAttractionImage(firstAttraction, index + 1, timeOfDay);
          } else {
            console.log(`Image already exists or no attraction found for Day ${index + 1}, ${timeOfDay}`);
            if (!firstAttraction) console.log('No attraction found in content');
            if (attractionImages[index + 1]?.[timeOfDay]) console.log('Image already exists for this time');
          }
        });
      });
    } else {
      console.log('No finalPlan or itinerary found');
    }
  }, [finalPlan, fetchAttractionImage, attractionImages]);

  useEffect(() => {
    const loadedDestination = localStorage.getItem('destination') || t('defaultDestination');
    const loadedHomeLocation = localStorage.getItem('homeLocation') || t('defaultHomeLocation');
    const loadedTravelers = localStorage.getItem('travelers') || 'Family';
    const loadedGroupSize = localStorage.getItem('groupSize') || '3';
    const loadedNumDays = localStorage.getItem('numDays') || '3';
    const loadedBudget = localStorage.getItem('budget') || 'Mid-range';
    const loadedIsRoundTrip = localStorage.getItem('isRoundTrip');
    const loadedTimeToVisit = localStorage.getItem('timeToVisit') || 'flexible';
    const loadedAccommodationType = localStorage.getItem('accommodationType') || 'flexible';
    const loadedTransportationMode = localStorage.getItem('transportationMode') || 'flexible';
    const loadedSpecialRequirements = localStorage.getItem('specialRequirements') || '';

    setDestination(loadedDestination);
    setHomeLocation(loadedHomeLocation);
    setTravelers(loadedTravelers);
    setGroupSize(loadedGroupSize);
    setNumDays(loadedNumDays);
    setBudget(loadedBudget);
    setIsRoundTrip(loadedIsRoundTrip === null ? true : loadedIsRoundTrip === 'true');
    setTimeToVisit(loadedTimeToVisit);
    setAccommodationType(loadedAccommodationType);
    setTransportationMode(loadedTransportationMode);
    setSpecialRequirements(loadedSpecialRequirements);
  }, [t]);

  const savePreferencesToLocalStorage = () => {
    localStorage.setItem('destination', destination);
    localStorage.setItem('homeLocation', homeLocation);
    localStorage.setItem('travelers', travelers);
    localStorage.setItem('groupSize', groupSize);
    localStorage.setItem('numDays', numDays);
    localStorage.setItem('budget', budget);
    localStorage.setItem('isRoundTrip', isRoundTrip.toString());
    localStorage.setItem('timeToVisit', timeToVisit);
    localStorage.setItem('accommodationType', accommodationType);
    localStorage.setItem('transportationMode', transportationMode);
    localStorage.setItem('specialRequirements', specialRequirements);
  };

  const logEvent = (category, action, label) => {
    if (process.env.NODE_ENV === 'production') {
      ReactGA.event({
        category,
        action,
        label
      });
    }
  };

  const handleDestinationChange = (e) => {
    setDestination(e.target.value);
    localStorage.setItem('destination', e.target.value);
    logEvent("User Input", "Changed Destination", e.target.value);
  };

  const handleHomeLocationChange = (e) => {
    setHomeLocation(e.target.value);
    localStorage.setItem('homeLocation', e.target.value);
    logEvent("User Input", "Changed Home Location", e.target.value);
  };

  const handleTravelersChange = (event) => {
    const value = event.target.value;
    setTravelers(value);
    localStorage.setItem('travelers', value);
    if (value === 'Solo') {
      setGroupSize('1');
      localStorage.setItem('groupSize', '1');
    } else if (value === 'Couple') {
      setGroupSize('2');
      localStorage.setItem('groupSize', '2');
    } else if (value === 'Family') {
      setGroupSize('3');
      localStorage.setItem('groupSize', '3');
    } else if (value === 'Group') {
      setGroupSize('5');
      localStorage.setItem('groupSize', '5');
    }
    if (isMobile) handleDrawerClose();
    logEvent("User Input", "Changed Travelers", value);
  };

  const handleGroupSizeChange = (e) => {
    setGroupSize(e.target.value);
    localStorage.setItem('groupSize', e.target.value);
    logEvent("User Input", "Changed Group Size", e.target.value);
  };

  const handleNumDaysChange = (e) => {
    setNumDays(e.target.value);
    localStorage.setItem('numDays', e.target.value);
    logEvent("User Input", "Changed Number of Days", e.target.value);
  };

  const handleBudgetChange = (event) => {
    setBudget(event.target.value);
    localStorage.setItem('budget', event.target.value);
    if (isMobile) handleDrawerClose();
    logEvent("User Input", "Changed Budget", event.target.value);
  };

  const handleIsRoundTripChange = (e) => {
    const newValue = e.target.checked;
    setIsRoundTrip(newValue);
    localStorage.setItem('isRoundTrip', newValue.toString());
    logEvent("User Input", "Changed Round Trip", newValue ? "Yes" : "No");
  };

  const handleTimeToVisitChange = (e) => {
    setTimeToVisit(e.target.value);
    localStorage.setItem('timeToVisit', e.target.value);
    logEvent("User Input", "Changed Time to Visit", e.target.value);
  };

  const handleAccommodationTypeChange = (e) => {
    setAccommodationType(e.target.value);
    localStorage.setItem('accommodationType', e.target.value);
    logEvent("User Input", "Changed Accommodation Type", e.target.value);
  };

  const handleTransportationModeChange = (e) => {
    setTransportationMode(e.target.value);
    localStorage.setItem('transportationMode', e.target.value);
    logEvent("User Input", "Changed Transportation Mode", e.target.value);
  };

  const handleSpecialRequirementsChange = (e) => {
    setSpecialRequirements(e.target.value);
    localStorage.setItem('specialRequirements', e.target.value);
    logEvent("User Input", "Changed Special Requirements", e.target.value);
  };

  const handleCommonPreferenceClick = (prefKey) => {
    const translatedPreference = t(prefKey);
    setSpecialRequirements(prev => {
      const currentPreferences = prev ? prev.split(', ') : [];
      let updatedPreferences;
      
      if (currentPreferences.includes(translatedPreference)) {
        updatedPreferences = currentPreferences.filter(pref => pref !== translatedPreference);
      } else {
        updatedPreferences = [...currentPreferences, translatedPreference];
      }
      
      return updatedPreferences.join(', ');
    });
    logEvent("User Input", "Clicked Common Preference", prefKey);
  };

  const getLLMResponse = async (prompt) => {
    setCurrentPrompt(prompt);
    const updatedHistory = [...conversationHistory, { role: "user", content: prompt }];
    setConversationHistory(updatedHistory);

    try {
      const response = await client.chat.completions.create({
        model: "gpt-4",
        messages: updatedHistory
      });

      const llmResponse = response.choices[0].message.content;
      setConversationHistory([...updatedHistory, { role: "assistant", content: llmResponse }]);
      return llmResponse;
    } catch (error) {
      logger.error("Error in getLLMResponse:", error);
      throw error;
    }
  };

  const generateOptions = async (aspect) => {
    setIsGeneratingOptions(prev => ({ ...prev, [aspect]: true }));
    const aspectPreference = aspectPreferences[aspect] || '';
    let travelersInfo = `Who's traveling: ${travelers}`;
    if (travelers === 'Family' || travelers === 'Group') {
      travelersInfo += `. Group size: ${groupSize}`;
    }
    const prompt = `For a ${numDays}-day trip to ${destination} from ${homeLocation}, provide 4 distinct options for ${aspect}. ${travelersInfo}. User's preference: "${aspectPreference}". Each option should be a brief markdown bullet point (no more than 30 words) and represent a different approach or choice, considering the type of travelers and trip duration. 

When mentioning specific attractions, landmarks, unique experiences, or notable places, enclose the entire relevant phrase in square brackets [like this], not just individual words. For example, use "[Hollywood Classic Restaurant]" instead of just "[Hollywood]". Be as specific and descriptive as possible when marking these entities.

Ensure each option is unique and provides a different experience or approach.`;

    const optionsResponse = await getLLMResponse(prompt);
    
    const validOptions = optionsResponse.split('\n')
      .map(option => option.trim())
      .filter(option => option && option.startsWith('- ') && option.length > 5)
      .map(option => {
        return option.replace(/\[([^\]]+)\]/g, (_, entity) => {
          return `[${entity}](${createGoogleSearchLink(entity)})`;
        });
      });

    if (validOptions.length < 3) {
      setIsGeneratingOptions(prev => ({ ...prev, [aspect]: false }));
      generateOptions(aspect);
      return;
    }

    setOptions(prevOptions => {
      const existingOptions = prevOptions[aspect] || [];
      const newOptions = [...validOptions];
      const updatedOptions = [...existingOptions, ...newOptions];
      
      setNewOptionIndices(prev => ({
        ...prev,
        [aspect]: updatedOptions.map((_, index) => index >= existingOptions.length)
      }));

      return {
        ...prevOptions,
        [aspect]: updatedOptions
      };
    });
    setIsGeneratingOptions(prev => ({ ...prev, [aspect]: false }));
  };

  useEffect(() => {
    Object.keys(newOptionIndices).forEach(aspect => {
      if (scrollRefs.current[aspect]) {
        scrollRefs.current[aspect].scrollTop = scrollRefs.current[aspect].scrollHeight;
      }
    });

    const timer = setTimeout(() => {
      setNewOptionIndices({});
    }, 2000);

    return () => clearTimeout(timer);
  }, [newOptionIndices]);

  const handleOptionToggle = (aspect, option) => {
    setSelectedOptions(prev => {
      const current = prev[aspect] || [];
      const updated = current.includes(option)
        ? current.filter(item => item !== option)
        : [...current, option];
      return {
        ...prev,
        [aspect]: updated
      };
    });
  };

  const finalizePlan = async () => {
    logEvent("User Action", "Finalized Plan", `${destination} - ${numDays} days`);
    setIsLoading(true);
    setIsFullPlanGeneration(true);
    const travelInfo = {
      type: `${numDays}-day ${isRoundTrip ? 'round trip' : 'one-way trip'}`,
      from: homeLocation,
      to: destination,
      travelers: travelers,
      groupSize: travelers === 'Family' || travelers === 'Group' ? groupSize : null,
      budget: budget,
      transportation: transportationMode,
      accommodation: accommodationType,
      timeToVisit: timeToVisit
    };

    let finalPrompt = `Please respond in ${language === 'zh' ? 'Chinese' : 'English'}. `;
    finalPrompt += `Plan a ${travelInfo.type} from ${travelInfo.from} to ${travelInfo.to} for ${travelInfo.travelers}`;
    if (travelInfo.groupSize) finalPrompt += ` (group of ${travelInfo.groupSize})`;
    finalPrompt += `. Budget: ${travelInfo.budget}.`;
    finalPrompt += ` Transportation: ${travelInfo.transportation === 'flexible' ? 'flexible options' : travelInfo.transportation}.`;
    finalPrompt += ` Accommodation: ${travelInfo.accommodation === 'flexible' ? 'flexible options' : t(`accommodations.${travelInfo.accommodation}`)}.`;
    finalPrompt += ` Time to visit: ${travelInfo.timeToVisit === 'flexible' ? 'flexible' : t(`timetovisit.${travelInfo.timeToVisit}`)}.`;

    if (specialRequirements) {
      finalPrompt += ` Special Requirements: ${specialRequirements}.`;
    }

    finalPrompt += ` Please provide a comprehensive ${numDays}-day travel plan based on these choices and preferences, taking into account the type of travelers. Include an estimated cost range for the trip, with a breakdown for major categories (e.g., accommodation, transportation, food, activities). 

When mentioning specific attractions, landmarks, unique experiences, or notable places, enclose the entire relevant phrase in square brackets [like this], not just individual words. For example, use "[Hollywood Classic Restaurant]" instead of just "[Hollywood]". Be as specific and descriptive as possible when marking these entities. Do not mark general activities or common nouns.

Your response must be a valid JSON object with the following structure:
{
  "itinerary": [
    {
      "day": 1,
      "morning": "Description of morning activities with [specific attractions] marked",
      "afternoon": "Description of afternoon activities with [specific landmarks] marked",
      "evening": "Description of evening activities with [unique experiences] marked"
    },
    // ... repeat for each day
  ],
  "estimatedCost": {
    "total": "Total cost range for the entire trip",
    "breakdown": {
      "accommodation": "Cost range for accommodation",
      "transportation": "Cost range for transportation",
      "food": "Cost range for food",
      "activities": "Cost range for activities",
      "other": "Cost range for other expenses"
    }
  }
}

Do not include any text outside of this JSON structure. Ensure all JSON keys are enclosed in double quotes and that the JSON is valid.`;

    try {
      const response = await getLLMResponse(finalPrompt);
      logger.debug("Raw LLM response:", response);

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(response);
      } catch (parseError) {
        logger.error("Failed to parse LLM response:", parseError);
        logger.debug("Attempting to extract JSON from response...");
        
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsedResponse = JSON.parse(jsonMatch[0]);
          } catch (extractError) {
            logger.error("Failed to extract and parse JSON:", extractError);
          }
        }
      }

      if (parsedResponse && parsedResponse.itinerary) {
        for (let day of parsedResponse.itinerary) {
          ['morning', 'afternoon', 'evening'].forEach(timeOfDay => {
            day[timeOfDay] = day[timeOfDay].replace(/\[([^\]]+)\]/g, (_, entity) => {
              return `<a href="${createGoogleSearchLink(entity)}" target="_blank" rel="noopener noreferrer">${entity}</a>`;
            });
          });
        }

        logger.debug("Parsed response:", parsedResponse);
        
        setDayVersions({});
        setCurrentPages({});
        
        setAttractionImages({});
        
        setFinalPlan(parsedResponse);

        parsedResponse.itinerary.forEach((day, index) => {
          ['morning', 'afternoon', 'evening'].forEach(timeOfDay => {
            const content = day[timeOfDay];
            const firstAttraction = content.match(/<a[^>]*>([^<]+)<\/a>/)?.[1] || '';
            if (firstAttraction) {
              fetchAttractionImage(firstAttraction, index + 1, timeOfDay);
            }
          });
        });
      } else {
        logger.error("Invalid response structure:", parsedResponse);
        setFinalPlan({ error: "Failed to generate a valid itinerary. Please try again." });
      }
    } catch (error) {
      logger.error("Error in finalizePlan:", error);
      setFinalPlan({ error: "An error occurred while generating the travel plan. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && isFullPlanGeneration && finalPlanRef.current) {
      setTimeout(() => {
        const yOffset = -80;
        const element = finalPlanRef.current;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        
        window.scrollTo({top: y, behavior: 'smooth'});
        setIsFullPlanGeneration(false);
      }, 100);
    }
  }, [isLoading, isFullPlanGeneration]);

  const handlePreferenceChange = (aspect, value) => {
    setAspectPreferences(prev => ({ ...prev, [aspect]: value }));
  };

  const handleKeyPress = (aspect, event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      generateOptions(aspect);
    }
  };

  const handleAspectInput = async (input) => {
    const prompt = `Based on the user's input about ${currentAspect}: '${input}', provide 5 distinct and mutually exclusive options for their trip to ${destination}. Each option should be succinct (no more than 15 words) and represent a different approach or choice.`;
    const optionsResponse = await getLLMResponse(prompt);
    setOptions(optionsResponse.split('\n'));
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  const handlePageChange = (day, page) => {
    setCurrentPages(prev => ({
      ...prev,
      [day]: page
    }));
  };

  const regenerateItinerary = async (day, timeOfDay = null) => {
    logEvent("User Action", "Regenerated Itinerary", `Day ${day}${timeOfDay ? ` - ${timeOfDay}` : ''}`);
    setRegeneratingItinerary({ day, timeOfDay });
    setIsLoading(true);

    const travelInfo = {
      type: `${numDays}-day ${isRoundTrip ? 'round trip' : 'one-way trip'}`,
      from: homeLocation,
      to: destination,
      travelers: travelers,
      groupSize: travelers === 'Family' || travelers === 'Group' ? groupSize : null,
      budget: budget,
      transportation: transportationMode,
      accommodation: accommodationType,
      timeToVisit: timeToVisit
    };

    const stripHtml = (html) => {
      return html.replace(/<[^>]*>/g, '');
    };

    let existingItineraryContext = '';
    finalPlan.itinerary.forEach((existingDay, index) => {
      if (index + 1 !== day) {
        existingItineraryContext += `Day ${existingDay.day}:\n`;
        ['morning', 'afternoon', 'evening'].forEach(tod => {
          existingItineraryContext += `${tod.charAt(0).toUpperCase() + tod.slice(1)}: ${stripHtml(existingDay[tod])}\n`;
        });
        existingItineraryContext += '\n';
      } else if (timeOfDay) {
        existingItineraryContext += `Current Day ${existingDay.day}:\n`;
        ['morning', 'afternoon', 'evening'].forEach(tod => {
          if (tod !== timeOfDay) {
            existingItineraryContext += `${tod.charAt(0).toUpperCase() + tod.slice(1)}: ${stripHtml(existingDay[tod])}\n`;
          }
        });
        existingItineraryContext += '\n';
      }
    });

    let regeneratePrompt = `Please respond in ${language === 'zh' ? 'Chinese' : 'English'}. `;
    regeneratePrompt += `Regenerate the itinerary for ${timeOfDay ? `the ${timeOfDay} of ` : ''}Day ${day} of the ${travelInfo.type} from ${travelInfo.from} to ${travelInfo.to} for ${travelInfo.travelers}`;
    if (travelInfo.groupSize) regeneratePrompt += ` (group of ${travelInfo.groupSize})`;
    regeneratePrompt += `. Budget: ${travelInfo.budget}.`;
    regeneratePrompt += ` Transportation: ${travelInfo.transportation === 'flexible' ? 'flexible options' : travelInfo.transportation}.`;
    regeneratePrompt += ` Accommodation: ${travelInfo.accommodation === 'flexible' ? 'flexible options' : t(`accommodations.${travelInfo.accommodation}`)}.`;
    regeneratePrompt += ` Time to visit: ${travelInfo.timeToVisit === 'flexible' ? 'flexible' : t(`timetovisit.${travelInfo.timeToVisit}`)}.`;

    if (specialRequirements) {
      regeneratePrompt += ` Special Requirements: ${specialRequirements}.`;
    }

    regeneratePrompt += ` Here's the context of the existing itinerary:

${existingItineraryContext}

Please provide a ${timeOfDay ? '' : 'full day '}itinerary based on these choices and preferences, ensuring it complements the existing plan without duplicating activities. ${timeOfDay ? `Focus on creating a coherent plan for the ${timeOfDay} of Day ${day}, considering the other activities planned for this day.` : ''} Keep each time period description to about 30-50 words.

When mentioning specific attractions, landmarks, unique experiences, or notable places, enclose the entire relevant phrase in square brackets [like this]. Be specific but brief when marking these entities. Do not mark general activities or common nouns.

Format the response as a JSON object with the following structure:
{
  ${timeOfDay ? `
  "${timeOfDay}": "Description of ${timeOfDay} activities for Day ${day} with [specific attractions] marked"
    ` : `
  "morning": "Description of morning activities with [specific attractions] marked",
  "afternoon": "Description of afternoon activities with [specific landmarks] marked",
  "evening": "Description of evening activities with [unique experiences] marked"
  `}
}

Do not include any text outside of this JSON structure. Ensure all JSON keys are enclosed in double quotes and that the JSON is valid.`;

    try {
      const response = await getLLMResponse(regeneratePrompt);
      logger.debug("Raw LLM response for regeneration:", response);

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(response);
      } catch (parseError) {
        logger.error("Failed to parse LLM response for regeneration:", parseError);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsedResponse = JSON.parse(jsonMatch[0]);
          } catch (extractError) {
            logger.error("Failed to extract and parse JSON for regeneration:", extractError);
          }
        }
      }

      if (parsedResponse) {
        const updatedItinerary = [...finalPlan.itinerary];
        const dayIndex = day - 1;

        if (timeOfDay) {
          updatedItinerary[dayIndex] = {
            ...updatedItinerary[dayIndex],
            [timeOfDay]: parsedResponse[timeOfDay].replace(/\[([^\]]+)\]/g, (_, entity) => {
              return `<a href="${createGoogleSearchLink(entity)}" target="_blank" rel="noopener noreferrer">${entity}</a>`;
            })
          };
        } else {
          updatedItinerary[dayIndex] = {
            day,
            morning: parsedResponse.morning.replace(/\[([^\]]+)\]/g, (_, entity) => {
              return `<a href="${createGoogleSearchLink(entity)}" target="_blank" rel="noopener noreferrer">${entity}</a>`;
            }),
            afternoon: parsedResponse.afternoon.replace(/\[([^\]]+)\]/g, (_, entity) => {
              return `<a href="${createGoogleSearchLink(entity)}" target="_blank" rel="noopener noreferrer">${entity}</a>`;
            }),
            evening: parsedResponse.evening.replace(/\[([^\]]+)\]/g, (_, entity) => {
              return `<a href="${createGoogleSearchLink(entity)}" target="_blank" rel="noopener noreferrer">${entity}</a>`;
            })
          };
        }

        setFinalPlan(prevPlan => ({
          ...prevPlan,
          itinerary: updatedItinerary
        }));

        setDayVersions(prevVersions => {
          const dayVersions = prevVersions[day] || [];
          const newVersions = {
            ...prevVersions,
            [day]: [...dayVersions, updatedItinerary[dayIndex]]
          };
          
          // Update current page
          setCurrentPages(prevPages => ({
            ...prevPages,
            [day]: newVersions[day].length
          }));

          return newVersions;
        });

        // Fetch new images for the regenerated content
        ['morning', 'afternoon', 'evening'].forEach(tod => {
          if (!timeOfDay || timeOfDay === tod) {
            const content = parsedResponse[tod];
            const firstAttraction = content.match(/\[([^\]]+)\]/)?.[1] || '';
            if (firstAttraction) {
              fetchAttractionImage(firstAttraction, day, tod);
            }
          }
        });

      } else {
        logger.error("Invalid response structure for regeneration:", parsedResponse);
      }
    } catch (error) {
      logger.error("Error in regenerateItinerary:", error);
    } finally {
      setIsLoading(false);
      setRegeneratingItinerary({ day: null, timeOfDay: null });
    }
  };

  const resetAllSettings = () => {
    setDestination(t('defaultDestination'));
    setHomeLocation(t('defaultHomeLocation'));
    setTravelers('Family');
    setGroupSize('3');
    setNumDays('3');
    setBudget('Mid-range');
    setIsRoundTrip(true);
    setTimeToVisit('flexible');
    setAccommodationType('flexible');
    setTransportationMode('flexible');
    setSpecialRequirements('');
    setFinalPlan(null);
    setOptions({});
    setSelectedOptions({});
    setConversationHistory([]);
    setAspectPreferences({});
    setCoveredAspects(new Set());
    setDayVersions({});
    setCurrentPages({});
    setAttractionImages({});

    localStorage.removeItem('destination');
    localStorage.removeItem('homeLocation');
    localStorage.removeItem('travelers');
    localStorage.removeItem('groupSize');
    localStorage.removeItem('numDays');
    localStorage.removeItem('budget');
    localStorage.removeItem('isRoundTrip');
    localStorage.removeItem('timeToVisit');
    localStorage.removeItem('accommodationType');
    localStorage.removeItem('transportationMode');
    localStorage.removeItem('specialRequirements');

    logEvent("User Action", "Reset All Settings", "");
  };

  const renderItinerary = () => {
    if (!finalPlan || !finalPlan.itinerary) return null;

    return (
      <Box>
        {finalPlan.itinerary.map((day, index) => (
          <Card key={index} sx={{ mb: 2, position: 'relative' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('day')} {day.day}
              </Typography>
              {['morning', 'afternoon', 'evening'].map((timeOfDay) => (
                <Box key={timeOfDay} sx={{ mb: 2, position: 'relative' }}>
                  <Typography variant="subtitle1" sx={{ textTransform: 'capitalize', fontWeight: 'bold' }}>
                    {t(timeOfDay)}:
                  </Typography>
                  <ReactMarkdown components={{
                    p: ({ children }) => <Typography variant="body1">{children}</Typography>,
                    a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
                  }}>
                    {day[timeOfDay]}
                  </ReactMarkdown>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => regenerateItinerary(day.day, timeOfDay)}
                    sx={{ mt: 1, position: 'absolute', right: 0, bottom: 0 }}
                    disabled={isLoading || (regeneratingItinerary.day === day.day && regeneratingItinerary.timeOfDay === timeOfDay)}
                  >
                    {isLoading && regeneratingItinerary.day === day.day && regeneratingItinerary.timeOfDay === timeOfDay ? (
                      <CircularProgress size={24} />
                    ) : (
                      t('regenerate')
                    )}
                  </Button>
                </Box>
              ))}
              {attractionImages[day.day] && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  {['morning', 'afternoon', 'evening'].map((timeOfDay) => (
                    <Box key={timeOfDay} sx={{ width: '32%', position: 'relative' }}>
                      {attractionImages[day.day][timeOfDay] ? (
                        <CardMedia
                          component="img"
                          height="140"
                          image={attractionImages[day.day][timeOfDay]}
                          alt={`${t(timeOfDay)} attraction`}
                          sx={{ borderRadius: 1 }}
                        />
                      ) : (
                        <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 1 }} />
                      )}
                      <Typography variant="caption" sx={{ position: 'absolute', bottom: 5, left: 5, color: 'white', backgroundColor: 'rgba(0,0,0,0.5)', padding: '2px 5px', borderRadius: 1 }}>
                        {t(timeOfDay)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, pb: 2 }}>
              <Button
                variant="contained"
                onClick={() => regenerateItinerary(day.day)}
                disabled={isLoading || (regeneratingItinerary.day === day.day && !regeneratingItinerary.timeOfDay)}
              >
                {isLoading && regeneratingItinerary.day === day.day && !regeneratingItinerary.timeOfDay ? (
                  <CircularProgress size={24} />
                ) : (
                  t('regenerateFullDay')
                )}
              </Button>
              {dayVersions[day.day] && dayVersions[day.day].length > 1 && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    {t('version')} {currentPages[day.day] || dayVersions[day.day].length} / {dayVersions[day.day].length}
                  </Typography>
                  <Pagination
                    count={dayVersions[day.day].length}
                    page={currentPages[day.day] || dayVersions[day.day].length}
                    onChange={(event, page) => handlePageChange(day.day, page)}
                    size="small"
                  />
                </Box>
              )}
            </Box>
          </Card>
        ))}
        {finalPlan.estimatedCost && (
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>{t('estimatedCost')}</Typography>
              <Typography variant="body1">{t('total')}: {finalPlan.estimatedCost.total}</Typography>
              <Typography variant="subtitle1" sx={{ mt: 1 }}>{t('breakdown')}:</Typography>
              <ul>
                {Object.entries(finalPlan.estimatedCost.breakdown).map(([category, cost]) => (
                  <li key={category}>
                    <Typography variant="body2">{t(category)}: {cost}</Typography>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="fixed">
        <Toolbar>
          {isMobile && (
            <Tooltip title={t('travelersInformation')}>
              <IconButton
                color="inherit"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
                aria-label={t('travelersInformation')}
              >
                <PersonIcon />
              </IconButton>
            </Tooltip>
          )}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {t('title')}
          </Typography>
          <FormControl sx={{ minWidth: 80 }} size="small">
            <Select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              displayEmpty
              inputProps={{ 'aria-label': 'Without label' }}
              sx={{ color: 'white', '& .MuiSvgIcon-root': { color: 'white' } }}
            >
              <MenuItem value="zh">中文</MenuItem>
              <MenuItem value="en">EN</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title={t('resetAllSettings')}>
            <IconButton
              color="inherit"
              onClick={resetAllSettings}
              sx={{ ml: 2 }}
              aria-label={t('resetAllSettings')}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          {!isProduction && (
            <Tooltip title={t('toggleDebug')}>
              <IconButton
                color="inherit"
                onClick={() => setShowDebug(!showDebug)}
                sx={{ ml: 2 }}
                aria-label={t('toggleDebug')}
              >
                <BugReportIcon />
              </IconButton>
            </Tooltip>
          )}
        </Toolbar>
      </AppBar>
      <Toolbar />
      <Grid container spacing={2} sx={{ p: 2, mt: 2 }}>
        {!isMobile && (
          <Grid item xs={12}>
            <TravelerSection
              travelers={travelers}
              groupSize={groupSize}
              homeLocation={homeLocation}
              budget={budget}
              handleTravelersChange={handleTravelersChange}
              handleGroupSizeChange={handleGroupSizeChange}
              handleHomeLocationChange={handleHomeLocationChange}
              handleBudgetChange={handleBudgetChange}
            />
          </Grid>
        )}
        
        <Grid item xs={12}>
          <TripDetailsSection
            destination={destination}
            numDays={numDays}
            timeToVisit={timeToVisit}
            transportationMode={transportationMode}
            accommodationType={accommodationType}
            isRoundTrip={isRoundTrip}
            isLoading={isLoading}
            handleDestinationChange={handleDestinationChange}
            handleNumDaysChange={handleNumDaysChange}
            handleTimeToVisitChange={handleTimeToVisitChange}
            handleTransportationModeChange={handleTransportationModeChange}
            handleAccommodationTypeChange={handleAccommodationTypeChange}
            handleIsRoundTripChange={handleIsRoundTripChange}
          />

          <SpecialRequirementsSection
            specialRequirements={specialRequirements}
            handleSpecialRequirementsChange={handleSpecialRequirementsChange}
            handleCommonPreferenceClick={handleCommonPreferenceClick}
            allCommonPreferences={Object.values(commonPreferences).flat()}
            isLoading={isLoading}
          />

          <Button 
            variant="contained" 
            onClick={finalizePlan}
            sx={{ mt: 2, width: '100%', mb: 4 }}
            disabled={isLoading}
          >
            {isLoading ? t('generatingTravelPlan') : t('finalizePlan')}
          </Button>

          {showDebug && !isProduction && currentPrompt && (
            <Card sx={{ mt: 2, backgroundColor: '#f0f0f0' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>{t('currentLLMPrompt')}</Typography>
                <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {currentPrompt}
                </Typography>
              </CardContent>
            </Card>
          )}

          {finalPlan && (
            <Box sx={{ mt: 4 }} ref={finalPlanRef}>
              <Typography variant="h5" gutterBottom>{t('yourTravelPlan')}</Typography>
              {renderItinerary()}
            </Box>
          )}
        </Grid>
      </Grid>
      {isMobile && (
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={handleDrawerClose}
          ModalProps={{
            keepMounted: true,
          }}
        >
          <Box
            sx={{
              width: 250,
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
            role="presentation"
          >
            <TravelerSection
              travelers={travelers}
              groupSize={groupSize}
              homeLocation={homeLocation}
              budget={budget}
              handleTravelersChange={handleTravelersChange}
              handleGroupSizeChange={handleGroupSizeChange}
              handleHomeLocationChange={handleHomeLocationChange}
              handleBudgetChange={handleBudgetChange}
            />
          </Box>
        </Drawer>
      )}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      {process.env.NODE_ENV === 'production' && <GoogleAnalytics />}
    </Box>
  );
};

export default () => (
  <LanguageProvider>
    <TravelPlannerApp />
  </LanguageProvider>
);