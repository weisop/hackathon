// Enhanced Location Service with API Integration
const googlemaps = require('googlemaps');

class LocationService {
  constructor() {
    // Initialize API client with API key
    this.gmaps = googlemaps({
      key: process.env.GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE',
      stagger_time: 1000, // 1 second between requests
      encode_polylines: false,
      secure: true
    });
  }

  // Enhanced geocoding with detailed information
  async geocodeLocation(latitude, longitude) {
    try {
      console.log(`🗺️ Geocoding location: ${latitude}, ${longitude}`);
      
      // Convert callback-based API to promise
      const geocodeResult = await new Promise((resolve, reject) => {
        this.gmaps.reverseGeocode({
          latlng: `${latitude},${longitude}`,
          result_type: ['street_address', 'route', 'locality', 'administrative_area_level_1', 'country'],
          location_type: ['ROOFTOP', 'RANGE_INTERPOLATED']
        }, (err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });

      if (geocodeResult.status === 'OK' && geocodeResult.results.length > 0) {
        const result = geocodeResult.results[0];
        return {
          success: true,
          address: result.formatted_address,
          components: this.parseAddressComponents(result.address_components),
          geometry: result.geometry,
          placeId: result.place_id,
          types: result.types
        };
      } else {
        return {
          success: false,
          error: 'No results found for the given coordinates'
        };
      }
    } catch (error) {
      console.error('❌ Geocoding error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get nearby places and points of interest
  async getNearbyPlaces(latitude, longitude, radius = 1000, type = 'establishment') {
    try {
      console.log(`🔍 Finding nearby places near: ${latitude}, ${longitude}`);
      
      const placesResult = await new Promise((resolve, reject) => {
        this.gmaps.placesNearby({
          location: `${latitude},${longitude}`,
          radius: radius,
          type: type,
          rankby: 'distance'
        }, (err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });

      if (placesResult.status === 'OK') {
        return {
          success: true,
          places: placesResult.results.map(place => ({
            name: place.name,
            placeId: place.place_id,
            rating: place.rating,
            priceLevel: place.price_level,
            types: place.types,
            vicinity: place.vicinity,
            geometry: place.geometry
          }))
        };
      } else {
        return {
          success: false,
          error: 'No nearby places found'
        };
      }
    } catch (error) {
      console.error('❌ Places search error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get detailed place information
  async getPlaceDetails(placeId) {
    try {
      console.log(`📋 Getting details for place: ${placeId}`);
      
      const placeDetails = await new Promise((resolve, reject) => {
        this.gmaps.placeDetails({
          place_id: placeId,
          fields: ['name', 'formatted_address', 'geometry', 'rating', 'price_level', 'opening_hours', 'photos', 'reviews']
        }, (err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });

      if (placeDetails.status === 'OK') {
        return {
          success: true,
          details: placeDetails.result
        };
      } else {
        return {
          success: false,
          error: 'Place details not found'
        };
      }
    } catch (error) {
      console.error('❌ Place details error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Calculate distance and travel time between two points
  async getDistanceMatrix(origin, destination, mode = 'driving') {
    try {
      console.log(`📏 Calculating distance from ${origin} to ${destination}`);
      
      const distanceMatrix = await new Promise((resolve, reject) => {
        this.gmaps.distanceMatrix({
          origins: [origin],
          destinations: [destination],
          mode: mode,
          units: 'metric',
          avoid: 'tolls'
        }, (err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });

      if (distanceMatrix.status === 'OK' && distanceMatrix.rows[0].elements[0].status === 'OK') {
        const element = distanceMatrix.rows[0].elements[0];
        return {
          success: true,
          distance: element.distance,
          duration: element.duration,
          mode: mode
        };
      } else {
        return {
          success: false,
          error: 'Could not calculate distance'
        };
      }
    } catch (error) {
      console.error('❌ Distance calculation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get directions between two points
  async getDirections(origin, destination, mode = 'driving') {
    try {
      console.log(`🧭 Getting directions from ${origin} to ${destination}`);
      
      const directions = await new Promise((resolve, reject) => {
        this.gmaps.directions({
          origin: origin,
          destination: destination,
          mode: mode,
          avoid: 'tolls',
          alternatives: false
        }, (err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });

      if (directions.status === 'OK' && directions.routes.length > 0) {
        const route = directions.routes[0];
        return {
          success: true,
          route: {
            summary: route.summary,
            legs: route.legs.map(leg => ({
              distance: leg.distance,
              duration: leg.duration,
              startAddress: leg.start_address,
              endAddress: leg.end_address,
              steps: leg.steps
            })),
            overviewPolyline: route.overview_polyline
          }
        };
      } else {
        return {
          success: false,
          error: 'No route found'
        };
      }
    } catch (error) {
      console.error('❌ Directions error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Enhanced location data combining multiple services
  async getEnhancedLocationData(latitude, longitude) {
    try {
      console.log(`🌟 Getting enhanced location data for: ${latitude}, ${longitude}`);
      
      // Get all location data in parallel
      const [geocodeResult, nearbyPlaces] = await Promise.all([
        this.geocodeLocation(latitude, longitude),
        this.getNearbyPlaces(latitude, longitude)
      ]);

      return {
        success: true,
        coordinates: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        },
        address: geocodeResult.success ? geocodeResult.address : null,
        addressComponents: geocodeResult.success ? geocodeResult.components : null,
        nearbyPlaces: nearbyPlaces.success ? nearbyPlaces.places : [],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Enhanced location data error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Parse address components into structured format
  parseAddressComponents(components) {
    const parsed = {};
    
    components.forEach(component => {
      component.types.forEach(type => {
        switch (type) {
          case 'street_number':
            parsed.streetNumber = component.long_name;
            break;
          case 'route':
            parsed.street = component.long_name;
            break;
          case 'locality':
            parsed.city = component.long_name;
            break;
          case 'administrative_area_level_1':
            parsed.state = component.long_name;
            parsed.stateCode = component.short_name;
            break;
          case 'country':
            parsed.country = component.long_name;
            parsed.countryCode = component.short_name;
            break;
          case 'postal_code':
            parsed.postalCode = component.long_name;
            break;
        }
      });
    });
    
    return parsed;
  }

  // Validate if API key is configured
  isConfigured() {
    return process.env.GOOGLE_MAPS_API_KEY && process.env.GOOGLE_MAPS_API_KEY !== 'YOUR_API_KEY_HERE';
  }
}

module.exports = new LocationService();
