// AI Service for server-side Gemini integration
class AIService {
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  }

  async generateLocationDescription(locationName, context = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/description`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          locationName,
          context
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.description : data.fallback;
    } catch (error) {
      console.error('Error generating location description:', error);
      return this.getFallbackDescription(locationName);
    }
  }

  async generateLocationRecommendations(userHistory, currentLocation) {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          userHistory,
          currentLocation
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.recommendations : data.fallback;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return this.getFallbackRecommendations();
    }
  }

  async generateLocationInsights(userData, locationData) {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          userData,
          locationData
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.insights : data.fallback;
    } catch (error) {
      console.error('Error generating insights:', error);
      return this.getFallbackInsights();
    }
  }

  async generateSmartNotification(context) {
    // Smart notifications are disabled for now
    return null;
  }


  getFallbackDescription(locationName) {
    const descriptions = {
      'HUB': 'The HUB is the heart of campus life, bustling with students, food, and social activities.',
      'Library': 'The Library offers quiet study spaces and extensive resources for academic success.',
      'Engineering Building': 'The Engineering Building houses cutting-edge labs and collaborative study areas.',
      'Student Center': 'The Student Center provides comfortable spaces for relaxation and group activities.',
      'Gym': 'The Gym is perfect for staying active and maintaining a healthy lifestyle.',
      'Cafeteria': 'The Cafeteria serves delicious meals and is a great place to meet friends.',
      'Art Building': 'The Art Building showcases creativity with galleries and inspiring workspaces.',
      'Science Hall': 'Science Hall features advanced laboratories and research facilities.'
    };
    
    return descriptions[locationName] || `${locationName} is a great place to explore and discover new opportunities!`;
  }

  getFallbackRecommendations() {
    return [
      {
        name: 'Library',
        reason: 'Perfect for focused study sessions',
        tip: 'The top floor has the quietest study areas!'
      },
      {
        name: 'Student Center',
        reason: 'Great for socializing and group work',
        tip: 'Check out the game room on the second floor!'
      },
      {
        name: 'Gym',
        reason: 'Stay active and healthy',
        tip: 'The morning hours are usually less crowded!'
      }
    ];
  }

  getFallbackInsights() {
    return [
      {
        insight: 'You\'re building great exploration habits!',
        recommendation: 'Try visiting a new location each week to expand your campus knowledge.'
      },
      {
        insight: 'Consistency is key to campus mastery',
        recommendation: 'Set a goal to spend at least 30 minutes in each location you visit.'
      }
    ];
  }

  getFallbackResponse() {
    return 'AI features are currently unavailable, but you can still explore and discover new locations!';
  }
}

export default new AIService();
