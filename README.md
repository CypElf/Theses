# Theses

## Setup

You first need to install the latest LTS version of [Node.js](https://nodejs.org/en/) and [Docker](https://docs.docker.com/get-docker/).

In the `database` folder, create a `res` directory and put in it:
- the CSV file containing all the theses, named `theses.csv`
- a JSON file containing all the institutions, named `institutions.json`.

Next, go to the `back` directory and create a `.env` file. You should put 2 variables in it: `REDIS_AUTH` and `MEILISEARCH_AUTH`. Make sure to keep them secret. This will be the variables that you'll have to put instead of the placeholder below when you'll start these MeiliSearch and Redis.

Copy this `.env` file to the `database` folder.

Once done, open a new terminal anywhere on your disk. It's where the MeiliSearch executable will be stored, as well as the data in it (`data.ms` folder). You'll have to run a bunch of commands:

```bash
$ sudo apt update
$ sudo apt upgrade
$ sudo apt install curl
$ curl -L https://install.meilisearch.com | sh
$ ./meilisearch --master-key=YOUR_MEILISEARCH_AUTH
```

This will start MeiliSearch. Leave this terminal open, and in another terminal, run the following command:

```bash
$ curl \
  -X POST 'http://localhost:7700/indexes/theses/settings/filterable-attributes' \
  -H 'Content-Type: application/json' \
  -H 'X-Meili-API-Key: YOUR_MEILISEARCH_AUTH' \
  --data-binary '[
      "presentation_date",
      "finished"
  ]'
```

In the project folder (where are located the `front`, `database` and `back` folder), run the following command to start Redis:

```bash
sudo docker run --rm -v "$PWD/database/mounted/redis.conf:/redis/redis.conf" -v "$PWD/database/mounted:/data" -p 6379:6379 --name redis-theses redislabs/rejson:latest redis-server /redis/redis.conf --requirepass YOUR_REDIS_AUTH
```

In both the `front`, the `database` and the `back` folders, run:
```
npm install
```

In the `database` folder, run the command
```
npm run import
```

This will import the data set in Redis and MeiliSearch. The Redis part is pretty quick, but you'll have to be patient for the MeiliSearch part, because it can take a few minutes to complete.

Once everything is done, run the following command in both the `front` and the `back` folder:

```bash
npm run dev
```

And the website should be available in development mode at localhost:8000.

To create an optimized and production ready version of the front end, run:

```bash
npm run build
```

The output will be in the `public` folder.