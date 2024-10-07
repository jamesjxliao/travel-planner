import React, { useState, useEffect, useRef, useCallback } from 'react';
import OpenAI from 'openai';
import ReactGA from "react-ga4";
import { Typography, Grid, FormControl, Select, MenuItem, Box, Switch, FormControlLabel, useMediaQuery, Drawer, IconButton, AppBar, Toolbar } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import BugReportIcon from '@mui/icons-material/BugReport';
import PersonIcon from '@mui/icons-material/Person';
import Tooltip from '@mui/material/Tooltip';
import RefreshIcon from '@mui/icons-material/Refresh';
import GoogleAnalytics from './components/GoogleAnalytics';
import { createLogger } from './utils/logger';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import TravelerSection from './components/TravelerSection';
import TripDetailsSection from './components/TripDetailsSection';
import SpecialRequirementsSection from './components/SpecialRequirementsSection';
import FinalizePlanButton from './components/FinalizePlanButton';
import DebugSection from './components/DebugSection';
import FinalPlanSection from './components/FinalPlanSection';
import { cacheImage, getCachedImage } from './utils/cacheUtils';

const client = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // This is not recommended for production use
});

const createGoogleSearchLink = (text) => {
  const searchQuery = encodeURIComponent(text);
  return `https://www.google.com/search?q=${searchQuery}`;
};

const commonPreferences = {
  "Food": ["food.localcuisine", "food.finedining", "food.streetfood", "food.vegetarian", "food.familyfriendly"],
  "Attractions": ["attractions.museums", "attractions.nature", "attractions.historicalsites", "attractions.themeparks", "attractions.shopping"]
};

// Initialize Google Analytics only in production
if (process.env.NODE_ENV === 'production') {
  ReactGA.initialize("G-5FTTLPJ62P");
}

const TravelPlannerApp = () => {
  const { language, setLanguage, t } = useLanguage();
  const [destination, setDestination] = useState('');
  const [homeLocation, setHomeLocation] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [finalPlan, setFinalPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [travelers, setTravelers] = useState('Family');
  const [groupSize, setGroupSize] = useState('3');
  const [numDays, setNumDays] = useState('3');
  const [isRoundTrip, setIsRoundTrip] = useState(true);
  const [budget, setBudget] = useState('Mid-range');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [timeToVisit, setTimeToVisit] = useState('flexible');
  const [accommodationType, setAccommodationType] = useState('flexible');
  const [transportationMode, setTransportationMode] = useState('flexible');
  const [regeneratingItinerary, setRegeneratingItinerary] = useState({ day: null, timeOfDay: null });
  const [dayVersions, setDayVersions] = useState({});
  const [currentPages, setCurrentPages] = useState({});
  const [attractionImages, setAttractionImages] = useState({});

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isFullPlanGeneration, setIsFullPlanGeneration] = useState(false);
  const finalPlanRef = useRef(null);

  const isProduction = process.env.NODE_ENV === 'production';
  const logger = createLogger(process.env.NODE_ENV);

  const allCommonPreferences = Object.values(commonPreferences).flat();

  const fetchAttractionImage = useCallback(async (attraction, day, timeOfDay) => {
    console.log(`Fetching image for: ${attraction}, Day: ${day}, Time: ${timeOfDay}`);
    const apiKey = process.env.REACT_APP_GOOGLE_PLACES_API_KEY;
    console.log('API Key:', apiKey ? 'Set' : 'Not set');
    
    if (!apiKey) {
      console.error('API key is not set');
      return;
    }

    const imageName = `attractionImage_${attraction}`;

    // Check if the image is already in the cache
    const cachedImage = await getCachedImage(imageName);
    if (cachedImage) {
      console.log('Using cached image for:', attraction);
      const imageUrl = URL.createObjectURL(cachedImage);
      setAttractionImages(prev => ({
        ...prev,
        [day]: {
          ...(prev[day] || {}),
          [timeOfDay]: imageUrl
        }
      }));
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

            // Cache the image
            await cacheImage(imageUrl, imageName);

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

  const logEvent = (category, action, label) => {
    if (process.env.NODE_ENV === 'production') {
      ReactGA.event({
        category,
        action,
        label
      });
    }
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

  const resetAllSettings = useCallback(() => {
    logEvent("User Action", "Reset All Settings");
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
    localStorage.clear();
  }, [t]);

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
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Toolbar />
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
              setTravelers={setTravelers}
              groupSize={groupSize}
              setGroupSize={setGroupSize}
              homeLocation={homeLocation}
              setHomeLocation={setHomeLocation}
              budget={budget}
              setBudget={setBudget}
            />
          </Box>
        </Drawer>
      )}
      {isProduction && <GoogleAnalytics />}
    </Box>
  );
};

export default () => (
  <LanguageProvider>
    <TravelPlannerApp />
  </LanguageProvider>
);