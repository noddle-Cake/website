---
title: "Oncora — Explainable AI for Cancer Drug Discovery"
code: "ON-01"
stack: ["Python", "RDKit", "LightGBM", "scikit-learn", "DuckDB", "FastAPI", "Streamlit", "Claude API", "MLflow"]
summary: "Built for the eMerge Hackathon's compound → target → cancer challenge: give it a compound as a SMILES string and it predicts likely protein targets, sensitive cancer cell lines and cancer types, then explains the evidence behind each with every claim cited. Two independently validated LightGBM models, one trained on 4.2M ChEMBL compound–target pairs across 1,360 targets and one on 467k compound × cell-line sensitivity measurements, are scored on compounds held out by chemical structure. On unseen compounds the target model reaches 0.86 macro PR-AUC against a 0.23 baseline and puts a true target in its top 5 for 85% of them. Claude only renders grounded explanations, with a deterministic template fallback, and the whole pipeline reproduces its headline metrics from pinned data."
github: "https://github.com/noddle-Cake/Oncora"
demo: "https://oncora.cjservin.com"
featured: true
order: 2
---
