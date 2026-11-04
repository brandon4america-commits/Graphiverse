export interface PubChemCompoundProfile {
  cid: number;
  name: string;
  formula: string;
  molecularWeight: number;
  smiles: string;
  xlogp: number;
  tpsa: number;
  hBondDonorCount: number;
  hBondAcceptorCount: number;
  rotatableBondCount: number;
  heavyAtomCount: number;
  image2dUrl: string;
  lipinskiCompliant: boolean;
  veberCompliant: boolean;
  volatilityClass: 'CRYOGENIC_VOLATILE' | 'TEMPERATE_BIOSIGNATURE' | 'REFRACTORY_PREBIOTIC';
  atoms3d: { element: string; x: number; y: number; z: number }[];
  bonds3d: { a: number; b: number; order: number }[];
}

export interface ProteinStructureProfile {
  uniprotId: string;
  entryName: string;
  proteinName: string;
  organism: string;
  sequenceLength: number;
  functionSummary: string;
  pdbId?: string;
  pdbTitle?: string;
  pdbResolutionAngstrom?: number;
  pdbMethod?: string;
  alphafoldMeanPlddt: number;
  plddtBands: {
    veryHigh: number; // > 90
    confident: number; // 70 - 90
    low: number; // 50 - 70
    veryLow: number; // < 50
  };
  domains: { name: string; start: number; end: number; type: string }[];
  backboneCoords: { x: number; y: number; z: number; plddt: number; resIndex: number }[];
}

export interface LiteratureWorkItem {
  id: string;
  title: string;
  authors: string;
  year: number;
  venue: string;
  abstract: string;
  citationCount: number;
  doiOrUrl: string;
  source: 'EUROPE_PMC' | 'OPENALEX' | 'ARXIV';
}

export interface PrebioticPathwayStep {
  id: string;
  stepNumber: number;
  precursors: string;
  product: string;
  productCid: number;
  energySource: string;
  astroEnvironment: string;
  reactionEquation: string;
  quantumYieldOrRate: string;
}

export const PREBIOTIC_PATHWAYS: PrebioticPathwayStep[] = [
  {
    id: 'pw-strecker-glycine',
    stepNumber: 1,
    precursors: 'H₂CO (Formaldehyde) + NH₃ (Ammonia) + HCN (Hydrogen Cyanide)',
    product: 'Glycine (NH₂CH₂COOH)',
    productCid: 750,
    energySource: 'Vacuum-UV Lyman-α (121.6 nm) & Thermal Ice Mantle Warmup (15–140 K)',
    astroEnvironment: 'Orion Molecular Cloud OMC-1 & Cometary 67P Ice Mantles',
    reactionEquation: 'CH₂O + NH₃ + HCN → NH₂CH₂CN + H₂O → NH₂CH₂COOH + NH₃',
    quantumYieldOrRate: 'Φ = 1.4 × 10⁻³ molecules / photon'
  },
  {
    id: 'pw-oro-adenine',
    stepNumber: 2,
    precursors: '5 HCN (Hydrogen Cyanide Pentamerization)',
    product: 'Adenine (C₅H₅N₅)',
    productCid: 190,
    energySource: 'Cosmic Ray Radiolysis & Eutectic Ice Brine Catalysis',
    astroEnvironment: 'Taurus Molecular Cloud TMC-1 & Titan Cryo-Brines',
    reactionEquation: '5 HCN → DAMN (Diaminomaleonitrile) → AICN → C₅H₅N₅ (Adenine)',
    quantumYieldOrRate: 'k = 4.8 × 10⁻⁶ s⁻¹ at 250 K eutectic phase'
  },
  {
    id: 'pw-chiral-alanine',
    stepNumber: 3,
    precursors: 'CH₃CHO (Acetaldehyde) + NH₃ + HCN + Circularly Polarized UV',
    product: 'L-Alanine (C₃H₇NO₂)',
    productCid: 6322,
    energySource: 'Circularly Polarized Synchrotron / OB-Star UV Dichroism',
    astroEnvironment: 'Sagittarius B2(N) Hot Molecular Core',
    reactionEquation: 'CH₃CHO + NH₃ + HCN → CH₃CH(NH₂)CN + 2 H₂O → L-CH₃CH(NH₂)COOH',
    quantumYieldOrRate: 'ee = +2.6% L-enantiomeric excess'
  },
  {
    id: 'pw-biogenic-dms',
    stepNumber: 4,
    precursors: 'DMSP (Dimethylsulfoniopropionate) Enzymatic Lyase Cleavage',
    product: 'Dimethyl Sulfide (CH₃SCH₃)',
    productCid: 1068,
    energySource: 'Marine Phytoplankton / Hycean Pelagic Biospheric Metabolism',
    astroEnvironment: 'K2-18b Substellar Hycean Ocean Interface',
    reactionEquation: '(CH₃)₂S⁺CH₂CH₂COO⁻ → (CH₃)₂S (DMS↑) + CH₂=CHCOO⁻ + H⁺',
    quantumYieldOrRate: 'Flux = 1.2 × 10¹⁰ molecules cm⁻² s⁻¹'
  }
];

export const QUICK_ASTROBIOLOGY_TARGETS = [
  {
    id: 'dms-1068',
    label: 'Dimethyl Sulfide (DMS)',
    subtitle: 'K2-18b Hycean Biosignature',
    type: 'COMPOUND' as const,
    cid: 1068
  },
  {
    id: 'glycine-750',
    label: 'Interstellar Glycine',
    subtitle: 'Orion OMC-1 Amino Acid',
    type: 'COMPOUND' as const,
    cid: 750
  },
  {
    id: 'adenine-190',
    label: 'Prebiotic Adenine',
    subtitle: 'TMC-1 HCN Pentamer',
    type: 'COMPOUND' as const,
    cid: 190
  },
  {
    id: 'acrylonitrile-7855',
    label: 'Acrylonitrile (Azotosome)',
    subtitle: 'Titan Kraken Mare Membrane',
    type: 'COMPOUND' as const,
    cid: 7855
  },
  {
    id: 'dsup-p0dow4',
    label: 'Tardigrade Dsup Protein',
    subtitle: 'X-Ray & Flare Nucleosome Shield',
    type: 'PROTEIN' as const,
    uniprotId: 'P0DOW4',
    pdbId: '1KX5'
  },
  {
    id: 'reca-p42442',
    label: 'D. radiodurans RecA',
    subtitle: 'Extreme Radiation DNA Repair',
    type: 'PROTEIN' as const,
    uniprotId: 'P42442',
    pdbId: '1XP8'
  },
  {
    id: 'atp-p0abb0',
    label: 'ATP Synthase Subunit α',
    subtitle: 'Europa Hydrothermal Bioenergetics',
    type: 'PROTEIN' as const,
    uniprotId: 'P0ABB0',
    pdbId: '1RCX'
  }
];

export async function fetchPubChemCompound(cid: number): Promise<PubChemCompoundProfile> {
  const res = await fetch(`/api/science/pubchem/${cid}`);
  if (!res.ok) {
    throw new Error(`PubChem fetch failed for CID ${cid}`);
  }
  return res.json();
}

export async function fetchProteinProfile(
  uniprotId: string,
  pdbId?: string
): Promise<ProteinStructureProfile> {
  const query = pdbId ? `?pdbId=${encodeURIComponent(pdbId)}` : '';
  const res = await fetch(`/api/science/protein/${encodeURIComponent(uniprotId)}${query}`);
  if (!res.ok) {
    throw new Error(`Protein structure fetch failed for ${uniprotId}`);
  }
  return res.json();
}

export async function searchAstrobiologyLiterature(
  queryText: string
): Promise<LiteratureWorkItem[]> {
  const res = await fetch(
    `/api/science/literature?q=${encodeURIComponent(queryText)}`
  );
  if (!res.ok) {
    throw new Error('Literature search failed');
  }
  const data = await res.json();
  return data.results || [];
}
