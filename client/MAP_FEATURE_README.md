# Map Feature Implementation

This document describes the map feature that has been added to the hackathon dashboard.

## Features

### 1. Interactive Map Display
- Uses React Leaflet with OpenStreetMap tiles
- Responsive design that works on desktop and mobile
- Customizable center coordinates and zoom level

### 2. Location Tracking
- **Get Current Location**: One-time location request
- **Start/Stop Tracking**: Continuous location monitoring
- **Location History**: Shows trail of previous locations
- **Accuracy Display**: Shows GPS accuracy in meters

### 3. User Interface
- Toggle map visibility with "Show Map"/"Hide Map" button
- Location controls for starting/stopping tracking
- Real-time location updates
- Error handling for location permission issues

## Components

### MapView.jsx
Main map component with the following props:
- `center`: Initial map center coordinates (default: Seattle)
- `zoom`: Initial zoom level (default: 13)
- `height`: Map container height (default: "400px")
- `showUserLocation`: Whether to show user's current location (default: true)
- `onLocationUpdate`: Callback function for location updates

### Dashboard Integration
The map is integrated into the main Dashboard component with:
- State management for map visibility
- Location state tracking
- Toggle button in the header

## Usage

1. **Show the Map**: Click the "Show Map" button in the dashboard header
2. **Get Current Location**: Click "Get Current Location" to get your current position
3. **Start Tracking**: Click "Start Location Tracking" for continuous monitoring
4. **Stop Tracking**: Click "Stop Tracking" to stop continuous monitoring

## Technical Details

### Dependencies
- `leaflet`: Core mapping library
- `react-leaflet`: React wrapper for Leaflet
- `leaflet/dist/leaflet.css`: Default Leaflet styles

### Browser Compatibility
- Requires modern browsers with Geolocation API support
- HTTPS required for location access in production
- Fallback coordinates provided if location access is denied

### Privacy Considerations
- Location data is only stored locally in component state
- No location data is sent to external servers
- User must explicitly grant location permissions

## Customization

### Changing Default Location
```jsx
<MapView 
  center={[40.7128, -74.0060]} // New York City
  zoom={12}
/>
```

### Custom Height
```jsx
<MapView 
  height="600px"
/>
```

### Handling Location Updates
```jsx
const handleLocationUpdate = (location) => {
  console.log('New location:', location);
  // Save to database, update UI, etc.
};

<MapView onLocationUpdate={handleLocationUpdate} />
```

## Troubleshooting

### Map Not Displaying
- Ensure `leaflet` and `react-leaflet` are installed
- Check that CSS files are properly imported
- Verify container has defined height

### Location Not Working
- Check browser location permissions
- Ensure HTTPS in production
- Verify Geolocation API support

### Performance Issues
- Limit location history array size
- Use appropriate update intervals
- Consider debouncing location updates
