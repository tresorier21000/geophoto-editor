# GeoPhoto Editor 📍📷

**GeoPhoto Editor** est une application web évoluée en utilitaire logiciel complet (**V3.0.0**), permettant de visualiser, modifier, organiser et nettoyer les métadonnées (EXIF et GPS) de vos images. L'outil s'adapte à vos besoins grâce à trois modes de travail distincts.

## 🚀 Les 3 Modes de Travail (V3.0.0)

### 🌟 Mode 1 : Traitement d'une seule image (JPEG uniquement)
> [!IMPORTANT]
> Le Mode 1 (image unique) est 100% exécuté dans le navigateur.

Idéal pour une modification ultra-rapide et visuelle d'une seule photo.
*   👉 **Visualisation immédiate :** La carte interactive se centre automatiquement sur les coordonnées GPS existantes.
*   👉 **Modification Intuitive :** Modifiez la position d'un simple clic sur la carte ou via la barre de recherche.
*   👉 **Export Direct :** Téléchargez instantanément la photo mise à jour.

### 🌟 Mode 2 : Sélection Visuelle (Nouveauté V3 - JPEG uniquement)
> [!TIP]
> **Le meilleur des deux mondes :** L'ergonomie du Mode 1 alliée à la puissance du traitement par lot.

Ce mode permet de parcourir un dossier complet, de sélectionner visuellement les photos et de préparer un script de modification global.
1.  **Ouverture du Dossier :** Indiquez le chemin de votre dossier local (Etape 1) puis "Parcourez" ce même dossier (Etape 2) pour charger les miniatures dans le tableau.
2.  **Sélection :** Cochez dans le tableau les photos que vous souhaitez modifier.
3.  **Focus & Aperçu :** Cliquez sur une ligne pour voir la photo en grand et localiser son emplacement actuel sur la carte.
4.  **Préparation :** Modifiez la Date ou la Position GPS dans le panneau de droite, puis cliquez sur **"Appliquer (En mémoire)"**. Une étiquette verte "Modifié" apparaît devant le nom du fichier pour confirmer la prise en compte.
5.  **Génération & Exécution :** Une fois votre sélection terminée, générez le script `.bat`. Grâce à la **V3**, une fenêtre "Enregistrer sous" vous permet de choisir directement votre dossier de photos. Double-cliquez ensuite sur le fichier pour appliquer les modifications.

### 🌟 Mode 3 : Traitement par Lot Massif (Tous formats : RAW, JPEG, PNG...)
> [!IMPORTANT]
> **Moteur Industriel :** Ce mode pilote directement le moteur **ExifTool** via des scripts BATCH sécurisés pour traiter des centaines de fichiers instantanément.

C'est le mode le plus puissant, capable de traiter les formats professionnels (RAW) :
*   👉 **Onglet MÉTADONNÉES :** Forcez une date/heure ou une position GPS identique sur TOUT le dossier.
*   👉 **Onglet ORGANISATION :** Renommage automatique par date (ex: `20261231_1.jpg`) et classement en sous-dossiers par Année/Mois.
*   👉 **Onglet UTILITAIRES :** Extraction CSV (Listing Excel) ou "Kärcher EXIF" (Anonymat total par effacement des balises).

---

## 🏷️ Nomenclature Intelligente des Scripts BATCH
L'application génère **dynamiquement** le nom du fichier `.bat` en fonction des actions choisies pour éviter toute confusion dans vos dossiers.

### Mode Visuel (V3) :
* `!_visuel_[Dossier]_copie_date_gps_timestamp.bat` *(Mode sélection visuelle avec sauvegarde)*
* `!_visuel_[Dossier]_ecrase_purge_timestamp.bat` *(Nettoyage EXIF sur sélection)*

### Mode Massif :
* `!_organisation_[Dossier]_copie_renomme.bat` *(Conservation de l'original + Renommage Daté)*
* `!_traitement_lot_[Dossier]_copie_date_gps.bat` *(Forçage GPS + Date sur tout le lot)*
* `!_nettoyage_exif_[Dossier]_[Timestamp].bat` *(Exécution du Kärcher Anti-Métadonnées)*
* `!_extraction_csv_[Dossier].bat` *(Listing complet vers Excel)*

> [!WARNING]
> **Espace Disque Requis :** Le mode "Sécurité : Conserver les originaux" va dupliquer vos fichiers. Assurez-vous d'avoir assez d'espace libre sur votre disque avant de lancer un gros traitement par lot.

---

## 🛠️ Installation & Configuration (Windows)

### ⚙️ 1. Installation de l'Application
L'installation s'effectue via l'installeur exécutable fourni (`.exe`) :
1. Il installe l'interface, crée les raccourcis Bureau/Démarrer.
2. Il ajoute **automatiquement** son dossier d'installation à votre variable système `PATH`.

### ⚙️ 2. Prérequis Strict : ExifTool (Modes 2 & 3)
GeoPhoto Editor nécessite le moteur **ExifTool** pour les traitements de masse :
1. Téléchargez la version Windows sur [exiftool.org](https://exiftool.org/).
2. Décompressez le ZIP et renommez `exiftool(-k).exe` en **`exiftool.exe`**.
3. **Conseil :** Créez un dossier **`C:\ExifTool\`** et placez-y le fichier `exiftool.exe` ainsi que son dossier `exiftool_files`.
4. **Déclaration système (Variable PATH) :** Pour que Windows (et donc GeoPhoto) trouve ExifTool, vous devez déclarer cet emplacement :
   * Tapez _"Variables d'environnement"_ dans le menu Démarrer de Windows.
   * Cliquez sur _"Modifier les variables d'environnement système"_.
   * Dans la fenêtre, cliquez sur le bouton _"Variables d'environnement"_.
   * Sélectionnez la ligne `Path` (dans Variables utilisateur ou système) puis _Modifier_ > _Nouveau_ et ajoutez votre chemin (ex: `C:\ExifTool\`). 
   * Validez tout par _OK_.

> [!IMPORTANT]
> **Dépannage :** Si malgré l'installation, le logiciel indique que `exiftool` n'est pas reconnu :
> 1. **Redémarrage requis :** Fermez et rouvrez votre fenêtre de commande ou l'application pour que Windows prenne en compte le nouveau `Path`.
> 2. **Vérification manuelle :** Retournez dans les "Variables d'environnement" pour vous assurer que le chemin vers votre dossier `exiftool` est bien présent et sans faute de frappe.

---

## 🛡️ Sécurité & Confidentialité
*   **Protection des originaux :** L'option "Conserver les originaux" crée des copies `_geophoto` pour ne jamais écraser vos fichiers sources par erreur.
*   **100% Privé :** Aucune photo n'est envoyée sur un serveur. Tout le traitement est local à votre ordinateur.

---

## ⚙️ Technologies Utilisées
*   **Frontend** : HTML5, CSS3, JavaScript Vanilla.
*   **Cartographie** : Leaflet.js (OpenStreetMap) & API Nominatim.
*   **Moteurs EXIF** : 
    *   *Piexifjs* (Manipulation binaire directe pour le Mode 1).
    *   *ExifTool* (de Phil Harvey) pour la génération de scripts systèmes BATCH (Modes 2 & 3).

---
*Version 3.0.0 - 04 Mars 2026 - Développé par Yves Balestra.*
