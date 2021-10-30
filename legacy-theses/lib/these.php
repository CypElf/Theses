<?php

class these {
    public string $author;
    public ?string $author_id;
    public string $title;
    public array $directors;
    public array $directors_id;
    public string $presentation_institution;
    public string $institution_id;
    public string $domain;
    public bool $finished;
    public ?string $inscription_date;
    public ?string $presentation_date;
    public string $language;
    public string $id;
    public bool $is_online;
    public string $publication_date;
    public string $update_date;

    public function __construct($author, $author_id, $title, $directors, $directors_id, $presentation_institution, $institution_id, $domain, $finished, $inscription_date, $presentation_date, $language, $id, $is_online, $publication_date, $update_date) {
        $this->author = $author;
        $this->author_id = $author_id;
        $this->title = $title;
        $this->directors = $directors;
        $this->directors_id = $directors_id;
        $this->presentation_institution = $presentation_institution;
        $this->institution_id = $institution_id;
        $this->domain = $domain;
        $this->finished = $finished;
        $this->inscription_date = $inscription_date;
        $this->presentation_date = $presentation_date;
        $this->language = $language;
        $this->id = $id;
        $this->is_online = $is_online;
        $this->publication_date = $publication_date;
        $this->update_date = $update_date;
    }
}

?>