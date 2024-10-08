import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Rating, Typography } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';

const FeedbackDialog = ({ open, onClose, onSubmit }) => {
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    onSubmit({ rating, comment });
    setRating(0);
    setComment('');
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t('provideFeedback')}</DialogTitle>
      <DialogContent>
        <Typography component="legend">{t('rateExperience')}</Typography>
        <Rating
          name="feedback-rating"
          value={rating}
          onChange={(event, newValue) => {
            setRating(newValue);
          }}
        />
        <TextField
          autoFocus
          margin="dense"
          id="comment"
          label={t('comments')}
          type="text"
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('cancel')}</Button>
        <Button onClick={handleSubmit} disabled={rating === 0}>{t('submit')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FeedbackDialog;
