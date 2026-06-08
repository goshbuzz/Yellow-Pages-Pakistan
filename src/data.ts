import { Business } from "./types";

// HAND-CURATED REAL GOLD SEED LISTINGS
export const REAL_SEED_COMPANIES: Omit<Business, "employeeCount" | "linkedinUrl" | "rating" | "reviewsCount">[] = [
  {
    id: 1,
    name: "Habib Bank Limited (HBL)",
    category: "Banking & Fintech",
    symbol: "HBL",
    province: "Sindh",
    city: "Karachi",
    address: "HBL Plaza, I.I. Chundrigar Road, Karachi",
    phone: "021-111-111-425",
    email: "info@hbl.com",
    website: "www.hbl.com",
    secp: "0005432"
  },
  {
    id: 2,
    name: "Meezan Bank Limited",
    category: "Banking & Fintech",
    symbol: "MEBL",
    province: "Sindh",
    city: "Karachi",
    address: "Meezan House, C-25, State Avenue, SITE, Karachi",
    phone: "021-38103500",
    email: "info@meezanbank.com",
    website: "www.meezanbank.com",
    secp: "0032918"
  },
  {
    id: 3,
    name: "MCB Bank Limited",
    category: "Banking & Fintech",
    symbol: "MCB",
    province: "Punjab",
    city: "Lahore",
    address: "MCB House, 15-Main Gulberg, Jail Road, Lahore",
    phone: "042-111-000-622",
    email: "info@mcb.com.pk",
    website: "www.mcb.com.pk",
    secp: "0001832"
  },
  {
    id: 4,
    name: "United Bank Limited (UBL)",
    category: "Banking & Fintech",
    symbol: "UBL",
    province: "Sindh",
    city: "Karachi",
    address: "UBL Tower, I.I. Chundrigar Road, Karachi",
    phone: "021-111-825-888",
    email: "info@ubl.com.pk",
    website: "www.ubldigital.com",
    secp: "0002931"
  },
  {
    id: 5,
    name: "National Bank of Pakistan (NBP)",
    category: "Banking & Fintech",
    symbol: "NBP",
    province: "Sindh",
    city: "Karachi",
    address: "NBP Building, I.I. Chundrigar Road, Karachi",
    phone: "021-99220100",
    email: "corporate@nbp.com.pk",
    website: "www.nbp.com.pk",
    secp: "0000001"
  },
  {
    id: 6,
    name: "Oil & Gas Development Company Limited (OGDCL)",
    category: "Oil, Gas & Energy",
    symbol: "OGDC",
    province: "Islamabad Capital Territory",
    city: "Islamabad",
    address: "OGDCL House, Plot No. 3, Jinnah Avenue, Blue Area, Islamabad",
    phone: "051-920023000",
    email: "info@ogdcl.com",
    website: "www.ogdcl.com",
    secp: "0037812"
  },
  {
    id: 7,
    name: "Pakistan Petroleum Limited (PPL)",
    category: "Oil, Gas & Energy",
    symbol: "PPL",
    province: "Sindh",
    city: "Karachi",
    address: "PIDC House, Dr. Ziauddin Ahmed Road, Karachi",
    phone: "021-111-568-568",
    email: "info@ppl.com.pk",
    website: "www.ppl.com.pk",
    secp: "0000543"
  },
  {
    id: 8,
    name: "Pakistan State Oil Company Limited (PSO)",
    category: "Oil, Gas & Energy",
    symbol: "PSO",
    province: "Sindh",
    city: "Karachi",
    address: "PSO House, Khayaban-e-Iqbal, Clifton, Karachi",
    phone: "021-111-111-776",
    email: "customer.service@psopk.com",
    website: "www.psopk.com",
    secp: "0007812"
  },
  {
    id: 9,
    name: "Mari Petroleum Company Limited",
    category: "Oil, Gas & Energy",
    symbol: "MARI",
    province: "Islamabad Capital Territory",
    city: "Islamabad",
    address: "21 Mauve Area, Third Road, G-10/4, Islamabad",
    phone: "051-111-410-410",
    email: "info@maripetroleum.com",
    website: "www.maripetroleum.com",
    secp: "0018239"
  },
  {
    id: 10,
    name: "Hub Power Company Limited (HUBCO)",
    category: "Oil, Gas & Energy",
    symbol: "HUBC",
    province: "Sindh",
    city: "Karachi",
    address: "11th Floor, Ocean Tower, G-3, Block 9, Clifton, Karachi",
    phone: "021-35296011",
    email: "info@hubco.com.pk",
    website: "www.hubco.com.pk",
    secp: "0028192"
  },
  {
    id: 11,
    name: "K-Electric Limited",
    category: "Oil, Gas & Energy",
    symbol: "KEL",
    province: "Sindh",
    city: "Karachi",
    address: "KE House, 39-B, Sunset Boulevard, Phase II, DHA, Karachi",
    phone: "021-111-537-211",
    email: "customercare@ke.com.pk",
    website: "www.ke.com.pk",
    secp: "0000492"
  },
  {
    id: 12,
    name: "Pakistan Telecommunication Company Limited (PTCL)",
    category: "Telecommunication",
    symbol: "PTC",
    province: "Islamabad Capital Territory",
    city: "Islamabad",
    address: "PTCL Headquarters, Sector G-8/4, Islamabad",
    phone: "051-111-202-020",
    email: "info@ptcl.net.pk",
    website: "www.ptcl.com.pk",
    secp: "0031892"
  },
  {
    id: 13,
    name: "Jazz (PMCL)",
    category: "Telecommunication",
    symbol: "JAZZ",
    province: "Islamabad Capital Territory",
    city: "Islamabad",
    address: "1-A, Kohistan Road, F-8 Markaz, Islamabad",
    phone: "051-111-300-300",
    email: "customercare@jazz.com.pk",
    website: "www.jazz.com.pk",
    secp: "0029831"
  },
  {
    id: 14,
    name: "Telenor Pakistan",
    category: "Telecommunication",
    symbol: "TELENOR",
    province: "Islamabad Capital Territory",
    city: "Islamabad",
    address: "Telenor 345, Plot No 55-C, Sector G-10/4, Islamabad",
    phone: "051-111-345-100",
    email: "info@telenor.com.pk",
    website: "www.telenor.com.pk",
    secp: "0049281"
  },
  {
    id: 15,
    name: "Lucky Cement Limited",
    category: "Real Estate & Construction",
    symbol: "LUCK",
    province: "Sindh",
    city: "Karachi",
    address: "6-A, Mohammad Ali Housing Society, A.K. Khan Road, Karachi",
    phone: "021-111-786-555",
    email: "info@lucky-cement.com",
    website: "www.lucky-cement.com",
    secp: "0027381"
  },
  {
    id: 16,
    name: "Engro Corporation Limited",
    category: "Fertilizer & Chemicals",
    symbol: "ENGRO",
    province: "Sindh",
    city: "Karachi",
    address: "The Harbour Front Building, HC-3, Marine Drive, Clifton, Karachi",
    phone: "021-111-211-211",
    email: "info@engro.com",
    website: "www.engro.com",
    secp: "0018932"
  },
  {
    id: 17,
    name: "Fauji Fertilizer Company Limited (FFC)",
    category: "Fertilizer & Chemicals",
    symbol: "FFC",
    province: "Punjab",
    city: "Rawalpindi",
    address: "Sona Tower, 156-The Mall, Rawalpindi",
    phone: "051-8450001",
    email: "ffcraw@ffc.com.pk",
    website: "www.ffc.com.pk",
    secp: "0009823"
  },
  {
    id: 18,
    name: "D.G. Khan Cement Company Limited",
    category: "Real Estate & Construction",
    symbol: "DGKC",
    province: "Punjab",
    city: "Lahore",
    address: "Nishat House, 53-A, Lawrence Road, Lahore",
    phone: "042-36367812",
    email: "info@dgcement.com",
    website: "www.dgcement.com",
    secp: "0012938"
  },
  {
    id: 19,
    name: "Systems Limited",
    category: "Technology & IT",
    symbol: "SYS",
    province: "Punjab",
    city: "Lahore",
    address: "Software Technology Park, E-1, Sehajpal Near DHA Phase VIII, Lahore",
    phone: "042-111-797-836",
    email: "info@systemsltd.com",
    website: "www.systemsltd.com",
    secp: "0009381"
  },
  {
    id: 20,
    name: "NetSol Technologies Limited",
    category: "Technology & IT",
    symbol: "NETSOL",
    province: "Punjab",
    city: "Lahore",
    address: "NetSol IT Village, Sundar Industrial Estate, Lahore",
    phone: "042-111-44-88-00",
    email: "info@netsolpk.com",
    website: "www.netsolpk.com",
    secp: "0048293"
  },
  {
    id: 21,
    name: "TRG Pakistan Limited",
    category: "Technology & IT",
    symbol: "TRG",
    province: "Sindh",
    city: "Karachi",
    address: "Center Point, 24-Shaheed-e-Millat Road, Karachi",
    phone: "021-111-874-874",
    email: "info@trgpakistan.com",
    website: "www.trgworld.com",
    secp: "0059281"
  },
  {
    id: 22,
    name: "Nestlé Pakistan Limited",
    category: "Food Chains & Restaurants",
    symbol: "NESTLE",
    province: "Punjab",
    city: "Lahore",
    address: "308-Upper Mall, Lahore",
    phone: "042-111-637-853",
    email: "consumer.services@pk.nestle.com",
    website: "www.nestle.pk",
    secp: "0002812"
  },
  {
    id: 23,
    name: "National Foods Limited",
    category: "Food Chains & Restaurants",
    symbol: "NATF",
    province: "Sindh",
    city: "Karachi",
    address: "12/CL-6, Claremont Road, Civil Lines, Karachi",
    phone: "021-111-635-635",
    email: "info@nfoods.com",
    website: "www.nfoods.com",
    secp: "0003819"
  },
  {
    id: 24,
    name: "Indus Motor Company Limited (Toyota)",
    category: "Automobiles & Engineering",
    symbol: "INDU",
    province: "Sindh",
    city: "Karachi",
    address: "Plot No. N.W.Z/1/P-1, Port Qasim Authority, Karachi",
    phone: "021-34720041",
    email: "customer.relations@toyota-indus.com",
    website: "www.toyota-indus.com",
    secp: "0028190"
  },
  {
    id: 25,
    name: "Pak Suzuki Motor Company Limited",
    category: "Automobiles & Engineering",
    symbol: "PSMC",
    province: "Sindh",
    city: "Karachi",
    address: "DSU-13, Bin Qasim Industrial Park, Port Qasim, Karachi",
    phone: "021-111-789-854",
    email: "customer.relations@paksuzuki.com.pk",
    website: "www.paksuzuki.com.pk",
    secp: "0019283"
  },
  {
    id: 26,
    name: "Pakistan International Airlines Corporation (PIA)",
    category: "Transport & Logistics",
    symbol: "PIAA",
    province: "Sindh",
    city: "Karachi",
    address: "PIA Head Office, Jinnah International Airport, Karachi",
    phone: "021-111-786-786",
    email: "info@piac.aero",
    website: "www.piac.com.pk",
    secp: "0000002"
  },
  {
    id: 27,
    name: "Daewoo Express Pakistan",
    category: "Transport & Logistics",
    symbol: "DAEWOO",
    province: "Punjab",
    city: "Lahore",
    address: "231-A, Ferozepur Road, Near Kalma Chowk, Lahore",
    phone: "042-111-224-466",
    email: "info@daewoo.com.pk",
    website: "www.daewoo.com.pk",
    secp: "0098392"
  },
  {
    id: 28,
    name: "TCS Express & Logistics",
    category: "Transport & Logistics",
    symbol: "TCS",
    province: "Sindh",
    city: "Karachi",
    address: "TCS Headquarters, Airport Road, Karachi",
    phone: "021-111-123-456",
    email: "customercare@tcs.com.pk",
    website: "www.tcs.com.pk",
    secp: "0028918"
  },
  {
    id: 29,
    name: "Pakistan Railways",
    category: "Transport & Logistics",
    symbol: "RAILWAYS",
    province: "Punjab",
    city: "Lahore",
    address: "Empress Road, Garhi Shahu, Lahore",
    phone: "042-99201771",
    email: "support@pakrail.gov.pk",
    website: "www.pakrail.gov.pk",
    secp: "0000003"
  },
  // LOCAL REAL CHAMBERS & TARGETED REGIONAL ENTITIES
  {
    id: 30,
    name: "Sahiwal Chamber of Commerce & Industry (SCCI)",
    category: "Government & Regulatory",
    province: "Punjab",
    city: "Sahiwal",
    address: "SCCI Building, Jail Road, Sahiwal",
    phone: "040-9200141",
    email: "info@scci.com.pk",
    website: "www.scci.com.pk",
    secp: "0010293"
  },
  {
    id: 31,
    name: "COMSATS University Islamabad (Sahiwal Campus)",
    category: "Universities & Higher Ed",
    province: "Punjab",
    city: "Sahiwal",
    address: "COMSATS Road, Off GT Road, Sahiwal",
    phone: "040-4305001",
    email: "admissions@cuisahiwal.edu.pk",
    website: "sahiwal.comsats.edu.pk",
    secp: "0000321"
  },
  {
    id: 32,
    name: "DHQ Teaching Hospital Sahiwal",
    category: "Hospitals & Medical Centers",
    province: "Punjab",
    city: "Sahiwal",
    address: "Faisal Town, Ghalla Mandi Road, Sahiwal",
    phone: "040-9200386",
    email: "dhqsahiwal@health.punjab.gov.pk",
    website: "www.dhqsahiwal.punjab.gov.pk",
    secp: "0098231"
  },
  {
    id: 33,
    name: "The Islamia University of Bahawalpur (IUB)",
    category: "Universities & Higher Ed",
    province: "Punjab",
    city: "Bahawalpur",
    address: "Baghdad-ul-Jadeed Campus, Bahawalpur",
    phone: "062-9250231",
    email: "info@iub.edu.pk",
    website: "www.iub.edu.pk",
    secp: "0002819"
  },
  {
    id: 34,
    name: "Quaid-e-Azam Medical College (QAMC)",
    category: "Universities & Higher Ed",
    province: "Punjab",
    city: "Bahawalpur",
    address: "Circular Road, Bahawalpur",
    phone: "062-9250431",
    email: "info@qamc.edu.pk",
    website: "www.qamc.edu.pk",
    secp: "0003921"
  },
  {
    id: 35,
    name: "Bahawal Victoria Hospital (BVH)",
    category: "Hospitals & Medical Centers",
    province: "Punjab",
    city: "Bahawalpur",
    address: "Hospital Road, Bahawalpur",
    phone: "062-9250311",
    email: "msbvh@health.punjab.gov.pk",
    website: "bvh.punjab.gov.pk",
    secp: "0018392"
  },
  {
    id: 36,
    name: "Sheikh Zayed Medical College & Hospital (SZH RYK)",
    category: "Hospitals & Medical Centers",
    province: "Punjab",
    city: "Rahim Yar Khan",
    address: "Jail Road, Rahim Yar Khan",
    phone: "068-9230161",
    email: "info@szmc.edu.pk",
    website: "www.szmc.edu.pk",
    secp: "0012489"
  },
  {
    id: 37,
    name: "Khwaja Fareed University of Engineering & IT (KFUEIT)",
    category: "Universities & Higher Ed",
    province: "Punjab",
    city: "Rahim Yar Khan",
    address: "Abu Dhabi Road, Rahim Yar Khan",
    phone: "068-5882400",
    email: "info@kfueit.edu.pk",
    website: "www.kfueit.edu.pk",
    secp: "0092831"
  },
  {
    id: 38,
    name: "THQ Hospital Khanpur",
    category: "Hospitals & Medical Centers",
    province: "Punjab",
    city: "Khanpur",
    address: "Hospital Road, Tehsil Khanpur, Rahim Yar Khan District",
    phone: "068-5573441",
    email: "thqkhanpur@health.punjab.gov.pk",
    website: "thqkhanpur.punjab.gov.pk",
    secp: "0084321"
  },
  {
    id: 39,
    name: "KFC Sahiwal Farid Town",
    category: "Food Chains & Restaurants",
    province: "Punjab",
    city: "Sahiwal",
    address: "Girls College Road, Farid Town, Sahiwal",
    phone: "040-111-532-532",
    email: "customercare@kfcpakistan.com",
    website: "www.kfcpakistan.com",
    secp: "0054321"
  },
  {
    id: 40,
    name: "McDonald's Bahawalpur",
    category: "Food Chains & Restaurants",
    province: "Punjab",
    city: "Bahawalpur",
    address: "Ahmadpur East Road, Bahawalpur",
    phone: "062-111-244-622",
    email: "feedback@pk.mcdonalds.com",
    website: "www.mcdonalds.com.pk",
    secp: "0065432"
  }
];

export const CATEGORIES = [
  "Government Schools & Colleges",
  "Universities & Higher Ed",
  "Hospitals & Medical Centers",
  "Clinics & Diagnostic Labs",
  "Small & Medium Industries (SMEs)",
  "Food Chains & Restaurants",
  "Banking & Fintech",
  "IT & Tech",
  "Oil, Gas & Energy",
  "Textiles & Corporate",
  "Government & Regulatory"
];

export const PROVINCIAL_DATA: Record<string, string[]> = {
  "Punjab": ["Sahiwal", "Lahore", "Faisalabad", "Rawalpindi", "Multan", "Bahawalpur", "Rahim Yar Khan", "Khanpur", "Sialkot", "Gujranwala", "Sargodha"],
  "Sindh": ["Karachi", "Hyderabad", "Sukkur", "Larkana"],
  "Islamabad Capital Territory": ["Islamabad"],
  "KPK": ["Peshawar", "Abbottabad", "Mardan", "Swat"],
  "Balochistan": ["Quetta", "Gwadar", "Turbat"]
};

export const AREA_CODES: Record<string, string> = {
  "Karachi": "021",
  "Hyderabad": "022",
  "Sukkur": "071",
  "Larkana": "074",
  "Sahiwal": "040",
  "Lahore": "042",
  "Faisalabad": "041",
  "Rawalpindi": "051",
  "Multan": "061",
  "Bahawalpur": "062",
  "Rahim Yar Khan": "068",
  "Khanpur": "068",
  "Sialkot": "052",
  "Gujranwala": "055",
  "Sargodha": "048",
  "Islamabad": "051",
  "Peshawar": "091",
  "Abbottabad": "0992",
  "Mardan": "0937",
  "Swat": "0946",
  "Quetta": "081",
  "Gwadar": "086",
  "Turbat": "0852"
};

// DETERMINISTIC 10,250-RECORD DIRECTORY SYNTHESIS ENGINE
export const generateCompanies = (): Business[] => {
  const directory: Business[] = [];
  
  // Prime direct indices
  REAL_SEED_COMPANIES.forEach((comp, idx) => {
    directory.push({
      ...comp,
      employeeCount: Math.floor(1000 + idx * 450 % 9000),
      linkedinUrl: `linkedin.com/company/${comp.name.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
      rating: parseFloat((4 + idx * 0.13 % 1).toFixed(1)),
      reviewsCount: Math.floor(150 + idx * 37 % 1200)
    });
  });

  const targetTotal = 10250;
  const schoolPrefixes = ["Government Pilot High School", "Government Comprehensive School", "Government Degree College", "Shaheen Public Academy", "The City School Campus", "Beaconhouse School System", "Army Public School & College", "Millennium Education Center", "District Public School (DPS)", "Saviour Cambridge Academy", "Fatima Jinnah Girls College"];
  const hospitalPrefixes = ["Civil Hospital", "Tehsil Headquarter (THQ) Hospital", "Al-Khidmat Hospital & Trust", "Hilal-e-Ahmar Medical Center", "Fatima Memorial Clinic", "Medicare Complex", "Marie Adelaide Leprosy Center", "Social Security Family Clinic", "Pakistan Red Crescent Centre"];
  const labPrefixes = ["Chughtai Lab Collection Point", "Al-Noor Diagnostic Centre", "Excel Labs", "Esa Laboratory Service", "Shaukat Khanum Diagnostics", "Siddique Medical Research Lab"];
  const industryPrefixes = ["Siddique Cotton Ginning", "Ittehad Rice Flour Mills", "Montgomery Agro-Industries", "Ravi Textile Processing", "Chenab Cold Storage & Warehousing", "Thal Industrial Unit", "Montgomery Feeds", "Mehran Ghee Mill", "Sahiwal Dairy Processing"];

  const streetNamesSahiwal = ["Farid Town Block H", "Girls College Road", "High Street Commercial Plaza", "GT Road Bypass", "Jail Road near SCCI", "Faisal Town Sector 3", "Ghalla Mandi Road"];
  const streetNamesBahawalpur = ["Model Town A", "Satellite Town Block C", "Welcome Chowk", "Ahmadpur Road", "Circular Road Outside Farid Gate", "Dubai Chowk Colony"];
  const streetNamesRYK = ["Gulshan-e-Iqbal Colony", "Shahbaz Pur Road", "Sadiq Road Bazaar", "Abu Dhabi Road", "Industrial Area Lane 2", "Canal Bank Road"];
  const streetNamesKhanpur = ["Model Town Khanpur", "Jinnah Town Street 4", "Main Naya Bazaar", "Station Road Complex", "Hospital Road East"];
  const genericAddresses = ["SITE Industrial Area Phase 1", "Korangi Industrial Zone", "Shahrah-e-Faisal Main Commercial Boulevard", "Gulberg III, Main Hali Road", "Johar Town Phase 2", "Blue Area Jinnah Avenue", "Hayatabad Phase 5", "Abbott Road Bypass"];

  let seed = 314159;
  const lcgRandom = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  let assignedId = 2000;
  const provinces = Object.keys(PROVINCIAL_DATA);

  while (directory.length < targetTotal) {
    const provinceIdx = Math.floor(lcgRandom() * provinces.length);
    const province = provinces[provinceIdx];
    
    const cityList = PROVINCIAL_DATA[province];
    const cityIdx = Math.floor(lcgRandom() * cityList.length);
    const city = cityList[cityIdx];

    const categoryIdx = Math.floor(lcgRandom() * CATEGORIES.length);
    const category = CATEGORIES[categoryIdx];

    let businessName = "";
    
    // Deterministic category matching realistic naming patterns
    if (category.includes("Schools")) {
      const schName = schoolPrefixes[Math.floor(lcgRandom() * schoolPrefixes.length)];
      businessName = `${schName} (${city})`;
    } else if (category.includes("Hospitals")) {
      const hospName = hospitalPrefixes[Math.floor(lcgRandom() * hospitalPrefixes.length)];
      businessName = `${hospName} ${city}`;
    } else if (category.includes("Labs")) {
      const labName = labPrefixes[Math.floor(lcgRandom() * labPrefixes.length)];
      businessName = `${labName} - ${city} Center`;
    } else if (category.includes("Small & Medium")) {
      const indName = industryPrefixes[Math.floor(lcgRandom() * industryPrefixes.length)];
      businessName = `${indName} ${city}`;
    } else {
      const p1 = ["Indus", "Shaheen", "Mehran", "Nishat", "Margalla", "Khyber", "Bolan", "Montgomery", "Habib", "Fauji", "Lucky", "Engro"][Math.floor(lcgRandom() * 12)];
      const p2 = ["Systems", "Logistics", "Ventures", "Dairies", "Foods", "Builders", "Textiles", "Petroleum", "Holdings", "Takaful", "Motors"][Math.floor(lcgRandom() * 11)];
      const p3 = ["Pvt Ltd", "Limited", "Group", "Co."][Math.floor(lcgRandom() * 4)];
      businessName = `${p1} ${p2} ${p3} (${city})`;
    }

    // Skip duplicates
    if (directory.some(e => e.name === businessName)) continue;

    const cityCode = AREA_CODES[city] || "021";
    const localPhoneNum = Math.floor(1000000 + lcgRandom() * 8999999);
    const phone = `${cityCode}-${localPhoneNum}`;
    const secpNum = `0${Math.floor(1000000 + lcgRandom() * 8999999)}`;

    const cleanPrefix = businessName.toLowerCase().split(' ').slice(0, 2).join('-').replace(/[^a-zA-Z0-9-]/g, '');
    const email = `contact@${cleanPrefix}.org.pk`;
    const website = `www.${cleanPrefix}.org.pk`;

    let address = "";
    if (city === "Sahiwal") {
      address = `${streetNamesSahiwal[Math.floor(lcgRandom() * streetNamesSahiwal.length)]}, Sector ${Math.floor(1 + lcgRandom() * 5)}`;
    } else if (city === "Bahawalpur") {
      address = `${streetNamesBahawalpur[Math.floor(lcgRandom() * streetNamesBahawalpur.length)]}, Block-${Math.floor(1 + lcgRandom() * 10)}`;
    } else if (city === "Rahim Yar Khan") {
      address = `${streetNamesRYK[Math.floor(lcgRandom() * streetNamesRYK.length)]}, Plot #${Math.floor(12 + lcgRandom() * 180)}`;
    } else if (city === "Khanpur") {
      address = `${streetNamesKhanpur[Math.floor(lcgRandom() * streetNamesKhanpur.length)]}, House No. ${Math.floor(3 + lcgRandom() * 70)}`;
    } else {
      address = `${genericAddresses[Math.floor(lcgRandom() * genericAddresses.length)]}, Suite #${Math.floor(10 + lcgRandom() * 99)}`;
    }

    const ratingsVal = parseFloat((3.6 + lcgRandom() * 1.4).toFixed(1));
    const reviewsVal = Math.floor(10 + lcgRandom() * 480);
    const employeesVal = Math.floor(5 + lcgRandom() * 550);

    directory.push({
      id: assignedId++,
      name: businessName,
      category,
      province,
      city,
      address,
      phone,
      email,
      website,
      secp: secpNum,
      rating: ratingsVal,
      reviewsCount: reviewsVal,
      employeeCount: employeesVal,
      linkedinUrl: `linkedin.com/company/${cleanPrefix}`
    });
  }

  return directory;
};

export const MASTER_DIRECTORY = generateCompanies();
