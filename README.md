# SignTogether 🤝

**Real-time, accessible video meetings powered by AI**

SignTogether is an inclusive video-meeting platform that uses computer vision and AI to make communication between deaf and hearing users seamless. Built for Cal Hacks 12.0 with cutting-edge sponsor technologies.

![SignTogether Demo](https://via.placeholder.com/800x400/2563eb/ffffff?text=SignTogether+Demo)

## 🌟 Features

- **🎥 Real-time Video Meetings** - Powered by LiveKit for high-quality, low-latency video calls
- **📝 Live Speech-to-Text** - Deepgram's Nova-2 model provides accurate real-time captions
- **👋 Gesture Recognition** - Gemini Vision detects sign language and common gestures
- **🤖 Smart Summaries** - Claude 3.5 Sonnet generates meeting summaries and action items
- **🔗 API-First Design** - Comprehensive REST API for easy integration

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- API keys for sponsor services (see `.env.example`)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/signtogether.git
   cd signtogether
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Initialize the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Seed demo data (optional)**
   ```bash
   sqlite3 dev.db < seed/demo-data.sql
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   ```
   http://localhost:3000
   ```

## 🔧 Configuration

### Required API Keys

Add these to your `.env` file:

```env
# LiveKit - Video infrastructure
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_WS_URL=wss://your-livekit-server.com

# Deepgram - Speech recognition
DEEPGRAM_API_KEY=your_deepgram_api_key

# Google Gemini - Computer vision
GOOGLE_API_KEY=your_google_api_key

# Anthropic Claude - Natural language processing
ANTHROPIC_API_KEY=your_anthropic_api_key
```


## 📱 Usage

### Starting a Meeting

1. **Join Screen**: Enter your name and room name
2. **Configure Media**: Enable/disable camera and microphone
3. **Join Meeting**: Click "Join Meeting" to enter the room

### During the Meeting

- **Live Captions**: Toggle real-time speech-to-text transcription
- **Gesture Detection**: AI automatically detects sign language activity
- **Meeting Controls**: Mute/unmute, camera on/off, leave meeting
- **Side Panel**: View live captions and meeting summaries

### After the Meeting

- **Meeting Summary**: AI-generated overview of key discussion points
- **Action Items**: Extracted tasks and follow-ups
- **Transcript**: Full conversation history with timestamps

## 🎯 90-Second Demo Script

### Setup (10 seconds)
1. Open SignTogether homepage
2. Enter "Demo User" and "accessibility-demo" room
3. Click "Join Meeting"

### Live Features Demo (60 seconds)
1. **Video Call** (10s): Show high-quality video interface
2. **Live Captions** (15s): Speak and demonstrate real-time transcription
3. **Gesture Recognition** (15s): Wave, nod, or use simple gestures - show detection
4. **Sign Language** (10s): If possible, demonstrate sign language detection
5. **Side Panel** (10s): Toggle between captions and summary views

### AI Summary (20 seconds)
1. Click "Generate Summary" button
2. Show AI-generated meeting summary
3. Display action items and key points
4. Highlight sponsor technology integration

**Key Talking Points:**
- "Real-time accessibility for everyone"
- "AI-powered gesture recognition"
- "Seamless deaf-hearing communication"
- "Built with Cal Hacks sponsor technologies"

## 🏗️ Architecture

```
SignTogether/
├── app/                    # Next.js 14 app directory
│   ├── api/               # API routes
│   ├── meeting/           # Meeting interface
│   └── page.tsx           # Homepage
├── components/            # React components
│   ├── CaptionsPanel.tsx  # Live captions
│   ├── GestureDetector.tsx# Gesture recognition
│   └── MeetingSummary.tsx # AI summaries
├── lib/                   # Utilities
│   └── db.ts             # Prisma client
├── prisma/               # Database schema
├── docs/                 # API documentation
└── seed/                 # Demo data
```

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/livekit/token` | POST | Generate LiveKit access token |
| `/api/meetings` | GET/POST | Create and retrieve meetings |
| `/api/captions` | GET/POST | Process audio and get transcripts |
| `/api/gestures` | GET/POST | Detect gestures in video frames |
| `/api/summary` | GET/POST | Generate AI meeting summaries |

Full API documentation available at `/docs`

## 🤝 Technologies Used

- **[LiveKit](https://livekit.io/)** - Real-time video infrastructure
- **[Deepgram](https://deepgram.com/)** - Advanced speech recognition (Nova-2 model)
- **[Google Gemini](https://ai.google.dev/)** - Computer vision for gesture detection
- **[Anthropic Claude](https://www.anthropic.com/)** - Natural language processing for summaries
- **[Next.js 14](https://nextjs.org/)** - React framework with App Router
- **[Prisma](https://www.prisma.io/)** - Database ORM
- **[TailwindCSS](https://tailwindcss.com/)** - Styling

## 🧪 Testing

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database operations
npm run db:push    # Apply schema changes
npm run db:studio  # Open Prisma Studio
```

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Manual Deployment

```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Cal Hacks 12.0 organizers and sponsors
- The deaf and hard-of-hearing community for inspiration
- Open source contributors and maintainers

## 📞 Support

- 📧 Email: [support@signtogether.com](mailto:support@signtogether.com)
- 💬 Discord: [Join our community](https://discord.gg/signtogether)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/signtogether/issues)
- 📚 Docs: [docs.signtogether.com](https://docs.signtogether.com)

---

**Built with ❤️ for accessibility and inclusion**
