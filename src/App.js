import React, { useState, useEffect, createContext, useContext, useRef, useCallback } from 'react';
import OpenAI from 'openai';
import ReactGA from "react-ga4";
import { Button, TextField, Card, CardContent, CardActions, Typography, Grid, FormControl, InputLabel, Select, MenuItem, Chip, Box, Switch, FormControlLabel, Paper, useMediaQuery, Drawer, IconButton, AppBar, Toolbar } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { keyframes } from '@mui/system';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import BugReportIcon from '@mui/icons-material/BugReport';
import ReactMarkdown from 'react-markdown';
import PersonIcon from '@mui/icons-material/Person'; // Add this import
import Tooltip from '@mui/material/Tooltip'; // Add this import
import RefreshIcon from '@mui/icons-material/Refresh'; // Replace DeleteIcon with RefreshIcon
import CircularProgress from '@mui/material/CircularProgress';
import Backdrop from '@mui/material/Backdrop';
import InputAdornment from '@mui/material/InputAdornment';
import Pagination from '@mui/material/Pagination'; // Add this import
import GoogleAnalytics from './components/GoogleAnalytics';
import { createLogger } from './utils/logger'; // We'll create this utility
import CardMedia from '@mui/material/CardMedia';
import Skeleton from '@mui/material/Skeleton'; // Add this import

// Create a language context
const LanguageContext = createContext();

// Create a custom hook to use the language context
const useLanguage = () => useContext(LanguageContext);

// Add translations
const translations = {
  en: {
    title: "AI Travel Planner",
    destination: "Destination",
    startPlanning: "Start Planning",
    travelersInformation: "Traveler",
    whosTraveling: "Who's Traveling",
    solo: "Solo",
    couple: "Couple",
    family: "Family",
    group: "Group",
    groupSize: "Group Size",
    homeLocation: "Home Location",
    numberOfDays: "Days",
    aspectsToConsider: "Aspects to Consider:",
    addCustomAspect: "Add Custom Aspect",
    showDebugInfo: "Show Debug Info",
    language: "Language",
    choosingOptionsFor: "Choosing options for:",
    generatingOptions: "Generating options...",
    selected: "Selected",
    select: "Select",
    nextAspect: "Next Aspect",
    finalizePlan: "Finalize Plan",
    currentLLMPrompt: "Current LLM Prompt:",
    generatingTravelPlan: "Generating your travel plan...",
    yourTravelPlan: "Your Travel Plan",
    enterNumberOfTravelers: "Enter number of travelers",
    enterYourHomeCity: "Enter your home city/country",
    enterNumberOfDays: "Enter number of days",
    enterCustomAspect: "Enter custom aspect",
    selectAtLeastOneAspect: "Please select at least one aspect to consider for your trip.",
    preferencesFor: "Preferences for",
    timetovisit: "Time to visit",
    transportation: "Transportation",
    accommodations: "Accommodations",
    food: "Food",
    attractions: "Attractions",
    activities: "Activities",
    budget: "Budget",
    generateOptions: "Generate Options",
    roundTrip: "Round Trip",
    estimatedCostBreakdown: "Estimated Cost Breakdown",
    totalEstimatedCost: "Total Estimated Cost",
    accommodation: "Accommodation",
    transportation: "Transportation",
    food: "Food",
    activities: "Activities",
    other: "Other Expenses",
    morning: "Morning",
    afternoon: "Afternoon",
    evening: "Evening",
    day: "Day",
    midRange: "Mid-range",
    luxury: "Luxury",
    "timetovisit.spring": "Spring",
    "timetovisit.summer": "Summer",
    "timetovisit.fall": "Fall",
    "timetovisit.winter": "Winter",
    "timetovisit.holidays": "Holidays",
    "transportation.flight": "Flight",
    "transportation.driving": "Driving",
    "transportation.flexible": "Flexible",
    "accommodations.hotel": "Hotel",
    "accommodations.airbnb": "Airbnb",
    "accommodations.resort": "Resort",
    "accommodations.hostel": "Hostel",
    "accommodations.camping": "Camping",
    "accommodations.flexible": "Flexible",
    "food.localcuisine": "Local cuisine",
    "food.finedining": "Fine dining",
    "food.streetfood": "Street food",
    "food.vegetarian": "Vegetarian",
    "food.familyfriendly": "Family-friendly",
    "attractions.museums": "Museums",
    "attractions.nature": "Nature",
    "attractions.historicalsites": "Historical sites",
    "attractions.themeparks": "Theme parks",
    "attractions.shopping": "Shopping",
    specialRequirements: "Select or type in any requirements",
    regenerateDay: "Regenerate this day's itinerary",
    regenerateTimeOfDay: "Regenerate this part of the day",
    resetAllSettings: "Reset All Settings",
    defaultHomeLocation: "San Carlos",
    defaultDestination: "Los Angeles",
    // selectOrTypeRequirements: "Select or type in any requirements",
  },
  zh: {
    title: "AI旅行规划器",
    destination: "目的地",
    startPlanning: "开始规划",
    travelersInformation: "旅行者",
    whosTraveling: "谁在旅行",
    solo: "单人",
    couple: "情侣",
    family: "家庭",
    group: "团体",
    groupSize: "团体人数",
    homeLocation: "出发地",
    numberOfDays: "旅行天数",
    aspectsToConsider: "考虑方面：",
    addCustomAspect: "添加自定义方面",
    showDebugInfo: "显示调试信息",
    language: "语言",
    choosingOptionsFor: "正在为以下方面选择选项：",
    generatingOptions: "正在生成选项...",
    selected: "已选择",
    select: "选择",
    nextAspect: "下一个方面",
    finalizePlan: "完成计划",
    currentLLMPrompt: "当前LLM提示：",
    generatingTravelPlan: "正在生成您的旅行计划...",
    yourTravelPlan: "您的旅行计划",
    enterNumberOfTravelers: "输入旅行者人数",
    enterYourHomeCity: "您出发城市/国家",
    enterNumberOfDays: "输入旅行天数",
    enterCustomAspect: "添加自定义方面",
    selectAtLeastOneAspect: "请至少选择一个考虑的旅行方面。",
    preferencesFor: "对于以下方面的偏好",
    timetovisit: "访问时间",
    transportation: "交通",
    accommodations: "住宿",
    food: "美食",
    attractions: "景点",
    activities: "活动",
    budget: "预算",
    generateOptions: "生成选项",
    roundTrip: "往返",
    estimatedCostBreakdown: "预估费用明细",
    totalEstimatedCost: "总预估费用",
    accommodation: "住宿",
    transportation: "交通",
    food: "餐饮",
    activities: "活动",
    other: "其他开支",
    morning: "上午",
    afternoon: "下午",
    evening: "晚上",
    day: "第天",  // This will be used as a template
    midRange: "中档",
    luxury: "豪华",
    "timetovisit.spring": "春季",
    "timetovisit.summer": "夏季",
    "timetovisit.fall": "秋季",
    "timetovisit.winter": "冬季",
    "timetovisit.holidays": "节假日",
    "transportation.flight": "飞机",
    "transportation.driving": "自驾",
    "transportation.flexible": "任意",
    "accommodations.hotel": "酒店",
    "accommodations.airbnb": "Airbnb",
    "accommodations.resort": "度假村",
    "accommodations.hostel": "青年旅舍",
    "accommodations.camping": "露营",
    "accommodations.flexible": "任意",
    "food.localcuisine": "当地美食",
    "food.finedining": "高档餐厅",
    "food.streetfood": "街头小",
    "food.vegetarian": "素食",
    "food.familyfriendly": "适合家庭",
    "attractions.museums": "博物馆",
    "attractions.nature": "自然景观",
    "attractions.historicalsites": "历史遗迹",
    "attractions.themeparks": "主题公园",
    "attractions.shopping": "购物",
    specialRequirements: "选择或输入任何要求",
    regenerateDay: "重新生成这一天的行程",
    regenerateTimeOfDay: "重新生成这部分的行程",
    resetAllSettings: "重置所有设置",
    defaultHomeLocation: "圣卡洛斯",
    defaultDestination: "洛杉矶",
    // selectOrTypeRequirements: "选择或输入任何要求",
  }
};

// Add this function to determine the initial language
const getInitialLanguage = () => {
  const savedLanguage = localStorage.getItem('language');
  if (savedLanguage) {
    return savedLanguage;
  }
  
  const browserLanguage = navigator.language.split('-')[0];
  return browserLanguage === 'zh' ? 'zh' : 'en';
};

// Update the LanguageProvider component
const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const initialLang = getInitialLanguage();
    localStorage.setItem('language', initialLang);
    return initialLang;
  });

  const value = { 
    language, 
    setLanguage: (lang) => {
      setLanguage(lang);
      localStorage.setItem('language', lang);
    }, 
    t: (key) => translations[language][key] 
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

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

  const renderItinerary = () => {
    console.log('Rendering itinerary. attractionImages:', attractionImages);
    if (!finalPlan || !finalPlan.itinerary) return null;

    return (
      <Box sx={{ mt: 2 }} key={JSON.stringify(finalPlan)}>
        {finalPlan.itinerary.map((originalDay, index) => {
          const day = originalDay.day;
          const versions = dayVersions[day] || [originalDay];
          const currentPage = currentPages[day] || 1;
          const currentVersion = versions[currentPage - 1] || originalDay;

          return (
            <Card key={index} elevation={3} sx={{ mb: 2, overflow: 'hidden' }}>
              <Box sx={{ 
                bgcolor: 'primary.main', 
                color: 'primary.contrastText', 
                py: 1,
                px: 2,
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {language === 'zh' 
                    ? t('day').replace('天', `${day}天`) 
                    : `${t('day')} ${day}`}
                </Typography>
                <Tooltip title={t('regenerateDay')}>
                  <IconButton 
                    size="small"
                    onClick={() => regenerateItinerary(day)}
                    disabled={isLoading || (regeneratingItinerary.day === day && !regeneratingItinerary.timeOfDay)}
                    sx={{ color: 'primary.contrastText' }}
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <CardContent sx={{ pt: 1 }}>
                <Grid container spacing={2}>
                  {['morning', 'afternoon', 'evening'].map((timeOfDay) => {
                    const content = currentVersion[timeOfDay];
                    const firstAttraction = content.match(/\[([^\]]+)\]/)?.[1];
                    const imageUrl = attractionImages[day]?.[timeOfDay];
                    console.log(`Day ${day}, ${timeOfDay}: Image URL - ${imageUrl || 'Not found, loading'}`);

                    return (
                      <Grid item xs={12} sm={4} key={timeOfDay}>
                        <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                          <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
                            {imageUrl ? (
                              <CardMedia
                                component="img"
                                image={imageUrl}
                                alt={firstAttraction || "Attraction"}
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  objectPosition: 'center',
                                }}
                              />
                            ) : (
                              <Skeleton 
                                variant="rectangular" 
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                }}
                              />
                            )}
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: 8,
                                left: 8,
                                bgcolor: 'rgba(0, 0, 0, 0.6)',
                                borderRadius: '16px',
                                padding: '4px 8px',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <Typography variant="body2" color="white" fontWeight="medium">
                                {t(timeOfDay)}
                              </Typography>
                              <Tooltip title={t('regenerateTimeOfDay')}>
                                <IconButton
                                  size="small"
                                  onClick={() => regenerateItinerary(day, timeOfDay)}
                                  disabled={isLoading || (regeneratingItinerary.day === day && regeneratingItinerary.timeOfDay === timeOfDay)}
                                  sx={{ ml: 0.5, p: 0.5, color: 'white' }}
                                >
                                  <RefreshIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                          <CardContent sx={{ flexGrow: 1, p: 1 }}>
                            <Typography 
                              variant="body2" 
                              component="div"
                              dangerouslySetInnerHTML={{ __html: content }}
                              sx={{
                                '& a': {
                                  color: 'primary.main',
                                  textDecoration: 'underline',
                                  fontWeight: 'bold',
                                  '&:hover': {
                                    color: 'primary.dark',
                                  },
                                },
                              }}
                            />
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
                {versions.length > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Pagination 
                      count={versions.length} 
                      page={currentPage} 
                      onChange={(event, page) => handlePageChange(day, page)}
                      color="primary"
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          );
        })}
        <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>{t('estimatedCostBreakdown')}</Typography>
        <Grid container spacing={2}>
          {Object.entries(finalPlan.estimatedCost.breakdown).map(([category, cost]) => (
            <Grid item xs={12} sm={6} md={4} key={category}>
              <Paper elevation={2} sx={{ p: 2, height: '100%', bgcolor: 'background.default' }}>
                <Typography variant="subtitle1" color="primary" gutterBottom>
                  {t(category)}
                </Typography>
                <Typography variant="h6">{cost}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
        <Paper elevation={3} sx={{ mt: 3, p: 2, bgcolor: 'secondary.light' }}>
          <Typography variant="h6" color="secondary.contrastText">
            {t('totalEstimatedCost')}: <strong>{finalPlan.estimatedCost.total}</strong>
          </Typography>
        </Paper>
      </Box>
    );
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

  const TravelerSection = () => (
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
            <TravelerSection />
          </Grid>
        )}
        
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label={t('destination')}
                  value={destination}
                  onChange={handleDestinationChange}
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
                  onChange={handleNumDaysChange}
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
              <Grid item xs={12} sm={6} md={2}>
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
              <Grid item xs={12} sm={6} md={2}>
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
              <Grid item xs={6} sm={3} md={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isRoundTrip}
                      onChange={handleIsRoundTripChange}
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

          {/* Add the Special Requirements section */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {allCommonPreferences.map((prefKey, index) => (
                    <Chip
                      key={index}
                      label={t(prefKey)}
                      size="small"
                      onClick={() => handleCommonPreferenceClick(prefKey)}
                      color={specialRequirements.includes(t(prefKey)) ? "primary" : "default"}
                      sx={{ '&:hover': { backgroundColor: 'primary.light', cursor: 'pointer' } }}
                    />
                  ))}
                </Box>
                <TextField
                  label={t('specialRequirements')}
                  value={specialRequirements}
                  onChange={handleSpecialRequirementsChange}
                  fullWidth
                  margin="normal"
                  disabled={isLoading}
                  variant="outlined"
                  rows={1}
                />
              </Box>
            </CardContent>
          </Card>

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