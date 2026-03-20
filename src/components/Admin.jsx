import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, orderBy, query } from 'firebase/firestore';

const ACCESS_CODE = '54245';

const STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-700' },
  { value: 'contacted', label: 'Contacted', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'met', label: 'Met With', color: 'bg-purple-100 text-purple-700' },
  { value: 'moving_forward', label: 'Moving Forward', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'closed', label: 'Closed', color: 'bg-green-100 text-green-800' },
  { value: 'not_qualified', label: 'Not Qualified', color: 'bg-gray-100 text-gray-500' },
];

function getStatusStyle(status) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.color || 'bg-gray-100 text-gray-500';
}

function getStatusLabel(status) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label || status || 'New';
}

function formatDate(timestamp) {
  if (!timestamp) return '—';
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

const FIELD_LABELS = {
  motivation: 'Situation',
  searcher_type: 'Type',
  industry: 'Industry',
  target_sde: 'Target SDE',
  target_revenue: 'Target Revenue',
  deal_size: 'Deal Size',
  liquid_cash: 'Liquid Cash',
  location: 'Location',
  readiness: 'Readiness',
  us_resident: 'US Resident',
  current_search: 'Current Search',
  program: 'Program',
  name: 'First Name',
  fullName: 'Full Name',
  email: 'Email',
  phone: 'Phone',
};

const FUNNEL_STEPS = [
  { id: 'page_visit', label: 'Page Visit' },
  { id: 'contact', label: 'Submitted Info' },
  { id: 'motivation', label: 'Situation' },
  { id: 'searcher_type', label: 'Type' },
  { id: 'industry', label: 'Industry' },
  { id: 'deal_size', label: 'Deal Size' },
  { id: 'readiness', label: 'Readiness' },
  { id: 'program', label: 'Program' },
];

// --- Demo Data Generation ---

const ON_MARKET_STEPS = [
  { key: 'scraped', label: 'Listing Scraped' },
  { key: 'texted', label: 'Text Sent' },
  { key: 'no_response', label: 'No Response (10 min)' },
  { key: 'called', label: 'Called' },
  { key: 'meeting_booked', label: 'Meeting Booked' },
  { key: 'loi_submitted', label: 'LOI Submitted' },
];

const OFF_MARKET_STEPS = [
  { key: 'identified', label: 'Owner Identified' },
  { key: 'called', label: 'Call Made' },
  { key: 'conversation_had', label: 'Conversation Had' },
  { key: 'meeting_booked', label: 'Meeting Booked' },
  { key: 'loi_submitted', label: 'LOI Submitted' },
];

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia',
  'Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland',
  'Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey',
  'New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina',
  'South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming',
];

const STATE_ABBREVS = {
  'Alabama':'AL','Alaska':'AK','Arizona':'AZ','Arkansas':'AR','California':'CA','Colorado':'CO','Connecticut':'CT','Delaware':'DE','Florida':'FL','Georgia':'GA',
  'Hawaii':'HI','Idaho':'ID','Illinois':'IL','Indiana':'IN','Iowa':'IA','Kansas':'KS','Kentucky':'KY','Louisiana':'LA','Maine':'ME','Maryland':'MD',
  'Massachusetts':'MA','Michigan':'MI','Minnesota':'MN','Mississippi':'MS','Missouri':'MO','Montana':'MT','Nebraska':'NE','Nevada':'NV','New Hampshire':'NH','New Jersey':'NJ',
  'New Mexico':'NM','New York':'NY','North Carolina':'NC','North Dakota':'ND','Ohio':'OH','Oklahoma':'OK','Oregon':'OR','Pennsylvania':'PA','Rhode Island':'RI','South Carolina':'SC',
  'South Dakota':'SD','Tennessee':'TN','Texas':'TX','Utah':'UT','Vermont':'VT','Virginia':'VA','Washington':'WA','West Virginia':'WV','Wisconsin':'WI','Wyoming':'WY',
};

const STATE_CITIES = {
  'AL':['Birmingham','Huntsville','Mobile'],'AK':['Anchorage','Fairbanks','Juneau'],'AZ':['Phoenix','Tucson','Scottsdale'],'AR':['Little Rock','Fayetteville','Fort Smith'],
  'CA':['San Diego','Sacramento','Fresno','San Jose','Los Angeles'],'CO':['Denver','Colorado Springs','Boulder'],'CT':['Hartford','New Haven','Stamford'],'DE':['Wilmington','Dover','Newark'],
  'FL':['Tampa','Jacksonville','Orlando','Miami','Fort Lauderdale'],'GA':['Atlanta','Savannah','Augusta'],'HI':['Honolulu','Maui','Kailua'],'ID':['Boise','Meridian','Nampa'],
  'IL':['Chicago','Springfield','Naperville'],'IN':['Indianapolis','Fort Wayne','Carmel'],'IA':['Des Moines','Cedar Rapids','Davenport'],'KS':['Wichita','Overland Park','Kansas City'],
  'KY':['Louisville','Lexington','Bowling Green'],'LA':['New Orleans','Baton Rouge','Shreveport'],'ME':['Portland','Bangor','Lewiston'],'MD':['Baltimore','Bethesda','Annapolis'],
  'MA':['Boston','Worcester','Cambridge'],'MI':['Detroit','Grand Rapids','Ann Arbor'],'MN':['Minneapolis','St. Paul','Rochester'],'MS':['Jackson','Gulfport','Hattiesburg'],
  'MO':['Kansas City','St. Louis','Springfield'],'MT':['Billings','Missoula','Great Falls'],'NE':['Omaha','Lincoln','Bellevue'],'NV':['Las Vegas','Reno','Henderson'],
  'NH':['Manchester','Nashua','Concord'],'NJ':['Newark','Jersey City','Princeton'],'NM':['Albuquerque','Santa Fe','Las Cruces'],'NY':['New York','Buffalo','Albany','Rochester'],
  'NC':['Charlotte','Raleigh','Durham'],'ND':['Fargo','Bismarck','Grand Forks'],'OH':['Columbus','Cleveland','Cincinnati'],'OK':['Oklahoma City','Tulsa','Norman'],
  'OR':['Portland','Eugene','Salem'],'PA':['Philadelphia','Pittsburgh','Allentown'],'RI':['Providence','Warwick','Cranston'],'SC':['Charleston','Columbia','Greenville'],
  'SD':['Sioux Falls','Rapid City','Aberdeen'],'TN':['Nashville','Memphis','Knoxville'],'TX':['Austin','Dallas','Houston','San Antonio','Fort Worth'],
  'UT':['Salt Lake City','Provo','Ogden'],'VT':['Burlington','Montpelier','Rutland'],'VA':['Richmond','Virginia Beach','Arlington'],'WA':['Seattle','Tacoma','Spokane'],
  'WV':['Charleston','Huntington','Morgantown'],'WI':['Milwaukee','Madison','Green Bay'],'WY':['Cheyenne','Casper','Laramie'],
};

const INDUSTRIES = [
  'HVAC','Plumbing','Electrical','Roofing','Landscaping','Pest Control','Pool Services','Painting','Flooring',
  'General Contracting','Garage Doors','Fencing','Tree Service','Pressure Washing','Insulation','Window Cleaning',
  'Janitorial / Commercial Cleaning','Carpet Cleaning','Fire Protection','Septic Services',
  'Auto Body & Collision','Auto Repair & Maintenance','Tire & Wheel','Car Wash','Towing','Transmission Repair',
  'Manufacturing','Metal Fabrication','CNC Machining','Plastic Molding','Food Manufacturing','Packaging',
  'Trucking & Freight','Moving & Storage','Courier Services','Waste Management','Recycling',
  'Dental Practice','Veterinary Clinic','Physical Therapy','Home Health Care','Pharmacy','Medical Equipment',
  'IT Services','Managed IT','Cybersecurity','Software Development',
  'Accounting & Bookkeeping','Staffing & Recruiting','Insurance Agency','Digital Marketing Agency',
  'Daycare & Childcare','Tutoring & Education','Fitness & Gym','Salon & Spa','Dry Cleaning & Laundry',
  'Restaurant & Food Service','Catering','Bakery','Coffee Shop',
  'Property Management','Self Storage','Commercial Real Estate Services',
  'Printing & Signage','Industrial Supply','Safety & Compliance Services',
  'Environmental Services','Water Treatment','Demolition','Concrete & Masonry',
  'Security Services','Alarm & Surveillance','Locksmith',
  'Welding','Machine Shop','HVAC Distribution','Plumbing Supply',
  'Agriculture & Farming','Nursery & Garden Center','Pet Services',
];

const INDUSTRY_NAMES = {
  'HVAC': ['Summit HVAC','Comfort Air Solutions','Arctic Breeze Heating & Cooling','ProTemp Climate','AllSeason HVAC','Reliable Air Systems','TrueComfort Mechanical','Peak Performance HVAC','CoolWave Air','Heritage Heating & Air'],
  'Plumbing': ['Reliable Plumbing','FlowRight Plumbing','ClearDrain Plumbing Co.','AquaPipe Solutions','TruFlow Plumbing','Precision Pipe & Drain','AllClear Plumbing','BlueLine Plumbing','PipeMaster Services','WaterWorks Plumbing'],
  'Electrical': ['Apex Electrical','BrightWire Electric','PowerUp Electrical','CurrentFlow Electric','VoltEdge Electrical','SafeCircuit Electric','ProWire Electrical','SparkPoint Electric','TrueLine Electrical','AmperAge Electric'],
  'Roofing': ['Mountain View Roofing','SkyShield Roofing','TopGuard Roofing Co.','Pinnacle Roofing','StormProof Roofing','Heritage Roofing','TrueTop Roofing','RidgeLine Roofing','AllWeather Roofing','Ironclad Roofing'],
  'Landscaping': ['Greenfield Landscaping','ProScape Landscaping','EverGreen Grounds','TerraForm Landscaping','NatureCraft Landscape','Prestige Lawn & Garden','GreenEdge Landscaping','BlueRidge Landscaping','SunValley Grounds','Horizon Landscaping'],
  'Pest Control': ['Tri-State Pest Control','GuardLine Pest Solutions','ShieldPest Services','BugFree Pest Control','SafeHome Pest Solutions','TruGuard Pest Control','ClearZone Pest','PestShield Pro','DefendAll Pest','NoPest Solutions'],
  'Pool Services': ['Sunshine Pool & Spa','CrystalClear Pool Care','AquaBlue Pool Services','ProPool Maintenance','BlueWave Pool Co.','SparklePool Services','PrimePool Care','ClearWater Pools','AquaPro Pool Services','TrueBlue Pool'],
  'Painting': ['ProCoat Painting','FreshFinish Painting','TrueColor Painters','PrimeLine Painting','BrightCoat Painting Co.','Heritage Painting','AllPro Painting','PrecisionCoat Painters','ColorCraft Painting','MasterStroke Painting'],
  'Flooring': ['ProFloor Installations','TrueStep Flooring','PrimeFloor Co.','AllSurface Flooring','PrecisionFloor Services','Heritage Flooring','CraftFloor Installations','Foundation Flooring','SolidStep Flooring','TopFloor Contractors'],
  'General Contracting': ['Cornerstone Builders','TrueForm Construction','AllBuild Contractors','PrimeBuild Co.','Heritage Construction','ProBuild Contractors','Keystone General Contracting','SolidRock Builders','Benchmark Construction','TrustBuild Contractors'],
  'Garage Doors': ['ProLift Garage Doors','AllAccess Door Co.','TrueOpen Garage Doors','PrecisionDoor Services','LiftMaster Garage Co.','GateCraft Doors','SwiftLift Garage','OpenWay Door Services','DoorPro Solutions','ReliaDoor Co.'],
  'Fencing': ['IronGuard Fencing','ProFence Solutions','TrueLine Fencing','BorderCraft Fencing','AllSecure Fence Co.','Heritage Fencing','PrimeFence Contractors','SteelEdge Fencing','GuardLine Fence','FenceWorks Pro'],
  'Tree Service': ['ArborCare Tree Service','TopCut Tree Specialists','TrueTimber Tree','Canopy Tree Services','AllGreen Tree Care','SkyReach Tree Service','ProArb Tree Co.','WoodCraft Tree Service','Heritage Tree Care','DeepRoot Tree Service'],
  'Pressure Washing': ['PowerClean Pressure Washing','SprayPro Services','TrueClean Power Wash','PrimeWash Co.','AllClean Pressure Services','BlastClean Pro','ClearCoat Washing','JetWash Solutions','PureForce Washing','SurfaceClean Pro'],
  'Insulation': ['ProBarrier Insulation','TrueTemp Insulation','AllSeal Insulation Co.','HeatShield Insulation','PrimeInsulate Services','ComfortSeal Insulation','ThermoGuard Insulation','EcoBarrier Insulation','CoreTemp Insulation','SafeSeal Insulation'],
  'Window Cleaning': ['CrystalClear Window Cleaning','SparkleView Windows','TrueShine Window Co.','ProPane Window Services','ClearSight Window Cleaning','BrightView Windows','AllClear Window Co.','ShineRight Windows','PureView Cleaning','GlassPro Window'],
  'Janitorial / Commercial Cleaning': ['Pacific Coast Cleaning','ProShine Janitorial','TrueClean Commercial','AllBright Cleaning Co.','PrimeClean Services','SpotlessPro Janitorial','ClearSpace Cleaning','Heritage Cleaning Services','FreshStart Janitorial','MasterClean Commercial'],
  'Carpet Cleaning': ['DeepClean Carpet Care','ProFiber Carpet Cleaning','TrueClean Carpet Co.','FreshFiber Services','AllClean Carpet Care','PrimeCarpet Cleaners','SpotFree Carpet','PureSoft Carpet Cleaning','CarpetPro Solutions','SteamRight Carpet'],
  'Fire Protection': ['FireShield Services','AllSafe Fire Protection','TrueGuard Fire Systems','ProFire Solutions','SafePoint Fire Protection','FireWatch Pro','BlazeSafe Systems','RedLine Fire Protection','FirstAlert Fire Co.','ShieldFire Services'],
  'Septic Services': ['ClearFlow Septic','ProDrain Septic Services','TruePump Septic Co.','AllClear Septic Solutions','PrimeSeptic Services','DrainRight Septic','FlowMaster Septic','ReliaSeptic Co.','DeepDrain Septic','SafeFlow Septic'],
  'Auto Body & Collision': ['Northeast Auto Body','ProFinish Collision','TrueForm Auto Body','PrecisionBody Works','AllRestore Auto Body','Heritage Auto Body','PrimeDent Collision','CraftAuto Body Shop','MasterBody Works','AutoEdge Collision'],
  'Auto Repair & Maintenance': ['TrueWrench Auto Repair','ProMech Auto Services','AllTune Auto Repair','Precision Auto Care','ReliAuto Mechanics','Heritage Auto Repair','PrimeTech Auto','MasterMech Services','FastLane Auto Repair','TrustAuto Maintenance'],
  'Tire & Wheel': ['ProTire & Wheel','AllGrip Tire Co.','TrueRoll Tire Services','PrimeTread Tire','TireMax Pro','WheelWorks Tire','FastTrack Tire Co.','GripRight Tires','SteadyRoll Tire','TireEdge Services'],
  'Car Wash': ['SparkleWash Auto Spa','ProShine Car Wash','TrueGloss Car Wash','CrystalClean Auto','AllShine Car Wash','PrimeWash Auto Spa','SplashZone Car Wash','GleamPro Car Wash','AquaShine Car Wash','ShineMaster Auto'],
  'Towing': ['QuickHook Towing','ProTow Services','TrueHaul Towing','AllRescue Towing','PrimeTow Co.','ReliaTow Services','RapidHook Towing','SafeTow Pro','LiftLine Towing','HeavyDuty Towing'],
  'Transmission Repair': ['ProShift Transmission','TrueGear Transmission','AllDrive Transmission','PrecisionShift Auto','PrimeTrans Services','GearMaster Transmission','ShiftRight Auto','TransPro Repair','CoreDrive Transmission','ReliaTrans Co.'],
  'Manufacturing': ['Precision Metal Fabrication','ProBuild Manufacturing','TrueCraft Industries','AllMake Manufacturing','PrimeParts Manufacturing','Heritage Manufacturing','CoreTech Manufacturing','SolidForm Industries','MasterCraft Mfg','BenchMark Manufacturing'],
  'Metal Fabrication': ['IronEdge Fabrication','ProWeld Metal Works','TrueSteel Fabrication','AllMetal Fabricators','PrimeCut Metal','ForgeWorks Fabrication','SteelCraft Fabrication','MetalPro Solutions','CoreSteel Fabrication','HeavyMetal Works'],
  'CNC Machining': ['PrecisionCNC Works','ProMill CNC','TrueCut Machining','AllAxis CNC','PrimeMachine Co.','CoreCut CNC','MasterMill Machining','ToolEdge CNC','SpindlePro CNC','AccuCut Machining'],
  'Plastic Molding': ['ProMold Plastics','TrueForm Molding','AllCast Plastics','PrimeMold Co.','CorePlast Molding','MasterMold Industries','FormRight Plastics','MoldPro Solutions','ShapeCraft Plastics','PrecisionMold Co.'],
  'Food Manufacturing': ['FreshSource Foods','ProHarvest Manufacturing','TrueTaste Foods','AllNatural Food Co.','PrimeChoice Foods','Heritage Food Manufacturing','CoreFresh Foods','FlavorCraft Manufacturing','PureBatch Foods','GoldenHarvest Mfg'],
  'Packaging': ['ProPack Solutions','TrueWrap Packaging','AllBox Packaging Co.','PrimePack Industries','CorePack Solutions','SmartPack Co.','WrapRight Packaging','BoxCraft Packaging','SealPro Packaging','SwiftPack Industries'],
  'Trucking & Freight': ['CrossCountry Freight','ProHaul Trucking','TrueRoute Logistics','AllMiles Trucking','PrimeFreight Co.','Highway Trucking Services','CoreHaul Freight','SwiftLine Trucking','ReliRoute Freight','HeavyHaul Trucking'],
  'Moving & Storage': ['ProMove Services','TruePack Moving','AllSet Moving & Storage','PrimeMove Co.','SwiftShift Moving','ReliMove Services','CorePack Moving','SafeStore Moving','BoxRight Moving','MasterMove Co.'],
  'Courier Services': ['QuickDrop Courier','ProDeliver Services','TrueRoute Courier','AllSpeed Courier','PrimeRun Delivery','SwiftDrop Courier','CoreDeliver Co.','RapidRoute Courier','FastTrack Delivery','ReliDeliver Services'],
  'Waste Management': ['CleanStream Waste','ProDispose Services','TrueGreen Waste Mgmt','AllClear Waste Solutions','PrimeWaste Co.','CoreClean Waste','EcoDispose Services','GreenRoute Waste','SafeStream Waste','ReliWaste Solutions'],
  'Recycling': ['GreenCycle Recycling','ProReclaim Services','TrueLoop Recycling','AllGreen Recycling','PrimeCycle Co.','CoreRecycle Solutions','EcoLoop Recycling','ReClaimPro Services','PureStream Recycling','RenewCycle Co.'],
  'Dental Practice': ['BrightSmile Dental','ProCare Dental Group','TrueSmile Dentistry','AllCare Dental','PrimeDental Practice','Heritage Dental','CoreSmile Dental','FreshStart Dental','SmileCraft Dentistry','PrecisionDental Group'],
  'Veterinary Clinic': ['PawsCare Veterinary','ProPet Vet Clinic','TruePaws Veterinary','AllPets Vet Care','PrimeVet Clinic','Heritage Veterinary','CorePet Vet Services','FurFirst Vet Clinic','AnimalCare Veterinary','PawsPro Vet'],
  'Physical Therapy': ['ProMotion Physical Therapy','TrueForm PT','AllMove Physical Therapy','PrimeFlex PT','CoreStrength PT','ActiveCare Physical Therapy','FlexPoint PT','MotionPro Physical Therapy','PeakForm PT','VitalMove Physical Therapy'],
  'Home Health Care': ['CareFirst Home Health','ProCare Home Services','TrueCare Home Health','AllHeart Home Care','PrimeCare Home Health','Heritage Home Care','CoreCare Home Services','ComfortFirst Home Health','SafeHands Home Care','ReliCare Home Health'],
  'Pharmacy': ['TrueCare Pharmacy','ProScript Pharmacy','AllHealth Pharmacy','PrimeFill Pharmacy','CoreCare Pharmacy','Heritage Pharmacy','FreshScript Pharmacy','MediPro Pharmacy','SafeFill Pharmacy','WellPoint Pharmacy'],
  'Medical Equipment': ['ProMed Equipment','TrueHealth Supplies','AllMed Equipment Co.','PrimeMed Supplies','CoreHealth Equipment','MedEdge Supplies','SafeMed Equipment','ReliMed Co.','HealthCraft Equipment','MedPro Supply'],
  'IT Services': ['ProByte IT Services','TrueTech IT Solutions','AllNet IT Services','PrimeTech IT','CoreByte IT','ByteEdge IT Services','TechCraft Solutions','NetPro IT Services','SecureNet IT','ReliTech IT Solutions'],
  'Managed IT': ['ShieldNet Managed IT','ProManage IT','TrueNet Managed Services','AllSecure Managed IT','PrimeNet IT Management','CoreManage IT','NetGuard Managed IT','TechShield Managed Services','ByteGuard IT','SecureManage IT'],
  'Cybersecurity': ['CyberShield Security','ProGuard Cyber','TrueSafe Cybersecurity','AllSecure Cyber','PrimeCyber Solutions','CoreSafe Cybersecurity','NetDefend Security','CyberEdge Solutions','ShieldByte Cyber','SafeNet Cybersecurity'],
  'Software Development': ['CodeCraft Software','ProDev Solutions','TrueCode Software','AllStack Development','PrimeDev Co.','CoreCode Software','ByteCraft Development','DevEdge Solutions','CodePro Software','StackBuild Development'],
  'Accounting & Bookkeeping': ['TrueBooks Accounting','ProLedger Services','AllCount Bookkeeping','PrimeBooks Accounting','CoreCount Financial','LedgerCraft Accounting','NumbersPro Bookkeeping','AccuBooks Services','SafeLedger Accounting','ReliCount Financial'],
  'Staffing & Recruiting': ['TalentBridge Staffing','ProHire Recruiting','TrueMatch Staffing','AllTalent Recruiting','PrimeHire Staffing','CoreTalent Recruiting','HireCraft Staffing','StaffEdge Recruiting','SwiftHire Staffing','ReliStaff Recruiting'],
  'Insurance Agency': ['TrueShield Insurance','ProCover Agency','AllGuard Insurance','PrimeSafe Insurance','CoreCover Agency','ShieldCraft Insurance','SafeHaven Insurance','InsurePro Agency','GuardPoint Insurance','ReliCover Insurance'],
  'Digital Marketing Agency': ['BrightPixel Marketing','ProReach Digital','TrueClick Marketing','AllGrowth Digital','PrimeReach Agency','CoreClick Marketing','PixelCraft Digital','GrowthEdge Marketing','ClickPro Agency','ReliReach Digital'],
  'Daycare & Childcare': ['Sunshine Daycare','ProKids Childcare','TrueCare Kids','AllStars Daycare','PrimeKids Childcare','Heritage Daycare','BrightStart Childcare','LittleSteps Daycare','HappyHeart Childcare','SafeNest Daycare'],
  'Tutoring & Education': ['BrightMinds Tutoring','ProLearn Education','TrueSkill Tutoring','AllGrades Education','PrimeLearn Tutoring','CoreSkill Education','LearnCraft Tutoring','MindEdge Education','SkillPro Tutoring','BrightPath Education'],
  'Fitness & Gym': ['PeakFit Gym','ProStrength Fitness','TrueGrit Fitness','AllFlex Gym','PrimeFit Fitness','CorePower Gym','FitCraft Fitness','IronEdge Gym','FlexPro Fitness','StrongPoint Gym'],
  'Salon & Spa': ['Radiance Salon & Spa','ProGlow Salon','TrueBeauty Spa','AllGlam Salon','PrimeGlow Salon & Spa','Heritage Salon','GlowCraft Spa','BlissPoint Salon','LuxeEdge Salon & Spa','SereneSpa'],
  'Dry Cleaning & Laundry': ['FreshPress Dry Cleaning','ProClean Laundry','TruePress Cleaners','AllFresh Dry Cleaning','PrimePress Laundry','SpotlessPro Cleaners','CrispClean Laundry','CleanCraft Dry Cleaning','FreshFold Laundry','QuickPress Cleaners'],
  'Restaurant & Food Service': ['Golden Fork Restaurant','ProTaste Food Service','TrueFlavor Kitchen','AllSpice Restaurant','PrimePlate Food Service','Heritage Kitchen','FlavorCraft Restaurant','TasteEdge Food Service','FreshPlate Kitchen','CulinaryPro Restaurant'],
  'Catering': ['EliteTable Catering','ProFeast Catering','TrueTaste Catering','AllOccasion Catering','PrimeFeast Co.','Heritage Catering','FlavorCraft Catering','EventEdge Catering','FreshFeast Catering','CulinaryPro Catering'],
  'Bakery': ['Golden Crust Bakery','ProBake Co.','TrueCrust Bakery','AllRise Bakery','PrimeBake Co.','Heritage Bakery','CrustCraft Bakery','FreshRise Bakery','OvenEdge Bakery','BakePro Co.'],
  'Coffee Shop': ['Bean & Brew Coffee','ProRoast Coffee','TrueBrew Coffee Co.','AllBean Coffee','PrimeBrew Coffee','Heritage Coffee Co.','BrewCraft Coffee','CupEdge Coffee','FreshBean Coffee','RoastPro Coffee'],
  'Property Management': ['KeyStone Property Mgmt','ProManage Properties','TrueHome Property Mgmt','AllPoint Property','PrimeProperty Management','CoreHome Properties','ManageCraft Property','HomeEdge Property Mgmt','SafeHome Properties','ReliProperty Management'],
  'Self Storage': ['SecureBox Storage','ProStore Self Storage','TrueKeep Storage','AllSafe Storage','PrimeBox Self Storage','CoreKeep Storage','StoreCraft Storage','LockEdge Self Storage','SafeStore Storage','ReliBox Storage'],
  'Commercial Real Estate Services': ['PrimeLot Commercial','ProSpace Realty','TrueCommercial Realty','AllPoint Commercial','CoreSpace Commercial','LotCraft Realty','SpaceEdge Commercial','KeyCommercial Realty','SafeLot Commercial','ReliSpace Realty'],
  'Printing & Signage': ['ProPrint & Sign','TrueMark Printing','AllSign Graphics','PrimePrint Co.','CoreMark Signage','PrintCraft Co.','SignEdge Graphics','BrightMark Printing','InkPro Signage','ReliPrint Co.'],
  'Industrial Supply': ['ProSupply Industrial','TrueStock Industrial','AllParts Supply','PrimeSource Industrial','CoreSupply Co.','StockCraft Industrial','SupplyEdge Industrial','SafeStock Supply','ReliParts Industrial','BulkPro Supply'],
  'Safety & Compliance Services': ['SafeFirst Compliance','ProSafe Services','TrueCompliance Co.','AllSafe Compliance','PrimeSafe Services','CoreCompliance Co.','SafeCraft Services','CompliEdge Solutions','GuardPro Compliance','ReliSafe Services'],
  'Environmental Services': ['Cascade Environmental','ProGreen Environmental','TrueEco Services','AllClean Environmental','PrimeEco Services','CoreGreen Environmental','EcoCraft Services','GreenEdge Environmental','SafeEco Services','ReliGreen Environmental'],
  'Water Treatment': ['PureFlow Water Treatment','ProWater Solutions','TrueFlow Water','AllClear Water Treatment','PrimeWater Co.','CoreFlow Water','WaterCraft Treatment','FlowEdge Water','SafeWater Solutions','ReliFlow Water Treatment'],
  'Demolition': ['ProDemo Services','TrueWreck Demolition','AllClear Demo','PrimeDemo Co.','CoreDemo Services','DemoCraft Co.','WreckEdge Demolition','BlastPro Demo','SafeDemo Services','ReliDemo Co.'],
  'Concrete & Masonry': ['SolidForm Concrete','ProMason Services','TrueStone Masonry','AllCrete Concrete','PrimeMason Co.','CoreStone Masonry','MasonCraft Co.','StoneEdge Concrete','SafeCrete Services','ReliMason Concrete'],
  'Security Services': ['ShieldForce Security','ProGuard Services','TrueSafe Security','AllWatch Security','PrimeSafe Security','CoreGuard Services','GuardCraft Security','WatchEdge Security','SafeForce Security','ReliGuard Services'],
  'Alarm & Surveillance': ['AlertPro Systems','ProWatch Surveillance','TrueAlert Alarm','AllWatch Alarm Co.','PrimeAlert Systems','CoreWatch Surveillance','AlarmCraft Systems','WatchEdge Alarm','SafeAlert Systems','ReliWatch Surveillance'],
  'Locksmith': ['KeyMaster Locksmith','ProLock Services','TrueKey Locksmith','AllLock Locksmith','PrimeLock Co.','CoreKey Locksmith','LockCraft Services','KeyEdge Locksmith','SafeLock Services','ReliKey Locksmith'],
  'Welding': ['IronBond Welding','ProWeld Services','TrueArc Welding','AllWeld Co.','PrimeWeld Services','CoreArc Welding','WeldCraft Co.','ArcEdge Welding','SafeWeld Services','ReliArc Welding'],
  'Machine Shop': ['PrecisionWorks Machine Shop','ProTool Machine','TrueCut Machine Shop','AllAxis Machine Co.','PrimeTool Machine Shop','CoreCut Machine','MachineCraft Shop','ToolEdge Machine','SafeCut Machine Shop','ReliTool Machine'],
  'HVAC Distribution': ['AirFlow Supply','ProAir Distribution','TrueTemp Supply','AllAir Distribution','PrimeAir Supply','CoreTemp Distribution','AirCraft Supply','TempEdge Distribution','SafeAir Supply','ReliAir Distribution'],
  'Plumbing Supply': ['PipeLine Supply','ProPipe Distribution','TrueFlow Supply','AllPipe Supply','PrimePipe Distribution','CoreFlow Supply','PipeCraft Distribution','FlowEdge Supply','SafePipe Supply','ReliPipe Distribution'],
  'Agriculture & Farming': ['GreenAcre Farms','ProHarvest Agriculture','TrueGrow Farms','AllSeason Agriculture','PrimeField Farms','Heritage Agriculture','GrowCraft Farms','FieldEdge Agriculture','FreshAcre Farms','ReliGrow Agriculture'],
  'Nursery & Garden Center': ['BloomField Nursery','ProGrow Garden Center','TrueBloom Nursery','AllGreen Garden Center','PrimeBloom Nursery','Heritage Garden Center','GrowCraft Nursery','GardenEdge Nursery','FreshBloom Garden','ReliGrow Nursery'],
  'Pet Services': ['PawsPro Pet Care','ProPet Services','TruePaws Pet Care','AllPets Services','PrimePaws Pet Care','HappyTails Pet Services','PawsCraft Pet Care','PetEdge Services','SafePaws Pet Care','ReliPet Services'],
};

const SEARCHERS = ['Jake P.', 'Sarah M.', 'Chris D.', 'Emily R.', 'Michael T.'];

function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

function pickRandom(arr, rng) { return arr[Math.floor(rng() * arr.length)]; }

function generateDemoListings(industry, state) {
  const seed = (industry + state).split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 7 + 42;
  const rng = seededRandom(seed);

  const offCount = 3 + Math.floor(rng() * 4); // 3-6
  const onCount = 5 + Math.floor(rng() * 3); // 5-7

  const abbrev = state ? STATE_ABBREVS[state] : null;
  const getCityState = () => {
    if (abbrev && STATE_CITIES[abbrev]) {
      return `${pickRandom(STATE_CITIES[abbrev], rng)}, ${abbrev}`;
    }
    const rndState = pickRandom(Object.keys(STATE_CITIES), rng);
    return `${pickRandom(STATE_CITIES[rndState], rng)}, ${rndState}`;
  };

  const getIndustry = () => industry || pickRandom(INDUSTRIES, rng);

  const getName = (ind) => {
    const names = INDUSTRY_NAMES[ind];
    if (names) return pickRandom(names, rng);
    return pickRandom(INDUSTRY_NAMES[pickRandom(Object.keys(INDUSTRY_NAMES), rng)], rng);
  };

  const revOptions = [1.2,1.5,1.8,2.1,2.4,2.8,3.1,3.5,3.8,4.2,4.8,5.1,5.5,6.2];
  const getRev = () => pickRandom(revOptions, rng);
  const getSde = (rev) => `$${Math.round(rev * (0.2 + rng() * 0.15) * 10) / 10}M`;
  const getPrice = (rev) => `$${Math.round(rev * (0.7 + rng() * 0.4) * 10) / 10}M`;
  const ownerAges = ['57','59','61','62','64','65','67','68','70','71','73'];
  const dates = ['Mar 6','Mar 7','Mar 8','Mar 9','Mar 10','Mar 11','Mar 12','Mar 13','Mar 14','Mar 15','Mar 16','Mar 17','Mar 18','Mar 19'];
  const hours = ['8:15 AM','8:45 AM','9:02 AM','9:30 AM','10:10 AM','10:22 AM','10:45 AM','11:08 AM','11:15 AM','11:30 AM','1:15 PM','2:05 PM','2:30 PM','3:15 PM','3:45 PM'];

  const offMarket = [];
  const offStatuses = ['called','conversation_had','meeting_booked','loi_submitted','meeting_booked','conversation_had'];
  const identifyMethods = [
    'Found via SOS database — owner registered over 25 years ago',
    'Email campaign — owner responded to direct mail piece',
    'Targeted outreach — aging owner, no succession plan identified',
    'Owner flagged via proprietary database, in business 30+ years',
    'Referral from industry contact',
    'Cold outreach via LinkedIn — owner profile indicated retirement interest',
    'Direct mail campaign — response card returned',
    'Identified through business license records — owner age 60+',
  ];
  const callNotes = [
    'Cold call, spoke with receptionist, owner callback scheduled',
    'Connected directly, owner receptive to conversation',
    'Left voicemail, follow-up call scheduled',
    'Called, spoke with owner briefly — interested but cautious',
    'Follow-up call, owner open to discussion',
    'Connected on second attempt, owner motivated to explore options',
  ];
  const convNotes = [
    'Owner interested in retiring within 12 months, no broker yet',
    'Owner exploring options, wants to stay on 6 months post-close',
    'Detailed financials shared, clean books, strong recurring revenue',
    'Owner wants full exit, established customer contracts in place',
    'Good conversation — owner has no succession plan, open to offers',
    'Owner motivated, discussing timeline and transition expectations',
  ];
  const meetNotes = [
    'In-person meeting set at facility',
    'Meeting scheduled with owner and his attorney',
    'Zoom meeting booked, financials to be shared ahead',
    'On-site tour and meeting with owner + bookkeeper',
    'Meeting booked — owner sending P&L and balance sheet',
  ];
  const loiNotes = ['LOI submitted, 60-day diligence period','LOI submitted at asking price','LOI submitted, negotiating terms'];

  for (let i = 0; i < offCount; i++) {
    const ind = getIndustry();
    const rev = getRev();
    const status = offStatuses[i % offStatuses.length];
    const timeline = [{ step: 'identified', date: pickRandom(dates.slice(0, 5), rng), note: pickRandom(identifyMethods, rng) }];
    timeline.push({ step: 'called', date: pickRandom(dates.slice(2, 7), rng), note: pickRandom(callNotes, rng) });
    if (['conversation_had','meeting_booked','loi_submitted'].includes(status)) {
      timeline.push({ step: 'conversation_had', date: pickRandom(dates.slice(4, 9), rng), note: pickRandom(convNotes, rng) });
    }
    if (['meeting_booked','loi_submitted'].includes(status)) {
      timeline.push({ step: 'meeting_booked', date: pickRandom(dates.slice(6, 12), rng), note: pickRandom(meetNotes, rng) });
    }
    if (status === 'loi_submitted') {
      timeline.push({ step: 'loi_submitted', date: pickRandom(dates.slice(8, 14), rng), note: pickRandom(loiNotes, rng) });
    }
    offMarket.push({
      id: `off${i}`,
      name: getName(ind),
      industry: ind,
      revenue: `$${rev}M`,
      sde: getSde(rev),
      location: getCityState(),
      askingPrice: rng() > 0.3 ? getPrice(rev) : 'TBD — exploring',
      ownerAge: pickRandom(ownerAges, rng),
      status,
      searcher: pickRandom(SEARCHERS, rng),
      timeline,
    });
  }

  const onMarket = [];
  const onStatuses = ['texted','called','meeting_booked','loi_submitted','meeting_booked','called','meeting_booked'];
  for (let i = 0; i < onCount; i++) {
    const ind = getIndustry();
    const rev = getRev();
    const status = onStatuses[i % onStatuses.length];
    const contactMin = 3 + Math.floor(rng() * 12);
    const baseDate = pickRandom(dates, rng);
    const baseHour = pickRandom(hours, rng);
    const timeline = [{ step: 'scraped', date: `${baseDate}, ${baseHour}`, note: `Listing detected on BizBuySell — matched ${ind.toLowerCase()} criteria` }];
    timeline.push({ step: 'texted', date: `${baseDate}, ${baseHour}`, note: `Text sent to broker, ${contactMin} min after post` });
    if (['no_response','called','meeting_booked','loi_submitted'].includes(status) && rng() > 0.4) {
      timeline.push({ step: 'no_response', date: `${baseDate}`, note: 'No response after 10 min' });
    }
    if (['called','meeting_booked','loi_submitted'].includes(status)) {
      timeline.push({ step: 'called', date: `${baseDate}`, note: rng() > 0.5 ? 'Called broker directly, got through' : 'Called broker, left voicemail — callback received same day' });
    }
    if (['meeting_booked','loi_submitted'].includes(status)) {
      timeline.push({ step: 'meeting_booked', date: pickRandom(dates.slice(5), rng), note: rng() > 0.5 ? 'Meeting booked — broker said we were first caller' : 'Zoom meeting scheduled, financials shared' });
    }
    if (status === 'loi_submitted') {
      timeline.push({ step: 'loi_submitted', date: pickRandom(dates.slice(8), rng), note: 'LOI submitted at asking price' });
    }
    onMarket.push({
      id: `on${i}`,
      name: getName(ind),
      industry: ind,
      revenue: `$${rev}M`,
      sde: getSde(rev),
      location: getCityState(),
      askingPrice: getPrice(rev),
      source: 'BizBuySell',
      listedDate: baseDate,
      status,
      searcher: pickRandom(SEARCHERS, rng),
      timeToContact: `${contactMin} min after listing`,
      timeline,
    });
  }

  return { offMarket, onMarket };
}

function getStepColor(step, steps, currentStatus) {
  const currentIdx = steps.findIndex(s => s.key === currentStatus);
  const stepIdx = steps.findIndex(s => s.key === step.key);
  if (stepIdx <= currentIdx) return 'bg-emerald-500';
  return 'bg-gray-200';
}

function getStepTextColor(step, steps, currentStatus) {
  const currentIdx = steps.findIndex(s => s.key === currentStatus);
  const stepIdx = steps.findIndex(s => s.key === step.key);
  if (stepIdx <= currentIdx) return 'text-emerald-700';
  return 'text-gray-400';
}

function ListingPopup({ listing, onClose, type }) {
  const steps = type === 'off_market' ? OFF_MARKET_STEPS : ON_MARKET_STEPS;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{listing.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{listing.industry} &middot; {listing.location}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            <div>
              <p className="text-xs text-gray-400">Revenue</p>
              <p className="text-sm font-semibold text-gray-900">{listing.revenue}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">SDE</p>
              <p className="text-sm font-semibold text-gray-900">{listing.sde}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Asking Price</p>
              <p className="text-sm font-semibold text-gray-900">{listing.askingPrice}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Searcher</p>
              <p className="text-sm font-semibold text-gray-900">{listing.searcher}</p>
            </div>
            {type === 'on_market' && listing.timeToContact && (
              <div>
                <p className="text-xs text-gray-400">Time to Contact</p>
                <p className="text-sm font-semibold text-emerald-600">{listing.timeToContact}</p>
              </div>
            )}
            {type === 'off_market' && listing.ownerAge && (
              <div>
                <p className="text-xs text-gray-400">Owner Age</p>
                <p className="text-sm font-semibold text-gray-900">{listing.ownerAge}</p>
              </div>
            )}
          </div>
        </div>

        {/* Pipeline Progress */}
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Pipeline</p>
          <div className="flex items-center gap-1">
            {steps.map((step, i) => (
              <React.Fragment key={step.key}>
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-3 h-3 rounded-full ${getStepColor(step, steps, listing.status)}`} />
                  <span className={`text-[10px] mt-1 text-center leading-tight ${getStepTextColor(step, steps, listing.status)}`}>
                    {step.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 -mt-3 ${
                    i < steps.findIndex(s => s.key === listing.status) ? 'bg-emerald-500' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="p-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">How We Got Here</p>
          <div className="space-y-4">
            {listing.timeline.map((event, i) => {
              const stepLabel = steps.find(s => s.key === event.step)?.label || event.step;
              return (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1.5" />
                    {i < listing.timeline.length - 1 && <div className="w-0.5 flex-1 bg-emerald-200 mt-1" />}
                  </div>
                  <div className="pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-900">{stepLabel}</span>
                      <span className="text-xs text-gray-400">{event.date}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{event.note}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoStatusBadge({ status, steps }) {
  const step = steps.find(s => s.key === status);
  if (!step) return null;
  const idx = steps.findIndex(s => s.key === status);
  const total = steps.length;
  const colors = idx >= total - 1
    ? 'bg-green-100 text-green-700'
    : idx >= total - 2
      ? 'bg-emerald-100 text-emerald-700'
      : idx >= total - 3
        ? 'bg-purple-100 text-purple-700'
        : 'bg-yellow-100 text-yellow-700';
  return (
    <span className={`text-xs font-medium rounded-full px-3 py-1 ${colors}`}>
      {step.label}
    </span>
  );
}

function DemoSection() {
  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [industry, setIndustry] = useState('');
  const [state, setState] = useState('');
  const [phase, setPhase] = useState('filter');
  const [searchProgress, setSearchProgress] = useState(0);
  const [searchLabel, setSearchLabel] = useState('');
  const [demoData, setDemoData] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    setPhase('searching');
    setSearchProgress(0);
    setSearchLabel('Connecting to listing databases...');
    const labels = [
      'Connecting to listing databases...',
      `Scanning BizBuySell${industry ? ` for ${industry}` : ''}...`,
      'Matching listings to your criteria...',
      'Pulling off-market outreach results...',
      'Checking pipeline status for active leads...',
      'Compiling results...',
    ];
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step >= labels.length) {
        clearInterval(interval);
        setSearchProgress(100);
        setSearchLabel('Done!');
        setTimeout(() => {
          setDemoData(generateDemoListings(industry, state));
          setPhase('results');
        }, 500);
      } else {
        setSearchProgress(Math.round((step / labels.length) * 100));
        setSearchLabel(labels[step]);
      }
    }, 600);
  };

  if (phase === 'filter') {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <form onSubmit={handleSearch} className="w-full max-w-lg">
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 px-8 py-10 text-center">
              <img src="/logo.png" alt="Lended Search" className="h-10 mx-auto mb-4 brightness-0 invert" />
              <h2 className="text-2xl font-bold text-white">See Your Deal Flow</h2>
              <p className="text-emerald-100 text-sm mt-2">Preview results from the past 2 weeks</p>
            </div>
            <div className="px-8 py-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Target Industry</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all appearance-none"
                >
                  <option value="">All Industries</option>
                  {INDUSTRIES.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Target State</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all appearance-none"
                >
                  <option value="">All States</option>
                  {US_STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-600 py-4 text-sm font-bold text-white hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-md shadow-emerald-200"
              >
                Search Listings
              </button>
              <p className="text-xs text-gray-400 text-center">Results are from the most recent 2-week window</p>
            </div>
          </div>
        </form>
      </div>
    );
  }

  if (phase === 'searching') {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-10">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" />
              <div className="absolute inset-3 rounded-full border-4 border-transparent border-t-emerald-300 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-emerald-600">{searchProgress}%</span>
              </div>
            </div>
            <p className="text-sm font-semibold text-gray-800 mb-2">{searchLabel}</p>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-4">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${searchProgress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-gray-400">Scanning databases</span>
              <span className="text-[10px] text-gray-400">Compiling results</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { offMarket, onMarket } = demoData;

  return (
    <div className="space-y-8">
      {/* Results header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Results — Past 2 Weeks</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {offMarket.length} off-market &middot; {onMarket.length} on-market
            {(industry || state) && <span> &middot; {[industry, state].filter(Boolean).join(', ')}</span>}
          </p>
        </div>
        <button
          onClick={() => { setPhase('filter'); setDemoData(null); }}
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          New Search
        </button>
      </div>

      {/* Off Market Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-sm font-bold text-gray-900">Off Market</h3>
          <span className="text-xs text-gray-400">{offMarket.length} listings from direct outreach</span>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Business</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Industry</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Revenue</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">SDE</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Location</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Searcher</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {offMarket.map((listing) => (
                  <tr
                    key={listing.id}
                    className="border-b border-gray-50 hover:bg-emerald-50 cursor-pointer transition-colors"
                    onClick={() => { setSelectedListing(listing); setSelectedType('off_market'); }}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{listing.name}</td>
                    <td className="px-4 py-3 text-gray-600">{listing.industry}</td>
                    <td className="px-4 py-3 text-gray-600">{listing.revenue}</td>
                    <td className="px-4 py-3 text-gray-600">{listing.sde}</td>
                    <td className="px-4 py-3 text-gray-600">{listing.location}</td>
                    <td className="px-4 py-3 text-gray-600">{listing.searcher}</td>
                    <td className="px-4 py-3">
                      <DemoStatusBadge status={listing.status} steps={OFF_MARKET_STEPS} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* On Market Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-sm font-bold text-gray-900">On Market</h3>
          <span className="text-xs text-gray-400">{onMarket.length} active listings our searchers are engaged with</span>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Business</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Industry</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Revenue</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">SDE</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Location</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Source</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Searcher</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {onMarket.map((listing) => (
                  <tr
                    key={listing.id}
                    className="border-b border-gray-50 hover:bg-emerald-50 cursor-pointer transition-colors"
                    onClick={() => { setSelectedListing(listing); setSelectedType('on_market'); }}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{listing.name}</td>
                    <td className="px-4 py-3 text-gray-600">{listing.industry}</td>
                    <td className="px-4 py-3 text-gray-600">{listing.revenue}</td>
                    <td className="px-4 py-3 text-gray-600">{listing.sde}</td>
                    <td className="px-4 py-3 text-gray-600">{listing.location}</td>
                    <td className="px-4 py-3 text-gray-600">{listing.source}</td>
                    <td className="px-4 py-3 text-gray-600">{listing.searcher}</td>
                    <td className="px-4 py-3">
                      <DemoStatusBadge status={listing.status} steps={ON_MARKET_STEPS} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Popup */}
      {selectedListing && (
        <ListingPopup
          listing={selectedListing}
          type={selectedType}
          onClose={() => { setSelectedListing(null); setSelectedType(null); }}
        />
      )}
    </div>
  );
}

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [funnelData, setFunnelData] = useState(null);
  const [showFunnel, setShowFunnel] = useState(false);
  const [activeTab, setActiveTab] = useState('demo');

  const handleLogin = (e) => {
    e.preventDefault();
    if (code === ACCESS_CODE) {
      setAuthed(true);
      setCodeError(false);
    } else {
      setCodeError(true);
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      let snapshot;
      try {
        const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
        snapshot = await getDocs(q);
      } catch (indexErr) {
        // Fallback if index doesn't exist yet
        snapshot = await getDocs(collection(db, 'leads'));
      }
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Sort client-side as fallback
      data.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
      setLeads(data);
    } catch (err) {
      console.error('Error fetching leads:', err);
    }
    setLoading(false);
  };

  const fetchFunnel = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'funnel_sessions'));
      const sessions = snapshot.docs.map((d) => d.data());
      const total = sessions.length;
      const completed = sessions.filter((s) => s.completed).length;
      const stepCounts = {};
      FUNNEL_STEPS.forEach((s) => { stepCounts[s.id] = 0; });
      sessions.forEach((session) => {
        (session.steps || []).forEach((stepId) => {
          if (stepCounts[stepId] !== undefined) stepCounts[stepId]++;
        });
        if (session.completed) stepCounts['contact'] = (stepCounts['contact'] || 0) + 1;
      });
      setFunnelData({ total, completed, stepCounts });
    } catch (err) {
      console.error('Error fetching funnel:', err);
    }
  };

  useEffect(() => {
    if (authed) { fetchLeads(); fetchFunnel(); }
  }, [authed]);

  const updateStatus = async (leadId, newStatus) => {
    try {
      await updateDoc(doc(db, 'leads', leadId), { status: newStatus });
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
      );
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-6">
              <img src="/logo.png" alt="Lended Search" className="h-10 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-gray-900">Admin Access</h1>
              <p className="text-sm text-gray-500 mt-1">Enter your access code</p>
            </div>
            <input
              type="password"
              value={code}
              onChange={(e) => { setCode(e.target.value); setCodeError(false); }}
              placeholder="Access code"
              autoFocus
              className={`w-full rounded-xl border px-4 py-3 text-center text-lg tracking-widest focus:outline-none focus:ring-1 transition-all ${
                codeError
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500'
              }`}
            />
            {codeError && (
              <p className="text-sm text-red-500 text-center mt-2">Wrong code</p>
            )}
            <button
              type="submit"
              className="mt-4 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-all"
            >
              Enter
            </button>
          </div>
        </form>
      </div>
    );
  }

  const filteredLeads = filter === 'all' ? leads : leads.filter((l) => (l.status || 'new') === filter);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Lended Search" className="h-8" />
            <span className="text-sm font-semibold text-gray-900">Admin</span>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab('demo')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'demo' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Demo
            </button>
            <button
              onClick={() => setActiveTab('leads')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'leads' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Leads
            </button>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === 'leads' && (
              <>
                <span className="text-sm text-gray-500">{leads.length} leads</span>
                <button
                  onClick={fetchLeads}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Refresh
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'demo' ? (
          <DemoSection />
        ) : (
          <>
            {/* Funnel toggle */}
            <div className="mb-6">
              <button
                onClick={() => setShowFunnel(!showFunnel)}
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
              >
                {showFunnel ? 'Hide' : 'Show'} Funnel Analytics
              </button>
              {showFunnel && funnelData && (
                <div className="mt-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-900">Lander Funnel</h3>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500">{funnelData.total} started</span>
                      <span className="text-emerald-600 font-semibold">{funnelData.completed} completed</span>
                      <span className="text-gray-500">
                        {funnelData.total > 0 ? Math.round((funnelData.completed / funnelData.total) * 100) : 0}% conversion
                      </span>
                      <button onClick={fetchFunnel} className="text-emerald-600 hover:text-emerald-700 font-medium">Refresh</button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {FUNNEL_STEPS.map((step, i) => {
                      const count = funnelData.stepCounts[step.id] || 0;
                      const pct = funnelData.total > 0 ? (count / funnelData.total) * 100 : 0;
                      const prevCount = i === 0 ? funnelData.total : (funnelData.stepCounts[FUNNEL_STEPS[i - 1].id] || 0);
                      const dropoff = prevCount > 0 ? Math.round(((prevCount - count) / prevCount) * 100) : 0;
                      return (
                        <div key={step.id} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-20 text-right">{step.label}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                              {count}
                            </span>
                          </div>
                          {i > 0 && dropoff > 0 && (
                            <span className="text-xs text-red-400 w-16">-{dropoff}%</span>
                          )}
                          {i === 0 && <span className="w-16" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filter === 'all' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                All ({leads.length})
              </button>
              {STATUS_OPTIONS.map((s) => {
                const count = leads.filter((l) => (l.status || 'new') === s.value).length;
                return (
                  <button
                    key={s.value}
                    onClick={() => setFilter(s.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      filter === s.value ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {s.label} ({count})
                  </button>
                );
              })}
            </div>

            {loading ? (
              <div className="text-center py-20 text-gray-400">Loading leads...</div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-20 text-gray-400">No leads yet</div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Phone</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Industry</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Deal Size</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Program</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Readiness</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map((lead) => (
                        <React.Fragment key={lead.id}>
                          <tr
                            className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                          >
                            <td className="px-4 py-3 font-medium text-gray-900">{lead.name || '—'}</td>
                            <td className="px-4 py-3 text-gray-600">{lead.email || '—'}</td>
                            <td className="px-4 py-3 text-gray-600">{lead.phone || '—'}</td>
                            <td className="px-4 py-3 text-gray-600">{lead.searcher_type || '—'}</td>
                            <td className="px-4 py-3 text-gray-600">{lead.industry || '—'}</td>
                            <td className="px-4 py-3 text-gray-600">{lead.deal_size || '—'}</td>
                            <td className="px-4 py-3 text-gray-600">{lead.program || '—'}</td>
                            <td className="px-4 py-3 text-gray-600">{lead.readiness || '—'}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(lead.createdAt)}</td>
                            <td className="px-4 py-3">
                              <select
                                value={lead.status || 'new'}
                                onChange={(e) => { e.stopPropagation(); updateStatus(lead.id, e.target.value); }}
                                onClick={(e) => e.stopPropagation()}
                                className={`text-xs font-medium rounded-full px-3 py-1 border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 ${getStatusStyle(lead.status || 'new')}`}
                              >
                                {STATUS_OPTIONS.map((s) => (
                                  <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                          {expandedId === lead.id && (
                            <tr className="bg-gray-50">
                              <td colSpan={9} className="px-4 py-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                  {Object.entries(FIELD_LABELS).map(([key, label]) => (
                                    lead[key] ? (
                                      <div key={key}>
                                        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                                        <p className="text-sm text-gray-900">{lead[key]}</p>
                                      </div>
                                    ) : null
                                  ))}
                                  <div>
                                    <p className="text-xs text-gray-400 mb-0.5">Source</p>
                                    <p className="text-sm text-gray-900">{lead.source || '—'}</p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
