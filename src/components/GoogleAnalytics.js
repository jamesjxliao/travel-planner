import React from 'react';

const GoogleAnalytics = () => {
  return (
    <React.Fragment>
      <script async src="https://www.googletagmanager.com/gtag/js?id=G-5FTTLPJ62P"></script>
      <script>
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-5FTTLPJ62P');
        `}
      </script>
    </React.Fragment>
  );
};

export default GoogleAnalytics;
