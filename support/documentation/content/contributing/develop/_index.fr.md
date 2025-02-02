+++
title="Développer"
description="Développer et proposer des modifications de code"
weight=40
chapter=false
+++

Toujours annoncer les fonctionnalités sur lesquelles vous voulez travailler en créant un ticket ou en commentant un ticket existant, avant de commencer à travailler dessus. Et annoncez clairement à la communauté que vous commencez à travailler dessus. Ceci afin d'éviter que plusieurs personnes travaillent sur la même chose et entrent en conflit.

Les Pull Request sont à faire sur la branche `main`.

{{% notice note %}}
Jusqu'à mars 2023, il fallait contribuer sur la branche `develop`. Cette procédure est désormais obsolète.
{{% /notice %}}

Pré-requis pour compiler le plugin:

- vous devez avoir installé `npm`
- vous devez avoir installé les venv python (paquet `python3-venv` sous Debian par exemple)

Pour clôner le dépot :

```bash
# Cloner le dépot
git clone https://github.com/JohnXLivingston/peertube-plugin-livechat.git
# Passer sur la branche main si ce n'est pas déjà le cas
git checkout main
# Initialiser les sous-modules. Cette commande est à refaire si jamais la version d'un l'un des sous-module change.
git submodule update --init --recursive

# Installer les dépendances NPM et compiler le plugin pour la première fois :
npm install

# Compiler le plugin après une modification :
npm run build

# Si vous avez un fork du dépot, ajoutez le en remote (exemple) :
git remote add me git@github.com:MON_COMPTE_GITHUB/peertube-plugin-livechat.git

# Créez une branche locale pour vos développements et placez vous dessus (exemple) :
git checkout mon_developpement # NB: si un ticket y est associé, utilisé le nom fix_1234 (où 1234 est le numéro du ticket)
# Pour proposer vos modifications, poussez votre branche sur votre dépot (exemple) :
git push --set-upstream me mon_developpement
# Rendez-vous ensuite sur votre dépot github avec votre navigateur web pour proposer la Pull Request (voir les instructions complémentaires ci-dessous)
```

Quand vous êtes prêt⋅e à montrer votre code pour avoir un retour, soumettez une Pull Request *draft*.
Quand vous êtes prêt⋅e pour une relecture de code avant merge, soumettez une Pull Request. Dans tous les cas, merci de lier votre Pull Request au ticket concerné en utilisant la syntax de GitHub : «fixes #issue_number».

Le code du front-end est dans le dossier `client`. Le code backend dans `server`. Il y a du code partagé entre les deux dans `shared`.

Pour les instructions génériques concernant le développement de plugins (building, installation, ...), merci de vous référer à la [documentation Peertube](https://docs.joinpeertube.org/contribute-plugins?id=write-a-plugintheme).

Vous pouvez *builder* le plugin avec des infos de debug supplémentaires en utilisant :

```bash
NODE_ENV=dev npm run build
```

## ESBuild vs Typescript

Ce plugin utilise ESBuild pour compiler le code front-end, comme le plugin `peertube-plugin-quickstart` officiel.
ESBuild peut gérer Typescript, mais ne vérifie pas les types
(voir [la documentation ESBuild](https://esbuild.github.io/content-types/#typescript)).
C'est pourquoi on compile d'abord Typescript avec l'option `-noEmit`, juste pour vérifier les types (`check:client:ts` dans le fichier package.json).
Ensuite, si tout est ok, on lance ESBuild pour générer le javascript compilé.

## Debug Mode

Il existe un mode de debug pour le plugin, qui va raccourcir le délais de certaines actions.
Par exemple, il va faire tourner les journaux toutes les deux minutes, au lieu de tous les jours.
Cela permet de tester plus facilement certaines actions, pour lesquelles il faudrait normalement attendre
des heures ou des jours.

Pour activer ce mode, il suffit de créer un fichier
`/var/www/peertube/storage/plugins/data/peertube-plugin-livechat/debug_mode`
(en adaptant `/var/www/peertube/storage/` à votre installation le cas échéant).

La simple existance de ce fichier suffit à déclencher le mode debug.
Pour être sûr qu'il est pris en compte, vous pouvez redémarrer votre instance Peertube.

## Environnement de développement rapide via Docker

Un tutoriel est disponible sur [le forum Peertube](https://framacolibri.org/t/tutoriel-creer-un-environnement-de-developpement-de-plugin-peertube-rapidement-en-utilisant-docker-et-qui-permet-de-tester-la-federation/17631)
pour expliquer comment monter rapidement un environnement de développement en utilisant Docker.

Un dépot a été crée sur la base de ce tutoriel: https://codeberg.org/mose/pt-plugin-dev
