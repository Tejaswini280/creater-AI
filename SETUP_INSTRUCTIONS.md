# CreatorNexus AI Platform - Setup Instructions

## Security Notice
This repository has been cleaned of all hardcoded API keys for security. All sensitive data now uses environment variables.

## Quick Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Tejaswini280/creater-AI.git
   cd creater-AI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and add your API keys:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   HUGGINGFACE_API_KEY=your_huggingface_api_key_here
   KLING_ACCESS_KEY=your_kling_access_key_here
   KLING_SECRET_KEY=your_kling_secret_key_here
   ```

4. **Database Setup**
   ```bash
   npm run db:setup
   ```

5. **Start the application**
   ```bash
   npm run dev
   ```

## API Keys Required

- **OpenAI API Key**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)
- **Gemini API Key**: Get from [Google AI Studio](https://aistudio.google.com/app/apikey)
- **Hugging Face API Key**: Get from [Hugging Face](https://huggingface.co/settings/tokens)
- **Kling AI Keys**: Get from [Kling AI Platform](https://klingai.kuaishou.com/)

## Security Best Practices

- Never commit API keys to version control
- Use environment variables for all sensitive data
- Keep your `.env` file in `.gitignore`
- Rotate API keys regularly

## Troubleshooting

If you encounter issues with Git push due to secret detection:
1. Ensure all API keys are in environment variables
2. Check that `.env` is in `.gitignore`
3. Use the bypass URLs provided by GitHub if needed
4. Consider creating a new repository if secrets are in Git history

## Support

For issues or questions, please create an issue in this repository.