// AI Service for Gemini integration
class AIService {
  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_GEMINI_API_KEY;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }

  async generateLocationDescription(locationName, context = {}) {
    try {
      const prompt = this.buildLocationDescriptionPrompt(locationName, context);
      const response = await this.callGeminiAPI(prompt);
      return response;
    } catch (error) {
      console.error('Error generating location description:', error);
      return this.getFallbackDescription(locationName);
    }
  }

  async generateLocationRecommendations(userHistory, currentLocation) {
    try {
      const prompt = this.buildRecommendationPrompt(userHistory, currentLocation);
      const response = await this.callGeminiAPI(prompt);
      return this.parseRecommendations(response);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return this.getFallbackRecommendations();
    }
  }

  async generateLocationInsights(userData, locationData) {
    try {
      const prompt = this.buildInsightsPrompt(userData, locationData);
      const response = await this.callGeminiAPI(prompt);
      return this.parseInsights(response);
    } catch (error) {
      console.error('Error generating insights:', error);
      return this.getFallbackInsights();
    }
  }

  async generateSmartNotification(context) {
    try {
      const prompt = this.buildNotificationPrompt(context);
      const response = await this.callGeminiAPI(prompt);
      return response;
    } catch (error) {
      console.error('Error generating notification:', error);
      return null;
    }
  }

  buildLocationDescriptionPrompt(locationName, context) {
    const { timeOfDay, weather, userLevel, isBusy } = context;
    
    return `Generate a dynamic, engaging description for the location "${locationName}" on a university campus. 
    
Context:
- Time: ${timeOfDay || 'unknown'}
- Weather: ${weather || 'unknown'}
- User Level: ${userLevel || 1}
- Busy Status: ${isBusy ? 'busy' : 'quiet'}

Make it:
- 1-2 sentences maximum
- Engaging and informative
- Context-aware (mention time/weather if relevant)
- Include a fun fact or tip about the location
- Tone: friendly, helpful, slightly playful

Example format: "The HUB is bustling with students grabbing lunch and socializing. Pro tip: The second floor has the quietest study nooks!"
`;
  }

  buildRecommendationPrompt(userHistory, currentLocation) {
    const visitedLocations = userHistory.map(h => h.locationName).join(', ');
    const totalTime = userHistory.reduce((sum, h) => sum + h.timeSpent, 0);
    
    return `Based on this user's location history, suggest 2-3 new locations they might enjoy exploring:

User History:
- Visited: ${visitedLocations || 'No previous visits'}
- Total time spent: ${Math.round(totalTime / 60)} minutes
- Current location: ${currentLocation}

Available campus locations: HUB, Library, Engineering Building, Student Center, Gym, Cafeteria, Art Building, Science Hall

Suggestions should be:
- Personalized based on their patterns
- Include brief reasoning
- Be encouraging and fun
- Format as JSON array with {name, reason, tip}

Example: [{"name": "Library", "reason": "You seem to enjoy quiet study spaces", "tip": "The 3rd floor has the best natural lighting!"}]
`;
  }

  buildInsightsPrompt(userData, locationData) {
    const { totalTime, favoriteLocation, visitPatterns } = userData;
    
    return `Analyze this user's campus exploration data and provide 2-3 personalized insights:

User Data:
- Total time spent: ${Math.round(totalTime / 60)} minutes
- Favorite location: ${favoriteLocation || 'Not determined'}
- Visit patterns: ${visitPatterns || 'No clear pattern'}

Location Data:
- Most visited: ${locationData.mostVisited || 'Unknown'}
- Peak hours: ${locationData.peakHours || 'Unknown'}

Provide insights that are:
- Personal and actionable
- Based on their actual behavior
- Encouraging and motivating
- Include specific recommendations
- Format as JSON array with {insight, recommendation}

Example: [{"insight": "You're most productive in the morning", "recommendation": "Try visiting the Library between 9-11 AM for optimal focus!"}]
`;
  }

  buildNotificationPrompt(context) {
    const { currentLocation, timeOfDay, weather, userLevel, isBusy } = context;
    
    return `Generate a smart, context-aware notification for a campus exploration app:

Context:
- Current location: ${currentLocation}
- Time: ${timeOfDay}
- Weather: ${weather}
- User level: ${userLevel}
- Location busy status: ${isBusy ? 'busy' : 'quiet'}

Create a notification that is:
- Helpful and actionable
- Context-aware (consider time, weather, busyness)
- Encouraging and positive
- 1-2 sentences maximum
- Include a specific tip or suggestion

Examples:
- "The Library is usually quieter after 2 PM - perfect time to visit!"
- "Rainy day ahead! The Student Center has great indoor study spots."
- "You're level ${userLevel}! The Engineering Building has new study pods to explore."
`;
  }

  async callGeminiAPI(prompt) {
    if (!this.apiKey) {
      console.warn('Gemini API key not found, using fallback responses');
      console.log('Available env vars:', Object.keys(import.meta.env).filter(key => key.includes('GEMINI') || key.includes('GOOGLE')));
      return this.getFallbackResponse();
    }

    try {
      const response = await fetch(`${this.baseUrl}/models/gemini-pro:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API call failed:', error);
      return this.getFallbackResponse();
    }
  }

  parseRecommendations(response) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\[.*\]/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.warn('Failed to parse recommendations JSON:', error);
    }
    
    return this.getFallbackRecommendations();
  }

  parseInsights(response) {
    try {
      const jsonMatch = response.match(/\[.*\]/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.warn('Failed to parse insights JSON:', error);
    }
    
    return this.getFallbackInsights();
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
