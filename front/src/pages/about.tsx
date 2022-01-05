import React from "react"
import { Link, Typography } from "@mui/material"
import GitHubIcon from "@mui/icons-material/GitHub"
import Layout from "../components/layout"
import { Helmet } from "react-helmet"

export default function About() {
    return (
        <Layout>
            <Helmet>
                <title>À propos de ce site</title>
                <meta name="description" content="Informations et contexte sur ce site et les technologies qu'il utilise."/>
            </Helmet>
            <div className="m-20">
                <Typography variant="h5" component="h1" gutterBottom>Contexte</Typography>
                <Typography className="mt-7" gutterBottom>
                    Ce site est un projet de programmation web côté serveur développé dans le cadre du DUT informatique 2 ème année.<br/>
                    Inspiré du site <Link href="https://theses.fr">theses.fr</Link>, ce projet permet notamment de faire de la recherche en temps réel parmi toutes les thèses françaises ainsi que de l'affichage de statistiques concernant celles ci.<br/>
                    Ce n'est pas un projet open source, mais si vous avez été ajoutés au dépôt, vous pouvez le trouver sur <Link href="https://github.com/CypElf/Theses"><GitHubIcon htmlColor="#000000"/> GitHub</Link>
                </Typography>
                <Typography className="mt-7" variant="h5" component="h1" gutterBottom>Front end</Typography>
                <Typography className="mt-7" gutterBottom>
                    Pour son front end, ce site utilise <Link href="https://www.gatsbyjs.com/">Gatsby</Link> (un framework <Link href="https://fr.reactjs.org/">React</Link>) avec <Link href="https://www.typescriptlang.org/">TypeScript</Link>, <Link href="https://tailwindcss.com/">TailwindCSS</Link> ainsi que <Link href="https://mui.com/">Material UI</Link>.<br/>
                    Du côté des bibliothèques, il y a <Link href="https://www.highcharts.com/">Highcharts</Link> ainsi que <Link href="https://leafletjs.com/">Leaflet</Link>.
                </Typography>
                <Typography className="mt-7" variant="h5" component="h1" gutterBottom>Back end</Typography>
                <Typography className="mt-7" gutterBottom>
                    Pour son back end, ce site utilise <Link href="https://nodejs.org/en/">Node.js</Link> encore une fois avec <Link href="https://www.typescriptlang.org/">TypeScript</Link>. Le framework web utilisé est <Link href="https://www.fastify.io/">Fastify</Link>.
                </Typography>
                <Typography className="mt-7" variant="h5" component="h1" gutterBottom>Bases de données</Typography>
                <Typography className="mt-7" gutterBottom>
                    Deux bases de données différentes sont utilisées en parallèle pour tirer le meilleur de chacune : <Link href="https://www.meilisearch.com/">MeiliSearch</Link> pour le moteur de recherche et <Link href="https://redis.io/">Redis</Link> pour les statistiques.
                </Typography>
            </div>
        </Layout>
    )
}