import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import OpenAI from 'openai';
import { Button, TextField, Card, CardContent, CardActions, Typography, Grid, FormControl, InputLabel, Select, MenuItem, Chip, Box, Switch, FormControlLabel, Paper, useMediaQuery, Drawer, IconButton, AppBar, Toolbar } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { keyframes } from '@mui/system';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import BugReportIcon from '@mui/icons-material/BugReport';

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
    numberOfDays: "Number of Days",
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
    enterYourHomeCity: "输入您的出发城市/国家",
    enterNumberOfDays: "输入旅行天数",
    enterCustomAspect: "输入自定义方面",
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
  const [homeLocation, setHomeLocation] = useState('San Francisco');
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

  const predefinedAspects = [
    "Time to visit",
    "Transportation",
    "Accommodations",
    "Food",
    "Attractions",
    "Activities",
    "Budget"
  ];

  const [coveredAspects, setCoveredAspects] = useState(new Set());

  // Add this new state variable
  const [regeneratingAspect, setRegeneratingAspect] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const getLLMResponse = async (prompt) => {
    setCurrentPrompt(prompt);  // Set the current prompt for debugging
    const languageInstruction = language === 'zh' ? "Please respond in Chinese. " : "";
    const updatedPrompt = languageInstruction + prompt;
    const updatedHistory = [...conversationHistory, { role: "user", content: updatedPrompt }];
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
    const prompt = `For a ${numDays}-day trip to ${destination} from ${homeLocation}, provide 4 distinct options for ${aspect}. ${travelersInfo}. User's preference: "${aspectPreference}". Each option should be a brief markdown bullet point (no more than 30 words) and represent a different approach or choice, considering the type of travelers and trip duration.`;
    const optionsResponse = await getLLMResponse(prompt);
    
    // Filter and validate the options
    const validOptions = optionsResponse.split('\n')
      .map(option => option.trim())
      .filter(option => option && option.startsWith('- ') && option.length > 5);

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
    setIsLoading(true);
    let travelersInfo = `Who's traveling: ${travelers}`;
    if (travelers === 'Family' || travelers === 'Group') {
      travelersInfo += `. Group size: ${groupSize}`;
    }
    let finalPrompt = `I'm planning a ${numDays}-day ${isRoundTrip ? 'round trip' : 'one-way trip'} from ${homeLocation} to ${destination}. ${travelersInfo}.`;
    
    Object.entries(selectedOptions).forEach(([aspect, choices]) => {
      const preference = aspectPreferences[aspect] || '';
      if (choices.length > 0) {
        finalPrompt += ` For ${aspect} (preference: "${preference}"), I've chosen: ${choices.join(', ')}.`;
      } else if (preference) {
        finalPrompt += ` For ${aspect}, my preference is: "${preference}".`;
      }
    });

    finalPrompt += ` Please provide a comprehensive ${numDays}-day travel plan based on these choices and preferences, taking into account the type of travelers. Include an estimated cost range for the trip, with a breakdown for major categories (e.g., accommodation, transportation, food, activities). For each activity or attraction mentioned, please enclose it in square brackets [like this] to mark it as an important entity. Format the response as a JSON object with the following structure:
    {
      "itinerary": [
        {
          "day": 1,
          "morning": "Description of morning activities with [important entities] marked",
          "afternoon": "Description of afternoon activities with [important entities] marked",
          "evening": "Description of evening activities with [important entities] marked"
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
      </Paper>

      <Paper elevation={3} sx={{ p: 2, mt: 3, backgroundColor: '#f0f8ff' }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
          {t('aspectsToConsider')}
        </Typography>
        <Typography variant="body2" gutterBottom>
          {t('selectAtLeastOneAspect')}
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

      <FormControlLabel
        control={<Switch checked={showDebug} onChange={(e) => setShowDebug(e.target.checked)} />}
        label={t('showDebugInfo')}
      />
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          {isMobile && (
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
              onClick={toggleDrawer(true)}
            >
              <MenuIcon />
            </IconButton>
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
      <Grid container spacing={2} sx={{ p: 2 }}>
        {!isMobile && (
          <Grid item xs={12} sm={3}>
            {sidebarContent}
          </Grid>
        )}
        <Grid item xs={12} sm={isMobile ? 12 : 9}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
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
            <Grid item xs={12} sm={3}>
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
            <Grid item xs={12} sm={3}>
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

          {selectedAspects.map((aspect) => (
            <Card key={aspect} sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {predefinedAspects.includes(aspect) ? t(aspect.toLowerCase().replace(/\s+/g, '')) : aspect}
                </Typography>
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
                {options[aspect] && options[aspect].length > 0 && (
                  <ScrollableBox ref={el => scrollRefs.current[aspect] = el}>
                    <Grid container spacing={2}>
                      {options[aspect].map((option, index) => (
                        <Grid item xs={12} sm={6} key={index}>
                          <HighlightCard isNew={newOptionIndices[aspect]?.[index]}>
                            <CardContent sx={{ flexGrow: 1, overflow: 'auto' }}>
                              <Typography variant="body2">{option}</Typography>
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