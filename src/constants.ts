const LAYOUT_ENGINES = {
  DAGRE: {
    value: "dagre",
    label: "dagre",
  },
  ELK: {
    value: "elk",
    label: "ELK",
  },
  TALA: {
    value: "tala",
    label: "TALA",
  },
};

const RecompileIcon = `
<svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8.33325 83.3334V58.3334H33.3333" stroke="#2E3346" stroke-width="8.33333" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M91.6667 16.6666V41.6666H66.6667" stroke="#2E3346" stroke-width="8.33333" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M14.6249 37.5004C16.7381 31.5287 20.3296 26.1896 25.0644 21.9813C29.7991 17.773 35.5227 14.8328 41.7011 13.4348C47.8795 12.0369 54.3114 12.2268 60.3965 13.987C66.4817 15.7471 72.0218 19.02 76.4999 23.5004C80.978 27.9808 91.6666 41.667 91.6666 41.667M8.33325 58.3337C8.33325 58.3337 19.0218 72.02 23.4999 76.5004C27.978 80.9808 33.5181 84.2537 39.6033 86.0138C45.6884 87.774 52.1203 87.9639 58.2987 86.566C64.4771 85.168 70.2007 82.2277 74.9355 78.0195C79.6702 73.8112 83.2617 68.4721 85.3749 62.5004" stroke="#2E3346" stroke-width="8.33333" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

export { LAYOUT_ENGINES, RecompileIcon };
