import React, { useState, useEffect } from 'react';
import OpenAI from 'openai';
import { Button, TextField, Card, CardContent, CardActions, Typography, Grid, FormControl, InputLabel, Select, MenuItem, Chip, Box } from '@mui/material';

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
  const [estimatedCost, setEstimatedCost] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [budget, setBudget] = useState('');
  const [homeLocation, setHomeLocation] = useState('San Francisco');
  const [selectedAspects, setSelectedAspects] = useState(['Food']);
  const [customAspect, setCustomAspect] = useState('');
  const [aspectPreferences, setAspectPreferences] = useState({});
  const [isGeneratingOptions, setIsGeneratingOptions] = useState(false);

  const predefinedAspects = [
    "Time to visit",
    "Who's traveling",
    "Transportation",
    "Accommodations",
    "Food",
    "Attractions",
    "Activities",
    "Budget"
  ];

  const [coveredAspects, setCoveredAspects] = useState(new Set());

  const getLLMResponse = async (prompt) => {
    const updatedHistory = [...conversationHistory, { role: "user", content: prompt }];
    setConversationHistory(updatedHistory);

    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: updatedHistory
    });

    const llmResponse = response.choices[0].message.content;
    setConversationHistory([...updatedHistory, { role: "assistant", content: llmResponse }]);
    return llmResponse;
  };

  const handleDestinationSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!destination.trim() || selectedAspects.length === 0) return;
    
    setIsPlanningStarted(true);
    setCurrentAspect(selectedAspects[0]);
  };

  const generateOptions = async () => {
    setIsGeneratingOptions(true);
    const prompt = `For a trip to ${destination} from ${homeLocation} with a ${budget} budget, provide 5 distinct options for ${currentAspect}. Each option should be succinct (no more than 15 words) and represent a different approach or choice.`;
    const optionsResponse = await getLLMResponse(prompt);
    setOptions(optionsResponse.split('\n').map(option => option.trim()).filter(option => option));
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
    let finalPrompt = `I'm planning a trip from ${homeLocation} to ${destination}. My budget preference is ${budget}.`;
    
    Object.entries(selectedOptions).forEach(([aspect, choices]) => {
      if (choices.length > 0) {
        finalPrompt += ` For ${aspect}, I've chosen: ${choices.join(', ')}.`;
      }
    });

    finalPrompt += ` Please provide a comprehensive travel plan based on these choices. Include an estimated cost range for the trip.`;

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

  useEffect(() => {
    if (currentAspect && options.length === 0) {
      generateOptions();
    }
  }, [currentAspect]);

  return (
    <Grid container spacing={2} className="p-4 max-w-6xl mx-auto">
      <Grid item xs={3}>
        <Typography variant="h6" gutterBottom>Preferences</Typography>
        <TextField
          fullWidth
          margin="normal"
          label="Home Location"
          value={homeLocation}
          onChange={(e) => setHomeLocation(e.target.value)}
          placeholder="Enter your home city/country"
        />
        
        <Typography variant="subtitle1" gutterBottom>Aspects to Consider:</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {[...predefinedAspects, ...selectedAspects.filter(aspect => !predefinedAspects.includes(aspect))].map((aspect) => (
            <Chip
              key={aspect}
              label={aspect}
              onClick={() => handleAspectToggle(aspect)}
              color={selectedAspects.includes(aspect) ? "primary" : "default"}
            />
          ))}
        </Box>
        <form onSubmit={handleAddCustomAspect}>
          <TextField
            fullWidth
            margin="normal"
            label="Add Custom Aspect"
            value={customAspect}
            onChange={(e) => setCustomAspect(e.target.value)}
            placeholder="Enter custom aspect"
          />
          <Button type="submit" variant="outlined" size="small">
            Add Custom Aspect
          </Button>
        </form>
      </Grid>
      <Grid item xs={9}>
        <Typography variant="h4" gutterBottom>LLM-powered Travel Planner</Typography>
        
        {!isPlanningStarted ? (
          <form onSubmit={handleDestinationSubmit}>
            <TextField
              label="Destination"
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
                label={`Preferences for ${aspect}`}
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
              disabled={!destination || !homeLocation || selectedAspects.length === 0}
            >
              Start Planning
            </Button>
            {selectedAspects.length === 0 && (
              <Typography color="error" style={{ marginTop: '10px' }}>
                Please select at least one aspect to consider for your trip.
              </Typography>
            )}
          </form>
        ) : (
          <>
            <Typography variant="h6" gutterBottom>
              Choosing options for: {currentAspect}
            </Typography>
            {isGeneratingOptions ? (
              <Typography>Generating options...</Typography>
            ) : (
              <>
                <Grid container spacing={2}>
                  {options.map((option, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card>
                        <CardContent>
                          <Typography>{option}</Typography>
                        </CardContent>
                        <CardActions>
                          <Button 
                            size="small" 
                            onClick={() => handleOptionToggle(option)}
                            variant={selectedOptions[currentAspect]?.includes(option) ? "contained" : "outlined"}
                          >
                            {selectedOptions[currentAspect]?.includes(option) ? "Selected" : "Select"}
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
                  {currentAspect === selectedAspects[selectedAspects.length - 1] ? "Finalize Plan" : "Next Aspect"}
                </Button>
              </>
            )}
          </>
        )}

        {isLoading && <Typography>Generating your travel plan...</Typography>}

        {finalPlan && (
          <Card style={{ marginTop: '20px' }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>Your Travel Plan</Typography>
              <Typography variant="body1" component="div" dangerouslySetInnerHTML={{ __html: finalPlan.replace(/\n/g, '<br>') }} />
            </CardContent>
          </Card>
        )}
      </Grid>
    </Grid>
  );
};

export default TravelPlannerApp;