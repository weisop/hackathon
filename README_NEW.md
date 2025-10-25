# ⚔️ ConQuest
### *Rediscover the Magic of Learning*

<div align="center">

**A gamified study platform that transforms campus exploration into an epic adventure**

[Demo](#demo) • [Features](#features) • [Tech Stack](#tech-stack) • [Getting Started](#getting-started)

</div>

---

## 🌟 The Spark We Lost

Remember when you were a kid? When every park was an uncharted territory, every stick was a magic wand, and every friend was a fellow adventurer? When did we lose that spark? That whimsy that made everything feel like an adventure?

**ConQuest brings it back.**

For college students, studying often feels like a chore—isolated, monotonous, and disconnected from the joy of discovery. We're losing the imaginative passion that once fueled our curiosity. ConQuest reignites that childhood magic by transforming studying into an epic quest where every library, cafe, and study spot becomes a territory to conquer.

---

## 🎯 What is ConQuest?

ConQuest is a **gamified study tool and social platform** that:
- 🗺️ Turns campus locations into conquerable territories
- 🏆 Rewards time spent studying with XP and achievements
- 👥 Connects you with friends to explore and compete together
- 🎮 Brings childlike wonder back to your academic journey
- 🤖 Uses AI to recommend the best study spots for you

Study shouldn't feel like a grind. With ConQuest, **every study session becomes an adventure**.

---

## ✨ Features

### 🗺️ **Interactive Territory Map**
- **Real-time location tracking** shows you nearby study spots
- **Visual territory markers** for cafes, libraries, and study centers
- **Beautiful fantasy-themed UI** with sword cursors and vibrant neon colors
- Track your position as you move across campus

### ⚔️ **Conquer & Level Up**
- **Spend time studying** at locations to "conquer" them
- **Earn XP and achievements** for each territory conquered
- **Level progression system** (Novice → Explorer → Regular → Expert → Master)
- **Progress tracking** shows how close you are to your next conquest
- Each level requires exponentially more time (10 min → 15 min → 22.5 min...)

### 🏆 **Leaderboards & Competition**
- **Campus-wide leaderboard** shows top conquerors
- **Compare achievements** with friends
- **Milestone badges** for special accomplishments
- View your **collection of conquered territories**

### 👥 **Friend System**
- **See where friends are studying** in real-time
- **Plan study sessions together** at new locations
- **Share recommendations** for best study spots
- **Compete on leaderboards** to stay motivated

### 🤖 **AI-Powered Insights**
- **Personalized location recommendations** based on your study history
- **Smart insights** about your study patterns and habits
- **Location descriptions** powered by Gemini AI
- **Adaptive suggestions** that learn from your preferences

### 📊 **Progress Dashboard**
- **Track total study time** across all locations
- **View achievement history** with dates and levels
- **Monitor active sessions** with real-time timers
- **Visualize your conquest journey** with detailed stats

---

## 🎨 The ConQuest Experience

### **Imaginative Fantasy Theme**
We've designed ConQuest to feel like stepping into a storybook:
- ⚔️ **Sword cursor** makes every click feel powerful
- 🎨 **Hand-drawn digital art backgrounds** transport you to another world
- 🌈 **Bright neon colors** and fantasy aesthetics
- 🧙 **Character icons** (witches, knights) represent your avatar
- 💜 **Purple and gold color scheme** evokes royalty and achievement

### **Human Connection at the Core**
College can be isolating. ConQuest brings people together:
- 📍 See where your friends are studying
- 🗺️ Discover new study spots together
- 🎯 Set group challenges and goals
- 💬 Compare achievements and celebrate wins

---

## 🚀 How It Works

1. **📍 Explore**: Open ConQuest and see nearby study locations on the map
2. **🎯 Arrive**: Get close to a location to start conquering it
3. **⏱️ Study**: A timer tracks how long you spend there
4. **⭐ Level Up**: Reach the time threshold to conquer that territory
5. **🏆 Achieve**: Collect badges, climb leaderboards, and unlock new levels
6. **🔄 Repeat**: Move on to your next conquest!

---

## 💻 Tech Stack

### **Frontend**
- **React** - UI framework
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **Leaflet** - Interactive maps
- **Axios** - API requests

### **Backend**
- **Node.js + Express** - Server framework
- **Supabase** - Database & authentication
- **PostgreSQL** - Data storage
- **Google Gemini AI** - Smart recommendations

### **Features**
- Real-time location tracking via Geolocation API
- Secure authentication with JWT tokens
- Row-level security for user data
- RESTful API architecture

---

## 📱 Key Pages

### **Dashboard**
The command center for your conquest journey:
- Interactive map showing all study locations
- Real-time location tracking
- Active session timer
- AI-powered insights and recommendations
- Friend activity feed

### **Collections**
Your trophy room:
- **Territories Being Conquered**: In-progress locations with live progress bars
- **Conquered Achievements**: Completed territories with level badges
- Filter by level, location type, and completion date
- Beautiful card-based layout with progress visualization

### **Leaderboard**
See how you rank:
- Campus-wide rankings
- Friend comparisons
- Top conquerors by total XP
- Most dedicated explorers

---

## 🎯 Why ConQuest Matters

### **For Students**
- ✅ Makes studying more engaging and fun
- ✅ Encourages exploring new study environments
- ✅ Builds healthy study habits through gamification
- ✅ Reduces study isolation and loneliness
- ✅ Creates accountability through friend systems

### **For Education**
- ✅ Increases time spent studying
- ✅ Promotes campus resource utilization
- ✅ Builds campus community
- ✅ Combines learning with social connection
- ✅ Makes education feel less like a chore

### **For Connection**
- ✅ Helps friends stay in touch despite busy schedules
- ✅ Creates natural meetup opportunities
- ✅ Shared goals strengthen relationships
- ✅ Reduces FOMO through transparent location sharing

---

## 🏃 Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/conquest.git
   cd conquest
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Set up environment variables**
   
   Create `server/.env`:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   GOOGLE_GEMINI_API_KEY=your_gemini_api_key (optional)
   PORT=3001
   ```

   Create `client/.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:3001/api
   ```

4. **Set up the database**
   - Go to your Supabase SQL Editor
   - Run the SQL script from `database/setup-all-tables.sql`
   - This creates all necessary tables, functions, and security policies

5. **Start the development servers**
   ```bash
   # Terminal 1 - Start backend
   cd server
   npm start

   # Terminal 2 - Start frontend
   cd client
   npm run dev
   ```

6. **Open the app**
   - Navigate to `http://localhost:5173`
   - Create an account and start conquering!

---

## 📚 Documentation

- [Database Setup Guide](database/DATABASE_SETUP_INSTRUCTIONS.md)
- [API Documentation](server/README.md)
- [Leveling System](database/LEVELING_SETUP_GUIDE.md)
- [Troubleshooting](CHECKPOINT_404_FIX.md)

---

## 🎮 The ConQuest Philosophy

> "When did we lose that spark? That whimsiness in our lives?"

ConQuest is built on the belief that **learning should feel like play**. We're not just building a study tracker—we're creating a portal back to the imagination and wonder of childhood.

Every conquered territory represents:
- ✨ **Time invested** in your growth
- 🌱 **Knowledge gained** through study
- 🤝 **Connections made** with fellow adventurers  
- 🏆 **Achievements unlocked** in your personal journey

By combining childlike elements, gamification, and social features, **ConQuest transforms studying from a chore into a quest**—one territory at a time.

---

## 🛠️ Built With Love

ConQuest was created to solve a real problem: the isolation and monotony of college studying. We wanted to create something that brings back the magic of exploration while building meaningful connections.

### The Team
Built with passion and late-night study sessions ☕

---

## 🤝 Contributing

We welcome contributions! Whether it's:
- 🐛 Bug reports
- 💡 Feature suggestions  
- 🎨 UI/UX improvements
- 📝 Documentation updates

Please feel free to open an issue or submit a pull request.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🌟 Acknowledgments

- Thanks to all the coffee shops and libraries that became our testing grounds
- Inspired by every college student who's ever felt studying was a grind
- Built with the belief that learning should be an adventure

---

<div align="center">

**Ready to start your quest?**

[Get Started](#getting-started) • [View Demo](#demo) • [Join the Community](#contributing)

---

*Remember: Every master was once a novice. Start your conquest today.* ⚔️

</div>




