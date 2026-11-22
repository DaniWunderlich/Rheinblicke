# Vision – Rheinblicke

[Deutsch](vision.md) · [English](vision.en.md)

A digital 3D twin of the town of Schaffhausen

## 1. Starting point

Numerous publicly accessible geospatial datasets are available for Schaffhausen. These include terrain models, 3D building data, aerial imagery, roads, water bodies and other geographical information.

These datasets provide the basis for a digital, three-dimensional reconstruction of the town that can be explored directly in a web browser.

## 2. Vision

We are developing an interactive, geographically accurate 3D replica of Schaffhausen based on publicly available geodata.

The application allows users to view the town from different perspectives, navigate freely through the town model and explore geographical information directly in three-dimensional space.

In the longer term, it should become an extensible platform for visualising additional geographical, historical and urban planning information.

The focus is on actual geodata, its three-dimensional presentation and interactive exploration, rather than photorealism.

## 3. First prototype

The first test area is Schaffhausen's old town, including the Munot and the adjacent Rhine riverbank.

The prototype should provide:

- A 3D town model displaying buildings with realistic footprints, building heights and roof shapes.
- Terrain showing the actual topography in three dimensions, including the Munot hill and Rhine riverbank.
- A townscape showing roads, squares, green spaces and water bodies.
- Free navigation to rotate, pan and zoom the model and view it from different angles.
- Building information: select buildings and display available geographical or official information.
- Map layers: switch individual geographical information layers on and off.

The application runs directly in the browser and requires no additional installation.

## 4. Data foundation

We prefer freely accessible Open Government Data (OGD).

Key sources are:

- swisstopo: 3D building models, terrain models and orthophotography.
- Canton of Schaffhausen geoportal: official cadastral surveying, building information and other GIS data.
- OpenStreetMap: supplementary information on roads, paths and points of interest.

Data is prepared for 3D visualisation and initially provided locally or as static resources.

The prototype should not depend on paid mapping services or cloud platforms.

## 5. Technical approach

We are developing a lightweight, browser-based application.

The planned technical foundation is:

- React: user interface and interaction.
- CesiumJS: visualisation and navigation in geographical 3D space.
- Python and GIS tools: importing, preparing and converting geodata.
- 3D Tiles and appropriate GIS formats: efficient delivery of models.

A dedicated backend is not essential for the first prototype.

The architecture should allow later extensions without designing the prototype as a complete digital twin platform from the outset.

## 6. Deliberate boundaries

The first version excludes:

- Photorealistic façades, windows and building details.
- Interiors and walk-through buildings.
- Real-time data and IoT sensors.
- Traffic simulation and complex physical simulations.
- Extensive user management and data maintenance.
- Full modelling of the entire town area.

The focus is a functioning, visually understandable and geographically accurate 3D town model.

## 7. Possible extensions

After a successful prototype, possible next stages include:

- Expansion to the entire town and subsequently the canton.
- Historical town views and comparisons over time.
- Integration of climate data, noise maps and urban planning.
- Visualisation of shadows and solar irradiation.
- More detailed 3D models of selected landmarks.
- Integration of dynamic data and simulations.

These possibilities belong to the long-term vision, rather than the first development scope.

## 8. Success criteria

The first prototype is successful when:

1. The old town, Munot and Rhine riverbank form a continuous 3D model.
2. Buildings and terrain are positioned geographically correctly.
3. Navigation in the browser is smooth.
4. Individual buildings can be selected and their available information displayed.
5. At least one additional GIS layer can be switched on and off.
6. The application works with freely available data and without paid external services.

## 9. Intended outcome

Rheinblicke should demonstrate how publicly available geodata can be used to build an interactive digital town twin with a manageable amount of effort.

The first prototype is a technical feasibility demonstration and the foundation for a future extensible 3D geodata platform.
