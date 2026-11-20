# Renders the contact-line icons used in the CV header (cv/icons/*.png) from inline SVG.
# Usage: python make_icons.py   (requires PyMuPDF)
import os
import pymupdf

COLOR = '#1F4E8C'
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'icons')

STROKE = f'fill="none" stroke="{COLOR}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"'
ICONS = {
    'email': f'<rect x="2.5" y="5" width="19" height="14" rx="2" {STROKE}/><path d="m3.5 6.5 8.5 6.5 8.5-6.5" {STROKE}/>',
    'linkedin': (
        f'<rect x="1.5" y="1.5" width="21" height="21" rx="3.5" fill="{COLOR}"/>'
        '<rect x="5.5" y="9.5" width="3.2" height="9" fill="#fff"/>'
        '<circle cx="7.1" cy="6.6" r="1.9" fill="#fff"/>'
        '<path d="M10.8 9.5h3.1v1.3c.6-1 1.7-1.6 3.1-1.6 2.3 0 3.4 1.4 3.4 4v5.3h-3.2v-4.9c0-1.2-.5-1.9-1.5-1.9-1.1 0-1.7.8-1.7 2v4.8h-3.2z" fill="#fff"/>'
    ),
    'github': (
        f'<path fill="{COLOR}" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 '
        '0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729'
        '.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3'
        '-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 '
        '1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 '
        '1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825'
        '.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>'
    ),
    'web': f'<circle cx="12" cy="12" r="9.5" {STROKE}/><path d="M2.5 12h19M12 2.5c2.6 2.6 3.9 5.8 3.9 9.5s-1.3 6.9-3.9 9.5c-2.6-2.6-3.9-5.8-3.9-9.5S9.4 5.1 12 2.5z" {STROKE}/>',
    'scholar': f'<path d="M1.5 9.5 12 3.5l10.5 6L12 15.5z" fill="{COLOR}"/><path d="M5.5 12v4.5c0 1.8 2.9 3.5 6.5 3.5s6.5-1.7 6.5-3.5V12" {STROKE}/>',
    'inspire': (
        f'<circle cx="12" cy="12" r="2.2" fill="{COLOR}"/>'
        f'<ellipse cx="12" cy="12" rx="10" ry="4" {STROKE}/>'
        f'<ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" {STROKE}/>'
        f'<ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" {STROKE}/>'
    ),
}

os.makedirs(OUT, exist_ok=True)
for name, body in ICONS.items():
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">{body}</svg>'
    doc = pymupdf.open(stream=svg.encode(), filetype='svg')
    pix = doc[0].get_pixmap(matrix=pymupdf.Matrix(8, 8), alpha=True)
    pix.save(os.path.join(OUT, f'{name}.png'))
    print('wrote', name)
