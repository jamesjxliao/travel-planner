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
  finalPlanRef,
  timeToVisit,
  transportationMode,
  numDays // Add this prop
}) => {
  const { t, language } = useLanguage();

  const renderSummary = () => {
    return (
      <Card elevation={3} sx={{ mb: 3, bgcolor: 'background.paper' }}>
        <CardContent sx={{ '&:last-child': { pb: 2 } }}>
          <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold', mb: 1.5 }}>
            {t('tripSummary')}
          </Typography>
          <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.100', borderRadius: 1 }}>
            {isLoading ? (
              <Skeleton variant="text" width="100%" height={80} />
            ) : (
              <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                {finalPlan?.summary?.introduction || ''}
              </Typography>
            )}
          </Box>
          
          {timeToVisit === 'flexible' && (
            <Box sx={{ mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', display: 'inline' }}>
                {t('bestTimeToVisit')}:
              </Typography>
              {isLoading ? (
                <Skeleton variant="text" width="70%" sx={{ display: 'inline-block', ml: 1 }} />
              ) : (
                <Typography variant="body2" sx={{ display: 'inline', ml: 1 }}>
                  {finalPlan?.summary?.bestTimeToVisit || ''}
                </Typography>
              )}
            </Box>
          )}
          
          {transportationMode === 'flexible' && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', display: 'inline' }}>
                {t('howToGetThere')}:
              </Typography>
              {isLoading ? (
                <Skeleton variant="text" width="70%" sx={{ display: 'inline-block', ml: 1 }} />
              ) : (
                <Typography variant="body2" sx={{ display: 'inline', ml: 1 }}>
                  {finalPlan?.summary?.howToGetThere || ''}
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderItinerary = () => {
    const daysToRender = finalPlan?.itinerary || [];

    return (
      <Box sx={{ mt: 2 }} key={JSON.stringify(finalPlan)}>
        {daysToRender.map((day, index) => {
          const dayNumber = day.day;
          const versions = dayVersions[dayNumber] || [day];
          const currentPage = currentPages[dayNumber] || 1;
          const currentVersion = versions[currentPage - 1] || day;

          const isDayRegenerating = regeneratingItinerary.day === dayNumber && !regeneratingItinerary.timeOfDay;

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
                    ? t('day').replace('天', `${dayNumber}天`) 
                    : `${t('day')} ${dayNumber}`}
                </Typography>
                <Tooltip title={t('regenerateDay')}>
                  <IconButton 
                    size="small"
                    onClick={() => regenerateItinerary(dayNumber)}
                    disabled={isLoading || (regeneratingItinerary.day === dayNumber && !regeneratingItinerary.timeOfDay)}
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
                    const imageUrl = attractionImages[dayNumber]?.[timeOfDay];
                    const isTimeOfDayRegenerating = regeneratingItinerary.day === dayNumber && regeneratingItinerary.timeOfDay === timeOfDay;
                    const isCardLoading = isLoading || isDayRegenerating || isTimeOfDayRegenerating;

                    return (
                      <Grid item xs={12} sm={4} key={timeOfDay}>
                        <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                          <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
                            {(isCardLoading || !imageUrl) ? (
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
                            ) : (
                              <CardMedia
                                component="img"
                                image={imageUrl}
                                alt={t(timeOfDay)}
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
                                  onClick={() => regenerateItinerary(dayNumber, timeOfDay)}
                                  disabled={isLoading || (regeneratingItinerary.day === dayNumber && regeneratingItinerary.timeOfDay === timeOfDay)}
                                  sx={{ ml: 0.5, p: 0.5, color: 'white' }}
                                >
                                  <RefreshIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                          <CardContent sx={{ flexGrow: 1, p: 1 }}>
                            {isCardLoading ? (
                              <>
                                <Skeleton variant="text" />
                                <Skeleton variant="text" />
                                <Skeleton variant="text" />
                              </>
                            ) : (
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
                            )}
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
                      onChange={(event, page) => handlePageChange(dayNumber, page)}
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
          {['accommodation', 'transportation', 'food', 'activities', 'other'].map((category) => (
            <Grid item xs={12} sm={6} md={4} key={category}>
              <Paper elevation={2} sx={{ p: 2, height: '100%', bgcolor: 'background.default' }}>
                <Typography variant="subtitle1" color="primary" gutterBottom>
                  {t(category)}
                </Typography>
                {isLoading ? (
                  <Skeleton variant="text" width="60%" />
                ) : (
                  <Typography variant="h6">{finalPlan?.estimatedCost?.breakdown[category] || ''}</Typography>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
        <Paper elevation={3} sx={{ mt: 3, p: 2, bgcolor: 'secondary.light' }}>
          <Typography variant="h6" color="secondary.contrastText">
            {t('totalEstimatedCost')}: {' '}
            {isLoading ? (
              <Skeleton variant="text" width="30%" sx={{ display: 'inline-block' }} />
            ) : (
              <strong>{finalPlan?.estimatedCost?.total || ''}</strong>
            )}
          </Typography>
        </Paper>
      </Box>
    );
  };

  return (
    <Box sx={{ mt: 4 }} ref={finalPlanRef}>
      {renderSummary()}
      {renderItinerary()}
    </Box>
  );
};

export default FinalPlanSection;