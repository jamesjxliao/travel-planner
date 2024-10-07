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
  const [debugInfo, setDebugInfo] = useState({ currentPrompt: '', llmResponse: '' });

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

          // Extract all linked text with attributes
          const linkedAttractions = Array.from(tempDiv.querySelectorAll('a'))
            .map(a => ({
              text: a.textContent,
              attribute: a.getAttribute('data-attr') || 'unknown'
            }))
            .filter(item => item.text.trim() !== '');

          console.log(`Linked attractions:`, linkedAttractions);

          // Prioritize non-restaurant attractions
          const prioritizedAttractions = linkedAttractions.sort((a, b) => {
            if (a.attribute === 'restaurant' && b.attribute !== 'restaurant') return 1;
            if (a.attribute !== 'restaurant' && b.attribute === 'restaurant') return -1;
            return 0;
          });

          // Use the first prioritized attraction, or the first sentence if no links
          let firstAttraction = prioritizedAttractions[0]?.text || textContent.split('.')[0].trim().slice(0, 100);
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

  const generatePrompt = (isRegeneration = false, day = null, timeOfDay = null) => {
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

    let prompt = `Please respond in ${language === 'zh' ? 'Chinese' : 'English'}. `;
    prompt += `${isRegeneration ? `Regenerate the itinerary for ${timeOfDay ? `the ${timeOfDay} of ` : ''}Day ${day} of the ` : 'Plan a '}${travelInfo.type} from ${travelInfo.from} to ${travelInfo.to} for ${travelInfo.travelers}`;
    if (travelInfo.groupSize) prompt += ` (group of ${travelInfo.groupSize})`;
    prompt += `. Budget: ${travelInfo.budget}.`;
    prompt += ` Transportation: ${travelInfo.transportation === 'flexible' ? 'flexible options' : travelInfo.transportation}.`;
    prompt += ` Accommodation: ${travelInfo.accommodation === 'flexible' ? 'flexible options' : t(`accommodations.${travelInfo.accommodation}`)}.`;
    prompt += ` Time to visit: ${travelInfo.timeToVisit === 'flexible' ? 'flexible' : t(`timetovisit.${travelInfo.timeToVisit}`)}.`;

    if (specialRequirements) {
      prompt += ` Special Requirements: ${specialRequirements}.`;
    }

    if (isRegeneration) {
      // Add regeneration-specific instructions
      prompt += ` Please provide a ${timeOfDay ? '' : 'full day '}itinerary based on these choices and preferences, ensuring it complements the existing plan without duplicating activities. ${timeOfDay ? `Focus on creating a coherent plan for the ${timeOfDay} of Day ${day}, considering the other activities planned for this day.` : ''} Keep each time period description to about 30-50 words.`;
    } else {
      // Add full plan generation instructions
      prompt += ` Please provide a comprehensive ${numDays}-day travel plan based on these choices and preferences, taking into account the type of travelers. Include an estimated cost range for the trip, with a breakdown for major categories (e.g., accommodation, transportation, food, activities).`;
    }

    prompt += ` When mentioning specific attractions, landmarks, unique experiences, or notable places, enclose the entire relevant phrase in square brackets [like this], not just individual words. For example, use "[Hollywood Classic Restaurant]" instead of just "[Hollywood]". Be as specific and descriptive as possible when marking these entities. Do not mark general activities or common nouns.

Additionally, for each marked attraction, add an attribute to categorize it. Use the following format: [Attraction Name](attribute). The attributes should be one of the following: restaurant, landmark, museum, park, activity, or other. For example: [Hollywood Classic Restaurant](restaurant) or [Griffith Observatory](landmark).

Important: Please focus on recommending well-known attractions, popular restaurants, and established businesses. Avoid suggesting small local stores or lesser-known establishments, as we want to ensure the recommendations are suitable for a wide range of travelers.`;

    if (isRegeneration) {
      prompt += `\n\nFormat the response as a JSON object with the following structure:
{
  ${timeOfDay ? `
  "${timeOfDay}": "Description of ${timeOfDay} activities for Day ${day} with [specific attractions](attribute) marked"
  ` : `
  "morning": "Description of morning activities for Day ${day} with [specific attractions](attribute) marked",
  "afternoon": "Description of afternoon activities for Day ${day} with [specific landmarks](attribute) marked",
  "evening": "Description of evening activities for Day ${day} with [unique experiences](attribute) marked"
  `}
}`;
    } else {
      prompt += `\n\nYour response must be a valid JSON object with the following structure:
{
  "itinerary": [
    {
      "day": 1,
      "morning": "Description of morning activities with [specific attractions](attribute) marked",
      "afternoon": "Description of afternoon activities with [specific landmarks](attribute) marked",
      "evening": "Description of evening activities with [unique experiences](attribute) marked"
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
    }

    return prompt;
  };

  const finalizePlan = async () => {
    logEvent("User Action", "Finalized Plan", `${destination} - ${numDays} days`);
    setIsLoading(true);
    setIsFullPlanGeneration(true);
    const finalPrompt = generatePrompt();

    try {
      const response = await getLLMResponse(finalPrompt);
      logger.debug("Raw LLM response:", response);

      // Update debug info
      setDebugInfo({ currentPrompt: finalPrompt, llmResponse: response });

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
        // Process each day's activities to wrap entities with links and attributes
        for (let day of parsedResponse.itinerary) {
          ['morning', 'afternoon', 'evening'].forEach(timeOfDay => {
            day[timeOfDay] = day[timeOfDay].replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, entity, attribute) => {
              return `<a href="${createGoogleSearchLink(entity)}" target="_blank" rel="noopener noreferrer" data-attr="${attribute}">${entity}</a>`;
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
      // Update debug info with error
      setDebugInfo(prev => ({ ...prev, llmResponse: `Error: ${error.message}` }));
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

    const regeneratePrompt = generatePrompt(true, day, timeOfDay);

    try {
      const response = await getLLMResponse(regeneratePrompt);
      logger.debug("Raw LLM response:", response);

      // Update debug info
      setDebugInfo({ currentPrompt: regeneratePrompt, llmResponse: response });

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

          const processTimeOfDay = (tod) => {
            if (parsedResponse[tod]) {
              newVersion[tod] = parsedResponse[tod].replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, entity, attribute) => {
                return `<a href="${createGoogleSearchLink(entity)}" target="_blank" rel="noopener noreferrer" data-attr="${attribute}">${entity}</a>`;
              });

              // Extract all linked attractions with attributes
              const linkedAttractions = parsedResponse[tod].match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
              const attractions = linkedAttractions.map(item => {
                const [_, text, attribute] = item.match(/\[([^\]]+)\]\(([^)]+)\)/);
                return { text, attribute };
              });

              // Prioritize non-restaurant attractions
              const prioritizedAttractions = attractions.sort((a, b) => {
                if (a.attribute === 'restaurant' && b.attribute !== 'restaurant') return 1;
                if (a.attribute !== 'restaurant' && b.attribute === 'restaurant') return -1;
                return 0;
              });

              // Fetch image for the first prioritized attraction
              if (prioritizedAttractions.length > 0) {
                fetchAttractionImage(prioritizedAttractions[0].text, day, tod);
              }
            }
          };

          if (timeOfDay) {
            processTimeOfDay(timeOfDay);
          } else {
            ['morning', 'afternoon', 'evening'].forEach(processTimeOfDay);
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
      // Update debug info with error
      setDebugInfo(prev => ({ ...prev, llmResponse: `Error: ${error.message}` }));
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

          {showDebug && !isProduction && (
            <DebugSection 
              currentPrompt={debugInfo.currentPrompt} 
              llmResponse={debugInfo.llmResponse}
            />
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