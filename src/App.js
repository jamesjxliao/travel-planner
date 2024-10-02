import React, { useState, useEffect } from 'react';
import OpenAI from 'openai';
import { Button, TextField, Card, CardContent, CardActions, Typography, Grid, FormControl, InputLabel, Select, MenuItem, Chip, Box } from '@mui/material';

const client = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // This is not recommended for production use
});

const TravelPlannerApp = () => {
  const [destination, setDestination] = useState('');
  const [isPlanningStarted, setIsPlanningStarted] = useState(false);
  const [currentAspect, setCurrentAspect] = useState('');
  const [options, setOptions] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [finalPlan, setFinalPlan] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [budget, setBudget] = useState('any');
  const [homeLocation, setHomeLocation] = useState('San Francisco');
  const [selectedAspects, setSelectedAspects] = useState(['Time to visit', 'Food']);
  const [customAspect, setCustomAspect] = useState('');

  const predefinedAspects = [
    "Time to visit",
    "Transportation method",
    "Lodging",
    "Food",
    "Attractions"
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
    if (!destination.trim()) return;
    
    setIsLoading(true);
    try {
      await getLLMResponse(`I'm planning a trip from ${homeLocation} to ${destination}. My budget preference is ${budget}.`);
      setIsPlanningStarted(true);
    } catch (error) {
      console.error("Error starting planning:", error);
      // Optionally, show an error message to the user
    } finally {
      setIsLoading(false);
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

  const moveToNextAspect = () => {
    const nextAspect = selectedAspects.find(aspect => !coveredAspects.has(aspect));
    if (nextAspect) {
      setCurrentAspect(nextAspect);
      setOptions([]);
    } else {
      setIsSummarizing(true);
      finalizePlan();
    }
  };

  const finalizePlan = async () => {
    const costPrompt = "Based on all the choices made, provide an estimated total cost range for this trip.";
    const estimatedCostResponse = await getLLMResponse(costPrompt);
    setEstimatedCost(estimatedCostResponse);

    const finalPrompt = "Summarize the complete travel plan based on all the information collected. Be concise and use bullet points.";
    const finalPlanResponse = await getLLMResponse(finalPrompt);
    setFinalPlan(finalPlanResponse);
    setIsSummarizing(false);
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
    if (isPlanningStarted && !finalPlan) {
      moveToNextAspect();
    }
  }, [isPlanningStarted, coveredAspects, finalPlan]);

  return (
    <Grid container spacing={2} className="p-4 max-w-6xl mx-auto">
      <Grid item xs={3}>
        <Typography variant="h6" gutterBottom>Preferences</Typography>
        <FormControl fullWidth margin="normal">
          <InputLabel>Budget</InputLabel>
          <Select
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            label="Budget"
          >
            <MenuItem value="any">Any</MenuItem>
            <MenuItem value="economy">Economy</MenuItem>
            <MenuItem value="premium">Regular</MenuItem>
            <MenuItem value="luxury">Luxury</MenuItem>
          </Select>
        </FormControl>
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
          {predefinedAspects.map((aspect) => (
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
        
        {!isPlanningStarted && (
          <form onSubmit={handleDestinationSubmit}>
            <TextField
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Where would you like to go?"
              fullWidth
              margin="normal"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              variant="contained" 
              disabled={isLoading || !budget || !homeLocation}
            >
              {isLoading ? 'Planning...' : 'Start Planning'}
            </Button>
            {isLoading && <Typography>Preparing your travel plan...</Typography>}
          </form>
        )}

        {isPlanningStarted && !finalPlan && (
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>{currentAspect}</Typography>
              {options.length === 0 ? (
                <TextField
                  fullWidth
                  placeholder={`Enter your preferences for ${currentAspect}`}
                  onKeyPress={(e) => e.key === 'Enter' && handleAspectInput(e.target.value)}
                />
              ) : (
                <ul>
                  {options.map((option, index) => (
                    <li key={index} className="mb-2">
                      <Button variant="outlined" onClick={() => handleOptionChoice((index + 1).toString())}>{option}</Button>
                    </li>
                  ))}
                  <li>
                    <Button variant="outlined" onClick={() => handleOptionChoice('none')}>None of these</Button>
                  </li>
                </ul>
              )}
            </CardContent>
            <CardActions>
              <Button onClick={moveToNextAspect}>Skip</Button>
            </CardActions>
          </Card>
        )}

        {isSummarizing && (
          <Typography variant="body1">Generating your travel summary...</Typography>
        )}

        {finalPlan && (
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>Your Travel Plan</Typography>
              <Typography variant="body1" paragraph><strong>Estimated Cost Range:</strong> {estimatedCost}</Typography>
              <Typography variant="body1" component="div" dangerouslySetInnerHTML={{ __html: finalPlan.replace(/\n/g, '<br>') }} />
            </CardContent>
          </Card>
        )}
      </Grid>
    </Grid>
  );
};

export default TravelPlannerApp;