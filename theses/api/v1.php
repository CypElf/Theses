<?php
if (isset($_GET["q"])) {
    $query = $_GET["q"];

    require_once("../lib/db_manager.php");
    $manager = new db_manager();

    header("Content-Type: application/json");
    echo json_encode($manager->search($query));
}
else {
    http_response_code(400);
}

?>