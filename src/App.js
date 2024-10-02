import React, { useState, useEffect } from 'react';
import OpenAI from 'openai';
import { Button, TextField, Card, CardContent, CardActions, Typography, Grid, FormControl, InputLabel, Select, MenuItem, Chip, Box, Switch, FormControlLabel } from '@mui/material';

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
  const [showDebug, setShowDebug] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [travelers, setTravelers] = useState('Solo');
  const [groupSize, setGroupSize] = useState('2');

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
    const aspectPreference = aspectPreferences[currentAspect] || '';
    let travelersInfo = `Who's traveling: ${travelers}`;
    if (travelers === 'Family' || travelers === 'Group') {
      travelersInfo += `. Group size: ${groupSize}`;
    }
    const prompt = `For a trip to ${destination} from ${homeLocation}, provide 5 distinct options for ${currentAspect}. ${travelersInfo}. User's preference: "${aspectPreference}". Each option should be succinct (no more than 15 words) and represent a different approach or choice, considering the type of travelers.`;
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
    let travelersInfo = `Who's traveling: ${travelers}`;
    if (travelers === 'Family' || travelers === 'Group') {
      travelersInfo += `. Group size: ${groupSize}`;
    }
    let finalPrompt = `I'm planning a trip from ${homeLocation} to ${destination}. ${travelersInfo}.`;
    
    Object.entries(selectedOptions).forEach(([aspect, choices]) => {
      const preference = aspectPreferences[aspect] || '';
      if (choices.length > 0) {
        finalPrompt += ` For ${aspect} (preference: "${preference}"), I've chosen: ${choices.join(', ')}.`;
      } else if (preference) {
        finalPrompt += ` For ${aspect}, my preference is: "${preference}".`;
      }
    });

    finalPrompt += ` Please provide a comprehensive travel plan based on these choices and preferences, taking into account the type of travelers. Include an estimated cost range for the trip.`;

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
        <Typography variant="h6" gutterBottom>Preferences</Typography>
        
        <FormControl fullWidth margin="normal">
          <InputLabel id="travelers-label">Who's traveling</InputLabel>
          <Select
            labelId="travelers-label"
            value={travelers}
            label="Who's traveling"
            onChange={handleTravelersChange}
          >
            <MenuItem value="Solo">Solo</MenuItem>
            <MenuItem value="Couple">Couple</MenuItem>
            <MenuItem value="Family">Family</MenuItem>
            <MenuItem value="Group">Group</MenuItem>
          </Select>
        </FormControl>

        {(travelers === 'Family' || travelers === 'Group') && (
          <TextField
            fullWidth
            margin="normal"
            label="Group Size"
            value={groupSize}
            onChange={(e) => setGroupSize(e.target.value)}
            placeholder="Enter number of travelers"
            type="number"
            InputProps={{ inputProps: { min: 3 } }}
          />
        )}

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
        <FormControlLabel
          control={<Switch checked={showDebug} onChange={(e) => setShowDebug(e.target.checked)} />}
          label="Show Debug Info"
        />
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

        {showDebug && currentPrompt && (
          <Card style={{ marginTop: '20px', backgroundColor: '#f0f0f0' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Current LLM Prompt:</Typography>
              <Typography variant="body2" component="pre" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {currentPrompt}
              </Typography>
            </CardContent>
          </Card>
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