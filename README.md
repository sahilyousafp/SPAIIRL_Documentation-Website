# SPAIIRL Documentation Website

This is a modern, responsive website for SPAIIRL (Strategic Planning and AI Research Lab) founders to collaborate and share resources. The website provides access to essential collaboration tools and serves as a central hub for team coordination.

## 🚀 Features

- **Modern Design**: Dark theme with violet-900 accent colors and smooth animations
- **Collaboration Tools**: Direct access to Google Sheets, Docs, Slides, and Miro boards
- **User Authentication**: Sign-in functionality with username/password and Google OAuth
- **Interactive Calendar**: View and schedule meetings with Google Calendar integration
- **Resource Center**: Access to shared documents, analytics, and learning materials
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **GitHub Pages Ready**: Configured for easy deployment

## 🛠️ Setup Instructions

### 1. Enable GitHub Pages
1. Go to your repository settings
2. Scroll to "Pages" section
3. Select "Deploy from a branch"
4. Choose "main" branch and "/ (root)" folder
5. Click "Save"

### 2. Configure Google Integration (Optional)
To enable full Google services integration:

1. **Google Cloud Console Setup**:
   - Create a project at [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Google Sheets, Docs, Slides, and Calendar APIs
   - Create OAuth 2.0 credentials
   - Add your GitHub Pages domain to authorized origins

2. **Update Authentication**:
   - Replace placeholder authentication in `script.js`
   - Add your Google Client ID to the Google sign-in button

### 3. Customize Content
- **Update Company Information**: Modify contact details in `index.html`
- **Add Real Calendar Events**: Replace sample events in `script.js`
- **Configure Tool Links**: Update collaboration tool URLs as needed
- **Brand Customization**: Adjust colors and styling in `styles.css`

## 📁 File Structure

```
├── index.html          # Main HTML file
├── styles.css          # CSS styling with violet-900 theme
├── script.js           # JavaScript functionality
├── _config.yml         # Jekyll configuration for GitHub Pages
└── README.md           # This file
```

## 🎨 Design Features

- **Color Scheme**: Black background with violet-900 (#7c3aed) accents
- **Typography**: Inter font family for modern readability
- **Animations**: Smooth hover effects and floating card animations
- **Icons**: Font Awesome icons for visual consistency
- **Layout**: CSS Grid and Flexbox for responsive design

## 🔧 Collaboration Tools Integration

### Google Workspace
- **Sheets**: Financial planning, data analysis, project tracking
- **Docs**: Meeting notes, research documents, proposals
- **Slides**: Presentations, pitch decks, strategy documents

### Miro Board
- **Visual Collaboration**: Brainstorming, mind mapping, workflow design
- **Strategic Planning**: Business model canvas, roadmaps

### Calendar Integration
- **Meeting Scheduling**: Google Calendar integration
- **Event Management**: Team events, deadlines, milestones

## 📱 Responsive Design

The website is fully responsive and optimized for:
- **Desktop**: Full-featured experience with all animations
- **Tablet**: Adapted layout with touch-friendly interactions
- **Mobile**: Condensed navigation with hamburger menu

## 🔐 Security Features

- **Authentication**: Secure login system (to be integrated with backend)
- **HTTPS**: Enforced secure connections
- **Privacy**: No tracking scripts or cookies without consent

## 🚀 Deployment

The website is configured for automatic deployment via GitHub Pages:

1. Push changes to the main branch
2. GitHub automatically builds and deploys the site
3. Access your site at: `https://[username].github.io/SPAIIRL_Documentation-Website`

## 🤝 Contributing

For SPAIIRL founders to contribute:
1. Clone the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request
5. Review and merge

## 📞 Support

For technical support or questions about the website:
- **Email**: info@spaiirl.com
- **Issues**: Create a GitHub issue in this repository

## 📄 License

This website is proprietary to SPAIIRL (Strategic Planning and AI Research Lab). All rights reserved.

---

**Last Updated**: August 2025
**Version**: 1.0.0
**Maintained by**: SPAIIRL Development Team
