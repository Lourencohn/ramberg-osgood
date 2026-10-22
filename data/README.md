# Dados dos ensaios de tração (série A, PLA)

Esta pasta guarda os dados reais usados no TCC e na plataforma: 45 corpos de prova de PLA impressos
em 9 condições (3 temperaturas × 3 velocidades, 5 corpos por condição) e ensaiados em tração
(ASTM D638) numa máquina EMIC. Os arquivos vieram da versão inicial do projeto (em Python), onde
estavam junto com as planilhas de tratamento.

| Código | Temperatura | Velocidade | Pasta |
| ------ | ----------- | ---------- | ----- |
| A00 | 190 °C | 90 mm/s | `T190_V90` |
| A01 | 190 °C | 95 mm/s | `T190_V95` |
| A02 | 190 °C | 100 mm/s | `T190_V100` |
| A10 | 210 °C | 90 mm/s | `T210_V90` |
| A11 | 210 °C | 95 mm/s | `T210_V95` |
| A12 | 210 °C | 100 mm/s | `T210_V100` |
| A20 | 220 °C | 90 mm/s | `T220_V90` |
| A21 | 220 °C | 95 mm/s | `T220_V95` |
| A22 | 220 °C | 100 mm/s | `T220_V100` |

O corpo de prova `Axy-k` está em `T<temperatura>_V<velocidade>/test_k/`.

## Arquivos

- `T*/test_*/raw.txt`: arquivo exportado pelo software da máquina, sem nenhuma alteração.
  Três colunas separadas por tabulação: tempo (s), deslocamento do travessão (mm) e força (N).
  O cabeçalho chama a segunda coluna de "Deformação(mm)", mas ela é o deslocamento. Codificação
  latin-1, fim de linha CRLF.
- `specimens.csv`: uma linha por corpo de prova, com as dimensões usadas no cálculo da tensão.

  | Coluna | Conteúdo |
  | ------ | -------- |
  | `code` | código do corpo de prova (ex.: `A12-4`) |
  | `profile`, `test` | pasta e número do ensaio |
  | `temperature_c`, `speed_mm_s` | parâmetros de impressão |
  | `gauge_length_mm` | comprimento de referência usado na deformação (50 mm) |
  | `width_mm`, `thickness_mm` | largura e espessura medidas (planilha, células J2 e K2) |
  | `area_mm2` | área da seção usada no cálculo da tensão |
  | `area_source` | de onde veio a área |
  | `crosshead_speed_mm_min` | velocidade do travessão no ensaio |
  | `notes` | observações do relatório ou da planilha |

- `emic/A*.pdf`: relatórios gerados pela máquina, um por condição.
- `emic/relatorios.csv`: valores das tabelas desses relatórios (força máxima, força e tensão na
  ruptura, tensão de escoamento e módulo), transcritos para comparação com o processamento da
  plataforma. O relatório de A11 só tem o gráfico, sem tabela, por isso A11 não aparece no CSV.
- `planilhas/*.xlsx`: planilhas de tratamento originais, mantidas apenas como registro. A
  plataforma não lê nenhum valor delas além das dimensões já copiadas para `specimens.csv`.

## Problemas encontrados nas planilhas e como foram tratados

1. **Área errada em 12 abas.** Nas abas A11-3, A12-1 a A12-5, A20-1 a A20-5 e A21-2, a tensão
   foi calculada com 13,35 mm × 2,35 mm (31,37 mm², células J3 e K3), e não com as dimensões
   medidas do próprio corpo de prova (J2 e K2, entre 12,8 e 13,1 mm × 3,3 mm). Nessas abas a
   coluna de tensão fica cerca de 35% acima do valor real. Por isso a tensão é sempre recalculada
   a partir da força do arquivo bruto e da área de `specimens.csv`.
2. **A00-1 e A00-2 sem aba.** A planilha de A00 não tem esses dois ensaios, então suas dimensões
   não foram registradas. A área usada é a do relatório EMIC (força na ruptura ÷ tensão na
   ruptura): 52,48 mm² para A00-1 e 48,62 mm² para A00-2.
3. **A00-3 ensaiado a 2 mm/min.** Todos os outros ensaios foram feitos a 5 mm/min. A diferença
   está anotada no relatório EMIC e é confirmada pela taxa de deslocamento do arquivo bruto. O
   ensaio é mantido no conjunto, e a análise também é rodada sem ele
   (`analysis/results-sem-A00-3/`).
4. **Notas registradas.** A22-1: a planilha anota uma força de 1000 N aplicada ao prender a garra.
   A11-5: ruptura precoce. As duas notas estão em `specimens.csv`; os ensaios não foram
   descartados.

## Arquivos `processed.csv` antigos

As versões anteriores do repositório tinham, em cada `test_*/`, um `processed.csv` copiado das
planilhas. Eles herdavam os problemas acima e foram removidos; continuam disponíveis no histórico
do git. A importação (`npm run db:import`) e a análise (`npm run analysis`) partem sempre de
`raw.txt` e `specimens.csv`.
