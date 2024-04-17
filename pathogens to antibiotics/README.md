# Pathogens to antibiotics functionality

## Contents of the folder

### Source files

```
CLSI_lists.csv
CLSI_matrix.csv
EUCAST_matrix.csv
Eucast_lists.csv
```

There are two sets of files for the two existing protocols. CLSI and EUCAST.
For each set of files we have a *lists* file with all the pathogens relating to each pathogen list and a matrix file realting pathogen lists to antibiotics.

### Files prepared to be used in the app

```
CLSI_Matrix.json
CLSI_lists.json
EUCAST_matrix.json
Eucast_lists.json
```
This files should be ready to be used in the app. They are the equivalent of the above input files but in JOSN format. If they need to be regenerated please read the "Scripts" section.

### Scripts

#### parse.php
A file to convert a csv relating all pathogens to their pathogen list.

##### How to run
```php parse.php csvToJson Eucast_lists.csv ```

This creates Eucast_lists.json

It can also be used to obtain a plain list of pathogens with

```php parse.php csvToPlain Eucast_lists.csv ```

This creates Eucast_lists.txt. This file is only used for management purpouses right now.

#### matrix_convert.py

A file to convert a csv relating pathogen lists to antibiotics.

##### How to run

Edit the line `csv_file_path = 'EUCAST_Matrix.csv'` to point to the appropiate file and run it with

```python matrix.py > EUCAST_matrix.json ```

#### matrix_convert.ts

An AI generated conversion of the last file just in case we need to execute this conversion in the app in the future.








