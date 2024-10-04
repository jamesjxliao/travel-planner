import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import OpenAI from 'openai';
import { Button, TextField, Card, CardContent, CardActions, Typography, Grid, FormControl, InputLabel, Select, MenuItem, Chip, Box, Switch, FormControlLabel, Paper, useMediaQuery, Drawer, IconButton, AppBar, Toolbar } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { keyframes } from '@mui/system';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import BugReportIcon from '@mui/icons-material/BugReport';
import ReactMarkdown from 'react-markdown';
import PersonIcon from '@mui/icons-material/Person'; // Add this import

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
    travelersInformation: "Traveler's Information",
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
    "attractions.shopping": "Shopping"
  },
  zh: {
    title: "AI旅行规划器",
    destination: "目的地",
    startPlanning: "开始规划",
    travelersInformation: "旅行者信息",
    whosTraveling: "谁在旅行",
    solo: "单人",
    couple: "情侣",
    family: "家庭",
    group: "团体",
    groupSize: "团体人数",
    homeLocation: "出发地",
    numberOfDays: "旅行天数",
    aspectsToConsider: "考虑的方面：",
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
    enterYourHomeCity: "输入您出发城市/国家",
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
    "food.streetfood": "街头小吃",
    "food.vegetarian": "素食",
    "food.familyfriendly": "适合家庭",
    "attractions.museums": "博物馆",
    "attractions.nature": "自然景观",
    "attractions.historicalsites": "历史遗迹",
    "attractions.themeparks": "主题公园",
    "attractions.shopping": "购物"
  }
};

// Create a LanguageProvider component
const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('zh');  // Changed from 'en' to 'zh'
  const value = { language, setLanguage, t: (key) => translations[language][key] };
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

const TravelPlannerApp = () => {
  const [destination, setDestination] = useState('Los Angeles');
  const [currentAspect, setCurrentAspect] = useState('');
  const [options, setOptions] = useState({});
  const [selectedOptions, setSelectedOptions] = useState({});
  const [conversationHistory, setConversationHistory] = useState([]);
  const [finalPlan, setFinalPlan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [homeLocation, setHomeLocation] = useState('San Carlos');
  const [selectedAspects, setSelectedAspects] = useState(['Food']);
  const [customAspect, setCustomAspect] = useState('');
  const [aspectPreferences, setAspectPreferences] = useState({});
  const [isGeneratingOptions, setIsGeneratingOptions] = useState({});
  const [showDebug, setShowDebug] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [travelers, setTravelers] = useState('Family');
  const [groupSize, setGroupSize] = useState('3');
  const [numDays, setNumDays] = useState('3');
  const { language, setLanguage, t } = useLanguage();
  const [newOptionIndices, setNewOptionIndices] = useState({});
  const scrollRefs = useRef({});
  const [isRoundTrip, setIsRoundTrip] = useState(true);
  const [budget, setBudget] = useState('Mid-range');  // New state for budget

  // Remove Time to visit from predefinedAspects
  const predefinedAspects = [
    "Food",
    "Attractions"
  ];

  // Add a new state for time to visit
  const [timeToVisit, setTimeToVisit] = useState('flexible');

  // Add a new state for accommodation type
  const [accommodationType, setAccommodationType] = useState('flexible');

  // Add a new state for transportation mode
  const [transportationMode, setTransportationMode] = useState('flexible');

  const [coveredAspects, setCoveredAspects] = useState(new Set());

  // Add this new state variable
  const [regeneratingAspect, setRegeneratingAspect] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Update the commonPreferences object to use translation keys
  const commonPreferences = {
    "Time to visit": ["timetovisit.spring", "timetovisit.summer", "timetovisit.fall", "timetovisit.winter", "timetovisit.holidays"],
    "Accommodations": ["accommodations.hotel", "accommodations.airbnb", "accommodations.resort", "accommodations.hostel", "accommodations.camping"],
    "Food": ["food.localcuisine", "food.finedining", "food.streetfood", "food.vegetarian", "food.familyfriendly"],
    "Attractions": ["attractions.museums", "attractions.nature", "attractions.historicalsites", "attractions.themeparks", "attractions.shopping"]
  };

  // Update this function to use translated preferences
  const handleCommonPreferenceClick = (aspect, preferenceKey) => {
    const translatedPreference = t(preferenceKey);
    setAspectPreferences(prev => {
      const currentPreferences = prev[aspect] ? prev[aspect].split(', ') : [];
      let updatedPreferences;
      
      if (currentPreferences.includes(translatedPreference)) {
        updatedPreferences = currentPreferences.filter(pref => pref !== translatedPreference);
      } else {
        updatedPreferences = [...currentPreferences, translatedPreference];
      }
      
      return {
        ...prev,
        [aspect]: updatedPreferences.join(', ')
      };
    });
  };

  const getLLMResponse = async (prompt) => {
    setCurrentPrompt(prompt);  // Set the current prompt for debugging
    const updatedHistory = [...conversationHistory, { role: "user", content: prompt }];
    setConversationHistory(updatedHistory);

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: updatedHistory
    });

    const llmResponse = response.choices[0].message.content;
    setConversationHistory([...updatedHistory, { role: "assistant", content: llmResponse }]);
    return llmResponse;
  };

  const generateOptions = async (aspect) => {
    setIsGeneratingOptions(prev => ({ ...prev, [aspect]: true }));
    const aspectPreference = aspectPreferences[aspect] || '';
    let travelersInfo = `Who's traveling: ${travelers}`;
    if (travelers === 'Family' || travelers === 'Group') {
      travelersInfo += `. Group size: ${groupSize}`;
    }
    const prompt = `For a ${numDays}-day trip to ${destination} from ${homeLocation}, provide 4 distinct options for ${aspect}. ${travelersInfo}. User's preference: "${aspectPreference}". Each option should be a brief markdown bullet point (no more than 30 words) and represent a different approach or choice, considering the type of travelers and trip duration. 

When mentioning specific attractions, landmarks, unique experiences, or notable places, enclose the entire relevant phrase in square brackets [like this], not just individual words. For example, use "[好莱坞附近的热门汉堡餐厅]" instead of just "[好莱坞]". Be as specific and descriptive as possible when marking these entities.

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

  const handleBudgetChange = (event) => {
    setBudget(event.target.value);
    if (isMobile) handleDrawerClose();
  };

  const finalizePlan = async () => {
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

    let finalPrompt = `Please respond in ${language === 'zh' ? 'Chinese' : 'English'}. `;
    finalPrompt += `Plan a ${travelInfo.type} from ${travelInfo.from} to ${travelInfo.to} for ${travelInfo.travelers}`;
    if (travelInfo.groupSize) finalPrompt += ` (group of ${travelInfo.groupSize})`;
    finalPrompt += `. Budget: ${travelInfo.budget}.`;
    finalPrompt += ` Transportation: ${travelInfo.transportation === 'flexible' ? 'flexible options' : travelInfo.transportation}.`;
    finalPrompt += ` Accommodation: ${travelInfo.accommodation === 'flexible' ? 'flexible options' : t(`accommodations.${travelInfo.accommodation}`)}.`;
    finalPrompt += ` Time to visit: ${travelInfo.timeToVisit === 'flexible' ? 'flexible' : t(`timetovisit.${travelInfo.timeToVisit}`)}.`;

    const preferences = Object.entries(selectedOptions).map(([aspect, choices]) => {
      const preference = aspectPreferences[aspect] || '';
      if (choices.length > 0) {
        return `${aspect} (preference: "${preference}"): ${choices.join(', ')}`;
      } else if (preference) {
        return `${aspect}: "${preference}"`;
      }
      return null;
    }).filter(Boolean);

    if (preferences.length > 0) {
      finalPrompt += ` Preferences: ${preferences.join('. ')}.`;
    }

    finalPrompt += ` Please provide a comprehensive ${numDays}-day travel plan based on these choices and preferences, taking into account the type of travelers. Include an estimated cost range for the trip, with a breakdown for major categories (e.g., accommodation, transportation, food, activities). 

When mentioning specific attractions, landmarks, unique experiences, or notable places, enclose the entire relevant phrase in square brackets [like this], not just individual words. For example, use "[好莱坞附近的热门汉堡餐厅]" instead of just "[好莱坞]". Be as specific and descriptive as possible when marking these entities. Do not mark general activities or common nouns.

Format the response as a JSON object with the following structure:
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
    }`;

    try {
      const response = await getLLMResponse(finalPrompt);
      console.log("Raw LLM response:", response);

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(response);
      } catch (parseError) {
        console.error("Failed to parse LLM response:", parseError);
        console.log("Attempting to extract JSON from response...");
        
        // Attempt to extract JSON from the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsedResponse = JSON.parse(jsonMatch[0]);
          } catch (extractError) {
            console.error("Failed to extract and parse JSON:", extractError);
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

        console.log("Parsed response:", parsedResponse);
        setFinalPlan(parsedResponse);
      } else {
        console.error("Invalid response structure:", parsedResponse);
        setFinalPlan({ error: "Failed to generate a valid itinerary. Please try again." });
      }
    } catch (error) {
      console.error("Error in finalizePlan:", error);
      setFinalPlan({ error: "An error occurred while generating the travel plan. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleOptionChoice = async (choice) => {
    if (choice === 'none') {
      setOptions([]);
      return;
    }

    const selectedOption = options[parseInt(choice) - 1].split('. ')[1];
    const response = await getLLMResponse(`The user chose '${selectedOption}' for ${currentAspect}. Identify any other aspects from ${selectedAspects.join(', ')} that this choice might have covered.`);
    
    const newCoveredAspects = new Set(coveredAspects);
    newCoveredAspects.add(currentAspect);
    response.toLowerCase().split(' ').forEach(word => {
      if (selectedAspects.includes(word.trim())) {
        newCoveredAspects.add(word.trim());
      }
    });
    setCoveredAspects(newCoveredAspects);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  const handleAspectToggle = (aspect) => {
    setSelectedAspects(prevAspects =>
      prevAspects.includes(aspect)
        ? prevAspects.filter(a => a !== aspect)
        : [...prevAspects, aspect]
    );
    if (isMobile) handleDrawerClose();
  };

  const handleAddCustomAspect = (e) => {
    e.preventDefault();
    if (customAspect && !selectedAspects.includes(customAspect)) {
      setSelectedAspects(prevAspects => [...prevAspects, customAspect]);
      setCustomAspect('');
    }
    if (isMobile) handleDrawerClose();
  };

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
    if (isMobile) handleDrawerClose();
  };

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const renderItinerary = () => {
    if (!finalPlan || !finalPlan.itinerary) return null;

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h5" gutterBottom>{t('yourTravelPlan')}</Typography>
        <Grid container spacing={2}>
          {finalPlan.itinerary.map((day, index) => (
            <Grid item xs={12} key={index}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {language === 'zh' 
                      ? t('day').replace('天', `${day.day}天`) 
                      : `${t('day')} ${day.day}`}
                  </Typography>
                  <Grid container spacing={2}>
                    {['morning', 'afternoon', 'evening'].map((timeOfDay) => (
                      <Grid item xs={12} sm={4} key={timeOfDay}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                              {t(timeOfDay)}
                            </Typography>
                            <StyledContent>
                              <Typography 
                                variant="body2" 
                                component="div"
                                dangerouslySetInnerHTML={{ __html: day[timeOfDay] }}
                              />
                            </StyledContent>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Typography variant="h6" sx={{ mt: 2 }}>{t('estimatedCostBreakdown')}</Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {Object.entries(finalPlan.estimatedCost.breakdown).map(([category, cost]) => (
            <Grid item xs={12} sm={6} md={4} key={category}>
              <Paper elevation={2} sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {t(category)}
                </Typography>
                <Typography variant="body1">{cost}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
        <Typography variant="h6" sx={{ mt: 2 }}>{t('totalEstimatedCost')}: {finalPlan.estimatedCost.total}</Typography>
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

  const sidebarContent = (
    <Box sx={{ width: isMobile ? '100vw' : 250, p: 2 }}>
      {isMobile && (
        <IconButton
          onClick={handleDrawerClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      )}
      <Paper elevation={3} sx={{ p: 2, mb: 3, backgroundColor: '#f0f8ff' }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
          {t('travelersInformation')}
        </Typography>
        
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

        {(travelers === 'Family' || travelers === 'Group') && (
          <TextField
            fullWidth
            margin="normal"
            label={t('groupSize')}
            value={groupSize}
            onChange={(e) => setGroupSize(e.target.value)}
            placeholder={t('enterNumberOfTravelers')}
            type="number"
            InputProps={{ inputProps: { min: travelers === 'Family' ? 3 : 5 } }}
          />
        )}

        <TextField
          fullWidth
          margin="normal"
          label={t('homeLocation')}
          value={homeLocation}
          onChange={(e) => setHomeLocation(e.target.value)}
          placeholder={t('enterYourHomeCity')}
        />

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
      </Paper>

      <Paper elevation={3} sx={{ p: 2, mt: 3, backgroundColor: '#f0f8ff' }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
          {t('aspectsToConsider')}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {[...predefinedAspects, ...selectedAspects.filter(aspect => !predefinedAspects.includes(aspect))].map((aspect) => (
            <Chip
              key={aspect}
              label={predefinedAspects.includes(aspect) ? t(aspect.toLowerCase().replace(/\s+/g, '')) : aspect}
              onClick={() => handleAspectToggle(aspect)}
              color={selectedAspects.includes(aspect) ? "primary" : "default"}
              sx={{ '&:hover': { backgroundColor: 'primary.light', cursor: 'pointer' } }}
            />
          ))}
        </Box>
        <form onSubmit={handleAddCustomAspect}>
          <TextField
            fullWidth
            margin="normal"
            label={t('addCustomAspect')}
            value={customAspect}
            onChange={(e) => setCustomAspect(e.target.value)}
            placeholder={t('enterCustomAspect')}
          />
          <Button type="submit" variant="contained" size="small" sx={{ mt: 1 }}>
            {t('addCustomAspect')}
          </Button>
        </form>
      </Paper>

      {/* Removed the debugging toggle from here */}
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="fixed">
        <Toolbar>
          {isMobile && (
            <Button
              color="inherit"
              startIcon={<PersonIcon />}
              onClick={toggleDrawer(true)}
              sx={{ mr: 2 }}
            >
              {t('travelersInformation')}
            </Button>
          )}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {t('title')}
          </Typography>
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
          <FormControl sx={{ minWidth: 120 }} size="small">
            <Select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              displayEmpty
              inputProps={{ 'aria-label': 'Without label' }}
              sx={{ color: 'white', '& .MuiSvgIcon-root': { color: 'white' } }}
            >
              <MenuItem value="zh">中文</MenuItem>
              <MenuItem value="en">English</MenuItem>
            </Select>
          </FormControl>
        </Toolbar>
      </AppBar>
      <Toolbar /> {/* This empty Toolbar acts as a spacer */}
      <Grid container spacing={2} sx={{ p: 2, mt: 2 }}>
        {!isMobile && (
          <Grid item xs={12} sm={3}>
            {sidebarContent}
          </Grid>
        )}
        <Grid item xs={12} sm={isMobile ? 12 : 9}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
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
            <Grid item xs={6} sm={3} md={2}>
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
            <Grid item xs={6} sm={3} md={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isRoundTrip}
                    onChange={(e) => setIsRoundTrip(e.target.checked)}
                    disabled={isLoading}
                  />
                }
                label={t('roundTrip')}
                sx={{ mt: 2 }}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
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
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
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
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
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
          </Grid>

          {selectedAspects.map((aspect) => (
            <Card key={aspect} sx={{ mt: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="h6" sx={{ mr: 2 }}>
                      {predefinedAspects.includes(aspect) ? t(aspect.toLowerCase().replace(/\s+/g, '')) : aspect}
                    </Typography>
                    {commonPreferences[aspect] && commonPreferences[aspect].map((prefKey, index) => (
                      <Chip
                        key={index}
                        label={t(prefKey)}
                        size="small"
                        onClick={() => handleCommonPreferenceClick(aspect, prefKey)}
                        color={aspectPreferences[aspect]?.includes(t(prefKey)) ? "primary" : "default"}
                        sx={{ '&:hover': { backgroundColor: 'primary.light', cursor: 'pointer' } }}
                      />
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', gap: 2 }}>
                    <TextField
                      label={`${t('preferencesFor')} ${predefinedAspects.includes(aspect) ? t(aspect.toLowerCase().replace(/\s+/g, '')) : aspect}`}
                      value={aspectPreferences[aspect] || ''}
                      onChange={(e) => handlePreferenceChange(aspect, e.target.value)}
                      onKeyPress={(e) => handleKeyPress(aspect, e)}
                      fullWidth
                      margin="normal"
                      disabled={isLoading}
                      variant="outlined"
                    />
                    <Button 
                      variant="outlined" 
                      onClick={() => generateOptions(aspect)}
                      disabled={isGeneratingOptions[aspect]}
                      sx={{ height: '56px', whiteSpace: 'nowrap', width: isMobile ? '100%' : 'auto' }}
                    >
                      {isGeneratingOptions[aspect] ? t('generatingOptions') : t('generateOptions')}
                    </Button>
                  </Box>
                </Box>
                {options[aspect] && options[aspect].length > 0 && (
                  <ScrollableBox ref={el => scrollRefs.current[aspect] = el}>
                    <Grid container spacing={2}>
                      {options[aspect].map((option, index) => (
                        <Grid item xs={12} sm={6} key={index}>
                          <HighlightCard isNew={newOptionIndices[aspect]?.[index]}>
                            <CardContent sx={{ flexGrow: 1, overflow: 'auto' }}>
                              <StyledContent>
                                {renderMarkdownWithLinks(option)}
                              </StyledContent>
                            </CardContent>
                            <CardActions>
                              <Button 
                                size="small" 
                                onClick={() => handleOptionToggle(aspect, option)}
                                variant={selectedOptions[aspect]?.includes(option) ? "contained" : "outlined"}
                                fullWidth
                              >
                                {selectedOptions[aspect]?.includes(option) ? t('selected') : t('select')}
                              </Button>
                            </CardActions>
                          </HighlightCard>
                        </Grid>
                      ))}
                    </Grid>
                  </ScrollableBox>
                )}
              </CardContent>
            </Card>
          ))}

          <Button 
            variant="contained" 
            onClick={finalizePlan}
            sx={{ mt: 2, width: '100%' }}
          >
            {t('finalizePlan')}
          </Button>

          {showDebug && currentPrompt && (
            <Card sx={{ mt: 2, backgroundColor: '#f0f0f0' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>{t('currentLLMPrompt')}</Typography>
                <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {currentPrompt}
                </Typography>
              </CardContent>
            </Card>
          )}

          {isLoading && <Typography sx={{ mt: 2 }}>{t('generatingTravelPlan')}</Typography>}

          {finalPlan && renderItinerary()}
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
          {sidebarContent}
        </Drawer>
      )}
    </Box>
  );
};

// Wrap the exported component with the LanguageProvider
export default () => (
  <LanguageProvider>
    <TravelPlannerApp />
  </LanguageProvider>
);