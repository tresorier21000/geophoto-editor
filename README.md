# GeoPhoto Editor 📍📷

**GeoPhoto Editor** est une application web évoluée en utilitaire logiciel complet (V2.0.0), permettant de visualiser, modifier, organiser et nettoyer les métadonnées (EXIF et GPS) de vos images. L'outil s'adapte à vos besoins grâce à deux modes distincts : un traitement unitaire rapide 100% navigateur, et un traitement de masse très puissant (Pilotant le moteur externe ExifTool via la génération sécurisée de scripts automatisés BATCH).

## 🚀 Fonctionnalités Principales (V2.0.0)

À l'ouverture, l'application vous propose deux méthodes de travail :

### 🌟 Mode 1 : Traitement d'une seule image (JPEG)
> [!IMPORTANT]
> Le Mode 1 (image unique) reste totalement multiplateforme.

Idéal pour une modification rapide et visuelle d'une seule photo.

👉 **Visualisation immédiate :** La carte interactive se centre automatiquement sur les coordonnées GPS existantes.

👉 **Modification Intuitive :** Modifiez la position d'un simple clic sur la carte, via la barre de recherche, ou utilisez votre géolocalisation actuelle.

👉 **Confidentialité totale :** Le traitement s'effectue intégralement en local dans votre navigateur.


### 🌟 Mode 2 : Traitement par Lot (Dossier complet, Tous formats RAW/JPEG/PNG)
> [!IMPORTANT]
> **Fonctionnalité exclusive à Windows :** Le mode par lot génère des scripts d'automatisation système spécifiques (`.bat`) qui ne peuvent s'exécuter que sur un environnement Microsoft Windows.
Conçu pour traiter des centaines de photos d'un retour de voyage. Ce mode génère à la demande des fichiers de commandes (.bat) sécurisés pilotant le célèbre moteur **ExifTool**. Il est architecturé en 3 Onglets :

👉 **Onglet 1 : MÉTADONNÉES**
*   Appliquez une date/heure commune ou une position géographique à toutes les images d'un même dossier en quelques secondes.

👉 **Onglet 2 : ORGANISATION** (Système de Classement)
*   **Renommage :** Renommez automatiquement des centaines de photos avec leur date de prise de vue interne (ex: `20261231_1.jpg`).
*   **Classement Automatique :** Ventilez automatiquement les photos en vrac vers des sous-dossiers par "Année", ou par "Année / Mois".

👉 **Onglet 3 : UTILITAIRES** (Anonymat & Lecture)
*   **Extracteur CSV :** Analysez tout votre dossier pour faire ressortir un tableau de bord lisible sous Excel (Noms, Dimensions, Dates, GPS apparents).
*   **Effacement Total "Le Kärcher EXIF" :** Pointez, cliquez et détruisez d'un seul coup toutes les balises cachées d'un lot complet (Appareil photo, Géolocalisation, Logiciels, Dates) en vue d'une publication 100% anonyme sur Internet.

*Note Importante : Pour tout le mode lot, le logiciel est conçu pour la sécurité de vos données. L'option "Conserver les originaux" (activée par défaut) forcera la création de doublons purifiés ou classés (`_geophoto.jpg`), vos originaux ne seront jamais écrasés par erreur.*

#### 🏷️ Nomenclature Intelligente des Scripts BATCH
Afin d'éviter la confusion lors de générations multiples de scripts dans votre dossier "Téléchargements", l'application génère **dynamiquement** le nom du fichier `.bat` en fonction des actions cochées. 
Chaque fichier BATCH de traitement par lot adoptera une syntaxe claire :
* `!_organisation_[Dossier]_copie_renomme.bat` *(Conservation de l'original + Renommage Daté)*
* `!_organisation_[Dossier]_ecrase_classe-A-M.bat` *(Fichiers déplacés/écrasés + Classés par Année-Mois)*
* `!_traitement_lot_[Dossier]_copie_date_gps.bat` *(Conservation de l'original + Forçage GPS + Forçage Date)*
* `!_nettoyage_exif_[Dossier]_copie_purge.bat` *(Exécution du Kärcher Anti-Métadonnées)*

> [!WARNING]
> **Espace Disque Requis :** Le mode "Sécurité : Conserver les originaux" (qui déclenche les tags `_copie_`) va dupliquer intégralement vos fichiers. Avant de lancer un script sur un dossier contenant des Gigaoctets de photos (Disque dur portable, grosse Clé USB, etc.), assurez-vous d'avoir au moins l'équivalent du volume d'origine en espace libre. Le processus risque d'échouer mathématiquement si l'espace vient à manquer.

## 🛠️ Installation (Windows)

L'installation de GeoPhoto Editor V2.0.0 s'effectue simplement via l'installeur exécutable fourni (.exe) :
1. L'installeur installe l'interface web, crée vos raccourcis sur le bureau et le menu Démarrer.
2. Il ajoute **automatiquement** son propre dossier d'installation à la variable système globale `PATH` de Windows.

### ⚙️ Prérequis Strict (Mode par Lot) : Installation d'ExifTool
GeoPhoto Editor fait le choix de **ne pas embarquer** le moteur ExifTool dans son installateur, afin de vous garantir l'usage de la dernière version en date et d'alléger le fichier.
Pour que les scripts BATCH du Mode 2 fonctionnent, ExifTool est indispensable :
1. Téléchargez la version Windows (fichier `.zip`) depuis le site officiel : [exiftool.org](https://exiftool.org/)
2. Décompressez l'intégralité du fichier ZIP. Vous y trouverez un exécutable `exiftool(-k).exe` et un dossier indispensable nommé `exiftool_files`.
3. Renommez le fichier `exiftool(-k).exe` pour qu'il s'appelle exactement **`exiftool.exe`**.
4. **Où l'installer ?** Nous vous conseillons de créer un dossier simple à la racine de votre disque dur, comme par exemple **`C:\ExifTool\`** (à l'image de ce qui se fait souvent pour `ffmpeg`). Placez le fichier `exiftool.exe` **ET** le dossier `exiftool_files` à cet endroit. Évitez le dossier _Program Files_ de GeoPhoto qui nécessite des droits administrateurs pénibles pour y glisser des fichiers.
5. **Déclaration système (Variable PATH) :** Pour que Windows (et donc GeoPhoto) trouve ExifTool, vous devez déclarer cet emplacement :
   * Tapez _"Variables d'environnement"_ dans le menu Démarrer de Windows.
   * Cliquez sur _"Modifier les variables d'environnement système"_.
   * Dans la fenêtre, cliquez sur le bouton _"Variables d'environnement"_.
   * Sélectionnez la ligne `Path` puis _Modifier_ > _Nouveau_ et ajoutez votre chemin (ex: `C:\ExifTool\`). Validez tout par _OK_.

## ⚙️ Technologies Utilisées
*   **Frontend Web** : HTML5, CSS3, JavaScript Vanilla.
*   **Cartographie** : Leaflet.js (OpenStreetMap) et API Nominatim.
*   **Moteurs EXIF** : 
    *   *Piexifjs* pour la manipulation binaire autonome des JPEG.
    *   *ExifTool* (de Phil Harvey) pour l'impressionnante architecture système générative de scripts BATCH (Opérations complexes de tri, renommage conditionnel et nettoyage total).

---
*Version 2.0.0 - Développé par Yves Balestra.*
