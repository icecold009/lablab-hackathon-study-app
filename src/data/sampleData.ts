import type { SprintSetup, TopicSetup } from '../types';

function makeId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function getSampleSetup(): SprintSetup {
  const topics: TopicSetup[] = [
    { id: makeId(), name: 'Cell Biology', confidence: 'low', importance: 'high' },
    { id: makeId(), name: 'Genetics', confidence: 'medium', importance: 'high' },
    { id: makeId(), name: 'Ecology', confidence: 'high', importance: 'medium' },
    { id: makeId(), name: 'Human Physiology', confidence: 'low', importance: 'medium' },
  ];

  return {
    examName: 'Biology Fundamentals',
    examHours: 6,
    studyHours: 6,
    topics,
    generatedAt: new Date().toISOString(),
  };
}

export function getSampleQuizQuestions(topicName: string): { mcqs: { q: string; options: string[]; correct: string; explanation: string }[]; shorts: { q: string; answer: string; explanation: string }[] } {
  const banks: Record<string, { mcqs: { q: string; options: string[]; correct: string; explanation: string }[]; shorts: { q: string; answer: string; explanation: string }[] }> = {
    'cell biology': {
      mcqs: [
        { q: 'What is the powerhouse of the cell?', options: ['Mitochondria', 'Nucleus', 'Ribosome', 'Golgi apparatus'], correct: 'Mitochondria', explanation: 'Mitochondria generate most of the cell\'s ATP through oxidative phosphorylation, earning them the nickname \'powerhouse of the cell.\'' },
        { q: 'What is the primary component of the cell membrane?', options: ['Phospholipid bilayer', 'Protein coat', 'Carbohydrate layer', 'Cellulose wall'], correct: 'Phospholipid bilayer', explanation: 'The cell membrane is primarily composed of a phospholipid bilayer with embedded proteins, forming a selective barrier.' },
        { q: 'Where does protein synthesis occur?', options: ['Ribosomes', 'Nucleus', 'Lysosomes', 'Cell membrane'], correct: 'Ribosomes', explanation: 'Ribosomes are the site of protein synthesis, translating mRNA into polypeptide chains.' },
        { q: 'Which organelle modifies and packages proteins for transport?', options: ['Golgi apparatus', 'Nucleus', 'Ribosome', 'Smooth ER'], correct: 'Golgi apparatus', explanation: 'The Golgi apparatus modifies, sorts, and packages proteins into vesicles for transport.' },
        { q: 'What is the function of lysosomes?', options: ['Digest waste materials', 'Produce energy', 'Synthesise proteins', 'Store genetic material'], correct: 'Digest waste materials', explanation: 'Lysosomes contain digestive enzymes that break down cellular waste, foreign particles, and old organelles.' },
        { q: 'Which organelle is responsible for photosynthesis?', options: ['Chloroplast', 'Mitochondria', 'Vacuole', 'Nucleus'], correct: 'Chloroplast', explanation: 'Chloroplasts contain chlorophyll and convert sunlight into chemical energy through photosynthesis.' },
        { q: 'What is the function of the rough endoplasmic reticulum?', options: ['Protein synthesis with ribosomes', 'Lipid synthesis', 'ATP production', 'Waste removal'], correct: 'Protein synthesis with ribosomes', explanation: 'The rough ER has ribosomes attached and is involved in protein synthesis and folding.' },
        { q: 'What controls what enters and exits the nucleus?', options: ['Nuclear pores', 'Cell membrane', 'Ribosomes', 'Lysosomes'], correct: 'Nuclear pores', explanation: 'Nuclear pores regulate the movement of molecules between the nucleus and cytoplasm.' },
        { q: 'Which organelle detoxifies harmful substances in liver cells?', options: ['Smooth ER', 'Rough ER', 'Golgi apparatus', 'Mitochondria'], correct: 'Smooth ER', explanation: 'The smooth ER contains enzymes that detoxify drugs, alcohol, and other harmful substances.' },
        { q: 'What is the jelly-like substance that fills the cell?', options: ['Cytoplasm', 'Nucleoplasm', 'Cell sap', 'Stroma'], correct: 'Cytoplasm', explanation: 'Cytoplasm is the gel-like substance containing all organelles and is the site of many cellular reactions.' },
        { q: 'What do centrioles help with during cell division?', options: ['Spindle fibre formation', 'DNA replication', 'Protein synthesis', 'Energy production'], correct: 'Spindle fibre formation', explanation: 'Centrioles organise the spindle fibres that separate chromosomes during cell division.' },
        { q: 'Which organelle stores water in plant cells?', options: ['Central vacuole', 'Nucleus', 'Chloroplast', 'Cell wall'], correct: 'Central vacuole', explanation: 'The central vacuole stores water, nutrients, and waste, helping maintain cell shape through turgor pressure.' },
      ],
      shorts: [
        { q: 'What organelle contains the cell\'s DNA?', answer: 'Nucleus', explanation: 'The nucleus houses the cell\'s chromosomes containing the genetic material (DNA).' },
        { q: 'What process produces two identical daughter cells?', answer: 'Mitosis', explanation: 'Mitosis results in two genetically identical daughter cells.' },
        { q: 'What is the fluid inside mitochondria called?', answer: 'Matrix', explanation: 'The mitochondrial matrix contains enzymes for the Krebs cycle.' },
        { q: 'What hair-like projections move substances along cell surfaces?', answer: 'Cilia', explanation: 'Cilia beat rhythmically to move substances like mucus across the cell surface.' },
        { q: 'What network of protein filaments gives the cell its shape?', answer: 'Cytoskeleton', explanation: 'The cytoskeleton provides structural support and enables movement within the cell.' },
        { q: 'What process engulfs large particles by the cell membrane?', answer: 'Phagocytosis', explanation: 'Phagocytosis is a type of endocytosis where cells engulf large particles to digest them.' },
      ],
    },
    'genetics': {
      mcqs: [
        { q: 'What is a gene?', options: ['A unit of heredity', 'A type of protein', 'A cellular organelle', 'A metabolic pathway'], correct: 'A unit of heredity', explanation: 'A gene is the basic physical and functional unit of heredity, made up of DNA.' },
        { q: 'What are alleles?', options: ['Different versions of a gene', 'Chromosome pairs', 'Types of RNA', 'Enzyme variants'], correct: 'Different versions of a gene', explanation: 'Alleles are alternative forms of a gene at the same location on a chromosome.' },
        { q: 'What does a Punnett square predict?', options: ['Genotype ratios of offspring', 'Protein structures', 'Cell division outcomes', 'Enzyme activity'], correct: 'Genotype ratios of offspring', explanation: 'A Punnett square predicts the genotypes of offspring from a genetic cross.' },
        { q: 'What does DNA stand for?', options: ['Deoxyribonucleic acid', 'Ribonucleic acid', 'Double nucleotide acid', 'Dihydroxy nucleic acid'], correct: 'Deoxyribonucleic acid', explanation: 'DNA carries genetic instructions in all living organisms.' },
        { q: 'What shape does a DNA molecule have?', options: ['Double helix', 'Single strand', 'Circular loop', 'Triple helix'], correct: 'Double helix', explanation: 'DNA has a double helix — two strands wound around each other connected by base pairs.' },
        { q: 'What are the four bases in DNA?', options: ['Adenine, Thymine, Guanine, Cytosine', 'Adenine, Uracil, Guanine, Cytosine', 'Adenine, Thymine, Guanine, Uracil', 'Adenine, Thymine, Cytosine, Uracil'], correct: 'Adenine, Thymine, Guanine, Cytosine', explanation: 'DNA uses A, T, G, and C. RNA replaces thymine with uracil.' },
        { q: 'What is a genotype?', options: ['The genetic makeup of an organism', 'The physical appearance', 'The number of chromosomes', 'The type of DNA'], correct: 'The genetic makeup of an organism', explanation: 'A genotype refers to the specific alleles an organism carries for a particular gene.' },
        { q: 'What is a phenotype?', options: ['The observable traits of an organism', 'The hidden genetic code', 'The number of genes', 'The DNA sequence'], correct: 'The observable traits of an organism', explanation: 'A phenotype results from genotype and environment interaction.' },
        { q: 'What is a mutation?', options: ['A change in DNA sequence', 'A type of protein', 'A new species', 'A cell division process'], correct: 'A change in DNA sequence', explanation: 'A mutation is any change in the nucleotide sequence of DNA.' },
        { q: 'What process makes mRNA from DNA?', options: ['Transcription', 'Translation', 'Replication', 'Translocation'], correct: 'Transcription', explanation: 'Transcription copies DNA into messenger RNA (mRNA).' },
        { q: 'What is a recessive allele?', options: ['Expressed only with two copies', 'The most common allele', 'The strongest allele', 'Always shows up'], correct: 'Expressed only with two copies', explanation: 'A recessive allele needs two copies (homozygous) for expression.' },
        { q: 'What are chromosomes made of?', options: ['DNA and protein', 'RNA and lipids', 'Carbohydrates and DNA', 'Proteins only'], correct: 'DNA and protein', explanation: 'Chromosomes consist of DNA coiled around histone proteins.' },
      ],
      shorts: [
        { q: 'What is a trait expressed with one copy of the allele called?', answer: 'Dominant', explanation: 'A dominant trait masks the recessive allele when at least one copy is present.' },
        { q: 'What process copies DNA before cell division?', answer: 'DNA replication', explanation: 'DNA replication ensures each daughter cell gets an identical copy.' },
        { q: 'What RNA carries amino acids to the ribosome?', answer: 'tRNA', explanation: 'Transfer RNA brings amino acids based on mRNA codon sequences.' },
        { q: 'What is a cell with two sets of chromosomes called?', answer: 'Diploid', explanation: 'Diploid cells have two complete sets of chromosomes (2n).' },
        { q: 'What sugar is found in DNA?', answer: 'Deoxyribose', explanation: 'Deoxyribose forms the backbone of DNA alongside phosphate groups.' },
        { q: 'What is the position of a gene on a chromosome called?', answer: 'Locus', explanation: 'A locus is the specific physical position of a gene on a chromosome.' },
      ],
    },
    'human physiology': {
      mcqs: [
        { q: 'What is the primary function of the heart?', options: ['Pump blood throughout the body', 'Filter waste from blood', 'Produce hormones', 'Regulate temperature'], correct: 'Pump blood throughout the body', explanation: 'The heart pumps blood through the circulatory system delivering oxygen and nutrients.' },
        { q: 'What is homeostasis?', options: ['Maintaining stable internal conditions', 'Breaking down food', 'Fighting infections', 'Producing energy'], correct: 'Maintaining stable internal conditions', explanation: 'Homeostasis is the body\'s ability to maintain a stable internal environment.' },
        { q: 'Where does gas exchange occur?', options: ['Alveoli', 'Bronchi', 'Trachea', 'Diaphragm'], correct: 'Alveoli', explanation: 'Alveoli are tiny air sacs where oxygen and carbon dioxide are exchanged.' },
        { q: 'Which blood vessels carry blood away from the heart?', options: ['Arteries', 'Veins', 'Capillaries', 'Venules'], correct: 'Arteries', explanation: 'Arteries carry oxygen-rich blood away from the heart (except pulmonary arteries).' },
        { q: 'How many chambers does the heart have?', options: ['Four', 'Two', 'Three', 'Six'], correct: 'Four', explanation: 'The human heart has four chambers: two atria and two ventricles.' },
        { q: 'What does the diaphragm do during breathing?', options: ['Contracts to pull air into lungs', 'Filters air', 'Produces sound', 'Warms air'], correct: 'Contracts to pull air into lungs', explanation: 'The diaphragm contracts, increasing chest volume to draw air into the lungs.' },
        { q: 'Which brain part controls balance?', options: ['Cerebellum', 'Cerebrum', 'Brainstem', 'Hypothalamus'], correct: 'Cerebellum', explanation: 'The cerebellum coordinates voluntary movements, balance, and fine motor control.' },
        { q: 'What do red blood cells do?', options: ['Carry oxygen to tissues', 'Fight infections', 'Clot blood', 'Produce antibodies'], correct: 'Carry oxygen to tissues', explanation: 'Red blood cells contain haemoglobin that binds oxygen and releases it to tissues.' },
        { q: 'What organ filters blood to produce urine?', options: ['Kidneys', 'Liver', 'Bladder', 'Pancreas'], correct: 'Kidneys', explanation: 'The kidneys filter blood, removing waste to form urine.' },
        { q: 'What is the largest organ of the human body?', options: ['Skin', 'Liver', 'Brain', 'Lungs'], correct: 'Skin', explanation: 'The skin is the largest organ serving as a protective barrier.' },
        { q: 'Which hormone lowers blood sugar?', options: ['Insulin', 'Glucagon', 'Adrenaline', 'Thyroxine'], correct: 'Insulin', explanation: 'Insulin helps cells absorb glucose from the blood, lowering blood sugar.' },
        { q: 'What is the functional unit of the kidney?', options: ['Nephron', 'Neuron', 'Alveolus', 'Glomerulus'], correct: 'Nephron', explanation: 'The nephron is the filtering unit of the kidney.' },
      ],
      shorts: [
        { q: 'What system controls voluntary movement?', answer: 'Nervous system', explanation: 'The nervous system controls both voluntary and involuntary responses.' },
        { q: 'What is the largest organ of the human body?', answer: 'Skin', explanation: 'The skin serves as a protective barrier and helps regulate temperature.' },
        { q: 'What valve is between the left atrium and left ventricle?', answer: 'Mitral valve', explanation: 'The mitral valve prevents blood from flowing backward in the heart.' },
        { q: 'What type of blood cell fights infections?', answer: 'White blood cell', explanation: 'White blood cells are part of the immune system.' },
        { q: 'What is the main breathing muscle below the lungs?', answer: 'Diaphragm', explanation: 'The diaphragm contracts and relaxes to control breathing.' },
        { q: 'What is the heart\'s natural pacemaker called?', answer: 'Sinoatrial node', explanation: 'The SA node generates electrical impulses that set the heart rhythm.' },
      ],
    },
    'ecology': {
      mcqs: [
        { q: 'What is an ecosystem?', options: ['A community interacting with its environment', 'A group of the same species', 'A single organism\'s habitat', 'The atmosphere'], correct: 'A community interacting with its environment', explanation: 'An ecosystem includes all living organisms and their physical environment.' },
        { q: 'What is a food chain?', options: ['Linear sequence of energy transfer', 'A type of diet', 'A digestive process', 'A nutrient cycle'], correct: 'Linear sequence of energy transfer', explanation: 'A food chain shows how energy flows from one organism to another.' },
        { q: 'What is biodiversity?', options: ['The variety of life in an area', 'The number of individuals', 'Total biomass', 'Species size'], correct: 'The variety of life in an area', explanation: 'Biodiversity refers to the variety of life in a particular habitat or ecosystem.' },
        { q: 'What do decomposers do?', options: ['Break down dead matter into nutrients', 'Produce food through photosynthesis', 'Hunt other organisms', 'Pollinate plants'], correct: 'Break down dead matter into nutrients', explanation: 'Decomposers like bacteria and fungi recycle nutrients back into the ecosystem.' },
        { q: 'What is a biome?', options: ['Large area with similar climate and life', 'A single species habitat', 'A small pond', 'A mountain range'], correct: 'Large area with similar climate and life', explanation: 'Biomes are large regions with distinct climate, plants, and animals.' },
        { q: 'What is the main energy source for most ecosystems?', options: ['The sun', 'Geothermal heat', 'Chemical reactions', 'Wind'], correct: 'The sun', explanation: 'The sun provides primary energy captured by producers through photosynthesis.' },
        { q: 'What is a keystone species?', options: ['A species with large ecosystem impact', 'The largest species', 'The most common species', 'A new species'], correct: 'A species with large ecosystem impact', explanation: 'A keystone species has a disproportionately large impact on its ecosystem.' },
        { q: 'What is carrying capacity?', options: ['Max population an environment can sustain', 'Number of predators', 'Total weight of organisms', 'Population growth rate'], correct: 'Max population an environment can sustain', explanation: 'Carrying capacity is the maximum population size an environment can support.' },
        { q: 'What converts atmospheric nitrogen for plants?', options: ['Nitrogen fixation', 'Photosynthesis', 'Respiration', 'Decomposition'], correct: 'Nitrogen fixation', explanation: 'Nitrogen-fixing bacteria convert atmospheric nitrogen into forms plants can use.' },
        { q: 'What is an invasive species?', options: ['A non-native species harming the ecosystem', 'A predator controlling prey', 'A seasonal migrant', 'A native plant'], correct: 'A non-native species harming the ecosystem', explanation: 'Invasive species outcompete native species and disrupt ecological balance.' },
        { q: 'What is a trophic level?', options: ['A step in a food chain', 'The height of a food chain', 'A type of habitat', 'A feeding time'], correct: 'A step in a food chain', explanation: 'A trophic level is the position an organism occupies in a food chain.' },
        { q: 'What relationship benefits both species?', options: ['Mutualism', 'Parasitism', 'Competition', 'Commensalism'], correct: 'Mutualism', explanation: 'Mutualism is a symbiotic relationship where both species benefit.' },
      ],
      shorts: [
        { q: 'What organism makes its own food through photosynthesis?', answer: 'Producer', explanation: 'Producers form the base of the food chain by converting sunlight into energy.' },
        { q: 'What cycle describes carbon movement through Earth systems?', answer: 'Carbon cycle', explanation: 'The carbon cycle moves carbon between the atmosphere, oceans, and living organisms.' },
        { q: 'What is all individuals of the same species in the same area called?', answer: 'Population', explanation: 'A population refers to all individuals of a species living in a given area.' },
        { q: 'What organism eats only plants?', answer: 'Herbivore', explanation: 'Herbivores are primary consumers that feed exclusively on plants.' },
        { q: 'What is gradual change in an ecosystem over time called?', answer: 'Ecological succession', explanation: 'Ecological succession is the process of change in species composition over time.' },
        { q: 'What is a species\' role and position in its environment?', answer: 'Niche', explanation: 'A niche encompasses all the ways a species interacts with its environment.' },
      ],
    },
  };

  const key = topicName.toLowerCase();
  for (const [k, v] of Object.entries(banks)) {
    if (key.includes(k)) return v;
  }

  // Default generic bank for any custom topic
  return {
    mcqs: [
      { q: `What is the main concept of ${topicName}?`, options: ['Fundamental principle', 'Secondary effect', 'Unrelated idea', 'Common misconception'], correct: 'Fundamental principle', explanation: `This is a core concept in ${topicName} that forms the foundation of the topic.` },
      { q: `Which best describes ${topicName}?`, options: ['A key area of study', 'An unrelated field', 'A minor subtopic', 'A historical concept'], correct: 'A key area of study', explanation: `${topicName} is an important area that connects to many other concepts.` },
      { q: `What is a common application of ${topicName}?`, options: ['Real-world problem solving', 'Theoretical only', 'Historical interest', 'No practical use'], correct: 'Real-world problem solving', explanation: `Knowledge of ${topicName} is applied in many practical situations.` },
      { q: `How does ${topicName} relate to other fields?`, options: ['It connects to many disciplines', 'It stands alone', 'It only relates to biology', 'It has no connections'], correct: 'It connects to many disciplines', explanation: `${topicName} has interdisciplinary connections that make it relevant across fields.` },
      { q: `What is a key principle of ${topicName}?`, options: ['Understanding core theories', 'Memorising facts only', 'Ignoring fundamentals', 'Skipping basics'], correct: 'Understanding core theories', explanation: `Mastering the core principles of ${topicName} is essential for deeper learning.` },
      { q: `Why is ${topicName} considered important?`, options: ['It has wide-ranging applications', 'It is purely academic', 'It is outdated', 'It only applies to experts'], correct: 'It has wide-ranging applications', explanation: `${topicName} provides foundational knowledge that applies to many real-world situations.` },
      { q: `What is the best way to understand ${topicName}?`, options: ['Study core concepts and examples', 'Skip to advanced topics', 'Only memorise definitions', 'Ignore practical examples'], correct: 'Study core concepts and examples', explanation: `Building understanding through concepts and practical examples is the best approach for ${topicName}.` },
      { q: `How does ${topicName} help in problem-solving?`, options: ['It provides analytical frameworks', 'It gives direct answers', 'It is not useful', 'It only creates confusion'], correct: 'It provides analytical frameworks', explanation: `${topicName} equips you with frameworks and thinking tools to approach problems systematically.` },
      { q: `What is a common misconception about ${topicName}?`, options: ['That it is too difficult to understand', 'That it is irrelevant', 'That it has no structure', 'That it never changes'], correct: 'That it is too difficult to understand', explanation: `With the right approach, ${topicName} is accessible and rewarding to study.` },
      { q: `Where can ${topicName} be observed in everyday life?`, options: ['In many natural and human-made systems', 'Nowhere', 'Only in textbooks', 'Only in labs'], correct: 'In many natural and human-made systems', explanation: `The principles of ${topicName} appear in numerous everyday contexts and systems.` },
    ],
    shorts: [
      { q: `Name one key concept in ${topicName}.`, answer: `${topicName} principles`, explanation: `Understanding the fundamentals of ${topicName} is essential for mastering the topic.` },
      { q: `Why is ${topicName} important to study?`, answer: `It provides foundational knowledge`, explanation: `Studying ${topicName} helps build a strong understanding of the broader subject area.` },
      { q: `What is one real-world application of ${topicName}?`, answer: `Practical problem solving`, explanation: `${topicName} has many practical applications that solve real-world challenges.` },
      { q: `What are the prerequisites for learning ${topicName}?`, answer: `Basic domain knowledge`, explanation: `Having foundational knowledge in the subject area helps when studying ${topicName}.` },
      { q: `How can ${topicName} be broken down for easier study?`, answer: `Into smaller subtopics and concepts`, explanation: `Breaking ${topicName} into manageable parts makes it easier to learn and retain.` },
      { q: `What skill does studying ${topicName} develop?`, answer: `Critical thinking and analysis`, explanation: `Studying ${topicName} helps develop analytical and critical thinking skills that apply broadly.` },
    ],
  };
}