"""
Single source of truth for the SwingPulse ticker universe.

Both fetch_and_score.py and enrich_moomoo.py import from here so the
two scripts always operate on the same set of symbols.

Categories
----------
penny      : High-volatility, low-float swing plays typically under $15
high-div   : High-dividend-yield income plays (>= ~4% yield)
mod-div    : Moderate-dividend-yield sector leaders (1–4% yield)
"""

from typing import TypedDict


class TickerMeta(TypedDict):
    name: str
    category: str          # 'penny' | 'high-div' | 'mod-div'
    sector: str
    industry: str
    description: str       # 1-sentence plain-English company summary
    catalysts: list[str]   # near-term upside drivers
    risks: list[str]       # key downside risks
    dividend_yield: float  # annual %, 0.0 if none
    trader_tip: str        # short swing-trade insight


TICKER_META: dict[str, TickerMeta] = {
    # ── Penny / Growth swing plays ─────────────────────────────────────────
    "PLUG": {
        "name": "Plug Power",
        "category": "penny",
        "sector": "Energy",
        "industry": "Hydrogen Fuel Cells",
        "description": "Hydrogen fuel-cell systems for industrial forklifts, EV charging, and green-hydrogen production.",
        "catalysts": [
            "DOE hydrogen-hub grant disbursements",
            "Green-hydrogen electrolyzer orders from EU partners",
            "Revenue ramp at Georgia plant",
        ],
        "risks": [
            "Persistent cash burn and dilution risk",
            "Hydrogen infrastructure buildout slower than expected",
            "Rising cost of capital",
        ],
        "dividend_yield": 0.0,
        "trader_tip": "High beta — watch for squeeze setups on clean-energy policy headlines.",
    },
    "MARA": {
        "name": "Marathon Digital",
        "category": "penny",
        "sector": "Technology",
        "industry": "Bitcoin Mining",
        "description": "One of the largest US publicly-traded Bitcoin miners, holding BTC on its balance sheet.",
        "catalysts": [
            "Bitcoin price appreciation directly boosts revenue and BTC reserves",
            "Post-halving miner attrition gives hashrate-share tailwind",
            "New data-center capacity coming online",
        ],
        "risks": [
            "BTC price is single biggest variable — 50%+ drawdowns possible",
            "Energy-cost spikes squeeze mining margins",
            "Regulatory crackdown on crypto mining",
        ],
        "dividend_yield": 0.0,
        "trader_tip": "Trades as a 2–3× levered BTC proxy; use BTC price as leading indicator.",
    },
    "SOFI": {
        "name": "SoFi Technologies",
        "category": "penny",
        "sector": "Financials",
        "industry": "Digital Banking / Fintech",
        "description": "Digital-first bank offering student loan refinancing, personal loans, investing, and checking/savings.",
        "catalysts": [
            "Bank charter lets SoFi hold deposits and lend at spread",
            "Cross-sell rate increasing across member base",
            "Path to GAAP profitability driving re-rating",
        ],
        "risks": [
            "Credit-quality deterioration in personal loan portfolio",
            "High-rate environment pressures loan origination volumes",
            "Intense fintech competition from Chime, Robinhood",
        ],
        "dividend_yield": 0.0,
        "trader_tip": "Earnings reactions are outsized — position sizing matters around reports.",
    },
    "NIO": {
        "name": "NIO Inc",
        "category": "penny",
        "sector": "Consumer Discretionary",
        "industry": "Electric Vehicles (China)",
        "description": "Premium Chinese EV maker offering battery-swap technology and an in-car AI assistant.",
        "catalysts": [
            "Battery-as-a-service subscription growth lowers upfront vehicle cost",
            "New mass-market sub-brand Onvo targeting broader EV buyers",
            "EU market expansion",
        ],
        "risks": [
            "Intensifying price war with BYD and Tesla in China",
            "US/China geopolitical tensions and potential delisting risk",
            "Cash burn and financing needs",
        ],
        "dividend_yield": 0.0,
        "trader_tip": "Sensitive to CNY/USD moves and US-China trade headlines; gap-up/gap-down prone.",
    },
    "XPEV": {
        "name": "XPeng Inc",
        "category": "penny",
        "sector": "Consumer Discretionary",
        "industry": "Electric Vehicles (China)",
        "description": "Chinese EV maker focused on software-defined vehicles and XNGP autonomous driving stack.",
        "catalysts": [
            "MONA M03 sedan outselling expectations at sub-$16k price",
            "XNGP full-scenario NGP rollout across more cities",
            "Volkswagen strategic partnership providing cash and technology credibility",
        ],
        "risks": [
            "Price war erosion of ASPs and margins",
            "Slower-than-expected autonomous driving regulatory approval",
            "ADR geopolitical overhang",
        ],
        "dividend_yield": 0.0,
        "trader_tip": "Pairs well with NIO as a China-EV basket trade; watch delivery monthly data.",
    },
    "SNAP": {
        "name": "Snap Inc",
        "category": "penny",
        "sector": "Communication Services",
        "industry": "Social Media / AR",
        "description": "Social camera app with 800M+ daily active users and an augmented-reality advertising platform.",
        "catalysts": [
            "Snapchat+ paid subscriber growth monetising the superfan base",
            "AR Spectacles v5 hardware could open enterprise AR market",
            "Direct-response ad platform gaining SMB share",
        ],
        "risks": [
            "Ad revenue concentration in a cyclical market",
            "Instagram Reels and TikTok competing for Gen-Z time",
            "Ongoing GAAP losses and stock-based compensation dilution",
        ],
        "dividend_yield": 0.0,
        "trader_tip": "Volatile around earnings; implied-vol often rich — consider spreads over directional bets.",
    },
    "NOK": {
        "name": "Nokia",
        "category": "penny",
        "sector": "Technology",
        "industry": "Telecom Equipment / 5G",
        "description": "Finnish telecom-equipment vendor supplying 5G RAN, IP routing, and optical networking globally.",
        "catalysts": [
            "5G private-network (enterprise) deals with manufacturers and ports",
            "India 5G buildout demand",
            "Cost-restructuring program improving margins",
        ],
        "risks": [
            "Ericsson and Huawei remain fierce price competitors",
            "Lumpy capex cycles at telco customers",
            "Potential patent-licensing headwinds",
        ],
        "dividend_yield": 2.1,
        "trader_tip": "Low-beta steady mover; swings on 5G contract wins and telco capex guidance.",
    },

    # ── High-Dividend-Yield plays ───────────────────────────────────────────
    "MPC": {
        "name": "Marathon Petroleum",
        "category": "high-div",
        "sector": "Energy",
        "industry": "Oil Refining & Marketing",
        "description": "Largest US petroleum refiner by capacity, with 13 refineries and the MPLX MLP pipeline network.",
        "catalysts": [
            "Strong crack spreads in summer driving season",
            "MPLX distributions accretive to MPC cash flow",
            "Share buyback program reducing float",
        ],
        "risks": [
            "Refining margins compress if crude-product spread narrows",
            "Demand destruction in a recession",
            "ESG-driven capital allocation away from refining",
        ],
        "dividend_yield": 2.2,
        "trader_tip": "Crack-spread data (3-2-1 spread) is the key leading indicator — track weekly EIA data.",
    },
    "VALE": {
        "name": "Vale S.A.",
        "category": "high-div",
        "sector": "Materials",
        "industry": "Iron Ore & Base Metals Mining",
        "description": "Brazilian mining giant — world's largest iron-ore producer and a major nickel supplier.",
        "catalysts": [
            "China stimulus driving iron-ore price recovery",
            "Nickel demand from EV battery supply chains",
            "Samarco dam-liability resolution removing overhang",
        ],
        "risks": [
            "China property-sector weakness suppressing steel demand",
            "BRL/USD currency exposure",
            "Environmental litigation and dam-failure liabilities",
        ],
        "dividend_yield": 7.8,
        "trader_tip": "Tight correlation to iron-ore futures (SGX) and CNY — watch China PMI for direction.",
    },
    "F": {
        "name": "Ford Motor",
        "category": "high-div",
        "sector": "Consumer Discretionary",
        "industry": "Automobiles",
        "description": "Legacy US automaker transitioning to EVs with the F-150 Lightning and Mustang Mach-E while defending its profitable truck and commercial vehicle franchises.",
        "catalysts": [
            "F-Series truck dominance sustains high-margin revenue",
            "Ford Pro commercial-vehicle software subscriptions growing",
            "EV cost cuts narrowing Model e segment losses",
        ],
        "risks": [
            "UAW labor cost increases reduce margins",
            "EV transition losses larger than expected (Model e segment)",
            "Supply-chain disruptions and inventory normalisation",
        ],
        "dividend_yield": 5.6,
        "trader_tip": "Dividend yield acts as price support; trade the range between earnings catalysts.",
    },
    "AAL": {
        "name": "American Airlines",
        "category": "high-div",
        "sector": "Industrials",
        "industry": "Airlines",
        "description": "One of the largest US carriers by revenue, operating domestic and international routes.",
        "catalysts": [
            "Strong leisure travel demand and corporate travel recovery",
            "Fuel-cost reduction from hedging or lower crude",
            "Revenue-management improvements from new distribution strategy",
        ],
        "risks": [
            "High debt load ($37B+) constrains financial flexibility",
            "Fuel-price spikes directly hit margins",
            "Labor-contract renegotiations adding cost",
        ],
        "dividend_yield": 0.0,
        "trader_tip": "Jet-fuel futures and TSA checkpoint data are the two best leading signals.",
    },
    "LMT": {
        "name": "Lockheed Martin",
        "category": "high-div",
        "sector": "Industrials",
        "industry": "Aerospace & Defense",
        "description": "World's largest defense contractor — F-35 fighter, Sikorsky helicopters, hypersonic missiles.",
        "catalysts": [
            "NATO nations raising defense budgets post-Ukraine war",
            "F-35 multiyear production contracts provide backlog visibility",
            "Hypersonic and missile-defense program awards",
        ],
        "risks": [
            "F-35 sustainment cost overruns affecting future contract awards",
            "US defense budget sequestration risk",
            "Geopolitical de-escalation could reduce demand",
        ],
        "dividend_yield": 2.8,
        "trader_tip": "Defence stocks re-rate on geopolitical flare-ups — add on geopolitical calm pullbacks.",
    },
    "GE": {
        "name": "GE Aerospace",
        "category": "high-div",
        "sector": "Industrials",
        "industry": "Aerospace Engines & Services",
        "description": "Pure-play aerospace company (post GE Vernova spinoff) supplying jet engines and aftermarket services to commercial and defense aviation.",
        "catalysts": [
            "Commercial aviation recovery driving record engine orders",
            "LEAP and GE9X aftermarket services growing at high margins",
            "Defense next-gen engine programmes (XA100 AETP)",
        ],
        "risks": [
            "Boeing 737 MAX production delays reduce LEAP engine deliveries",
            "Supply-chain bottlenecks (castings, forgings) limit output",
            "Pension and legacy liabilities",
        ],
        "dividend_yield": 0.8,
        "trader_tip": "Follow Boeing/Airbus delivery schedules as a 3–6 month leading indicator.",
    },
    "FDX": {
        "name": "FedEx",
        "category": "high-div",
        "sector": "Industrials",
        "industry": "Air Freight & Logistics",
        "description": "Global express delivery and ground freight network; pursuing DRIVE cost-reduction and network-2.0 consolidation.",
        "catalysts": [
            "DRIVE cost programme delivering $4B cumulative savings",
            "Network-2.0 merging Express and Ground improving utilisation",
            "E-commerce volume recovery boosting parcel density",
        ],
        "risks": [
            "Volume softness if macro slows consumer spending",
            "Amazon Logistics build-out competing for B2C parcels",
            "Fuel surcharge lag in a rising-oil environment",
        ],
        "dividend_yield": 2.3,
        "trader_tip": "FedEx guidance is a macro bellwether — big earnings reactions create swing entries.",
    },
    "MU": {
        "name": "Micron Technology",
        "category": "high-div",
        "sector": "Technology",
        "industry": "Semiconductors (Memory)",
        "description": "Leading US manufacturer of DRAM and NAND flash memory chips used in AI servers, PCs, smartphones, and automotive.",
        "catalysts": [
            "HBM3E AI-server memory demand from NVIDIA and AMD platforms",
            "DRAM pricing recovery from a cyclical trough",
            "CHIPS Act domestic fab investment in Idaho and New York",
        ],
        "risks": [
            "Memory pricing is highly cyclical — oversupply can collapse margins",
            "Samsung and SK Hynix aggressive supply additions",
            "China export-control restrictions on advanced chips",
        ],
        "dividend_yield": 0.5,
        "trader_tip": "Memory pricing cycles lead earnings by 1–2 quarters; track DRAM spot prices weekly.",
    },
    "AMAT": {
        "name": "Applied Materials",
        "category": "high-div",
        "sector": "Technology",
        "industry": "Semiconductor Equipment",
        "description": "World's largest semiconductor equipment company, supplying CVD, PVD, etch, and inspection tools for chip fabs.",
        "catalysts": [
            "Leading-edge logic (gate-all-around, backside power) node transitions driving equipment intensity",
            "NAND capacity additions as pricing recovers",
            "Services & subscriptions segment (AGS) growing recurrently",
        ],
        "risks": [
            "China export controls restrict sales of advanced tools",
            "Fab capex cuts if chip demand weakens",
            "Customer concentration (TSMC, Samsung, Intel)",
        ],
        "dividend_yield": 0.9,
        "trader_tip": "Leads memory and logic capex cycles by 6 months; equipment book-to-bill is the key metric.",
    },
    "CIEN": {
        "name": "Ciena Corp",
        "category": "high-div",
        "sector": "Technology",
        "industry": "Optical Networking",
        "description": "Optical and routing networking solutions for telcos and cloud providers, with WaveLogic coherent optics and Blue Planet software.",
        "catalysts": [
            "AI data-centre buildout driving 800G/1.6T optical upgrade cycle",
            "AT&T and Verizon fiber-densification spending",
            "Blue Planet software subscription revenue expanding margins",
        ],
        "risks": [
            "Telco capex volatility on macro slowdown",
            "Huawei competing aggressively in international markets",
            "Inventory digestion at large cloud customers",
        ],
        "dividend_yield": 0.0,
        "trader_tip": "Moves sharply on cloud hyperscaler capex commentary — listen to MSFT/AMZN/GOOGL calls.",
    },
    "FIX": {
        "name": "Comfort Systems USA",
        "category": "high-div",
        "sector": "Industrials",
        "industry": "HVAC & Mechanical Construction",
        "description": "Leading US mechanical and electrical contractor specialising in HVAC, plumbing, and data-centre fit-out.",
        "catalysts": [
            "Explosive data-centre cooling demand from AI buildout",
            "IRA-driven manufacturing facility construction",
            "Backlog at record highs providing revenue visibility",
        ],
        "risks": [
            "Labour shortages in skilled trades",
            "Higher-for-longer interest rates slow commercial real-estate starts",
            "Project execution risk on large data-centre contracts",
        ],
        "dividend_yield": 0.4,
        "trader_tip": "Earnings beats are frequent — data-centre cooling is a structural tailwind not priced into the multiple.",
    },

    # ── Moderate-Dividend-Yield sector leaders ──────────────────────────────
    "NVDA": {
        "name": "NVIDIA",
        "category": "mod-div",
        "sector": "Technology",
        "industry": "Semiconductors (GPU / AI)",
        "description": "Dominant AI accelerator company — H100/H200/Blackwell GPUs power cloud AI training, and CUDA software creates a deep moat.",
        "catalysts": [
            "Blackwell GPU demand significantly exceeding supply",
            "Sovereign-AI buildouts (UAE, Japan, India) expanding TAM",
            "NIM software stack monetising inference at the edge",
        ],
        "risks": [
            "Export controls cutting off China revenue (~20% of sales)",
            "AMD MI300X and custom TPUs competing for hyperscaler budgets",
            "Valuation stretched; any guidance miss punished severely",
        ],
        "dividend_yield": 0.03,
        "trader_tip": "Leading indicator for the entire AI theme — trades like a macro factor, not just a stock.",
    },
    "META": {
        "name": "Meta Platforms",
        "category": "mod-div",
        "sector": "Communication Services",
        "industry": "Social Media / Digital Advertising",
        "description": "Operator of Facebook, Instagram, WhatsApp, and Threads; investing heavily in AI-driven advertising and the metaverse via Reality Labs.",
        "catalysts": [
            "Llama AI models powering ad-targeting improvements",
            "Threads user growth opening a new ad inventory surface",
            "WhatsApp monetisation (click-to-message ads) in emerging markets",
        ],
        "risks": [
            "Reality Labs burning $15B+ annually with unclear ROI timeline",
            "Regulatory antitrust action (FTC Instagram/WhatsApp divestiture case)",
            "Apple ATT tracking changes capping mobile ad targeting precision",
        ],
        "dividend_yield": 0.35,
        "trader_tip": "Ad-spend PMI surveys are a leading indicator; META typically outperforms in reflationary regimes.",
    },
    "TSLA": {
        "name": "Tesla",
        "category": "mod-div",
        "sector": "Consumer Discretionary",
        "industry": "Electric Vehicles & Energy",
        "description": "World's most valuable EV brand; expanding into energy storage (Megapack), FSD robotaxi licensing, and humanoid robots (Optimus).",
        "catalysts": [
            "Robotaxi network launch via unsupervised FSD",
            "Optimus humanoid robot first commercial units",
            "Megapack energy-storage backlog providing recurring revenue",
        ],
        "risks": [
            "Price war with BYD eroding EV margins",
            "CEO distraction risk from other ventures",
            "FSD regulatory approvals slower than guided",
        ],
        "dividend_yield": 0.0,
        "trader_tip": "Delivery numbers monthly are the key catalyst; implied vol is structurally elevated — use spreads.",
    },
    "AMZN": {
        "name": "Amazon",
        "category": "mod-div",
        "sector": "Consumer Discretionary",
        "industry": "E-Commerce & Cloud Computing",
        "description": "World's largest cloud provider (AWS), e-commerce marketplace, and digital-advertising platform.",
        "catalysts": [
            "AWS re-acceleration on AI workload migration",
            "Advertising segment growing 20%+ annually",
            "Logistics efficiency gains expanding retail operating margins",
        ],
        "risks": [
            "Antitrust regulatory scrutiny of marketplace and AWS",
            "Heavy capex cycle for AWS AI infrastructure weighing on FCF",
            "Macro slowdown reducing consumer discretionary spend",
        ],
        "dividend_yield": 0.0,
        "trader_tip": "AWS segment margin is the single most important line in each earnings report.",
    },
    "MSFT": {
        "name": "Microsoft",
        "category": "mod-div",
        "sector": "Technology",
        "industry": "Cloud Computing & Enterprise Software",
        "description": "Azure cloud, Microsoft 365 productivity suite, GitHub, LinkedIn, and Copilot AI assistant — one of the widest-moat businesses in tech.",
        "catalysts": [
            "Azure AI services (OpenAI partnership) driving cloud re-acceleration",
            "Copilot M365 seat attach-rate monetising enterprise base",
            "Gaming franchise (Activision) adding content scale",
        ],
        "risks": [
            "Azure growth deceleration if AI workload wins slow",
            "Regulatory scrutiny of OpenAI exclusive partnership",
            "High capex on data-centre buildout compressing near-term FCF",
        ],
        "dividend_yield": 0.8,
        "trader_tip": "Azure growth-rate delta vs. consensus is the key print; anything above 30% typically lifts the stock.",
    },
    "AAPL": {
        "name": "Apple",
        "category": "mod-div",
        "sector": "Technology",
        "industry": "Consumer Electronics & Services",
        "description": "iPhone ecosystem anchoring the world's most profitable consumer-hardware and services franchise (App Store, iCloud, Apple Pay).",
        "catalysts": [
            "Apple Intelligence (on-device AI) driving iPhone upgrade super-cycle",
            "Services segment growing 15%+ annually at 70%+ gross margins",
            "India manufacturing expansion reducing China supply-chain risk",
        ],
        "risks": [
            "China revenue (~20% of sales) exposed to geopolitical tensions",
            "Antitrust action against App Store 30% commission",
            "iPhone unit saturation in developed markets",
        ],
        "dividend_yield": 0.5,
        "trader_tip": "Services-revenue guidance is now more important than hardware units for multiple expansion.",
    },
    "GOOGL": {
        "name": "Alphabet",
        "category": "mod-div",
        "sector": "Communication Services",
        "industry": "Internet Search & Cloud",
        "description": "Owner of Google Search, YouTube, Google Cloud, and DeepMind — generating 75%+ of revenue from digital advertising.",
        "catalysts": [
            "Gemini AI integration into Search (AI Overviews) maintaining query monetisation",
            "Google Cloud accelerating above 28% growth on AI workloads",
            "YouTube Shorts monetisation closing the gap with long-form",
        ],
        "risks": [
            "AI-native search challengers (Perplexity, ChatGPT) eroding Search query share",
            "DOJ antitrust remedies potentially forcing Chrome or Android divestiture",
            "TAC costs rising as AI answers reduce ad-click volume",
        ],
        "dividend_yield": 0.5,
        "trader_tip": "Search-revenue-per-query trend is the metric to watch; Cloud margin expansion is the re-rating catalyst.",
    },
}

# Derived exports — these are what fetch_and_score.py and enrich_moomoo.py import
UNIVERSE: list[str] = list(TICKER_META.keys())

TICKER_NAMES: dict[str, str] = {k: v["name"] for k, v in TICKER_META.items()}
