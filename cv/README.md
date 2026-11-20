# CV

Both CVs come from a single source, `cv_data.js`, which holds Spanish and English side by side.

- `cv_data.js`: content. Every field is `{ es, en }`, or a plain string when it is the same in both languages.
- `build_cv.js`: generates `cv.docx` (English) and `cv(esp).docx` (Spanish) with the same format.
- `export_pdf.ps1`: uses Microsoft Word to export `../cv.pdf`, which the site links to, and `cv(esp).pdf`.

The Spanish CV (`cv(esp).docx` / `cv(esp).pdf`) stays local only and is listed in `.gitignore`.

```
cd cv
npm install          # first time only
node build_cv.js
powershell -ExecutionPolicy Bypass -File export_pdf.ps1
```

A manual edit to the `.docx` files is overwritten by the next build. Changes go in `cv_data.js`.

`originales/` (not in git) holds the Word files the CVs were built from.
