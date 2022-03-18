//----------------READ DATA----------------------------
//Study area boundary
var orioseich = ee.FeatureCollection("users/alexandridisvasileios/orio_seix_sou_wgs84");

//Landsat Images
var Landsat5 = ee.ImageCollection("LANDSAT/LT05/C01/T1_SR");
var Landsat7 = ee.ImageCollection("LANDSAT/LE07/C01/T1_SR");
var Landsat8 = ee.ImageCollection("LANDSAT/LC08/C01/T1_SR");

//CHIRPS precipitation dataset -- daily (mm/day)
var CHIRPS_daily = ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY")
           .select('precipitation') //select precipitation
           .map(function(image){return image.clip(orioseich.geometry())}); //Clips data based on 'aoi';

//ALOS DEM
var ALOS = ee.ImageCollection("JAXA/ALOS/AW3D30/V3_2").select('DSM').map(function(image){return image.clip(orioseich.geometry())});
//Κ-factor
var kfactor = ee.Image("users/alexandridisvasileios/K_factor_seichsou_wgs84").clip(orioseich.geometry());
//LS-factor
var lsfactor = ee.Image("users/alexandridisvasileios/LS_factor").clip(orioseich.geometry());
//P-factor based on Log Erosion Barriers (LEBs)
var pfactor_log = ee.Image("users/alexandridisvasileios/antidiavr_all_fin_wgs84_ras").clip(orioseich.geometry());
//P-factor based on check dams positions
var pfactor_check = ee.Image("users/alexandridisvasileios/rec_new_texnerg_pfactor_wgs84_las").clip(orioseich.geometry());

//----------------FUNCTIONS---------------------------
//Mask Landsat 5,7
var cloudMaskL457 = function(image) {
    var qa = image.select('pixel_qa');
    // If the cloud bit (5) is set and the cloud confidence (7) is high
    // or the cloud shadow bit is set (3), then it's a bad pixel.
    var cloud = qa.bitwiseAnd(1 << 5)
                    .and(qa.bitwiseAnd(1 << 7))
                    .or(qa.bitwiseAnd(1 << 3));
    // Remove edge pixels that don't occur in all bands
    var mask2 = image.mask().reduce(ee.Reducer.min());
    return image.updateMask(cloud.not()).updateMask(mask2).clip(orioseich.geometry());
};
//Mask Landsat 8
var cloudMaskL8 = function (image) {
  // Bits 3 and 5 are cloud shadow and cloud, respectively.
  var cloudShadowBitMask = (1 << 3);
  var cloudsBitMask = (1 << 5);
  // Get the pixel QA band.
  var qa = image.select('pixel_qa');
  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0).and(qa.bitwiseAnd(cloudsBitMask).eq(0));
  return image.updateMask(mask).clip(orioseich.geometry());
}
//Calculate NDVI
var findndvi_l8 = function(image){return image.addBands(image.normalizedDifference(['B5', 'B4']).rename('ndvi'));}
//Calculate NDVI
var findndvi_l57 = function(image){return image.addBands(image.normalizedDifference(['B4', 'B3']).rename('ndvi'));}


//------------------MAIN-----------------------------
//--------Select time periods---------//
var img1995_prefire = Landsat5.filterDate('1995-08-01','1995-09-01').filterBounds(orioseich).map(cloudMaskL457).median();
var img1997_postfire = Landsat5.filterDate('1997-08-01','1997-09-01').filterBounds(orioseich).map(cloudMaskL457).median();
var img2000 = Landsat5.filterDate('2000-08-01','2000-09-01').filterBounds(orioseich).map(cloudMaskL457).median();
var img2007 = Landsat7.filterDate('2007-08-01','2007-09-01').filterBounds(orioseich).map(cloudMaskL457).median();
var img2017 = Landsat8.filterDate('2017-08-01','2017-09-01').filterBounds(orioseich).map(cloudMaskL8).median();
var img2020 = Landsat8.filterDate('2019-08-01','2019-09-01').filterBounds(orioseich).map(cloudMaskL8).median();

//---Calculate NDVI-------//
var ndvi_img1995_prefire = findndvi_l57(img1995_prefire).select(['ndvi']);
var ndvi_img1997_postfire = findndvi_l57(img1997_postfire).select(['ndvi']);
var ndvi_img2000 = findndvi_l57(img2000).select(['ndvi']);
var ndvi_img2007 = findndvi_l57(img2007).select(['ndvi']);
var ndvi_img2017 = findndvi_l8(img2017).select(['ndvi']);
var ndvi_img2020 = findndvi_l8(img2020).select(['ndvi']);


//Visualizations
var visfactor = {min:0,max:150,palette:['yellow','orange','purple']}
//----------------COMPUTE RUSLE MODEL------------------------------

// A = R * K * L * S * C * P; //A, annual soil erosion

// C ------- Vegetation Cover Factor, a=2, b=1,
// The higher the C, the worst the growth
var cf_1995_prefire = ((ndvi_img1995_prefire.multiply(-2)).divide(ndvi_img1995_prefire.multiply(-1).add(1))).exp();
var cf_1997_postfire = ((ndvi_img1997_postfire.multiply(-2)).divide(ndvi_img1997_postfire.multiply(-1).add(1))).exp();
var cf_2000 = ((ndvi_img2000.multiply(-2)).divide(ndvi_img2000.multiply(-1).add(1))).exp();
var cf_2007 = ((ndvi_img2007.multiply(-2)).divide(ndvi_img2007.multiply(-1).add(1))).exp();
var cf_2017 = ((ndvi_img2017.multiply(-2)).divide(ndvi_img2017.multiply(-1).add(1))).exp();
var cf_2020 = ((ndvi_img2020.multiply(-2)).divide(ndvi_img2020.multiply(-1).add(1))).exp();

//Visualization parameters                    
var vismask = {min:0,max:50,palette: ["#000080","#0000D9","#4000FF","#8000FF","#0080FF","#00FFFF",
              "#00FF80","#80FF00","#DAFF00","#FFFF00","#FFF500","#FFDA00",
              "#FFB000","#FFA400","#FF4F00","#FF2500","#FF0A00","#FF00FF",]}

//Retrieve CHIRPS percipitation data
var jan_chirps2019 = CHIRPS_daily.filterDate('1995-01-01','1995-02-01');
var feb_chirps2019 = CHIRPS_daily.filterDate('1995-02-01','1995-03-01');
var mar_chirps2019 = CHIRPS_daily.filterDate('1995-03-01','1995-04-01');
var apr_chirps2019 = CHIRPS_daily.filterDate('1995-04-01','1995-05-01');
var may_chirps2019 = CHIRPS_daily.filterDate('1995-05-01','1995-06-01');
var jun_chirps2019 = CHIRPS_daily.filterDate('1995-06-01','1995-07-01');
var jul_chirps2019 = CHIRPS_daily.filterDate('1995-07-01','1995-08-01');
var aug_chirps2019 = CHIRPS_daily.filterDate('1995-08-01','1995-09-01');
var sep_chirps2019 = CHIRPS_daily.filterDate('1995-09-01','1995-10-01');
var oct_chirps2019 = CHIRPS_daily.filterDate('1995-10-01','1995-11-01');
var nov_chirps2019 = CHIRPS_daily.filterDate('1995-11-01','1995-12-01');
var dec_chirps2019 = CHIRPS_daily.filterDate('1995-12-01','1996-01-01');
     
       
// Calculate annual precipitation (mm) for 2019 year
var annual_precip = (jan_chirps2019.sum()).add(feb_chirps2019.sum()).add(mar_chirps2019.sum()).add(apr_chirps2019.sum()).add(may_chirps2019.sum()).add(jun_chirps2019.sum()).add(jul_chirps2019.sum()).add(aug_chirps2019.sum()).add(sep_chirps2019.sum()).add(oct_chirps2019.sum()).add(nov_chirps2019.sum()).add(dec_chirps2019.sum());

// Calculate R factor based on Flampouris' phd thesis "Study of the effect of rainfall factor R on Rusle's law (in Greek)" (2008) (No. GRI-2008-1712),Aristotle University of Thessaloniki. He used gauge stations and created some stable values 
var flap =  annual_precip.multiply(0.8);                

// Calculate A factor
var A_value_95 = flap.multiply(kfactor).multiply(lsfactor).multiply(cf_1995_prefire);
var A_value_97 = flap.multiply(kfactor).multiply(lsfactor).multiply(cf_1997_postfire);
var A_value_00 = flap.multiply(kfactor).multiply(lsfactor).multiply(cf_2000).multiply(pfactor_log);
var A_value_07 = flap.multiply(kfactor).multiply(lsfactor).multiply(cf_2007).multiply(pfactor_check);
var A_value_17 = flap.multiply(kfactor).multiply(lsfactor).multiply(cf_2017).multiply(pfactor_check);
var A_value_20 = flap.multiply(kfactor).multiply(lsfactor).multiply(cf_2020).multiply(pfactor_check);

//----------------DISPLAY------------------------------
//Display layers
Map.centerObject(orioseich,12);
Map.addLayer(orioseich.draw({color: '999999', strokeWidth: 2}),{},'Study Area');
Map.addLayer(A_value_20,visfactor,'A_metavliti_20');

//----------------EXPORT----------------------------------
// export A value for each year (e.g. 2020);
Export.image.toDrive({
  image: A_value_20,
  description: 'A_value_20_fin',
  scale: 30,
  maxPixels: 1e9,
});
