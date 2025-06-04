# 🏏 IPL-Style Player Auction App

A comprehensive React-based application for conducting IPL-style cricket player auctions with real-time bidding, team management, and detailed analytics.

## ✨ Features

### 🔧 Functional Requirements
- **Tournament Configuration**: Set up tournaments with custom team count, player limits, and budgets
- **Excel Player Import**: Upload player data via Excel files with validation
- **Team Management**: Customize team names and view budget allocations
- **Real-time Auction**: Interactive bidding system with timer and live updates
- **Comprehensive Dashboard**: Detailed results, statistics, and team compositions
- **Export Results**: Download auction results in Excel format

### 🎯 Key Capabilities
- ✅ Tournament setup with configurable parameters
- ✅ Excel file upload with data validation
- ✅ Real-time auction room with bidding controls
- ✅ Team budget and player limit constraints
- ✅ Automatic sold/unsold player management
- ✅ Comprehensive statistics and analytics
- ✅ Export functionality for results
- ✅ Responsive design for all devices

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

### Step 2: Player Inventory
1. Download the sample Excel file to see the required format
2. Prepare your Excel file with columns:
   - **Player Name** (Required)
   - **Role** (Required): Batsman, Bowler, All-Rounder, Wicket-Keeper
   - **Base Price** (Optional): Starting price in rupees
   - **Rating** (Optional): Player rating 0-100
3. Upload your Excel file
4. Review validation results and confirm

### Step 3: Team Setup
1. Customize team names or use default IPL team names
2. Review tournament summary
3. Check player distribution by role
4. Start the auction

### Step 4: Auction Room
1. **Current Player Display**: See player details, role, and base price
2. **Place Bids**: Select team and enter bid amount
3. **Real-time Updates**: View highest bid and bidding team
4. **Timer**: 30-second countdown for each player
5. **Quick Actions**: Mark players as sold or unsold
6. **Team Status**: Monitor budgets and player counts

### Step 5: Results Dashboard
1. **Team Squads**: View complete team compositions
2. **Player Results**: See all sold/unsold players with prices
3. **Statistics**: Analyze auction trends and highlights
4. **Export**: Download detailed results in Excel format

## 📊 Excel File Format

Your Excel file must contain these columns:

| Column Name | Required | Description | Example |
|-------------|----------|-------------|---------|
| Player Name | ✅ Yes | Full player name | "Virat Kohli" |
| Role | ✅ Yes | Player position | "Batsman" |
| Base Price | ❌ No | Starting price in rupees | 20000000 |
| Rating | ❌ No | Player rating (0-100) | 95 |

### Valid Roles
- Batsman
- Bowler
- All-Rounder
- Wicket-Keeper

## 🎮 Auction Rules

1. **Bidding**: Teams bid in increments of ₹5 Lakh minimum
2. **Timer**: 30 seconds per player (configurable)
3. **Budget Constraints**: Teams cannot exceed their budget
4. **Player Limits**: Teams cannot exceed maximum player count
5. **Passing**: Teams can pass if they don't want to bid
6. **Auto-completion**: Players auto-sold to highest bidder when timer expires

## 🛠️ Technical Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Form Handling**: React Hook Form
- **File Processing**: xlsx library
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Validation**: Zod

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── TournamentSetup.tsx
│   ├── PlayerInventory.tsx
│   ├── TeamSetup.tsx
│   ├── AuctionRoom.tsx
│   └── Dashboard.tsx
├── store/              # State management
│   └── auctionStore.ts
├── types/              # TypeScript definitions
│   └── index.ts
├── utils/              # Utility functions
│   └── excelUtils.ts
├── App.tsx             # Main application
└── main.tsx           # Entry point
```

## 🔧 Configuration

### Auction Settings
- **Bid Increment**: ₹5 Lakh (configurable)
- **Auction Timer**: 30 seconds (configurable)
- **Default Budget**: ₹100 Crores per team

### Constraints
- Minimum 2 teams, maximum 16 teams
- Minimum 5 players per team, maximum 25
- Budget validation for all bids
- Player limit enforcement

## 📈 Features in Detail

### Real-time Auction
- Live bidding with instant updates
- Visual timer with countdown
- Team eligibility checking
- Automatic bid validation

### Data Management
- Excel file parsing and validation
- Duplicate player detection
- Role-based categorization
- Price formatting and calculations

### Analytics
- Team-wise spending analysis
- Role-wise player distribution
- Most expensive player tracking
- Average price calculations

### Export Capabilities
- Team composition sheets
- Player results summary
- Detailed statistics
- Multi-sheet Excel export

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues or questions:
1. Check the console for error messages
2. Ensure Excel file format is correct
3. Verify all required fields are filled
4. Check browser compatibility (modern browsers recommended)

---

**Built with ❤️ using React, TypeScript, and Tailwind CSS**
