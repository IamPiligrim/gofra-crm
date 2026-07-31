# Approved Visual References

Store local reference images in this directory. Keep final pixel-comparison baselines in `approved/`.

Each reference must also be registered in `../product-quality.json` with:

- stable ID;
- label and purpose;
- kind: `local-image`, `figma`, or `url`;
- role: `candidate`, `baseline`, or `inspiration`;
- direction ID when the reference belongs to one generated direction;
- local relative path or URL;
- routes, viewports, and states it governs.

Candidate images compare visual directions. Only baseline images for the approved direction are copied into `approved/`.
Do not auto-update approved baselines during verification. A changed baseline is a design decision and requires explicit approval.
