// Nomes conferidos nas constraints; descrições integrais do arquivo de referência.
const comunidadesTradicionais = [
  {
    nome: "Andirobeiros",
    descricao: "O aproveitamento da andiroba (Carapa guaianensis), uma árvore de grande porte, é um trabalho artesanal transmitido entre gerações. São geralmente mulheres e habitam ilhas nas proximidades de Belém, mas há outros grupos em diferentes locais da Amazônia. Os frutos da andiroba caem no solo e liberam sementes. Elas são cozidas e maceradas para a obtenção do óleo, que é empregado nas indústrias cosmética e farmacêutica, e também vendido em lojas de produtos naturais."
  },
  {
    nome: "Apanhadores de flores sempre-vivas",
    descricao: "Os apanhadores de flores sempre-vivas vivem em Minas Gerais, na área da Serra do Espinhaço. Seu modo de vida está associado ao território e ao conhecimento da flora e da fauna locais. A coleta das inflorescências, que após colhidas e secas conservam a forma e as cores, é tradição e fonte de renda para as famílias. Também criam gado, pequenos animais e cultivam milho, feijão e mandioca."
  },
  {
    nome: "Benzendeiros",
    descricao: "As rezadeiras, ou curandeiras, principalmente mulheres, realizam benzeduras e rezas segundo conhecimentos tradicionais, com o objetivo de promover alívio e cura de enfermidades físicas e espirituais entre as pessoas que as procuram. O uso desses conhecimentos ancestrais é aliado a orações do catolicismo popular. Seus saberes são exercidos em busca de alívio e cura de doenças referidas popularmente como “espinhela caída”, “mau olhado”, “ventre virado”, “cobreiro”, “moleza no corpo”, dores de cabeça e enfermidades de recém-nascidos, entre outras."
  },
  {
    nome: "Caboclos",
    descricao: "São pequenos produtores familiares que vivem tradicionalmente da exploração sustentável da floresta – o lar que há séculos provê o sustento de suas famílias. Consomem frutas nativas, peixes e ervas medicinais, e suas casas são de madeira e palha. Mantêm sintonia com os ciclos do biossistema, e ante os desafios enfrentados pela Amazônia, seus conhecimentos da fauna e da flora os tornam guardiões desse ecossistema, o mais importante do planeta. Num mundo ávido por progresso material, reafirmam a importância de viver em harmonia com a natureza."
  },
  {
    nome: "Caiçaras",
    descricao: "Os caiçaras são grupos tradicionais de agricultores e pescadores que se fixaram no litoral, entre o Norte do Paraná e Sul do Rio de Janeiro (DIEGUES, 1988). São oriundos da colonização portuguesa que, em contato com povos indígenas locais, e em menor grau com a população negra, iniciaram a ocupação das áreas costeiras do Sudeste brasileiro. São herdeiros da miscigenação genética e cultural entre indígenas, portugueses e africanos. Sua cultura consiste em práticas materiais e imateriais ligadas à pesca marítima artesanal e à terra, com o plantio principalmente de mandioca."
  },
  {
    nome: "Catadores de mangaba",
    descricao: "Nas áreas de restinga e tabuleiros costeiros, especialmente em Sergipe, florescem comunidades tradicionais, de mulheres majoritariamente, dedicadas ao ancestral cultivo e coleta da mangaba. Sua existência depende do uso e da preservação da biodiversidade local. A fruta provê seu sustento e é constitutiva de sua identidade cultural, assim como seus conhecimentos sobre o preparo de alimentos e medicamentos à base de mangaba. Protegem a flora e a fauna, mantendo práticas conscientes e equilibradas."
  },
  {
    nome: "Catingueiros",
    descricao: "Os povos da Caatinga, conhecidos como catingueiros, são sertanejos, vaqueiros, agricultores, populações indígenas e quilombolas, entre outros. O Semiárido brasileiro, com sua paisagem ampla, tornou-se propício ao estabelecimento de populações humanas, cujos meios de vida possibilitaram a sobrevivência e a reprodução apesar da aridez. O conhecimento tradicional foi acumulado por gerações, que lhes permitiu lidar com as condições adversas, otimizar o aproveitamento de água, o manejo de caprinos “pé duro” (raça crioula resultante de seleção natural), a ampla utilização da flora (alimentação, saúde, ração animal etc.) e o uso de sementes crioulas, com espécies mais adaptadas às peculiaridades regionais. O bioma é berço de comunidades tradicionais como os indígenas Tumbalala, os Xukurus, os Pankararu e os quilombolas de Conceição das Crioulas. Eles desenvolveram estratégias de sobrevivência e perpetuam saberes sobre o manejo de plantas e seu uso medicinal. Também praticam a milenar sondagem para detecção de águas subterrâneas com uso forquilhas – hidroestesia –, técnica milenar que emprega a sensibilidade humana às radiações emitidas por diferentes materiais encontrados no subsolo. Também mantêm a tradição de interpretar os sinais da natureza que antecedem as secas prolongadas e as chuvas."
  },
  {
    nome: "Cipozeiros",
    descricao: "Nos recantos profundos das florestas brasileiras, residem tradicionais comunidades de cipozeiros, dedicadas à extração de diversas espécies de cipós e seu aproveitamento para a produção de artesanato. São pouco mencionados nas narrativas contemporâneas, embora sejam estratégicos para preservação da biodiversidade e do uso sustentável dos recursos naturais. Praticam a agricultura de subsistência e a pesca para sua alimentação e fortalecimento da economia local. Entretanto, são ameaçados pelo desmatamento, a expansão agrícola predatória, e a falta de reconhecimento de seus direitos territoriais."
  },
  {
    nome: "Fundo e Fecho de Pasto",
    descricao: "No coração do sertão baiano, entre a aridez e a caatinga que desafia o sol, florescem mais de mil comunidades de Fundo e Fecho de Pasto. São trabalhadoras e trabalhadores sertanejos. Há mais de trezentos anos mantêm forte conexão com a terra, partilham áreas livres, praticam a agricultura familiar, criam gado solto onde há água, e assim sobrevivem às estiagens."
  },
  {
    nome: "Quilombolas",
    descricao: "Os quilombolas são povos e comunidades tradicionais cuja origem está associada aos quilombos formados durante o período da escravidão no Brasil. Presentes em diferentes regiões do país, preservam práticas culturais, conhecimentos tradicionais, manifestações artísticas e formas próprias de organização social e territorial, transmitidas entre gerações. Sua trajetória histórica está ligada à afirmação de sua identidade cultural e à defesa de seus territórios e direitos coletivos."
  },
  {
    nome: "Extrativistas",
    descricao: "Conhecida como a atividade humana mais antiga, a extração baseia-se na coleta de produtos naturais de origem animal, vegetal ou mineral, como atividades econômicas e de subsistência. É exercida por comunidades tradicionais de pequenos agricultores. São povos de culturas e saberes distintos, que mantêm seus modos de vida em sintonia com o ecossistema que habitam. Desenvolvem tecnologias simples e de baixo impacto, apropriadas às condições de solo e clima e ao manejo sustentável da biodiversidade local."
  },
  {
    nome: "Extrativistas costeiros e marinhos",
    descricao: "São trabalhadoras e trabalhadores que habitam as Reservas Extrativistas Marinhas e Costeiras do Estado do Pará. Esses ecossistemas são também encontrados nas transições entre terra e mar em quase toda a costa brasileira, onde existem áreas de mangue. Manguezais são fundamentais por sua alta capacidade de retenção de carbono, superior até mesmo das florestas. Concentram recursos vitais para as comunidades tradicionais que deles sobrevivem, cujos conhecimentos ancestrais contribuem para sua preservação. Mangues são berçários de reprodução de grande quantidade de espécies marinhas, dos quais dependem cerca de um milhão de brasileiros. Esses ecossistemas enfrentam pressões decorrentes de diferentes formas de ocupação e uso do território, reforçando a importância de sua conservação e do reconhecimento dos modos de vida das comunidades tradicionais."
  },
  {
    nome: "Faxinalenses",
    descricao: "Os faxinalenses, ou faxinais, são comunidades tradicionais localizadas em áreas rurais da região Sul do Brasil, formadas predominantemente por descendentes de colonizadores europeus. Seus modos de vida estão associados à agricultura, à pecuária e ao uso coletivo de áreas comuns, organizados por meio de formas comunitárias de gestão e de tomada de decisões. Preservam conhecimentos e práticas tradicionais relacionados ao manejo sustentável dos recursos naturais, além de manifestações culturais transmitidas entre gerações. Essas comunidades também enfrentam desafios relacionados às transformações no uso e na ocupação do território, contexto em que políticas públicas voltadas ao reconhecimento e à valorização desses modos de vida têm sido desenvolvidas."
  },
  {
    nome: "Geraizeiros",
    descricao: "Os geraizeiros ocupam os campos gerais do Cerrado, no Norte do Estado de Minas Gerais, às margens do Rio São Francisco. Adaptaram-se com às características do bioma e ao seu potencial produtivo com conhecimento e respeito aos ciclos da natureza. Às vezes compartilham a mesma propriedade, plantam e criam animais. Garantem sua subsistência e comercializam excedentes em comunidades vizinhas ou em feiras. Em diferentes territórios, essas comunidades enfrentam desafios relacionados ao reconhecimento e à regularização fundiária, bem como à manutenção de seus modos de vida e do uso tradicional do território."
  },
  {
    nome: "Ilhéus",
    descricao: "Os ilhéus são comunidades tradicionais que vivem em pequenas ilhas e têm seus modos de vida associados à pesca artesanal e ao ambiente marinho. Descendem de antigos navegadores e pescadores e preservam conhecimentos tradicionais sobre as correntes marítimas, as marés, os ventos e outros aspectos do ecossistema costeiro, transmitidos entre gerações. Em algumas localidades, organizam-se por meio de formas comunitárias de gestão e de tomada de decisões. Suas atividades estão relacionadas ao uso sustentável dos recursos naturais e à conservação dos ambientes marinhos. Essas comunidades também enfrentam desafios decorrentes da poluição, da sobrepesca, das mudanças climáticas e de outras pressões sobre os ecossistemas costeiros e marinhos."
  },
  {
    nome: "Morroquianos",
    descricao: "Os Morroquianos são habitantes das comunidades e favelas, que têm suas raízes nos fluxos migratórios que moldaram as cidades durante séculos. Descendentes de trabalhadores rurais, imigrantes e refugiados, sua identidade se forja na diversidade étnica e cultural. Essas comunidades convivem com diferentes desafios relacionados ao acesso a serviços públicos, à melhoria das condições de vida e ao reconhecimento de seus modos de organização social e cultural. Desenvolveram formas de organização social e econômica por meio de associações, e sua cultura reflete múltiplas influências por meio da música, da dança e do teatro. Essas e outras manifestações mobilizam suas comunidades e reafirmam sua identidade. Seus modos de vida refletem a diversidade cultural presente nos centros urbanos e contribuem para a dinâmica social e cultural das cidades."
  },
  {
    nome: "Pantaneiros",
    descricao: "Os Pantaneiros, habitantes das regiões alagadas e das planícies pantaneiras, têm raízes nas comunidades que se estabeleceram nas margens dos rios e cursos de água que cortam o Pantanal. Descendentes de indígenas, ribeirinhos e colonizadores, sua cultura é uma mistura de influências étnicas e culturais. A pecuária extensiva e a pesca são suas principais atividades econômicas. Detêm conhecimentos tradicionais sobre a fauna, a flora e os ciclos naturais do bioma, aplicados em atividades como a pecuária, a agricultura e o manejo dos recursos naturais, transmitidos entre gerações. Em muitas comunidades, predominam relações de cooperação entre as famílias e formas próprias de organização social. Essas comunidades enfrentam desafios relacionados às transformações no uso e na ocupação do território e aos impactos sobre os ecossistemas do Pantanal. Nesse contexto, políticas e iniciativas voltadas ao fortalecimento de seus modos de vida e à conservação do bioma contribuem para a valorização de seus conhecimentos tradicionais e de sua relação com o território."
  },
  {
    nome: "Pescadores artesanais",
    descricao: "Habitam a beira de cursos d’água e mares. Suas vidas são regidas pelo movimento das marés, rios e as estações do ano. Suas atividades acompanham os ciclos das marés, dos rios e das estações do ano, com base em conhecimentos tradicionais sobre os ecossistemas aquáticos, as espécies e as técnicas de pesca, transmitidos entre gerações, adaptando-se às mudanças do ambiente e às exigências da vida moderna. Suas técnicas, muitas vezes rudimentares, advêm de séculos de familiaridade com os movimentos dos peixes e das correntes marítimas. Cultivam a sustentabilidade, retirando das águas o suficiente para seu sustento, sem esgotamento dos recursos. Também sofrem a ameaça da pesca predatória, da poluição, e das mudanças climáticas que afetam a biodiversidade. Têm alcançado reconhecimento como guardiões das águas e das tradições culturais, por meio de projetos de fortalecimento de suas comunidades e dos ecossistemas dos quais dependem. A pesca, em especial a artesanal, é uma das atividades econômicas mais importantes de municípios do litoral amazônico brasileiro, por gerar empregos e renda para significativa parcela da população local."
  },
  {
    nome: "Povo pomerano",
    descricao: "O povo pomerano, descendente de colonos germânicos do século XIX, oriundo da Pomerânia (nordeste da Alemanha), se estabeleceram na região Sul do Brasil. Preservam um patrimônio cultural caracterizado pelo uso da língua pomerana, por manifestações culturais, como música, danças, festas e culinária, e por conhecimentos e práticas transmitidos entre gerações, em que a agricultura é a principal atividade, com destaque para o cultivo de milho, feijão e mandioca. Essas comunidades também enfrentam desafios relacionados à preservação de sua língua, de sua cultura e de seus modos de vida."
  },
  {
    nome: "Povos ciganos",
    descricao: "Os povos ciganos, também conhecidos como romani ou roma, constituem um conjunto de grupos étnico-culturais com uma história marcada por migrações e pela preservação de tradições próprias. Originários do norte da Índia, migraram para vários países difundindo sua cultura, tradições e a língua romani. São conhecidos por sua habilidade artística, música e dança vibrantes, que refletem sua forte identidade cultural. No entanto, também enfrentaram discriminação e marginalização ao longo da história, muitas vezes estigmatizados negativamente, o que acarretou dificuldades socioeconômicas e falta de acesso a oportunidades educacionais e emprego. Ainda assim, mantêm forte conexão com sua ancestralidade. Valorizam profundamente a família, a comunidade e a liberdade, e muitos conservam práticas culturais únicas, mesmo sob pressões de assimilação cultural. A valorização dos povos ciganos se traduz em práticas de compreensão e respeito, para a formação de uma sociedade mais inclusiva e justa."
  },
  {
    nome: "Comunidades de terreiro / Povos e comunidades de matriz africana",
    descricao: "Esses espaços congregam comunidades com características em comum. Incluem a manutenção das tradições de matriz africana, o respeito aos ancestrais, os valores de generosidade e solidariedade, um amplo conceito de família e uma relação próxima com o meio ambiente. Têm preservado uma cultura diferenciada e organização social própria, que constituem o patrimônio cultural afro-brasileiro. Características diferenciadas identificam os três grupos estabelecidos em maior número no território brasileiro: os Bantu, os Fon e os Yoritbá. Suas práticas incluem o candomblé, o batuque e a umbanda, dentre outras. Caracterizam-se por grupos linguísticos específicos, pelos espaços geográficos que ocupam e, também, por macro padrões culturais, sociais, ritualísticos e estéticos, alimentares e performáticos. Não raro, sofrem discriminação por parte de praticantes de religiões tradicionais e convencionais."
  },
  {
    nome: "Povos indígenas",
    descricao: "Povos indígenas são aqueles que, tendo continuidade histórica a partir de grupos pré-colombianos, consideram-se distintos da sociedade nacional. Estão presentes em todo o território brasileiro, tanto em áreas urbanas quanto rurais. A região norte possui a maior população indígena do país (44,48%). Os indígenas se reconhecem como pertencentes a comunidades determinadas e por elas são reconhecidos como membros. A identificação de uma pessoa como indígena é auto declaratória, seguindo os mesmos princípios da Convenção nº 169 da OIT (para povos indígenas e tribais), que estabelecem: “A auto identificação como indígena ou tribal deverá ser considerada um critério fundamental para a definição dos grupos”. O número de indígenas no Brasil, segundo o último Censo do Instituto Brasileiro de Geografia e Estatística - IBGE (2022) -, é de aproximadamente 1,7 milhão. Desse total, 622,1 mil (36,73%) vivem em terras indígenas oficialmente reconhecidas pelo governo federal, e 1,1 milhão (63,27%) fora delas. Distribuem-se em 305 grupos étnicos e falam 274 línguas indígenas identificadas."
  },
  {
    nome: "Quebradeiras de coco babaçu",
    descricao: "São comunidades constituídas majoritariamente por mulheres, presentes principalmente no Maranhão. Somam cerca de 300 mil trabalhadoras rurais que vivem da extração do babaçu, espécie vegetal comumente encontrada nos Estados do Maranhão, Piauí, Tocantins e Pará. A palmeira é típica de zonas de transição entre florestas úmidas da bacia amazônica, do cerrado e da caatinga. Esses grupos são considerados tradicionais por terem um modo de vida fortemente conectado ao território onde vivem e preservarem conhecimentos, práticas de manejo e usos do coco babaçu, transmitidos de geração em geração. A palmeira de babaçu produz o coco, entre diversos outros produtos, e da castanha se extrai o óleo de babaçu. Ele é usado para a fabricação de sabonetes, cosméticos, gorduras especiais e a farinha do mesocarpo do babaçu, que pode ser usada em receitas. Além disso, com o endocarpo pode-se fazer carvão. Importante observar que o babaçu também rende peças artesanais como brincos, colares, pulseiras, cestos, peças de decoração e outros ornamentos. A relação com o território, e principalmente com a matéria-prima, é essencial para as pessoas que integram essas comunidades. Para elas, a terra torna-se um bem coletivo."
  },
  {
    nome: "Raizeiros",
    descricao: "Os raizeiros são consagrados pela cultura popular devido a seus conhecimentos sobre preparo, indicações de uso e comercialização de plantas medicinais. Estão presentes nas ruas, feiras livres e mercados nordestinos e, também, nos centros de grandes cidades brasileiras. Uma pesquisa realizada no município de São Miguel, no Rio Grande do Norte, sobre o comércio de plantas e produtos medicinais, da UFERSA em 2012, identificou raizeiros como pertencentes a uma ampla faixa etária (34-81 anos). Auferiam renda inferior a um salário mínimo. Embora os produtos tivessem acondicionamento precário, a população local manifestava confiança nos raizeiros e os procurava, como acontece, também atualmente, para a obtenção de plantas desidratadas e raízes consideradas auxiliares na cura de doenças."
  },
  {
    nome: "Retireiros do Araguaia",
    descricao: "Desde que chegaram às margens do rio Araguaia, movidos pela expansão agrícola dos anos 1940, os retireiros puderam usufruir de uma das melhores áreas de pastos naturais do país. Aproveitam pastagens naturais e, de acordo com o avanço e recuo das águas, vão construindo suas histórias de vida. Todos os anos, ao fim da temporada de chuvas, o rio volta a seu leito, e as áreas antes alagadas tornam-se um extenso campo verde e úmido, enriquecido pelos nutrientes deixados pelas águas. Nele, há quase 80 anos, se instalaram os “retiros”, nome que se refere aos locais onde cada criador instala sua casa, roça e curral para alimentar o gado durante a estiagem. Lá permanecem até o retorno da estação chuvosa, por volta de outubro. A criação de gado é sua principal fonte de renda, mas nas últimas décadas, esse modo de vida tem enfrentado desafios decorrentes da expansão de atividades agropecuárias."
  },
  {
    nome: "Ribeirinhos",
    descricao: "O termo “Povos ribeirinhos” se refere às comunidades tradicionais que habitam as margens dos rios, lagos e igarapés, em diferentes localidades do território brasileiro. Seus modos de vida estão entrelaçados com a natureza ao seu redor, moldados pela proximidade e conexão com as águas. Os rios são seus meios de transporte, fonte de alimento e fornecedores de água potável. Suas embarcações são extensões de suas casas, permitindo-lhes deslocar por longos trechos de rios. Com profundo conhecimento dos recursos naturais da região em que vivem, são verdadeiros guardiões da natureza, uma vez que dependem dos recursos naturais para sua existência. A pesca, a agricultura de pequena escala e a coleta de produtos florestais são atividades essenciais para essas comunidades."
  },
  {
    nome: "Vazanteiros",
    descricao: "Assim como outros povos e comunidades tradicionais, os vazanteiros possuem um modo de vida próprio. São assim chamados por praticarem uma agricultura associada aos ciclos de expansão e retorno dos rios a seus leitos. No Cerrado, estão localizados principalmente às margens do Rio São Francisco e seus afluentes."
  },
  {
    nome: "Veredeiros",
    descricao: "Os veredeiros são comunidades tradicionais que apresentam profundo vínculo com o ambiente das veredas, um subsistema do Bioma Cerrado. Dedicam-se à extração de espécies vegetais como a palmeira buriti e outras. Praticam o plantio rotativo nos campos úmidos próximos às veredas e a criação extensiva de gado bovino. Nos períodos de chuva, deixam o gado se movimentar livremente pelas chapadas, e na seca aproveitam os campos úmidos para o plantio. O extrativismo da palmeira Buriti é especialmente notório. Seus produtos são utilizados na produção de artesanato, de mobiliário e na construção de casas."
  }
];


export default comunidadesTradicionais
