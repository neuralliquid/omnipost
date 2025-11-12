# Content Creation Platform

A comprehensive content creation and management platform built with React and Next.js. This platform streamlines content workflows from creation to publication across multiple platforms, featuring AI-powered text processing, image generation, and multi-platform publishing capabilities.

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/JustAGhosT/content_creation.git
   cd content_creation
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   
   Create a `.env.local` file in the root directory (see [Environment Variables](#environment-variables) section below).

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📋 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server at http://localhost:3000 |
| `npm run build` | Build the application for production |
| `npm run start` | Start the production server |
| `npm run type-check` | Run TypeScript type checking |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate test coverage report |

## ✨ Key Features

### Content Management
- **Multi-Platform Publishing**: Publish content to Facebook, Instagram, LinkedIn, Twitter, and custom platforms
- **Content Adaptation**: Automatically adapt content for different platforms and audiences
- **Series Management**: Organize and manage content series
- **Content Queue**: Review and approve content before publishing

### AI-Powered Tools
- **Text Summarization**: Generate summaries of raw text using AI
- **Text Parsing**: Parse and analyze text with support for multiple AI providers (DeepSeek, OpenAI, Azure)
- **Image Generation**: Generate images using Hugging Face API
- **Content Review Workflow**: Human-in-the-loop review process for quality assurance

### Platform Capabilities
- **Airtable Integration**: Store and track published content
- **Authentication & Authorization**: Secure JWT-based authentication
- **Audit Trail**: Comprehensive logging of all system actions
- **Feature Flags**: Control feature availability dynamically
- **Notification System**: Multi-channel notifications (Email, Slack, SMS)
- **Feedback Mechanism**: Collect user feedback for continuous improvement
- **Performance Dashboard**: Monitor engagement metrics and analytics

## 📁 Project Structure

```
content_creation/
├── app/api/              # Next.js App Router API endpoints
├── pages/                # Next.js pages and legacy API routes
├── components/           # React components organized by feature
├── lib/                  # Core business logic and utilities
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
├── styles/               # CSS modules and global styles
├── config/               # Configuration files
├── infra/                # Azure infrastructure (Bicep templates)
├── docs/                 # Project documentation
└── __tests__/            # Test files
```

For a detailed breakdown, see [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md).

## 🔧 Environment Variables

Create a `.env.local` file in the root directory with the following variables:

### Required
```bash
# Authentication
JWT_SECRET=your-jwt-secret-key
```

### Optional - Airtable Integration
```bash
AIRTABLE_API_KEY=your-airtable-api-key
AIRTABLE_BASE_ID=your-airtable-base-id
AIRTABLE_TABLE_NAME=your-airtable-table-name
```

### Optional - Image Generation
```bash
HUGGING_FACE_API_KEY=your-hugging-face-api-key
```

### Optional - Email Notifications
```bash
EMAIL_USER=your-email-address
GMAIL_CLIENT_ID=your-gmail-client-id
GMAIL_CLIENT_SECRET=your-gmail-client-secret
GMAIL_REFRESH_TOKEN=your-gmail-refresh-token
```

### Optional - Slack Notifications
```bash
SLACK_TOKEN=your-slack-token
```

### Optional - SMS Notifications
```bash
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
```

### Optional - Platform API Keys
```bash
FACEBOOK_API_URL=your-facebook-api-url
FACEBOOK_API_KEY=your-facebook-api-key
INSTAGRAM_API_URL=your-instagram-api-url
INSTAGRAM_API_KEY=your-instagram-api-key
LINKEDIN_API_URL=your-linkedin-api-url
LINKEDIN_API_KEY=your-linkedin-api-key
TWITTER_API_URL=your-twitter-api-url
TWITTER_API_KEY=your-twitter-api-key
```

## 🚀 Deployment to Azure

This project is configured for deployment to Azure Web Apps using GitHub Actions.

### Prerequisites
- Azure subscription
- Azure CLI installed
- GitHub repository secrets configured

### Deployment Steps

1. **Configure GitHub Secrets:**
   Add the following secrets to your GitHub repository:
   - `AZURE_CLIENT_ID`
   - `AZURE_TENANT_ID`
   - `AZURE_SUBSCRIPTION_ID`
   - All required environment variables listed above

2. **Configure Infrastructure:**
   Edit `infra/parameters.json` with your desired settings:
   ```json
   {
     "appName": "your-app-name",
     "location": "eastus",
     "sku": "B1",
     "linuxFxVersion": "NODE|18-lts"
   }
   ```

3. **Deploy:**
   - Push to `main` branch, or
   - Manually trigger the workflow from GitHub Actions tab

4. **Monitor:**
   Check the GitHub Actions tab for deployment progress

For detailed deployment instructions, see the workflow file at `.github/workflows/azure-webapps-node.yml`.

## 🔌 API Endpoints

The platform provides a comprehensive REST API. Key endpoints include:

### Authentication
- `POST /api/auth` - User login
- `DELETE /api/auth` - User logout
- `GET /api/auth` - Get current user

### Content Management
- `POST /api/content` - Store content in Airtable
- `GET /api/content` - Track and retrieve content
- `POST /api/queue/approve` - Approve content queue

### AI Services
- `POST /api/parse` - Parse and analyze text
- `POST /api/summarize` - Generate text summaries
- `POST /api/images` - Generate images with AI

### Platform Publishing
- `GET /api/platforms` - List available platforms
- `GET /api/platforms/[id]/capabilities` - Get platform capabilities

### Administration
- `GET /api/audit` - Retrieve audit logs
- `GET /api/feature-flags` - Manage feature flags
- `POST /api/feedback` - Submit user feedback
- `POST /api/notifications` - Send notifications

For detailed API documentation, refer to the inline documentation in the route files under `/app/api/`.

## 🧪 Testing

The project uses Jest for testing with React Testing Library for component tests.

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

Tests are organized to mirror the source code structure in the `__tests__/` directory.

## 🏗️ Technology Stack

- **Frontend**: React 18, Next.js 14 (App Router & Pages Router)
- **Language**: TypeScript
- **Styling**: CSS Modules
- **API**: REST API with Next.js Route Handlers
- **Authentication**: JWT tokens
- **Testing**: Jest, React Testing Library
- **Deployment**: Azure Web Apps
- **Infrastructure**: Azure Bicep templates
- **CI/CD**: GitHub Actions

## 📚 Documentation

- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - Detailed project structure
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [docs/api-migration-todo.md](./docs/api-migration-todo.md) - API migration status
- [docs/next-api-best-practices.md](./docs/next-api-best-practices.md) - Next.js API best practices

## 🔍 Troubleshooting

### Common Issues

**Missing environment variables**
- Ensure all required environment variables are set in `.env.local`
- Check that `JWT_SECRET` is configured

**Authentication errors**
- Verify JWT_SECRET matches between client and server
- Check token expiration

**Airtable connection issues**
- Verify `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, and `AIRTABLE_TABLE_NAME` are correct
- Check Airtable API permissions

**Build errors**
- Run `npm install` to ensure all dependencies are installed
- Clear `.next` directory and rebuild: `rm -rf .next && npm run build`

**Test failures**
- Ensure all dependencies are installed
- Check that environment variables are set for tests

For more issues, check the GitHub Issues page or the project documentation.

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'feat: add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **JustAGhosT** - [GitHub](https://github.com/JustAGhosT)

## 🙏 Acknowledgments

- Next.js team for the excellent framework
- Hugging Face for AI capabilities
- All contributors who have helped improve this project