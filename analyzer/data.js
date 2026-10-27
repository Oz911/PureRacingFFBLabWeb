const REFERENCE={
 strengths:{5:90,6:90,8:90,9:85,10:80,11:80,12:75,13:75,15:70,16:65,18:65,20:60,21:60,23:60,24:60,25:60,27:60,30:60},
 filters:{Simagic:['16 %','2 %','10 %'],Moza:['16 %','2 %','110 % (échelle Moza)'],Simucube:['18 (échelle propre)','2 (échelle propre)','Off'],Asetek:['16 %','2 %','10 %'],Fanatec:['NDP 16','NFR 3','NIN 10']},
 models:[
 ['Simagic','Alpha Mini',10],['Simagic','Alpha',15],['Simagic','Alpha EVO Sport',9],['Simagic','Alpha EVO',12],['Simagic','Alpha EVO Pro',18],['Simagic','Alpha Ultimate',23],
 ['Moza','R5',5.5],['Moza','R9 V3',9],['Moza','R12 V2',12],['Moza','R16 Ultra',16],['Moza','R21 Ultra',21],['Moza','R25 Ultra',25],
 ['Simucube','Simucube 2 Sport',17],['Simucube','Simucube 2 Pro',25],['Simucube','Simucube 3 Sport',15],['Simucube','Simucube 3 Pro',25],
 ['Asetek','La Prima',12],['Asetek','Forte',18],['Asetek','Invicta',27],
 ['Fanatec','CSL DD',5],['Fanatec','CSL DD (Boost Kit)',8],['Fanatec','GT DD Pro',5],['Fanatec','GT DD Pro (Boost Kit)',8],['Fanatec','ClubSport DD',15],['Fanatec','ClubSport DD+',18],['Fanatec','Podium DD1',20],['Fanatec','Podium DD2',25],['Fanatec','Podium DD (2026)',25]
 ].map(([brand,name,nm])=>({brand,name,nm,verified:false})),
 lmuRanges:[[5,6,.8],[8,9,.85],[10,12,1],[15,18,.9],[20,25,.85],[27,30,.8]]
};
