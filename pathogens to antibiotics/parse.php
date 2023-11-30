<?php

function csvToJson($filePath) {
    if (($handle = fopen($filePath, "r")) !== FALSE) {
        $json = [];
        $header = null;

        while (($row = fgetcsv($handle, 1000, ",")) !== FALSE) {
            if (count(array_filter($row)) == 0) {
                continue;
            }

            if (!$header) {
                // First row contains headers
                $header = $row;
            } else {
                // Each other row is an element
                // Ensure row data matches headers count
                if (count($row) == count($header)) {
                    foreach ($header as $i => $key) {
                        $element[$key] = (isset($row[$i]) && $row[$i] !== '') ? $row[$i] : null;
                    }

                    // Group elements by their header
                    foreach ($element as $key => $value) {
                        $json[$key][] = $value;
                    }
                }
            }
        }
        fclose($handle);

        // Filter out null values from the array
        foreach ($json as $group => $elements) {
            $json[$group] = array_filter($elements, function($value) {
                return $value !== null;
            });
        }
        
        // Convert the array to JSON
        return json_encode($json, JSON_PRETTY_PRINT);
    } else {
        return false;
    }
}

function csvToPlain($filePath) {
    if (($handle = fopen($filePath, "r")) !== FALSE) {
        $pathogens = [];
        $header = null;

        while (($row = fgetcsv($handle, 1000, ",")) !== FALSE) {
            if (!$header) {
                $header = $row;
            } else {
                foreach ($row as $value) {
                    if (!empty($value)) {
                        $pathogens[] = $value;
                    }
                }
            }
        }
        fclose($handle);

        return implode("\n", $pathogens);
    } else {
        return false;
    }
}

// Check if a file path and operation type is provided
if ($argc > 2) {
    $operation = $argv[1];
    $filePath = $argv[2];

    switch ($operation) {
        case 'csvToJson':
            $outputData = csvToJson($filePath);
            $outputFilePath = pathinfo($filePath)['dirname'] . '/' . pathinfo($filePath)['filename'] . '.json';
            break;

        case 'csvToPlain':
            $outputData = csvToPlain($filePath);
            $outputFilePath = pathinfo($filePath)['dirname'] . '/' . pathinfo($filePath)['filename'] . '.txt';
            break;

        default:
            echo "Invalid operation. Use 'csvToJson' or 'csvToPlain'.\n";
            exit;
    }

    if ($outputData !== false) {
        // Save data to a new file
        if (file_put_contents($outputFilePath, $outputData)) {
            echo "Output saved to " . $outputFilePath . "\n";
        } else {
            echo "Failed to save output to " . $outputFilePath . "\n";
        }
    } else {
        echo "Could not open the file: " . $filePath . "\n";
    }
} else {
    echo "Please provide an operation type and a file path.\n";
    echo "Usage: php script.php [operation] path/to/your/file.csv\n";
    echo "Operations: 'csvToJson', 'csvToPlain'\n";
}
?>