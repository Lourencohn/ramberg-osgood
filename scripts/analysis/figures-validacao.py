"""Figuras do capítulo de validação externa (analysis/validacao -> analysis/figures)."""

from __future__ import annotations

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from matplotlib import ticker

ROOT = Path(__file__).resolve().parents[2]
VAL = ROOT / "analysis" / "validacao"
RESULTS = ROOT / "analysis" / "results"
OUT = ROOT / "analysis" / "figures"
OUT.mkdir(parents=True, exist_ok=True)

SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4"]
INK = "#1f1f1e"
INK_2 = "#52514e"
GRID = "#d9d8d4"
RAW = "#b9b8b2"
BAND = "#2a78d6"

plt.rcParams.update(
    {
        "font.family": "serif",
        "font.serif": ["Liberation Serif", "Times New Roman", "DejaVu Serif"],
        "font.size": 10,
        "axes.titlesize": 10,
        "axes.labelsize": 10,
        "axes.edgecolor": INK_2,
        "axes.labelcolor": INK,
        "axes.linewidth": 0.8,
        "xtick.color": INK_2,
        "ytick.color": INK_2,
        "xtick.labelsize": 9,
        "ytick.labelsize": 9,
        "legend.fontsize": 8.5,
        "legend.frameon": False,
        "axes.grid": True,
        "grid.color": GRID,
        "grid.linewidth": 0.6,
        "axes.spines.top": False,
        "axes.spines.right": False,
        "savefig.dpi": 220,
        "savefig.bbox": "tight",
        "lines.linewidth": 1.4,
    }
)

WIDTH = 6.3
CONDS = ["A12", "A20", "A21", "A22"]
LABEL = {"A12": "A12 (210 °C, 100 mm/s)", "A20": "A20 (220 °C, 90 mm/s)",
         "A21": "A21 (220 °C, 95 mm/s)", "A22": "A22 (220 °C, 100 mm/s)"}


def comma(x, _pos=None):
    return f"{x:g}".replace(".", ",")


def pct(x, _pos=None):
    return comma(round(100 * x, 6))


def style(ax, xlabel="Deformação (%)", ylabel="Tensão (MPa)"):
    ax.set_xlabel(xlabel)
    ax.set_ylabel(ylabel)
    ax.xaxis.set_major_formatter(ticker.FuncFormatter(pct))
    ax.yaxis.set_major_formatter(ticker.FuncFormatter(comma))


cond = pd.read_csv(VAL / "condicoes_validacao.csv").set_index("condicao")
cps = pd.read_csv(VAL / "corpos_de_prova_validacao.csv")
serie_a = pd.read_csv(RESULTS / "corpos_de_prova.csv")
corrigidas = pd.read_csv(RESULTS / "curvas" / "corrigidas.csv")

# --------------------------------------------------------------------------
# Figura: curvas previstas × curvas de validação, por condição
# --------------------------------------------------------------------------
fig, axes = plt.subplots(2, 2, figsize=(WIDTH, 5.4), sharex=True, sharey=True)
for ax, c in zip(axes.flat, CONDS):
    # série A (treinamento), corrigidas, em cinza
    for code, d in corrigidas[corrigidas.condicao == c].groupby("codigo"):
        ax.plot(d.deformacao, d.tensao_mpa, color=RAW, lw=0.9, zorder=1,
                label="série A" if code.endswith("-1") else None)
    # banda experimental esperada (média ± desvio das réplicas)
    esp = pd.read_csv(VAL / "curvas" / f"esperada_{c}.csv")
    dev = cond.loc[c, "tensao_max_esperada_desvio_mpa"]
    ax.fill_between(esp.deformacao, esp.tensao_mpa - dev, esp.tensao_mpa + dev,
                    color=BAND, alpha=0.12, lw=0, zorder=2)
    # curva prevista (Ramberg-Osgood sobre a regressão)
    prev = pd.read_csv(VAL / "curvas" / f"prevista_{c}.csv")
    ax.plot(prev.deformacao, prev.tensao_mpa, color=INK, lw=1.6, zorder=4, label="prevista")
    # validação
    for i, code in enumerate(cps[cps.condicao == c].codigo):
        d = pd.read_csv(VAL / "curvas" / f"validacao_{code}.csv")
        ax.plot(d.deformacao, d.tensao_mpa, color=SERIES[i], lw=1.2, zorder=3, label=code)
    ax.set_title(LABEL[c], loc="left")
    ax.set_xlim(0, 0.095)
    ax.set_ylim(0, 52)
    style(ax)
    ax.legend(loc="lower right", ncol=2, handlelength=1.6)
for ax in axes[0]:
    ax.set_xlabel("")
for ax in axes[:, 1]:
    ax.set_ylabel("")
fig.tight_layout()
fig.savefig(OUT / "validacao_externa_curvas.png")
plt.close(fig)

# --------------------------------------------------------------------------
# Figura: tensão máxima e força máxima, previsto × série A × validação
# --------------------------------------------------------------------------
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(WIDTH, 2.9))
x = np.arange(len(CONDS))
w = 0.26
pred = cond.loc[CONDS, "tensao_max_prevista_ro_mpa"].values
esp_dev = cond.loc[CONDS, "tensao_max_esperada_desvio_mpa"].values
a_mean = cond.loc[CONDS, "serie_a_tensao_max_media_mpa"].values
a_sd = cond.loc[CONDS, "serie_a_tensao_max_dp_mpa"].values
v_mean = cond.loc[CONDS, "validacao_tensao_max_media_mpa"].values
v_sd = cond.loc[CONDS, "validacao_tensao_max_dp_mpa"].values
v_areaA = cond.loc[CONDS, "validacao_tensao_max_area_serie_a_media_mpa"].values

ax1.bar(x - w, pred, w, color=INK, label="prevista (Ramberg-Osgood)")
ax1.errorbar(x - w, pred, yerr=esp_dev, fmt="none", ecolor=INK_2, capsize=2, lw=0.8)
ax1.bar(x, a_mean, w, color=RAW, label="série A (treinamento)")
ax1.errorbar(x, a_mean, yerr=a_sd, fmt="none", ecolor=INK_2, capsize=2, lw=0.8)
ax1.bar(x + w, v_mean, w, color=SERIES[1], label="validação (2026)")
ax1.errorbar(x + w, v_mean, yerr=v_sd, fmt="none", ecolor=INK_2, capsize=2, lw=0.8)
ax1.scatter(x + w, v_areaA, marker="_", s=160, color=INK, zorder=5,
            label="validação com área da série A")
ax1.set_xticks(x)
ax1.set_xticklabels(CONDS)
ax1.set_ylim(0, 56)
ax1.set_ylabel("Tensão máxima (MPa)")
ax1.yaxis.set_major_formatter(ticker.FuncFormatter(comma))
ax1.set_title("(a) tensão máxima", loc="left")
ax1.legend(loc="upper center", bbox_to_anchor=(0.5, -0.18), ncol=2, handlelength=1.2)

a_force = cond.loc[CONDS, "serie_a_forca_max_media_n"].values
v_force = cond.loc[CONDS, "validacao_forca_max_media_n"].values
a_fsd = serie_a[serie_a.condicao.isin(CONDS)].groupby("condicao").forca_max_n.std().loc[CONDS].values
v_fsd = cps.groupby("condicao").forca_max_n.std().loc[CONDS].values
ax2.bar(x - w / 2, a_force, w, color=RAW, label="série A")
ax2.errorbar(x - w / 2, a_force, yerr=a_fsd, fmt="none", ecolor=INK_2, capsize=2, lw=0.8)
ax2.bar(x + w / 2, v_force, w, color=SERIES[1], label="validação")
ax2.errorbar(x + w / 2, v_force, yerr=v_fsd, fmt="none", ecolor=INK_2, capsize=2, lw=0.8)
ax2.set_xticks(x)
ax2.set_xticklabels(CONDS)
ax2.set_ylim(0, 2300)
ax2.set_ylabel("Força máxima (N)")
ax2.yaxis.set_major_formatter(ticker.FuncFormatter(comma))
ax2.set_title("(b) força máxima", loc="left")
ax2.legend(loc="upper center", bbox_to_anchor=(0.5, -0.18), ncol=2, handlelength=1.2)
fig.tight_layout()
fig.savefig(OUT / "validacao_externa_tensao_forca.png")
plt.close(fig)

# --------------------------------------------------------------------------
# Figura: previsto × medido (dispersão), LOOCV interno e validação externa
# --------------------------------------------------------------------------
loocv = pd.read_csv(RESULTS / "validacao_cruzada.csv").set_index("condicao")
fig, ax = plt.subplots(figsize=(3.6, 3.4))
lim = (28, 50)
ax.plot(lim, lim, color=GRID, lw=1, zorder=1)
ax.scatter(loocv.tensao_max_real_mpa, loocv.tensao_max_prevista_curva_mpa, s=28,
           facecolor="white", edgecolor=INK, zorder=3, label="LOOCV interno (série A)")
ax.errorbar(v_mean, pred, xerr=v_sd, yerr=esp_dev, fmt="o", color=SERIES[1], ms=5,
            ecolor=INK_2, capsize=2, lw=0.8, zorder=4, label="validação externa (2026)")
OFFSETS = {"A12": (-22, -12), "A20": (6, -10), "A21": (6, -10), "A22": (6, 4)}
for c, xm, yp in zip(CONDS, v_mean, pred):
    ax.annotate(c, (xm, yp), xytext=OFFSETS[c], textcoords="offset points", fontsize=8, color=INK_2)
ax.set_xlim(lim)
ax.set_ylim(lim)
ax.set_xlabel("Tensão máxima medida (MPa)")
ax.set_ylabel("Tensão máxima prevista (MPa)")
ax.xaxis.set_major_formatter(ticker.FuncFormatter(comma))
ax.yaxis.set_major_formatter(ticker.FuncFormatter(comma))
ax.set_aspect("equal")
ax.legend(loc="upper left", handlelength=1.2)
fig.tight_layout()
fig.savefig(OUT / "validacao_externa_dispersao.png")
plt.close(fig)
print("ok")
