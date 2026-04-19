import requests
import json
import os
import time

CACHE_FILE = "stock_list_cache.json"
CACHE_TTL  = 86400

# Hardcoded recent IPOs that may not be in NSE CSV yet
RECENT_IPOS = [
    {"ticker": "BHARATCOAL", "name": "Bharat Coking Coal Ltd", "exchange": "NSE"},
    {"ticker": "ETERNAL",    "name": "Eternal Ltd",             "exchange": "NSE"},
    {"ticker": "JIOFIN",     "name": "Jio Financial Services Ltd", "exchange": "NSE"},
    {"ticker": "NSLNISP",    "name": "NMDC Steel Ltd",           "exchange": "NSE"},
]

FALLBACK_STOCKS = [
    {"ticker": "20MICRONS",   "name": "20 Microns Ltd",                        "exchange": "NSE"},
    {"ticker": "3MINDIA",     "name": "3M India Ltd",                          "exchange": "NSE"},
    {"ticker": "5PAISA",      "name": "5Paisa Capital Ltd",                    "exchange": "NSE"},
    {"ticker": "AARTIIND",    "name": "Aarti Industries Ltd",                  "exchange": "NSE"},
    {"ticker": "AAVAS",       "name": "Aavas Financiers Ltd",                  "exchange": "NSE"},
    {"ticker": "ABB",         "name": "ABB India Ltd",                         "exchange": "NSE"},
    {"ticker": "ABBOTINDIA",  "name": "Abbott India Ltd",                      "exchange": "NSE"},
    {"ticker": "ABCAPITAL",   "name": "Aditya Birla Capital Ltd",              "exchange": "NSE"},
    {"ticker": "ABFRL",       "name": "Aditya Birla Fashion and Retail Ltd",   "exchange": "NSE"},
    {"ticker": "ACC",         "name": "ACC Ltd",                               "exchange": "NSE"},
    {"ticker": "ADANIENT",    "name": "Adani Enterprises Ltd",                 "exchange": "NSE"},
    {"ticker": "ADANIGREEN",  "name": "Adani Green Energy Ltd",                "exchange": "NSE"},
    {"ticker": "ADANIPORTS",  "name": "Adani Ports and SEZ Ltd",               "exchange": "NSE"},
    {"ticker": "ADANIPOWER",  "name": "Adani Power Ltd",                       "exchange": "NSE"},
    {"ticker": "AFFLE",       "name": "Affle India Ltd",                       "exchange": "NSE"},
    {"ticker": "AJANTPHARM",  "name": "Ajanta Pharma Ltd",                     "exchange": "NSE"},
    {"ticker": "ALKEM",       "name": "Alkem Laboratories Ltd",                "exchange": "NSE"},
    {"ticker": "AMARAJABAT",  "name": "Amara Raja Energy and Mobility Ltd",    "exchange": "NSE"},
    {"ticker": "AMBUJACEM",   "name": "Ambuja Cements Ltd",                    "exchange": "NSE"},
    {"ticker": "ANGELONE",    "name": "Angel One Ltd",                         "exchange": "NSE"},
    {"ticker": "APOLLOHOSP",  "name": "Apollo Hospitals Enterprise Ltd",       "exchange": "NSE"},
    {"ticker": "APOLLOTYRE",  "name": "Apollo Tyres Ltd",                      "exchange": "NSE"},
    {"ticker": "ASIANPAINT",  "name": "Asian Paints Ltd",                      "exchange": "NSE"},
    {"ticker": "ASTRAL",      "name": "Astral Ltd",                            "exchange": "NSE"},
    {"ticker": "AUROPHARMA",  "name": "Aurobindo Pharma Ltd",                  "exchange": "NSE"},
    {"ticker": "AUBANK",      "name": "AU Small Finance Bank Ltd",             "exchange": "NSE"},
    {"ticker": "AXISBANK",    "name": "Axis Bank Ltd",                         "exchange": "NSE"},
    {"ticker": "BAJAJ-AUTO",  "name": "Bajaj Auto Ltd",                        "exchange": "NSE"},
    {"ticker": "BAJAJFINSV",  "name": "Bajaj Finserv Ltd",                     "exchange": "NSE"},
    {"ticker": "BAJFINANCE",  "name": "Bajaj Finance Ltd",                     "exchange": "NSE"},
    {"ticker": "BALKRISIND",  "name": "Balkrishna Industries Ltd",             "exchange": "NSE"},
    {"ticker": "BALRAMCHIN",  "name": "Balrampur Chini Mills Ltd",             "exchange": "NSE"},
    {"ticker": "BANDHANBNK",  "name": "Bandhan Bank Ltd",                      "exchange": "NSE"},
    {"ticker": "BANKBARODA",  "name": "Bank of Baroda",                        "exchange": "NSE"},
    {"ticker": "BATAINDIA",   "name": "Bata India Ltd",                        "exchange": "NSE"},
    {"ticker": "BEL",         "name": "Bharat Electronics Ltd",                "exchange": "NSE"},
    {"ticker": "BEML",        "name": "BEML Ltd",                              "exchange": "NSE"},
    {"ticker": "BERGEPAINT",  "name": "Berger Paints India Ltd",               "exchange": "NSE"},
    {"ticker": "BHARATCOAL",  "name": "Bharat Coking Coal Ltd",                "exchange": "NSE"},
    {"ticker": "BHARATFORG",  "name": "Bharat Forge Ltd",                      "exchange": "NSE"},
    {"ticker": "BHARTIARTL",  "name": "Bharti Airtel Ltd",                     "exchange": "NSE"},
    {"ticker": "BHEL",        "name": "Bharat Heavy Electricals Ltd",          "exchange": "NSE"},
    {"ticker": "BIOCON",      "name": "Biocon Ltd",                            "exchange": "NSE"},
    {"ticker": "BLUEDART",    "name": "Blue Dart Express Ltd",                 "exchange": "NSE"},
    {"ticker": "BLUESTARCO",  "name": "Blue Star Ltd",                         "exchange": "NSE"},
    {"ticker": "BPCL",        "name": "Bharat Petroleum Corporation Ltd",      "exchange": "NSE"},
    {"ticker": "BRIGADE",     "name": "Brigade Enterprises Ltd",               "exchange": "NSE"},
    {"ticker": "BRITANNIA",   "name": "Britannia Industries Ltd",              "exchange": "NSE"},
    {"ticker": "BSE",         "name": "BSE Ltd",                               "exchange": "NSE"},
    {"ticker": "CAMS",        "name": "Computer Age Management Services Ltd",  "exchange": "NSE"},
    {"ticker": "CANFINHOME",  "name": "Can Fin Homes Ltd",                     "exchange": "NSE"},
    {"ticker": "CANBK",       "name": "Canara Bank",                           "exchange": "NSE"},
    {"ticker": "CDSL",        "name": "Central Depository Services India Ltd", "exchange": "NSE"},
    {"ticker": "CEATLTD",     "name": "CEAT Ltd",                              "exchange": "NSE"},
    {"ticker": "CESC",        "name": "CESC Ltd",                              "exchange": "NSE"},
    {"ticker": "CGPOWER",     "name": "CG Power and Industrial Solutions Ltd", "exchange": "NSE"},
    {"ticker": "CHAMBLFERT",  "name": "Chambal Fertilisers and Chemicals Ltd", "exchange": "NSE"},
    {"ticker": "CHOLAFIN",    "name": "Cholamandalam Investment and Finance",  "exchange": "NSE"},
    {"ticker": "CIPLA",       "name": "Cipla Ltd",                             "exchange": "NSE"},
    {"ticker": "COALINDIA",   "name": "Coal India Ltd",                        "exchange": "NSE"},
    {"ticker": "COFORGE",     "name": "Coforge Ltd",                           "exchange": "NSE"},
    {"ticker": "COLPAL",      "name": "Colgate-Palmolive India Ltd",           "exchange": "NSE"},
    {"ticker": "CONCOR",      "name": "Container Corporation of India Ltd",    "exchange": "NSE"},
    {"ticker": "COROMANDEL",  "name": "Coromandel International Ltd",          "exchange": "NSE"},
    {"ticker": "CROMPTON",    "name": "Crompton Greaves Consumer Electricals", "exchange": "NSE"},
    {"ticker": "CUMMINSIND",  "name": "Cummins India Ltd",                     "exchange": "NSE"},
    {"ticker": "CYIENT",      "name": "Cyient Ltd",                            "exchange": "NSE"},
    {"ticker": "DALBHARAT",   "name": "Dalmia Bharat Ltd",                     "exchange": "NSE"},
    {"ticker": "DEEPAKNTR",   "name": "Deepak Nitrite Ltd",                    "exchange": "NSE"},
    {"ticker": "DELHIVERY",   "name": "Delhivery Ltd",                         "exchange": "NSE"},
    {"ticker": "DIVISLAB",    "name": "Divi's Laboratories Ltd",               "exchange": "NSE"},
    {"ticker": "DIXON",       "name": "Dixon Technologies India Ltd",          "exchange": "NSE"},
    {"ticker": "DLF",         "name": "DLF Ltd",                               "exchange": "NSE"},
    {"ticker": "DMART",       "name": "Avenue Supermarts Ltd",                 "exchange": "NSE"},
    {"ticker": "DRREDDY",     "name": "Dr Reddy's Laboratories Ltd",           "exchange": "NSE"},
    {"ticker": "EIDPARRY",    "name": "EID Parry India Ltd",                   "exchange": "NSE"},
    {"ticker": "EIHOTEL",     "name": "EIH Ltd",                               "exchange": "NSE"},
    {"ticker": "EMAMILTD",    "name": "Emami Ltd",                             "exchange": "NSE"},
    {"ticker": "ETERNAL",     "name": "Eternal Ltd",                           "exchange": "NSE"},
    {"ticker": "ESCORTS",     "name": "Escorts Kubota Ltd",                    "exchange": "NSE"},
    {"ticker": "EXIDEIND",    "name": "Exide Industries Ltd",                  "exchange": "NSE"},
    {"ticker": "FEDERALBNK",  "name": "Federal Bank Ltd",                      "exchange": "NSE"},
    {"ticker": "FORTIS",      "name": "Fortis Healthcare Ltd",                 "exchange": "NSE"},
    {"ticker": "GAIL",        "name": "GAIL India Ltd",                        "exchange": "NSE"},
    {"ticker": "GLENMARK",    "name": "Glenmark Pharmaceuticals Ltd",          "exchange": "NSE"},
    {"ticker": "GMRINFRA",    "name": "GMR Airports Infrastructure Ltd",       "exchange": "NSE"},
    {"ticker": "GODREJCP",    "name": "Godrej Consumer Products Ltd",          "exchange": "NSE"},
    {"ticker": "GODREJIND",   "name": "Godrej Industries Ltd",                 "exchange": "NSE"},
    {"ticker": "GODREJPROP",  "name": "Godrej Properties Ltd",                 "exchange": "NSE"},
    {"ticker": "GRANULES",    "name": "Granules India Ltd",                    "exchange": "NSE"},
    {"ticker": "GRASIM",      "name": "Grasim Industries Ltd",                 "exchange": "NSE"},
    {"ticker": "GUJGASLTD",   "name": "Gujarat Gas Ltd",                       "exchange": "NSE"},
    {"ticker": "HAL",         "name": "Hindustan Aeronautics Ltd",             "exchange": "NSE"},
    {"ticker": "HAPPSTMNDS",  "name": "Happiest Minds Technologies Ltd",       "exchange": "NSE"},
    {"ticker": "HCLTECH",     "name": "HCL Technologies Ltd",                  "exchange": "NSE"},
    {"ticker": "HDFCAMC",     "name": "HDFC Asset Management Co Ltd",          "exchange": "NSE"},
    {"ticker": "HDFCBANK",    "name": "HDFC Bank Ltd",                         "exchange": "NSE"},
    {"ticker": "HDFCLIFE",    "name": "HDFC Life Insurance Co Ltd",            "exchange": "NSE"},
    {"ticker": "HEROMOTOCO",  "name": "Hero MotoCorp Ltd",                     "exchange": "NSE"},
    {"ticker": "HINDCOPPER",  "name": "Hindustan Copper Ltd",                  "exchange": "NSE"},
    {"ticker": "HINDPETRO",   "name": "Hindustan Petroleum Corporation Ltd",   "exchange": "NSE"},
    {"ticker": "HINDUNILVR",  "name": "Hindustan Unilever Ltd",                "exchange": "NSE"},
    {"ticker": "HINDZINC",    "name": "Hindustan Zinc Ltd",                    "exchange": "NSE"},
    {"ticker": "HUDCO",       "name": "Housing and Urban Development Corp Ltd","exchange": "NSE"},
    {"ticker": "ICICIBANK",   "name": "ICICI Bank Ltd",                        "exchange": "NSE"},
    {"ticker": "ICICIGI",     "name": "ICICI Lombard General Insurance Co Ltd","exchange": "NSE"},
    {"ticker": "ICICIPRULI",  "name": "ICICI Prudential Life Insurance Co Ltd","exchange": "NSE"},
    {"ticker": "IDFCFIRSTB",  "name": "IDFC First Bank Ltd",                   "exchange": "NSE"},
    {"ticker": "IEX",         "name": "Indian Energy Exchange Ltd",            "exchange": "NSE"},
    {"ticker": "IGL",         "name": "Indraprastha Gas Ltd",                  "exchange": "NSE"},
    {"ticker": "INDHOTEL",    "name": "Indian Hotels Co Ltd",                  "exchange": "NSE"},
    {"ticker": "INDIAMART",   "name": "IndiaMART InterMESH Ltd",               "exchange": "NSE"},
    {"ticker": "INDIANB",     "name": "Indian Bank",                           "exchange": "NSE"},
    {"ticker": "INDIGO",      "name": "InterGlobe Aviation Ltd",               "exchange": "NSE"},
    {"ticker": "INDUSINDBK",  "name": "IndusInd Bank Ltd",                     "exchange": "NSE"},
    {"ticker": "INDUSTOWER",  "name": "Indus Towers Ltd",                      "exchange": "NSE"},
    {"ticker": "INFY",        "name": "Infosys Ltd",                           "exchange": "NSE"},
    {"ticker": "IOB",         "name": "Indian Overseas Bank",                  "exchange": "NSE"},
    {"ticker": "IOC",         "name": "Indian Oil Corporation Ltd",            "exchange": "NSE"},
    {"ticker": "IPCALAB",     "name": "IPCA Laboratories Ltd",                 "exchange": "NSE"},
    {"ticker": "IRCTC",       "name": "Indian Railway Catering and Tourism",   "exchange": "NSE"},
    {"ticker": "IRFC",        "name": "Indian Railway Finance Corporation Ltd","exchange": "NSE"},
    {"ticker": "ITC",         "name": "ITC Ltd",                               "exchange": "NSE"},
    {"ticker": "JIOFIN",      "name": "Jio Financial Services Ltd",            "exchange": "NSE"},
    {"ticker": "JKCEMENT",    "name": "JK Cement Ltd",                         "exchange": "NSE"},
    {"ticker": "JSWENERGY",   "name": "JSW Energy Ltd",                        "exchange": "NSE"},
    {"ticker": "JSWSTEEL",    "name": "JSW Steel Ltd",                         "exchange": "NSE"},
    {"ticker": "JUBLFOOD",    "name": "Jubilant Foodworks Ltd",                "exchange": "NSE"},
    {"ticker": "KAJARIACER",  "name": "Kajaria Ceramics Ltd",                  "exchange": "NSE"},
    {"ticker": "KALYANKJIL",  "name": "Kalyan Jewellers India Ltd",            "exchange": "NSE"},
    {"ticker": "KANSAINER",   "name": "Kansai Nerolac Paints Ltd",             "exchange": "NSE"},
    {"ticker": "KEC",         "name": "KEC International Ltd",                 "exchange": "NSE"},
    {"ticker": "KFINTECH",    "name": "KFin Technologies Ltd",                 "exchange": "NSE"},
    {"ticker": "KPITTECH",    "name": "KPIT Technologies Ltd",                 "exchange": "NSE"},
    {"ticker": "KOTAKBANK",   "name": "Kotak Mahindra Bank Ltd",               "exchange": "NSE"},
    {"ticker": "LALPATHLAB",  "name": "Dr Lal PathLabs Ltd",                   "exchange": "NSE"},
    {"ticker": "LAURUSLABS",  "name": "Laurus Labs Ltd",                       "exchange": "NSE"},
    {"ticker": "LICHSGFIN",   "name": "LIC Housing Finance Ltd",               "exchange": "NSE"},
    {"ticker": "LICI",        "name": "Life Insurance Corporation of India",   "exchange": "NSE"},
    {"ticker": "LT",          "name": "Larsen and Toubro Ltd",                 "exchange": "NSE"},
    {"ticker": "LTIM",        "name": "LTIMindtree Ltd",                       "exchange": "NSE"},
    {"ticker": "LTTS",        "name": "L&T Technology Services Ltd",           "exchange": "NSE"},
    {"ticker": "LUPIN",       "name": "Lupin Ltd",                             "exchange": "NSE"},
    {"ticker": "M&M",         "name": "Mahindra and Mahindra Ltd",             "exchange": "NSE"},
    {"ticker": "M&MFIN",      "name": "Mahindra and Mahindra Financial Services","exchange": "NSE"},
    {"ticker": "MANAPPURAM",  "name": "Manappuram Finance Ltd",                "exchange": "NSE"},
    {"ticker": "MARICO",      "name": "Marico Ltd",                            "exchange": "NSE"},
    {"ticker": "MARUTI",      "name": "Maruti Suzuki India Ltd",               "exchange": "NSE"},
    {"ticker": "MAZDOCK",     "name": "Mazagon Dock Shipbuilders Ltd",         "exchange": "NSE"},
    {"ticker": "MCX",         "name": "Multi Commodity Exchange of India Ltd", "exchange": "NSE"},
    {"ticker": "METROPOLIS",  "name": "Metropolis Healthcare Ltd",             "exchange": "NSE"},
    {"ticker": "MGL",         "name": "Mahanagar Gas Ltd",                     "exchange": "NSE"},
    {"ticker": "MOIL",        "name": "MOIL Ltd",                              "exchange": "NSE"},
    {"ticker": "MOTHERSON",   "name": "Samvardhana Motherson International Ltd","exchange": "NSE"},
    {"ticker": "MPHASIS",     "name": "Mphasis Ltd",                           "exchange": "NSE"},
    {"ticker": "MRF",         "name": "MRF Ltd",                               "exchange": "NSE"},
    {"ticker": "MUTHOOTFIN",  "name": "Muthoot Finance Ltd",                   "exchange": "NSE"},
    {"ticker": "NATCOPHARM",  "name": "Natco Pharma Ltd",                      "exchange": "NSE"},
    {"ticker": "NAUKRI",      "name": "Info Edge India Ltd",                   "exchange": "NSE"},
    {"ticker": "NAVINFLUOR",  "name": "Navin Fluorine International Ltd",      "exchange": "NSE"},
    {"ticker": "NBCC",        "name": "NBCC India Ltd",                        "exchange": "NSE"},
    {"ticker": "NCC",         "name": "NCC Ltd",                               "exchange": "NSE"},
    {"ticker": "NESTLEIND",   "name": "Nestle India Ltd",                      "exchange": "NSE"},
    {"ticker": "NMDC",        "name": "NMDC Ltd",                              "exchange": "NSE"},
    {"ticker": "NSLNISP",     "name": "NMDC Steel Ltd",                        "exchange": "NSE"},
    {"ticker": "NTPC",        "name": "NTPC Ltd",                              "exchange": "NSE"},
    {"ticker": "OBEROIRLTY",  "name": "Oberoi Realty Ltd",                     "exchange": "NSE"},
    {"ticker": "OFSS",        "name": "Oracle Financial Services Software Ltd","exchange": "NSE"},
    {"ticker": "OIL",         "name": "Oil India Ltd",                         "exchange": "NSE"},
    {"ticker": "ONGC",        "name": "Oil and Natural Gas Corporation Ltd",   "exchange": "NSE"},
    {"ticker": "PAGEIND",     "name": "Page Industries Ltd",                   "exchange": "NSE"},
    {"ticker": "PATANJALI",   "name": "Patanjali Foods Ltd",                   "exchange": "NSE"},
    {"ticker": "PAYTM",       "name": "One97 Communications Ltd",              "exchange": "NSE"},
    {"ticker": "PERSISTENT",  "name": "Persistent Systems Ltd",                "exchange": "NSE"},
    {"ticker": "PETRONET",    "name": "Petronet LNG Ltd",                      "exchange": "NSE"},
    {"ticker": "PHOENIXLTD",  "name": "Phoenix Mills Ltd",                     "exchange": "NSE"},
    {"ticker": "PIDILITIND",  "name": "Pidilite Industries Ltd",               "exchange": "NSE"},
    {"ticker": "PIIND",       "name": "PI Industries Ltd",                     "exchange": "NSE"},
    {"ticker": "PNB",         "name": "Punjab National Bank",                  "exchange": "NSE"},
    {"ticker": "POLYCAB",     "name": "Polycab India Ltd",                     "exchange": "NSE"},
    {"ticker": "POWERGRID",   "name": "Power Grid Corporation of India Ltd",   "exchange": "NSE"},
    {"ticker": "PRESTIGE",    "name": "Prestige Estates Projects Ltd",         "exchange": "NSE"},
    {"ticker": "PVRINOX",     "name": "PVR INOX Ltd",                          "exchange": "NSE"},
    {"ticker": "RADICO",      "name": "Radico Khaitan Ltd",                    "exchange": "NSE"},
    {"ticker": "RAILTEL",     "name": "RailTel Corporation of India Ltd",      "exchange": "NSE"},
    {"ticker": "RALLIS",      "name": "Rallis India Ltd",                      "exchange": "NSE"},
    {"ticker": "RAMCOCEM",    "name": "Ramco Cements Ltd",                     "exchange": "NSE"},
    {"ticker": "RATNAMANI",   "name": "Ratnamani Metals and Tubes Ltd",        "exchange": "NSE"},
    {"ticker": "RBLBANK",     "name": "RBL Bank Ltd",                          "exchange": "NSE"},
    {"ticker": "RECLTD",      "name": "REC Ltd",                               "exchange": "NSE"},
    {"ticker": "RELIANCE",    "name": "Reliance Industries Ltd",               "exchange": "NSE"},
    {"ticker": "RITES",       "name": "RITES Ltd",                             "exchange": "NSE"},
    {"ticker": "SAIL",        "name": "Steel Authority of India Ltd",          "exchange": "NSE"},
    {"ticker": "SBICARD",     "name": "SBI Cards and Payment Services Ltd",    "exchange": "NSE"},
    {"ticker": "SBILIFE",     "name": "SBI Life Insurance Co Ltd",             "exchange": "NSE"},
    {"ticker": "SBIN",        "name": "State Bank of India",                   "exchange": "NSE"},
    {"ticker": "SHREECEM",    "name": "Shree Cement Ltd",                      "exchange": "NSE"},
    {"ticker": "SHRIRAMFIN",  "name": "Shriram Finance Ltd",                   "exchange": "NSE"},
    {"ticker": "SIEMENS",     "name": "Siemens Ltd",                           "exchange": "NSE"},
    {"ticker": "SOBHA",       "name": "Sobha Ltd",                             "exchange": "NSE"},
    {"ticker": "SOLARINDS",   "name": "Solar Industries India Ltd",            "exchange": "NSE"},
    {"ticker": "SRF",         "name": "SRF Ltd",                               "exchange": "NSE"},
    {"ticker": "STARHEALTH",  "name": "Star Health and Allied Insurance Co Ltd","exchange": "NSE"},
    {"ticker": "SUNPHARMA",   "name": "Sun Pharmaceutical Industries Ltd",     "exchange": "NSE"},
    {"ticker": "SUNTV",       "name": "Sun TV Network Ltd",                    "exchange": "NSE"},
    {"ticker": "SUPREMEIND",  "name": "Supreme Industries Ltd",                "exchange": "NSE"},
    {"ticker": "SUZLON",      "name": "Suzlon Energy Ltd",                     "exchange": "NSE"},
    {"ticker": "SYNGENE",     "name": "Syngene International Ltd",             "exchange": "NSE"},
    {"ticker": "TATACHEM",    "name": "Tata Chemicals Ltd",                    "exchange": "NSE"},
    {"ticker": "TATACOMM",    "name": "Tata Communications Ltd",               "exchange": "NSE"},
    {"ticker": "TATACONSUM",  "name": "Tata Consumer Products Ltd",            "exchange": "NSE"},
    {"ticker": "TATAELXSI",   "name": "Tata Elxsi Ltd",                        "exchange": "NSE"},
    {"ticker": "TATAMOTORS",  "name": "Tata Motors Ltd",                       "exchange": "NSE"},
    {"ticker": "TATAPOWER",   "name": "Tata Power Co Ltd",                     "exchange": "NSE"},
    {"ticker": "TATASTEEL",   "name": "Tata Steel Ltd",                        "exchange": "NSE"},
    {"ticker": "TCS",         "name": "Tata Consultancy Services Ltd",         "exchange": "NSE"},
    {"ticker": "TECHM",       "name": "Tech Mahindra Ltd",                     "exchange": "NSE"},
    {"ticker": "THERMAX",     "name": "Thermax Ltd",                           "exchange": "NSE"},
    {"ticker": "TITAN",       "name": "Titan Company Ltd",                     "exchange": "NSE"},
    {"ticker": "TORNTPHARM",  "name": "Torrent Pharmaceuticals Ltd",           "exchange": "NSE"},
    {"ticker": "TORNTPOWER",  "name": "Torrent Power Ltd",                     "exchange": "NSE"},
    {"ticker": "TRENT",       "name": "Trent Ltd",                             "exchange": "NSE"},
    {"ticker": "TRIDENT",     "name": "Trident Ltd",                           "exchange": "NSE"},
    {"ticker": "TVSMOTOR",    "name": "TVS Motor Co Ltd",                      "exchange": "NSE"},
    {"ticker": "ULTRACEMCO",  "name": "UltraTech Cement Ltd",                  "exchange": "NSE"},
    {"ticker": "UNIONBANK",   "name": "Union Bank of India",                   "exchange": "NSE"},
    {"ticker": "UPL",         "name": "UPL Ltd",                               "exchange": "NSE"},
    {"ticker": "VBL",         "name": "Varun Beverages Ltd",                   "exchange": "NSE"},
    {"ticker": "VEDL",        "name": "Vedanta Ltd",                           "exchange": "NSE"},
    {"ticker": "VINATIORGA",  "name": "Vinati Organics Ltd",                   "exchange": "NSE"},
    {"ticker": "VOLTAS",      "name": "Voltas Ltd",                            "exchange": "NSE"},
    {"ticker": "WELCORP",     "name": "Welspun Corp Ltd",                      "exchange": "NSE"},
    {"ticker": "WHIRLPOOL",   "name": "Whirlpool of India Ltd",                "exchange": "NSE"},
    {"ticker": "WIPRO",       "name": "Wipro Ltd",                             "exchange": "NSE"},
    {"ticker": "YESBANK",     "name": "Yes Bank Ltd",                          "exchange": "NSE"},
    {"ticker": "ZEEL",        "name": "Zee Entertainment Enterprises Ltd",     "exchange": "NSE"},
    {"ticker": "ZOMATO",      "name": "Zomato Ltd",                            "exchange": "NSE"},
    {"ticker": "ZYDUSLIFE",   "name": "Zydus Lifesciences Ltd",                "exchange": "NSE"},
]


def _load_cache():
    if os.path.exists(CACHE_FILE):
        age = time.time() - os.path.getmtime(CACHE_FILE)
        if age < CACHE_TTL:
            with open(CACHE_FILE, "r") as f:
                return json.load(f)
    return None


def _save_cache(data):
    try:
        with open(CACHE_FILE, "w") as f:
            json.dump(data, f)
    except Exception as e:
        print(f"Cache save failed: {e}")


def fetch_nse_all_stocks():
    """Fetch complete NSE stock list from NSE CSV."""
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        resp = requests.get(
            "https://archives.nseindia.com/content/equities/EQUITY_L.csv",
            headers=headers,
            timeout=15
        )
        if resp.status_code == 200:
            stocks = []
            lines = resp.text.strip().split("\n")
            for line in lines[1:]:
                parts = line.split(",")
                if len(parts) >= 2:
                    ticker = parts[0].strip().strip('"')
                    name   = parts[1].strip().strip('"')
                    if ticker:
                        stocks.append({
                            "ticker":   ticker,
                            "name":     name,
                            "exchange": "NSE"
                        })
            return stocks
    except Exception as e:
        print(f"NSE CSV fetch failed: {e}")
    return []


def get_all_stocks():
    """
    Get complete NSE stock list.
    Uses cache to avoid fetching every time.
    Always merges recent IPOs.
    """
    cached = _load_cache()

    if cached:
        print(f"Loaded {len(cached)} stocks from cache")
        # Merge recent IPOs into cached list
        cached_tickers = {s["ticker"] for s in cached}
        for ipo in RECENT_IPOS:
            if ipo["ticker"] not in cached_tickers:
                cached.append(ipo)
        return cached

    print("Fetching fresh NSE stock list...")
    stocks = fetch_nse_all_stocks()

    if stocks:
        # Merge recent IPOs
        existing_tickers = {s["ticker"] for s in stocks}
        for ipo in RECENT_IPOS:
            if ipo["ticker"] not in existing_tickers:
                stocks.append(ipo)

        # Sort alphabetically
        stocks.sort(key=lambda x: x["ticker"])
        _save_cache(stocks)
        print(f"Fetched and cached {len(stocks)} stocks")
        return stocks

    # Fallback to hardcoded list
    print("NSE fetch failed — using fallback list")
    combined = FALLBACK_STOCKS.copy()
    existing = {s["ticker"] for s in combined}
    for ipo in RECENT_IPOS:
        if ipo["ticker"] not in existing:
            combined.append(ipo)
    combined.sort(key=lambda x: x["ticker"])
    return combined


def search_stocks_list(query: str, limit: int = 8):
    """Search stocks by ticker or name."""
    if not query or len(query) < 1:
        return []

    all_stocks = get_all_stocks()
    q = query.upper().strip()

    # Priority 1 — exact ticker match
    exact = [s for s in all_stocks if s["ticker"] == q]

    # Priority 2 — ticker starts with query
    starts = [s for s in all_stocks
              if s["ticker"].startswith(q) and s not in exact]

    # Priority 3 — name starts with query
    name_starts = [s for s in all_stocks
                   if s["name"].upper().startswith(q)
                   and s not in exact and s not in starts]

    # Priority 4 — contains in ticker or name
    contains = [s for s in all_stocks
                if (q in s["ticker"] or q in s["name"].upper())
                and s not in exact
                and s not in starts
                and s not in name_starts]

    results = exact + starts + name_starts + contains
    return results[:limit]