# 🏏 IPL-Style Player Auction App

A comprehensive React-based application for conducting IPL-style cricket player auctions with real-time bidding, team management, live sharing, and detailed analytics.

## ✨ Features

### 🔧 Core Functionality
- **Tournament Configuration**: Set up tournaments with custom team count, player limits, and budgets
- **Excel Player Import**: Upload player data via Excel files with validation and player images
- **Team Management**: Customize team names, colors, and view budget allocations
- **Real-time Auction**: Interactive bidding system with timer, quick bids, and live updates
- **Live Auction Sharing**: Share auctions in real-time with multiple viewers via unique links
- **Comprehensive Dashboard**: Detailed results, statistics, and team compositions
- **Export Results**: Download auction results in Excel format
- **Price Visibility Control**: Configure default price visibility for shared auction links
- **Enhanced Player Display**: Visual player cards with images in all sections

### 🎯 Key Capabilities
- ✅ Tournament setup with configurable parameters and quick budget options
- ✅ Excel file upload with data validation and player image support
- ✅ Real-time auction room with enhanced bidding controls and quick bid options
- ✅ Live auction sharing with Firebase real-time synchronization
- ✅ Team budget and player limit constraints with intelligent validation
- ✅ Automatic sold/unsold player management with randomization
- ✅ Manual auction ending with confirmation dialogs
- ✅ Player image display with caching and placeholder support
- ✅ Configurable bid increments and minimum bid amounts
- ✅ Currency formatting with shortened display (e.g., "31cr")
- ✅ Configurable price visibility for shared auction links
- ✅ Enhanced remaining players display with images and smart sorting
- ✅ Comprehensive statistics and analytics
- ✅ Export functionality for results
- ✅ Responsive design for all devices

### 🔥 Advanced Features
- **Live Sharing**: Real-time auction viewing with Firebase integration and configurable price visibility
- **Player Images**: Visual player cards with image caching throughout the application
- **Smart Bidding**: Quick bid buttons and intelligent bid validation
- **Enhanced UX**: Compact team cards, better layouts, and improved navigation
- **Auction Control**: Manual end auction, undo functionality, and better flow
- **Privacy Options**: Manager-controlled price visibility for shared auction links
- **Visual Player Tracking**: Player images in remaining players section with smart sorting

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd player-auction-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 🌐 Deployment

### GitHub Pages Deployment

This app is configured for automatic deployment to GitHub Pages.

#### Automatic Deployment
1. **Push to main branch**: The app automatically deploys when you push to the main branch
2. **GitHub Actions**: Uses automated workflow for building and deployment
3. **Live URL**: Access your app at `https://yourusername.github.io/player-auction-app/`

#### Manual Deployment
```bash
# Build and deploy manually
npm run deploy
```

#### Setup GitHub Pages
1. Go to your repository settings
2. Navigate to "Pages" section
3. Select "GitHub Actions" as the source
4. The workflow will automatically deploy on the next push

#### Configuration
- **Base URL**: Configured for GitHub Pages subdirectory
- **Build Output**: Optimized production build in `dist/` folder
- **404 Handling**: Custom 404.html for SPA routing support

## 📋 How to Use

### Step 1: Tournament Setup
1. Enter tournament name (e.g., "IPL Auction 2025")
2. Select number of teams (2-16)
3. Set players per team (5-25)
4. Configure team budget (recommended: ₹100 Crores)
5. Set minimum bid and bid increment amounts
6. Configure auction timer settings (optional)
7. Choose price visibility for shared auction links

### Step 2: Player Inventory
1. Download the sample Excel file to see the required format
2. Prepare your Excel file with columns:
   - **Player Name** (Required)
   - **Role** (Required): Batsman, Bowler, All-Rounder, Wicket-Keeper
   - **Base Price** (Optional): Starting price in rupees
   - **Rating** (Optional): Player rating 0-100
   - **Image URL** (Optional): URL to player's image
3. Upload your Excel file
4. Review validation results and confirm
5. Player images will be automatically loaded and cached

### Step 3: Team Setup
1. Customize team names or use default IPL team names
2. Review tournament summary
3. Check player distribution by role
4. Start the auction

### Step 4: Auction Room
1. **Current Player Display**: See player details, role, base price, and player image
2. **Enhanced Bidding**:
   - Select team and enter custom bid amount
   - Use quick bid buttons for faster bidding
   - One-click BID button for minimum bid
3. **Real-time Updates**: View highest bid and bidding team with live notifications
4. **Timer**: Configurable countdown for each player (optional)
5. **Quick Actions**:
   - Mark players as sold or unsold
   - Undo last bid if needed
   - Manual end auction with confirmation
6. **Team Status**: Monitor budgets, player counts, and eligibility
7. **Live Sharing**: Generate shareable links for real-time viewing with configurable price visibility
8. **Remaining Players**: Visual display with player images, smart sorting, and complete visibility

### Step 5: Results Dashboard
1. **Team Squads**: View complete team compositions with player images
2. **Player Results**: See all sold/unsold players with prices and images
3. **Statistics**: Analyze auction trends, role-wise data, and highlights
4. **Privacy Controls**: Toggle price visibility for presentations
5. **Export**: Download detailed results in Excel format
6. **Visual Enhancements**: Player images, better formatting, and compact layouts

### Step 6: Live Auction Sharing
1. **Generate Link**: Create a unique shareable link for your auction
2. **Real-time Viewing**: Multiple viewers can watch the auction live
3. **Live Updates**: Automatic synchronization of bids, player changes, and results
4. **Viewer Management**: See how many people are watching
5. **Connection Status**: Monitor Firebase connection and viewer status
6. **Completion Indicator**: Clear display when auction is finished
7. **Price Visibility**: Controlled by tournament setup - viewers see consistent experience
8. **Enhanced Display**: Player images in remaining players section with smart organization

## 📊 Excel File Format

Your Excel file must contain these columns:

| Column Name | Required | Description | Example |
|-------------|----------|-------------|---------|
| Player Name | ✅ Yes | Full player name | "Virat Kohli" |
| Role | ✅ Yes | Player position | "Batsman" |
| Base Price | ❌ No | Starting price in rupees | 20000000 |
| Rating | ❌ No | Player rating (0-100) | 95 |
| Image URL | ❌ No | URL to player's image | "https://example.com/virat.jpg" |

### Valid Roles
- Batsman
- Bowler
- All-Rounder
- Wicket-Keeper

### Image Guidelines
- **Supported Formats**: JPG, PNG, WebP, GIF
- **Recommended Size**: 200x200px or larger
- **Fallback**: Placeholder image shown if URL is invalid or missing
- **Caching**: Images are cached for better performance

## 🎮 Auction Rules

1. **Bidding**:
   - Configurable bid increments (default: minimum bid amount)
   - Quick bid options for faster bidding
   - One-click BID button for minimum bid
   - Custom bid amounts supported
2. **Timer**: Optional countdown per player (configurable, can be disabled)
3. **Budget Constraints**:
   - Teams cannot exceed their remaining budget
   - Intelligent validation prevents invalid bids
   - Support for minimum bid amounts as low as ₹1
4. **Player Limits**: Teams cannot exceed maximum player count
5. **Squad Management**:
   - Teams marked as "Squad Full" when at capacity
   - "Insufficient Budget" shown when teams can't afford minimum bid
6. **Passing**: Teams can pass if they don't want to bid
7. **Unsold Players**: Randomized when they return to auction pool
8. **Manual Controls**:
   - Undo last bid functionality
   - Manual end auction with confirmation
   - Force auction completion when all teams are full

## 🛠️ Technical Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Real-time Database**: Firebase Firestore
- **Form Handling**: React Hook Form
- **File Processing**: xlsx library
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Validation**: Zod
- **Image Handling**: Built-in caching and placeholder system
- **Routing**: React Router DOM

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── TournamentSetup.tsx
│   ├── PlayerInventory.tsx
│   ├── TeamSetup.tsx
│   ├── AuctionRoom.tsx
│   ├── Dashboard.tsx
│   ├── LiveAuctionViewer.tsx    # Real-time auction viewer
│   ├── TeamCard.tsx             # Enhanced team display
│   ├── PlayerImage.tsx          # Player image component
│   ├── ToastContainer.tsx       # Notification system
│   └── CustomModal.tsx          # Modal dialogs
├── services/           # External services
│   └── auctionSharingService.ts # Firebase integration
├── store/              # State management
│   └── auctionStore.ts
├── hooks/              # Custom React hooks
│   └── useToast.ts
├── types/              # TypeScript definitions
│   └── index.ts
├── utils/              # Utility functions
│   └── excelUtils.ts
├── App.tsx             # Main application
└── main.tsx           # Entry point
```

## 🔧 Configuration

### Auction Settings
- **Bid Increment**: Configurable (default: minimum bid amount)
- **Auction Timer**: Optional, configurable countdown per player
- **Default Budget**: ₹100 Crores per team (with quick budget options)
- **Minimum Bid**: Configurable, supports amounts as low as ₹1
- **Quick Budget Options**: 1000, 5000, 10000, 50000, 100000, 1000000
- **Price Visibility**: Configure default visibility for shared auction links

### Constraints
- Minimum 2 teams, maximum 16 teams
- Minimum 5 players per team, maximum 25 (no upper limit restriction)
- Budget validation for all bids with intelligent checking
- Player limit enforcement with "Squad Full" indicators
- Automatic minimum bid scaling based on budget selection

### Firebase Configuration (for Live Sharing)
- **Firestore Database**: Real-time auction data synchronization
- **Connection Monitoring**: Automatic reconnection handling
- **Viewer Management**: Track multiple simultaneous viewers
- **Data Security**: Auction-specific access controls

## 📈 Features in Detail

### Real-time Auction
- Live bidding with instant updates and notifications
- Optional visual timer with countdown
- Enhanced team eligibility checking with clear status indicators
- Automatic bid validation with intelligent constraints
- Quick bid buttons and one-click bidding
- Undo functionality for bid corrections
- Manual auction ending with confirmation dialogs

### Live Auction Sharing
- Firebase-powered real-time synchronization
- Unique shareable links for each auction
- Multiple simultaneous viewers support
- Live connection status monitoring
- Automatic viewer count tracking
- Real-time bid updates and player transitions
- Auction completion notifications
- Manager-controlled price visibility settings
- Enhanced player display with images and smart sorting

### Data Management
- Excel file parsing and validation with enhanced error handling
- Player image URL support with automatic caching
- Duplicate player detection and role validation
- Role-based categorization with visual icons
- Advanced price formatting with shortened display (e.g., "31cr")
- Unsold player randomization for fair re-auctioning

### Enhanced User Experience
- Player images throughout the application including remaining players section
- Compact and clean team card designs with reduced clutter
- Responsive layouts optimized for all devices
- Toast notifications for important events (respecting price visibility settings)
- Custom modal dialogs for better UX
- Manager-controlled price visibility for shared auction links
- Improved navigation and visual feedback
- Smart player organization with unsold players clearly marked
- Complete remaining players visibility without truncation

### Analytics
- Team-wise spending analysis with visual indicators
- Role-wise player distribution and statistics
- Most expensive player tracking with highlights
- Average price calculations and comparisons
- Comprehensive auction statistics dashboard

### Export Capabilities
- Team composition sheets with player images
- Player results summary with detailed pricing
- Comprehensive statistics and analytics
- Multi-sheet Excel export with enhanced formatting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Live Auction Sharing Setup

### Firebase Configuration
To enable live auction sharing, you'll need to set up Firebase:

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Firestore Database

2. **Configure Environment Variables**:
   Create a `.env` file in your project root:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

3. **Firestore Security Rules**:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /auctions/{auctionId} {
         allow read, write: if true; // Configure based on your security needs
       }
       match /viewers/{viewerId} {
         allow read, write: if true;
       }
     }
   }
   ```

### Using Live Sharing
1. **Start Auction**: Begin your auction normally
2. **Generate Link**: Click "Share Live Auction" to create a unique link
3. **Share**: Send the link to viewers who want to watch in real-time
4. **Monitor**: See viewer count and connection status in real-time

## 🎨 Customization Options

### Team Colors and Branding
- Customize team colors in the team setup phase
- Upload team logos (future enhancement)
- Modify color schemes in the Tailwind configuration

### Auction Behavior
- Configure bid increments in tournament setup
- Adjust timer settings (or disable completely)
- Set custom minimum bid amounts
- Choose quick budget options

### Display Preferences
- Configure default price visibility for shared auction links
- Customize currency formatting with shortened display options
- Adjust player image sizes and layouts
- Configure notification preferences
- Control remaining players display with complete visibility
- Smart player organization with visual status indicators

## 🆘 Support

For issues or questions, contact: **[manish.rokks@gmail.com](mailto:manish.rokks@gmail.com)**
1. **Common Issues**:
   - Check the browser console for error messages
   - Ensure Excel file format matches the required structure
   - Verify all required fields are filled correctly
   - Check browser compatibility (modern browsers recommended)

2. **Live Sharing Issues**:
   - Verify Firebase configuration is correct
   - Check internet connection for real-time features
   - Ensure Firestore security rules allow access
   - Monitor Firebase console for connection issues

3. **Performance Tips**:
   - Use optimized player images (recommended: 200x200px)
   - Limit concurrent viewers for better performance
   - Clear browser cache if experiencing issues
   - Use modern browsers for best experience

## 🔄 Recent Updates

### Version 2.1 Features
- ✅ Configurable price visibility for shared auction links
- ✅ Enhanced remaining players display with player images
- ✅ Smart player organization (upcoming first, unsold last)
- ✅ Randomized remaining players order for strategic uncertainty
- ✅ Complete remaining players visibility (no truncation)
- ✅ Removed player index numbers from UI for cleaner appearance
- ✅ Toast notifications respect price visibility settings
- ✅ Improved live viewer experience with consistent price control

### Version 2.0 Features
- ✅ Live auction sharing with Firebase
- ✅ Player image support with caching
- ✅ Enhanced bidding with quick options
- ✅ Price visibility toggle
- ✅ Improved team card designs
- ✅ Manual auction ending
- ✅ Better mobile responsiveness
- ✅ Toast notifications
- ✅ Undo bid functionality

---

**Built with ❤️ using React, TypeScript, Tailwind CSS, and Firebase**
