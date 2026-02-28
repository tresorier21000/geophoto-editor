[Setup]
; Informations de base de l'application
AppName=GeoPhoto Editor
AppVersion=2.0.0
AppPublisher=Votre Nom ou Entreprise

; Dossier d'installation par défaut (Program Files)
DefaultDirName={autopf}\GeoPhoto Editor
DefaultGroupName=GeoPhoto Editor

; Nom du fichier d'installation généré (.exe)
OutputBaseFilename=Installer_GeoPhoto_Editor_V2.0.0
Compression=lzma
SolidCompression=yes
WizardStyle=modern

; Afficher un message de fin d'installation avec le README
InfoAfterFile=README.md

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
Source: "README.md"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
; NOUVEAU : Création du raccourci sur le bureau avec VOTRE icône
Name: "{autodesktop}\GeoPhoto Editor"; Filename: "{app}\index.html"; IconFilename: "{app}\icone_geophoto.ico"

; NOUVEAU : Création du raccourci dans le menu Démarrer avec VOTRE icône
Name: "{group}\GeoPhoto Editor"; Filename: "{app}\index.html"; IconFilename: "{app}\icone_geophoto.ico"

[Run]
; Lance automatiquement l'affichage du README à la fin de l'installation (optionnel à décocher par l'utilisateur)
Filename: "notepad.exe"; Parameters: "{app}\README.md"; Description: "Lire le manuel et les instructions d'installation d'ExifTool"; Flags: postinstall nowait skipifsilent

[Registry]
; Ajout du dossier de l'application au PATH Windows de l'utilisateur pour qu'il trouve exiftool.exe
; uninsdeletevalue assure que l'entrée sera nettoyée à la désinstallation (si c'est la seule)
Root: HKCU; Subkey: "Environment"; ValueType: expandsz; ValueName: "Path"; ValueData: "{olddata};{app}"; Check: NeedsAddPath(ExpandConstant('{app}'))

[Code]
// Fonction pour vérifier si le chemin est déjà dans le PATH pour éviter les doublons
function NeedsAddPath(Param: string): boolean;
var
  OrigPath: string;
begin
  if not RegQueryStringValue(HKEY_CURRENT_USER, 'Environment', 'Path', OrigPath)
  then begin
    Result := True;
    exit;
  end;
  // Cherche le dossier dans la chaîne existante
  Result := Pos(';' + Param + ';', ';' + OrigPath + ';') = 0;
end;