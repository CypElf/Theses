<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rechercher</title>
    <link rel="stylesheet" href="styles/search.css">
</head>
<body>
    <?php
        ini_set('display_errors', 1);
        ini_set('display_startup_errors', 1);
        error_reporting(E_ALL);

        require("lib/db_manager.php");

        if (isset($_GET["q"])) {
            $query = $_GET["q"];

            $theses = json_decode(file_get_contents("http://localhost/api/v1.php?q=" . $query));

            if (count($theses) == 0) {
                echo "<p class=\"noRes\">Aucun résultat</p>";
            }
            else {
                echo "<ol>";

                foreach ($theses as $these) {
                    $directors = implode(" et ", $these->directors);
                    $status = $these->finished ? "soutenu" : "en cours";
                    ?>
                        <li class="these">
                        <span class="colored theseTitle"><?php echo $these->title; ?></span><br>

                        par <span class="colored"><?php echo $these->author; ?></span> sous la direction de <span class="colored"><?php echo $directors; ?></span> - <span class="colored"><?php echo $these->presentation_institution; ?></span><br>
                        
                        <span class="status">Status: <?php echo $status; ?></span>

                        <?php
                            if ($these->is_online) {
                        ?>
                                <a href="https://theses.fr/<?php echo $these->id; ?>/document" class="access button is-secondary">Y accéder en ligne</a>
                        <?php
                            }
                        ?>
                    </li>

                    <?php
                }

                echo "</ol>";
            }
        }
        else {
            ?>

            <form class="searchForm" action="" method="GET">
                <label for="q">Que voulez vous rechercher ?</label><br>
                <input class="input" type="text" id="q" name="q"><br>
                <button class="button is-light confirm">Rechercher</button>
            </form>

            <?php
        }
    ?>
</body>
</html>