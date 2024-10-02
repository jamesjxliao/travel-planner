import React, { useState, useEffect, createContext, useContext } from 'react';
import OpenAI from 'openai';
import ReactMarkdown from 'react-markdown';
import { Button, TextField, Card, CardContent, CardActions, Typography, Grid, FormControl, InputLabel, Select, MenuItem, Chip, Box, Switch, FormControlLabel } from '@mui/material';

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
    preferences: "Preferences",
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
  },
  zh: {
    title: "AI旅行规划器",
    destination: "目的地",
    startPlanning: "开始规划",
    preferences: "偏好设置",
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
    timetovisit: "最佳访问时间",
    transportation: "交通",
    accommodations: "住宿",
    food: "美食",
    attractions: "景点",
    activities: "活动",
    budget: "预算",
  }
};

// Create a LanguageProvider component
const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const value = { language, setLanguage, t: (key) => translations[language][key] };
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

const client = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // This is not recommended for production use
});

const TravelPlannerApp = () => {
  const [destination, setDestination] = useState('Bora Bora');
  const [isPlanningStarted, setIsPlanningStarted] = useState(false);
  const [currentAspect, setCurrentAspect] = useState('');
  const [options, setOptions] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [conversationHistory, setConversationHistory] = useState([]);
  const [finalPlan, setFinalPlan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [homeLocation, setHomeLocation] = useState('San Francisco');
  const [selectedAspects, setSelectedAspects] = useState(['Food']);
  const [customAspect, setCustomAspect] = useState('');
  const [aspectPreferences, setAspectPreferences] = useState({});
  const [isGeneratingOptions, setIsGeneratingOptions] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [travelers, setTravelers] = useState('Couple');
  const [groupSize, setGroupSize] = useState('2');
  const [numDays, setNumDays] = useState('5');
  const { language, setLanguage, t } = useLanguage();

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

  const handleDestinationSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!destination.trim() || selectedAspects.length === 0 || !numDays) return;
    
    setIsPlanningStarted(true);
    setCurrentAspect(selectedAspects[0]);
  };

  const generateOptions = async () => {
    setIsGeneratingOptions(true);
    const aspectPreference = aspectPreferences[currentAspect] || '';
    let travelersInfo = `Who's traveling: ${travelers}`;
    if (travelers === 'Family' || travelers === 'Group') {
      travelersInfo += `. Group size: ${groupSize}`;
    }
    const prompt = `For a ${numDays}-day trip to ${destination} from ${homeLocation}, provide 5 distinct options for ${currentAspect}. ${travelersInfo}. User's preference: "${aspectPreference}". Each option should be a brief markdown bullet point (no more than 30 words) and represent a different approach or choice, considering the type of travelers and trip duration.`;
    const optionsResponse = await getLLMResponse(prompt);
    
    // Filter and validate the options
    const validOptions = optionsResponse.split('\n')
      .map(option => option.trim())
      .filter(option => option && option.startsWith('- ') && option.length > 5);

    // If we don't have enough valid options, regenerate
    if (validOptions.length < 3) {
      setIsGeneratingOptions(false);
      generateOptions(); // Recursively call to try again
      return;
    }

    setOptions(validOptions);
    setIsGeneratingOptions(false);
  };

  const handleOptionToggle = (option) => {
    setSelectedOptions(prev => {
      const current = prev[currentAspect] || [];
      return {
        ...prev,
        [currentAspect]: current.includes(option)
          ? current.filter(item => item !== option)
          : [...current, option]
      };
    });
  };

  const moveToNextAspect = () => {
    const currentIndex = selectedAspects.indexOf(currentAspect);
    if (currentIndex < selectedAspects.length - 1) {
      setCurrentAspect(selectedAspects[currentIndex + 1]);
      setOptions([]);
    } else {
      finalizePlan();
    }
  };

  const finalizePlan = async () => {
    setIsLoading(true);
    let travelersInfo = `Who's traveling: ${travelers}`;
    if (travelers === 'Family' || travelers === 'Group') {
      travelersInfo += `. Group size: ${groupSize}`;
    }
    let finalPrompt = `I'm planning a ${numDays}-day trip from ${homeLocation} to ${destination}. ${travelersInfo}.`;
    
    Object.entries(selectedOptions).forEach(([aspect, choices]) => {
      const preference = aspectPreferences[aspect] || '';
      if (choices.length > 0) {
        finalPrompt += ` For ${aspect} (preference: "${preference}"), I've chosen: ${choices.join(', ')}.`;
      } else if (preference) {
        finalPrompt += ` For ${aspect}, my preference is: "${preference}".`;
      }
    });

    finalPrompt += ` Please provide a comprehensive ${numDays}-day travel plan based on these choices and preferences, taking into account the type of travelers. Include an estimated cost range for the trip.`;

    const response = await getLLMResponse(finalPrompt);
    setFinalPlan(response);
    setIsLoading(false);
  };

  const handlePreferenceChange = (aspect, value) => {
    setAspectPreferences(prev => ({ ...prev, [aspect]: value }));
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

  const handleAspectToggle = (aspect) => {
    setSelectedAspects(prevAspects =>
      prevAspects.includes(aspect)
        ? prevAspects.filter(a => a !== aspect)
        : [...prevAspects, aspect]
    );
  };

  const handleAddCustomAspect = (e) => {
    e.preventDefault();
    if (customAspect && !selectedAspects.includes(customAspect)) {
      setSelectedAspects(prevAspects => [...prevAspects, customAspect]);
      setCustomAspect('');
    }
  };

  const handleTravelersChange = (event) => {
    const value = event.target.value;
    setTravelers(value);
    if (value === 'Solo') {
      setGroupSize('1');
    } else if (value === 'Couple') {
      setGroupSize('2');
    }
  };

  useEffect(() => {
    if (currentAspect && options.length === 0) {
      generateOptions();
    }
  }, [currentAspect]);

  return (
    <Grid container spacing={2} className="p-4 max-w-6xl mx-auto">
      <Grid item xs={3}>
        <Typography variant="h6" gutterBottom>{t('preferences')}</Typography>
        
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
            InputProps={{ inputProps: { min: 3 } }}
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
        
        <TextField
          fullWidth
          margin="normal"
          label={t('numberOfDays')}
          value={numDays}
          onChange={(e) => setNumDays(e.target.value)}
          placeholder={t('enterNumberOfDays')}
          type="number"
          InputProps={{ inputProps: { min: 1 } }}
        />
        
        <Typography variant="subtitle1" gutterBottom>{t('aspectsToConsider')}</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {[...predefinedAspects, ...selectedAspects.filter(aspect => !predefinedAspects.includes(aspect))].map((aspect) => (
            <Chip
              key={aspect}
              label={t(aspect.toLowerCase().replace(/\s+/g, ''))}
              onClick={() => handleAspectToggle(aspect)}
              color={selectedAspects.includes(aspect) ? "primary" : "default"}
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
          <Button type="submit" variant="outlined" size="small">
            {t('addCustomAspect')}
          </Button>
        </form>
        <FormControlLabel
          control={<Switch checked={showDebug} onChange={(e) => setShowDebug(e.target.checked)} />}
          label={t('showDebugInfo')}
        />
        <FormControl fullWidth margin="normal">
          <InputLabel id="language-label">{t('language')}</InputLabel>
          <Select
            labelId="language-label"
            value={language}
            label={t('language')}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="zh">中文</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={9}>
        <Typography variant="h4" gutterBottom>{t('title')}</Typography>
        
        {!isPlanningStarted ? (
          <form onSubmit={handleDestinationSubmit}>
            <TextField
              label={t('destination')}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              fullWidth
              margin="normal"
              disabled={isLoading}
              variant="outlined"
            />
            {selectedAspects.map((aspect) => (
              <TextField
                key={aspect}
                label={`${t('preferencesFor')} ${t(aspect.toLowerCase().replace(/\s+/g, ''))}`}
                value={aspectPreferences[aspect] || ''}
                onChange={(e) => handlePreferenceChange(aspect, e.target.value)}
                fullWidth
                margin="normal"
                disabled={isLoading}
                variant="outlined"
              />
            ))}
            <Button 
              type="submit" 
              variant="contained" 
              disabled={!destination || !homeLocation || selectedAspects.length === 0 || !numDays}
            >
              {t('startPlanning')}
            </Button>
            {selectedAspects.length === 0 && (
              <Typography color="error" style={{ marginTop: '10px' }}>
                {t('selectAtLeastOneAspect')}
              </Typography>
            )}
          </form>
        ) : (
          <>
            <Typography variant="h6" gutterBottom>
              {t('choosingOptionsFor')} {currentAspect}
            </Typography>
            {isGeneratingOptions ? (
              <Typography>{t('generatingOptions')}</Typography>
            ) : (
              <>
                <Grid container spacing={2}>
                  {options.map((option, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card>
                        <CardContent>
                          <ReactMarkdown>{option}</ReactMarkdown>
                        </CardContent>
                        <CardActions>
                          <Button 
                            size="small" 
                            onClick={() => handleOptionToggle(option)}
                            variant={selectedOptions[currentAspect]?.includes(option) ? "contained" : "outlined"}
                          >
                            {selectedOptions[currentAspect]?.includes(option) ? t('selected') : t('select')}
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                <Button 
                  variant="contained" 
                  onClick={moveToNextAspect}
                  style={{ marginTop: '20px' }}
                >
                  {currentAspect === selectedAspects[selectedAspects.length - 1] ? t('finalizePlan') : t('nextAspect')}
                </Button>
              </>
            )}
          </>
        )}

        {showDebug && currentPrompt && (
          <Card style={{ marginTop: '20px', backgroundColor: '#f0f0f0' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>{t('currentLLMPrompt')}</Typography>
              <Typography variant="body2" component="pre" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {currentPrompt}
              </Typography>
            </CardContent>
          </Card>
        )}

        {isLoading && <Typography>{t('generatingTravelPlan')}</Typography>}

        {finalPlan && (
          <Card style={{ marginTop: '20px' }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>{t('yourTravelPlan')}</Typography>
              <ReactMarkdown>{finalPlan}</ReactMarkdown>
            </CardContent>
          </Card>
        )}
      </Grid>
    </Grid>
  );
};

// Wrap the exported component with the LanguageProvider
export default () => (
  <LanguageProvider>
    <TravelPlannerApp />
  </LanguageProvider>
);