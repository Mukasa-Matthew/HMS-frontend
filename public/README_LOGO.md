# Logo Placement Instructions

## Where to Place Your Logo

1. **Place your logo file in this folder** (`frontend/public/`)
2. **Name it:** `logo.png` (or `logo.svg`, `logo.jpg` - the code will look for `logo.png` first)

## Supported Formats
- PNG (recommended for logos with transparency)
- SVG (recommended for scalable logos)
- JPG/JPEG

## File Path
Your logo should be placed at:
```
frontend/public/logo.png
```

## Where the Logo Appears
The logo will automatically appear in:
- ✅ Sidebar navigation (top left)
- ✅ Mobile drawer menu
- ✅ Login page

## If Logo Not Found
If the logo file is not found, the system will automatically fall back to the default building icon.

## Recommended Logo Specifications
- **Size:** 200x200px to 400x400px (will be scaled down to fit)
- **Format:** PNG with transparency or SVG
- **Aspect Ratio:** Square (1:1) works best
- **File Size:** Keep under 100KB for fast loading

## To Use a Different Filename
If your logo has a different name, update these files:
1. `frontend/src/components/layout/DashboardLayout.tsx` - Change `/logo.png` to your filename
2. `frontend/src/pages/auth/LoginPage.tsx` - Change `/logo.png` to your filename
