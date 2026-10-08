# Where the paper goes

| Venue | What | Status |
|---|---|---|
| Friedman's catalogue | Record entry for n = 12 | Emailed 8 Oct 2026 |
| Zenodo | DOI for release v1.0.0 (code, claim file, paper) | Minted: 10.5281/zenodo.23248095 (v1.0.0); concept DOI 10.5281/zenodo.23248094 |
| arXiv | Full paper (`paper/main.tex`) | Package ready: `paper/arxiv/arxiv-source.tar.gz` |
| Geombinatorics | Short note (`paper/geombinatorics/note.tex`) | Manuscript ready; needs signed copyright form |
| E-JC | Not now | See below |

## Decision: Geombinatorics, not E-JC

- Journals forbid submitting the same work to two of them at once, so it is one or the other.
- Geombinatorics publishes short notes on open problems in discrete and combinatorial geometry. A new best packing with coordinates and a certificate is the kind of note it runs.
- E-JC asks for "fully refereed papers of substantial content". A single numerical improvement found by a heuristic risks desk rejection there, after a months-long wait.
- Keep E-JC (or *Experimental Mathematics*) for a later, larger paper: for example, if the method improves several more records or the n = 12 side gets a closed form.
- An arXiv preprint and the Zenodo record do not count as prior publication for either journal.

## arXiv

- **Upload:** `paper/arxiv/arxiv-source.tar.gz` (main.tex, main.bbl, figures/n12_views.pdf; compiles with pdflatex, no BibTeX run needed).
- **Primary category:** cs.AI (available to you). Try **cs.CG** as primary first, since it fits better; if arXiv asks for an endorsement, fall back to cs.AI.
- **Cross-lists:** math.MG, cs.CG (if not primary), math.OC.
- **Title:** Twelve Unit Cubes in a Cube of Side 2.9315, Found by Hardening Balls into Cubes
- **Comments:** 6 pages, 1 figure. Code, coordinates, verifier and certificate: https://github.com/yoheinakajima/soft-to-rigid-packing (doi:10.5281/zenodo.23248095)
- **Abstract** (plain text for the form):

  We give a packing of 12 unit cubes in a cube of side 2.9315185, with every pair and every wall at least 1e-6 apart, improving the previous best known side 2.9327717687 (H. Lin, July 2026). The packing was found by a soft-to-rigid homotopy: unit-diameter balls are compressed in a shrinking box and then deformed through rounded cubes into rigid unit cubes while inward pressure on the box continues. The final configuration is tightened with a constrained solver that keeps every corner inside the box and a separating plane between every nearby pair, and validated by an exact rational certificate. On unit squares in a square, the same method recovers the best known packings for n = 11 (now proved optimal), 17, 18, 19, 26 and 27, and outperforms a rigid-start control on the same seeds. We report where the method fails (n = 28, 29 squares; n = 10, 11 cubes so far), an ablation showing that an oriented intermediate shape does not help, and code to reproduce every result.

## Geombinatorics

- **Manuscript:** `paper/geombinatorics/note.pdf` (4 pages, built to the journal's spec: 8.5 × 5.5 in landscape, margins 0.35 in / 0.5 in bottom, Times 11 pt, title in bold capitals 14 pt, no page numbers).
- **Also required:** a signed copyright form (link on https://geombina.uccs.edu/ under Submissions).
- **Send to:** the site lists only a general address, go@uccs.edu. Confirm the submissions address with the editor, Alexander Soifer, before sending.
- **Cover note (draft):**

  > Dear Professor Soifer,
  >
  > I would like to submit the attached note, "Twelve Unit Cubes in a Cube of Side 2.93152", for consideration in Geombinatorics. It gives a packing of 12 unit cubes in a cube of side 2.9315185, improving the July 2026 value 2.93277, with coordinates, a verification argument and an exact certificate. The coordinates and checking programs are public at https://github.com/yoheinakajima/soft-to-rigid-packing. A preprint is on arXiv [add ID] and archived on Zenodo (doi:10.5281/zenodo.23248095). The signed copyright form is attached.
  >
  > Yohei Nakajima
