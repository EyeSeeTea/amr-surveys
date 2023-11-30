import fs from 'fs';
import parse from 'csv-parse/lib/sync';

// Define the path to the CSV file
const csvFilePath = 'path_to_your_csv_file.csv';

// Read the CSV file content
const csvContent = fs.readFileSync(csvFilePath);

// Parse the CSV content
const records = parse(csvContent, {
  skip_empty_lines: true,
});

// Extract the pathogen list headers (skip the first header row)
const [, ...pathogenHeaders] = records[1]; // This contains the actual pathogen list names

// Initialize the dictionary with pathogen list names as keys
const pathogenAntibiotics: { [key: string]: string[] } = {};
pathogenHeaders.forEach(header => {
  pathogenAntibiotics[header] = [];
});

// Read the remaining rows in the CSV file
records.slice(2).forEach((row: string[]) => {
  // The first column in each row is the antibiotic name
  const antibioticName = row[0];

  // Loop through each cell in the row after the antibiotic name
  row.slice(1).forEach((cell, index) => {
    // Check if the cell has an 'x', indicating an association
    if (cell.toLowerCase() === 'x') {
      // Add the antibiotic to the appropriate pathogen list in the dictionary
      const pathogenList = pathogenHeaders[index];
      pathogenAntibiotics[pathogenList].push(antibioticName);
    }
  });
});

// Convert the dictionary to a JSON object
const jsonObject = JSON.stringify(pathogenAntibiotics, null, 4);

// Output the JSON object
console.log(jsonObject);
