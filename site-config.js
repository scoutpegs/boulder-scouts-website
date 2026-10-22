/* Public configuration only. Never place passwords, token secrets or private iCal URLs here. */
window.BOULDER_CONFIG = Object.freeze({
  name: 'Boulder Scout Group',
  email: 'gl.boulder@scoutswa.com.au',
  addr: '10 Hamilton Street South, Boulder WA 6432',
  hall: 'Boulder Scout Hall',
  phone: '',
  fb: 'https://www.facebook.com/BoulderScoutGroup/',
  ig: 'https://www.instagram.com/boulderscoutgroup/',
  venturerIg: 'https://www.instagram.com/boulder_venturers/',
  yt: '',
  websiteUrl: 'https://boulderscouts.com',
  timezone: 'Australia/Perth',
  /* Set to the real deployed Worker origin AFTER deployment; no trailing slash. */
  apiBase: '',
  /* Turnstile site key is public. It may remain blank until configured. */
  turnstileSiteKey: '',
  /* Legacy direct ICS feed disabled. Confirmed group events are loaded via the Cloudflare Worker calendar proxy. */
  ics: '',
  feed: '',
  calUrl: '',
  waLogo: 'whitelogo.png', // Add this Scouts WA white logo at the repository root; relative path works on GitHub Pages and the custom domain.
  photos: [],
  history: '',
  fee: 'Ask us for the current group fee.',
  calendars: {
    whole: { name: 'Whole group', id: '147c938779b4fe249b19a47abc53e2f2070b7f536f50bfdc0fbabda1276a2246@group.calendar.google.com', color: '#800000' },
    joeys: { name: 'Joey Scouts', id: '6c5ec6e03d3c8f4d56be43a2980ae482627b20192f7fb3a0d98670c32d1ef214@group.calendar.google.com', color: '#E37E00' },
    cubs: { name: 'Cub Scouts', id: '0cee13b6cf55915f7e1ce6adcf7f610ce4d1aab4f8de645dff509031ee000300@group.calendar.google.com', color: '#D9A300' },
    scouts: { name: 'Scouts', id: '2d01af5880a708dc71f84202fdf26ba4beaa54733973d15a529105a3c2edc2bc@group.calendar.google.com', color: '#00843D' },
    venturers: { name: 'Venturer Scouts', id: '22b8edad6e49ee7b5a0c16cf6e99f95bec387d8ae31939e5040d862a884f0b5e@group.calendar.google.com', color: '#A6192E' }
  }
});
