# INSTITUTO FEDERAL DE EDUCAÇÃO, CIÊNCIA E TECNOLOGIA DE SÃO PAULO - CAMPUS BIRIGUI

## Curso de Bacharelado em Engenharia da Computação

&nbsp;

&nbsp;

# ANÁLISE DAS CURVAS DE TENSÃO-DEFORMAÇÃO DO PLA IMPRESSO EM 3D UTILIZANDO O MODELO MATEMÁTICO DE RAMBERG-OSGOOD

&nbsp;

**Lourenço Henrique Neves Pereira**

**Davi F. Silva**

&nbsp;

Orientador: Prof. Dr. Vicente Gerlin Neto

&nbsp;

Birigui - SP

2026

---

## FOLHA DE ROSTO

Trabalho de Conclusão de Curso apresentado ao Instituto Federal de Educação, Ciência e Tecnologia de São Paulo, Campus Birigui, como requisito parcial para a obtenção do título de Bacharel em Engenharia da Computação.

Área de conhecimento (Tabela CNPq): 3.08.01.00-4 (Materiais e Componentes de Construção Mecânica).

---

## RESUMO

A manufatura aditiva por deposição de material fundido (FDM) consolidou-se como tecnologia essencial para prototipagem e fabricação de componentes funcionais, tendo o Ácido Polilático (PLA) como um de seus materiais mais utilizados. As propriedades mecânicas de peças impressas em 3D, entretanto, não dependem apenas do material: são fortemente influenciadas pelos parâmetros de processo, como temperatura de extrusão e velocidade de impressão, o que torna a caracterização mecânica convencional, baseada em múltiplos ensaios destrutivos de tração, onerosa em tempo e em consumo de filamento. Este trabalho analisa o comportamento tensão-deformação do PLA impresso por FDM e apresenta o desenvolvimento de uma ferramenta computacional preditiva fundamentada no modelo constitutivo de Ramberg-Osgood. Corpos de prova conforme a norma ASTM D638 foram fabricados em impressora Creality Ender-6, variando-se sistematicamente a temperatura de extrusão (190 °C, 210 °C e 220 °C) e a velocidade de impressão (90, 95 e 100 mm/s) em planejamento fatorial completo 3 × 3 com cinco repetições, e ensaiados em máquina universal EMIC DL30000N a 5 mm/min. As curvas experimentais foram processadas com normalização pela área individual de cada corpo de prova e correção da região de acomodação (*toe compensation*), alimentando rotinas de ajuste automático dos parâmetros constitutivos (módulo de elasticidade E, tensão de referência σ₀ e expoente de encruamento n) e a construção de metamodelos por interpolação com funções de base radial, capazes de predizer o comportamento mecânico para combinações de parâmetros não ensaiadas. A integração entre base de dados experimental, modelagem matemática e visualização interativa culminou na plataforma computacional ResistencIA, implementada como aplicação web com persistência em banco de dados relacional. Os resultados mostraram tensões máximas entre 41,7 e 47,0 MPa, com efeito estatisticamente significativo da velocidade de impressão (ANOVA, F = 5,50 > F crítico = 3,26), módulo de elasticidade aparente crescente com a temperatura e ajustes do modelo de Ramberg-Osgood com coeficiente de determinação entre 0,985 e 0,990 em todas as condições. A validação cruzada *leave-one-out* do metamodelo indicou erro absoluto médio de 1,18 MPa na predição da tensão máxima (2,7% de erro relativo), e os valores obtidos pela plataforma foram validados contra os relatórios oficiais da máquina de ensaios, com concordância superior a 97%. Conclui-se que a abordagem proposta reduz a necessidade de ensaios físicos, apoia a otimização de parâmetros de impressão e constitui uma metodologia extensível a outros materiais termoplásticos.

**Palavras-chave**: impressão 3D; ácido polilático; modelo de Ramberg-Osgood; curvas tensão-deformação; metamodelagem; sistema preditivo; ensaio de tração.

---

## ABSTRACT

Fused Deposition Modeling (FDM) additive manufacturing has become an essential technology for prototyping and for the production of functional components, with Polylactic Acid (PLA) as one of its most widely used materials. The mechanical properties of 3D-printed parts, however, do not depend on the material alone: they are strongly influenced by process parameters such as extrusion temperature and printing speed, which makes conventional mechanical characterization, based on multiple destructive tensile tests, costly in both time and filament consumption. This work analyzes the stress-strain behavior of FDM-printed PLA and presents the development of a predictive computational tool based on the Ramberg-Osgood constitutive model. Specimens complying with the ASTM D638 standard were manufactured on a Creality Ender-6 printer, systematically varying extrusion temperature (190 °C, 210 °C and 220 °C) and printing speed (90, 95 and 100 mm/s) in a full 3 × 3 factorial design with five replicates, and tested on an EMIC DL30000N universal testing machine at 5 mm/min. The experimental curves were processed with per-specimen cross-section normalization and toe compensation, feeding automatic fitting routines for the constitutive parameters (elastic modulus E, reference stress σ₀ and hardening exponent n) and the construction of radial-basis-function metamodels capable of predicting mechanical behavior for untested parameter combinations. The integration of the experimental database, mathematical modeling and interactive visualization resulted in the ResistencIA computational platform, implemented as a web application with relational database persistence. Results showed maximum stresses between 41.7 and 47.0 MPa, with a statistically significant effect of printing speed (ANOVA, F = 5.50 > critical F = 3.26), apparent elastic modulus increasing with temperature, and Ramberg-Osgood fits with coefficients of determination between 0.985 and 0.990 under all conditions. Leave-one-out cross-validation of the metamodel indicated a mean absolute error of 1.18 MPa for maximum stress prediction (2.7% relative error), and the values computed by the platform were validated against the official testing machine reports, with agreement above 97%. It is concluded that the proposed approach reduces the need for physical testing, supports the optimization of printing parameters and constitutes a methodology extensible to other thermoplastic materials.

**Keywords**: 3d printing; polylactic acid; ramberg-osgood model; stress-strain curves; metamodeling; predictive system; tensile testing.

---

## LISTA DE FIGURAS (a numerar na diagramação final)

- Figura 1 — Esquema do processo FDM: extrusão, deposição e movimentação por eixos.
- Figura 2 — Rota de produção do PLA: fermentação, lactídeo e polimerização por abertura de anel.
- Figura 3 — Curva tensão-deformação típica, com identificação das regiões elástica e plástica.
- Figura 4 — Corpo de prova ASTM D638 e dimensões nominais.
- Figura 5 — Máquina universal de ensaios EMIC DL30000N do laboratório do IFSP Campus Birigui.
- Figura 6 — Curvas experimentais brutas com região de acomodação (*toe region*) e curvas corrigidas.
- Figura 7 — Efeito do expoente n na forma da curva do modelo de Ramberg-Osgood.
- Figura 8 — Fluxo de dados da plataforma ResistencIA: importação, ajuste, metamodelo e predição.
- Figura 9 — Interface do módulo de predição da plataforma ResistencIA.
- Figura 10 — Ajuste do modelo de Ramberg-Osgood sobre ensaio experimental (módulo Calibração).
- Figura 11 — Superfície de resposta da tensão máxima no plano temperatura × velocidade (módulo Atlas 3D).
- Figura 12 — Comparação de curvas tensão-deformação médias por condição de impressão.
- Figura 13 — Tensão máxima por condição: valores da plataforma e valores dos relatórios EMIC.

## LISTA DE TABELAS

- Tabela 1 — Condições experimentais do planejamento fatorial 3 × 3.
- Tabela 2 — Dimensões medidas dos corpos de prova (média por condição).
- Tabela 3 — Propriedades mecânicas por condição de impressão (análise da plataforma).
- Tabela 4 — Estatísticas oficiais dos relatórios de ensaio EMIC por condição.
- Tabela 5 — Análise de variância (ANOVA) de dois fatores para as propriedades medidas.
- Tabela 6 — Parâmetros ajustados do modelo de Ramberg-Osgood por condição.
- Tabela 7 — Validação cruzada *leave-one-out* do metamodelo RBF.
- Tabela 8 — Comparação dos resultados com valores da literatura para PLA impresso.
- Tabela A1 — Resultados individuais por corpo de prova (Apêndice).

---

## SUMÁRIO

1. Introdução
2. Manufatura Aditiva e o Processo FDM
3. O Material: Ácido Polilático (PLA)
4. Comportamento Mecânico e Caracterização de Materiais
5. Influência dos Parâmetros de Impressão na Estrutura
6. Previsão Computacional e Modelagem Mecânica
7. Materiais e Métodos
8. Resultados e Discussão
9. Conclusões
10. Trabalhos Futuros
Referências Bibliográficas
Apêndice A — Modelo de dados da plataforma
Apêndice B — Algoritmo de ajuste do modelo constitutivo
Apêndice C — Resultados individuais por corpo de prova

---

# 1 INTRODUÇÃO

## 1.1 Contextualização

A impressão 3D por deposição de material fundido (FDM, do inglês *Fused Deposition Modeling*) tem provocado mudanças significativas nos processos de desenvolvimento de produtos, permitindo maior liberdade geométrica, redução de custos e aceleração do ciclo de prototipagem quando comparada a métodos tradicionais de fabricação. Essa tecnologia tem sido amplamente adotada em ambientes acadêmicos, industriais e de pesquisa, especialmente devido à sua versatilidade e ao avanço contínuo dos materiais disponíveis (GIBSON; ROSEN; STUCKER, 2015; NGO et al., 2018).

O Ácido Polilático (PLA) é um polímero termoplástico amplamente utilizado na impressão 3D por FDM, principalmente em virtude de sua origem renovável, biodegradabilidade, baixo custo e facilidade de processamento (FARAH; ANDERSON; LANGER, 2016; GARLOTTA, 2001). Apesar dessas vantagens, as propriedades mecânicas do PLA impresso não são intrínsecas apenas ao material: são fortemente influenciadas pelos parâmetros de impressão, como temperatura de extrusão, velocidade de deposição e espessura de camada. Pequenas variações nesses parâmetros podem resultar em diferenças significativas no comportamento mecânico final das peças fabricadas (MURARIU et al., 2022; OUHSTI; HADDADI; BELHOUIDEG, 2018; CHACÓN et al., 2017).

Essa dependência decorre da própria natureza construtiva do processo: uma peça FDM é, em essência, um compósito de filamentos soldados termicamente, cujas interfaces respondem pela integridade estrutural do conjunto. A qualidade dessas soldas, governada pelo histórico térmico da deposição, define se a peça se comportará como um sólido quase contínuo ou como um empilhamento frágil de camadas mal aderidas (ES-SAID et al., 2000; SUN et al., 2008).

## 1.2 Problema de pesquisa e justificativa

A caracterização mecânica tradicional do PLA impresso, baseada em ensaios destrutivos de tração conforme a norma ASTM D638, demanda tempo considerável de laboratório e elevado consumo de material. Para cada nova combinação de parâmetros de impressão é necessário fabricar um lote de corpos de prova, ocupar a máquina universal de ensaios e descartar o material rompido. Em um espaço de projeto com apenas duas variáveis contínuas (temperatura e velocidade), o número de combinações possíveis é infinito, e mesmo uma discretização grosseira multiplica rapidamente o custo experimental (TYMRAK; KREIGER; PEARCE, 2014).

Coloca-se, portanto, o problema central deste trabalho: **é possível, a partir de um conjunto finito e bem planejado de ensaios de tração, prever com precisão de engenharia o comportamento tensão-deformação do PLA impresso para qualquer combinação de temperatura e velocidade dentro do domínio estudado?**

A resposta proposta combina três elementos: (i) uma base experimental construída sob planejamento fatorial, com repetições e norma técnica; (ii) um modelo constitutivo, o de Ramberg-Osgood, capaz de condensar cada curva experimental em três parâmetros de significado físico; e (iii) técnicas de metamodelagem que interpolam esses parâmetros sobre o espaço de processo. A hipótese de trabalho é que a cadeia experimento → modelo → metamodelo preserva a informação essencial do comportamento do material, permitindo predições com erro da mesma ordem da dispersão experimental.

A justificativa do trabalho é dupla. Do ponto de vista científico, contribui para a compreensão quantitativa da influência dos parâmetros de processo nas propriedades mecânicas do PLA impresso, tema de intensa investigação na literatura de manufatura aditiva (POPESCU et al., 2018; LANZOTTI et al., 2015). Do ponto de vista prático, entrega uma ferramenta computacional aberta, a plataforma ResistencIA, que transforma dados de ensaio em capacidade preditiva reutilizável, com potencial de reduzir desperdício de material, tempo de máquina e custo de desenvolvimento em laboratórios e pequenas empresas que utilizam impressão 3D.

## 1.3 Origem do trabalho

Este trabalho é resultado da união de dois projetos de iniciação científica complementares desenvolvidos no IFSP Campus Birigui. O primeiro, de natureza experimental, caracterizou a influência dos parâmetros de impressão nas propriedades mecânicas do PLA por meio de ensaios de tração destrutivos, fabricando e rompendo corpos de prova em nove condições de processo (SILVA et al., 2024). O segundo, de natureza computacional e vinculado ao Programa Institucional de Bolsas de Iniciação Científica (PIBIFSP), desenvolveu um aplicativo preditivo capaz de estimar as curvas tensão-deformação do material a partir dos parâmetros de impressão, utilizando o modelo constitutivo de Ramberg-Osgood (PEREIRA; SILVA; GERLIN NETO, 2025). A integração entre a base de dados experimental, a modelagem matemática e a visualização interativa culminou no desenvolvimento da plataforma *ResistencIA*, objeto central deste estudo.

Cabe destacar o caráter interdisciplinar da investigação: embora desenvolvido no âmbito de um curso de Engenharia da Computação, o trabalho tem seu foco na mecânica dos materiais; a computação comparece como instrumento, provendo o ferramental de modelagem numérica, persistência de dados e interface que torna a análise mecânica sistemática e reprodutível.

## 1.4 Objetivos

### 1.4.1 Objetivo geral

Analisar o comportamento tensão-deformação do PLA impresso em 3D por FDM sob diferentes parâmetros de impressão e desenvolver uma ferramenta computacional capaz de prever esse comportamento por meio do modelo matemático de Ramberg-Osgood.

### 1.4.2 Objetivos específicos

- Fabricar corpos de prova de PLA conforme a norma ASTM D638, variando sistematicamente a temperatura de extrusão (190 °C, 210 °C, 220 °C) e a velocidade de impressão (90, 95, 100 mm/s) em planejamento fatorial completo com repetições;
- Realizar os ensaios de tração em máquina universal e consolidar os registros brutos (tempo, alongamento, força) em uma base de dados estruturada;
- Processar as curvas experimentais com normalização pela área individual de cada corpo de prova e correção da região de acomodação (*toe compensation*), conforme prescreve a norma;
- Extrair as propriedades mecânicas de interesse: módulo de elasticidade aparente, tensão máxima, deformação na ruptura e tenacidade;
- Avaliar a significância estatística dos efeitos de temperatura e velocidade por análise de variância (ANOVA) de dois fatores;
- Implementar computacionalmente o modelo constitutivo de Ramberg-Osgood, incluindo rotinas de ajuste automático dos parâmetros E, σ₀ e n, e quantificar a qualidade dos ajustes;
- Construir metamodelos por interpolação com funções de base radial que correlacionem os parâmetros de impressão aos parâmetros constitutivos, e validá-los por validação cruzada *leave-one-out*;
- Desenvolver a plataforma web ResistencIA, integrando banco de dados experimental, ajuste, predição e visualização interativa;
- Validar os resultados da plataforma por comparação com os relatórios oficiais emitidos pela máquina de ensaios.

## 1.5 Organização do trabalho

O trabalho está organizado da seguinte forma: o Capítulo 2 apresenta os fundamentos da manufatura aditiva e do processo FDM; o Capítulo 3 caracteriza o PLA quanto às suas propriedades químicas, mecânicas e térmicas; o Capítulo 4 aborda o comportamento mecânico e a caracterização de materiais, com ênfase no ensaio de tração e nas curvas de tensão-deformação; o Capítulo 5 discute a influência dos parâmetros de impressão na estrutura e nas propriedades das peças; o Capítulo 6 fundamenta a previsão computacional, o modelo de Ramberg-Osgood e as técnicas de metamodelagem, diferencial deste trabalho; o Capítulo 7 descreve os materiais e métodos, incluindo o protocolo experimental e a implementação da plataforma ResistencIA; o Capítulo 8 apresenta e discute os resultados experimentais, estatísticos e preditivos; os Capítulos 9 e 10 trazem as conclusões e as propostas de trabalhos futuros. Os apêndices documentam o modelo de dados da plataforma, o algoritmo de ajuste e os resultados individuais por corpo de prova.

---

# 2 MANUFATURA ADITIVA E O PROCESSO FDM

## 2.1 Fundamentos da Construção Mecânica Moderna

A utilização de materiais na indústria desempenha um papel importante no desenvolvimento de novas tecnologias e na evolução da sociedade moderna. Historicamente, a engenharia de manufatura dependia de métodos como usinagem, injeção e fundição; esse cenário industrial sofre hoje uma transição com a manufatura aditiva, popularmente conhecida como impressão 3D, que constrói objetos tridimensionais diretamente de modelos digitais, por meio de aquecimento, extrusão e disposição do material em camadas sucessivas (GIBSON; ROSEN; STUCKER, 2015).

A escolha da matéria-prima utilizada nesse processo impacta a qualidade final do produto, o tempo de ciclo e a adequação geométrica à finalidade do componente. Essa modernização trouxe a possibilidade de uma transição quase imediata entre a virtualização de um projeto e o teste físico que precisa ocorrer neste tipo de material, a depender da finalidade do produto.

Os processos tradicionais de fabricação são, em sua maioria, **subtrativos**, que partem de um bloco de material e removem o excedente até atingir a geometria desejada, como na usinagem, ou **formativos**, que impõem a forma por meio de moldes e esforços, como na injeção e na fundição. A manufatura aditiva inverte essa lógica: o material é adicionado apenas onde a geometria o exige, camada sobre camada. Essa inversão traz consequências profundas para a engenharia de produto: praticamente elimina o ferramental dedicado (moldes, matrizes, dispositivos de fixação), reduz o desperdício de matéria-prima e permite geometrias antes inviáveis, como canais internos curvos, estruturas celulares e peças topologicamente otimizadas (WONG; HERNANDEZ, 2012; NGO et al., 2018).

## 2.2 Breve histórico e classificação dos processos aditivos

A manufatura aditiva tem origem na estereolitografia, patenteada por Charles Hull em 1986, que solidificava resina fotopolimérica com luz ultravioleta, camada por camada. Poucos anos depois, em 1989, Scott Crump depositou a patente do processo de *Fused Deposition Modeling*, fundando a empresa Stratasys e dando origem à tecnologia que viria a se tornar a mais difundida do mundo com a expiração das patentes originais e o surgimento do movimento de impressoras de código aberto, a partir de 2009 (CRUMP, 1992; GIBSON; ROSEN; STUCKER, 2015). A popularização de equipamentos de baixo custo, na faixa de centenas de dólares, deslocou a tecnologia dos centros de prototipagem industriais para laboratórios acadêmicos, escolas técnicas e pequenas empresas, criando um ecossistema global de fabricação distribuída (TYMRAK; KREIGER; PEARCE, 2014).

A norma ISO/ASTM 52900 (2021) organiza os processos de manufatura aditiva em sete categorias fundamentais, segundo o mecanismo físico de consolidação do material:

1. **Extrusão de material** (*material extrusion*): o material é seletivamente dispensado através de um bico aquecido, categoria à qual pertence o FDM;
2. **Fotopolimerização em cuba** (*vat photopolymerization*): resina líquida curada seletivamente por luz (SLA, DLP);
3. **Fusão em leito de pó** (*powder bed fusion*): fonte térmica (laser ou feixe de elétrons) funde regiões de um leito de pó (SLS, SLM);
4. **Jateamento de material** (*material jetting*): gotículas de material são depositadas seletivamente;
5. **Jateamento de aglutinante** (*binder jetting*): agente líquido une regiões de um leito de pó;
6. **Laminação de chapas** (*sheet lamination*): folhas de material são unidas e recortadas;
7. **Deposição por energia direcionada** (*directed energy deposition*): energia térmica funde o material à medida que é depositado.

Dentre essas categorias, a extrusão de material destaca-se pela simplicidade construtiva do equipamento, pelo custo reduzido de máquina e insumo e pela segurança operacional, características que a tornaram a porta de entrada da manufatura aditiva e a tecnologia empregada neste trabalho.

## 2.3 A Tecnologia FDM (Fused Deposition Modeling)

Dentre as várias opções de mercado de equipamentos de *Fused Deposition Modeling* (FDM), ou Modelagem por Fusão e Deposição, este trabalho utilizou a impressora 3D Creality Ender-6, disponibilizada pelo laboratório IFMaker do campus. O funcionamento do FDM baseia-se na extrusão termomecânica altamente controlada. O equipamento opera sobre uma plataforma integrada a um sistema de movimentação vertical no eixo Z, acionado após a conclusão de cada nível depositado. O filamento de polímero é conduzido por tração mecânica através de roletes e direcionado ao conjunto de aquecimento, comumente denominado *hotend*. Ao alcançar o patamar térmico definido via fatiador, o material atinge o estado de fluidez necessário para ser expelido pelo bico extrusor, permitindo a construção da geometria plana que fundamenta a estrutura da camada.

O fluxo de trabalho completo do processo compreende quatro etapas encadeadas:

1. **Modelagem**: a peça é projetada em software CAD e exportada em formato de malha triangular (STL ou equivalente);
2. **Fatiamento**: o software fatiador (*slicer*) secciona o modelo em camadas horizontais de espessura definida e gera o percurso do bico para cada camada (contornos externos, preenchimento interno e eventuais estruturas de suporte), codificando-o em instruções G-code que incluem temperaturas, velocidades e vazões;
3. **Impressão**: o firmware da máquina executa o G-code, coordenando os motores de passo dos eixos X, Y e Z, o tracionador do filamento e os controladores de temperatura do *hotend* e da mesa;
4. **Pós-processamento**: remoção de suportes e, quando necessário, acabamento superficial ou tratamentos térmicos.

Do ponto de vista térmico, o filamento, tipicamente de 1,75 mm de diâmetro, é fundido no *hotend* e forçado através do bico (usualmente de 0,4 mm), sofrendo uma redução de seção que eleva a velocidade de saída do material. O filete depositado resfria por convecção e condução para as camadas vizinhas, solidificando em frações de segundo. É nesse breve intervalo, enquanto a interface permanece aquecida, que ocorre a soldagem entre camadas, fenômeno central para as propriedades mecânicas, detalhado no Capítulo 5 (TURNER; STRONG; GOLD, 2014).

A adoção industrial e acadêmica deste processo se justifica pelas seguintes vantagens:

- **Acessibilidade e baixo custo**: a utilização de polímeros padrão tem tornado o maquinário FDM economicamente viável para laboratórios e indústrias, reduzindo custos operacionais;
- **Liberdade geométrica**: permite o desenvolvimento de peças com geometrias difíceis, como preenchimentos internos estruturados e geometrias topologicamente otimizadas;
- **Prototipagem ágil**: encurta o tempo entre a concepção do projeto e a obtenção do protótipo validável fisicamente.

A tecnologia introduz, entretanto, novos desafios, exigindo uma investigação sobre seus parâmetros. O principal desafio associado é a falta de homogeneidade material e a presença de anisotropia mecânica. Devido à natureza construtiva de deposição por camada, as interfaces de soldagem térmica entre fatias de polímero nem sempre se fundem de maneira perfeita. As propriedades mecânicas do produto final, como resistência, tensão limite e módulo de elasticidade, variam de acordo com os parâmetros de impressão pré-definidos (POPESCU et al., 2018). Esse aspecto torna obrigatórios os ensaios físicos, na tentativa de minimizar o impacto negativo da anisotropia e maximizar o desempenho estrutural da peça final.

## 2.4 Limitações do processo

Além da anisotropia, o FDM apresenta limitações geométricas e estruturais que devem ser consideradas no projeto de componentes:

- **Resolução e acabamento**: a espessura de camada (tipicamente 0,1 a 0,5 mm) define um degrau visível nas superfícies inclinadas (*stair-stepping*), inferior ao acabamento de processos como usinagem ou SLA;
- **Balanços e suportes**: regiões em balanço acima de determinado ângulo exigem estruturas de suporte, que consomem material, aumentam o tempo de impressão e deixam marcas na superfície;
- **Vazios internos**: a seção transversal aproximadamente elíptica dos filetes depositados gera cavidades triangulares entre filetes adjacentes, reduzindo a seção efetiva do material e atuando como concentradores de tensão (SUN et al., 2008);
- **Tensões residuais e empenamento**: o resfriamento desigual entre camadas induz contrações diferenciais que podem empenar a peça ou descolá-la da mesa, especialmente em materiais de alta contração térmica;
- **Janela de processo do material**: cada polímero possui faixas estreitas de temperatura e velocidade em que a extrusão é estável; fora delas surgem defeitos como subextrusão, escorrimento e degradação térmica.

Essas limitações reforçam a necessidade de caracterização experimental sistemática e, como propõe este trabalho, de ferramentas preditivas que multipliquem o valor de cada ensaio realizado.

## 2.5 Aplicações

O espectro de aplicações do FDM expandiu-se da prototipagem visual para domínios funcionais: dispositivos de fixação e gabaritos de fabricação (*jigs and fixtures*), componentes de reposição, órteses e próteses personalizadas, dispositivos educacionais, carcaças de equipamentos eletrônicos e peças de uso final em baixas séries (NGO et al., 2018). No contexto acadêmico, impressoras FDM de baixo custo tornaram-se instrumentos de pesquisa por direito próprio, como demonstra este trabalho, em que a impressora, o material e a máquina de ensaios disponíveis no campus sustentaram uma investigação completa de caracterização e modelagem mecânica.

---

# 3 O MATERIAL: ÁCIDO POLILÁTICO (PLA)

## 3.1 Polímeros: conceitos fundamentais

Polímeros são macromoléculas formadas pela repetição de unidades químicas simples, os meros, unidas por ligações covalentes em cadeias longas. As propriedades de um material polimérico decorrem tanto da química do mero quanto da arquitetura das cadeias: sua massa molar, ramificações, e do modo como as cadeias se organizam no estado sólido (CALLISTER, 2008).

Quanto ao comportamento térmico, os polímeros dividem-se em **termoplásticos**, cujas cadeias são unidas por forças intermoleculares secundárias, podendo ser fundidos e ressolidificados repetidas vezes, e **termofixos**, cujas cadeias formam redes tridimensionais reticuladas por ligações covalentes, que não se desfazem por aquecimento sem degradação. A impressão FDM exige, por construção, materiais termoplásticos: o processo consiste precisamente em fundir, depositar e ressolidificar o polímero.

Quanto à organização estrutural, distinguem-se polímeros **amorfos**, cujas cadeias se dispõem aleatoriamente, como um emaranhado congelado, e **semicristalinos**, nos quais parte das cadeias se organiza em regiões ordenadas (lamelas cristalinas) dispersas em uma matriz amorfa. O grau de cristalinidade influencia diretamente as propriedades: as regiões cristalinas conferem rigidez, resistência mecânica e resistência química; as regiões amorfas respondem pela tenacidade e pela deformabilidade (CALLISTER, 2008). Como se verá adiante, o PLA é um polímero semicristalino de cristalização lenta, e o grau de cristalinidade que desenvolve durante a impressão depende do histórico térmico imposto pelo processo, um dos elos causais entre parâmetros de impressão e propriedades mecânicas investigado neste trabalho.

## 3.2 Química e produção do PLA

O Ácido Polilático (PLA) é um poliéster alifático termoplástico obtido a partir de fontes renováveis, como o amido de milho, a mandioca e a cana-de-açúcar. Sua produção parte da fermentação bacteriana de carboidratos, que gera o ácido lático (ácido 2-hidroxipropanoico); este é convertido em lactídeo (o dímero cíclico do ácido lático) e, por polimerização por abertura de anel (*ring-opening polymerization*), dá origem às cadeias poliméricas de alta massa molar (GARLOTTA, 2001; FARAH; ANDERSON; LANGER, 2016). Essa rota de produção contrasta com a dos termoplásticos convencionais de origem petroquímica, o que confere ao PLA papel de destaque nas discussões sobre sustentabilidade na manufatura.

Uma particularidade química relevante é a quiralidade do ácido lático, que existe nas formas enantioméricas L e D. A proporção entre unidades L e D na cadeia determina a capacidade de cristalização do polímero: o PLLA (rico em unidades L, tipicamente acima de 98%) é semicristalino, enquanto copolímeros com maior teor de unidades D tornam-se progressivamente amorfos (GARLOTTA, 2001; LIM; AURAS; RUBINO, 2008). Os filamentos comerciais para impressão 3D são, em geral, PLA predominantemente L, frequentemente aditivados com plastificantes, pigmentos e modificadores de fluxo, razão pela qual filamentos de diferentes fabricantes podem exibir propriedades sensivelmente distintas, e pela qual a caracterização experimental do lote específico utilizado permanece indispensável.

## 3.3 Sustentabilidade e aplicações

Do ponto de vista ambiental, o PLA é biodegradável e compostável em condições industriais controladas de temperatura e umidade, degradando-se por hidrólise das ligações éster seguida de assimilação por microrganismos. Essa característica, aliada à baixa emissão de compostos voláteis tóxicos durante a extrusão, explica sua ampla adoção em ambientes educacionais e laboratoriais de impressão 3D (FARAH; ANDERSON; LANGER, 2016; SANTANA et al., 2018).

Além das aplicações em prototipagem, o PLA é empregado em embalagens descartáveis e filmes para alimentos (AURAS; HARTE; SELKE, 2004), em dispositivos biomédicos reabsorvíveis, como suturas, parafusos ortopédicos e arcabouços (*scaffolds*) para engenharia de tecidos, que aproveitam sua biocompatibilidade e reabsorção pelo organismo, e em produtos de consumo de ciclo de vida curto. Na impressão 3D, é o material de entrada por excelência: exige temperaturas de extrusão relativamente baixas (tipicamente entre 190 °C e 220 °C), apresenta baixa contração térmica durante o resfriamento, o que reduz o empenamento das peças, e dispensa mesa aquecida em muitas configurações (SANTANA et al., 2018).

## 3.4 Limitações Mecânicas Naturais

Apesar das vantagens de processamento, o PLA apresenta limitações mecânicas inerentes que restringem seu uso em aplicações estruturais de alta solicitação. Trata-se de um polímero de comportamento predominantemente frágil à temperatura ambiente: sua deformação na ruptura é baixa quando comparada à de outros termoplásticos de engenharia, como o ABS e o PETG, e sua resistência ao impacto é reduzida, com pouca capacidade de absorver energia antes da fratura (FARAH; ANDERSON; LANGER, 2016; SANTANA et al., 2018). A razão molecular dessa fragilidade está na temperatura de transição vítrea relativamente alta do material: à temperatura ambiente, cerca de 35 °C abaixo da Tg, os segmentos de cadeia da fase amorfa têm mobilidade muito restrita, limitando os mecanismos de deformação plástica que, em polímeros dúcteis, dissipam energia antes da ruptura.

Outra limitação relevante é a suscetibilidade à deformação térmica. Como sua temperatura de transição vítrea situa-se pouco acima da temperatura ambiente (Seção 3.5), peças de PLA expostas a ambientes moderadamente aquecidos, como o interior de um veículo sob sol, podem amolecer e perder estabilidade dimensional. Somam-se a isso a degradação hidrolítica em ambientes úmidos (a mesma reação que fundamenta sua biodegradabilidade atua, lentamente, durante a vida útil) e o envelhecimento físico do polímero, que fragiliza o material ao longo do tempo.

No contexto da impressão 3D, essas limitações intrínsecas são agravadas pelas descontinuidades introduzidas pelo próprio processo de deposição por camadas: vazios internos, interfaces incompletamente soldadas e orientação preferencial dos filamentos reduzem a resistência efetiva da peça em relação ao material maciço equivalente, como será discutido no Capítulo 5.

## 3.5 Propriedades Térmicas

O comportamento térmico do PLA é determinante tanto para o processo de impressão quanto para o desempenho mecânico final da peça. Como polímero semicristalino, o PLA apresenta três temperaturas características principais: a temperatura de transição vítrea (Tg), em torno de 55 °C a 60 °C; a temperatura de cristalização a frio (Tc), tipicamente entre 100 °C e 120 °C; e a temperatura de fusão cristalina (Tm), na faixa de 150 °C a 180 °C (GARLOTTA, 2001; FARAH; ANDERSON; LANGER, 2016; SANTANA et al., 2018).

A transição vítrea marca a passagem do estado vítreo, no qual as cadeias poliméricas da fase amorfa encontram-se essencialmente imobilizadas e o material se comporta de forma rígida e frágil, para o estado borrachoso, no qual segmentos de cadeia adquirem mobilidade suficiente para escoar sob tensão. A importância física dessa temperatura é dupla. Do ponto de vista da aplicação, ela define o limite superior de uso estrutural do PLA: acima da Tg, o módulo de elasticidade cai drasticamente e a peça perde capacidade de sustentar carga. Do ponto de vista do processamento, a Tg governa a maleabilidade do material durante e após a extrusão: entre a Tg e a Tm, o polímero encontra-se em estado viscoelástico, no qual ocorrem a coalescência entre filamentos adjacentes e a cristalização a frio, mecanismos que definem a qualidade da adesão intercamadas.

A cristalização a frio merece destaque no contexto da impressão 3D. O PLA cristaliza lentamente; no resfriamento rápido típico do FDM, o material solidifica antes de desenvolver cristalinidade apreciável, resultando em peças predominantemente amorfas. Se, porém, o histórico térmico mantiver o material por mais tempo na janela entre Tc e Tm, por exemplo com temperaturas de extrusão mais altas, que retardam o resfriamento, há mais oportunidade para o crescimento de cristalitos, com ganho de rigidez (LIM; AURAS; RUBINO, 2008). Esse mecanismo fornece uma explicação física para a correlação entre temperatura de extrusão e módulo de elasticidade observada nos resultados deste trabalho (Capítulo 8).

Durante a impressão, o filamento é aquecido no *hotend* a temperaturas bem superiores à Tm (190 °C a 220 °C neste trabalho), atingindo o estado de fluidez necessário à extrusão. Ao ser depositado, o material resfria rapidamente, atravessando a janela de cristalização e, por fim, a Tg, quando a geometria se estabiliza. A velocidade com que esse resfriamento ocorre, influenciada pela temperatura de extrusão, pela velocidade de impressão e pelas condições do ambiente, determina o grau de cristalinidade alcançado e o tempo disponível para a difusão molecular entre camadas, com impacto direto nas propriedades mecânicas.

## 3.6 Propriedades de referência do PLA

A literatura reporta, para o PLA maciço (injetado ou extrudado), valores típicos de módulo de elasticidade entre 2,7 e 3,5 GPa (medidos com extensometria direta), resistência à tração entre 50 e 70 MPa e deformação na ruptura entre 2% e 6% (GARLOTTA, 2001; FARAH; ANDERSON; LANGER, 2016). Para peças impressas por FDM, Tymrak, Kreiger e Pearce (2014) reportam resistências médias de 28,5 a 56,6 MPa e módulos de 3,3 GPa, conforme a orientação e os parâmetros; Chacón et al. (2017) e Lanzotti et al. (2015) documentam faixas semelhantes, sempre com forte dependência da configuração de impressão. Esses intervalos servem de referência externa para os resultados experimentais apresentados no Capítulo 8, com a ressalva metodológica, lá detalhada, de que módulos medidos a partir do deslocamento do travessão da máquina (sem extensômetro) são sistematicamente inferiores aos medidos por extensometria direta, por incluírem a flexibilidade do sistema de fixação.

---

# 4 COMPORTAMENTO MECÂNICO E CARACTERIZAÇÃO DE MATERIAIS

## 4.1 Tensão e deformação

Quando um corpo sólido é submetido a forças externas, seu interior desenvolve esforços que se distribuem pela geometria. Para caracterizar o material, independentemente das dimensões da peça, a mecânica dos materiais normaliza força e alongamento em duas grandezas fundamentais (HIBBELER, 2010; CALLISTER, 2008).

A **tensão de engenharia** σ é definida como a força F aplicada dividida pela área da seção transversal inicial A₀:

$$\sigma = \frac{F}{A_0}$$

expressa em pascal (Pa) ou, mais usualmente em engenharia de materiais, em megapascal (MPa = N/mm²). A **deformação de engenharia** ε é a variação de comprimento ΔL relativa ao comprimento útil inicial L₀:

$$\varepsilon = \frac{\Delta L}{L_0} = \frac{L - L_0}{L_0}$$

grandeza adimensional, frequentemente expressa em percentual ou em mm/mm.

Essas definições utilizam a geometria inicial do corpo. Em deformações elevadas, torna-se relevante a distinção entre as grandezas de engenharia e as **verdadeiras**, isto é, a tensão verdadeira σᵥ = F/A (área instantânea) e a deformação verdadeira εᵥ = ln(1 + ε), que consideram a redução de seção durante o ensaio (DIETER, 1989). Para o PLA impresso, que rompe com deformações da ordem de 8%, a diferença entre as duas descrições é pequena, e este trabalho adota, como é praxe na caracterização de polímeros pela ASTM D638, as grandezas de engenharia.

Vale registrar que tensão e deformação são, em rigor, grandezas tensoriais: em cada ponto do sólido há componentes normais e cisalhantes em três direções. O ensaio de tração uniaxial é projetado justamente para produzir, na região útil do corpo de prova, um estado de tensão praticamente uniaxial e uniforme, no qual a descrição escalar acima é suficiente e o comportamento intrínseco do material pode ser isolado da geometria (HIBBELER, 2010).

## 4.2 Elasticidade e a Lei de Hooke

Para pequenas deformações, a maioria dos materiais estruturais exibe resposta linear e reversível: removida a carga, o corpo retorna às dimensões originais. Esse regime é descrito pela **Lei de Hooke**:

$$\sigma = E\,\varepsilon$$

em que a constante de proporcionalidade E, o **módulo de elasticidade** ou módulo de Young, mede a rigidez do material: quanto maior E, menor a deformação para uma mesma tensão. Geometricamente, E é a inclinação do trecho linear inicial da curva tensão-deformação. Completam a descrição elástica o coeficiente de Poisson ν, razão entre a contração lateral e o alongamento axial, e os módulos derivados (cisalhamento e volumétrico), não abordados neste trabalho por não serem capturados pelo ensaio uniaxial simples.

No nível molecular, a elasticidade dos polímeros vítreos como o PLA à temperatura ambiente provém do estiramento reversível de ligações e ângulos das cadeias e das interações intermoleculares, mecanismo distinto da elasticidade entrópica das borrachas e que explica módulos da ordem de gigapascals no estado vítreo (CALLISTER, 2008).

## 4.3 Plasticidade, escoamento e encruamento

Ultrapassado certo nível de tensão, a deformação deixa de ser reversível: o material **escoa**, acumulando deformação permanente (plástica). Em metais dúcteis o início do escoamento é frequentemente visível como um patamar na curva; em polímeros, a transição é gradual e não há ponto de escoamento nítido. Para esses casos convenciona-se o **limite de escoamento por deslocamento** (*offset yield*): traça-se uma reta paralela ao trecho elástico, deslocada de uma deformação convencional, usualmente 0,2% (0,002 mm/mm), e define-se o escoamento como a tensão na interseção dessa reta com a curva experimental (DIETER, 1989; SOUZA, 1982). Essa convenção é o elo direto com o modelo de Ramberg-Osgood adotado neste trabalho, cuja tensão de referência σ₀ corresponde, por construção, à tensão que produz 0,2% de deformação plástica (Capítulo 6).

Após o escoamento, a tensão continua a crescer com a deformação, fenômeno denominado **encruamento** (*strain hardening*), até atingir o **limite de resistência à tração** (tensão máxima), a partir do qual a deformação se localiza (estricção, em materiais dúcteis) e sobrevém a **ruptura**. Em polímeros semicristalinos abaixo da Tg, como o PLA à temperatura ambiente, o encruamento reflete o alinhamento progressivo das cadeias na direção do carregamento, e a ruptura tende a ocorrer pouco depois da tensão máxima, com comportamento frágil.

## 4.4 Viscoelasticidade dos polímeros

Diferentemente de metais e cerâmicas, a resposta mecânica dos polímeros depende do tempo. Trata-se do comportamento **viscoelástico**: o material combina uma componente elástica (resposta instantânea, tipo mola) e uma componente viscosa (resposta dependente do tempo, tipo amortecedor). Manifestações práticas incluem a **fluência** (deformação crescente sob carga constante), a **relaxação de tensões** (queda da tensão sob deformação constante) e a sensibilidade da curva tensão-deformação à **taxa de carregamento**: ensaios mais rápidos produzem curvas mais rígidas e resistentes; ensaios mais lentos, curvas mais complacentes (DOWLING, 2012; CALLISTER, 2008).

A temperatura interage fortemente com esse comportamento: aproximando-se da Tg, os tempos de relaxação molecular caem e o material torna-se visivelmente mais dúctil e menos rígido. Por isso, a caracterização de polímeros exige controle rigoroso da velocidade de ensaio e das condições ambientais, e os resultados devem sempre ser reportados junto dessas condições. Neste trabalho, todos os ensaios foram conduzidos à mesma velocidade de deslocamento (5 mm/min) e à temperatura ambiente de laboratório, de modo que as comparações entre condições de impressão não são contaminadas por efeitos de taxa ou térmicos.

Essa natureza molecular confere ainda uma consequência de microestrutura: a resposta do material é ditada pelo estiramento e desemaranhamento das cadeias da fase amorfa, pelo escorregamento entre lamelas cristalinas e, em estágios avançados, pela formação de microfibrilas orientadas na direção do carregamento (CALLISTER, 2008; DOWLING, 2012). Em peças impressas em 3D, somam-se a esses mecanismos intrínsecos os mecanismos estruturais do processo: descolamento de interfaces entre filetes, crescimento de vazios e delaminação de camadas, o que torna o comportamento efetivo da peça uma combinação de material e arquitetura de deposição.

## 4.5 Ensaios Destrutivos e Normatização

O ensaio de tração é o método mais difundido de caracterização mecânica de materiais. Nele, um corpo de prova de geometria padronizada é fixado entre garras de uma máquina universal de ensaios e submetido a um alongamento uniaxial crescente, a velocidade constante, enquanto a célula de carga e o sistema de medição de deslocamento registram continuamente a força aplicada e o alongamento resultante, até a ruptura do material (SOUZA, 1982; DIETER, 1989). A partir desse registro obtêm-se as propriedades fundamentais de projeto: módulo de elasticidade, limite de escoamento, resistência à tração, ductilidade, resiliência e tenacidade.

A finalidade do ensaio é preditiva: conhecidas as propriedades do material, o engenheiro pode dimensionar componentes para que operem com segurança dentro do regime elástico, ou prever a energia absorvida em eventos de sobrecarga. Para que os resultados sejam comparáveis entre laboratórios e reprodutíveis ao longo do tempo, os ensaios são regidos por normas técnicas que padronizam a geometria dos corpos de prova, as velocidades de ensaio, as condições ambientais e o tratamento estatístico dos dados.

### 4.5.1 A norma ASTM D638

Para materiais plásticos, a referência internacional é a norma ASTM D638, *Standard Test Method for Tensile Properties of Plastics* (ASTM INTERNATIONAL, 2018), adotada neste trabalho, com correspondência na ISO 527. A norma define corpos de prova em formato de "gravata" (*dogbone*), com seção central reduzida que concentra a deformação em uma região de área conhecida e extremidades alargadas para fixação nas garras. O Tipo I, utilizado neste trabalho, possui seção útil nominal de 13 mm de largura por 3,2 mm de espessura e comprimento útil de referência (*gauge length*) de 50 mm. A norma prescreve ainda: número mínimo de corpos de prova por condição (cinco, quando não há indicação contrária), velocidades de ensaio padronizadas conforme a classe do material, condicionamento prévio das amostras e medição individual das dimensões de cada corpo de prova para o cálculo de tensões, prescrição relevante neste trabalho, em que as áreas medidas variaram até 10% em torno do valor nominal.

### 4.5.2 Correção da região de acomodação (toe compensation)

Um aspecto normativo frequentemente negligenciado, e determinante para a qualidade da análise deste trabalho, é a correção da **região de acomodação** (*toe region*). No início do ensaio, folgas do sistema de fixação, alinhamento do corpo de prova e acomodação das garras produzem um trecho inicial de baixa inclinação na curva força-deslocamento que **não representa propriedade do material**. A ASTM D638 (Anexo A1) determina que esse artefato seja compensado: prolonga-se a região linear da curva até o eixo das deformações, e o ponto de interseção passa a ser o zero corrigido de deformação, com todo o eixo transladado de acordo.

A não aplicação dessa correção distorce todas as propriedades que dependem do eixo de deformação: o módulo aparece subestimado, a deformação na ruptura superestimada, e o ajuste de modelos constitutivos é sistematicamente contaminado. Como será mostrado no Capítulo 8, a aplicação rigorosa da *toe compensation* neste trabalho foi decisiva para a consistência entre os resultados da plataforma e os relatórios da máquina de ensaios.

### 4.5.3 Medição de deformação: travessão versus extensômetro

Há duas formas usuais de medir a deformação no ensaio de tração: pelo **deslocamento do travessão** da máquina (assumindo que todo o deslocamento se converte em alongamento do corpo de prova) ou por **extensômetro** acoplado diretamente à região útil. A medição por travessão inclui, além do alongamento da região útil, a flexibilidade das garras, das extremidades alargadas do corpo de prova e da própria estrutura da máquina, o que subestima sistematicamente o módulo de elasticidade, ainda que praticamente não afete a tensão máxima (medida pela célula de carga) nem as comparações relativas entre condições ensaiadas no mesmo arranjo. Os ensaios deste trabalho foram realizados sem extensômetro, e os módulos reportados são, portanto, **módulos aparentes**: consistentes entre si e adequados à comparação entre condições de impressão, mas não diretamente comparáveis aos módulos de extensometria da literatura (Seção 8.3.1).

Cabe destacar, por fim, que a aplicação de normas concebidas para materiais homogêneos a peças impressas em 3D constitui uma adaptação: a anisotropia do processo FDM exige que a orientação de impressão dos corpos de prova seja documentada e mantida constante, como feito neste estudo.

## 4.6 As Curvas de Tensão-Deformação e propriedades derivadas

O gráfico de σ em função de ε, a curva tensão-deformação, sintetiza o comportamento mecânico do material. Nela distinguem-se as regiões elástica e plástica descritas nas Seções 4.2 e 4.3, e dela extraem-se as propriedades quantitativas de projeto:

- **Módulo de elasticidade (E)**: inclinação do trecho linear inicial, medida de rigidez;
- **Limite de escoamento (σy)**: tensão de início da plastificação, pelo critério do *offset* de 0,2%;
- **Limite de resistência à tração (σmax)**: máxima tensão suportada;
- **Deformação na ruptura (εrup)**: medida de ductilidade, expressa em percentual;
- **Resiliência (Ur)**: energia por unidade de volume absorvida elasticamente até o escoamento, correspondente à área sob a curva até σy, que no regime linear vale Ur = σy²/2E;
- **Tenacidade (Ut)**: energia total absorvida até a ruptura, correspondente à área sob a curva completa, expressa em MJ/m³, obtida por integração numérica da curva experimental.

Nos polímeros como o PLA, a transição entre as regiões elástica e plástica ocorre de forma gradual, sem um ponto de escoamento bem definido. Essa suavidade da transição é precisamente o que motiva o uso de modelos constitutivos contínuos e não lineares, como o de Ramberg-Osgood, apresentado no Capítulo 6, capazes de representar toda a curva com um único conjunto de parâmetros.

## 4.7 Fratura frágil e dúctil

A ruptura de um material pode ocorrer por dois modos limites. Na **fratura dúctil**, precedida de extensa deformação plástica e estricção, a superfície de fratura é fibrosa e inclinada, e o processo absorve energia considerável. Na **fratura frágil**, a trinca propaga-se rapidamente com pouca deformação plástica, superfície de fratura plana e baixo consumo de energia (CALLISTER, 2008). O PLA impresso à temperatura ambiente aproxima-se do segundo modo: as curvas experimentais deste trabalho mostram queda abrupta da tensão imediatamente após o pico, sem estricção apreciável, comportamento típico e coerente com a posição do material em relação à sua Tg. Em peças FDM, a fratura é adicionalmente influenciada pelas interfaces de deposição, que oferecem caminhos preferenciais de propagação de trinca quando a solda entre filetes é imperfeita (ES-SAID et al., 2000).

---

# 5 INFLUÊNCIA DOS PARÂMETROS DE IMPRESSÃO NA ESTRUTURA

## 5.1 Anisotropia no Processo FDM

Peças fabricadas por FDM não se comportam como peças injetadas do mesmo material. Enquanto a injeção produz um sólido essencialmente contínuo e isotrópico, a deposição por camadas gera uma estrutura compósita de filamentos soldados termicamente, cujas interfaces constituem regiões de menor resistência. O resultado é a anisotropia mecânica: as propriedades medidas dependem da direção do carregamento em relação à orientação de deposição (ES-SAID et al., 2000; AHN et al., 2002).

Es-Said et al. (2000) demonstraram que a orientação das camadas é o fator dominante na resistência final de peças prototipadas: corpos de prova carregados na direção longitudinal aos filamentos apresentam resistência substancialmente superior à de corpos carregados transversalmente, nos quais a falha ocorre por delaminação das interfaces. Ahn et al. (2002), trabalhando com ABS, quantificaram o fenômeno: a resistência transversal às camadas pode cair a menos da metade da resistência longitudinal, e propuseram tratar a peça FDM como um material ortotrópico, à maneira dos compósitos laminados. Tymrak, Kreiger e Pearce (2014), ensaiando componentes fabricados em impressoras de código aberto sob condições realistas, confirmaram que peças FDM bem impressas podem atingir propriedades próximas às do material injetado (reportando, para PLA, resistências médias de 28,5 a 56,6 MPa e módulo médio de 3,3 GPa), mas com dispersão significativamente maior, refletindo a sensibilidade do processo aos seus parâmetros. A revisão de Popescu et al. (2018) sistematiza essa dependência, apontando temperatura de extrusão, velocidade, espessura de camada, orientação de deposição e densidade de preenchimento como os parâmetros de maior influência sobre as propriedades finais.

## 5.2 A formação da ligação entre filamentos

A compreensão física da anisotropia passa pelo mecanismo de formação da ligação entre filetes adjacentes e entre camadas sucessivas. Sun et al. (2008) e Bellehumeur et al. (2004) descrevem o processo em três estágios: (i) **contato e molhamento**, quando o filete recém-extrudado toca a superfície do filete vizinho, ainda sólido porém aquecido; (ii) **coalescência (sinterização viscosa)**, em que, sob tensão superficial, forma-se e cresce um "pescoço" (*neck*) entre as duas seções aproximadamente cilíndricas, aumentando a área de contato; (iii) **difusão molecular**, na qual cadeias poliméricas atravessam a interface por reptação, reconstituindo o emaranhamento que confere resistência ao material contínuo.

O terceiro estágio apoia-se na teoria da reptação de De Gennes (1971) e na teoria de cicatrização de trincas de Wool e O'Connor (1981): a resistência da interface cresce com o tempo de contato acima da temperatura crítica, aproximando-se assintoticamente da resistência do material virgem quando a interdifusão se completa. A variável de controle é o **histórico térmico da interface**: quanto mais tempo a junção permanece acima da Tg (e, idealmente, próxima da faixa de fusão), mais completos são a coalescência e o emaranhamento. Como o filete deposita-se em frações de segundo e resfria rapidamente, a janela de soldagem é estreita, e os parâmetros de processo que a alargam (temperatura de extrusão mais alta, ambiente mais quente) ou estreitam (deposição mais lenta sobre camadas já frias) têm efeito direto na resistência final (SUN et al., 2008; TURNER; STRONG; GOLD, 2014).

Além da qualidade da solda, a geometria da deposição introduz **vazios estruturais**: a seção do filete depositado é aproximadamente elíptica, e o empacotamento de elipses deixa cavidades triangulares periódicas entre filetes. Esses vazios reduzem a seção resistente efetiva e concentram tensões, nucleando as trincas que levam à ruptura (SUN et al., 2008). A fração de vazios depende da sobreposição programada entre filetes, da espessura de camada e da fluidez do material no momento da deposição.

## 5.3 O Papel da Temperatura de Extrusão

A temperatura de extrusão governa a qualidade da soldagem entre camadas por meio de dois mecanismos térmicos: a viscosidade do material no momento da deposição e o tempo durante o qual a interface permanece acima da temperatura de transição vítrea, permitindo a difusão molecular entre filamentos adjacentes. Quando o novo filamento é depositado sobre a camada anterior, as cadeias poliméricas de ambos os lados da interface precisam se interpenetrar para reconstituir a continuidade do material; esse processo de "cicatrização" é fortemente dependente da temperatura e do tempo (GIBSON; ROSEN; STUCKER, 2015; POPESCU et al., 2018).

Operar com temperaturas no limite inferior da janela de processamento do PLA, como 190 °C, resulta em fusão incompleta: o material chega ao bico com viscosidade elevada, molha mal a camada anterior e resfria antes que a difusão molecular se complete. As consequências são interfaces frágeis, maior incidência de vazios e comportamento mecânico degradado, com menor tensão limite de resistência e maior dispersão entre amostras.

Em contrapartida, temperaturas acima de 200 °C, como 210 °C e 220 °C, levam o polímero a um estado de fluidez plena, análogo ao de uma "gota de vidro" fundido: a viscosidade reduzida permite que o filamento recém-depositado se acomode e molhe integralmente a superfície anterior, maximizando a área de contato. O maior aporte térmico também retarda o resfriamento da interface, ampliando a janela de difusão molecular e favorecendo a cristalização do polímero durante a solidificação. O resultado esperado é a união eficiente entre camadas, com aumento da rigidez e da consistência do material, tendência confirmada pelos dados experimentais deste estudo, nos quais o módulo de elasticidade aparente cresceu monotonicamente com a temperatura de extrusão (Capítulo 8), em consonância com Ouhsti, Haddadi e Belhouideg (2018).

Há, naturalmente, um limite superior: temperaturas excessivas degradam termicamente o polímero (cisão de cadeias, com perda de massa molar e de propriedades), causam escorrimento descontrolado (*oozing*) e defeitos dimensionais. A janela de 190 °C a 220 °C investigada neste trabalho cobre a faixa recomendada pela maioria dos fabricantes de filamento PLA.

## 5.4 O Papel da Velocidade de Impressão

A velocidade de impressão atua em interação com a temperatura por três vias:

1. **Tempo de residência no hotend**: velocidades maiores exigem maior vazão de material, reduzindo o tempo disponível para o filamento absorver calor; em impressoras de potência térmica limitada, isso pode reduzir a temperatura real do material extrudado em relação ao valor programado (subaquecimento dinâmico);
2. **Intervalo entre camadas**: velocidades maiores completam cada camada em menos tempo, de modo que a camada anterior está mais quente quando recebe a seguinte, o que favorece a soldagem térmica;
3. **Tempo de resfriamento total**: percursos mais rápidos alteram o histórico térmico global da peça, com efeito sobre cristalização e tensões residuais.

O efeito líquido depende do balanço entre esses mecanismos para cada geometria e máquina. Para corpos de prova pequenos como os deste trabalho, em que cada camada é concluída em poucos segundos, o segundo mecanismo tende a dominar: velocidades maiores mantêm as interfaces mais aquecidas e melhoram a adesão. Essa expectativa foi confirmada experimentalmente: a velocidade de 100 mm/s produziu, de forma estatisticamente significativa, as maiores tensões máximas do estudo (Capítulo 8). Registre-se que a literatura reporta, para geometrias maiores e velocidades mais baixas, tanto efeitos positivos quanto negativos da velocidade (POPESCU et al., 2018; CHACÓN et al., 2017), o que reforça que a otimização de parâmetros é específica do conjunto máquina-material-geometria e justifica ferramentas preditivas calibradas com dados próprios.

## 5.5 Demais parâmetros

Outros parâmetros do fatiamento influenciam as propriedades finais e foram mantidos constantes neste trabalho para isolar o efeito das variáveis de estudo:

- **Espessura de camada**: camadas mais finas aumentam o número de interfaces (mais soldas), mas melhoram o acabamento e o preenchimento; camadas mais espessas depositam mais massa térmica por passe. Fixada em 0,5 mm neste estudo;
- **Densidade e padrão de preenchimento (infill)**: define a fração sólida do interior da peça e a distribuição da seção resistente; peças de ensaio devem ser impressas com preenchimento consistente para comparabilidade;
- **Orientação de deposição (raster)**: ângulo dos filetes em relação ao eixo de carregamento; corpos de prova foram impressos sempre na mesma orientação, planos sobre a mesa;
- **Temperatura da mesa e do ambiente**: afetam o resfriamento das primeiras camadas e o gradiente térmico global.

## 5.6 Síntese: dos parâmetros à propriedade

O quadro teórico deste capítulo estabelece a cadeia causal que fundamenta o restante do trabalho: **parâmetros de processo → histórico térmico da deposição → microestrutura (qualidade de solda, vazios, cristalinidade) → propriedades mecânicas macroscópicas**. Cada elo dessa cadeia é físico e mensurável, mas a modelagem completa de todos os elos (térmica transiente, sinterização viscosa, difusão molecular, mecânica de defeitos) é impraticável para uso corrente de engenharia. A alternativa pragmática adotada neste trabalho é fenomenológica: medir diretamente o efeito agregado (as curvas tensão-deformação), condensá-lo em um modelo constitutivo compacto e interpolar seus parâmetros sobre o espaço de processo. É o que fundamenta o próximo capítulo.

---

# 6 PREVISÃO COMPUTACIONAL E MODELAGEM MECÂNICA

## 6.1 A Importância da Previsão na Engenharia

O desenvolvimento de produtos em engenharia é, em essência, um processo iterativo de proposição e verificação. Quando cada verificação exige a fabricação e a destruição de corpos de prova físicos, o custo e o tempo do ciclo crescem rapidamente: no caso da impressão 3D, cada nova combinação de parâmetros de processo demandaria um novo lote de amostras, horas de impressão e ocupação de máquina de ensaios. A simulação do comportamento mecânico dos materiais responde a essa limitação, deslocando parte da experimentação do laboratório para o computador (DOWLING, 2012).

A previsão computacional não elimina o ensaio físico, que permanece como fonte primária de verdade e instrumento de validação, mas multiplica o valor de cada ensaio realizado: um conjunto finito de experimentos bem planejados passa a sustentar a exploração contínua de todo o espaço de projeto. É esse o princípio adotado neste trabalho: os corpos de prova ensaiados constituem a base experimental sobre a qual o sistema preditivo interpola o comportamento do material para qualquer combinação de temperatura e velocidade dentro do domínio estudado.

## 6.2 Modelos constitutivos para a curva tensão-deformação

Um **modelo constitutivo** é uma relação matemática entre tensão e deformação que condensa o comportamento do material em poucos parâmetros. Para a curva de tração monotônica, os modelos clássicos incluem (DIETER, 1989; DOWLING, 2012):

- **Lei de Hooke** (σ = Eε): apenas o regime linear elástico; um parâmetro;
- **Hollomon** (σ = K·εₚⁿ′): lei de potência para o regime plástico, com coeficiente de resistência K e expoente de encruamento n′ (HOLLOMON, 1945); requer emenda com o trecho elástico;
- **Ludwik** (σ = σy + K·εₚⁿ′): acrescenta tensão inicial de escoamento à lei de potência;
- **Ramberg-Osgood**: soma explícita das parcelas elástica e plástica da deformação em uma única expressão contínua, sem emendas, detalhado a seguir.

Para materiais com transição elasto-plástica gradual e sem patamar de escoamento, caso de polímeros como o PLA, ligas de alumínio e aços inoxidáveis, o modelo de Ramberg-Osgood oferece a melhor relação entre fidelidade e parcimônia: três parâmetros, todos com interpretação física, descrevem a curva completa do início do carregamento até a vizinhança da tensão máxima. Foi essa a razão de sua escolha como núcleo do sistema preditivo deste trabalho.

## 6.3 O Modelo Constitutivo de Ramberg-Osgood

### 6.3.1 Origem e formulação

O modelo de Ramberg-Osgood é uma equação constitutiva proposta por Walter Ramberg e William R. Osgood em 1943, no relatório técnico n. 902 do NACA (*National Advisory Committee for Aeronautics*, precursor da NASA), no contexto da caracterização de ligas de alumínio para a indústria aeronáutica norte-americana (RAMBERG; OSGOOD, 1943). Sua motivação original permanece atual: descrever, com apenas três parâmetros, curvas de tensão-deformação de materiais que não apresentam ponto de escoamento nítido, exibindo transição gradual entre os regimes elástico e plástico, exatamente o comportamento observado em polímeros como o PLA.

Na formulação adotada neste trabalho, a deformação total ε é expressa como a soma de uma parcela elástica e uma parcela plástica:

$$\varepsilon = \frac{\sigma}{E} + 0{,}002\left(\frac{\sigma}{\sigma_0}\right)^n$$

em que:

- **ε** é a deformação total (mm/mm);
- **σ** é a tensão aplicada (MPa);
- **E** é o módulo de elasticidade (MPa), inclinação inicial da curva;
- **σ₀** é a tensão de referência (MPa), associada ao limite de escoamento convencional;
- **n** é o expoente de encruamento (adimensional), que controla a forma da transição elasto-plástica.

O primeiro termo (σ/E) representa a contribuição elástica, seguindo a Lei de Hooke. O segundo termo representa a contribuição plástica, construído de modo que, quando σ = σ₀, a deformação plástica vale exatamente 0,002 (0,2%); ou seja, σ₀ coincide com o limite de escoamento definido pelo critério do *offset* convencional apresentado na Seção 4.3.

### 6.3.2 Interpretação física

O comportamento do modelo pode ser resumido em três regimes:

- **σ ≪ σ₀**: o termo plástico é desprezível e o comportamento é essencialmente linear elástico (σ ≈ Eε);
- **σ ≈ σ₀**: ambos os termos contribuem significativamente, representando a transição gradual entre os regimes;
- **σ > σ₀**: o termo plástico domina, e pequenos incrementos de tensão produzem grandes incrementos de deformação.

O expoente n regula a "suavidade" dessa transição: valores baixos de n produzem transições longas e graduais, com encruamento pronunciado, em que a curva continua subindo perceptivelmente após o escoamento; valores elevados aproximam o modelo do comportamento elástico-perfeitamente plástico, com um "joelho" abrupto na curva e patamar quase horizontal. Essa flexibilidade torna o modelo particularmente adequado ao PLA impresso, cujo formato de curva varia com as condições de processamento; os ajustes deste trabalho encontraram valores de n entre 1,3 e 2,8, caracterizando transições bastante graduais (Capítulo 8).

Duas observações completam a caracterização do modelo. Primeira: o modelo é monotônico e não representa o amolecimento pós-pico (queda de tensão após a tensão máxima); por isso, o ajuste deve restringir-se ao trecho ascendente da curva, do início do carregamento até a tensão máxima. Segunda: o modelo pressupõe carregamento monotônico quase-estático; descargas, ciclos e efeitos de taxa exigem extensões que fogem ao escopo deste trabalho.

### 6.3.3 Inversão numérica: o método de Newton-Raphson

Uma característica prática relevante da equação é que ela expressa ε em função de σ, e não o contrário. Para gerar curvas tensão-deformação, em que se varre a deformação e se calcula a tensão correspondente, é necessário inverter a relação numericamente. Neste trabalho, a inversão é feita pelo método de Newton-Raphson: dada uma deformação alvo ε*, busca-se a raiz da função

$$f(\sigma) = \frac{\sigma}{E} + 0{,}002\left(\frac{\sigma}{\sigma_0}\right)^n - \varepsilon^*$$

cuja derivada analítica,

$$f'(\sigma) = \frac{1}{E} + \frac{0{,}002\,n}{\sigma_0}\left(\frac{\sigma}{\sigma_0}\right)^{n-1}$$

está disponível em forma fechada. A iteração

$$\sigma^{(k+1)} = \sigma^{(k)} - \frac{f(\sigma^{(k)})}{f'(\sigma^{(k)})}$$

parte da estimativa inicial elástica σ⁽⁰⁾ = E·ε* e converge quadraticamente (PRESS et al., 2007): como f é estritamente crescente e convexa em σ > 0, a convergência é garantida e tipicamente ocorre em menos de dez iterações para tolerância de 10⁻⁶. Essa eficiência permite gerar curvas completas com centenas de pontos em tempo imperceptível para o usuário, viabilizando a interatividade da plataforma.

### 6.3.4 Propriedades derivadas em forma fechada

Uma vantagem adicional do modelo é fornecer expressões analíticas para as propriedades energéticas. A energia absorvida por unidade de volume até um nível de tensão σ_lim é a integral ∫σ dε; substituindo dε pela diferencial da equação constitutiva, obtém-se:

$$U(\sigma_{lim}) = \frac{\sigma_{lim}^2}{2E} + \frac{0{,}002\,n\,\sigma_{lim}^{\,n+1}}{(n+1)\,\sigma_0^{\,n}}$$

O primeiro termo é a energia elástica; o segundo, a plástica. Avaliada em σ₀, a expressão fornece a **resiliência**; avaliada na tensão máxima, a **tenacidade** (em MJ/m³, já que MPa ≡ MJ/m³). A disponibilidade de formas fechadas elimina integração numérica na cadeia de predição e garante consistência entre os módulos da plataforma.

## 6.4 Identificação de parâmetros a partir de dados experimentais

### 6.4.1 O problema de mínimos quadrados

Dado um conjunto de pontos experimentais (εᵢ, σᵢ) provenientes de um ensaio de tração, o ajuste do modelo consiste em encontrar a tripla (E, σ₀, n) que minimiza a discrepância entre a curva teórica e os dados. Como o modelo expressa ε em função de σ, é natural formular o problema no espaço das deformações:

$$\min_{E,\,\sigma_0,\,n} \; S(E, \sigma_0, n) = \sum_{i=1}^{N}\left[\varepsilon_{RO}(\sigma_i;\,E,\sigma_0,n) - \varepsilon_i\right]^2$$

em que ε_RO é a deformação prevista pelo modelo para a tensão medida σᵢ. Trata-se de um problema de **mínimos quadrados não lineares**: a função objetivo não é quadrática nos parâmetros (que aparecem em denominadores e expoentes), podendo exibir vales alongados e mínimos locais. A qualidade do ajuste é quantificada pela raiz do erro quadrático médio,

$$RMSE = \sqrt{\frac{S}{N}}$$

e pelo coeficiente de determinação,

$$R^2 = 1 - \frac{S}{\sum_i (\varepsilon_i - \bar{\varepsilon})^2}$$

que mede a fração da variância dos dados explicada pelo modelo.

### 6.4.2 Métodos de otimização

A solução clássica para mínimos quadrados não lineares é o algoritmo de **Levenberg-Marquardt** (MARQUARDT, 1963), que interpola entre o método de Gauss-Newton (rápido perto da solução) e o gradiente descendente (robusto longe dela). Foi essa a abordagem da primeira versão do sistema, por meio da rotina `curve_fit` da biblioteca SciPy, em Python.

Na versão atual da plataforma, o ajuste foi reimplementado como uma **busca estocástica com múltiplos reinícios** (*multi-start stochastic hill climbing*), pelos seguintes motivos: independência de bibliotecas numéricas externas (o algoritmo executa em JavaScript, no próprio ambiente da aplicação web), robustez a ruído e a mínimos locais, e simplicidade de manutenção. O algoritmo, detalhado no Apêndice B, opera assim:

1. **Estimativas iniciais fisicamente informadas**: E é estimado pela secante da região de pequenas deformações (ε ≤ 0,002) e σ₀ pela tensão observada na vizinhança de ε = 0,002;
2. **Perturbação iterativa**: a cada iteração, os três parâmetros são multiplicados por fatores aleatórios gaussianos de amplitude decrescente (passo inicial de 25%, decaimento geométrico), e o candidato é aceito apenas se reduzir o erro;
3. **Múltiplos reinícios**: o processo repete-se a partir de pontos de partida aleatórios dentro dos limites físicos, retendo o melhor resultado global;
4. **Restrições de plausibilidade**: os parâmetros são mantidos em faixas físicas para o PLA impresso (E entre 500 e 10.000 MPa; σ₀ entre 5 e 200 MPa; n entre 1 e 30), impedindo soluções numericamente ótimas porém fisicamente absurdas.

Essa abordagem, embora sem as garantias de convergência local dos métodos de gradiente, mostrou-se robusta e suficientemente rápida (executa em milissegundos no navegador), viabilizando a calibração interativa. A qualidade dos ajustes obtidos (R² entre 0,985 e 0,990 em todas as condições, Capítulo 8) confirma a adequação prática do método.

### 6.4.3 Identificabilidade dos parâmetros

Um aspecto metodológico importante, e frequentemente omitido, é a **identificabilidade** dos parâmetros do modelo. Os três parâmetros de Ramberg-Osgood não são independentes na sua ação sobre a curva: aumentos de E podem ser parcialmente compensados por reduções de σ₀ e n (e vice-versa), produzindo curvas quase idênticas com triplas de parâmetros distintas, fenômeno conhecido como equifinalidade. Consequência prática: os parâmetros ajustados devem ser interpretados como uma **parametrização compacta da curva**, e não como medições independentes de propriedades físicas; e a interpolação de parâmetros entre condições (metamodelagem) deve ser validada no espaço das curvas e das propriedades derivadas, não apenas no espaço dos parâmetros. Este trabalho adota exatamente essa postura na validação do Capítulo 8.

## 6.5 Metamodelagem: dos Parâmetros de Processo aos Parâmetros do Material

### 6.5.1 Conceito

O ajuste da Seção 6.4 caracteriza uma condição de impressão já ensaiada. O passo que transforma o sistema em ferramenta preditiva é a **metamodelagem**: a construção de funções que mapeiam diretamente os parâmetros de processo (temperatura T, velocidade v) nos parâmetros constitutivos do material (E, σ₀, n) e na deformação máxima ε_max, eliminando a necessidade de novos ensaios para condições intermediárias.

Um metamodelo, também chamado modelo substituto (*surrogate model*), é um modelo matemático do comportamento de outro modelo ou de um experimento, construído a partir de um número finito de observações (FORRESTER; SÓBESTER; KEANE, 2008). A área dispõe de diversas técnicas (regressão polinomial, funções de base radial, krigagem, redes neurais), cuja escolha depende do número de pontos disponíveis, da suavidade esperada da resposta e da necessidade de estimativas de incerteza. Com nove pontos de treinamento (as nove condições do fatorial 3 × 3), técnicas paramétricas ricas são inviáveis; interpoladores locais e suaves são a escolha natural.

### 6.5.2 Interpolação por funções de base radial (RBF)

A técnica adotada na plataforma é a interpolação por **funções de base radial gaussianas** (BUHMANN, 2003; HARDY, 1971). As coordenadas de processo são primeiro normalizadas para o intervalo [0, 1], eliminando o efeito das diferentes escalas de temperatura (°C) e velocidade (mm/s). Para uma consulta em (T*, v*), cada ponto de treinamento i recebe um peso que decai exponencialmente com sua distância euclidiana dᵢ ao ponto de consulta no espaço normalizado:

$$w_i = \exp\left[-\left(\epsilon\, d_i\right)^2\right]$$

em que o parâmetro de forma ε é calibrado automaticamente como o inverso da distância média entre os pontos de treinamento, heurística que adapta a "largura" das gaussianas à densidade da malha experimental. A predição de cada parâmetro é a média ponderada dos valores observados:

$$\hat{y}(T^*, v^*) = \frac{\sum_i w_i\, y_i}{\sum_i w_i}$$

Trata-se da formulação de médias ponderadas normalizadas (tipo Shepard gaussiano), escolhida em lugar da RBF interpolante exata (que resolve um sistema linear para coeficientes) por sua estabilidade com poucos pontos e por dispensar álgebra linear no cliente web. Duas salvaguardas completam o esquema: quando a consulta coincide exatamente com uma condição ensaiada, o sistema retorna os parâmetros medidos, garantindo fidelidade aos dados; e as predições são limitadas ao intervalo dos valores observados no treinamento, impedindo extrapolações fisicamente implausíveis fora do domínio experimental.

Na primeira versão do sistema, metamodelos por regressão polinomial cumpriram o mesmo papel; a interpolação RBF foi adotada na versão atual por sua maior flexibilidade para capturar comportamentos não monotônicos no espaço de parâmetros, como máximos interiores de resistência, sem impor uma forma funcional global.

### 6.5.3 Validação: validação cruzada leave-one-out

Com apenas nove condições experimentais, separar um conjunto de teste fixo desperdiçaria dados preciosos. O procedimento adequado é a **validação cruzada leave-one-out (LOOCV)**: para cada condição k, treina-se o metamodelo com as outras oito e prediz-se a condição k; o erro de predição agregado sobre as nove rodadas estima o desempenho do sistema em condições não vistas (FORRESTER; SÓBESTER; KEANE, 2008). As métricas reportadas são o erro absoluto médio (MAE) e a raiz do erro quadrático médio (RMSE), em unidades físicas e em percentual da média. Os resultados dessa validação, com erro de 1,18 MPa (2,7%) na predição da tensão máxima, são apresentados na Seção 8.6.

### 6.5.4 O fluxo preditivo completo

Com o metamodelo estabelecido, o fluxo preditivo completo torna-se:

$$(T, v) \;\xrightarrow{\text{metamodelo RBF}}\; (E, \sigma_0, n, \varepsilon_{max}) \;\xrightarrow{\text{Ramberg-Osgood + Newton-Raphson}}\; \sigma(\varepsilon) \;\xrightarrow{\text{formas fechadas}}\; \text{propriedades}$$

Todo o processo é executado em tempo real, permitindo ao usuário explorar interativamente o espaço de projeto: alterar temperatura e velocidade com controles deslizantes e observar imediatamente a curva prevista e as propriedades derivadas.

---

# 7 MATERIAIS E MÉTODOS

A metodologia adotada neste trabalho integra caracterização experimental, modelagem matemática e desenvolvimento computacional, permitindo a validação cruzada entre dados físicos e predições numéricas. A Figura 8 (lista de figuras) esquematiza o fluxo completo: fabricação → ensaio → importação → processamento e correção → ajuste constitutivo → metamodelagem → predição e visualização. As Seções 7.1 a 7.4 descrevem a etapa experimental; as Seções 7.5 a 7.9, a etapa computacional.

## 7.1 Material e equipamento de fabricação

O material utilizado foi o filamento comercial de PLA da marca GTMax3D, com diâmetro nominal de 1,75 mm. Os corpos de prova foram fabricados na impressora 3D Creality Ender-6 do laboratório IFMaker do IFSP Campus Birigui, equipamento de cinemática *core-XY* com volume de construção de 250 × 250 × 400 mm, bico de 0,4 mm e mesa aquecida. O fatiamento foi realizado com parâmetros idênticos entre as condições, exceto pelas variáveis de estudo (temperatura de extrusão e velocidade de impressão), mantendo-se constantes a espessura de camada (0,5 mm), a orientação dos corpos de prova (planos sobre a mesa, eixo longitudinal alinhado à direção de deposição predominante) e o padrão de preenchimento.

## 7.2 Planejamento experimental

Os parâmetros de impressão foram variados em um **planejamento fatorial completo 3 × 3**, com dois fatores em três níveis cada:

**Tabela 1 — Condições experimentais do planejamento fatorial 3 × 3.**

| Condição | Temperatura de extrusão (°C) | Velocidade de impressão (mm/s) |
|----------|------------------------------|--------------------------------|
| A00      | 190                          | 90                             |
| A01      | 190                          | 95                             |
| A02      | 190                          | 100                            |
| A10      | 210                          | 90                             |
| A11      | 210                          | 95                             |
| A12      | 210                          | 100                            |
| A20      | 220                          | 90                             |
| A21      | 220                          | 95                             |
| A22      | 220                          | 100                            |

*Fonte: elaborada pelos autores.*

A codificação AXY indexa a temperatura no primeiro dígito (0 = 190 °C; 1 = 210 °C; 2 = 220 °C) e a velocidade no segundo (0 = 90 mm/s; 1 = 95 mm/s; 2 = 100 mm/s). Para cada condição foram ensaiados **cinco corpos de prova válidos**, número mínimo prescrito pela ASTM D638, totalizando **45 ensaios** na campanha principal (série A). O conjunto de dados do projeto inclui ainda uma segunda campanha experimental (série B, com mais 45 ensaios) e ensaios preliminares de ajuste do procedimento, que elevam o total de corpos de prova fabricados e rompidos ao longo dos dois projetos de iniciação científica; a análise quantitativa deste trabalho concentra-se na série A, que constitui a base consolidada na plataforma.

O planejamento fatorial completo, em que todas as combinações de níveis são ensaiadas, foi escolhido por permitir estimar não apenas os efeitos principais de cada fator, mas também sua interação, por meio da análise de variância (Seção 7.8). A faixa de temperaturas (190 a 220 °C) cobre a janela de processamento recomendada para o PLA, do limite inferior, onde a literatura antecipa fusão deficiente, ao superior, próximo do início da degradação térmica.

## 7.3 Geometria dos corpos de prova

Os corpos de prova seguiram a geometria Tipo I da norma ASTM D638 (ASTM INTERNATIONAL, 2018): formato de gravata com seção útil nominal de 13 mm de largura e 3,2 mm de espessura, e comprimento de referência (*gauge length*) de 50 mm. Conforme prescreve a norma, as dimensões reais de cada corpo de prova foram medidas individualmente antes do ensaio e registradas junto aos dados, sendo utilizadas no cálculo das tensões. A Tabela 2 apresenta as médias por condição:

**Tabela 2 — Dimensões medidas dos corpos de prova (médias por condição, série A).**

| Condição | Largura média (mm) | Espessura média (mm) | Área média (mm²) |
|----------|--------------------|-----------------------|------------------|
| A00      | 13,14              | 3,76                  | 47,62 ± 2,25     |
| A01      | 13,17              | 3,69                  | 48,56 ± 0,40     |
| A02      | 13,13              | 3,61                  | 47,39 ± 0,37     |
| A10      | 13,13              | 3,67                  | 48,21 ± 0,08     |
| A11      | 12,93              | 3,37                  | 43,55 ± 0,49     |
| A12      | 12,88              | 3,28                  | 42,26 ± 0,44     |
| A20      | 12,88              | 3,29                  | 42,38 ± 0,17     |
| A21      | 12,90              | 3,30                  | 42,53 ± 0,34     |
| A22      | 12,83              | 3,30                  | 42,37 ± 0,11     |

*Fonte: elaborada pelos autores, a partir das medições registradas nas planilhas de ensaio.*

Observa-se variação de até 15% na área da seção entre condições: as peças impressas nas condições A00 a A10 resultaram sistematicamente mais espessas que o nominal. Essa variação dimensional é, em si, um efeito do processo (a fluidez e a acomodação do material dependem dos parâmetros), e evidencia a importância metodológica de normalizar cada ensaio pela área do próprio corpo de prova: o uso de uma área nominal única introduziria erro sistemático de até 15% nas tensões calculadas.

## 7.4 Ensaios de tração

Os ensaios de tração foram conduzidos em máquina universal de ensaios **EMIC DL30000N**, com célula de carga Trd 24 e software de aquisição Tesc versão 3.04, no IFSP Campus Birigui, entre junho e agosto de 2024. A velocidade de deslocamento do travessão foi de **5 mm/min**, conforme a ASTM D638 para materiais rígidos, e os ensaios foram realizados sem extensômetro; a deformação foi calculada a partir do deslocamento do travessão referido ao comprimento de referência de 50 mm, com as implicações metodológicas discutidas na Seção 4.5.3.

Para cada corpo de prova, o sistema de aquisição registrou continuamente o tempo (s), o alongamento (mm) e a força (N) até a ruptura, a uma taxa de aproximadamente 60 amostras por segundo, gerando entre 460 e 924 pontos por ensaio (duração típica de 60 a 110 s). Ao final de cada condição, o software da máquina emitiu um relatório consolidado com força máxima, tensão de ruptura, tensão de escoamento e módulo elástico por corpo de prova, além das estatísticas da condição, relatórios que serviram de referência independente para a validação do processamento computacional (Seção 8.3.2).

## 7.5 Processamento dos dados

Os registros brutos de cada ensaio foram processados pela cadeia implementada na plataforma, nas seguintes etapas:

1. **Conversão para grandezas de engenharia**: tensão σ = F/A₀, com A₀ medida individualmente (Tabela 2); deformação ε = ΔL/L₀, com L₀ = 50 mm;
2. **Sanitização**: remoção de pontos não numéricos, de força negativa (ruído da célula descarregada no início do ensaio) e de deformação negativa;
3. **Correção da região de acomodação (*toe compensation*)**, conforme ASTM D638 Anexo A1: identifica-se o trecho de maior inclinação da curva ascendente por regressão linear em janelas deslizantes (janela de 20% dos pontos entre 2% e 65% da tensão máxima); a reta desse trecho é prolongada até o eixo das deformações, e o ponto de interseção torna-se o novo zero de deformação, transladando-se todo o eixo;
4. **Extração de propriedades**: módulo de elasticidade aparente (inclinação da regressão do item 3), tensão máxima e deformação correspondente, deformação na ruptura (última deformação com tensão de pelo menos 50% da máxima) e tenacidade (integração numérica da curva pelo método dos trapézios até a ruptura);
5. **Recorte para ajuste constitutivo**: como o modelo de Ramberg-Osgood é monotônico, o ajuste utiliza os pontos do início do carregamento até a tensão máxima.

## 7.6 Ajuste do modelo constitutivo

O ajuste dos parâmetros (E, σ₀, n) de cada ensaio seguiu o método de mínimos quadrados no espaço das deformações (Seção 6.4.1), resolvido pela busca estocástica multi-start descrita na Seção 6.4.2 e detalhada no Apêndice B, com 3.000 iterações totais divididas em 3 reinícios, semente fixa do gerador pseudoaleatório (para reprodutibilidade), amostragem de até 400 pontos por curva e limites físicos E ∈ [500, 10.000] MPa, σ₀ ∈ [5, 200] MPa, n ∈ [1, 30]. Para cada ensaio foram registrados os parâmetros ótimos, o RMSE e o R² do ajuste. Na primeira fase do projeto, o mesmo problema foi resolvido em Python com a rotina `curve_fit` (Levenberg-Marquardt) da biblioteca SciPy, com processamento de dados em Pandas e NumPy (PEREIRA; SILVA; GERLIN NETO, 2025); a reimplementação em JavaScript integrou o ajuste ao ambiente da aplicação web.

## 7.7 Metamodelagem e validação cruzada

Os parâmetros constitutivos médios de cada condição, junto das propriedades medidas, formaram os nove pontos de treinamento do metamodelo RBF gaussiano descrito na Seção 6.5.2. A capacidade preditiva foi avaliada por validação cruzada *leave-one-out* (Seção 6.5.3): em cada rodada, uma condição é omitida do treinamento e predita pelas oito restantes; os erros agregados (MAE e RMSE) sobre as nove rodadas estimam o desempenho em condições não ensaiadas. A validação foi conduzida tanto no espaço das propriedades (tensão máxima, módulo aparente) quanto no dos parâmetros constitutivos (E, σ₀, n), para expor o efeito da identificabilidade discutido na Seção 6.4.3.

## 7.8 Análise estatística

A significância dos efeitos de temperatura e velocidade sobre as propriedades medidas foi avaliada por **análise de variância (ANOVA) de dois fatores com interação**, sobre os 45 ensaios individuais (9 células × 5 repetições). Para cada propriedade, a variabilidade total é decomposta em: efeito da temperatura (2 graus de liberdade), efeito da velocidade (2 g.l.), interação temperatura × velocidade (4 g.l.) e erro experimental (36 g.l.). As estatísticas F de cada efeito são comparadas aos valores críticos da distribuição F de Fisher ao nível de significância α = 0,05: F crítico(2; 36) = 3,26 e F crítico(4; 36) = 2,63. A dispersão intra-condição é reportada pelo coeficiente de variação (CV), razão entre desvio padrão e média expressa em percentual.

## 7.9 A Plataforma ResistencIA

### 7.9.1 Arquitetura

A versão atual da ResistencIA é uma aplicação web construída com o framework Next.js (React/TypeScript), com persistência em banco de dados relacional PostgreSQL e visualizações interativas implementadas com a biblioteca Recharts. A escolha de uma arquitetura web elimina a necessidade de instalação local e permite o acesso simultâneo de múltiplos usuários à mesma base experimental. O protótipo original, desenvolvido em Python com interface Streamlit e visualizações em Matplotlib e Plotly, validou a metodologia na fase de iniciação científica; a migração para a arquitetura web consolidou o sistema para uso multiusuário e integrou todas as etapas, da importação do dado bruto à predição, em um único ambiente.

### 7.9.2 Modelo de dados

O modelo de dados relacional (detalhado no Apêndice A) organiza a informação em entidades encadeadas que espelham a estrutura do experimento:

- **materials**: materiais cadastrados (PLA, extensível a outros termoplásticos);
- **print_profiles**: perfis de impressão (combinação de material, temperatura, velocidade e espessura de camada), com parâmetros extras em campo JSON;
- **test_runs**: ensaios individuais (corpos de prova), com geometria medida, arquivos de origem e metadados;
- **test_measurements**: séries temporais de cada ensaio (tempo, alongamento, deformação, força, tensão), indexadas por ponto;
- **ramberg_osgood_fits**: parâmetros ajustados do modelo por ensaio e método, com métricas de qualidade (R², RMSE);
- **mechanical_properties**: propriedades derivadas por ensaio (escoamento, tensão máxima, ductilidade, resiliência, tenacidade).

Na base de produção consolidada para este trabalho, o conjunto reúne 9 perfis de impressão, 45 ensaios e 29.519 pontos de medição.

### 7.9.3 Módulos funcionais

A plataforma organiza-se nos seguintes módulos:

- **Importação**: recebe arquivos CSV/TXT dos ensaios (tempo, deformação, força), com detecção automática de delimitadores e colunas, conversão de força em tensão a partir da geometria do corpo de prova e cadastro automático do perfil de impressão correspondente; suporta importação individual ou em lote;
- **Histórico**: catálogo de todos os ensaios cadastrados, com busca, filtros e exportação por linha ou em lote;
- **Predição**: informa-se temperatura e velocidade, e o sistema estima a curva tensão-deformação completa e as propriedades mecânicas derivadas, via metamodelo RBF sobre os ensaios reais cadastrados;
- **Comparação**: coloca ensaios e predições lado a lado, evidenciando o efeito de diferentes temperaturas e velocidades;
- **Atlas 3D**: superfícies de resposta tridimensionais mostrando como E, σ₀ e n variam sobre o plano temperatura × velocidade;
- **Calibração**: ajuste interativo de E, σ₀ e n sobre os pontos experimentais, com métrica de erro em tempo real; o usuário pode partir do ajuste automático e refinar manualmente os parâmetros;
- **Simulação estrutural (MEF)**: conecta a curva do material a um modelo de elementos finitos simplificado, permitindo estimar a resposta de uma peça sob carga a partir do comportamento constitutivo previsto;
- **Verificação numérica**: estudo de convergência de malha, mostrando como o refinamento influencia o erro relativo e a estabilidade do resultado numérico;
- **Ensaio ao vivo**: visualização tridimensional animada do corpo de prova ASTM D638 sob tração, acompanhando a curva em tempo real, com finalidade didática;
- **Documentação**: síntese, dentro da própria plataforma, do que o sistema calcula, com qual modelo e em quais faixas de parâmetros.

### 7.9.4 Segurança e acesso

O acesso é controlado por autenticação própria: as senhas são protegidas por função de derivação de chave *scrypt* com sal individual por usuário, e as sessões utilizam tokens aleatórios entregues em cookies *httpOnly*, armazenados no banco exclusivamente na forma de resumo criptográfico (SHA-256), de modo que um eventual vazamento da base não compromete sessões ativas nem senhas. Essas decisões seguem as práticas correntes de defesa em profundidade para aplicações web.

---

# 8 RESULTADOS E DISCUSSÃO

## 8.1 Base experimental consolidada

A campanha experimental principal (série A) produziu 45 ensaios válidos (9 condições × 5 corpos de prova), consolidados na base de dados da plataforma com 29.519 pontos de medição. Cada ensaio registrou entre 460 e 924 pontos (tempo, alongamento, força), com duração típica de 60 a 110 segundos e forças máximas entre 1.542 e 2.196 N. Todos os resultados desta seção provêm do processamento descrito na Seção 7.5, com normalização pela área individual de cada corpo de prova e correção de acomodação (*toe compensation*), executado pela cadeia de análise da plataforma sobre os dados brutos.

## 8.2 Aspecto geral das curvas

As curvas tensão-deformação obtidas exibem o padrão esperado para o PLA impresso à temperatura ambiente: após a região de acomodação (pronunciada nos registros brutos, com extensão de 4% a 6% de deformação aparente, e removida pela correção normativa), um trecho ascendente de rigidez praticamente constante, transição gradual e curta para o regime plástico, pico de tensão e queda abrupta, caracterizando fratura frágil sem estricção apreciável (Seção 4.7). A deformação na ruptura, após correção, situou-se entre 7,3% e 8,8%, valor coerente com o comportamento frágil do PLA abaixo da sua temperatura de transição vítrea e com os valores da literatura para peças impressas (TYMRAK; KREIGER; PEARCE, 2014).

*(Inserir Figura 6: curvas brutas de uma condição com a região de acomodação destacada e as mesmas curvas após a correção, disponíveis no módulo Comparação da plataforma.)*

## 8.3 Propriedades mecânicas por condição

A Tabela 3 apresenta as propriedades extraídas pela plataforma para cada condição de impressão.

**Tabela 3 — Propriedades mecânicas por condição de impressão (série A; média de 5 corpos de prova; análise com correção de acomodação e área individual).**

| Condição | Temp. (°C) | Vel. (mm/s) | Tensão máx. (MPa) | CV (%) | Módulo aparente E (MPa) | Def. ruptura (%) | Tenacidade (MJ/m³) |
|----------|-----------|-------------|--------------------|--------|--------------------------|-------------------|---------------------|
| A00      | 190       | 90          | 42,4 ± 3,3         | 7,7    | 536 ± 35                 | 7,8               | 1,70                |
| A01      | 190       | 95          | 43,4 ± 1,1         | 2,5    | 551 ± 10                 | 8,0               | 1,83                |
| A02      | 190       | 100         | 45,2 ± 1,4         | 3,0    | 563 ± 9                  | 8,8               | 2,21                |
| A10      | 210       | 90          | 41,7 ± 2,4         | 5,8    | 524 ± 18                 | 7,8               | 1,68                |
| A11      | 210       | 95          | 44,4 ± 4,6         | 10,4   | 625 ± 48                 | 7,4               | 1,71                |
| A12      | 210       | 100         | 46,1 ± 1,4         | 3,0    | 586 ± 10                 | 7,8               | 1,85                |
| A20      | 220       | 90          | 43,4 ± 3,0         | 7,0    | 582 ± 27                 | 7,4               | 1,64                |
| A21      | 220       | 95          | 43,2 ± 2,0         | 4,6    | 582 ± 9                  | 7,3               | 1,60                |
| A22      | 220       | 100         | 47,0 ± 3,1         | 6,7    | 598 ± 37                 | 7,8               | 1,90                |

*Fonte: elaborada pelos autores, a partir do processamento da plataforma ResistencIA.*

Três padrões emergem da tabela. Primeiro, em **todas as três temperaturas, a velocidade de 100 mm/s produziu a maior tensão máxima da linha** (45,2, 46,1 e 47,0 MPa), consistência que antecipa o resultado da análise estatística. Segundo, o **módulo aparente cresce com a temperatura** (médias de 550, 578 e 587 MPa a 190, 210 e 220 °C), em linha com o mecanismo de melhor consolidação térmica discutido na Seção 5.3. Terceiro, a **deformação na ruptura decresce com a temperatura** (médias de 8,2%, 7,7% e 7,5%): o material mais bem consolidado é também mais rígido e menos deformável, expressão do clássico compromisso resistência-ductilidade.

A dispersão intra-condição (CV de 2,5% a 10,4%) está dentro do esperado para peças FDM (TYMRAK; KREIGER; PEARCE, 2014). As condições com velocidade de 100 mm/s apresentaram, além das maiores médias, dispersões baixas (CV ≤ 6,7%), sugerindo processo mais estável; a condição A11 concentrou a maior variabilidade (CV = 10,4%), com um corpo de prova rompendo prematuramente, comportamento típico de defeito local de impressão.

### 8.3.1 Sobre o módulo de elasticidade aparente

Os módulos da Tabela 3 (524 a 625 MPa) são substancialmente inferiores aos valores de extensometria da literatura para o PLA (2,7 a 3,5 GPa; Seção 3.6). A diferença não indica material anômalo, e sim o método de medição: sem extensômetro, a deformação é derivada do deslocamento do travessão, que soma ao alongamento da região útil a complacência das garras, das cabeças do corpo de prova e da estrutura da máquina (Seção 4.5.3). O resultado é um módulo **aparente** do sistema: internamente consistente e válido para comparações entre condições ensaiadas no mesmo arranjo, mas não comparável em valor absoluto a módulos de extensometria. Essa leitura é confirmada pelos relatórios da própria máquina de ensaios, que reportam módulos ES1 na mesma faixa (544,9 a 637,8 MPa, Tabela 4), e é corroborada pela concordância da ordenação entre condições nos dois processamentos.

### 8.3.2 Validação contra os relatórios da máquina de ensaios

Como verificação independente da cadeia computacional, as propriedades calculadas pela plataforma foram confrontadas com as estatísticas dos relatórios oficiais emitidos pelo software Tesc da EMIC ao final de cada condição:

**Tabela 4 — Estatísticas oficiais dos relatórios de ensaio EMIC por condição (médias de 5 corpos de prova).**

| Condição | Tensão à ruptura (MPa) | CV (%) | Tensão de escoamento ES1 (MPa) | Módulo elástico ES1 (MPa) |
|----------|------------------------|--------|--------------------------------|---------------------------|
| A00      | 40,18                  | 6,60   | 23,65                          | 544,9                     |
| A01      | 43,37                  | 2,98   | 23,35                          | 575,6                     |
| A02      | 44,91                  | 3,40   | 23,13                          | 583,5                     |
| A10      | 41,47                  | 6,60   | 23,69                          | 569,8                     |
| A11      | *                      | *      | *                              | *                         |
| A12      | 45,75                  | 3,37   | 25,86                          | 623,4                     |
| A20      | 43,23                  | 7,76   | 25,93                          | 626,7                     |
| A21      | 42,91                  | 4,87   | 27,00                          | 631,2                     |
| A22      | 46,74                  | 7,79   | 26,70                          | 637,8                     |

*Fonte: relatórios de ensaio EMIC DL30000N / Tesc 3.04 (IFSP Campus Birigui, 2024). (\*) O relatório consolidado da condição A11 não integra o conjunto de arquivos disponível; para essa condição valem os resultados da Tabela 3.*

A concordância entre as Tabelas 3 e 4 é a validação central da cadeia computacional: as tensões máximas diferem, em média, menos de 3% (por exemplo, A12: 46,1 MPa na plataforma contra 45,75 MPa no relatório EMIC; A22: 47,0 contra 46,74), e os módulos aparentes seguem a mesma ordenação e faixa (diferenças atribuíveis aos critérios de janela de regressão de cada software). Conclui-se que o processamento da plataforma, do arquivo bruto às propriedades, reproduz fielmente os resultados do sistema comercial de ensaios, com a vantagem de ser aberto, auditável e integrado à cadeia preditiva.

## 8.4 Análise estatística dos efeitos

A Tabela 5 resume a ANOVA de dois fatores sobre os 45 ensaios individuais, para quatro propriedades.

**Tabela 5 — ANOVA de dois fatores (45 ensaios; F críticos ao nível de 5%: 3,26 para efeitos principais, 2,63 para interação; valores significativos marcados com \*).**

| Propriedade | F (Temperatura) | F (Velocidade) | F (Interação T×V) |
|---|---|---|---|
| Tensão máxima | 0,29 | **5,50\*** | 0,38 |
| Módulo aparente E | **6,51\*** | **7,54\*** | **4,29\*** |
| Deformação na ruptura | **5,52\*** | **3,81\*** | 0,87 |
| Tenacidade | 2,18 | **5,77\*** | 0,60 |

*Fonte: elaborada pelos autores.*

A leitura conjunta das quatro linhas produz um quadro fisicamente coerente:

1. **A velocidade de impressão é o fator dominante para a resistência**: seu efeito sobre a tensão máxima é significativo (F = 5,50 > 3,26), com médias marginais de 42,5, 43,7 e 46,1 MPa para 90, 95 e 100 mm/s, um ganho de 8,5% do nível mais lento para o mais rápido. A interpretação mecanística (Seção 5.4) é o menor intervalo entre camadas nas velocidades maiores: para corpos de prova pequenos, cada camada é depositada sobre uma superfície ainda aquecida, melhorando a soldagem térmica. A tenacidade acompanha o mesmo padrão (F = 5,77; médias de 1,7, 1,7 e 2,0 MJ/m³), pois combina resistência e deformabilidade;

2. **A temperatura de extrusão governa a rigidez, não a resistência**: seu efeito sobre a tensão máxima é insignificante na faixa estudada (F = 0,29), mas sobre o módulo aparente é significativo (F = 6,51), com médias crescentes de 550, 578 e 587 MPa, confirmando o mecanismo de consolidação térmica e cristalização discutido nas Seções 3.5 e 5.3. O mesmo fator reduz significativamente a deformação na ruptura (F = 5,52; médias de 8,2%, 7,7% e 7,5%): material mais consolidado, porém menos dúctil;

3. **A interação T×V só é relevante para a rigidez** (F = 4,29), indicando que o ganho de módulo com a temperatura depende da velocidade, o que é coerente com o acoplamento térmico dos dois parâmetros (tempo de residência no *hotend* versus intervalo entre camadas, Seção 5.4).

Do ponto de vista da otimização de processo, os resultados indicam a condição **A22 (220 °C, 100 mm/s)** como a de maior resistência média (47,0 MPa) e maior rigidez (598 MPa), com A12 (210 °C, 100 mm/s; 46,1 MPa) estatisticamente equivalente e com menor dispersão (CV = 3,0% contra 6,7%), uma escolha conservadora para aplicações que privilegiem reprodutibilidade. Se o requisito dominante for ductilidade ou tolerância a dano, as condições a 190 °C oferecem maior deformação na ruptura (até 8,8% em A02), à custa de resistência ligeiramente menor.

## 8.5 Ajuste do modelo de Ramberg-Osgood

A Tabela 6 apresenta os parâmetros constitutivos médios ajustados por condição e as métricas de qualidade.

**Tabela 6 — Parâmetros ajustados do modelo de Ramberg-Osgood (médias de 5 ajustes por condição; ajuste sobre curvas corrigidas, até a tensão máxima).**

| Condição | E ajustado (MPa) | σ₀ (MPa) | n | R² | RMSE (×10⁻³ mm/mm) |
|----------|------------------|----------|------|-------|---------------------|
| A00      | 754              | 6,6      | 1,29 | 0,987 | 2,42                |
| A01      | 739              | 8,4      | 1,38 | 0,989 | 2,28                |
| A02      | 708              | 11,4     | 1,53 | 0,990 | 2,26                |
| A10      | 668              | 34,4     | 2,06 | 0,985 | 2,60                |
| A11      | 844              | 31,4     | 2,77 | 0,989 | 2,07                |
| A12      | 757              | 9,5      | 1,35 | 0,987 | 2,42                |
| A20      | 765              | 9,5      | 1,36 | 0,988 | 2,19                |
| A21      | 798              | 7,8      | 1,32 | 0,987 | 2,25                |
| A22      | 791              | 10,2     | 1,37 | 0,988 | 2,26                |

*Fonte: elaborada pelos autores.*

O modelo descreveu as curvas experimentais com **R² entre 0,985 e 0,990 e RMSE entre 2,1 e 2,6 milidécimos de deformação em todas as nove condições**, qualidade de ajuste uniforme e elevada que confirma a adequação do modelo de Ramberg-Osgood ao PLA impresso quando o pré-processamento normativo é aplicado. Os expoentes de encruamento baixos (n entre 1,29 e 2,77) quantificam a transição elasto-plástica extremamente gradual do material, sem "joelho" definido, exatamente o regime para o qual o modelo foi concebido (Seção 6.3.2).

Dois aspectos merecem discussão. Primeiro, os módulos ajustados (668 a 844 MPa) excedem sistematicamente os módulos aparentes medidos por regressão (524 a 625 MPa): como o modelo distribui toda a curvatura da curva entre seus dois termos, o termo elástico ajustado tende a capturar uma rigidez "assintótica" inicial ligeiramente superior à secante média, diferença esperada e sem consequência prática, dado que a predição se dá no espaço das curvas completas. Segundo, as triplas ajustadas exibem a equifinalidade antecipada na Seção 6.4.3: as condições A10 e A11 alcançaram ajustes equivalentes aos demais com σ₀ e n bem distintos (σ₀ de 31 a 34 MPa e n de 2 a 2,8, contra σ₀ de 7 a 11 MPa e n próximo de 1,3 nas demais), refletindo vales alongados da função objetivo em que combinações diferentes de parâmetros produzem curvas quase idênticas. A consequência para a metamodelagem é examinada na seção seguinte.

Registre-se, por fim, o contraste com a primeira fase do projeto: sem a correção de acomodação, o ajuste da condição A02 havia resultado em R² = 0,189 (PEREIRA; SILVA; GERLIN NETO, 2025); com o pré-processamento normativo, a mesma condição ajusta com R² = 0,990. O resultado evidencia que a dificuldade então observada não era do modelo constitutivo, mas do artefato experimental não corrigido, conclusão metodológica relevante para trabalhos futuros do grupo.

## 8.6 Predição via metamodelo: validação cruzada

A Tabela 7 apresenta a validação *leave-one-out* do metamodelo RBF para as duas propriedades de maior interesse de engenharia.

**Tabela 7 — Validação cruzada leave-one-out do metamodelo RBF (cada condição predita a partir das outras oito).**

| Condição | σmax real (MPa) | σmax predito (MPa) | E real (MPa) | E predito (MPa) |
|----------|------------------|---------------------|---------------|------------------|
| A00      | 42,4             | 43,5                | 536           | 564              |
| A01      | 43,4             | 44,0                | 551           | 570              |
| A02      | 45,2             | 44,3                | 563           | 574              |
| A10      | 41,7             | 43,9                | 524           | 581              |
| A11      | 44,4             | 44,0                | 625           | 567              |
| A12      | 46,1             | 44,5                | 586           | 583              |
| A20      | 43,4             | 43,4                | 582           | 570              |
| A21      | 43,2             | 44,4                | 582           | 581              |
| A22      | 47,0             | 44,4                | 598           | 584              |

*Fonte: elaborada pelos autores.*

Os erros agregados foram: **MAE de 1,18 MPa e RMSE de 1,42 MPa para a tensão máxima (2,7% de erro relativo)** e MAE de 22,5 MPa para o módulo aparente (3,9%). O erro de predição da tensão máxima é, portanto, da mesma ordem da dispersão experimental intra-condição (desvios padrão de 1,1 a 4,6 MPa), que é o limite teórico do que qualquer preditor pode alcançar com esses dados. Em termos práticos: para uma combinação não ensaiada de temperatura e velocidade dentro do domínio, a plataforma estima a resistência do material com incerteza equivalente à de se ensaiar um novo lote.

A validação expõe também os limites do esquema. As condições de vértice com valores extremos (A22, de maior resistência) são as mais difíceis: por construção, o interpolador com salvaguarda de limites não extrapola além dos valores de treinamento, e a predição de A22 sem A22 no treinamento (44,4 contra 47,0 MPa) subestima o máximo em 5,5%. Nos parâmetros constitutivos individuais, a equifinalidade cobra seu preço: σ₀ e n, mal identificáveis isoladamente, apresentaram erros relativos de LOOCV elevados (71% e 29%, respectivamente), enquanto o E ajustado manteve erro moderado (5,3%). A predição de curvas completas permanece precisa porque os desvios de σ₀ e n se compensam mutuamente, mas a lição metodológica é clara e foi incorporada à plataforma: a validação e o uso do sistema devem se dar no espaço das curvas e propriedades derivadas, não dos parâmetros isolados.

*(Inserir Figura 11: superfície de resposta da tensão máxima no plano T × v, módulo Atlas 3D; e Figura 12: sobreposição de curvas preditas e experimentais para condições retiradas do treinamento.)*

## 8.7 Comparação com a literatura

**Tabela 8 — Comparação dos resultados com valores da literatura para PLA.**

| Fonte | Material/processo | Tensão máx. (MPa) | Módulo (GPa) | Def. ruptura (%) |
|---|---|---|---|---|
| Este trabalho (série A) | PLA FDM, 190–220 °C, 90–100 mm/s | 41,7 a 47,0 | 0,52 a 0,63 (aparente)† | 7,3 a 8,8 |
| Tymrak et al. (2014) | PLA FDM, impressoras abertas | 28,5 a 56,6 | 3,3 (extensometria) | n/d |
| Chacón et al. (2017) | PLA FDM, várias orientações | 30 a 89 (aprox.) | n/d | n/d |
| Lanzotti et al. (2015) | PLA FDM, impressora aberta | 30 a 55 (aprox.) | n/d | n/d |
| Garlotta (2001); Farah et al. (2016) | PLA maciço | 50 a 70 | 2,7 a 3,5 | 2 a 6 |

*Fonte: elaborada pelos autores. († módulo aparente por deslocamento de travessão, não comparável em valor absoluto à extensometria; ver Seção 8.3.1.)*

As resistências obtidas situam-se confortavelmente dentro da faixa reportada para PLA impresso em impressoras de código aberto, no terço superior do intervalo de Tymrak et al. (2014), indicando processo bem ajustado, e, como esperado, abaixo do PLA maciço injetado, refletindo os vazios e interfaces do processo aditivo. A deformação na ruptura das peças impressas supera a do material maciço reportada em parte da literatura, efeito atribuível à arquitetura de deposição e ao método de medição por travessão.

## 8.8 Reconciliação com os resultados publicados na fase de iniciação científica

Os resumos publicados na fase de iniciação científica (SILVA et al., 2024; PEREIRA; SILVA; GERLIN NETO, 2025) reportaram, para as mesmas nove condições, valores pontualmente distintos dos aqui apresentados, por exemplo tensão máxima de 62,1 MPa na condição A12 e módulos entre 5,8 e 197,7 MPa. A reanálise completa conduzida neste trabalho, validada contra os relatórios oficiais da máquina de ensaios (Tabela 4), permite atribuir essas diferenças a três causas metodológicas da cadeia de processamento então utilizada: (i) ausência da correção de acomodação, que contaminava o eixo de deformação e, com ele, módulos e ajustes; (ii) normalização por área nominal única, em vez da área medida de cada corpo de prova, que a Tabela 2 mostra variar até 15% entre condições; e (iii) inconsistências de transcrição entre planilhas de processamento e o resumo publicado. Os valores da Tabela 3, ancorados nos relatórios EMIC, substituem, para todos os efeitos deste trabalho, os anteriormente publicados. A divergência é em si um resultado: quantifica o impacto do pré-processamento normativo na caracterização de polímeros impressos e justifica a automação dessa cadeia em uma plataforma auditável.

> [NOTA: alinhar com o orientador antes da defesa: esta seção documenta e explica as diferenças em relação aos resumos do CONICT; confirmar a redação com os coautores.]

## 8.9 A plataforma como ferramenta de engenharia

A plataforma ResistencIA consolidou o fluxo completo (importação dos dados brutos do ensaio, correção normativa, ajuste automático do modelo constitutivo, armazenamento estruturado, predição para condições não ensaiadas, comparação e visualização) em um único ambiente acessível por navegador. O experimento de validação desta seção ilustra o ganho prático: uma vez alimentada a base com o planejamento fatorial mínimo (45 ensaios), qualquer combinação intermediária de temperatura e velocidade é avaliada em tempo real, com incerteza quantificada de cerca de 1,2 MPa na resistência, sem novo consumo de filamento, tempo de impressão ou ocupação da máquina de ensaios.

Cabe registrar a evolução arquitetural do sistema ao longo do projeto: o protótipo original, desenvolvido em Python com interface Streamlit, validou a metodologia (ajuste via SciPy e metamodelos polinomiais); a versão atual, reimplementada como aplicação web em Next.js/TypeScript com banco PostgreSQL, incorporou a interpolação RBF, a correção normativa automática, a calibração interativa, os módulos de simulação estrutural e verificação numérica, e o suporte a múltiplos usuários e materiais. Essa evolução ilustra o papel da engenharia de computação no trabalho: não como fim, mas como meio para transformar um procedimento de análise de materiais em uma ferramenta reutilizável, auditável e de apoio à decisão.

## 8.10 Limitações do estudo

Os resultados devem ser lidos dentro dos seguintes contornos de validade:

- **Domínio experimental**: as predições valem para o interior do domínio ensaiado (190 a 220 °C, 90 a 100 mm/s), para o filamento, a impressora e a orientação de impressão utilizados; a salvaguarda anti-extrapolação da plataforma impõe esse limite por construção;
- **Medição por travessão**: os módulos são aparentes (Seção 8.3.1); comparações absolutas de rigidez com outras fontes exigem extensometria;
- **Amostragem**: cinco repetições por condição atendem à norma, mas limitam o poder estatístico para detectar efeitos pequenos; o efeito da temperatura sobre a resistência, por exemplo, pode existir e não ter sido detectado (erro tipo II);
- **Fatores fixados**: espessura de camada, preenchimento, orientação e condições ambientais foram mantidos constantes; os efeitos aqui quantificados não se transferem automaticamente para outras configurações;
- **Modelo monotônico**: o modelo de Ramberg-Osgood não descreve o comportamento pós-pico, ciclos de carga ou efeitos de taxa e temperatura de serviço.

---

# 9 CONCLUSÕES

Este trabalho analisou o comportamento tensão-deformação do PLA impresso em 3D por FDM sob diferentes parâmetros de impressão e desenvolveu uma ferramenta computacional preditiva fundamentada no modelo constitutivo de Ramberg-Osgood, culminando na plataforma ResistencIA. Retomando o problema de pesquisa formulado na introdução (a possibilidade de prever, a partir de um conjunto finito de ensaios, o comportamento mecânico do material para qualquer combinação de parâmetros no domínio estudado), os resultados permitem respondê-lo afirmativamente, com incerteza quantificada.

Do ponto de vista **experimental**, os 45 ensaios de tração da campanha principal, conduzidos conforme a ASTM D638 sobre corpos de prova fabricados em planejamento fatorial completo 3 × 3, estabeleceram que: (i) a velocidade de impressão é o fator dominante para a resistência na faixa estudada, com efeito estatisticamente significativo (ANOVA, F = 5,50 > F crítico = 3,26) e ganho de 8,5% na tensão máxima média entre 90 e 100 mm/s; (ii) a temperatura de extrusão governa a rigidez, com módulo aparente crescente de 550 para 587 MPa entre 190 e 220 °C (F = 6,51), e reduz a ductilidade, sem efeito detectável sobre a resistência; (iii) a condição de melhor desempenho combinado foi A22 (220 °C, 100 mm/s), com 47,0 MPa de tensão máxima média, tendo A12 (210 °C, 100 mm/s) como alternativa estatisticamente equivalente e de menor dispersão. Esses resultados são coerentes com os mecanismos físicos de soldagem térmica entre camadas documentados na literatura e quantificam-nos para o conjunto máquina-material-geometria estudado.

Do ponto de vista **metodológico**, o trabalho demonstrou o impacto decisivo do pré-processamento normativo na caracterização de polímeros impressos: a aplicação da correção de acomodação (*toe compensation*) e da normalização pela área individual de cada corpo de prova elevou o ajuste do modelo constitutivo de R² = 0,189 (condição problemática da fase de iniciação científica) para R² ≥ 0,985 em todas as condições, e alinhou as propriedades calculadas pela plataforma aos relatórios oficiais da máquina de ensaios com concordância superior a 97%. A reanálise documentada na Seção 8.8 substitui os valores publicados preliminarmente e explica suas causas, resultado que, por si, justifica a automação da cadeia de análise em ferramenta auditável.

Do ponto de vista da **modelagem**, o modelo de Ramberg-Osgood mostrou-se plenamente adequado ao PLA impresso: com apenas três parâmetros, descreveu as 45 curvas experimentais com R² entre 0,985 e 0,990 e RMSE da ordem de 2 × 10⁻³ em deformação, capturando a transição elasto-plástica gradual característica do material (n entre 1,3 e 2,8). A metamodelagem por funções de base radial sobre o espaço temperatura × velocidade, validada por *leave-one-out*, prediz a tensão máxima de condições não ensaiadas com erro absoluto médio de 1,18 MPa (2,7%), da mesma ordem da dispersão experimental, que constitui o limite teórico de qualquer preditor. A análise expôs ainda, com honestidade metodológica, a equifinalidade dos parâmetros constitutivos e sua consequência: a validação de sistemas preditivos desse tipo deve ocorrer no espaço das curvas e propriedades, não dos parâmetros isolados.

Do ponto de vista da **ferramenta**, a plataforma ResistencIA integra base de dados experimental (9 perfis, 45 ensaios, 29.519 medições), correção normativa, ajuste automático, metamodelagem, predição e visualização interativa em ambiente web de código aberto, transformando um conjunto finito de ensaios destrutivos em capacidade de análise virtual contínua do espaço de projeto, com redução direta de consumo de filamento, tempo de máquina e descarte de material.

A principal contribuição do trabalho reside na integração das duas frentes, caracterização experimental sistemática e previsão computacional rigorosa, demonstrando, com validação independente, que um planejamento fatorial mínimo pode sustentar predições de precisão equivalente à do próprio ensaio, e entregando a metodologia empacotada em ferramenta reutilizável para o laboratório e para trabalhos futuros do grupo.

---

# 10 TRABALHOS FUTUROS

Como desdobramentos deste trabalho, propõe-se:

- **Extensometria direta**: repetir a campanha com extensômetro (ou correlação digital de imagens) para medir módulos absolutos, quantificar a complacência do sistema e refinar a componente elástica dos ajustes;
- **Análise da segunda campanha (série B)**: processar integralmente os 45 ensaios da série B pela mesma cadeia (os dados brutos já integram o acervo do projeto) para avaliar reprodutibilidade entre lotes e ampliar a base de treinamento dos metamodelos;
- **Ampliação do domínio experimental**: incluir a espessura de camada como terceiro fator do planejamento e estender as faixas de temperatura e velocidade, com validação da salvaguarda anti-extrapolação;
- **Extensão a outros termoplásticos**: aplicar a metodologia a PETG e ABS, avaliando a generalidade do modelo constitutivo e da infraestrutura, cujo modelo de dados já contempla múltiplos materiais;
- **Microestrutura**: correlacionar as propriedades medidas com caracterização microestrutural (microscopia das superfícies de fratura, DSC para grau de cristalinidade), fechando experimentalmente a cadeia causal parâmetros → microestrutura → propriedades;
- **Metamodelos com incerteza**: substituir a interpolação RBF por krigagem (processos gaussianos), que fornece intervalos de confiança nativos para as predições;
- **Simulação estrutural completa**: evoluir o módulo de elementos finitos da plataforma para geometrias bidimensionais e tridimensionais com plasticidade de Ramberg-Osgood, conectando a predição do material ao dimensionamento de peças reais;
- **Ensaios complementares**: caracterizar o material em flexão, impacto e fadiga, propriedades críticas para aplicações estruturais de peças impressas.

---

# REFERÊNCIAS BIBLIOGRÁFICAS

AHN, S.-H.; MONTERO, M.; ODELL, D.; ROUNDY, S.; WRIGHT, P. K. Anisotropic material properties of fused deposition modeling ABS. **Rapid Prototyping Journal**, v. 8, n. 4, p. 248-257, 2002.

ASTM INTERNATIONAL. **ASTM D638-14**: Standard test method for tensile properties of plastics. West Conshohocken: ASTM International, 2018.

AURAS, R.; HARTE, B.; SELKE, S. An overview of polylactides as packaging materials. **Macromolecular Bioscience**, v. 4, n. 9, p. 835-864, 2004.

BELLEHUMEUR, C.; LI, L.; SUN, Q.; GU, P. Modeling of bond formation between polymer filaments in the fused deposition modeling process. **Journal of Manufacturing Processes**, v. 6, n. 2, p. 170-178, 2004.

BUHMANN, M. D. **Radial basis functions**: theory and implementations. Cambridge: Cambridge University Press, 2003.

CALLISTER, W. D. **Ciência e engenharia de materiais**: uma introdução. 7. ed. Rio de Janeiro: LTC, 2008.

CHACÓN, J. M.; CAMINERO, M. A.; GARCÍA-PLAZA, E.; NÚÑEZ, P. J. Additive manufacturing of PLA structures using fused deposition modelling: Effect of process parameters on mechanical properties and their optimal selection. **Materials & Design**, v. 124, p. 143-157, 2017.

CHIAVERINI, V. **Tecnologia mecânica**: estrutura e propriedades das ligas metálicas. 2. ed. São Paulo: McGraw-Hill, 1986. v. 1.

CRUMP, S. S. **Apparatus and method for creating three-dimensional objects**. US Patent 5.121.329, 9 jun. 1992.

DE GENNES, P. G. Reptation of a polymer chain in the presence of fixed obstacles. **The Journal of Chemical Physics**, v. 55, n. 2, p. 572-579, 1971.

DIETER, G. E. **Mechanical metallurgy**. Nova York: McGraw-Hill, 1989.

DOWLING, N. E. **Mechanical behavior of materials**: engineering methods for deformation, fracture, and fatigue. 4. ed. Boston: Pearson, 2012.

ES-SAID, O. S.; FOYOS, J.; NOORANI, R.; MENDELSON, M.; MARLOTH, R.; PREGGER, B. A. Effect of layer orientation on mechanical properties of rapid prototyped samples. **Materials and Manufacturing Processes**, v. 15, n. 1, p. 107-122, 2000.

FARAH, S.; ANDERSON, D. G.; LANGER, R. Physical and mechanical properties of PLA, and their functions in widespread applications — A comprehensive review. **Advanced Drug Delivery Reviews**, v. 107, p. 367-392, 2016.

FORRESTER, A. I. J.; SÓBESTER, A.; KEANE, A. J. **Engineering design via surrogate modelling**: a practical guide. Chichester: Wiley, 2008.

GARLOTTA, D. A literature review of poly(lactic acid). **Journal of Polymers and the Environment**, v. 9, n. 2, p. 63-84, 2001.

GIBSON, I.; ROSEN, D.; STUCKER, B. **Additive manufacturing technologies**: 3D printing, rapid prototyping, and direct digital manufacturing. 2. ed. Nova York: Springer, 2015.

HARDY, R. L. Multiquadric equations of topography and other irregular surfaces. **Journal of Geophysical Research**, v. 76, n. 8, p. 1905-1915, 1971.

HIBBELER, R. C. **Resistência dos materiais**. 7. ed. São Paulo: Pearson, 2010.

HOLLOMON, J. H. Tensile deformation. **Transactions of the Metallurgical Society of AIME**, v. 162, p. 268-290, 1945.

ISO/ASTM. **ISO/ASTM 52900:2021** — Additive manufacturing — General principles — Fundamentals and vocabulary. Genebra: ISO, 2021.

LANZOTTI, A.; GRASSO, M.; STAIANO, G.; MARTORELLI, M. The impact of process parameters on mechanical properties of parts fabricated in PLA with an open-source 3-D printer. **Rapid Prototyping Journal**, v. 21, n. 5, p. 604-617, 2015.

LIM, L.-T.; AURAS, R.; RUBINO, M. Processing technologies for poly(lactic acid). **Progress in Polymer Science**, v. 33, n. 8, p. 820-852, 2008.

MARQUARDT, D. W. An algorithm for least-squares estimation of nonlinear parameters. **Journal of the Society for Industrial and Applied Mathematics**, v. 11, n. 2, p. 431-441, 1963.

MURARIU, A. C. et al. Influence of 3D printing parameters on mechanical properties of the PLA parts made by FDM additive manufacturing process. **Engineering Innovations**, v. 2, p. 7-20, 2022.

NGO, T. D.; KASHANI, A.; IMBALZANO, G.; NGUYEN, K. T. Q.; HUI, D. Additive manufacturing (3D printing): A review of materials, methods, applications and challenges. **Composites Part B: Engineering**, v. 143, p. 172-196, 2018.

OUHSTI, M.; HADDADI, B.; BELHOUIDEG, S. Effect of printing parameters on the mechanical properties of parts fabricated with open-source 3D printers in PLA by fused deposition modeling. **Mechanics and Mechanical Engineering**, v. 22, n. 4, p. 895-907, 2018.

PEREIRA, L. H. N.; SILVA, D. F.; GERLIN NETO, V. Desenvolvimento de aplicativo preditivo para análise de curvas tensão-deformação do PLA em impressão 3D. In: CONGRESSO DE INOVAÇÃO, CIÊNCIA E TECNOLOGIA DO IFSP, 16., 2025, Birigui. **Anais [...]**. Birigui: IFSP, 2025.

POPESCU, D.; ZAPCIU, A.; AMZA, C.; BACIU, F.; MARINESCU, R. FDM process parameters influence over the mechanical properties of polymer specimens: A review. **Polymer Testing**, v. 69, p. 157-166, 2018.

PRESS, W. H.; TEUKOLSKY, S. A.; VETTERLING, W. T.; FLANNERY, B. P. **Numerical recipes**: the art of scientific computing. 3. ed. Cambridge: Cambridge University Press, 2007.

RAMBERG, W.; OSGOOD, W. R. **Description of stress-strain curves by three parameters**. Washington: National Advisory Committee for Aeronautics, 1943. (NACA Technical Note, n. 902).

SANTANA, L.; ALVES, J. L.; SABINO NETTO, A. C.; MERLINI, C. Estudo comparativo entre PETG e PLA para impressão 3D através de caracterização térmica, química e mecânica. **Matéria (Rio de Janeiro)**, v. 23, n. 4, e12267, 2018.

SILVA, D. F. et al. Influência dos parâmetros de impressão 3D nas propriedades mecânicas do PLA. In: CONGRESSO DE INOVAÇÃO, CIÊNCIA E TECNOLOGIA DO IFSP, 15., 2024. **Anais [...]**. IFSP, 2024. p. 1-8.

SOUZA, S. A. de. **Ensaios mecânicos de materiais metálicos**. 5. ed. São Paulo: Edgard Blucher, 1982.

SUN, Q.; RIZVI, G. M.; BELLEHUMEUR, C. T.; GU, P. Effect of processing conditions on the bonding quality of FDM polymer filaments. **Rapid Prototyping Journal**, v. 14, n. 2, p. 72-80, 2008.

TORRES, J. et al. Mechanical property optimization of FDM PLA in shear with multiple objectives. **JOM**, v. 68, n. 11, p. 1-10, 2016.

TURNER, B. N.; STRONG, R.; GOLD, S. A. A review of melt extrusion additive manufacturing processes: I. Process design and modeling. **Rapid Prototyping Journal**, v. 20, n. 3, p. 192-204, 2014.

TYMRAK, B. M.; KREIGER, M.; PEARCE, J. M. Mechanical properties of components fabricated with open-source 3-D printers under realistic environmental conditions. **Materials & Design**, v. 58, p. 242-246, 2014.

WONG, K. V.; HERNANDEZ, A. A review of additive manufacturing. **ISRN Mechanical Engineering**, v. 2012, art. 208760, 2012.

WOOL, R. P.; O'CONNOR, K. M. A theory of crack healing in polymers. **Journal of Applied Physics**, v. 52, n. 10, p. 5953-5963, 1981.

---

# APÊNDICE A — MODELO DE DADOS DA PLATAFORMA

O banco de dados relacional da plataforma (PostgreSQL) implementa o seguinte esquema, aqui resumido às colunas principais:

```
materials              (id, name, grade, supplier, notes)
print_profiles         (id, material_id → materials, code,
                        temperature_c, speed_mm_s, layer_height_mm,
                        extra_params jsonb)
test_runs              (id, print_profile_id → print_profiles,
                        test_number, test_code,
                        specimen_length_mm, specimen_width_mm,
                        specimen_thickness_mm, specimen_area_mm2,
                        raw_file_path, source_columns, metadata jsonb)
test_measurements      (id, test_run_id → test_runs, point_index,
                        tempo_s, alongamento_mm_mm, deformacao_mm_mm,
                        deformacao_mm, forca_n, tensao_pa, tensao_mpa)
ramberg_osgood_fits    (id, test_run_id → test_runs, method,
                        e_mpa, sigma_0_mpa, n, r2, rmse)
mechanical_properties  (id, test_run_id → test_runs, method,
                        yield_stress_mpa, ultimate_stress_mpa,
                        ductility_percent, resilience_mj_m3,
                        toughness_mj_m3)
users                  (id, name, email, password_salt, password_hash,
                        session_token_hash, session_expires_at)
```

Índices sobre (temperature_c, speed_mm_s), (test_run_id) e (test_run_id, tempo_s) garantem consultas eficientes para os módulos de comparação e predição; uma visão `v_measurements_export` desnormaliza perfil, ensaio e medições para exportação. Restrições de unicidade em (print_profile_id, test_number), (test_run_id, point_index) e (test_run_id, method) asseguram idempotência das importações.

---

# APÊNDICE B — ALGORITMO DE AJUSTE DO MODELO CONSTITUTIVO

Descrição em pseudocódigo do ajuste por busca estocástica multi-start implementado na plataforma:

```
entrada: pontos (εᵢ, σᵢ) da curva corrigida, até a tensão máxima
saída:   parâmetros (E, σ₀, n), RMSE, R²

sanitizar: remover não-finitos, σ ≤ 0, ε < 0; ordenar por ε
amostrar:  até 400 pontos uniformemente espaçados

estimativas iniciais:
  E⁽⁰⁾  ← média de σ/ε nos pontos com ε ≤ 0,002
  σ₀⁽⁰⁾ ← σ do ponto com ε mais próximo de 0,002
  n⁽⁰⁾  ← 8

para cada reinício r = 1..3:
    p ← (r = 1) ? estimativas iniciais
                : ponto aleatório dentro dos limites
    passo ← 0,25
    repetir 1000 vezes:
        candidato ← p · (1 + N(0,1) · passo)   [cada parâmetro]
        candidato ← limitar aos intervalos
                    E ∈ [500, 10000], σ₀ ∈ [5, 200], n ∈ [1, 30]
        se S(candidato) < S(p): p ← candidato
        passo ← passo · 0,9995
    reter melhor p entre reinícios

S(p) = Σᵢ [ε_RO(σᵢ; p) − εᵢ]²      (erro no espaço das deformações)
RMSE = √(S/N);  R² = 1 − S / Σᵢ(εᵢ − ε̄)²
```

O gerador pseudoaleatório é um gerador congruencial linear com semente fixa, garantindo reprodutibilidade bit a bit dos ajustes. A geração de curvas a partir dos parâmetros ajustados usa o método de Newton-Raphson da Seção 6.3.3.

---

# APÊNDICE C — RESULTADOS INDIVIDUAIS POR CORPO DE PROVA

**Tabela A1 — Resultados individuais dos 45 corpos de prova da série A** (área medida; propriedades após correção de acomodação; parâmetros do ajuste de Ramberg-Osgood por ensaio).

| CP | Área (mm²) | σmax (MPa) | E aparente (MPa) | εrup (%) | Tenacidade (MJ/m³) | E ajust. (MPa) | σ₀ (MPa) | n | R² |
|----|-----------|------------|-------------------|----------|---------------------|----------------|----------|------|------|
| A00-1 | 44,95 | 44,8 | 577 | 7,7 | 1,78 | 838 | 6,5 | 1,33 | 0,988 |
| A00-2 | 44,95 | 46,0 | 566 | 8,0 | 1,88 | 724 | 8,5 | 1,29 | 0,987 |
| A00-3 | 49,80 | 37,2 | 476 | 7,7 | 1,45 | 719 | 5,0 | 1,29 | 0,989 |
| A00-4 | 48,39 | 43,8 | 532 | 8,2 | 1,83 | 671 | 8,2 | 1,27 | 0,987 |
| A00-5 | 50,03 | 40,0 | 530 | 7,5 | 1,54 | 818 | 5,0 | 1,28 | 0,986 |
| A01-1 | 48,20 | 45,0 | 548 | 8,8 | 2,15 | 653 | 12,4 | 1,51 | 0,989 |
| A01-2 | 49,12 | 42,6 | 545 | 7,8 | 1,71 | 765 | 6,4 | 1,29 | 0,989 |
| A01-3 | 48,06 | 44,3 | 570 | 7,9 | 1,83 | 781 | 7,0 | 1,34 | 0,989 |
| A01-4 | 48,50 | 42,0 | 550 | 7,6 | 1,64 | 670 | 11,2 | 1,52 | 0,989 |
| A01-5 | 48,90 | 43,3 | 540 | 8,1 | 1,81 | 826 | 5,0 | 1,24 | 0,989 |
| A02-1 | 47,10 | 45,7 | 565 | 10,0 | 2,76 | 625 | 20,2 | 1,94 | 0,990 |
| A02-2 | 46,86 | 46,4 | 566 | 8,8 | 2,22 | 711 | 10,8 | 1,54 | 0,989 |
| A02-3 | 47,90 | 45,8 | 560 | 8,8 | 2,20 | 736 | 7,7 | 1,33 | 0,992 |
| A02-4 | 47,63 | 45,5 | 548 | 9,0 | 2,24 | 655 | 12,1 | 1,59 | 0,991 |
| A02-5 | 47,44 | 42,5 | 575 | 7,4 | 1,61 | 813 | 6,1 | 1,24 | 0,988 |
| A10-1 | 48,28 | 39,7 | 542 | 7,2 | 1,46 | 714 | 8,0 | 1,35 | 0,986 |
| A10-2 | 48,19 | 43,2 | 505 | 8,3 | 1,82 | 631 | 10,1 | 1,48 | 0,983 |
| A10-3 | 48,33 | 38,9 | 507 | 7,4 | 1,47 | 526 | 138,3 | 4,83 | 0,984 |
| A10-4 | 48,15 | 45,6 | 518 | 8,9 | 2,12 | 633 | 10,0 | 1,35 | 0,987 |
| A10-5 | 48,11 | 41,1 | 550 | 7,4 | 1,54 | 837 | 5,3 | 1,27 | 0,985 |
| A11-1 | 43,62 | 47,3 | 601 | 7,8 | 1,89 | 863 | 6,7 | 1,28 | 0,988 |
| A11-2 | 43,05 | 45,7 | 601 | 7,5 | 1,76 | 971 | 5,6 | 1,31 | 0,986 |
| A11-3 | 42,95 | 48,9 | 588 | 8,6 | 2,22 | 739 | 11,0 | 1,47 | 0,986 |
| A11-4 | 43,95 | 44,4 | 617 | 7,1 | 1,63 | 1046 | 5,0 | 1,27 | 0,985 |
| A11-5 | 44,19 | 35,7 | 720 | 5,9 | 1,06 | 600 | 128,8 | 8,53 | 0,999 |
| A12-1 | 42,37 | 44,1 | 586 | 7,4 | 1,68 | 762 | 9,3 | 1,43 | 0,984 |
| A12-2 | 43,00 | 46,3 | 573 | 8,0 | 1,91 | 760 | 8,2 | 1,34 | 0,986 |
| A12-3 | 42,31 | 45,0 | 589 | 7,5 | 1,71 | 752 | 8,7 | 1,27 | 0,987 |
| A12-4 | 41,79 | 47,7 | 578 | 8,1 | 1,98 | 676 | 13,9 | 1,41 | 0,989 |
| A12-5 | 41,83 | 47,3 | 602 | 8,0 | 1,96 | 834 | 7,3 | 1,31 | 0,989 |
| A20-1 | 42,50 | 45,2 | 603 | 7,5 | 1,73 | 860 | 7,3 | 1,37 | 0,987 |
| A20-2 | 42,12 | 39,8 | 530 | 7,3 | 1,49 | 660 | 9,1 | 1,32 | 0,986 |
| A20-3 | 42,41 | 39,7 | 603 | 6,6 | 1,34 | 673 | 16,3 | 1,57 | 0,993 |
| A20-4 | 42,28 | 47,1 | 590 | 7,9 | 1,90 | 885 | 5,9 | 1,26 | 0,987 |
| A20-5 | 42,60 | 45,1 | 586 | 7,6 | 1,74 | 749 | 8,7 | 1,27 | 0,987 |
| A21-1 | 42,38 | 40,1 | 576 | 6,8 | 1,37 | 711 | 10,4 | 1,40 | 0,987 |
| A21-2 | 42,86 | 41,7 | 566 | 7,3 | 1,56 | 743 | 8,5 | 1,39 | 0,986 |
| A21-3 | 42,05 | 45,1 | 589 | 7,5 | 1,73 | 803 | 8,0 | 1,35 | 0,986 |
| A21-4 | 42,96 | 43,9 | 587 | 7,4 | 1,65 | 934 | 5,0 | 1,23 | 0,988 |
| A21-5 | 42,38 | 45,1 | 591 | 7,4 | 1,69 | 801 | 7,2 | 1,23 | 0,989 |
| A22-1 | 42,21 | 48,5 | 665 | 7,4 | 1,85 | 1023 | 5,7 | 1,21 | 0,992 |
| A22-2 | 42,34 | 45,8 | 570 | 7,9 | 1,83 | 712 | 9,8 | 1,34 | 0,988 |
| A22-3 | 42,56 | 48,8 | 606 | 8,2 | 2,08 | 770 | 9,6 | 1,37 | 0,990 |
| A22-4 | 42,37 | 41,4 | 563 | 7,1 | 1,49 | 630 | 18,9 | 1,66 | 0,986 |
| A22-5 | 42,37 | 50,3 | 585 | 8,7 | 2,27 | 819 | 7,1 | 1,29 | 0,987 |

*Fonte: elaborada pelos autores, a partir do processamento da plataforma ResistencIA.*
