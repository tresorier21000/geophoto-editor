[Setup]
; Informations de base de l'application
AppName=GeoPhoto Editor
AppVersion=1.1
AppPublisher=Votre Nom ou Entreprise

; Dossier d'installation par défaut (Program Files)
DefaultDirName={autopf}\GeoPhoto Editor
DefaultGroupName=GeoPhoto Editor

; Nom du fichier d'installation généré (.exe)
OutputBaseFilename=Installer_GeoPhoto_Editor_V1.1.0
Compression=lzma
SolidCompression=yes
WizardStyle=modern

; NOUVEAU : L'icône de l'installateur lui-même (le setup.exe)
SetupIconFile=icone_geophoto.ico

[Languages]
Name: "french"; MessagesFile: "compiler:Languages\French.isl"

[Files]
; On copie le fichier principal
Source: "index.html"; DestDir: "{app}"; Flags: ignoreversion
Source: "style.css"; DestDir: "{app}"; Flags: ignoreversion
Source: "script.js"; DestDir: "{app}"; Flags: ignoreversion
Source: "sw.js"; DestDir: "{app}"; Flags: ignoreversion
Source: "manifest.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "icone_geophoto.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "icone_geophoto.png"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
; NOUVEAU : Création du raccourci sur le bureau avec VOTRE icône
Name: "{autodesktop}\GeoPhoto Editor"; Filename: "{app}\index.html"; IconFilename: "{app}\icone_geophoto.ico"

; NOUVEAU : Création du raccourci dans le menu Démarrer avec VOTRE icône
Name: "{group}\GeoPhoto Editor"; Filename: "{app}\index.html"; IconFilename: "{app}\icone_geophoto.ico"