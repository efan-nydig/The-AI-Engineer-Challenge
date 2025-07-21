# AI Chat Frontend

This is a Next.js frontend application for the OpenAI Chat API backend. It provides a modern, responsive chat interface with streaming responses.

## Features

- 💬 **Real-time streaming chat** with OpenAI's API
- 🎨 **Modern, responsive UI** built with Tailwind CSS
- ⚙️ **Configurable settings** (API key, model selection, system messages)
- 🚀 **Built with Next.js 15** and TypeScript
- 📱 **Mobile-friendly** responsive design
- 🎯 **Real-time streaming** responses for better UX

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- The backend API running (see ../api/README.md)
- An OpenAI API key

## Quick Start

1. **Navigate to the frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the development server:**
```bash
npm run dev
```

4. **Open your browser and navigate to `http://localhost:3000`**

5. **Configure the application:**
   - Click the settings icon (⚙️) in the top right
   - Enter your OpenAI API key
   - Choose your preferred model
   - Optionally customize the system message

6. **Start chatting!**

## Configuration

### Environment Variables

Create a `.env.local` file (already included) with:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

For production, update this to your actual API URL.

### Settings Panel

The application includes a built-in settings panel where you can configure:

- **OpenAI API Key**: Your personal API key (required)
- **Model Selection**: Choose from available OpenAI models:
  - GPT-4o Mini (default, faster and cheaper)
  - GPT-4o (most capable)
  - GPT-4 Turbo
  - GPT-3.5 Turbo
- **System Message**: Customize the AI's behavior and personality

## Building for Production

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## Deployment

### Deploy to Vercel (Recommended)

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Deploy:**
```bash
vercel
```

3. **Set environment variables** in the Vercel dashboard:
   - `NEXT_PUBLIC_API_BASE_URL`: Your production API URL

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- Render
- etc.

## Project Structure

```
src/
├── app/
│   ├── globals.css          # Global styles and Tailwind imports
│   ├── layout.tsx           # Root layout component
│   └── page.tsx             # Home page (main chat interface)
├── components/
│   ├── ChatInterface.tsx    # Main chat component with all functionality
│   └── Message.tsx          # Individual message component
├── lib/
│   └── api.ts              # API client functions for backend communication
└── types/
    └── chat.ts             # TypeScript type definitions
```

## API Integration

The frontend communicates with the FastAPI backend via:

- **`POST /api/chat`** - Streaming chat endpoint
- **`GET /api/health`** - Health check endpoint

### Streaming Implementation

The application uses the Fetch API with ReadableStream to handle real-time streaming responses from the backend, providing a ChatGPT-like experience.

## Technologies Used

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety and better development experience
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Lucide React** - Beautiful icon library
- **Streaming API** - Real-time response handling

## Development Scripts

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

## Key Features Explained

### Real-time Streaming
- Messages appear character by character as the AI generates them
- No waiting for complete responses
- Better user experience similar to ChatGPT

### Responsive Design
- Works seamlessly on desktop, tablet, and mobile
- Optimized layouts for different screen sizes
- Touch-friendly interface

### Message History
- Maintains conversation context
- Shows message timestamps
- Distinguishes between user, developer, and assistant messages

### Error Handling
- Graceful error messages for API issues
- Network error recovery
- Input validation

## Troubleshooting

### Common Issues

1. **API Connection Issues**
   - Ensure the backend is running on `http://localhost:8000`
   - Check CORS settings in the backend
   - Verify the API URL in `.env.local`

2. **OpenAI API Key Issues**
   - Ensure you have a valid API key with sufficient credits
   - Check that the key is correctly entered in settings
   - Verify the key has permissions for the selected model

3. **Build/Runtime Errors**
   - Run `npm run build` to check for TypeScript errors
   - Check browser console for client-side errors
   - Ensure all dependencies are installed

4. **Styling Issues**
   - Clear browser cache and hard refresh
   - Check that Tailwind CSS is loading properly
   - Verify no conflicting CSS

### Getting Help

- Check the browser console for errors
- Review the terminal output for build issues
- Ensure backend API is accessible at the configured URL

## Performance Considerations

- The application uses Next.js static generation where possible
- Images are optimized automatically
- Code splitting reduces initial bundle size
- Streaming responses minimize perceived latency

## Security

- API keys are stored locally in the browser (not on servers)
- All API calls use HTTPS in production
- No sensitive data is logged or stored permanently

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License
