// Common UAE locations with coordinates.
// Used for from/to selection until live Google Places autocomplete is added.

export type UAELocation = {
  name: string;
  area: string;
  lat: number;
  lng: number;
};

export const UAE_LOCATIONS: UAELocation[] = [
  // Dubai
  { name: 'Dubai Marina', area: 'Dubai', lat: 25.0805, lng: 55.1403 },
  { name: 'Downtown Dubai', area: 'Dubai', lat: 25.1972, lng: 55.2744 },
  { name: 'DIFC', area: 'Dubai', lat: 25.2110, lng: 55.2796 },
  { name: 'Business Bay', area: 'Dubai', lat: 25.1857, lng: 55.2645 },
  { name: 'JLT', area: 'Dubai', lat: 25.0693, lng: 55.1438 },
  { name: 'Deira', area: 'Dubai', lat: 25.2719, lng: 55.3095 },
  { name: 'Bur Dubai', area: 'Dubai', lat: 25.2631, lng: 55.2972 },
  { name: 'Dubai Silicon Oasis', area: 'Dubai', lat: 25.1213, lng: 55.3773 },
  { name: 'Jebel Ali', area: 'Dubai', lat: 25.0118, lng: 55.1336 },
  { name: 'Al Barsha', area: 'Dubai', lat: 25.1126, lng: 55.1962 },
  { name: 'Dubai Investment Park', area: 'Dubai', lat: 24.9857, lng: 55.1745 },
  { name: 'Discovery Gardens', area: 'Dubai', lat: 25.0410, lng: 55.1480 },
  { name: 'Dubai Airport (DXB)', area: 'Dubai', lat: 25.2532, lng: 55.3657 },

  // Sharjah
  { name: 'Sharjah City', area: 'Sharjah', lat: 25.3463, lng: 55.4209 },
  { name: 'Al Nahda Sharjah', area: 'Sharjah', lat: 25.2980, lng: 55.3730 },
  { name: 'Al Majaz', area: 'Sharjah', lat: 25.3290, lng: 55.3850 },
  { name: 'University City Sharjah', area: 'Sharjah', lat: 25.2920, lng: 55.4870 },

  // Abu Dhabi
  { name: 'Abu Dhabi City', area: 'Abu Dhabi', lat: 24.4539, lng: 54.3773 },
  { name: 'Yas Island', area: 'Abu Dhabi', lat: 24.4959, lng: 54.6056 },
  { name: 'Khalifa City', area: 'Abu Dhabi', lat: 24.4198, lng: 54.5783 },
  { name: 'Abu Dhabi Airport (AUH)', area: 'Abu Dhabi', lat: 24.4330, lng: 54.6511 },
  { name: 'Mussafah', area: 'Abu Dhabi', lat: 24.3490, lng: 54.5020 },

  // Ajman
  { name: 'Ajman City', area: 'Ajman', lat: 25.4052, lng: 55.5136 },

  // Al Ain
  { name: 'Al Ain City', area: 'Al Ain', lat: 24.1917, lng: 55.7608 },

  // RAK & Fujairah
  { name: 'Ras Al Khaimah City', area: 'RAK', lat: 25.7895, lng: 55.9432 },
  { name: 'Fujairah City', area: 'Fujairah', lat: 25.1288, lng: 56.3265 },
];
