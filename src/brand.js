// Everything that dresses the demo up for one operator. The defaults are neutral: no operator's name, logo or colours.
// To show it in a telco's look: change the values here, replace public/logo.svg and public/favicon.svg, run
// npm run og (the link preview) and keep the contrast notes true (npm run check tests the main ones).
// vite.config.js puts colors and gradient into the page as CSS variables (--brand, --brand-dark, …);
// scenes.js draws the cartoons with the same colours; strings.js writes {protection} for protection.name.

export const BRAND = {
  colors: {
    brand: '#0f766e', // buttons, links, the scam cards' picture panels: white on it is 5.5:1
    'brand-dark': '#042f2e', // the top of the hero, the busy button, outlines in the drawings: white on it is 14.5:1
    'brand-soft': '#e1f3f0', // behind the drawings and the small buttons
    accent: '#8eeadb', // the Demo tag on the hero and small highlights in the drawings: ink on it is 13.3:1
  },
  // The hero, the page's only gradient. White text needs 4.5:1 down to its last colour (here 4.8:1).
  gradient: 'linear-gradient(180deg, #042f2e 0%, #0f766e 80%, #11807a 100%)',
  // The operator's network protection (Whalebone's DNS filter, sold under the operator's own name): the upsell
  // when a link in the message is already on the blocklist.
  protection: { name: 'Network Shield', url: 'https://www.whalebone.io/' },
  language: 'en', // when neither the link, a saved choice nor the browser asks for one of the page's languages
}
