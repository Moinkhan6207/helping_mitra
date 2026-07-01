export interface AoCodeDetails {
  areaCode: string;
  aoType: string;
  rangeCode: string;
  aoNumber: string;
  description: string;
  additionalDescription?: string;
}

export const aoCitiesDataset: Record<string, Record<string, AoCodeDetails>> = {
  "Madhya Pradesh": {
    "Bhopal": { areaCode: 'BPL', aoType: 'W', rangeCode: '51', aoNumber: '1', description: 'WARD 1 BHOPAL' },
    "Indore": { areaCode: 'IND', aoType: 'W', rangeCode: '62', aoNumber: '3', description: 'WARD 3 INDORE' },
    "Gwalior": { areaCode: 'GWL', aoType: 'C', rangeCode: '14', aoNumber: '2', description: 'WARD 2 GWALIOR' },
    "Jabalpur": { areaCode: 'JBP', aoType: 'W', rangeCode: '22', aoNumber: '5', description: 'WARD 5 JABALPUR' }
  },
  "Uttar Pradesh": {
    "Lucknow": { areaCode: 'LKN', aoType: 'C', rangeCode: '12', aoNumber: '1', description: 'WARD 1 LUCKNOW' },
    "Kanpur": { areaCode: 'KNP', aoType: 'W', rangeCode: '15', aoNumber: '2', description: 'WARD 2 KANPUR' },
    "Noida": { areaCode: 'NOD', aoType: 'C', rangeCode: '33', aoNumber: '4', description: 'WARD 4 NOIDA' },
    "Varanasi": { areaCode: 'VAR', aoType: 'W', rangeCode: '18', aoNumber: '6', description: 'WARD 6 VARANASI' }
  },
  "West Bengal": {
    "Kolkata": { areaCode: 'CAL', aoType: 'C', rangeCode: '81', aoNumber: '2', description: 'WARD 2 KOLKATA' },
    "Howrah": { areaCode: 'HWR', aoType: 'W', rangeCode: '43', aoNumber: '3', description: 'WARD 3 HOWRAH' },
    "Siliguri": { areaCode: 'SLG', aoType: 'C', rangeCode: '25', aoNumber: '1', description: 'WARD 1 SILIGURI' }
  },
  "Bihar": {
    "Patna": { areaCode: 'PTN', aoType: 'C', rangeCode: '10', aoNumber: '1', description: 'WARD 1 PATNA' },
    "Gaya": { areaCode: 'GAY', aoType: 'W', rangeCode: '11', aoNumber: '2', description: 'WARD 2 GAYA' },
    "Muzaffarpur": { areaCode: 'MZF', aoType: 'C', rangeCode: '13', aoNumber: '3', description: 'WARD 3 MUZAFFARPUR' }
  },
  "Rajasthan": {
    "Jaipur": { areaCode: 'JPR', aoType: 'C', rangeCode: '04', aoNumber: '1', description: 'WARD 1 JAIPUR' },
    "Jodhpur": { areaCode: 'JDH', aoType: 'W', rangeCode: '06', aoNumber: '2', description: 'WARD 2 JODHPUR' },
    "Udaipur": { areaCode: 'UDP', aoType: 'C', rangeCode: '07', aoNumber: '3', description: 'WARD 3 UDAIPUR' }
  },
  "Jharkhand": {
    "Ranchi": { areaCode: 'RNC', aoType: 'C', rangeCode: '08', aoNumber: '1', description: 'WARD 1 RANCHI' },
    "Jamshedpur": { areaCode: 'JMD', aoType: 'W', rangeCode: '09', aoNumber: '2', description: 'WARD 2 JAMSHEDPUR' },
    "Dhanbad": { areaCode: 'DHN', aoType: 'C', rangeCode: '10', aoNumber: '3', description: 'WARD 3 DHANBAD' }
  }
};

export const getAoCitiesForState = (state: string): string[] => {
  if (!state || !aoCitiesDataset[state]) return [];
  return Object.keys(aoCitiesDataset[state]);
};

export const lookupAoCode = (state: string, city: string): AoCodeDetails | null => {
  if (!state || !city || !aoCitiesDataset[state]) return null;
  const cities = aoCitiesDataset[state];
  const matchedKey = Object.keys(cities).find(
    (k) => k.toLowerCase() === city.trim().toLowerCase()
  );
  if (!matchedKey) return null;
  return cities[matchedKey];
};
