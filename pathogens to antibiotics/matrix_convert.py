import csv
import json

# Define the path to the CSV file
# csv_file_path = 'CLSI_Matrix.csv'
csv_file_path = 'EUCAST_Matrix.csv'

# Initialize an empty dictionary to hold the pathogen lists and their associated antibiotics
pathogen_antibiotics = {}

# Open the CSV file for reading
with open(csv_file_path, mode='r') as csvfile:
    # Create a CSV reader object
    csvreader = csv.reader(csvfile)
    
    # Extract the pathogen list headers (skip the first header row)
    headers = next(csvreader)[1:]  # Skip the first empty header
    pathogen_headers = next(csvreader)[1:]  # This contains the actual pathogen list names
    
    # Initialize the dictionary with pathogen list names as keys
    for header in pathogen_headers:
        pathogen_antibiotics[header] = []
    
    # Read the remaining rows in the CSV file
    for row in csvreader:
        # The first column in each row is the antibiotic name
        antibiotic_name = row[0]
        
        # Loop through each cell in the row after the antibiotic name
        for index, cell in enumerate(row[1:], start=1):  # Offset by 1 to align with the header index
            # Check if the cell has an 'x', indicating an association
            if cell.lower() == 'x':
                # Add the antibiotic to the appropriate pathogen list in the dictionary
                pathogen_list = pathogen_headers[index-1]  # Adjust index to match header list
                pathogen_antibiotics[pathogen_list].append(antibiotic_name)

# Convert the dictionary to a JSON object
json_object = json.dumps(pathogen_antibiotics, indent=4)

# Output the JSON object
print(json_object)
