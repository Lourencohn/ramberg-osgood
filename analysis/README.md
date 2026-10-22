# Análise dos ensaios (resultados do TCC)

Os números, tabelas e figuras do TCC saem desta pasta. Tudo é gerado a partir dos arquivos brutos
da máquina (`data/T*/test_*/raw.txt`) e das dimensões medidas (`data/specimens.csv`), usando o
mesmo código da plataforma (`lib/tensile-processing.ts`, `lib/ramberg-osgood-fit.ts`,
`lib/training-data.ts`, `lib/metamodel.ts` e `lib/prediction.ts`).

## Como reproduzir

```bash
npm install
npm run analysis            # gera analysis/results/ e analysis/results-sem-A00-3/
npm run analysis:figures    # gera analysis/figures/ (requer Python 3 com numpy, pandas e matplotlib)
```

O ajuste de Ramberg-Osgood usa busca estocástica com semente fixa, derivada do código do corpo de
prova ou do perfil. Assim, rodar de novo produz os mesmos números.

## Etapas

1. **Processamento de cada ensaio** (`lib/tensile-processing.ts`): tensão = força ÷ área medida;
   deformação = deslocamento do travessão ÷ 50 mm. Depois vem a correção da região de acomodação
   (ASTM D638, Anexo A1) e a extração de propriedades: módulo aparente, tensão máxima, deformação
   na ruptura, escoamento por offset de 0,2%, resiliência e tenacidade. O módulo é **aparente**
   porque vem do deslocamento do travessão, sem extensômetro.

   Pontos não numéricos, com força negativa ou com deslocamento negativo são descartados. Na
   correção de acomodação, o trecho de maior inclinação é localizado por regressão linear em
   janelas deslizantes (20% dos pontos entre 2% e 65% da tensão máxima). A reta é prolongada até
   tensão zero, e esse ponto vira o novo zero de deformação. Os pontos anteriores ao início do
   trecho linear (desvio da reta maior que 2% da tensão máxima) formam a região de acomodação e
   são substituídos pela reta a partir da origem. O módulo aparente é a inclinação dessa janela, a
   deformação na ruptura é a última com tensão de pelo menos 50% da máxima, e a tenacidade é a
   área sob a curva corrigida até a ruptura (regra dos trapézios).

2. **Ajuste de Ramberg-Osgood**, por ensaio e por condição (cinco ensaios juntos), sobre o trecho
   ascendente da curva corrigida. É um ajuste por mínimos quadrados no espaço da deformação, com
   busca estocástica multipartida. A busca considera E entre 100 e 10.000 MPa, σ₀ entre 5 e
   200 MPa e n entre 1 e 30; o limite inferior de E fica abaixo dos módulos aparentes medidos
   (cerca de 480 MPa).
3. **Estatística** (`scripts/analysis/stats.ts`): médias e desvio padrão amostral (n − 1) por
   condição, e ANOVA de dois fatores com interação (soma de quadrados do tipo III, α = 0,05)
   para tensão máxima, módulo aparente, deformação na ruptura e tenacidade.
4. **Metamodelo e validação cruzada** (deixa uma condição de fora, LOOCV). Para cada uma das 9
   condições, a curva é prevista com as outras 8 e comparada com os ensaios. Duas rotas são
   avaliadas:
   - a rota da plataforma: regressão linear das curvas em temperatura e velocidade e reajuste de
     Ramberg-Osgood sobre a curva prevista. Em cada deformação normalizada u = ε / ε_max, a tensão
     prevista é o plano σ(u) = a(u) + b(u)·T + c(u)·v ajustado por mínimos quadrados às curvas
     ajustadas das condições de treinamento; a deformação máxima prevista sai do mesmo plano. Como
     a regressão é linear nos dados, isso equivale a uma combinação das curvas de treinamento com
     pesos que somam 1 e podem ser negativos, o que permite extrapolar;
   - a regressão direta da tensão máxima.

   Para comparação, também é calculado o erro de um preditor ingênuo (média das outras
   condições).

5. **Escolha do metamodelo** (`scripts/analysis/metamodel-comparison.ts`). Dez candidatos são
   comparados pelo erro entre a curva prevista e as curvas medidas dos corpos de prova da condição
   deixada de fora (RMSE em 201 deformações de zero até a maior deformação de pico; além do fim de
   uma curva vale a sua última tensão): médias ponderadas gaussianas (a da versão anterior e uma
   com ε ajustado), RBF gaussiana interpolante, spline de placa fina interpolante e suavizante, e
   regressões de 1 + v até a quadrática completa. Hiperparâmetros (ε, λ) são escolhidos por
   validação cruzada interna, sem ver a condição de teste. A comparação usa dois esquemas: deixar
   uma condição de fora (interpolação) e deixar um nível inteiro de temperatura ou velocidade de
   fora (extrapolação de um nível). Completam a escolha a seleção aninhada (o modelo é escolhido
   dentro de cada rodada), o teste de Wilcoxon pareado contra o modelo anterior, o teste F de falta
   de ajuste com o erro puro das réplicas, o teste de Bartlett de igualdade de variâncias e a
   comparação, nas condições já ensaiadas, entre repetir o ajuste da condição e usar a regressão
   (deixando um corpo de prova de fora).
6. **Superfície de resposta e exemplo**: tensão máxima prevista em uma grade de 190 a 220 °C e
   90 a 100 mm/s, e a curva prevista para 205 °C e 97 mm/s.

## Saídas (`results/`)

| Arquivo                             | Conteúdo                                                                          |
| ----------------------------------- | --------------------------------------------------------------------------------- |
| `corpos_de_prova.csv`               | propriedades e ajuste de Ramberg-Osgood de cada um dos 45 ensaios                 |
| `condicoes.csv`                     | média, desvio padrão e coeficiente de variação por condição                       |
| `anova.csv`, `medias_marginais.csv` | ANOVA de dois fatores e médias por nível de cada fator                            |
| `comparacao_emic.csv`               | plataforma × tabelas dos relatórios da máquina                                    |
| `treinamento.csv`                   | parâmetros de Ramberg-Osgood por condição (dados de treino do metamodelo)         |
| `validacao_cruzada.csv`             | resultado da validação cruzada por condição                                       |
| `superficie_resposta.csv`           | grade da superfície de resposta                                                   |
| `metamodelos_resumo.csv`            | erro médio de cada candidato a metamodelo nos dois esquemas de validação          |
| `metamodelos_por_condicao.csv`      | erro de cada candidato em cada condição prevista                                  |
| `metamodelos_selecao_aninhada.csv`  | modelo escolhido em cada rodada da seleção aninhada                               |
| `metamodelos_ensaiadas.csv`         | ajuste da própria condição × regressão, por corpo de prova deixado de fora        |
| `falta_de_ajuste.csv`               | teste F de falta de ajuste dos modelos lineares, por propriedade                  |
| `homogeneidade_variancias.csv`      | teste de Bartlett entre as condições, por propriedade                             |
| `curvas/*.csv`                      | curvas brutas, corrigidas, ajustadas, previstas na validação cruzada e do exemplo |
| `resumo.json`                       | números-resumo citados no texto (faixas, erros médios, exemplo)                   |

`results-sem-A00-3/` tem a mesma estrutura, mas com o ensaio A00-3 excluído (ensaiado a
2 mm/min; ver `data/README.md`).

## Observações sobre os resultados

- As curvas corrigidas são quase lineares até a ruptura. Por isso o ajuste de Ramberg-Osgood tem
  R² alto (≥ 0,998), mas os parâmetros σ₀ e n são pouco identificáveis: combinações muito
  diferentes produzem curvas praticamente iguais no trecho ensaiado. E e a forma da curva são
  bem determinados. σ₀ e n, isoladamente, não devem ser interpretados como propriedades do
  material.
- A interpolação é feita no espaço das curvas, e não diretamente nos parâmetros (E, σ₀, n). Na
  validação cruzada, interpolar os parâmetros errou mais do que o preditor ingênuo.
- A regressão linear foi adotada porque teve o menor erro de curva nos dois esquemas, foi a mais
  escolhida na seleção aninhada e passou no teste de falta de ajuste para tensão máxima,
  deformação na tensão máxima e tenacidade. Para esses três, o plano explica as médias das nove
  condições dentro do ruído das réplicas, e as variâncias entre condições não diferem (Bartlett),
  que são as hipóteses do teorema de Gauss-Markov. O módulo aparente reprova a falta de ajuste e
  tem variâncias desiguais. Nele a média ponderada anterior erra um pouco menos na validação
  cruzada (23,8 contra 25,7 MPa, diferença de 0,3% do módulo).
- Com 9 condições, a vantagem sobre a média ponderada anterior é consistente (melhor em 7 de 9
  condições e em 14 de 18 previsões de nível), mas só o esquema de nível fica abaixo de 5% no
  Wilcoxon (p = 0,048; sem o ensaio A00-3, p = 0,074), e as 18 previsões não são independentes. É
  evidência forte de que o modelo não piora e provável de que melhora, não prova definitiva.
- O domínio de entrada da plataforma vai uma distância entre níveis além dos ensaios (180 a
  230 °C, 85 a 105 mm/s). Essa é a distância de extrapolação medida no esquema de nível, e a
  alavancagem da regressão no canto mais distante desse domínio fica abaixo da maior alavancagem
  testada ali.
