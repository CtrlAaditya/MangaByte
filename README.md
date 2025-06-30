# MangaByte - Daily Manga Motivation

A beautiful, responsive web application that delivers motivational manga quotes to your inbox. Built with React, TypeScript, and Tailwind CSS.

## Features

- Clean, modern UI with kawaii design elements
- Responsive layout that works on mobile and desktop
- Email subscription management
- Random manga quotes with character and source attribution
- Cute anime-style avatars using DiceBear API

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm (v7 or later) or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/mangabyte.git
   cd mangabyte
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `/src` - Source files
  - `App.tsx` - Main application component
  - `main.tsx` - Application entry point
  - `index.css` - Global styles with Tailwind directives
- `public` - Static assets
- `index.html` - Main HTML template

## Customization

### Adding More Quotes

Edit the `quotes` array in `src/App.tsx` to add more motivational manga quotes.

### Styling

This project uses Tailwind CSS for styling. You can customize the theme in `tailwind.config.js`.

## Deployment

Build the application for production:

```bash
npm run build
# or
yarn build
```

This will create a `dist` folder with the production build.

## Built With

- [React](https://reactjs.org/) - JavaScript library for building user interfaces
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Vite](https://vitejs.dev/) - Next Generation Frontend Tooling
- [DiceBear Avatars](https://avatars.dicebear.com/) - For generating cute anime avatars

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- All manga quotes are property of their respective creators and publishers.
- Inspired by the motivational power of manga and anime.
