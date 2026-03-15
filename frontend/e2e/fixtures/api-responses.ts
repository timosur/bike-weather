/**
 * Mock API response factories for E2E tests.
 * All data shapes match the backend API contracts (snake_case for API, camelCase for frontend types).
 */

// --- JWT helpers ---

/** Create a minimal valid-looking JWT with custom claims */
function createMockJwt(claims: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      iss: "bike-weather-test",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      ...claims,
    }),
  );
  const signature = btoa("mock-signature");
  return `${header}.${payload}.${signature}`;
}

// --- Auth ---

export function mockLoginResponse(overrides?: { isAdmin?: boolean }) {
  const idToken = createMockJwt({
    sub: "user-123",
    email: "testuser@example.com",
    name: "Test User",
    preferred_username: "testuser",
    is_admin: overrides?.isAdmin ?? false,
  });
  const accessToken = createMockJwt({ sub: "user-123" });

  return {
    access_token: accessToken,
    id_token: idToken,
    token_type: "Bearer",
    expires_in: 3600,
    scope: "openid profile email",
    refresh_token: "mock-refresh-token",
  };
}

export function mockAuthMe(overrides?: { isAdmin?: boolean }) {
  return {
    id: 1,
    email: "testuser@example.com",
    name: "Test User",
    is_admin: overrides?.isAdmin ?? false,
  };
}

// --- Geocoding ---

export function mockGeocodingSearch() {
  return [
    {
      id: "loc-1",
      displayText: "Berlin, Germany",
      shortText: "Berlin",
      lat: 52.52,
      lon: 13.405,
    },
    {
      id: "loc-2",
      displayText: "Berlin Mitte, Berlin, Germany",
      shortText: "Berlin Mitte",
      lat: 52.521,
      lon: 13.411,
    },
    {
      id: "loc-3",
      displayText: "Berlin Kreuzberg, Berlin, Germany",
      shortText: "Berlin Kreuzberg",
      lat: 52.499,
      lon: 13.403,
    },
  ];
}

export function mockGeocodingReverse() {
  return {
    id: "loc-gps",
    displayText: "Alexanderplatz 1, 10178 Berlin, Germany",
    shortText: "Alexanderplatz",
    lat: 52.5219,
    lon: 13.4132,
  };
}

// --- Ride Report ---

export function mockRideReport(
  overrides?: Partial<{
    overallCondition: string;
    days: number;
    rideName: string;
  }>,
) {
  const condition = overrides?.overallCondition ?? "good";

  const baseDay = {
    id: "day-1",
    date: "2026-02-27",
    dayLabel: "Friday",
    condition: condition as "good",
    weather: {
      tempMin: 4,
      tempMax: 12,
      tempFeelsLike: 8,
      tempUnit: "°C",
      precipitation: 0.2,
      precipitationUnit: "mm",
      windSpeed: 15,
      windUnit: "km/h",
      windDirection: "SW",
      humidity: 65,
      uvIndex: 3,
      sunrise: "07:15",
      sunset: "17:45",
      icon: "cloud-sun" as const,
      description: "Partly cloudy",
    },
    hourlyForecast: [
      {
        hour: "08:00",
        datetime: "2026-02-27T08:00",
        temp: 5,
        tempFeelsLike: 3,
        precipitationProbability: 10,
        precipitationMm: 0,
        windSpeed: 12,
        windDirection: "SW",
        windGusts: 20,
        humidity: 70,
        weatherCode: 2,
        icon: "cloud-sun" as const,
        description: "Partly cloudy",
        isDay: true,
      },
      {
        hour: "12:00",
        datetime: "2026-02-27T12:00",
        temp: 12,
        tempFeelsLike: 10,
        precipitationProbability: 5,
        precipitationMm: 0,
        windSpeed: 15,
        windDirection: "SW",
        windGusts: 25,
        humidity: 55,
        weatherCode: 1,
        icon: "sun" as const,
        description: "Sunny",
        isDay: true,
      },
    ],
    rideStartHour: 8,
    rideEndHour: 12,
    clothingItems: [
      {
        id: "cl-1",
        name: "Long-sleeve jersey",
        icon: "jersey-long" as const,
        reason: "Temperatures between 4-12°C",
        alternatives: [
          {
            id: "cl-1-alt",
            name: "Short-sleeve jersey + arm warmers",
            icon: "arm-warmers" as const,
          },
        ],
      },
      {
        id: "cl-2",
        name: "Windproof vest",
        icon: "vest" as const,
        reason: "Wind speeds up to 15 km/h",
      },
      {
        id: "cl-3",
        name: "Light gloves",
        icon: "gloves-light" as const,
        reason: "Cool morning temperatures",
      },
    ],
    equipment: [
      { id: "eq-1", name: "Sunglasses", reason: "UV index 3" },
      { id: "eq-2", name: "Water bottle", reason: "Stay hydrated" },
    ],
  };

  return {
    id: "report-1",
    rideName: overrides?.rideName ?? "Morning Ride in Berlin",
    startLocation: "Berlin, Germany",
    ridingStyle: "Moderate",
    totalDistance: 50,
    distanceUnit: "km",
    overallCondition: condition,
    shareUrl: "",
    days: [baseDay],
    mergedClothingItems: baseDay.clothingItems,
    mergedEquipment: baseDay.equipment,
  };
}

export function mockMultiDayRideReport() {
  const day1 = {
    id: "day-1",
    date: "2026-02-27",
    dayLabel: "Day 1 – Friday",
    location: "Berlin",
    condition: "good" as const,
    weather: {
      tempMin: 4,
      tempMax: 12,
      tempFeelsLike: 8,
      tempUnit: "°C",
      precipitation: 0.2,
      precipitationUnit: "mm",
      windSpeed: 15,
      windUnit: "km/h",
      windDirection: "SW",
      humidity: 65,
      uvIndex: 3,
      sunrise: "07:15",
      sunset: "17:45",
      icon: "cloud-sun" as const,
      description: "Partly cloudy",
    },
    hourlyForecast: [],
    rideStartHour: 8,
    rideEndHour: 16,
    clothingItems: [
      {
        id: "cl-1",
        name: "Long-sleeve jersey",
        icon: "jersey-long" as const,
        reason: "Cool weather",
      },
      { id: "cl-2", name: "Windproof vest", icon: "vest" as const, reason: "Wind protection" },
    ],
    equipment: [{ id: "eq-1", name: "Sunglasses", reason: "UV protection" }],
  };

  const day2 = {
    id: "day-2",
    date: "2026-02-28",
    dayLabel: "Day 2 – Saturday",
    location: "Potsdam",
    condition: "ideal" as const,
    weather: {
      tempMin: 6,
      tempMax: 15,
      tempFeelsLike: 12,
      tempUnit: "°C",
      precipitation: 0,
      precipitationUnit: "mm",
      windSpeed: 8,
      windUnit: "km/h",
      windDirection: "W",
      humidity: 50,
      uvIndex: 4,
      sunrise: "07:13",
      sunset: "17:47",
      icon: "sun" as const,
      description: "Sunny",
    },
    hourlyForecast: [],
    rideStartHour: 9,
    rideEndHour: 15,
    clothingItems: [
      { id: "cl-3", name: "Short-sleeve jersey", icon: "jersey" as const, reason: "Warm weather" },
      { id: "cl-2", name: "Windproof vest", icon: "vest" as const, reason: "Wind protection" },
    ],
    equipment: [
      { id: "eq-1", name: "Sunglasses", reason: "UV protection" },
      { id: "eq-2", name: "Sunscreen", reason: "UV index 4" },
    ],
  };

  return {
    id: "report-multi",
    rideName: "Berlin to Potsdam Tour",
    startLocation: "Berlin, Germany",
    ridingStyle: "Relaxed",
    totalDistance: 120,
    distanceUnit: "km",
    overallCondition: "good",
    shareUrl: "",
    days: [day1, day2],
    mergedClothingItems: [
      {
        id: "cl-1",
        name: "Long-sleeve jersey",
        icon: "jersey-long" as const,
        reason: "Cool weather",
      },
      { id: "cl-3", name: "Short-sleeve jersey", icon: "jersey" as const, reason: "Warm weather" },
      { id: "cl-2", name: "Windproof vest", icon: "vest" as const, reason: "Wind protection" },
    ],
    mergedEquipment: [
      { id: "eq-1", name: "Sunglasses", reason: "UV protection" },
      { id: "eq-2", name: "Sunscreen", reason: "UV index 4" },
    ],
  };
}

// --- Saved Routes (API format: snake_case) ---

export function mockSavedRoutesAPI() {
  return [
    {
      id: "route-1",
      name: "Morning Commute",
      start_location: "Berlin Mitte",
      total_distance: 12,
      distance_unit: "km",
      riding_style: "Easy",
      last_condition: "good",
      last_used: new Date().toISOString(),
      share_token: null,
      created_at: "2026-01-15T10:00:00Z",
      ride_input: {
        location: { address: "Berlin Mitte", lat: 52.521, lon: 13.411 },
        destination: { address: "Berlin Kreuzberg", lat: 52.499, lon: 13.403 },
        startDate: "2026-02-27",
        startTime: "08:00",
        endDate: null,
        isMultiDay: false,
        bikeType: "city" as const,
        intensity: "gemuetlich" as const,
        distanceKm: 12,
        dayStops: [],
      },
    },
    {
      id: "route-2",
      name: "Weekend Gravel",
      start_location: "Berlin Kreuzberg",
      total_distance: 65,
      distance_unit: "km",
      riding_style: "Sporty",
      last_condition: "ideal",
      last_used: "2026-02-20T14:30:00Z",
      share_token: "share-abc123",
      created_at: "2026-01-20T12:00:00Z",
      ride_input: {
        location: { address: "Berlin Kreuzberg", lat: 52.499, lon: 13.403 },
        destination: { address: "Potsdam", lat: 52.396, lon: 13.058 },
        startDate: "2026-02-27",
        startTime: "09:00",
        endDate: null,
        isMultiDay: false,
        bikeType: "gravel" as const,
        intensity: "sportlich" as const,
        distanceKm: 65,
        dayStops: [],
      },
    },
    {
      id: "route-3",
      name: "Evening Ride",
      start_location: "Potsdam",
      total_distance: 30,
      distance_unit: "km",
      riding_style: "Touring",
      last_condition: null,
      last_used: null,
      share_token: null,
      created_at: "2026-02-01T08:00:00Z",
      ride_input: null,
    },
  ];
}

export function mockSavedRouteAPI(id: string) {
  const routes = mockSavedRoutesAPI();
  return routes.find((r) => r.id === id) ?? routes[0];
}

export function mockShareResponse() {
  return {
    share_token: "new-share-token-xyz",
    share_url: "http://localhost:5173/shared/new-share-token-xyz",
  };
}

export function mockCreateRouteResponse() {
  return {
    id: "route-new-1",
    name: "Morning Ride in Berlin",
    start_location: "Berlin, Germany",
    total_distance: 50,
    distance_unit: "km",
    riding_style: "Moderate",
    last_condition: "good",
    last_used: new Date().toISOString(),
    share_token: null,
    created_at: new Date().toISOString(),
    ride_input: null,
  };
}

// --- Admin Products ---

export function mockAdminProducts() {
  return {
    items: [
      {
        id: "prod-1",
        name: "Castelli Perfetto RoS",
        categoryId: "cat-1",
        imageUrl: "https://example.com/img1.jpg",
        shopId: "shop-1",
        affiliateUrl: "https://example.com/aff1",
        matchesZone: "upper_body",
        matchesLabel: "Rain jacket",
        weatherTempMin: 5,
        weatherTempMax: 15,
        weatherPrecipitation: "rain",
        weatherWind: "any",
        weatherSummary: "Cold & wet",
        isPublished: true,
        createdAt: "2026-01-10T10:00:00Z",
        updatedAt: "2026-02-20T14:00:00Z",
      },
      {
        id: "prod-2",
        name: "Pearl Izumi Thermal Jersey",
        categoryId: "cat-1",
        imageUrl: "https://example.com/img2.jpg",
        shopId: "shop-2",
        affiliateUrl: "https://example.com/aff2",
        matchesZone: "upper_body",
        matchesLabel: "Thermal jersey",
        weatherTempMin: -5,
        weatherTempMax: 10,
        weatherPrecipitation: "any",
        weatherWind: "any",
        weatherSummary: "Cold weather",
        isPublished: false,
        createdAt: "2026-01-12T09:00:00Z",
        updatedAt: "2026-02-18T11:00:00Z",
      },
    ],
    total: 2,
    page: 1,
    pageSize: 50,
  };
}

export function mockAdminCategories() {
  return [
    {
      id: "cat-1",
      name: "Jerseys",
      slug: "jerseys",
      description: "Cycling jerseys",
      icon: "jersey",
      displayOrder: 1,
    },
    {
      id: "cat-2",
      name: "Jackets",
      slug: "jackets",
      description: "Cycling jackets",
      icon: "jacket",
      displayOrder: 2,
    },
  ];
}

export function mockAdminShops() {
  return [
    {
      id: "shop-1",
      name: "Bike-Components",
      logoUrl: "https://example.com/bc.png",
      affiliateTag: "bw-bc",
    },
    {
      id: "shop-2",
      name: "bike24",
      logoUrl: "https://example.com/b24.png",
      affiliateTag: "bw-b24",
    },
  ];
}

// --- Admin FAQ ---

export function mockAdminFaqItems() {
  return [
    {
      id: "faq-1",
      question: "How does Bike Weather work?",
      answer: "It checks the forecast and recommends clothing.",
      category: "general",
      displayOrder: 1,
      isPublished: true,
      createdAt: "2026-01-05T10:00:00Z",
      updatedAt: "2026-02-10T12:00:00Z",
    },
    {
      id: "faq-2",
      question: "Is Bike Weather free?",
      answer: "Yes, it is completely free.",
      category: "general",
      displayOrder: 2,
      isPublished: true,
      createdAt: "2026-01-06T10:00:00Z",
      updatedAt: "2026-02-11T12:00:00Z",
    },
  ];
}

// --- Admin About ---

export function mockAdminAboutSections() {
  return [
    {
      id: 1,
      sectionKey: "intro",
      title: "About Me",
      body: "Hello, I am Timo.",
      imageUrl: null,
      displayOrder: 1,
      isPublished: true,
      updatedAt: "2026-02-01T10:00:00Z",
    },
    {
      id: 2,
      sectionKey: "cycling",
      title: "My Cycling Journey",
      body: "I started cycling in 2015.",
      imageUrl: "https://example.com/cycling.jpg",
      displayOrder: 2,
      isPublished: true,
      updatedAt: "2026-02-05T10:00:00Z",
    },
  ];
}

// --- Admin Contacts ---

export function mockAdminContacts() {
  return {
    items: [
      {
        id: 1,
        category: "feedback",
        name: "Alice",
        email: "alice@example.com",
        message: "Great app!",
        createdAt: "2026-02-25T10:00:00Z",
      },
      {
        id: 2,
        category: "bug",
        name: "Bob",
        email: "bob@example.com",
        message: "Found a bug with weather display.",
        createdAt: "2026-02-26T14:00:00Z",
      },
    ],
    total: 2,
    page: 1,
    pageSize: 50,
  };
}

// --- Public FAQ ---

export function mockFaqItems() {
  return [
    {
      id: "faq-1",
      question: "How does Bike Weather work?",
      answer: "Bike Weather uses weather forecasts to recommend cycling clothing and equipment.",
      category: "general",
    },
    {
      id: "faq-2",
      question: "Is Bike Weather free?",
      answer: "Yes, Bike Weather is completely free to use.",
      category: "general",
    },
    {
      id: "faq-3",
      question: "What weather data do you use?",
      answer: "We use Open-Meteo for weather forecasts.",
      category: "weather",
    },
  ];
}

// --- Public About ---

export function mockAboutSections() {
  return [
    {
      sectionKey: "intro",
      title: "About Me",
      body: "Hello, I am Timo.",
      imageUrl: null,
      displayOrder: 1,
    },
    {
      sectionKey: "cycling",
      title: "My Cycling Journey",
      body: "I started cycling in 2015.",
      imageUrl: null,
      displayOrder: 2,
    },
  ];
}

// --- Public App Info ---

export function mockAppInfoSections() {
  return [
    {
      sectionKey: "intro",
      title: "Bike Weather",
      body: "Your cycling weather companion.",
      imageUrl: null,
      displayOrder: 1,
    },
    {
      sectionKey: "features",
      title: "Features",
      body: "Weather-based recommendations, clothing advisor, route saving.",
      imageUrl: null,
      displayOrder: 2,
    },
  ];
}
