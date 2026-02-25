# GeoPhoto Editor 📍📷

**GeoPhoto Editor** est une application web légère, rapide et respectueuse de la vie privée qui permet de visualiser, modifier et supprimer les métadonnées (EXIF et GPS) de vos images au format JPEG, directement depuis votre navigateur.

## 🚀 Fonctionnalités Principales

### 1. Gestion de la Géolocalisation (GPS)
*   **Visualisation :** Si votre photo contient déjà des coordonnées GPS, la carte interactive se centre automatiquement dessus au chargement.
*   **Modification :**
    *   **Clic sur la carte :** Cliquez n'importe où sur la carte interactive pour définir de nouvelles coordonnées.
    *   **Recherche par lieu :** Entrez un nom de ville ou un code postal (en France) dans la barre de recherche pour y placer un repère instantanément.
    *   **Votre position actuelle :** Utilisez le bouton "Utiliser ma position précise" pour récupérer automatiquement les coordonnées GPS de l'appareil que vous utilisez.
*   **Suppression (Anonymisation) :** Le bouton rouge "Sécuriser (Supprimer GPS)" permet de générer une copie de l'image *sans aucune coordonnée de localisation*, idéale pour partager sur les réseaux sociaux en toute sécurité.

### 2. Gestion des Métadonnées Photographiques (EXIF)
*   **Affichage détaillé :** L'application lit et affiche les données de prise de vue inscrites par votre appareil photo (Marque, Modèle, Ouverture f/, Vitesse d'obturation, ISO, dimensions).
*   **Modification de la Date et l'Heure :** Le champ "Date et Heure de Prise de Vue" vous permet de corriger ou de modifier la date d'origine de la photographie (`DateTimeOriginal`).

### 3. Fonctionnalités Pratiques
*   **Aucun transfert de données :** Le traitement de l'image se fait **100% localement dans votre navigateur web**. Aucune de vos photos personnelles n'est téléchargée sur un serveur distant, garantissant une confidentialité totale.
*   **Renommage :** Vous pouvez personnaliser le nom du fichier de sortie directement sous l'aperçu de la photo avant le téléchargement.
*   **Multi-plateforme :** Fonctionnant comme une page web standard (HTML/CSS/JS), l'outil est compatible avec Windows, macOS, Linux, Android et iOS.

## 🛠️ Comment utiliser l'application ?

1.  **Ouvrir l'application :** Ouvrez simplement le fichier `GeoPhoto_Editor.html` dans votre navigateur web préféré (Chrome, Firefox, Safari, Edge).
2.  **Importer une image :** Glissez-déposez une image JPEG dans la zone prévue à cet effet, ou cliquez pour en sélectionner une.
3.  **Apporter des modifications :**
    *   Observez les données EXIF actuelles.
    *   Changez la date ou l'heure si nécessaire.
    *   Cliquez sur la carte ou effectuez une recherche pour définir un nouveau point de prise de vue.
    *   Nommez votre futur fichier dans la zone sous l'image.
4.  **Enregistrer :** Cliquez sur le bouton bleu **"Mettre à jour & Télécharger"**. Un nouveau fichier JPEG (affublé de `_geotagged`) contenant vos modifications sera enregistré dans vos téléchargements.

## 💻 Déploiement et Création d'une "App"

Puisqu'il s'agit d'un projet "Frontend-only" sans base de données, l'hébergement de cet outil est extrêmement simple (et généralement gratuit).

*   **Sur GitHub Pages (Recommandé) :** Uploadez vos fichiers `GeoPhoto_Editor.html` (renommez-le idéalement en `index.html` pour Github Pages), `style.css` et `script.js` sur un dépôt GitHub, puis activez les *GitHub Pages* dans les paramètres du dépôt. L'URL fournie par GitHub rendra votre application accessible sur n'importe quel appareil connecté à internet.
*   **Sur Téléphone (PWA) :** Une fois le site en ligne (via GitHub Pages par exemple), ouvrez-le sur votre smartphone et choisissez "Ajouter à l'écran d'accueil" depuis les options de votre navigateur mobile. Vous aurez alors une icône sur votre écran et l'outil s'ouvrira en plein écran, tel une application classique.

## ⚙️ Technologies Utilisées
*   **HTML5 / Vanilla CSS3 / Vanilla JavaScript**
*   **Leaflet.js** : Pour la cartographie interactive (via OpenStreetMap)
*   **Piexifjs** : Pour la lecture et la réécriture du buffer binaire contenant les données EXIF de l'image.
*   **API Nominatim** : Pour le géocodage inversé (recherche texte -> coordonnées gratuites et libres).

---
*Version 1.0 - Développé par Yves Balestra.*
