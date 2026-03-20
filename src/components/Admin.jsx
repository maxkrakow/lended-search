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
  'HVAC': ['Summit Comfort Systems','Northwind Heating & Cooling','Valley Air Mechanical','Redline Climate Control','Four Seasons Air','Copperline Mechanical','Bridgewater HVAC','Orion Air Services','Clearview Comfort','Westfield Heating & Air'],
  'Plumbing': ['Copperstone Plumbing','Bayview Pipe & Drain','Ironflow Services','Lakeside Plumbing Co.','Ridgeway Drain Solutions','Harbor Plumbing Group','Stonebridge Pipe Works','Valley Creek Plumbing','Clearwater Drain Co.','Oakmont Plumbing'],
  'Electrical': ['Brightline Electric Co.','Redstone Electrical Services','Copperfield Electric','Bayshore Power Solutions','Westgate Electric Group','Ironridge Electrical','Summit Power Co.','Lakewood Electric','Clearpath Electrical Services','Bridgeport Electric'],
  'Roofing': ['Ridgeline Construction','Summit Exteriors','Coppertop Contractors','Ironside Building Co.','Westwind Exteriors','Bayview Restoration','Stonewall Contractors','Valley Crest Builders','Northpoint Exteriors','Heritage Building Group'],
  'Landscaping': ['Greenstone Property Care','Lakeside Grounds Management','Valley View Land Co.','Bridgewater Outdoor Services','Ironwood Landscapes','Clearfield Property Maintenance','Bayshore Grounds Co.','Westgate Outdoor Solutions','Oakridge Land Management','Copperleaf Outdoors'],
  'Pest Control': ['Sentinel Home Services','Ridgeback Solutions','Clearline Home Protection','Baypoint Pest Management','Irongate Environmental','Valley Shield Services','Westbrook Home Solutions','Lakewood Environmental Co.','Bridgeway Home Services','Stonewall Protection'],
  'Pool Services': ['Clearwater Aquatics','Bayshore Pool Management','Lakeside Water Services','Stonegate Pools & Spa','Ridgeview Aquatic Co.','Westfield Pool Management','Copperspring Pools','Valley Blue Aquatics','Bridgewater Pool Co.','Summit Aquatic Services'],
  'Painting': ['Brushline Finishings','Ridgeview Coatings Co.','Clearcoat Finishings','Bayport Painting Co.','Ironside Surface Works','Westlake Finishings','Valley View Coatings','Bridgeway Painting Group','Lakeside Finishings Co.','Copperfield Coatings'],
  'Flooring': ['Stonegate Floors','Ridgewood Surface Co.','Clearpath Flooring Group','Bayview Floor Works','Ironwood Floor Co.','Westfield Surface Solutions','Valley Oak Flooring','Bridgeway Floors','Lakeside Floor Installations','Copperstone Surfaces'],
  'General Contracting': ['Cornerstone Builders','Ridgepoint Construction','Bayview Building Group','Ironside Contractors','Westgate Construction Co.','Valley Summit Builders','Bridgewater General Contractors','Lakewood Building Co.','Clearfield Construction','Stonegate Builders'],
  'Garage Doors': ['Irongate Door Systems','Valley Access Co.','Ridgeline Door Works','Clearview Garage Solutions','Baypoint Door Co.','Westfield Door Systems','Bridgeway Access','Lakeside Door Works','Copperline Garage Co.','Stonegate Door Services'],
  'Fencing': ['Ironside Fence & Gate','Ridgeline Fence Co.','Valley Perimeter Solutions','Clearfield Fence Works','Bayshore Fence Group','Westgate Fence Co.','Bridgewater Fence & Rail','Lakewood Fence Systems','Copperstone Fencing','Stonegate Perimeter'],
  'Tree Service': ['Canopy Arborists','Ridgewood Tree Specialists','Valley Timber Services','Clearfield Arborcare','Ironwood Tree Co.','Bayshore Tree Specialists','Westlake Arbor Services','Bridgeway Tree Care','Lakeside Arborists','Stonegate Tree Co.'],
  'Pressure Washing': ['Clearcoat Surface Restoration','Ridgepoint Cleaning Co.','Valley Clean Exterior Services','Bayshore Surface Co.','Ironside Exterior Cleaning','Westlake Surface Restoration','Bridgeway Exterior Co.','Lakeside Surface Cleaning','Copperfield Cleaning','Stonegate Exteriors'],
  'Insulation': ['Ridgeline Weatherproofing','Valley Barrier Co.','Clearfield Thermal Solutions','Ironside Insulation Co.','Baypoint Weatherization','Westgate Thermal Services','Bridgeway Insulation Group','Lakewood Barrier Co.','Copperline Thermal','Stonegate Weatherproofing'],
  'Window Cleaning': ['Clearview Glass Services','Ridgepoint Window Co.','Valley Shine Services','Bayshore Glass Care','Ironside Window Pros','Westlake Glass Co.','Bridgeway Window Services','Lakeside Glass Care','Copperfield Window Co.','Stonegate Glass Services'],
  'Janitorial / Commercial Cleaning': ['Clearspace Facility Services','Ridgepoint Commercial Maintenance','Valley Clean Solutions','Bayshore Facility Group','Ironside Building Services','Westgate Commercial Cleaning','Bridgeway Facility Co.','Lakewood Maintenance Group','Copperfield Services','Stonegate Facility Management'],
  'Carpet Cleaning': ['Valley Fresh Restoration','Ridgepoint Fiber Care','Clearfield Floor Restoration','Bayshore Carpet Co.','Ironside Fiber Services','Westlake Restoration','Bridgeway Floor Care','Lakeside Carpet Restoration','Copperfield Fiber Co.','Stonegate Floor Services'],
  'Fire Protection': ['Redline Safety Systems','Valley Fire Solutions','Ridgepoint Life Safety','Clearfield Fire Co.','Bayshore Fire Protection','Irongate Safety','Westlake Fire Systems','Bridgeway Safety Co.','Lakewood Fire Services','Stonegate Life Safety'],
  'Septic Services': ['Valley Flow Environmental','Ridgeline Septic Co.','Clearfield Drain Services','Baypoint Septic Solutions','Ironside Environmental Services','Westlake Septic Co.','Bridgeway Drain Solutions','Lakewood Septic Services','Copperfield Environmental','Stonegate Drain Co.'],
  'Auto Body & Collision': ['Ridgeline Collision Center','Valley Auto Restoration','Clearfield Body Works','Bayshore Collision Repair','Ironside Auto Body','Westgate Collision Center','Bridgeway Auto Restoration','Lakeside Body Shop','Copperfield Collision','Stonegate Auto Works'],
  'Auto Repair & Maintenance': ['Valley Automotive Group','Ridgepoint Auto Care','Clearfield Automotive','Bayshore Motor Works','Ironside Auto Service','Westlake Automotive','Bridgeway Auto Group','Lakewood Motor Co.','Copperfield Auto Care','Stonegate Automotive'],
  'Tire & Wheel': ['Valley Tire & Auto','Ridgeline Tire Center','Clearfield Tire Co.','Bayshore Tire & Wheel','Ironside Tire Services','Westgate Tire Center','Bridgeway Tire Co.','Lakewood Tire & Auto','Copperfield Tire','Stonegate Tire Center'],
  'Car Wash': ['Clearshine Auto Spa','Valley Wash Co.','Ridgepoint Auto Detailing','Bayshore Car Care','Ironside Auto Spa','Westlake Car Wash','Bridgeway Auto Detailing','Lakeside Car Care','Copperfield Auto Wash','Stonegate Auto Spa'],
  'Towing': ['Valley Recovery Services','Ridgeline Towing & Recovery','Clearfield Roadside Co.','Bayshore Recovery','Ironside Towing','Westgate Recovery Services','Bridgeway Towing Co.','Lakewood Roadside','Copperfield Recovery','Stonegate Towing'],
  'Transmission Repair': ['Valley Drivetrain Specialists','Ridgeline Transmission Co.','Clearfield Drivetrain','Bayshore Transmission Center','Ironside Drivetrain','Westlake Transmission','Bridgeway Drivetrain Co.','Lakewood Transmission Center','Copperfield Drivetrain','Stonegate Transmission'],
  'Manufacturing': ['Precision Metalworks Inc.','Valley Industrial Co.','Ridgeline Manufacturing Group','Clearfield Industries','Bayshore Manufacturing','Ironside Industrial','Westgate Manufacturing Co.','Bridgeway Industries','Lakewood Manufacturing Group','Stonegate Industrial'],
  'Metal Fabrication': ['Ironforge Metalworks','Valley Steel Fabricators','Ridgeline Metal Co.','Clearfield Steel Works','Bayshore Fabrication','Westgate Metal Works','Bridgeway Steel Co.','Lakewood Fabricators','Copperfield Metalworks','Stonegate Steel Fabrication'],
  'CNC Machining': ['Valley Precision Machining','Ridgeline CNC Co.','Clearfield Machine Works','Bayshore Precision Co.','Ironside Machining','Westgate Machine Works','Bridgeway Precision','Lakewood CNC Services','Copperfield Machining','Stonegate Precision Co.'],
  'Plastic Molding': ['Valley Polymer Solutions','Ridgeline Plastics Co.','Clearfield Molding Group','Bayshore Polymer Co.','Ironside Plastics','Westgate Molding','Bridgeway Plastics','Lakewood Polymer Group','Copperfield Molding Co.','Stonegate Plastics'],
  'Food Manufacturing': ['Valley Harvest Foods','Ridgeline Food Co.','Clearfield Foods Inc.','Bayshore Food Manufacturing','Ironside Foods','Westgate Food Co.','Bridgeway Foods Inc.','Lakewood Food Group','Copperfield Foods','Stonegate Food Manufacturing'],
  'Packaging': ['Valley Pack Solutions','Ridgeline Packaging Co.','Clearfield Pack Group','Bayshore Packaging','Ironside Pack Co.','Westgate Packaging Solutions','Bridgeway Packaging','Lakewood Pack Group','Copperfield Packaging','Stonegate Pack Co.'],
  'Trucking & Freight': ['Valley Line Freight','Ridgeline Logistics','Clearfield Transport Co.','Bayshore Freight Services','Ironside Logistics','Westgate Trucking Co.','Bridgeway Transport','Lakewood Freight Group','Copperfield Logistics','Stonegate Transport'],
  'Moving & Storage': ['Valley Relocation Services','Ridgeline Moving Co.','Clearfield Moving & Storage','Bayshore Relocation','Ironside Moving Group','Westgate Movers','Bridgeway Relocation','Lakewood Moving Co.','Copperfield Movers','Stonegate Relocation'],
  'Courier Services': ['Valley Express Delivery','Ridgeline Courier Co.','Clearfield Express','Bayshore Delivery Services','Ironside Courier','Westgate Express Co.','Bridgeway Delivery','Lakewood Courier','Copperfield Express','Stonegate Delivery Co.'],
  'Waste Management': ['Valley Environmental Services','Ridgeline Waste Co.','Clearfield Disposal Group','Bayshore Waste Solutions','Ironside Environmental','Westgate Waste Services','Bridgeway Disposal','Lakewood Waste Management','Copperfield Environmental','Stonegate Waste Co.'],
  'Recycling': ['Valley Green Recycling','Ridgeline Reclamation','Clearfield Recycling Co.','Bayshore Green Solutions','Ironside Recycling','Westgate Reclamation','Bridgeway Recycling','Lakewood Green Co.','Copperfield Recycling','Stonegate Reclamation'],
  'Dental Practice': ['Valley Dental Associates','Ridgeview Family Dental','Clearfield Dental Group','Bayshore Dental Care','Ironside Dental','Westlake Dental Associates','Bridgeway Dental Group','Lakewood Family Dental','Copperfield Dental','Stonegate Dental Care'],
  'Veterinary Clinic': ['Valley Animal Hospital','Ridgeview Veterinary Care','Clearfield Animal Clinic','Bayshore Veterinary Group','Ironside Animal Hospital','Westlake Vet Clinic','Bridgeway Animal Care','Lakewood Veterinary','Copperfield Animal Clinic','Stonegate Vet Care'],
  'Physical Therapy': ['Valley Rehabilitation Center','Ridgeview Physical Therapy','Clearfield Rehab Group','Bayshore Physical Therapy','Ironside Rehabilitation','Westlake PT Associates','Bridgeway Rehab','Lakewood Physical Therapy','Copperfield Rehabilitation','Stonegate PT Group'],
  'Home Health Care': ['Valley Home Health Services','Ridgeview Home Care','Clearfield Home Health','Bayshore Home Services','Ironside Home Care','Westlake Home Health','Bridgeway Home Care','Lakewood Home Health','Copperfield Home Services','Stonegate Home Care'],
  'Pharmacy': ['Valley Pharmacy Group','Ridgeview Drug Co.','Clearfield Pharmacy','Bayshore Pharmacy','Ironside Drug Co.','Westlake Pharmacy','Bridgeway Drug Co.','Lakewood Pharmacy Group','Copperfield Pharmacy','Stonegate Drug Co.'],
  'Medical Equipment': ['Valley Medical Supply','Ridgeview Med Equipment','Clearfield Medical Co.','Bayshore Medical Supply','Ironside Medical Equipment','Westlake Med Supply','Bridgeway Medical Co.','Lakewood Medical Equipment','Copperfield Med Supply','Stonegate Medical Co.'],
  'IT Services': ['Valley Technology Group','Ridgepoint IT Solutions','Clearfield Technology','Bayshore IT Group','Ironside Technology Services','Westlake IT Solutions','Bridgeway Technology','Lakewood IT Group','Copperfield Technology','Stonegate IT Services'],
  'Managed IT': ['Valley Network Solutions','Ridgepoint Managed Services','Clearfield IT Management','Bayshore Network Group','Ironside Managed Services','Westlake Network Solutions','Bridgeway IT Management','Lakewood Managed IT','Copperfield Network Co.','Stonegate Managed Services'],
  'Cybersecurity': ['Valley Security Technologies','Ridgepoint Cyber Group','Clearfield Security Co.','Bayshore Cyber Solutions','Ironside Security Technologies','Westlake Cyber Group','Bridgeway Security Co.','Lakewood Cyber Solutions','Copperfield Security','Stonegate Cyber Group'],
  'Software Development': ['Valley Software Co.','Ridgepoint Digital','Clearfield Software Group','Bayshore Digital Solutions','Ironside Software Co.','Westlake Digital','Bridgeway Software Group','Lakewood Digital Co.','Copperfield Software','Stonegate Digital Solutions'],
  'Accounting & Bookkeeping': ['Valley Financial Services','Ridgeview Accounting Group','Clearfield Financial Co.','Bayshore Accounting','Ironside Financial Services','Westlake Accounting Group','Bridgeway Financial','Lakewood Accounting Co.','Copperfield Financial','Stonegate Accounting Group'],
  'Staffing & Recruiting': ['Valley Talent Group','Ridgepoint Staffing','Clearfield Talent Solutions','Bayshore Staffing Co.','Ironside Talent Group','Westlake Staffing','Bridgeway Talent Co.','Lakewood Staffing Group','Copperfield Talent','Stonegate Staffing'],
  'Insurance Agency': ['Valley Insurance Associates','Ridgeview Insurance Group','Clearfield Insurance Co.','Bayshore Insurance Agency','Ironside Insurance','Westlake Insurance Group','Bridgeway Insurance Co.','Lakewood Insurance Associates','Copperfield Insurance','Stonegate Insurance Group'],
  'Digital Marketing Agency': ['Valley Digital Group','Ridgepoint Marketing Co.','Clearfield Digital Agency','Bayshore Marketing Group','Ironside Digital','Westlake Marketing Co.','Bridgeway Digital Agency','Lakewood Marketing Group','Copperfield Digital','Stonegate Marketing Co.'],
  'Daycare & Childcare': ['Valley Kids Academy','Ridgeview Learning Center','Clearfield Children\'s Academy','Bayshore Kids Academy','Ironside Learning Center','Westlake Children\'s Center','Bridgeway Kids Academy','Lakewood Learning Center','Copperfield Children\'s Academy','Stonegate Kids Center'],
  'Tutoring & Education': ['Valley Learning Group','Ridgeview Education Co.','Clearfield Learning Center','Bayshore Education Group','Ironside Learning Co.','Westlake Education','Bridgeway Learning Center','Lakewood Education Group','Copperfield Learning','Stonegate Education Co.'],
  'Fitness & Gym': ['Valley Fitness Co.','Ridgepoint Athletics','Clearfield Fitness Center','Bayshore Athletics','Ironside Fitness','Westlake Athletic Club','Bridgeway Fitness Co.','Lakewood Athletics','Copperfield Fitness Center','Stonegate Athletic Club'],
  'Salon & Spa': ['Valley Beauty & Wellness','Ridgeview Salon Co.','Clearfield Day Spa','Bayshore Beauty','Ironside Salon & Wellness','Westlake Day Spa','Bridgeway Beauty Co.','Lakewood Salon & Spa','Copperfield Beauty','Stonegate Day Spa'],
  'Dry Cleaning & Laundry': ['Valley Cleaners','Ridgeview Dry Cleaning Co.','Clearfield Cleaners','Bayshore Laundry Co.','Ironside Cleaners','Westlake Dry Cleaning','Bridgeway Cleaners','Lakewood Laundry Co.','Copperfield Cleaners','Stonegate Dry Cleaning'],
  'Restaurant & Food Service': ['Valley Table Restaurant','Ridgeview Kitchen & Bar','Clearfield Grille','Bayshore Restaurant Group','Ironside Kitchen','Westlake Dining Co.','Bridgeway Restaurant Group','Lakewood Grille','Copperfield Kitchen','Stonegate Restaurant Co.'],
  'Catering': ['Valley Events & Catering','Ridgeview Catering Co.','Clearfield Event Catering','Bayshore Catering Group','Ironside Events','Westlake Catering Co.','Bridgeway Catering','Lakewood Events Co.','Copperfield Catering','Stonegate Events & Catering'],
  'Bakery': ['Valley Bread Company','Ridgeview Baking Co.','Clearfield Bakehouse','Bayshore Bread Co.','Ironside Baking','Westlake Bakehouse','Bridgeway Bread Co.','Lakewood Baking Co.','Copperfield Bakehouse','Stonegate Bread Company'],
  'Coffee Shop': ['Valley Roasters','Ridgeview Coffee Co.','Clearfield Coffee House','Bayshore Roasters','Ironside Coffee Co.','Westlake Coffee House','Bridgeway Roasters','Lakewood Coffee Co.','Copperfield Coffee House','Stonegate Roasters'],
  'Property Management': ['Valley Property Group','Ridgeview Management Co.','Clearfield Property Management','Bayshore Property Group','Ironside Management','Westlake Property Co.','Bridgeway Management Group','Lakewood Property Management','Copperfield Properties','Stonegate Management Co.'],
  'Self Storage': ['Valley Storage Co.','Ridgeview Storage Centers','Clearfield Storage','Bayshore Storage Co.','Ironside Storage Centers','Westlake Storage','Bridgeway Storage Co.','Lakewood Storage Centers','Copperfield Storage','Stonegate Storage Co.'],
  'Commercial Real Estate Services': ['Valley Commercial Group','Ridgeview Commercial Realty','Clearfield Commercial Co.','Bayshore Commercial Group','Ironside Commercial Realty','Westlake Commercial Co.','Bridgeway Commercial Group','Lakewood Commercial Realty','Copperfield Commercial','Stonegate Commercial Co.'],
  'Printing & Signage': ['Valley Print & Sign Co.','Ridgeview Graphics','Clearfield Print Co.','Bayshore Sign & Print','Ironside Graphics','Westlake Print Co.','Bridgeway Sign & Graphics','Lakewood Print Group','Copperfield Graphics','Stonegate Print & Sign'],
  'Industrial Supply': ['Valley Industrial Supply','Ridgeview Supply Co.','Clearfield Industrial','Bayshore Supply Group','Ironside Industrial Supply','Westlake Supply Co.','Bridgeway Industrial','Lakewood Supply Group','Copperfield Industrial Supply','Stonegate Supply Co.'],
  'Safety & Compliance Services': ['Valley Safety Consultants','Ridgeview Compliance Group','Clearfield Safety Co.','Bayshore Compliance Services','Ironside Safety Group','Westlake Compliance','Bridgeway Safety Co.','Lakewood Compliance Group','Copperfield Safety','Stonegate Compliance Co.'],
  'Environmental Services': ['Valley Environmental Group','Ridgeline Environmental Co.','Clearfield Environmental','Bayshore Environmental Services','Ironside Environmental Group','Westlake Environmental','Bridgeway Environmental Co.','Lakewood Environmental Group','Copperfield Environmental Services','Stonegate Environmental'],
  'Water Treatment': ['Valley Water Solutions','Ridgeline Water Co.','Clearfield Water Services','Bayshore Water Treatment','Ironside Water Solutions','Westlake Water Co.','Bridgeway Water Services','Lakewood Water Treatment','Copperfield Water Solutions','Stonegate Water Co.'],
  'Demolition': ['Valley Demolition Co.','Ridgeline Wrecking','Clearfield Demolition Services','Bayshore Demolition','Ironside Wrecking Co.','Westlake Demolition','Bridgeway Wrecking','Lakewood Demolition Co.','Copperfield Wrecking','Stonegate Demolition'],
  'Concrete & Masonry': ['Valley Concrete & Stone','Ridgeline Masonry Co.','Clearfield Concrete Works','Bayshore Stone & Masonry','Ironside Concrete Co.','Westlake Masonry','Bridgeway Concrete Works','Lakewood Stone Co.','Copperfield Masonry','Stonegate Concrete'],
  'Security Services': ['Valley Security Group','Ridgeline Protection Services','Clearfield Security Co.','Bayshore Security Group','Ironside Protection','Westlake Security Services','Bridgeway Protection Co.','Lakewood Security Group','Copperfield Security Services','Stonegate Protection'],
  'Alarm & Surveillance': ['Valley Alarm Systems','Ridgeline Surveillance Co.','Clearfield Alarm Services','Bayshore Alarm & Monitoring','Ironside Alarm Co.','Westlake Surveillance','Bridgeway Alarm Systems','Lakewood Monitoring Co.','Copperfield Alarm','Stonegate Surveillance'],
  'Locksmith': ['Valley Lock & Key','Ridgeline Locksmith Co.','Clearfield Lock Services','Bayshore Lock & Key','Ironside Locksmith','Westlake Lock Co.','Bridgeway Lock & Key','Lakewood Locksmith Co.','Copperfield Lock Services','Stonegate Lock & Key'],
  'Welding': ['Valley Welding & Fabrication','Ridgeline Welding Co.','Clearfield Welding Services','Bayshore Welding & Fab','Ironside Welding Co.','Westlake Welding','Bridgeway Welding & Fab','Lakewood Welding Co.','Copperfield Welding','Stonegate Welding Services'],
  'Machine Shop': ['Valley Precision Machine','Ridgeline Machine Works','Clearfield Machine Co.','Bayshore Precision','Ironside Machine Works','Westlake Machine Co.','Bridgeway Precision Machine','Lakewood Machine Works','Copperfield Machine Co.','Stonegate Precision'],
  'HVAC Distribution': ['Valley Air Supply Co.','Ridgeline HVAC Distribution','Clearfield Air Supply','Bayshore HVAC Supply','Ironside Air Distribution','Westlake HVAC Supply','Bridgeway Air Supply','Lakewood HVAC Distribution','Copperfield Air Supply','Stonegate HVAC Distribution'],
  'Plumbing Supply': ['Valley Plumbing Supply Co.','Ridgeline Pipe & Supply','Clearfield Plumbing Supply','Bayshore Pipe Supply','Ironside Plumbing Distribution','Westlake Pipe & Supply','Bridgeway Plumbing Supply','Lakewood Pipe Supply','Copperfield Plumbing Supply','Stonegate Pipe & Supply'],
  'Agriculture & Farming': ['Valley Farms Inc.','Ridgeline Agricultural Co.','Clearfield Farms','Bayshore Agriculture','Ironside Farms Inc.','Westlake Agricultural Co.','Bridgeway Farms','Lakewood Agriculture','Copperfield Farms','Stonegate Agricultural'],
  'Nursery & Garden Center': ['Valley Garden Center','Ridgeview Nursery Co.','Clearfield Garden Center','Bayshore Nursery','Ironside Garden Center','Westlake Nursery Co.','Bridgeway Garden Center','Lakewood Nursery','Copperfield Garden Center','Stonegate Nursery Co.'],
  'Pet Services': ['Valley Pet Care Co.','Ridgeview Animal Services','Clearfield Pet Care','Bayshore Pet Services','Ironside Animal Care','Westlake Pet Co.','Bridgeway Pet Services','Lakewood Animal Care','Copperfield Pet Services','Stonegate Pet Care'],
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
      <div>
        {/* Filter bar */}
        <form onSubmit={handleSearch}>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <h3 className="text-sm font-bold text-gray-900">Search Criteria</h3>
            </div>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Industry</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                >
                  <option value="">All Industries</option>
                  {INDUSTRIES.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">State</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                >
                  <option value="">All States</option>
                  {US_STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-all whitespace-nowrap"
              >
                Search
              </button>
            </div>
          </div>
        </form>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <svg className="w-10 h-10 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <p className="text-sm font-medium text-gray-500">Select filters and click Search to scrape listings</p>
          <p className="text-xs text-gray-400 mt-1">Sources include BizBuySell, BizQuest, DealStream, and proprietary off-market outreach</p>
        </div>
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
