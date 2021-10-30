<?php

require_once("these.php");

class db_manager {
    private $db;

    public function __construct() {
        try {
            $this->db = new PDO('pgsql:host=localhost;dbname=database', "elf", "P0stGr3mDp.");
        }

        catch (PDOException $e) {
            http_response_code(500);
            die();
        }
    }

    public function search(string $query, bool $caseSensitive = false): array {
        if (!$caseSensitive) {
            $query = strtolower($query);
        }
        $req = $this->db->prepare("SELECT * FROM theses, UNNEST(directors) dirs WHERE LOWER(author) LIKE ? OR LOWER(title) LIKE ? OR LOWER(dirs) LIKE ? OR LOWER(presentation_institution) LIKE ?;");
        $req->execute(["%" . $query . "%", "%" . $query . "%", "%" . $query . "%", "%" . $query . "%"]);
        $result = $req->fetchAll();
        $result = array_map(array($this, "getTheseFromArrayRepr"), $result);
        return $result;
    }

    public function get(string $id): these {
        $req = $this->db->prepare("SELECT * FROM theses WHERE id = ?;");
        $req->execute([$id]);
        $these = $req->fetch();
        if ($these == NULL) {
            return NULL;
        }
        return getTheseFromArrayRepr($these);
    }

    private function getTheseFromArrayRepr(array $array): these {
        $dirs_id = explode(",", substr($array["directors_id"], 1, -1));

        $sanitized = array_filter($dirs_id, function($elem) {
            return $elem != "\"\"";
        });

        $dirs_id = count($sanitized) > 0 ? $sanitized : array();

        return new these(
            $array["author"],
            $array["author_id"],
            $array["title"],
            explode("\",\"", substr($array["directors"], 2, -2)),
            $dirs_id,
            $array["presentation_institution"],
            $array["institution_id"],
            $array["domain"],
            $array["finished"],
            $array["inscription_date"] ?: NULL,
            $array["presentation_date"] ?: NULL,
            $array["language"],
            $array["id"],
            $array["is_online"],
            $array["publication_date"],
            $array["update_date"]
        );
    }

    public function set(these $these): void {
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);

        $req = $this->db->prepare("INSERT INTO theses VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET author = excluded.author, author_id = excluded.author_id, title = excluded.title, directors = excluded.directors, directors_id = excluded.directors_id, presentation_institution = excluded.presentation_institution, institution_id = excluded.institution_id, domain = excluded.domain, finished = excluded.finished, inscription_date = excluded.inscription_date, presentation_date = excluded.presentation_date, language = excluded.language, id = excluded.id, is_online = excluded.is_online, publication_date = excluded.publication_date, update_date = excluded.update_date;");

        $req->execute([
            $these->author,
            $these->author_id,
            $these->title,
            count($these->directors) == 0 ? "{}" : "{\"" . implode("\",\"", $these->directors) . "\"}",
            count($these->directors_id) == 0 ? "{}" : "{\"" . implode("\",\"", $these->directors_id) . "\"}",
            $these->presentation_institution,
            $these->institution_id,
            $these->domain,
            $these->finished == NULL ? "false" : "true",
            $these->inscription_date,
            $these->presentation_date,
            $these->language,
            $these->id,
            $these->is_online == NULL ? "false" : "true",
            $these->publication_date,
            $these->update_date
        ]);
    }
}

?>