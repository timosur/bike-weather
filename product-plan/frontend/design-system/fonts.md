# Typography Configuration

## Google Fonts Import

Add to your HTML `<head>` or CSS:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```

## Font Usage

- **Headings:** Outfit — Used for page titles, section headings, and prominent labels. Applied via `style={{ fontFamily: 'Outfit, sans-serif' }}` or a Tailwind custom class.
- **Body text:** Inter — Default body font for paragraphs, form labels, and UI text.
- **Code/technical:** IBM Plex Mono — Used for code snippets and technical data display.
