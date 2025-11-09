import React from 'react';

export default function Footer(){
  const year = new Date().getFullYear();
  return (
    <div className='footer'>
      <div className='footer__inner'>
        <div className='footer__brand'>News Reader</div>
        <div className='footer__links'>
          <a href='https://newsapi.org' target='_blank' rel='noreferrer'>Powered by News APIs</a>
          <span>•</span>
          <a href='https://github.com/' target='_blank' rel='noreferrer'>Source</a>
        </div>
        <div className='footer__copy'>© {year}</div>
      </div>
    </div>
  );
}


