import React, { useState, useEffect, useRef, useCallback } from 'react';
import OpenAI from 'openai';
import ReactGA from "react-ga4";
import { Button, TextField, Card, CardContent, Typography, Grid, FormControl, InputLabel, Select, MenuItem, Chip, Box, Switch, FormControlLabel, Paper, useMediaQuery, Drawer, IconButton, AppBar, Toolbar } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { keyframes } from '@mui/system';
import BugReportIcon from '@mui/icons-material/BugReport';
import ReactMarkdown from 'react-markdown';
import PersonIcon from '@mui/icons-material/Person'; // Add this import
import Tooltip from '@mui/material/Tooltip'; // Add this import
import RefreshIcon from '@mui/icons-material/Refresh'; // Replace DeleteIcon with RefreshIcon
import Pagination from '@mui/material/Pagination'; // Add this import
import GoogleAnalytics from './components/GoogleAnalytics';
import { createLogger } from './utils/logger'; // We'll create this utility
import CardMedia from '@mui/material/CardMedia';
import Skeleton from '@mui/material/Skeleton'; // Add this import
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import TravelerSection from './components/TravelerSection';
import TripDetailsSection from './components/TripDetailsSection';
import SpecialRequirementsSection from './components/SpecialRequirementsSection';
import FinalizePlanButton from './components/FinalizePlanButton';
import DebugSection from './components/DebugSection';
import FinalPlanSection from './components/FinalPlanSection';

const client = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // This is not recommended for production use
});

// Define a highlight animation
const highlightAnimation = keyframes`
  0% { background-color: #fff9c4; }
  100% { background-color: transparent; }
`;

// Custom styled component for the scrollable box
const ScrollableBox = styled(Box)(({ theme }) => ({
  height: '375px',
  overflowY: 'auto',
  marginTop: '10px',
  // ... existing scrollbar styles ...
}));

// Styled component for highlighting new options
const HighlightCard = styled(Card)(({ theme, isNew }) => ({
  height: '170px',
  display: 'flex',
  flexDirection: 'column',
  animation: isNew ? `${highlightAnimation} 2s ease-in-out` : 'none',
}));

const createGoogleSearchLink = (text) => {
  const searchQuery = encodeURIComponent(text);
  return `https://www.google.com/search?q=${searchQuery}`;
};

const StyledContent = styled('div')(({ theme }) => ({
  '& a': {
    color: theme.palette.primary.main,
    textDecoration: 'underline',
    fontWeight: 'bold',
    '&:hover': {
      color: theme.palette.primary.dark,
    },
  },
}));

// Move commonPreferences here, before the TravelPlannerApp component
const commonPreferences = {
  // "Time to visit": ["timetovisit.spring", "timetovisit.summer", "timetovisit.fall", "timetovisit.winter", "timetovisit.holidays"],
  // "Accommodations": ["accommodations.hotel", "accommodations.airbnb", "accommodations.resort", "accommodations.hostel", "accommodations.camping"],
  "Food": ["food.localcuisine", "food.finedining", "food.streetfood", "food.vegetarian", "food.familyfriendly"],
  "Attractions": ["attractions.museums", "attractions.nature", "attractions.historicalsites", "attractions.themeparks", "attractions.shopping"]
};

// Initialize Google Analytics only in production
if (process.env.NODE_ENV === 'production') {
  ReactGA.initialize("G-5FTTLPJ62P"); // Replace with your Google Analytics measurement ID
}

const TravelPlannerApp = () => {
  const { language, setLanguage, t } = useLanguage();
  const [destination, setDestination] = useState(t('defaultDestination'));
  const [homeLocation, setHomeLocation] = useState(t('defaultHomeLocation'));
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
  const [budget, setBudget] = useState('Mid-range');  // New state for budget

  // Add this new state variable
  const [specialRequirements, setSpecialRequirements] = useState('');

  // Combine all common preferences
  const allCommonPreferences = Object.values(commonPreferences).flat();

  // Add a new state for time to visit
  const [timeToVisit, setTimeToVisit] = useState('flexible');

  // Add a new state for accommodation type
  const [accommodationType, setAccommodationType] = useState('flexible');

  // Add a new state for transportation mode
  const [transportationMode, setTransportationMode] = useState('flexible');

  const [coveredAspects, setCoveredAspects] = useState(new Set());

  // Add this new state variable
  const [regeneratingAspect, setRegeneratingAspect] = useState(null);

  // Add this new state variable
  const [regeneratingItinerary, setRegeneratingItinerary] = useState({ day: null, timeOfDay: null });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [isFullPlanGeneration, setIsFullPlanGeneration] = useState(false);
  const finalPlanRef = useRef(null);

  const [dayVersions, setDayVersions] = useState({});
  const [currentPages, setCurrentPages] = useState({});

  // Add this near the top of the component
  const isProduction = process.env.NODE_ENV === 'production';

  const [attractionImages, setAttractionImages] = useState({});

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
            // Handle missing photo reference (e.g., set a default image)
          }
        } else {
          console.log('No photos found for this place');
          // Handle no photos case (e.g., set a default image)
        }
      } else {
        console.log('No place found for this attraction');
        // Handle no place found case (e.g., set a default image)
      }
    } catch (error) {
      console.error('Error fetching image:', error);
      // Handle error case (e.g., set a default image)
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
          
          // Create a temporary element to parse the HTML
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = content;
          const textContent = tempDiv.textContent || tempDiv.innerText || '';

          // Extract all linked text
          const linkedAttractions = Array.from(tempDiv.querySelectorAll('a'))
            .map(a => a.textContent)
            .filter(text => text.trim() !== '');

          console.log(`Linked attractions:`, linkedAttractions);

          // Use the first linked attraction, or the first sentence if no links
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

  // Load preferences from localStorage on initial render
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
  }, [t]); // Remove language from the dependency array

  // Function to save preferences to localStorage
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

  // Update the ReactGA event calls
  const logEvent = (category, action, label) => {
    if (process.env.NODE_ENV === 'production') {
      ReactGA.event({
        category,
        action,
        label
      });
    }
  };

  // Replace all ReactGA.event calls with logEvent
  // For example:
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

  // Update this function to handle special requirements
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

  // Create a logger instance
  const logger = createLogger(process.env.NODE_ENV);

  // Replace console.log, console.error, etc. with logger methods
  const getLLMResponse = async (prompt) => {
    setCurrentPrompt(prompt);
    const updatedHistory = [...conversationHistory, { role: "user", content: prompt }];
    setConversationHistory(updatedHistory);

    try {
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
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
    
    // Filter and validate the options
    const validOptions = optionsResponse.split('\n')
      .map(option => option.trim())
      .filter(option => option && option.startsWith('- ') && option.length > 5)
      .map(option => {
        // Process each option to wrap entities with links
        return option.replace(/\[([^\]]+)\]/g, (_, entity) => {
          return `[${entity}](${createGoogleSearchLink(entity)})`;
        });
      });

    // If we don't have enough valid options, regenerate
    if (validOptions.length < 3) {
      setIsGeneratingOptions(prev => ({ ...prev, [aspect]: false }));
      generateOptions(aspect); // Recursively call to try again
      return;
    }

    setOptions(prevOptions => {
      const existingOptions = prevOptions[aspect] || [];
      const newOptions = [...validOptions];
      const updatedOptions = [...existingOptions, ...newOptions];
      
      // Set the indices of new options
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
    // Scroll to new options when they are generated
    Object.keys(newOptionIndices).forEach(aspect => {
      if (scrollRefs.current[aspect]) {
        scrollRefs.current[aspect].scrollTop = scrollRefs.current[aspect].scrollHeight;
      }
    });

    // Clear new option indices after a delay
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

    // Update this part to use only specialRequirements
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
        
        // Attempt to extract JSON from the response
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
        // Process each day's activities to wrap entities with links
        for (let day of parsedResponse.itinerary) {
          ['morning', 'afternoon', 'evening'].forEach(timeOfDay => {
            day[timeOfDay] = day[timeOfDay].replace(/\[([^\]]+)\]/g, (_, entity) => {
              return `<a href="${createGoogleSearchLink(entity)}" target="_blank" rel="noopener noreferrer">${entity}</a>`;
            });
          });
        }

        logger.debug("Parsed response:", parsedResponse);
        
        // Reset day versions and current pages when generating a new plan
        setDayVersions({});
        setCurrentPages({});
        
        // Clear existing attraction images
        setAttractionImages({});
        
        // Update the final plan state
        setFinalPlan(parsedResponse);

        // Fetch new images for each day and time of day
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
        const yOffset = -80; // Adjust this value as needed
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

    // Function to remove HTML tags
    const stripHtml = (html) => {
      return html.replace(/<[^>]*>/g, '');
    };

    // Create a context string from the existing itinerary
    let existingItineraryContext = '';
    finalPlan.itinerary.forEach((existingDay, index) => {
      if (index + 1 !== day) { // Other days
        existingItineraryContext += `Day ${existingDay.day}:\n`;
        ['morning', 'afternoon', 'evening'].forEach(tod => {
          existingItineraryContext += `${tod.charAt(0).toUpperCase() + tod.slice(1)}: ${stripHtml(existingDay[tod])}\n`;
        });
        existingItineraryContext += '\n';
      } else if (timeOfDay) { // The day being partially regenerated
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

    // Update this part to use only specialRequirements
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
  "morning": "Description of morning activities for Day ${day} with [specific attractions] marked",
  "afternoon": "Description of afternoon activities for Day ${day} with [specific landmarks] marked",
  "evening": "Description of evening activities for Day ${day} with [unique experiences] marked"
  `}
}`;

    try {
      const response = await getLLMResponse(regeneratePrompt);
      logger.debug("Raw LLM response:", response);

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(response);
      } catch (parseError) {
        logger.error("Failed to parse LLM response:", parseError);
        logger.debug("Attempting to extract JSON from response...");
        
        // Attempt to extract JSON from the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsedResponse = JSON.parse(jsonMatch[0]);
          } catch (extractError) {
            logger.error("Failed to extract and parse JSON:", extractError);
          }
        }
      }

      logger.debug("Parsed response:", parsedResponse);

      if (parsedResponse) {
        setDayVersions(prev => {
          const currentVersions = prev[day] || [finalPlan.itinerary[day - 1]];
          const lastVersion = { ...currentVersions[currentVersions.length - 1] };
          let newVersion = { ...lastVersion };

          if (timeOfDay) {
            newVersion[timeOfDay] = parsedResponse[timeOfDay].replace(/\[([^\]]+)\]/g, (_, entity) => {
              return `<a href="${createGoogleSearchLink(entity)}" target="_blank" rel="noopener noreferrer">${entity}</a>`;
            });
            // Fetch new image for the regenerated time of day
            fetchAttractionImage(parsedResponse[timeOfDay].match(/\[([^\]]+)\]/)?.[1] || '', day, timeOfDay);
          } else {
            ['morning', 'afternoon', 'evening'].forEach(tod => {
              if (parsedResponse[tod]) {
                newVersion[tod] = parsedResponse[tod].replace(/\[([^\]]+)\]/g, (_, entity) => {
                  return `<a href="${createGoogleSearchLink(entity)}" target="_blank" rel="noopener noreferrer">${entity}</a>`;
                });
                // Fetch new image for each time of day
                fetchAttractionImage(parsedResponse[tod].match(/\[([^\]]+)\]/)?.[1] || '', day, tod);
              }
            });
          }

          const updatedVersions = [...currentVersions, newVersion];
          
          // Set the current page to the newly generated version
          setCurrentPages(prevPages => ({
            ...prevPages,
            [day]: updatedVersions.length
          }));

          return {
            ...prev,
            [day]: updatedVersions
          };
        });
      } else {
        logger.error("Invalid response structure:", parsedResponse);
      }
    } catch (error) {
      logger.error("Error in regenerateItinerary:", error);
    } finally {
      setIsLoading(false);
      setRegeneratingItinerary({ day: null, timeOfDay: null });
    }
  };

  const renderMarkdownWithLinks = (content) => {
    return (
      <ReactMarkdown
        components={{
          a: ({ node, ...props }) => (
            <a target="_blank" rel="noopener noreferrer" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    );
  };

  // Define resetAllSettings using useCallback
  const resetAllSettings = useCallback(() => {
    logEvent("User Action", "Reset All Settings");
    // Reset all state variables to their default values
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

    // Clear all localStorage items
    localStorage.removeItem('destination');
    localStorage.removeItem('homeLocation');
    localStorage.removeItem('travelers');
    localStorage.removeItem('groupSize');
    localStorage.removeItem('numDays');
    localStorage.removeItem('budget');
    localStorage.removeItem('timeToVisit');
    localStorage.removeItem('accommodationType');
    localStorage.removeItem('transportationMode');
    localStorage.removeItem('specialRequirements');

    // Update the localStorage for isRoundTrip
    localStorage.setItem('isRoundTrip', 'true');

    // Clear the final plan
    setFinalPlan(null);
  }, [
    t, setDestination, setHomeLocation, setTravelers, setGroupSize, setNumDays,
    setBudget, setIsRoundTrip, setTimeToVisit, setAccommodationType,
    setTransportationMode, setSpecialRequirements, setFinalPlan
  ]); // Include all setter functions in the dependency array

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
          {!isMobile && !isProduction && (
            <FormControlLabel
              control={
                <Switch 
                  checked={showDebug} 
                  onChange={(e) => setShowDebug(e.target.checked)}
                  color="default"
                />
              }
              label={<BugReportIcon />}
              sx={{ mr: 2, color: 'white' }}
            />
          )}
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
              <RefreshIcon /> {/* Changed from DeleteIcon to RefreshIcon */}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Toolbar /> {/* This empty Toolbar acts as a spacer */}
      <Grid container spacing={2} sx={{ p: 2, mt: 2 }}>
        {!isMobile && (
          <Grid item xs={12}>
            <TravelerSection 
              travelers={travelers}
              setTravelers={setTravelers}
              groupSize={groupSize}
              setGroupSize={setGroupSize}
              homeLocation={homeLocation}
              setHomeLocation={setHomeLocation}
              budget={budget}
              setBudget={setBudget}
            />
          </Grid>
        )}
        
        <Grid item xs={12}>
          <TripDetailsSection 
              destination={destination}
              setDestination={setDestination}
              numDays={numDays}
              setNumDays={setNumDays}
              timeToVisit={timeToVisit}
              setTimeToVisit={setTimeToVisit}
              transportationMode={transportationMode}
              setTransportationMode={setTransportationMode}
              accommodationType={accommodationType}
              setAccommodationType={setAccommodationType}
              isRoundTrip={isRoundTrip}
              setIsRoundTrip={setIsRoundTrip}
              isLoading={isLoading}
            />

          <SpecialRequirementsSection 
            specialRequirements={specialRequirements}
            setSpecialRequirements={setSpecialRequirements}
            isLoading={isLoading}
            commonPreferences={allCommonPreferences}
            handleCommonPreferenceClick={handleCommonPreferenceClick}
          />

          <FinalizePlanButton 
            onClick={finalizePlan}
            isLoading={isLoading}
          />

          {showDebug && !isProduction && currentPrompt && (
            <DebugSection currentPrompt={currentPrompt} />
          )}

          {finalPlan && (
            <FinalPlanSection 
              finalPlan={finalPlan}
              dayVersions={dayVersions}
              currentPages={currentPages}
              handlePageChange={handlePageChange}
              regenerateItinerary={regenerateItinerary}
              isLoading={isLoading}
              regeneratingItinerary={regeneratingItinerary}
              attractionImages={attractionImages}
              finalPlanRef={finalPlanRef}
            />
          )}
        </Grid>
      </Grid>
      {isMobile && (
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={handleDrawerClose}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
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
            <TravelerSection />
          </Box>
        </Drawer>
      )}
      {process.env.NODE_ENV === 'production' && <GoogleAnalytics />}
    </Box>
  );
};

// Wrap the exported component with the LanguageProvider
export default () => (
  <LanguageProvider>
    <TravelPlannerApp />
  </LanguageProvider>
);