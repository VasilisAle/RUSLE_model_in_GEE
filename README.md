# RUSLE_model_in_GEE

The RUSLE model has been implemented on Google Earth Engine (GEE) platform.

The model is entirely written in Javascript API where the required datasets are retrieved either from the GEE catalogue or uploaded as assets.
In particular, satellite images (Landsat 5,7,8) and CHIRPS percipitation data are available in the catalogue and are used to calculate the C and R factors, respectively. As for the K, LS and P factors were calculated on a GIS system and uploaded as assets in the platform. 

This model is freely available, transferable to any region and applicable to use other datasets as well (e.g. satellite images, precipitation data).
