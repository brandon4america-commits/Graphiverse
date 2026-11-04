import { GraphData, NodeType, ClusterStability, CustomSceneKeyframe } from './types';

export const INITIAL_GRAPH_DATA: GraphData = {
  clusters: [
    {
      id: 'c-solar-system',
      name: 'I. Solar System & Ocean Worlds',
      stability: ClusterStability.SETTLED,
      center: { x: -210, y: 60, z: 90 },
      scaleRegime: 'SOLAR_SYSTEM',
      distanceRange: '0 – 30 AU (10⁻⁵ ly)',
      description: 'Subsurface oceans, hydrothermal vent plumes, and cryo-organic hydrocarbon seas across Europa, Enceladus, Titan, and Mars Jezero Crater.'
    },
    {
      id: 'c-local-exoplanets',
      name: 'II. Local Interstellar & Hycean Exoplanets',
      stability: ClusterStability.CONTESTED,
      center: { x: -75, y: 120, z: -135 },
      scaleRegime: 'EXOPLANETARY',
      distanceRange: '4.2 – 124 ly',
      description: 'temperate terrestrial and Hycean exoplanet atmospheres probed via JWST NIRSpec/MIRI transmission spectroscopy for biogenic organosulfur disequilibrium.'
    },
    {
      id: 'c-orion-nurseries',
      name: 'III. Orion-Cygnus Prebiotic Nurseries',
      stability: ClusterStability.EMERGING,
      center: { x: 115, y: 95, z: 120 },
      scaleRegime: 'PREBIOTIC_NURSERY',
      distanceRange: '450 – 26,000 ly',
      description: 'Dense molecular clouds and protoplanetary disks synthesizing chiral amino acids, cyanopolyynes, and nucleobase precursors on interstellar ice grains.'
    },
    {
      id: 'c-galactic-core',
      name: 'IV. Milky Way Core & Relativistic Jets',
      stability: ClusterStability.SETTLED,
      center: { x: 195, y: -65, z: -90 },
      scaleRegime: 'GALACTIC_CORE',
      distanceRange: '26,670 ly (8.18 kpc)',
      description: 'Supermassive Kerr black hole Sagittarius A*, magnetar plasma filaments, and Fermi gamma-ray bubbles shaping galactic habitability zones.'
    },
    {
      id: 'c-local-group',
      name: 'V. Local Group & Galactic Filaments',
      stability: ClusterStability.EMERGING,
      center: { x: -45, y: -155, z: -140 },
      scaleRegime: 'LOCAL_GROUP',
      distanceRange: '0.16 – 2.95 Mly',
      description: 'Gravitational tidal streams linking the Milky Way, Magellanic Clouds, Andromeda (M31), and Triangulum (M33) across the Local Sheet.'
    },
    {
      id: 'c-laniakea-web',
      name: 'VI. Laniakea Supercluster & Cosmic Web',
      stability: ClusterStability.SETTLED,
      center: { x: 35, y: -130, z: 185 },
      scaleRegime: 'SUPERCLUSTER',
      distanceRange: '54 Mly – 13.8 Gly',
      description: 'Large-scale peculiar velocity basin of the Great Attractor, Virgo Supercluster filaments, and the Cosmic Microwave Background surface of last scattering.'
    }
  ],
  nodes: [
    // Sector I: Solar System & Ocean Worlds
    {
      id: 'n-europa-ocean',
      label: 'Europa Subsurface Ocean & ATP Bioenergetics',
      type: NodeType.CLAIM,
      clusterId: 'c-solar-system',
      val: 24,
      confidence: 0.94,
      source: 'Europa Clipper / Galileo Magnetometry Archive',
      description: 'Induced magnetic field signatures confirm a global 100-km-deep briny subsurface ocean beneath Europa’s icy shell capable of sustaining proton-gradient chemosynthesis.',
      citations: ['Kivelson et al., Science 2000', 'Vance et al., Astrobiology 2023'],
      scaleRegime: 'SOLAR_SYSTEM',
      distanceLabel: '4.20 AU (6.28 × 10⁸ km)',
      coordinatesRaDec: 'RA 04h 55m 10s | Dec +22° 10′',
      effectiveTempK: 102,
      pubchemCid: 962,
      compoundName: 'Water (H₂O)',
      uniprotId: 'P0ABB0',
      pdbId: '1RCX',
      organismName: 'Subsurface Chemoautotrophic Model'
    },
    {
      id: 'n-enceladus-plumes',
      label: 'Enceladus South Polar Hydrothermal H₂ & CH₄ Plumes',
      type: NodeType.EVIDENCE,
      clusterId: 'c-solar-system',
      val: 22,
      confidence: 0.97,
      source: 'Cassini INMS & CDA Mass Spectrometry',
      description: 'Direct sampling of Enceladus cryovolcanic plumes detects molecular hydrogen (H₂), methane (CH₄), carbon dioxide, and macromolecular organic fragments > 200 Da.',
      citations: ['Waite et al., Science 2017', 'Postberg et al., Nature 2018'],
      scaleRegime: 'SOLAR_SYSTEM',
      distanceLabel: '9.54 AU (1.43 × 10⁹ km)',
      coordinatesRaDec: 'RA 22h 18m 44s | Dec -12° 04′',
      effectiveTempK: 75,
      pubchemCid: 297,
      compoundName: 'Methane (CH₄)',
      pdbId: '1RCX'
    },
    {
      id: 'n-titan-azotosome',
      label: 'Titan Kraken Mare Acrylonitrile Vinyl Cyanide Membranes',
      type: NodeType.IDEA,
      clusterId: 'c-solar-system',
      val: 20,
      confidence: 0.89,
      source: 'ALMA Submillimeter Array Cycle 4',
      description: 'ALMA rotational line detections confirm 2.8 ppb vinyl cyanide (C₂H₃CN) in Titan’s stratosphere, computationally capable of self-assembling into cryogenic azotosome vesicles in liquid methane.',
      citations: ['Palmer et al., Science Advances 2017', 'Stevenson et al., Sci. Adv. 2015'],
      scaleRegime: 'SOLAR_SYSTEM',
      distanceLabel: '9.58 AU (1.43 × 10⁹ km)',
      coordinatesRaDec: 'RA 22h 19m 02s | Dec -11° 58′',
      effectiveTempK: 94,
      pubchemCid: 7855,
      compoundName: 'Acrylonitrile (C₂H₃CN)'
    },
    {
      id: 'n-mars-jezero',
      label: 'Mars Jezero Crater Radiotrophic Extremophile Analog',
      type: NodeType.EVIDENCE,
      clusterId: 'c-solar-system',
      val: 19,
      confidence: 0.92,
      source: 'Perseverance SHERLOC Raman Spectroscopy',
      description: 'Aromatic organic carbon rings co-located with sulfate and carbonate minerals in Jezero delta mudstones parallel terrestrial Deinococcus radiodurans DNA repair niches.',
      citations: ['Scheller et al., Science 2022', 'Sharma et al., Nature 2023'],
      scaleRegime: 'SOLAR_SYSTEM',
      distanceLabel: '1.52 AU (2.28 × 10⁸ km)',
      coordinatesRaDec: 'RA 07h 12m 19s | Dec +18° 23′',
      effectiveTempK: 210,
      uniprotId: 'P42442',
      pdbId: '1XP8',
      organismName: 'Deinococcus radiodurans (RecA DNA Repair)'
    },

    // Sector II: Local Interstellar & Hycean Exoplanets
    {
      id: 'n-k2-18b-dms',
      label: 'K2-18b Hycean Atmosphere Dimethyl Sulfide (DMS) Spectral Peak',
      type: NodeType.CLAIM,
      clusterId: 'c-local-exoplanets',
      val: 26,
      confidence: 0.74,
      source: 'JWST NIRISS + NIRSpec + MIRI Transmission Spectra',
      description: 'Simultaneous 5σ detections of ~1% CH₄ and CO₂ with NH₃ depletion and tentative 3.3μm/6.8μm dimethyl sulfide (C₂H₆S) absorption bands point toward a habitable Hycean ocean world.',
      citations: ['Madhusudhan et al., ApJL 2023'],
      scaleRegime: 'EXOPLANETARY',
      distanceLabel: '124 ly (38.0 pc)',
      coordinatesRaDec: 'RA 11h 30m 14s | Dec +07° 35′ 18″',
      spectralClass: 'M2.5V Host',
      effectiveTempK: 265,
      pubchemCid: 1068,
      compoundName: 'Dimethyl Sulfide (C₂H₆S)'
    },
    {
      id: 'n-k2-18b-abiotic',
      label: 'Abiotic Photochemical Propyne & Methanethiol Degeneracy',
      type: NodeType.CONTRADICTION,
      clusterId: 'c-local-exoplanets',
      val: 22,
      confidence: 0.86,
      source: 'High-Pressure Exoplanet Photochemistry Modeling',
      description: 'Radiative-convective photochemical simulations show that high-metallicity mini-Neptune envelopes irradiated by M-dwarf Lyman-α flares can mimic 3.3μm hydrocarbon features abiotically.',
      citations: ['Wogan et al., ApJL 2024', 'Shorttle et al., ApJL 2024'],
      scaleRegime: 'EXOPLANETARY',
      distanceLabel: '124 ly (38.0 pc)',
      coordinatesRaDec: 'RA 11h 30m 14s | Dec +07° 35′ 18″',
      effectiveTempK: 280,
      pubchemCid: 6335,
      compoundName: 'Propyne (C₃H₄)'
    },
    {
      id: 'n-trappist-1e',
      label: 'TRAPPIST-1e Temperate Terrestrial Tardigrade Dsup Resilience Model',
      type: NodeType.EVIDENCE,
      clusterId: 'c-local-exoplanets',
      val: 21,
      confidence: 0.90,
      source: 'JWST NIRSpec Prism Transit Campaign',
      description: 'Fourth planet in the resonant 7-planet ultracool dwarf system receives 0.66 S⊕ instellation; surface biosphere models evaluate Ramazzottius varieornatus Dsup nucleosome shielding against M-dwarf superflares.',
      citations: ['Gillon et al., Nature 2017', 'Hashimoto et al., Nature Comms 2016'],
      scaleRegime: 'EXOPLANETARY',
      distanceLabel: '40.66 ly (12.47 pc)',
      coordinatesRaDec: 'RA 23h 06m 29s | Dec -05° 02′ 29″',
      spectralClass: 'M8V Host',
      effectiveTempK: 251,
      uniprotId: 'P0DOW4',
      pdbId: '1KX5',
      organismName: 'Ramazzottius varieornatus (Tardigrade Dsup)'
    },
    {
      id: 'n-lhs-1140b',
      label: 'LHS 1140b N₂-Dominated Secondary Atmosphere & Liquid Bullseye Ocean',
      type: NodeType.EVIDENCE,
      clusterId: 'c-local-exoplanets',
      val: 20,
      confidence: 0.88,
      source: 'JWST NIRISS SOSS Transmission Spectroscopy',
      description: 'Rayleigh scattering slope rules out a primordial H₂-rich envelope at 4.2σ in favor of a high-mean-molecular-weight N₂/CO₂ atmosphere with a 4,000-km substellar ocean.',
      citations: ['Cadieux et al., ApJL 2024', 'Damiano et al., ApJL 2024'],
      scaleRegime: 'EXOPLANETARY',
      distanceLabel: '48.8 ly (14.96 pc)',
      coordinatesRaDec: 'RA 00h 44m 59s | Dec -15° 16′ 17″',
      spectralClass: 'M4.5V Host',
      effectiveTempK: 226,
      pubchemCid: 280,
      compoundName: 'Carbon Dioxide (CO₂)'
    },

    // Sector III: Orion-Cygnus Prebiotic Nurseries
    {
      id: 'n-orion-omc1-glycine',
      label: 'Orion Molecular Cloud OMC-1 Interstellar Glycine Strecker Pathway',
      type: NodeType.CLAIM,
      clusterId: 'c-orion-nurseries',
      val: 24,
      confidence: 0.93,
      source: 'ALMA Band 6 & IRAM 30m Spectral Survey',
      description: 'Vacuum-UV irradiation of H₂O:CH₃OH:NH₃:HCN interstellar ice mantles in the Orion Kleinmann-Low Nebula drives non-energetic Strecker synthesis of glycine prior to protostellar collapse.',
      citations: ['Ioppolo et al., Nature Astronomy 2021', 'Belloche et al., A&A 2022'],
      scaleRegime: 'PREBIOTIC_NURSERY',
      distanceLabel: '1,344 ly (412 pc)',
      coordinatesRaDec: 'RA 05h 35m 14s | Dec -05° 22′ 21″',
      effectiveTempK: 140,
      pubchemCid: 750,
      compoundName: 'Glycine (C₂H₅NO₂)'
    },
    {
      id: 'n-sgr-b2-chiral',
      label: 'Sagittarius B2(N) Chiral Propylene Oxide & Amino Acid Precursors',
      type: NodeType.EVIDENCE,
      clusterId: 'c-orion-nurseries',
      val: 23,
      confidence: 0.96,
      source: 'Green Bank Telescope PRIMOS Survey',
      description: 'First interstellar detection of a chiral molecule (propylene oxide, CH₃CHCH₂O) alongside branched alkyl cyanides and aminoacetonitrile in the Sagittarius B2 North hot molecular core.',
      citations: ['McGuire et al., Science 2016', 'Belloche et al., Science 2014'],
      scaleRegime: 'PREBIOTIC_NURSERY',
      distanceLabel: '25,700 ly (7.88 kpc)',
      coordinatesRaDec: 'RA 17h 47m 19s | Dec -28° 22′ 17″',
      effectiveTempK: 165,
      pubchemCid: 6322,
      compoundName: 'L-Alanine (C₃H₇NO₂)'
    },
    {
      id: 'n-taurus-adenine',
      label: 'Taurus Molecular Cloud TMC-1 Cyanopolyyne & Adenine Pentamerization',
      type: NodeType.EVIDENCE,
      clusterId: 'c-orion-nurseries',
      val: 21,
      confidence: 0.91,
      source: 'GBT GOTHAM Spectral Line Survey',
      description: 'Cold dark core TMC-1 (10 K) exhibits abundant polycyclic aromatic nitriles (benzonitrile, cyanonaphthalene) and HCN oligomers that pentamerize into the purine nucleobase adenine.',
      citations: ['McGuire et al., Science 2021', 'Oró, Biochem. Biophys. Res. Commun. 1960'],
      scaleRegime: 'PREBIOTIC_NURSERY',
      distanceLabel: '456 ly (140 pc)',
      coordinatesRaDec: 'RA 04h 41m 42s | Dec +25° 41′ 27″',
      effectiveTempK: 10,
      pubchemCid: 190,
      compoundName: 'Adenine (C₅H₅N₅)'
    },
    {
      id: 'n-homochirality-contradiction',
      label: 'Circularly Polarized UV Enantiomeric Excess vs Racemization Decay',
      type: NodeType.CONTRADICTION,
      clusterId: 'c-orion-nurseries',
      val: 19,
      confidence: 0.83,
      source: 'Synchrotron Dichroism Astrochemistry Lab',
      description: 'While circularly polarized Lyman-α radiation in massive star-forming regions induces 2–3% L-enantiomeric excess, thermal aqueous alteration in planetesimal cores rapidly racemizes unshielded amino acids.',
      citations: ['Bailey et al., Science 1998', 'Glavin et al., Meteorit. Planet. Sci. 2020'],
      scaleRegime: 'PREBIOTIC_NURSERY',
      distanceLabel: '1,344 ly (412 pc)',
      coordinatesRaDec: 'RA 05h 35m 17s | Dec -05° 23′ 28″',
      effectiveTempK: 85,
      pubchemCid: 795,
      compoundName: 'Imidazole (C₃H₄N₂)'
    },

    // Sector IV: Milky Way Core & Relativistic Jets
    {
      id: 'n-sgr-a-star',
      label: 'Sagittarius A* Kerr Horizon Photon Ring & Accretion Magnetosphere',
      type: NodeType.CLAIM,
      clusterId: 'c-galactic-core',
      val: 27,
      confidence: 0.99,
      source: 'Event Horizon Telescope (EHT) 230 GHz VLBI Collaboration',
      description: '4.154 × 10⁶ M☉ supermassive black hole resolved at 51.8 μas ring diameter; polarized synchrotron emission reveals magnetically arrested disk (MAD) flux tubes.',
      citations: ['EHT Collaboration, ApJL 2022', 'GRAVITY Collaboration, A&A 2020'],
      scaleRegime: 'GALACTIC_CORE',
      distanceLabel: '26,673 ly (8.178 kpc)',
      coordinatesRaDec: 'RA 17h 45m 40.04s | Dec -29° 00′ 28.1″',
      effectiveTempK: 10000000000
    },
    {
      id: 'n-fermi-bubbles',
      label: 'Fermi Gamma-Ray & eROSITA X-Ray Galactic Outflow Bubbles',
      type: NodeType.EVIDENCE,
      clusterId: 'c-galactic-core',
      val: 22,
      confidence: 0.95,
      source: 'Fermi-LAT & eROSITA All-Sky Survey',
      description: 'Bipolar 50,000-light-year relativistic plasma lobes extending perpendicular to the Galactic plane record an energetic Seyfert-like AGN flare from Sgr A* ~3.5 Myr ago.',
      citations: ['Su et al., ApJ 2010', 'Predehl et al., Nature 2020'],
      scaleRegime: 'GALACTIC_CORE',
      distanceLabel: '26,670 ly (8.18 kpc)',
      coordinatesRaDec: 'RA 17h 45m 40s | Dec -29° 00′'
    },
    {
      id: 'n-galactic-habitability-paradox',
      label: 'Inner Galactic Disk Supernova Sterilization vs Metallicity Enrichment',
      type: NodeType.CONTRADICTION,
      clusterId: 'c-galactic-core',
      val: 20,
      confidence: 0.85,
      source: 'Galactic Habitable Zone Astrobiology Model',
      description: 'High α-element metallicity inside R < 4 kpc accelerates rocky planet formation, but frequent core-collapse supernovae and magnetar gamma bursts strip planetary ozone shields.',
      citations: ['Lineweaver et al., Science 2004', 'Gowanlock et al., Astrobiology 2011'],
      scaleRegime: 'GALACTIC_CORE',
      distanceLabel: '18,000 ly (5.5 kpc)',
      coordinatesRaDec: 'RA 17h 42m 10s | Dec -28° 45′'
    },

    // Sector V: Local Group & Galactic Filaments
    {
      id: 'n-andromeda-m31',
      label: 'Andromeda Galaxy (M31) Relativistic Collision Trajectory',
      type: NodeType.EVIDENCE,
      clusterId: 'c-local-group',
      val: 25,
      confidence: 0.96,
      source: 'HST & Gaia DR3 Proper Motion Astrometry',
      description: 'Radial velocity of -110 km/s and transverse proper motion confirm a major Milky Way–Andromeda galactic merger in ~4.5 Gyr, forming the giant elliptical galaxy Milkomeda.',
      citations: ['van der Marel et al., ApJ 2012', 'Salomon et al., MNRAS 2021'],
      scaleRegime: 'LOCAL_GROUP',
      distanceLabel: '2.537 Mly (778 kpc)',
      coordinatesRaDec: 'RA 00h 42m 44.3s | Dec +41° 16′ 09″'
    },
    {
      id: 'n-magellanic-stream',
      label: 'Magellanic Stream Warm-Hot Circumgalactic Gas Conduit',
      type: NodeType.CLAIM,
      clusterId: 'c-local-group',
      val: 20,
      confidence: 0.91,
      source: 'HST COS UV Absorption Spectroscopy',
      description: 'A 200-degree-long ribbon of neutral H I and multiphase ionized gas stripped from the Large and Small Magellanic Clouds replenishes Milky Way star-forming reservoirs.',
      citations: ['D’Onghia & Fox, ARA&A 2016', 'Lucchini et al., Nature 2020'],
      scaleRegime: 'LOCAL_GROUP',
      distanceLabel: '163,000 ly (50 kpc)',
      coordinatesRaDec: 'RA 05h 23m 34s | Dec -69° 45′ 22″'
    },

    // Sector VI: Laniakea Supercluster & Cosmic Web
    {
      id: 'n-laniakea-basin',
      label: 'Laniakea Supercluster Peculiar Velocity Watershed (10¹⁷ M☉)',
      type: NodeType.CLAIM,
      clusterId: 'c-laniakea-web',
      val: 27,
      confidence: 0.95,
      source: 'Cosmicflows-4 Tully-Fisher & Fundamental Plane Catalog',
      description: 'Wiener-filtered peculiar velocity fields across 56,000 galaxies delineate a 520-Mly-diameter gravitational basin of attraction converging on the Norma & Great Attractor core.',
      citations: ['Tully et al., Nature 2014', 'Tully et al., ApJ 2023'],
      scaleRegime: 'SUPERCLUSTER',
      distanceLabel: '250 Mly (77 Mpc)',
      coordinatesRaDec: 'RA 16h 15m 20s | Dec -60° 50′'
    },
    {
      id: 'n-virgo-filament',
      label: 'Virgo Cluster & M87* Relativistic Jet Cosmic Web Node',
      type: NodeType.EVIDENCE,
      clusterId: 'c-laniakea-web',
      val: 23,
      confidence: 0.98,
      source: 'EHT M87* & Chandra X-Ray Observatory',
      description: 'Dominant gravitational hub of the Local Supercluster hosting 6.5 × 10⁹ M☉ black hole M87*, whose 5,000-ly relativistic plasma jet heats intracluster gas filaments.',
      citations: ['EHT Collaboration, ApJL 2019', 'Forman et al., ApJ 2017'],
      scaleRegime: 'SUPERCLUSTER',
      distanceLabel: '53.8 Mly (16.5 Mpc)',
      coordinatesRaDec: 'RA 12h 30m 49.4s | Dec +12° 23′ 28″'
    },
    {
      id: 'n-hubble-tension',
      label: 'H₀ Hubble Constant Tension: Early CMB vs Late Cepheid/SNe Ia Ladder',
      type: NodeType.CONTRADICTION,
      clusterId: 'c-laniakea-web',
      val: 25,
      confidence: 0.94,
      source: 'Planck ΛCDM vs SH0ES / JWST Cepheid Calibration',
      description: '5.3σ discrepancy between Planck CMB acoustic peak inference (H₀ = 67.4 ± 0.5 km/s/Mpc) and SH0ES/JWST local distance ladder measurements (H₀ = 73.0 ± 1.0 km/s/Mpc).',
      citations: ['Planck Collaboration, A&A 2020', 'Riess et al., ApJL 2024'],
      scaleRegime: 'SUPERCLUSTER',
      distanceLabel: '13.8 Gly (4,230 Mpc)',
      coordinatesRaDec: 'All-Sky Isotropic Horizon'
    }
  ],
  links: [
    // Intra-Sector I
    { source: 'n-europa-ocean', target: 'n-enceladus-plumes', strength: 0.94, relation: 'SUPPORTS' },
    { source: 'n-enceladus-plumes', target: 'n-titan-azotosome', strength: 0.86, relation: 'DERIVES' },
    { source: 'n-mars-jezero', target: 'n-europa-ocean', strength: 0.82, relation: 'SUPPORTS' },

    // Intra-Sector II
    { source: 'n-k2-18b-dms', target: 'n-lhs-1140b', strength: 0.88, relation: 'SUPPORTS' },
    { source: 'n-k2-18b-abiotic', target: 'n-k2-18b-dms', strength: 0.93, relation: 'CONTRADICTS' },
    { source: 'n-trappist-1e', target: 'n-lhs-1140b', strength: 0.85, relation: 'SUPPORTS' },

    // Intra-Sector III
    { source: 'n-orion-omc1-glycine', target: 'n-sgr-b2-chiral', strength: 0.92, relation: 'SUPPORTS' },
    { source: 'n-taurus-adenine', target: 'n-orion-omc1-glycine', strength: 0.89, relation: 'SUPPORTS' },
    { source: 'n-homochirality-contradiction', target: 'n-sgr-b2-chiral', strength: 0.87, relation: 'CONTRADICTS' },

    // Intra-Sector IV
    { source: 'n-sgr-a-star', target: 'n-fermi-bubbles', strength: 0.95, relation: 'DERIVES' },
    { source: 'n-galactic-habitability-paradox', target: 'n-fermi-bubbles', strength: 0.86, relation: 'CONTRADICTS' },

    // Intra-Sector V
    { source: 'n-andromeda-m31', target: 'n-magellanic-stream', strength: 0.88, relation: 'SUPPORTS' },

    // Intra-Sector VI
    { source: 'n-laniakea-basin', target: 'n-virgo-filament', strength: 0.95, relation: 'SUPPORTS' },
    { source: 'n-hubble-tension', target: 'n-laniakea-basin', strength: 0.91, relation: 'CONTRADICTS' },

    // Cross-Scale Cosmic & Astrobiological Bridges
    { source: 'n-enceladus-plumes', target: 'n-k2-18b-dms', strength: 0.84, relation: 'BRIDGE' },
    { source: 'n-mars-jezero', target: 'n-trappist-1e', strength: 0.81, relation: 'BRIDGE' },
    { source: 'n-orion-omc1-glycine', target: 'n-titan-azotosome', strength: 0.79, relation: 'BRIDGE' },
    { source: 'n-taurus-adenine', target: 'n-k2-18b-dms', strength: 0.77, relation: 'BRIDGE' },
    { source: 'n-sgr-b2-chiral', target: 'n-sgr-a-star', strength: 0.88, relation: 'BRIDGE' },
    { source: 'n-galactic-habitability-paradox', target: 'n-orion-omc1-glycine', strength: 0.76, relation: 'BRIDGE' },
    { source: 'n-fermi-bubbles', target: 'n-magellanic-stream', strength: 0.83, relation: 'BRIDGE' },
    { source: 'n-andromeda-m31', target: 'n-virgo-filament', strength: 0.89, relation: 'BRIDGE' }
  ]
};

export const INITIAL_CUSTOM_SCENES: CustomSceneKeyframe[] = [
  {
    id: 'kf-ocean-worlds',
    title: 'Solar System Cryo-Oceans & Plumes',
    clusterId: 'c-solar-system',
    cameraTarget: { x: -210, y: 60, z: 90 },
    lens: 'ORBIT',
    voiceMode: 'SINGLE',
    notes: 'Inspection of Europa ATP bioenergetics, Enceladus hydrothermal H₂ plumes, and Titan vinyl cyanide azotosomes.'
  },
  {
    id: 'kf-hycean-biosignatures',
    title: 'K2-18b Hycean Dimethyl Sulfide Audit',
    clusterId: 'c-local-exoplanets',
    cameraTarget: { x: -75, y: 120, z: -135 },
    lens: 'NEBULA',
    voiceMode: 'DUAL_HOST',
    notes: 'Dialectical audit comparing JWST NIRSpec/MIRI DMS claims against abiotic photochemical propyne degeneracy.'
  },
  {
    id: 'kf-prebiotic-nursery',
    title: 'Orion OMC-1 & Sgr B2 Chiral Chemistry',
    clusterId: 'c-orion-nurseries',
    cameraTarget: { x: 115, y: 95, z: 120 },
    lens: 'ORBIT',
    voiceMode: 'SINGLE',
    notes: 'Interstellar Strecker synthesis of glycine, chiral propylene oxide, and HCN adenine pentamerization.'
  },
  {
    id: 'kf-laniakea-horizon',
    title: 'Laniakea Supercluster & H₀ Tension',
    clusterId: 'c-laniakea-web',
    cameraTarget: { x: 35, y: -130, z: 185 },
    lens: 'AUDIT',
    voiceMode: 'DUAL_HOST',
    notes: 'Large-scale peculiar velocity basin of the Great Attractor and 5.3σ Hubble Constant cosmological tension.'
  }
];
