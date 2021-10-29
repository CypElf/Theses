<?php
require_once("lib/db_manager.php");

function import(string $file_name, int $from_line = 0) {
    if (($handle = fopen($file_name, "r")) !== FALSE) {
        if (fgetcsv($handle, 1000, ";") !== FALSE) {
            $db_manager = new db_manager();
            fseek($handle, $from_line);
            while (($data = fgetcsv($handle, 1000, ";")) !== FALSE) {
                if ($data[13] == NULL) {
                    continue;
                }

                // field of index 4 is ignored because it's the same as field of index 3 in reverse order
                $these = new these(
                    $data[0],
                    $data[1],
                    $data[2],
                    explode(",", $data[3]),
                    explode(",", $data[5]),
                    $data[6],
                    $data[7],
                    $data[8],
                    $data[9] == "soutenue",
                    $data[10] == "" ? NULL : $data[10],
                    $data[11] == "" ? NULL : $data[11],
                    $data[12] == "" ? "fr" : $data[12],
                    $data[13],
                    $data[14] != "non",
                    $data[15],
                    $data[16]
                );

                $db_manager->set($these);
            }

            echo "Everything successfully imported";
        }
        fclose($handle);
    }
}

?>