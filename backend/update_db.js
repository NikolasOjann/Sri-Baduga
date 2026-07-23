const fs = require('fs');
const file = './data/collections.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

// Sample translation for the first 2 items
const translations = {
  1: 'A set of traditional sharp weapons in the form of a machete consisting of a blade and a sheath. The blade is straight with a box/flat tip. The surface of both sides of the blade has a small box motif (pamor/inscription) and certain characters resembling a rajah. The hilt or handle is made of shiny black wood, curving downwards (resembling the jengkolan handle model or traditional Javanese/Sundanese handle), with a golden circular line decoration near the blade border. The sheath (warangka) is made of wood wrapped or tied with black material, with the base of the sheath showing the original light brown wood color.',
  2: 'A set of traditional thrusting weapons consisting of a separate blade, hilt, and sheath. The blade is made of old dark grayish-black iron with an asymmetrical wavy (luk) shape and a very rough/porous surface texture due to age corrosion. The hilt (handle) is made of brown wood with a fine circular fiber pattern, thickly curved without any mendak (limiting ring) decoration. The sheath (warangka) is straight, elongated and tapers at the end, made of wood with a dark brown color gradient in the middle to the end, and light brown at the base.'
};

data.forEach(item => {
  if (translations[item.id]) {
    item.deskripsi_en = translations[item.id];
  } else {
    item.deskripsi_en = ''; // Placeholder for others
  }
});

fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log('Successfully updated collections.json with deskripsi_en field.');
