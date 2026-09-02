/* =================================================================
   aisles.js — what kind of thing is this?

   A store is where you buy something; an aisle is what it *is*. Rice is
   Grains whether you buy it in Metro, Plaza Vea or a corner shop — so this
   file never has to know what any particular shop stocks.

   It is a plain dictionary rather than a call out to an AI, on purpose:
     - it works in a supermarket basement with no signal,
     - it costs nothing and answers instantly,
     - and it needs no secret key, which matters because this repo is
       public — anything in here is readable by anyone.

   Anything it doesn't recognise lands in "Other", and you can set the
   aisle yourself in the i sheet. Whatever you set always wins.
   ================================================================= */

const NO_AISLE = 'Other';

/* The order here is the order they appear in the list — roughly the order
   you walk a supermarket, with the non-grocery ones after. */
const AISLE_WORDS = {
  'Produce': [
    'apple','apples','manzana','manzanas','banana','bananas','platano','platanos','guineo',
    'orange','oranges','naranja','naranjas','mandarina','tangerine','lemon','lemons','limon',
    'lime','limes','grape','grapes','uva','uvas','strawberry','strawberries','fresa','fresas',
    'blueberry','blueberries','arandanos','mango','mangos','papaya','pineapple','pina','melon',
    'watermelon','sandia','pear','pears','pera','peras','peach','peaches','durazno','duraznos',
    'plum','ciruela','cherry','cherries','cereza','kiwi','avocado','avocados','palta','paltas',
    'granadilla','maracuya','chirimoya','lucuma','tuna','higo','coco','coconut','datil','pasas',
    'tomato','tomatoes','tomate','tomates','potato','potatoes','papa','papas','camote',
    'yuca','onion','onions','cebolla','cebollas','garlic','ajo','ajos','carrot','carrots',
    'zanahoria','zanahorias','celery','apio','lettuce','lechuga','spinach','espinaca',
    'cabbage','col','repollo','broccoli','brocoli','cauliflower','coliflor','pepper','peppers',
    'pimiento','pimientos','aji','rocoto','cucumber','pepino','zucchini','zapallo','calabaza',
    'pumpkin','beet','beets','betarraga','radish','rabanito','corn','choclo','maiz','peas',
    'arveja','arvejas','green beans','vainita','vainitas','mushroom','mushrooms','champinon',
    'champinones','hongos','ginger','kion','jengibre','cilantro','culantro','parsley','perejil',
    'basil','albahaca','mint','hierbabuena','huacatay','herbs','hierbas','sprouts','germinados',
    'asparagus','esparrago','esparragos','eggplant','berenjena','leek','poro','fruit','fruta',
    'vegetables','verduras','verdura','vegetable','salad','ensalada','olluco','oca','maca'
  ],
  'Meat & Poultry': [
    'meat','carne','beef','res','steak','bistec','lomo','lomo fino','asado','ground beef',
    'carne molida','molida','chicken','pollo','pechuga','breast','wings','alitas','thigh',
    'pierna','muslo','turkey','pavo','pork','cerdo','chancho','chuleta','chop','chops','ribs',
    'costillas','bacon','tocino','ham','jamon','sausage','sausages','salchicha','salchichas',
    'chorizo','hotdog','hot dog','hot dogs','lamb','cordero','cabrito','anticuchos','corazon',
    'higado','liver','tripa','mondongo','cuy','conejo','rabbit','veal','ternera'
  ],
  'Fish & Seafood': [
    'fish','pescado','tuna fish','atun','salmon','trucha','trout','bonito','jurel','perico',
    'lenguado','sole','corvina','cojinova','tilapia','bacalao','cod','sardina','sardines',
    'anchoveta','anchovies','anchoas','shrimp','camaron','camarones','langostino','langostinos',
    'prawn','prawns','squid','calamar','calamares','pulpo','octopus','conchas','scallops',
    'mussels','choros','clams','almejas','crab','cangrejo','lobster','langosta','ceviche',
    'seafood','mariscos'
  ],
  'Dairy & Eggs': [
    'milk','leche','evaporated milk','leche evaporada','condensed milk','leche condensada',
    'cheese','queso','quesos','fresco','edam','gouda','mozzarella','parmesano','parmesan',
    'cheddar','cream cheese','queso crema','yoghurt','yogurt','yogur','butter','mantequilla',
    'margarine','margarina','cream','crema','crema de leche','sour cream','manjar','manjarblanco',
    'dulce de leche','egg','eggs','huevo','huevos','huevo de codorniz','kefir','custard','flan'
  ],
  'Bakery': [
    'bread','pan','pan integral','pan de molde','baguette','francés','frances','ciabatta',
    'bun','buns','bollo','roll','rolls','pita','tortilla','tortillas','bagel','croissant',
    'cake','torta','queque','pie','tarta','pastel','muffin','muffins','donut','donuts',
    'brownie','brownies','empanada','empanadas','pan de yema','panetón','paneton','biscuit',
    'bizcocho','alfajor','alfajores','churros','waffle','waffles','pancake','pancakes','hotcakes'
  ],
  'Deli & Prepared': [
    'deli','fiambre','fiambres','salami','mortadela','pastrami','pate','hummus','guacamole',
    'sushi','rotisserie','pollo a la brasa','sandwich','sandwiches','wrap','pizza','lasagna',
    'lasagne','prepared','listo','rotiseria','ensalada lista','antipasto'
  ],
  'Frozen': [
    'frozen','congelado','congelados','ice cream','helado','helados','popsicle','paleta',
    'frozen pizza','pizza congelada','nuggets','frozen vegetables','verduras congeladas',
    'french fries','papas fritas congeladas','papa congelada','frozen fruit','pulpa',
    'hielo','ice'
  ],
  'Pantry & Canned': [
    'canned','lata','latas','enlatado','enlatados','conserva','conservas','beans','frijol',
    'frijoles','lentil','lentils','lenteja','lentejas','chickpea','chickpeas','garbanzo',
    'garbanzos','pallares','soup','sopa','caldo','broth','stock','cubes','maggi','tomato sauce',
    'salsa de tomate','passata','ketchup','mayonnaise','mayonesa','mustard','mostaza','sauce',
    'salsa','soy sauce','sillao','sazonador','vinegar','vinagre','oil','aceite','olive oil',
    'aceite de oliva','vegetable oil','aceite vegetal','sesame oil','coconut milk',
    'leche de coco','peanut butter','mantequilla de mani','jam','mermelada','honey','miel',
    'pickles','pepinillos','olives','aceitunas','capers','alcaparras','palmito','choclo en lata',
    'aji amarillo','aji panca','pasta de aji','sardinas en lata','conserva de atun'
  ],
  'Grains, Pasta & Rice': [
    'rice','arroz','pasta','fideos','fideo','spaghetti','espagueti','tallarin','tallarines',
    'macaroni','macarrones','penne','lasagna sheets','noodles','ramen','quinoa','quinua',
    'kiwicha','canihua','couscous','bulgur','barley','cebada','wheat','trigo','morron',
    'flour','harina','harina de trigo','cornstarch','maicena','chuno','semolina','avena',
    'lentejas secas','menestra','menestras','polenta','tapioca','yuca flour'
  ],
  'Breakfast & Cereal': [
    'cereal','cereales','corn flakes','cornflakes','granola','muesli','oats','oatmeal',
    'quaker','hojuelas','pancake mix','maple syrup','sirope','syrup','honey nut'
  ],
  'Baking & Spices': [
    'sugar','azucar','azucar rubia','brown sugar','powdered sugar','azucar impalpable',
    'salt','sal','pepper spice','pimienta','cumin','comino','oregano','paprika','pimenton',
    'cinnamon','canela','clove','clavo','nutmeg','nuez moscada','turmeric','curcuma','curry',
    'bay leaf','laurel','thyme','tomillo','rosemary','romero','anise','anis','vanilla',
    'vainilla','baking powder','polvo de hornear','baking soda','bicarbonato','yeast',
    'levadura','gelatin','gelatina','chocolate chips','cocoa','cacao','sprinkles','grageas',
    'food colouring','colorante','condensada para postres','spices','especias','condimento',
    'condimentos','ajinomoto','glutamato'
  ],
  'Snacks & Sweets': [
    'snack','snacks','chips','papas fritas','tortilla chips','doritos','pringles','popcorn',
    'canchita','pop corn','crackers','galletas','galleta','cookies','biscuits','oreo',
    'chocolate','chocolates','candy','caramelo','caramelos','dulce','dulces','gum','chicle',
    'marshmallow','nuts','frutos secos','peanut','peanuts','mani','almond','almonds','almendras',
    'walnut','nueces','cashew','castanas','pecana','pecanas','pistacho','pistachos','raisins',
    'trail mix','granola bar','barra','cereal bar','pretzel','pretzels','sunflower seeds',
    'pipas','chifles','maiz tostado','cancha'
  ],
  'Drinks': [
    'water','agua','agua mineral','sparkling water','agua con gas','soda','gaseosa','gaseosas',
    'coke','coca cola','inca kola','pepsi','sprite','fanta','juice','jugo','jugos','nectar',
    'zumo','lemonade','limonada','chicha','chicha morada','emoliente','iced tea','te helado',
    'energy drink','gatorade','powerade','sports drink','kombucha','tonic','tonica','refresco'
  ],
  'Coffee & Tea': [
    'coffee','cafe','instant coffee','cafe instantaneo','nescafe','espresso','coffee beans',
    'ground coffee','tea','te','green tea','te verde','black tea','herbal tea','infusion',
    'infusiones','manzanilla','chamomile','anis tea','mate','hierba luisa','muna',
    'hot chocolate','chocolate caliente','cocoa powder','milo','ecco','cebada tea'
  ],
  'Alcohol': [
    'beer','cerveza','cervezas','wine','vino','vino tinto','vino blanco','champagne','espumante',
    'pisco','rum','ron','vodka','whisky','whiskey','gin','tequila','liqueur','licor','licores',
    'sangria','cider','sidra','vermouth'
  ],
  'Baby': [
    'baby','bebe','diaper','diapers','panal','panales','wipes','toallitas','formula',
    'leche de formula','baby food','papilla','compota','bottle','biberon','pacifier','chupon',
    'baby wipes','talco','coche','babero'
  ],
  'Pets': [
    'pet','mascota','mascotas','dog food','comida para perro','cat food','comida para gato',
    'ricocan','whiskas','pedigree','litter','arena para gato','arena sanitaria','leash','correa',
    'pet shampoo','collar','pet toy','hueso','birdseed','alpiste','pecera','fish food'
  ],
  'Health & Pharmacy': [
    'medicine','medicina','medicamento','medicamentos','pill','pills','pastilla','pastillas',
    'paracetamol','panadol','ibuprofen','ibuprofeno','aspirin','aspirina','antibiotic',
    'antibiotico','vitamin','vitamins','vitamina','vitaminas','supplement','suplemento',
    'omega','probiotic','probiotico','antacid','antiacido','sal de andrews','bandaid',
    'curita','curitas','bandage','venda','gauze','gasa','alcohol medicinal','peroxide',
    'agua oxigenada','thermometer','termometro','mask','mascarilla','cough syrup','jarabe',
    'antihistamine','antialergico','sunscreen','bloqueador','protector solar','repellent',
    'repelente','condom','condones','test','prueba','ointment','pomada','cream medicinal'
  ],
  'Personal Care': [
    'shampoo','champu','conditioner','acondicionador','soap','jabon','body wash','gel de ducha',
    'toothpaste','pasta dental','pasta de dientes','toothbrush','cepillo de dientes','floss',
    'hilo dental','mouthwash','enjuague bucal','deodorant','desodorante','antiperspirant',
    'razor','afeitadora','rasuradora','shaving cream','espuma de afeitar','lotion','locion',
    'moisturizer','crema','crema corporal','face cream','crema facial','makeup','maquillaje',
    'lipstick','labial','mascara','nail polish','esmalte','perfume','colonia','cotton',
    'algodon','cotton swabs','hisopos','q tips','pads','toallas higienicas','tampons','tampones',
    'hairbrush','peine','cepillo','hair dye','tinte','gel','hairspray','laca','wax','cera'
  ],
  'Cleaning & Laundry': [
    'detergent','detergente','ariel','bolivar','sapolio','soap powder','jabon en polvo',
    'fabric softener','suavizante','bleach','lejia','clorox','disinfectant','desinfectante',
    'pinesol','poett','floor cleaner','limpiador','limpia pisos','glass cleaner','limpiavidrios',
    'dish soap','lavavajilla','lavavajillas','ayudin','sponge','esponja','scourer','esponja verde',
    'mop','trapeador','broom','escoba','dustpan','recogedor','bucket','balde','gloves','guantes',
    'trash bags','bolsas de basura','bolsa de basura','air freshener','ambientador','insecticide',
    'insecticida','raid','stain remover','quitamanchas','vanish','brush','cepillo de limpieza'
  ],
  'Paper & Household': [
    'toilet paper','papel higienico','papel','paper towels','papel toalla','servilletas',
    'napkins','tissues','panuelos','kleenex','aluminum foil','papel aluminio','plastic wrap',
    'film','papel film','wax paper','papel manteca','ziploc','plastic bags','bolsas',
    'containers','tapers','tupperware','batteries','pilas','light bulb','foco','bombilla',
    'candle','vela','velas','matches','fosforos','lighter','encendedor','tape','cinta adhesiva',
    'duct tape','cinta','string','pabilo','clothespins','ganchos de ropa','hanger','colgador',
    'perchas','extension','extension cord','zapatillas electricas'
  ],
  'Kitchen & Cookware': [
    'pot','olla','ollas','pan cookware','sarten','sartenes','frying pan','skillet','wok',
    'pressure cooker','olla a presion','kettle','hervidor','blender','licuadora','mixer',
    'batidora','food processor','procesador','toaster','tostadora','microwave','microondas',
    'air fryer','freidora','coffee maker','cafetera','knife','cuchillo','cuchillos','cutting board',
    'tabla de picar','spatula','espatula','ladle','cucharon','whisk','batidor','grater','rallador',
    'peeler','pelador','colander','colador','strainer','measuring cup','taza medidora','bowl',
    'bol','tazon','plate','plato','platos','cup','taza','tazas','glass','vaso','vasos','mug',
    'fork','tenedor','spoon','cuchara','knife cutlery','cubiertos','cutlery','baking tray',
    'bandeja','molde','tray','can opener','abrelatas','corkscrew','sacacorchos','thermos','termo'
  ],
  'Home & Furniture': [
    'furniture','mueble','muebles','table','mesa','chair','silla','sillas','desk','escritorio',
    'sofa','couch','sillon','armchair','bookshelf','estante','estanteria','shelf','repisa',
    'wardrobe','ropero','closet','armario','dresser','comoda','cabinet','mueble de cocina',
    'nightstand','velador','mirror','espejo','lamp','lampara','rug','alfombra','curtain',
    'curtains','cortina','cortinas','clock','reloj de pared','frame','marco','picture frame',
    'cuadro','vase','florero','plant pot','maceta','doormat','felpudo','stool','banco',
    'bench','banca','coat rack','perchero','bed','beds','bed frame','cama','camas',
    'marco de cama','litera','bunk bed','crib','cuna'
  ],
  'Bedding & Bath': [
    'mattress','colchon','pillow','almohada','almohadas','pillowcase','funda','sheets','sabanas',
    'sabana','duvet','edredon','blanket','frazada','manta','cobija','quilt','cover','cubrecama',
    'towel','toalla','toallas','bath towel','hand towel','bath mat','tapete de bano',
    'shower curtain','cortina de bano','bathrobe','bata','slippers','pantuflas','mattress protector',
    'protector de colchon'
  ],
  'Electronics': [
    'computer','computadora','laptop','pc','tablet','ipad','phone','celular','telefono',
    'smartphone','charger','cargador','cable','usb','usb cable','hdmi','adapter','adaptador',
    'headphones','audifonos','earphones','auriculares','speaker','parlante','parlantes','tv',
    'televisor','television','monitor','pantalla','keyboard','teclado','mouse','raton',
    'printer','impresora','ink','tinta','toner','router','modem','hard drive','disco duro',
    'memory card','memoria','usb stick','flash drive','memoria usb','camera','camara','console',
    'consola','playstation','xbox','nintendo','remote','control remoto','smartwatch',
    'power bank','bateria'
  ],
  'Tools & Hardware': [
    'tool','tools','herramienta','herramientas','hammer','martillo','screwdriver','desarmador',
    'destornillador','wrench','llave','llave inglesa','pliers','alicate','saw','sierra',
    'drill','taladro','nails','clavos','screws','tornillos','bolt','perno','washer','arandela',
    'anchor','tarugo','glue','pegamento','silicone','silicona','sandpaper','lija','paint',
    'pintura','brush paint','brocha','roller','rodillo','ladder','escalera','level','nivel',
    'tape measure','wincha','cinta metrica','padlock','candado','lock','cerradura','hinge',
    'bisagra','pipe','tubo','hose','manguera','wire','alambre','cable electrico','plug','enchufe',
    'switch','interruptor','socket','tomacorriente','fuse','fusible'
  ],
  'Garden & Outdoor': [
    'plant','planta','plantas','seed','seeds','semilla','semillas','soil','tierra','abono',
    'fertilizer','fertilizante','compost','pot garden','watering can','regadera','shovel','pala',
    'rake','rastrillo','hoe','azadon','pruners','tijeras de podar','lawn mower','cortacesped',
    'grass','cesped','sprinkler','aspersor','garden hose','pesticide','pesticida','herbicide',
    'planter','jardinera','grill','parrilla','charcoal','carbon','firewood','lena','tent',
    'carpa','umbrella outdoor','sombrilla','hammock','hamaca'
  ],
  'Auto': [
    'tire','tires','llanta','llantas','neumatico','neumaticos','motor oil','aceite de motor',
    'oil filter','filtro de aceite','air filter','filtro de aire','brake pads','pastillas de freno',
    'brake fluid','liquido de frenos','coolant','refrigerante','antifreeze','windshield wipers',
    'limpiaparabrisas','plumillas','car battery','bateria de auto','spark plugs','bujias',
    'car wax','cera para auto','car shampoo','jack','gata','wrench car','llave de ruedas',
    'jumper cables','cables de arranque','fuel','gasolina','combustible','car charger',
    'floor mats','pisos de auto','air freshener car','triangulo','extintor'
  ],
  'Clothing & Shoes': [
    'shirt','camisa','camiseta','polo','t shirt','blouse','blusa','pants','pantalon','pantalones',
    'jeans','shorts','skirt','falda','dress','vestido','jacket','casaca','chaqueta','coat',
    'abrigo','sweater','chompa','sudadera','hoodie','poleron','underwear','ropa interior',
    'calzoncillo','panties','calzon','bra','sosten','brasier','socks','medias','calcetines',
    'pyjamas','pijama','swimsuit','ropa de bano','shoes','zapatos','sneakers','zapatillas',
    'boots','botas','sandals','sandalias','ojotas','slippers shoes','belt','correa cinturon',
    'cinturon','hat','gorro','gorra','cap','scarf','bufanda','gloves clothing','guantes de lana',
    'tie','corbata','clothes','ropa'
  ],
  'Office & Stationery': [
    'paper office','papel bond','notebook','cuaderno','notepad','libreta','pen','lapicero',
    'boligrafo','pencil','lapiz','lapices','eraser','borrador','sharpener','tajador',
    'sacapuntas','marker','plumon','marcador','highlighter','resaltador','crayon','crayones',
    'colors','colores','ruler','regla','scissors','tijera','tijeras','stapler','engrapador',
    'staples','grapas','clip','clips','clipes','paper clip','paper clips','clip sujetador',
    'binder clip','folder','folders','file','archivador','envelope','sobre','sobres','stamp',
    'estampilla','glue stick','goma','silicona liquida','calculator','calculadora','planner',
    'agenda','calendar','calendario','post it','notas adhesivas','tape office','cinta scotch',
    'ink pen','cartulina','papel lustre','block','printer paper'
  ],
  'Toys & Games': [
    'toy','toys','juguete','juguetes','doll','muneca','action figure','lego','blocks','bloques',
    'puzzle','rompecabezas','board game','juego de mesa','cards','cartas','naipes','dice',
    'dados','ball toy','pelota','videogame','videojuego','game','juego','teddy','peluche',
    'kite','cometa','bike toy','triciclo','scooter','skateboard','patineta','yo yo','slime',
    'play dough','plastilina','coloring book','libro para colorear'
  ],
  'Sports & Outdoors': [
    'ball','balon','football','futbol','soccer ball','basketball','basquet','volleyball','voley',
    'tennis','tenis','racket','raqueta','bat','bate','glove sports','guante','helmet','casco',
    'bicycle','bicicleta','bike','pump','inflador','weights','pesas','dumbbell','mancuernas',
    'yoga mat','mat','colchoneta','jump rope','soga','treadmill','trotadora','faja',
    'water bottle','tomatodo','botella','backpack','mochila','sleeping bag','saco de dormir',
    'flashlight','linterna','binoculars','binoculares','goggles','antiparras','fins','aletas',
    'surfboard','tabla','wetsuit','running shoes','protein','proteina'
  ]
};

/* Word → aisle, built once. Later categories don't overwrite earlier ones,
   so a word listed twice keeps its first (more specific) home. */
const AISLE_LOOKUP = (() => {
  const map = new Map();
  for (const [aisle, words] of Object.entries(AISLE_WORDS)) {
    for (const w of words) if (!map.has(w)) map.set(w, aisle);
  }
  return map;
})();

const AISLES = [...Object.keys(AISLE_WORDS), NO_AISLE];

/* Lower case, no accents, no punctuation — so "Plátano", "platano" and
   "PLATANO!" are all the same word. */
function normalise(text) {
  return String(text).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function lookupOne(word) {
  if (!word) return null;
  if (AISLE_LOOKUP.has(word)) return AISLE_LOOKUP.get(word);
  // Spanish and English both make plurals with -s or -es. Try singular.
  if (word.endsWith('es') && AISLE_LOOKUP.has(word.slice(0, -2))) return AISLE_LOOKUP.get(word.slice(0, -2));
  if (word.endsWith('s')  && AISLE_LOOKUP.has(word.slice(0, -1))) return AISLE_LOOKUP.get(word.slice(0, -1));
  return null;
}

/* Best guess for a name, or null if it genuinely doesn't know. Tries the
   whole name first ("olive oil" beats "oil"), then the longest words in it,
   so "aceite de oliva" finds "aceite" and "de" is never consulted. */
function guessAisle(name) {
  const text = normalise(name);
  if (!text) return null;

  const whole = lookupOne(text);
  if (whole) return whole;

  const words = text.split(' ');
  // two-word runs, e.g. "papel higienico" inside "papel higienico doble hoja"
  for (let i = 0; i < words.length - 1; i++) {
    const pair = lookupOne(words[i] + ' ' + words[i + 1]);
    if (pair) return pair;
  }
  for (const w of [...words].sort((a, b) => b.length - a.length)) {
    const hit = lookupOne(w);
    if (hit) return hit;
  }
  return null;
}
