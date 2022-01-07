import React, { useContext } from "react"
import { Helmet } from "react-helmet"
import { Link, Typography } from "@mui/material"
import GitHubIcon from "@mui/icons-material/GitHub"
import Layout from "../components/layout"
import { darkModeContext } from "../components/theme"

export default function About() {
    const { darkMode } = useContext(darkModeContext)

    return (
        <Layout>
            <Helmet>
                <title>Thèses - à propos</title>
                <meta name="description" content="Informations et contexte sur ce site et les technologies qu'il utilise."/>
            </Helmet>
            <div className="m-20">
            <h1 className="my-6 text-3xl">Contexte</h1>
                <Typography className="mt-6 font-segoe" gutterBottom>
                    <p>
                        Ce site est un projet de programmation web côté serveur développé dans le cadre du DUT informatique 2 ème année.<br/>
                        Inspiré du site <Link href="https://theses.fr">theses.fr</Link>, ce projet permet notamment de faire de la recherche en temps réel parmi toutes les thèses françaises ainsi que de l'affichage de statistiques concernant celles ci.
                    </p>
                    <p className="mt-2">
                        Ce n'est pas un projet open source, mais si vous avez été ajoutés au dépôt, vous pouvez le trouver sur <Link href="https://github.com/CypElf/Theses"><GitHubIcon htmlColor={darkMode ? "#FFFFFF" : "#000000"}/> GitHub</Link>.
                    </p>
                </Typography>
                
                <h1 className="my-6 text-3xl">Front end</h1>
                <Typography className="mt-6 font-segoe" gutterBottom>
                    Pour son front end, ce site utilise la bibliothèque JavaScript <Link href="https://fr.reactjs.org/">React</Link>. En effet, étant déjà très à l'aise avec cette dernière, cela m'a semblé le meilleur choix pour ce projet dont le front end prend une place importante (requêtes au serveur, traitement des données, gestion d'états, etc), là où du JavaScript vanilla aurait été extrêmement compliqué à utiliser partout, gérer et maintenir.<br/>
                    React étant très minimaliste et n'incluant pas directement de solution à certaines fonctionnalités très communes, j'ai donc utilisé le framework pour React <Link href="https://www.gatsbyjs.com/">Gatsby</Link> qui rajoute du routage côté client ainsi que du rendu statique (essentiel pour le <Link href="https://fr.wikipedia.org/wiki/Optimisation_pour_les_moteurs_de_recherche">SEO</Link>).<br/>
                    Plutôt que d'utiliser du JavaScript, mon choix s'est porté sur le <Link href="https://www.typescriptlang.org/">TypeScript</Link> un sur-ensemble syntaxique du JavaScript transpilant vers ce dernier, qui rajoute de nombreuses fonctionnalités et notamment un typage statique et fort permettant de détecter de nombreux problèmes au lieu de les découvrir en production à runtime.<br/>
                    Du côté du CSS, j'ai utilisé le framework CSS <Link href="https://tailwindcss.com/">TailwindCSS</Link> pour simplifier et accélérer le design du site ainsi que la bibliothèque <Link href="https://mui.com/">Material UI</Link>, permettant d'utiliser de nombreux composants React riches en fonctionnalités prêts à l'utilisation.<br/>
                    Enfin, j'emploie la bibliothèque <Link href="https://www.highcharts.com/">Highcharts</Link> pour générer des graphiques à partir des données ainsi que <Link href="https://leafletjs.com/">Leaflet</Link> pour générer une carte personnalisée basée sur le projet <Link href="https://www.openstreetmap.fr/">OpenStreetMap</Link>.
                </Typography>
                <h1 className="my-6 text-3xl">Back end</h1>
                <Typography className="mt-6 font-segoe" gutterBottom>
                    Pour son back end, ce site utilise <Link href="https://nodejs.org/en/">Node.js</Link> avec une nouvelle fois <Link href="https://www.typescriptlang.org/">TypeScript</Link>. En effet, les données échangées via l'API étant en JSON, utiliser du JavaScript pour manipuler ces données côté serveur également a l'avantage de faciliter très fortement l'interfaçage avec le front end et de proposer une expérience de développement uniforme.<br/>
                    Le framework web utilisé est <Link href="https://www.fastify.io/">Fastify</Link>, un successeur du célèbre <Link href="https://expressjs.com/fr/">Express.js</Link>. Celui ci est en effet extrêmement adapté pour proposer une API, avec un système de route très pertinent.
                </Typography>
                <h1 className="my-6 text-3xl">Bases de données</h1>
                <Typography className="mt-6 font-segoe" gutterBottom>
                    <p>
                        La base de données a été un réel problème. Les bases de données relationnelles n'étaient pas nécessaires puisqu'il n'y avait pas de relations complexes à réaliser, et elles ont montré leur limite au niveau des performances très rapidement. De plus, celles ci ne présentent aucun mécanisme de recherche pertinent.
                    </p>
                    <p>
                        Après des recherches sur le sujet, mon attention s'est arrêtée sur les bases de données spécialisées dans la recherche, intégrant un moteur de recherche extrêmement performant. Les solutions sur le marché incluent <Link href="https://www.elastic.co/fr/elasticsearch/">ElasticSearch</Link>, <Link href="https://solr.apache.org/">Solr</Link> ou encore le relativement récent <Link href="https://www.meilisearch.com/">MeiliSearch</Link>.
                    </p>
                    <p className="mt-6 font-segoe">
                        C'est ce dernier que j'ai retenu pour ce projet.<br/>MeiliSearch est donc une base de données moteur de recherche, fonctionnant assez similairement à une base de données basées sur les documents comme <Link href="https://www.mongodb.com/">MongoDB</Link> (les données sont stockées sous forme de JSON). La différence est qu'il n'y a que très peu de syntaxes permettant de faire des requêtes sur les données stockées, et que celles ci sont orientées sur les fonctionnalités de recherche, en faisant un outil tout à fait adapté pour cet usage. Celui ci supporte les typo, renvoie les résultats les plus pertinents possibles et est extrêmement performant même sur des volumes gigantesques de données.
                    </p>
                    <p className="mt-6 font-segoe">
                        Cela nous fait donc une solution au problème des recherches. Mais pour les statistiques, il va falloir trouver autre chose. En effet, MeiliSearch n'est pas adapté à cela, ne proposant que peu d'options dans ce sens et renvoyant par ailleurs uniquement un nombre approximatif du nombre de résultats des recherches.<br/>
                        Afin de pouvoir faire différentes statistiques sur ce jeu de données très gros, il faut donc une base de données permettant de parcourir tout le jeu de données extrêmement rapidement pour effectuer ces statistiques.
                    </p>
                    <p className="mt-6 font-segoe">
                        J'ai donc choisi d'utiliser <Link href="https://redis.com/">Redis</Link>, la base de données la plus performante, qui stocke entièrement en RAM ses données pour les accès les plus rapides possibles, et persiste les données sur le disque via des snapshots.<br/>
                        Proposant initialement uniquement un stockage de clé / valeur avec de nombreux types disponibles pour les valeurs, de nombreux modules optionnels sont venus s'ajouter pour proposer de nombreuses fonctionnalités, avec un module de recherche, un module de stockage de JSON, de stockage de graphes ou encore un module d'intelligence artificielle.<br/>
                        Dans ce projet, j'ai donc utilisé le module permettant le stockage de données JSON, <Link href="https://oss.redis.com/redisjson/">RedisJSON</Link>, pour pouvoir stocker le jeu de données déjà préparé sous forme de JSON (pour MeiliSearch) directement dans Redis.<br/>
                        A noter que j'ai essayé d'utiliser le module de recherche de Redis pour remplacer MeiliSearch et simplifier la tech stack du projet, mais celui ci s'est avéré ne pas être à la hauteur de MeiliSearch, ne donnant notamment pas forcément les résultats les plus pertinents et ne supportant pas les typo.
                    </p>
                </Typography>
            </div>
        </Layout>
    )
}