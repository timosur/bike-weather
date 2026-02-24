import type { FaqItem } from '../components/faq/types'

export const faqItems: FaqItem[] = [
  {
    id: 'was-ist-fahrrad-wetter',
    question: 'What is Fahrrad Wetter?',
    answer: 'Fahrrad Wetter is a free web app that provides personalized clothing and gear recommendations for your bike ride based on real-time weather data. Simply enter your starting location, bike type, and riding style \u2014 and you\u2019ll get a recommendation for what to wear and pack.',
    category: 'General',
  },
  {
    id: 'kostenlos',
    question: 'Is Fahrrad Wetter free?',
    answer: 'Yes, completely free. The app is funded through advertising and affiliate links to recommended products. You don\u2019t pay anything extra.',
    category: 'General',
  },
  {
    id: 'account-noetig',
    question: 'Do I need an account?',
    answer: 'No. The core feature \u2014 weather lookup and clothing recommendation \u2014 works entirely without signing up. An optional account lets you save routes and reuse them more quickly.',
    category: 'General',
  },
  {
    id: 'wetterdaten-quelle',
    question: 'Where does the weather data come from?',
    answer: 'The weather data comes from professional weather services and is retrieved in real time via standardized APIs. This ensures you always get up-to-date forecasts for your location.',
    category: 'Weather data',
  },
  {
    id: 'vorhersage-genauigkeit',
    question: 'How accurate are the forecasts?',
    answer: 'The accuracy matches that of the underlying weather services. For the next 1\u20133 days, forecasts are generally very reliable. The further into the future, the less accurate they become \u2014 as with any weather forecast.',
    category: 'Weather data',
  },
  {
    id: 'zukunft-wetter',
    question: 'Can I also check the weather for tomorrow or the day after?',
    answer: 'Yes, you can select any date in the future. Keep in mind, however, that forecast accuracy decreases over time.',
    category: 'Weather data',
  },
  {
    id: 'empfehlung-berechnung',
    question: 'How are the clothing recommendations calculated?',
    answer: 'From the combination of temperature, wind speed, precipitation probability, your bike type, and your planned intensity. Each factor affects how warm or cold you\u2019ll feel on the bike \u2014 for example, a sporty rider on a road bike needs less insulation than a leisurely city cyclist.',
    category: 'Recommendations',
  },
  {
    id: 'empfehlung-individuell',
    question: 'Do the recommendations fit everyone?',
    answer: 'The recommendations are a well-founded starting point. Personal sensitivity to cold or heat varies \u2014 after a few rides with the app, you\u2019ll know whether you tend to need one layer more or less.',
    category: 'Recommendations',
  },
  {
    id: 'standort-warum',
    question: 'Why does the app ask for my location?',
    answer: 'To retrieve the weather data for your exact starting location. You can also manually enter an address or city if you don\u2019t want to use GPS location.',
    category: 'Technical',
  },
  {
    id: 'offline',
    question: 'Does the app work offline?',
    answer: 'No, an internet connection is required for current weather data. The app fetches fresh data with every request to give you the most accurate recommendation.',
    category: 'Technical',
  },
]
