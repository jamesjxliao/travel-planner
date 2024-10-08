import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  Typography,
  CircularProgress,
  Box,
} from '@mui/material';

const FeedbackList = ({ open, onClose }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        setLoading(true);
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
        const response = await axios.get(`${backendUrl}/api/all-feedback`);
        setFeedbacks(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching feedbacks:', err);
        setError('Failed to load feedbacks. Please try again.');
        setLoading(false);
      }
    };

    if (open) {
      fetchFeedbacks();
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Feedback List</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height={200}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <List>
            {feedbacks.map((feedback, index) => (
              <ListItem key={feedback.id || index} divider>
                <ListItemText
                  primary={`Rating: ${feedback.rating}`}
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="text.primary">
                        Comments:
                      </Typography>
                      {` ${feedback.comment}`}
                      <br />
                      <Typography component="span" variant="body2" color="text.secondary">
                        Submitted: {new Date(feedback.timestamp).toLocaleString()}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackList;
