import React, { useState } from 'react';
import { Box, Typography, Paper, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const DebugSection = ({ currentPrompt, llmResponse }) => {
  const [expandedPrompt, setExpandedPrompt] = useState(false);
  const [expandedResponse, setExpandedResponse] = useState(false);

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Debug Information
      </Typography>
      <Accordion 
        expanded={expandedPrompt} 
        onChange={() => setExpandedPrompt(!expandedPrompt)}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Current Prompt</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {currentPrompt}
          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion 
        expanded={expandedResponse} 
        onChange={() => setExpandedResponse(!expandedResponse)}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>LLM Response</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {llmResponse}
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default DebugSection;
