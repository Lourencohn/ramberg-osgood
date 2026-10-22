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
   - a rota da plataforma: interpolação das curvas por funções de base radial (RBF) e reajuste
     de Ramberg-Osgood sobre a curva interpolada. A curva prevista é a média ponderada, com pesos
     RBF gaussianos, das curvas ajustadas de cada condição de treinamento, tomadas na deformação
     normalizada u = ε / ε_max; a deformação máxima prevista é a média ponderada das deformações
     máximas. Grandezas escalares interpoladas ficam limitadas ao intervalo dos valores de
     treinamento;
   - a interpolação direta da tensão máxima.

   Para comparação, também é calculado o erro de um preditor ingênuo (média das outras
   condições).

5. **Superfície de resposta e exemplo**: tensão máxima prevista em uma grade de 190 a 220 °C e
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
