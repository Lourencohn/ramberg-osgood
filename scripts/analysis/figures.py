from __future__ import annotations

import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from matplotlib import ticker
from matplotlib.patches import FancyBboxPatch

ROOT = Path(__file__).resolve().parents[2]
RESULTS = ROOT / "analysis" / "results"
OUT = ROOT / "analysis" / "figures"
OUT.mkdir(parents=True, exist_ok=True)

SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4"]
INK = "#1f1f1e"
INK_2 = "#52514e"
GRID = "#d9d8d4"
MODEL = "#1f1f1e"
RAW = "#a3a29c"
LINESTYLES = ["-", "--", "-.", ":", (0, (5, 1, 1, 1))]

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
CONDITIONS = ["A00", "A01", "A02", "A10", "A11", "A12", "A20", "A21", "A22"]
TEMPS = {"0": 190, "1": 210, "2": 220}
SPEEDS = {"0": 90, "1": 95, "2": 100}


def comma(x, _pos=None):
    text = f"{x:g}"
    return text.replace(".", ",")


def pct(x, _pos=None):
    return comma(round(100 * x, 6))


def style_axes(ax, xlabel="Deformação (%)", ylabel="Tensão (MPa)", strain_axis=True):
    ax.set_xlabel(xlabel)
    ax.set_ylabel(ylabel)
    if strain_axis:
        ax.xaxis.set_major_formatter(ticker.FuncFormatter(pct))
    else:
        ax.xaxis.set_major_formatter(ticker.FuncFormatter(comma))
    ax.yaxis.set_major_formatter(ticker.FuncFormatter(comma))


def label(cond: str) -> str:
    return f"{cond} ({TEMPS[cond[1]]} °C; {SPEEDS[cond[2]]} mm/s)"


def save(fig, name: str):
    path = OUT / name
    fig.savefig(path)
    plt.close(fig)
    print("figura:", path.relative_to(ROOT))


tests = pd.read_csv(RESULTS / "corpos_de_prova.csv")
conditions = pd.read_csv(RESULTS / "condicoes.csv")
training = pd.read_csv(RESULTS / "treinamento.csv")
emic = pd.read_csv(RESULTS / "comparacao_emic.csv")
cv = pd.read_csv(RESULTS / "validacao_cruzada.csv")
surface = pd.read_csv(RESULTS / "superficie_resposta.csv")
summary = json.loads((RESULTS / "resumo.json").read_text())
corrected = pd.read_csv(RESULTS / "curvas" / "corrigidas.csv")
raw = pd.read_csv(RESULTS / "curvas" / "brutas.csv")
fits_test = pd.read_csv(RESULTS / "curvas" / "ajustes_por_ensaio.csv")
fits_cond = pd.read_csv(RESULTS / "curvas" / "ajustes_por_condicao.csv")
cv_curves = pd.read_csv(RESULTS / "curvas" / "validacao_cruzada_curvas.csv")
example = pd.read_csv(RESULTS / "curvas" / "exemplo_205C_97mms.csv")


def ascending(df: pd.DataFrame) -> pd.DataFrame:
    i = int(df["tensao_mpa"].to_numpy().argmax())
    return df.iloc[: i + 1]


def fig_typical(code="A12-4"):
    t = tests.set_index("codigo").loc[code]
    c = corrected[corrected.codigo == code]
    r = raw[raw.codigo == code]
    E = t.modulo_aparente_mpa
    offset = t.deslocamento_acomodacao
    fig, ax = plt.subplots(figsize=(WIDTH, 3.6))
    ax.plot(r.deformacao, r.tensao_mpa, color=RAW, lw=1.2, label="registro bruto (deslocamento do travessão)")
    ax.plot(c.deformacao + offset, c.tensao_mpa, color=SERIES[0], lw=1.8, label="curva corrigida (eixo deslocado)")
    eps = np.linspace(offset, offset + t.tensao_max_mpa / E * 1.05, 50)
    ax.plot(eps, E * (eps - offset), color=MODEL, ls="--", lw=1, label=f"reta do trecho linear (E = {comma(round(E))} MPa)")
    eps2 = np.linspace(offset + 0.002, offset + 0.002 + t.tensao_max_mpa / E * 1.05, 50)
    ax.plot(eps2, E * (eps2 - offset - 0.002), color=MODEL, ls=":", lw=1, label="reta de offset de 0,2%")
    ax.plot([offset], [0], "o", color=MODEL, ms=5)
    ax.annotate("novo zero de deformação", (offset, 0), xytext=(0.004, 12), fontsize=8.5, color=INK,
                arrowprops=dict(arrowstyle="-", color=INK_2, lw=0.7))
    imax = c.tensao_mpa.idxmax()
    ax.plot([c.loc[imax, "deformacao"] + offset], [c.loc[imax, "tensao_mpa"]], "s", color=SERIES[1], ms=5)
    ax.annotate(f"tensão máxima {comma(round(t.tensao_max_mpa, 1))} MPa", (c.loc[imax, "deformacao"] + offset, c.loc[imax, "tensao_mpa"]),
                xytext=(-150, 4), textcoords="offset points", fontsize=8.5, color=INK)
    ax.annotate("região de\nacomodação", (offset * 0.55, 1.2), ha="center", fontsize=8.5, color=INK_2)
    ax.set_xlim(0, (c.deformacao.max() + offset) * 1.18)
    ax.set_ylim(0, t.tensao_max_mpa * 1.12)
    style_axes(ax, xlabel="Deformação de engenharia (%)")
    ax.legend(loc="lower right")
    ax.set_title(f"Ensaio {code} ({TEMPS[code[1]]} °C; {SPEEDS[code[2]]} mm/s)", loc="left", color=INK)
    save(fig, "curva_tipica_anotada.png")


def ro_strain(stress, E, s0, n):
    return stress / E + 0.002 * (stress / s0) ** n


def fig_n_effect():
    E, s0 = 590.0, 40.0
    fig, ax = plt.subplots(figsize=(WIDTH, 3.2))
    sigma = np.linspace(0, 48, 400)
    for i, n in enumerate([1, 3, 8, 20]):
        ax.plot(ro_strain(sigma, E, s0, n), sigma, color=SERIES[i], ls=LINESTYLES[i], label=f"n = {n}")
    ax.plot(sigma / E, sigma, color=RAW, lw=1, label="parcela elástica (σ/E)")
    ax.axhline(s0, color=INK_2, lw=0.7, ls=":")
    ax.text(0.001, s0 + 0.8, "σ₀ = 40 MPa", fontsize=8.5, color=INK_2)
    ax.set_xlim(0, 0.12)
    ax.set_ylim(0, 50)
    style_axes(ax)
    ax.legend(loc="lower right")
    ax.set_title("Modelo de Ramberg-Osgood com E = 590 MPa e σ₀ = 40 MPa", loc="left", color=INK)
    save(fig, "modelo_efeito_n.png")


def fig_flow():
    fig, ax = plt.subplots(figsize=(WIDTH, 2.9))
    ax.set_axis_off()
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 44)
    boxes = [
        (1, 24, 17, 15, "Arquivo bruto\nda máquina\n(raw.txt)"),
        (1, 4, 17, 15, "Dimensões\nmedidas\n(specimens.csv)"),
        (24, 12, 18, 19, "Processamento\nσ = F/A₀\nε = ΔL/L₀\ncorreção da\nacomodação"),
        (48, 27, 18, 13, "Propriedades\npor ensaio"),
        (48, 4, 18, 15, "Ajuste de\nRamberg-Osgood\npor condição"),
        (72, 4, 26, 15, "Metamodelo RBF\n(interpolação das\ncurvas por T e v)"),
        (72, 27, 26, 13, "Predição, comparação\ne visualização"),
    ]
    for x, y, w, h, text in boxes:
        ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.4,rounding_size=1.2",
                                    fc="#eef4fc", ec=SERIES[0], lw=1))
        ax.text(x + w / 2, y + h / 2, text, ha="center", va="center", fontsize=8.5, color=INK)
    arrows = [((18.6, 31.5), (23.4, 23)), ((18.6, 11.5), (23.4, 19)), ((42.6, 23.5), (47.4, 32)),
              ((42.6, 19.5), (47.4, 12)), ((66.6, 11.5), (71.4, 11.5)), ((85, 19.6), (85, 26.4))]
    for start, end in arrows:
        ax.annotate("", end, start, arrowprops=dict(arrowstyle="-|>", color=INK_2, lw=1))
    ax.text(57, 42.5, "banco PostgreSQL (test_runs, test_measurements, mechanical_properties, ramberg_osgood_fits)",
            ha="center", fontsize=8, color=INK_2)
    save(fig, "fluxo_plataforma.png")


def fig_raw_vs_corrected(cond="A12"):
    fig, axes = plt.subplots(1, 2, figsize=(WIDTH, 2.9), sharey=True)
    codes = sorted(tests[tests.condicao == cond].codigo)
    for i, code in enumerate(codes):
        axes[0].plot(raw[raw.codigo == code].deformacao, raw[raw.codigo == code].tensao_mpa,
                     color=SERIES[i], ls=LINESTYLES[i], label=code)
        axes[1].plot(corrected[corrected.codigo == code].deformacao, corrected[corrected.codigo == code].tensao_mpa,
                     color=SERIES[i], ls=LINESTYLES[i], label=code)
    axes[0].set_title("(a) registros brutos", loc="left", color=INK)
    axes[1].set_title("(b) após a correção de acomodação", loc="left", color=INK)
    style_axes(axes[0])
    style_axes(axes[1], ylabel="")
    for ax in axes:
        ax.set_xlim(0, None)
        ax.set_ylim(0, None)
    axes[1].legend(loc="lower right")
    save(fig, f"curvas_brutas_corrigidas_{cond}.png")


def fig_grid():
    fig, axes = plt.subplots(3, 3, figsize=(WIDTH, 6.2), sharex=True, sharey=True)
    for cond in CONDITIONS:
        ax = axes[int(cond[1]), int(cond[2])]
        codes = sorted(tests[tests.condicao == cond].codigo)
        for i, code in enumerate(codes):
            c = corrected[corrected.codigo == code]
            ax.plot(c.deformacao, c.tensao_mpa, color=SERIES[i], lw=1.1, ls=LINESTYLES[i], label=code[-1])
        f = fits_cond[fits_cond.condicao == cond]
        ax.plot(f.deformacao, f.tensao_mpa, color=MODEL, lw=1.1, ls="--")
        row = conditions.set_index("condicao").loc[cond]
        ax.set_title(f"{cond}: {TEMPS[cond[1]]} °C, {SPEEDS[cond[2]]} mm/s", fontsize=9, loc="left", color=INK)
        ax.text(0.97, 0.06, f"σmáx = {comma(round(row.tensao_max_media_mpa, 1))} MPa", transform=ax.transAxes,
                ha="right", fontsize=8, color=INK_2)
        ax.xaxis.set_major_formatter(ticker.FuncFormatter(pct))
        ax.yaxis.set_major_formatter(ticker.FuncFormatter(comma))
    for ax in axes[-1]:
        ax.set_xlabel("Deformação (%)")
    for ax in axes[:, 0]:
        ax.set_ylabel("Tensão (MPa)")
    axes[0, 0].set_xlim(0, 0.105)
    axes[0, 0].set_ylim(0, 55)
    handles = [plt.Line2D([], [], color=SERIES[i], ls=LINESTYLES[i]) for i in range(5)]
    handles.append(plt.Line2D([], [], color=MODEL, ls="--"))
    fig.legend(handles, ["CP 1", "CP 2", "CP 3", "CP 4", "CP 5", "ajuste de Ramberg-Osgood da condição"],
               loc="lower center", ncol=6, bbox_to_anchor=(0.5, -0.02), fontsize=8)
    fig.tight_layout(rect=(0, 0.03, 1, 1))
    save(fig, "curvas_por_condicao.png")


def fig_emic():
    fig, ax = plt.subplots(figsize=(WIDTH, 2.9))
    x = np.arange(len(CONDITIONS))
    w = 0.38
    plat = emic.set_index("condicao").loc[CONDITIONS]
    ax.bar(x - w / 2 - 0.01, plat.tensao_max_plataforma_mpa, w, color=SERIES[0], label="plataforma (tensão máxima)")
    rep = plat.tensao_ruptura_relatorio_mpa
    ax.bar(x[rep.notna()] + w / 2 + 0.01, rep[rep.notna()], w, color=SERIES[1], label="relatório EMIC (tensão na ruptura)")
    ax.text(x[CONDITIONS.index("A11")] + w / 2, 2, "sem\ntabela", ha="center", fontsize=7.5, color=INK_2)
    ax.set_xticks(x, CONDITIONS)
    ax.set_ylabel("Tensão (MPa)")
    ax.yaxis.set_major_formatter(ticker.FuncFormatter(comma))
    ax.set_ylim(0, 55)
    ax.legend(loc="upper left", ncol=2)
    ax.grid(axis="x", visible=False)
    save(fig, "comparacao_emic.png")


def fig_interaction():
    fig, axes = plt.subplots(1, 3, figsize=(WIDTH, 2.7))
    props = [("tensao_max_mpa", "Tensão máxima (MPa)"), ("modulo_aparente_mpa", "Módulo aparente (MPa)"),
             ("deformacao_ruptura", "Deformação na ruptura (%)")]
    for ax, (col, ylabel) in zip(axes, props):
        for i, temp in enumerate([190, 210, 220]):
            sub = tests[tests.temperatura_c == temp].groupby("velocidade_mm_s")[col]
            m = sub.mean()
            se = sub.std(ddof=1) / np.sqrt(sub.count())
            scale = 100 if col == "deformacao_ruptura" else 1
            ax.errorbar(m.index + (i - 1) * 0.35, m.values * scale, yerr=se.values * scale, color=SERIES[i],
                        marker="os^"[i], ms=5, capsize=2, lw=1.2, ls=LINESTYLES[i], label=f"{temp} °C")
        ax.set_xticks([90, 95, 100])
        ax.set_xlabel("Velocidade (mm/s)")
        ax.set_ylabel(ylabel)
        ax.yaxis.set_major_formatter(ticker.FuncFormatter(comma))
    axes[0].legend(loc="lower right")
    fig.tight_layout()
    save(fig, "interacao_temperatura_velocidade.png")


def fig_fit(cond="A12"):
    fig, ax = plt.subplots(figsize=(WIDTH, 3.0))
    codes = sorted(tests[tests.condicao == cond].codigo)
    for i, code in enumerate(codes):
        c = ascending(corrected[corrected.codigo == code])
        ax.plot(c.deformacao, c.tensao_mpa, "o", ms=2.2, color=SERIES[i], alpha=0.75, label=code)
    f = fits_cond[fits_cond.condicao == cond]
    tr = training.set_index("perfil")
    profile = f"T{TEMPS[cond[1]]}_V{SPEEDS[cond[2]]}"
    p = tr.loc[profile]
    ax.plot(f.deformacao, f.tensao_mpa, color=MODEL, lw=1.6,
            label=f"ajuste (E = {comma(round(p.E_mpa))} MPa; σ₀ = {comma(round(p.sigma0_mpa, 1))} MPa; n = {comma(round(p.n, 2))})")
    row = conditions.set_index("condicao").loc[cond]
    ax.text(0.98, 0.06, f"R² médio dos ajustes por ensaio = {comma(round(row.ro_r2_medio, 4))}", transform=ax.transAxes,
            ha="right", fontsize=8.5, color=INK_2)
    ax.set_xlim(0, None)
    ax.set_ylim(0, None)
    style_axes(ax)
    ax.legend(loc="upper left", fontsize=8)
    save(fig, f"ajuste_ramberg_osgood_{cond}.png")


def fig_surface():
    pivot = surface.pivot(index="velocidade_mm_s", columns="temperatura_c", values="tensao_max_curva_mpa")
    T, V = np.meshgrid(pivot.columns.values, pivot.index.values)
    fig, ax = plt.subplots(figsize=(WIDTH, 3.3))
    levels = np.arange(np.floor(pivot.values.min()), np.ceil(pivot.values.max()) + 0.25, 0.5)
    cs = ax.contourf(T, V, pivot.values, levels=levels, cmap="Blues")
    lines = ax.contour(T, V, pivot.values, levels=levels[::2], colors=INK_2, linewidths=0.5)
    ax.clabel(lines, fmt=lambda v: comma(round(v, 1)), fontsize=7)
    for cond in CONDITIONS:
        row = conditions.set_index("condicao").loc[cond]
        ax.plot(row.temperatura_c, row.velocidade_mm_s, "o", color=SERIES[1], ms=6, mec="white", mew=1, clip_on=False,
                zorder=5)
        right_edge = row.temperatura_c >= 220
        top_edge = row.velocidade_mm_s >= 100
        ax.annotate(f"{comma(round(row.tensao_max_media_mpa, 1))}", (row.temperatura_c, row.velocidade_mm_s),
                    xytext=(-6 if right_edge else 6, -12 if top_edge else 5), textcoords="offset points",
                    ha="right" if right_edge else "left", fontsize=8, color=INK,
                    bbox=dict(boxstyle="round,pad=0.15", fc="white", ec="none", alpha=0.8))
    cbar = fig.colorbar(cs, ax=ax)
    cbar.set_label("Tensão máxima prevista (MPa)")
    cbar.ax.yaxis.set_major_formatter(ticker.FuncFormatter(comma))
    ax.set_xlabel("Temperatura de extrusão (°C)")
    ax.set_ylabel("Velocidade de impressão (mm/s)")
    ax.grid(False)
    ax.xaxis.set_major_formatter(ticker.FuncFormatter(comma))
    save(fig, "superficie_tensao_maxima.png")


def fig_cv_curves(conds=("A00", "A12", "A22")):
    fig, axes = plt.subplots(1, len(conds), figsize=(WIDTH, 2.7), sharey=True)
    for ax, cond in zip(axes, conds):
        for code in sorted(tests[tests.condicao == cond].codigo):
            c = ascending(corrected[corrected.codigo == code])
            ax.plot(c.deformacao, c.tensao_mpa, color=RAW, lw=1)
        f = fits_cond[fits_cond.condicao == cond]
        ax.plot(f.deformacao, f.tensao_mpa, color=SERIES[0], lw=1.5, label="ajuste com a condição")
        p = cv_curves[cv_curves.condicao == cond]
        ax.plot(p.deformacao, p.tensao_mpa, color=SERIES[1], lw=1.5, ls="--", label="predição sem a condição")
        ax.set_title(f"{cond}: {TEMPS[cond[1]]} °C, {SPEEDS[cond[2]]} mm/s", loc="left", fontsize=9, color=INK)
        style_axes(ax, ylabel="Tensão (MPa)" if ax is axes[0] else "")
        ax.set_xlim(0, 0.1)
        ax.set_ylim(0, 55)
    handles = [plt.Line2D([], [], color=RAW), plt.Line2D([], [], color=SERIES[0]),
               plt.Line2D([], [], color=SERIES[1], ls="--")]
    fig.legend(handles, ["ensaios (trecho ascendente)", "ajuste com a condição no treinamento",
                         "predição com a condição fora do treinamento"],
               loc="lower center", ncol=3, bbox_to_anchor=(0.5, -0.06), fontsize=8)
    fig.tight_layout(rect=(0, 0.05, 1, 1))
    save(fig, "validacao_cruzada_curvas.png")


def fig_cv_scatter():
    fig, ax = plt.subplots(figsize=(4.2, 3.6))
    real = cv.tensao_max_real_mpa
    pred = cv.tensao_max_prevista_curva_mpa
    sd = conditions.set_index("condicao").loc[cv.condicao].tensao_max_dp_mpa.values
    lo, hi = 36, 52
    ax.plot([lo, hi], [lo, hi], color=INK_2, lw=0.8, ls="--", label="predição perfeita")
    ax.errorbar(real, pred, xerr=sd, fmt="o", color=SERIES[0], ms=5, capsize=2, lw=1,
                label="condição (barra: desvio padrão dos ensaios)")
    placement = {"A00": (-5, 4, "right"), "A01": (-5, -10, "right"), "A02": (3, 5, "left"), "A10": (4, -11, "left"),
                 "A11": (-5, 5, "right"), "A12": (4, 5, "left"), "A20": (4, -11, "left"), "A21": (-5, 5, "right"),
                 "A22": (4, -11, "left")}
    for cond, x, y in zip(cv.condicao, real, pred):
        dx, dy, ha = placement.get(cond, (4, 3, "left"))
        ax.annotate(cond, (x, y), xytext=(dx, dy), textcoords="offset points", ha=ha, fontsize=7.5, color=INK)
    ax.set_xlim(lo, hi)
    ax.set_ylim(lo, hi)
    ax.set_aspect("equal")
    ax.set_xlabel("Tensão máxima medida (MPa)")
    ax.set_ylabel("Tensão máxima prevista (MPa)")
    for axis in (ax.xaxis, ax.yaxis):
        axis.set_major_formatter(ticker.FuncFormatter(comma))
    mae = summary["validacao_cruzada"]["tensao_max_curva"]["mae"]
    ax.text(0.97, 0.05, f"erro absoluto médio = {comma(round(mae, 2))} MPa", transform=ax.transAxes, ha="right",
            fontsize=8.5, color=INK_2)
    ax.legend(loc="upper left", fontsize=7.5)
    save(fig, "validacao_cruzada_dispersao.png")


def fig_example():
    fig, ax = plt.subplots(figsize=(WIDTH, 3.0))
    for i, cond in enumerate(["A01", "A02", "A11", "A12"]):
        for j, code in enumerate(sorted(tests[tests.condicao == cond].codigo)):
            c = ascending(corrected[corrected.codigo == code])
            ax.plot(c.deformacao, c.tensao_mpa, color=SERIES[i], lw=0.9, alpha=0.6,
                    ls=LINESTYLES[i], label=label(cond) if j == 0 else None)
    ax.plot(example.deformacao, example.tensao_mpa, color=MODEL, lw=2, label="predição para 205 °C e 97 mm/s")
    ex = summary["exemplo"]
    ax.annotate(f"{comma(round(ex['tensao_na_deformacao_max_mpa'], 1))} MPa em {comma(round(100 * ex['deformacao_max'], 2))}%",
                (ex["deformacao_max"], ex["tensao_na_deformacao_max_mpa"]), xytext=(-130, 8), textcoords="offset points",
                fontsize=8.5, color=INK, arrowprops=dict(arrowstyle="-", color=INK_2, lw=0.7))
    ax.set_xlim(0, 0.1)
    ax.set_ylim(0, 55)
    style_axes(ax)
    ax.legend(loc="upper left", fontsize=7.8)
    save(fig, "predicao_205C_97mms.png")


if __name__ == "__main__":
    fig_typical()
    fig_n_effect()
    fig_flow()
    fig_raw_vs_corrected()
    fig_grid()
    fig_emic()
    fig_interaction()
    fig_fit()
    fig_surface()
    fig_cv_curves()
    fig_cv_scatter()
    fig_example()
