# Vision – Rheinblicke

[Deutsch](vision.md) · [English](vision.en.md)

Ein digitaler 3D-Zwilling der Stadt Schaffhausen

1. Ausgangslage

Für die Stadt Schaffhausen stehen zahlreiche öffentlich zugängliche Geodaten zur Verfügung. Dazu gehören Geländemodelle, 3D-Gebäudedaten, Luftbilder, Strassen, Gewässer und weitere geografische Informationen.

Diese Daten bilden die Grundlage für einen digitalen, dreidimensionalen Nachbau der Stadt, der direkt im Webbrowser erkundet werden kann.

2. Vision

Wir entwickeln einen interaktiven, geografisch korrekten 3D-Klon der Stadt Schaffhausen auf Basis öffentlich verfügbarer Geodaten.

Die Anwendung ermöglicht es, die Stadt aus unterschiedlichen Perspektiven zu betrachten, frei durch das Stadtmodell zu navigieren und geografische Informationen direkt im dreidimensionalen Raum zu erkunden.

Langfristig soll daraus eine erweiterbare Plattform entstehen, auf der sich zusätzliche geografische, historische und städtebauliche Informationen visualisieren lassen.

Im Mittelpunkt stehen die tatsächlichen Geodaten, ihre dreidimensionale Darstellung und ihre interaktive Erkundung – nicht Fotorealismus.

3. Erster Prototyp

Als erstes Testgebiet dient die Altstadt von Schaffhausen mit dem Munot und dem angrenzenden Rheinufer.

Der Prototyp soll folgende Möglichkeiten bieten:

- 3D-Stadtmodell: Darstellung der Gebäude mit realistischen Grundrissen, Gebäudehöhen und Dachformen.
- Gelände: Dreidimensionale Darstellung der tatsächlichen Topografie inklusive Munothügel und Rheinufer.
- Stadtlandschaft: Darstellung von Strassen, Plätzen, Grünflächen und Gewässern.
- Freie Navigation: Stadtmodell drehen, verschieben, zoomen und aus unterschiedlichen Blickwinkeln betrachten.
- Gebäudeinformationen: Gebäude auswählen und verfügbare geografische beziehungsweise amtliche Informationen anzeigen.
- Kartenlayer: Einzelne geografische Informationsebenen ein- und ausblenden.

Die Anwendung läuft direkt im Browser und erfordert keine zusätzliche Installation.

4. Datengrundlage

Wir verwenden bevorzugt frei zugängliche Open Government Data (OGD).

Wichtige Quellen sind:

- swisstopo: 3D-Gebäudemodelle, Geländemodelle und Orthofotos.
- Geoportal Kanton Schaffhausen: Amtliche Vermessung, Gebäudeinformationen und weitere GIS-Daten.
- OpenStreetMap: Ergänzende Informationen zu Strassen, Wegen und Points of Interest.

Die Daten werden für die 3D-Darstellung aufbereitet und zunächst lokal beziehungsweise als statische Ressourcen bereitgestellt.

Der Prototyp soll nicht von kostenpflichtigen Kartendiensten oder Cloud-Plattformen abhängig sein.

5. Technische Leitidee

Wir entwickeln eine leichtgewichtige, browserbasierte Anwendung.

Als technologische Grundlage sind vorgesehen:

- React: Benutzeroberfläche und Interaktion.
- CesiumJS: Darstellung und Navigation im geografischen 3D-Raum.
- Python und GIS-Werkzeuge: Import, Aufbereitung und Konvertierung der Geodaten.
- 3D Tiles und geeignete GIS-Formate: Performante Bereitstellung der Modelle.

Ein eigenes Backend ist für den ersten Prototyp nicht zwingend erforderlich.

Die Architektur soll spätere Erweiterungen ermöglichen, ohne dass der Prototyp bereits als vollständige Digital-Twin-Plattform konzipiert werden muss.

6. Bewusste Abgrenzung

Für die erste Version verzichten wir auf:

- Fotorealistische Fassaden, Fenster und Gebäudedetails.
- Innenräume und begehbare Gebäude.
- Echtzeitdaten und IoT-Sensoren.
- Verkehrssimulationen und komplexe physikalische Simulationen.
- Umfangreiche Benutzerverwaltung und Datenpflege.
- Die vollständige Modellierung des gesamten Stadtgebiets.

Der Fokus liegt auf einem funktionierenden, visuell nachvollziehbaren und geografisch korrekten 3D-Stadtmodell.

7. Perspektivische Erweiterungen

Nach erfolgreichem Prototyp sind verschiedene Ausbaustufen denkbar:

- Erweiterung auf das gesamte Stadtgebiet und später den Kanton.
- Historische Stadtansichten und zeitliche Vergleiche.
- Einbindung von Klimadaten, Lärmkarten und Stadtplanung.
- Visualisierung von Schattenwurf und Sonneneinstrahlung.
- Ergänzung durch detailliertere 3D-Modelle ausgewählter Bauwerke.
- Integration dynamischer Daten und Simulationen.

Diese Möglichkeiten sind Teil der langfristigen Perspektive, nicht des ersten Entwicklungsumfangs.

8. Erfolgskriterien

Der erste Prototyp ist erfolgreich, wenn:

1. Die Altstadt mit Munot und Rheinufer als zusammenhängendes 3D-Modell dargestellt wird.
2. Gebäude und Gelände geografisch korrekt positioniert sind.
3. Die Navigation im Browser flüssig funktioniert.
4. Einzelne Gebäude ausgewählt und ihre verfügbaren Informationen angezeigt werden können.
5. Mindestens ein zusätzlicher GIS-Layer ein- und ausgeblendet werden kann.
6. Die Anwendung mit frei verfügbaren Daten und ohne kostenpflichtige externe Dienste betrieben werden kann.

9. Zielbild

Rheinblicke soll zeigen, wie sich aus öffentlich verfügbaren Geodaten mit überschaubarem Aufwand ein interaktiver digitaler Stadtzwilling aufbauen lässt.

Der erste Prototyp ist eine technische Machbarkeitsdemonstration und gleichzeitig das Fundament für eine künftig erweiterbare 3D-Geodatenplattform.
