import * as XLSX from 'xlsx';
import type { Player, PlayerRole, ExcelPlayerData } from '../types';

export const readExcelFile = (file: File): Promise<ExcelPlayerData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelPlayerData[];
        
        resolve(jsonData);
      } catch (error) {
        reject(new Error('Failed to read Excel file: ' + error));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

export const validatePlayerData = (data: ExcelPlayerData[], minimumBid: number = 100): {
  isValid: boolean;
  errors: string[];
  validPlayers: Player[];
} => {
  const errors: string[] = [];
  const validPlayers: Player[] = [];
  const playerNames = new Set<string>();
  
  // Check if data is empty
  if (!data || data.length === 0) {
    errors.push('Excel file is empty or has no data');
    return { isValid: false, errors, validPlayers };
  }
  
  // Check required columns
  const firstRow = data[0];
  const requiredColumns = ['Player Name'];
  const missingColumns = requiredColumns.filter(col => !(col in firstRow));

  if (missingColumns.length > 0) {
    errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
    return { isValid: false, errors, validPlayers };
  }
  
  // Validate each player
  data.forEach((row, index) => {
    const rowNumber = index + 2; // Excel row number (1-indexed + header)
    
    // Check player name
    if (!row['Player Name'] || typeof row['Player Name'] !== 'string' || row['Player Name'].trim() === '') {
      errors.push(`Row ${rowNumber}: Player name is required`);
      return;
    }
    
    const playerName = row['Player Name'].trim();
    
    // Check for duplicates
    if (playerNames.has(playerName.toLowerCase())) {
      errors.push(`Row ${rowNumber}: Duplicate player name "${playerName}"`);
      return;
    }
    playerNames.add(playerName.toLowerCase());
    
    // Check role (optional)
    const validRoles: PlayerRole[] = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'];
    let role: PlayerRole = 'Batsman'; // Default role

    if (row['Role'] !== undefined && row['Role'] !== null) {
      const roleValue = row['Role']?.toString().trim();
      if (roleValue && !validRoles.includes(roleValue as PlayerRole)) {
        errors.push(`Row ${rowNumber}: Invalid role "${roleValue}". Must be one of: ${validRoles.join(', ')}`);
        return;
      }
      if (roleValue) {
        role = roleValue as PlayerRole;
      }
    }
    
    // Check base price (optional)
    let basePrice = minimumBid; // Use tournament's minimum bid as default
    const basePriceValue = row['Base Price'];
    if (basePriceValue !== undefined && basePriceValue !== null && String(basePriceValue).trim() !== '') {
      const price = Number(basePriceValue);
      if (isNaN(price) || price < 0) {
        errors.push(`Row ${rowNumber}: Invalid base price "${basePriceValue}". Must be a positive number`);
        return;
      }
      basePrice = price;
    }
    
    // Check rating (optional)
    let rating: number | undefined;
    if (row['Rating'] !== undefined && row['Rating'] !== null) {
      const ratingValue = Number(row['Rating']);
      if (isNaN(ratingValue) || ratingValue < 0 || ratingValue > 100) {
        errors.push(`Row ${rowNumber}: Invalid rating "${row['Rating']}". Must be a number between 0 and 100`);
        return;
      }
      rating = ratingValue;
    }
    
    // Create valid player
    const player: Player = {
      id: `player-${Date.now()}-${index}`,
      name: playerName,
      basePrice,
      role,
      rating,
    };
    
    validPlayers.push(player);
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    validPlayers,
  };
};

export const generateSampleExcelFile = (minimumBid: number = 100): void => {
  const sampleData = [
    // Star Players with all fields
    {
      'Player Name': 'Virat Kohli',
      'Base Price': 200,
      'Role': 'Batsman',
      'Rating': 95,
    },
    {
      'Player Name': 'Jasprit Bumrah',
      'Base Price': 150,
      'Role': 'Bowler',
      'Rating': 92,
    },
    {
      'Player Name': 'MS Dhoni',
      'Base Price': 250,
      'Role': 'Wicket-Keeper',
      'Rating': 90,
    },
    {
      'Player Name': 'Hardik Pandya',
      'Base Price': 180,
      'Role': 'All-Rounder',
      'Rating': 88,
    },
    {
      'Player Name': 'Rohit Sharma',
      'Base Price': 220,
      'Role': 'Batsman',
      'Rating': 93,
    },
    {
      'Player Name': 'Rashid Khan',
      'Base Price': 160,
      'Role': 'Bowler',
      'Rating': 89,
    },
    {
      'Player Name': 'KL Rahul',
      'Base Price': 170,
      'Role': 'Wicket-Keeper',
      'Rating': 87,
    },
    {
      'Player Name': 'Ravindra Jadeja',
      'Base Price': 190,
      'Role': 'All-Rounder',
      'Rating': 91,
    },
    {
      'Player Name': 'Shubman Gill',
      'Base Price': 120,
      'Role': 'Batsman',
      'Rating': 85,
    },
    {
      'Player Name': 'Mohammed Shami',
      'Base Price': 140,
      'Role': 'Bowler',
      'Rating': 86,
    },
    {
      'Player Name': 'Rishabh Pant',
      'Base Price': 160,
      'Role': 'Wicket-Keeper',
      'Rating': 84,
    },
    {
      'Player Name': 'Washington Sundar',
      'Base Price': 80,
      'Role': 'All-Rounder',
      'Rating': 78,
    },
    {
      'Player Name': 'Prithvi Shaw',
      'Base Price': 100,
      'Role': 'Batsman',
      'Rating': 80,
    },
    {
      'Player Name': 'Yuzvendra Chahal',
      'Base Price': 110,
      'Role': 'Bowler',
      'Rating': 82,
    },
    {
      'Player Name': 'Ishan Kishan',
      'Base Price': 130,
      'Role': 'Wicket-Keeper',
      'Rating': 81,
    },
    {
      'Player Name': 'Krunal Pandya',
      'Base Price': 90,
      'Role': 'All-Rounder',
      'Rating': 76,
    },
    {
      'Player Name': 'Shreyas Iyer',
      'Base Price': 150,
      'Role': 'Batsman',
      'Rating': 83,
    },
    {
      'Player Name': 'Trent Boult',
      'Base Price': 120,
      'Role': 'Bowler',
      'Rating': 88,
    },
    {
      'Player Name': 'Sanju Samson',
      'Base Price': 110,
      'Role': 'Wicket-Keeper',
      'Rating': 79,
    },
    {
      'Player Name': 'Axar Patel',
      'Base Price': 100,
      'Role': 'All-Rounder',
      'Rating': 77,
    },
    {
      'Player Name': 'Suryakumar Yadav',
      'Base Price': 140,
      'Role': 'Batsman',
      'Rating': 86,
    },
    {
      'Player Name': 'Kagiso Rabada',
      'Base Price': 130,
      'Role': 'Bowler',
      'Rating': 90,
    },
    {
      'Player Name': 'Jos Buttler',
      'Base Price': 180,
      'Role': 'Wicket-Keeper',
      'Rating': 89,
    },
    {
      'Player Name': 'Marcus Stoinis',
      'Base Price': 80,
      'Role': 'All-Rounder',
      'Rating': 74,
    },
    {
      'Player Name': 'Shikhar Dhawan',
      'Base Price': 120,
      'Role': 'Batsman',
      'Rating': 81,
    },
    {
      'Player Name': 'Bhuvneshwar Kumar',
      'Base Price': 90,
      'Role': 'Bowler',
      'Rating': 83,
    },
    {
      'Player Name': 'Dinesh Karthik',
      'Base Price': 70,
      'Role': 'Wicket-Keeper',
      'Rating': 75,
    },
    {
      'Player Name': 'Glenn Maxwell',
      'Base Price': 160,
      'Role': 'All-Rounder',
      'Rating': 85,
    },
    // Examples with optional fields missing
    {
      'Player Name': 'Young Talent 1',
      'Role': 'Batsman',
      // No base price or rating - will use defaults
    },
    {
      'Player Name': 'Mystery Player',
      'Base Price': 50,
      // No role or rating - will use defaults
    },
    {
      'Player Name': 'Local Hero',
      'Rating': 70,
      // No base price or role - will use defaults
    },
    {
      'Player Name': 'Emerging Star',
      // Only name provided - all other fields will use defaults
    },
  ];
  
  // Create the main players sheet
  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Players');

  // Create instructions sheet
  const instructions = [
    {
      'Field': 'Player Name',
      'Required': 'Yes',
      'Description': 'Name of the player (must be unique)',
      'Example': 'Virat Kohli',
    },
    {
      'Field': 'Base Price',
      'Required': 'No',
      'Description': `Starting auction price in currency units (default: ${minimumBid})`,
      'Example': '200',
    },
    {
      'Field': 'Role',
      'Required': 'No',
      'Description': 'Player position (default: Batsman)',
      'Example': 'Batsman, Bowler, All-Rounder, Wicket-Keeper',
    },
    {
      'Field': 'Rating',
      'Required': 'No',
      'Description': 'Player skill rating from 0-100 (optional)',
      'Example': '95',
    },
    {},
    {
      'Field': 'NOTES:',
      'Required': '',
      'Description': '',
      'Example': '',
    },
    {
      'Field': '• Only Player Name is required',
      'Required': '',
      'Description': '',
      'Example': '',
    },
    {
      'Field': '• Base Price, Role, and Rating are optional',
      'Required': '',
      'Description': '',
      'Example': '',
    },
    {
      'Field': `• Default base price is ${minimumBid} currency units`,
      'Required': '',
      'Description': '',
      'Example': '',
    },
    {
      'Field': '• Default role is Batsman',
      'Required': '',
      'Description': '',
      'Example': '',
    },
    {
      'Field': '• See Players sheet for examples',
      'Required': '',
      'Description': '',
      'Example': '',
    },
  ];

  const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

  // Download the file
  XLSX.writeFile(workbook, 'sample_players.xlsx');
};

export const formatCurrency = (amount: number): string => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)} Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)} L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  } else {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
};

export const exportAuctionResults = (tournament: any): void => {
  const teamResults = tournament.teams.map((team: any) => ({
    'Team Name': team.name,
    'Budget': formatCurrency(team.budget),
    'Remaining Budget': formatCurrency(team.remainingBudget),
    'Players Count': team.players.length,
    'Total Spent': formatCurrency(team.budget - team.remainingBudget),
  }));
  
  const playerResults = tournament.players.map((player: any) => ({
    'Player Name': player.name,
    'Role': player.role,
    'Base Price': formatCurrency(player.basePrice),
    'Sold Price': player.soldPrice ? formatCurrency(player.soldPrice) : 'Unsold',
    'Team': player.teamId ? tournament.teams.find((t: any) => t.id === player.teamId)?.name : 'Unsold',
    'Rating': player.rating || 'N/A',
  }));
  
  // Create workbook with multiple sheets
  const workbook = XLSX.utils.book_new();
  
  const teamSheet = XLSX.utils.json_to_sheet(teamResults);
  XLSX.utils.book_append_sheet(workbook, teamSheet, 'Team Summary');
  
  const playerSheet = XLSX.utils.json_to_sheet(playerResults);
  XLSX.utils.book_append_sheet(workbook, playerSheet, 'Player Results');
  
  // Create detailed team sheets
  tournament.teams.forEach((team: any) => {
    const teamPlayers = team.players.map((player: any) => ({
      'Player Name': player.name,
      'Role': player.role,
      'Base Price': formatCurrency(player.basePrice),
      'Sold Price': formatCurrency(player.soldPrice || 0),
      'Rating': player.rating || 'N/A',
    }));
    
    if (teamPlayers.length > 0) {
      const teamPlayerSheet = XLSX.utils.json_to_sheet(teamPlayers);
      XLSX.utils.book_append_sheet(workbook, teamPlayerSheet, team.name.substring(0, 31)); // Excel sheet name limit
    }
  });
  
  // Download the file
  const fileName = `${tournament.name.replace(/[^a-zA-Z0-9]/g, '_')}_auction_results.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
