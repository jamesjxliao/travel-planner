import React from 'react';
import { Box, Typography, Card, CardContent, Grid, Paper, CardMedia, Skeleton, IconButton, Tooltip, Pagination } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useLanguage } from '../contexts/LanguageContext';

const FinalPlanSection = ({ 
  finalPlan, 
  dayVersions, 
  currentPages, 
  handlePageChange, 
  regenerateItinerary, 
  isLoading, 
  regeneratingItinerary,
  attractionImages,
  finalPlanRef
}) => {
  const { t, language } = useLanguage();

  const renderItinerary = () => {
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

  return (
    <Box sx={{ mt: 4 }} ref={finalPlanRef}>
      <Typography variant="h5" gutterBottom>{t('yourTravelPlan')}</Typography>
      {renderItinerary()}
    </Box>
  );
};

export default FinalPlanSection;
