## Pour installer le projet

Installation de Git sous windows:
Telecharger la version de git correspondant a votre ordinateur https://git-scm.com/downloads/win

Lancer l'installation en laissant les parametres par defaut.

Ensuite, chercher l'application `git bash` dans windows et executer l'application.

Configurez votre profil git:
`git config --global user.name "mon nom utilisateur"`
`git config --global user.email "mon adresse mail"`
`git config --global core.autocrlf false`


Aller dans le dossier que vous souhaitez et executez la commande:
`git clone https://github.com/YoannDexmier/ftl.git`

Installation de NVM:

https://github.com/coreybutler/nvm-windows/releases/download/1.2.2/nvm-setup.exe

et executer l'installation.

Fermer `git bash` et relancer le.

Maintenant vous pouvez installer npm en executant:
`nvm install 18`

puis utiliser la version 18 en faisant `nvm use 18`

Dans votre dossier de travail:

`npm install` (recommandé pour votre IDE mais n'empeche pas le fonctionnement de l'application normalement)

et enfin `npm run dev` pour pouvoir acceder a  `localhost:3000`
`docker-compose up --build`

et vous pouvez acceder au site `http://localhost:3000`

Une fois le build éffectuer une première fois, vous pouvez relancer le projet en faisant simplement `docker-compose up` 


# 🚀 Commandes utiles - Projet Next.js + Docker + MongoDB

## 📦 Lancer le projet

```bash
docker-compose up
```
- Démarre l'application en mode développement
- Active le live-reload avec Next.js
- Lance aussi le service MongoDB

---

## ⛔️ Arrêter le projet

### Depuis le terminal en cours :
```bash
Ctrl + C
```

### Ou via une autre fenêtre de terminal :
```bash
docker-compose down
```

---

## ♻️ Rebuild (après modification du Dockerfile ou des dépendances)

```bash
docker-compose up --build
```

---

## 🧪 Installer un nouveau package

### Depuis le conteneur :
```bash
docker-compose exec app npm install <nom-du-package>
```

### Ou localement (et rebuild) :
```bash
npm install <nom-du-package>
docker-compose up --build
```

---

## 📁 Naviguer dans le conteneur

```bash
docker-compose exec app sh
```

---

## 📂 Dossier de travail

Place-toi toujours dans le dossier du projet :

```bash
cd ftl
```

---

## 💡 Alias recommandés (à mettre dans ton `.bashrc` ou `.zshrc`)

```bash
alias dcup="docker-compose up"
alias dcdown="docker-compose down"
alias dcex="docker-compose exec app"
alias dcb="docker-compose up --build"
```

---

## 🌐 Accéder à l'application

Ouvre ton navigateur sur :

```
http://localhost:3000
```

---

## Composants externes
On utilise la library material UI https://mui.com/material-ui/api/tab/

## 🛠 Dépannage

- **Changements non pris en compte ?**  
  Vérifie que les volumes sont bien montés dans `docker-compose.yml`.

- **MongoDB inaccessible ?**  
  Vérifie que la variable `MONGODB_URI` est bien définie dans le fichier `.env` :
  ```env
  MONGODB_URI=mongodb://mongo:27017/mydb
  ```




