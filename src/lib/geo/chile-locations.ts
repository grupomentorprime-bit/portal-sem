/**
 * Regiones de Chile y las ciudades con las que se ubica un Espacio.
 * El nombre guardado es el de la lista; los alias solo sirven para reconocer
 * un texto ya escrito («Región del Maule», «Región Metropolitana»).
 */

export interface ChileRegion {
  name: string;
  aliases: readonly string[];
  cities: readonly string[];
}

export const CHILE_REGIONS: readonly ChileRegion[] = [
  {
    name: "Arica y Parinacota",
    aliases: ["Región de Arica y Parinacota", "XV"],
    cities: ["Arica", "Camarones", "General Lagos", "Putre"],
  },
  {
    name: "Tarapacá",
    aliases: ["Región de Tarapacá", "I"],
    cities: ["Alto Hospicio", "Camiña", "Colchane", "Huara", "Iquique", "Pica", "Pozo Almonte"],
  },
  {
    name: "Antofagasta",
    aliases: ["Región de Antofagasta", "II"],
    cities: [
      "Antofagasta",
      "Calama",
      "María Elena",
      "Mejillones",
      "San Pedro de Atacama",
      "Sierra Gorda",
      "Taltal",
      "Tocopilla",
    ],
  },
  {
    name: "Atacama",
    aliases: ["Región de Atacama", "III"],
    cities: [
      "Alto del Carmen",
      "Caldera",
      "Chañaral",
      "Copiapó",
      "Diego de Almagro",
      "Freirina",
      "Huasco",
      "Tierra Amarilla",
      "Vallenar",
    ],
  },
  {
    name: "Coquimbo",
    aliases: ["Región de Coquimbo", "IV"],
    cities: [
      "Andacollo",
      "Canela",
      "Combarbalá",
      "Coquimbo",
      "Illapel",
      "La Higuera",
      "La Serena",
      "Los Vilos",
      "Monte Patria",
      "Ovalle",
      "Paihuano",
      "Punitaqui",
      "Río Hurtado",
      "Salamanca",
      "Vicuña",
    ],
  },
  {
    name: "Valparaíso",
    aliases: ["Región de Valparaíso", "V"],
    cities: [
      "Algarrobo",
      "Cabildo",
      "Calle Larga",
      "Cartagena",
      "Casablanca",
      "Catemu",
      "Concón",
      "El Quisco",
      "El Tabo",
      "Hijuelas",
      "La Calera",
      "La Cruz",
      "La Ligua",
      "Limache",
      "Llaillay",
      "Los Andes",
      "Nogales",
      "Olmué",
      "Panquehue",
      "Papudo",
      "Petorca",
      "Puchuncaví",
      "Putaendo",
      "Quillota",
      "Quilpué",
      "Quintero",
      "Rinconada",
      "San Antonio",
      "San Esteban",
      "San Felipe",
      "Santa María",
      "Santo Domingo",
      "Valparaíso",
      "Villa Alemana",
      "Viña del Mar",
      "Zapallar",
    ],
  },
  {
    name: "Metropolitana",
    aliases: [
      "Región Metropolitana",
      "Región Metropolitana de Santiago",
      "Metropolitana de Santiago",
      "RM",
    ],
    cities: [
      "Alhué",
      "Buin",
      "Calera de Tango",
      "Cerrillos",
      "Cerro Navia",
      "Colina",
      "Conchalí",
      "Curacaví",
      "El Bosque",
      "El Monte",
      "Estación Central",
      "Huechuraba",
      "Independencia",
      "Isla de Maipo",
      "La Cisterna",
      "La Florida",
      "La Granja",
      "La Pintana",
      "La Reina",
      "Lampa",
      "Las Condes",
      "Lo Barnechea",
      "Lo Espejo",
      "Lo Prado",
      "Macul",
      "Maipú",
      "María Pinto",
      "Melipilla",
      "Ñuñoa",
      "Padre Hurtado",
      "Paine",
      "Pedro Aguirre Cerda",
      "Peñaflor",
      "Peñalolén",
      "Pirque",
      "Providencia",
      "Pudahuel",
      "Puente Alto",
      "Quilicura",
      "Quinta Normal",
      "Recoleta",
      "Renca",
      "San Bernardo",
      "San Joaquín",
      "San José de Maipo",
      "San Miguel",
      "San Pedro",
      "San Ramón",
      "Santiago",
      "Talagante",
      "Tiltil",
      "Vitacura",
    ],
  },
  {
    name: "O'Higgins",
    aliases: [
      "Región de O'Higgins",
      "Región del Libertador General Bernardo O'Higgins",
      "Libertador General Bernardo O'Higgins",
      "VI",
    ],
    cities: [
      "Chimbarongo",
      "Chépica",
      "Codegua",
      "Coinco",
      "Coltauco",
      "Doñihue",
      "Graneros",
      "La Estrella",
      "Las Cabras",
      "Litueche",
      "Lolol",
      "Machalí",
      "Malloa",
      "Marchigüe",
      "Mostazal",
      "Nancagua",
      "Navidad",
      "Olivar",
      "Palmilla",
      "Paredones",
      "Peralillo",
      "Peumo",
      "Pichidegua",
      "Pichilemu",
      "Placilla",
      "Pumanque",
      "Quinta de Tilcoco",
      "Rancagua",
      "Rengo",
      "Requínoa",
      "San Fernando",
      "San Vicente",
      "Santa Cruz",
    ],
  },
  {
    name: "Maule",
    aliases: ["Región del Maule", "Region del Maule", "VII"],
    cities: [
      "Cauquenes",
      "Chanco",
      "Colbún",
      "Constitución",
      "Curepto",
      "Curicó",
      "Empedrado",
      "Hualañé",
      "Licantén",
      "Linares",
      "Longaví",
      "Maule",
      "Molina",
      "Parral",
      "Pelarco",
      "Pelluhue",
      "Pencahue",
      "Rauco",
      "Retiro",
      "Río Claro",
      "Romeral",
      "Sagrada Familia",
      "San Clemente",
      "San Javier",
      "San Rafael",
      "Talca",
      "Teno",
      "Vichuquén",
      "Villa Alegre",
      "Yerbas Buenas",
    ],
  },
  {
    name: "Ñuble",
    aliases: ["Región de Ñuble", "Region de Nuble", "XVI"],
    cities: [
      "Bulnes",
      "Chillán",
      "Chillán Viejo",
      "Cobquecura",
      "Coelemu",
      "Coihueco",
      "El Carmen",
      "Ninhue",
      "Ñiquén",
      "Pemuco",
      "Pinto",
      "Portezuelo",
      "Quillón",
      "Quirihue",
      "Ránquil",
      "San Carlos",
      "San Fabián",
      "San Ignacio",
      "San Nicolás",
      "Treguaco",
      "Yungay",
    ],
  },
  {
    name: "Biobío",
    aliases: ["Región del Biobío", "Región del Bío Bío", "VIII"],
    cities: [
      "Alto Biobío",
      "Antuco",
      "Arauco",
      "Cabrero",
      "Cañete",
      "Chiguayante",
      "Concepción",
      "Contulmo",
      "Coronel",
      "Curanilahue",
      "Florida",
      "Hualpén",
      "Hualqui",
      "Laja",
      "Lebu",
      "Los Álamos",
      "Los Ángeles",
      "Lota",
      "Mulchén",
      "Nacimiento",
      "Negrete",
      "Penco",
      "Quilaco",
      "Quilleco",
      "San Pedro de la Paz",
      "San Rosendo",
      "Santa Bárbara",
      "Santa Juana",
      "Talcahuano",
      "Tirúa",
      "Tomé",
      "Tucapel",
      "Yumbel",
    ],
  },
  {
    name: "La Araucanía",
    aliases: ["Región de La Araucanía", "Araucanía", "IX"],
    cities: [
      "Angol",
      "Carahue",
      "Cholchol",
      "Collipulli",
      "Cunco",
      "Curacautín",
      "Curarrehue",
      "Ercilla",
      "Freire",
      "Galvarino",
      "Gorbea",
      "Lautaro",
      "Loncoche",
      "Lonquimay",
      "Los Sauces",
      "Lumaco",
      "Melipeuco",
      "Nueva Imperial",
      "Padre Las Casas",
      "Perquenco",
      "Pitrufquén",
      "Pucón",
      "Purén",
      "Renaico",
      "Saavedra",
      "Temuco",
      "Teodoro Schmidt",
      "Toltén",
      "Traiguén",
      "Victoria",
      "Vilcún",
      "Villarrica",
    ],
  },
  {
    name: "Los Ríos",
    aliases: ["Región de Los Ríos", "XIV"],
    cities: [
      "Corral",
      "Futrono",
      "La Unión",
      "Lago Ranco",
      "Lanco",
      "Los Lagos",
      "Máfil",
      "Mariquina",
      "Paillaco",
      "Panguipulli",
      "Río Bueno",
      "Valdivia",
    ],
  },
  {
    name: "Los Lagos",
    aliases: ["Región de Los Lagos", "X"],
    cities: [
      "Ancud",
      "Calbuco",
      "Castro",
      "Chaitén",
      "Chonchi",
      "Cochamó",
      "Curaco de Vélez",
      "Dalcahue",
      "Fresia",
      "Frutillar",
      "Futaleufú",
      "Hualaihué",
      "Llanquihue",
      "Los Muermos",
      "Maullín",
      "Osorno",
      "Palena",
      "Puerto Montt",
      "Puerto Octay",
      "Puerto Varas",
      "Puqueldón",
      "Purranque",
      "Puyehue",
      "Queilén",
      "Quellón",
      "Quemchi",
      "Quinchao",
      "Río Negro",
      "San Juan de la Costa",
      "San Pablo",
    ],
  },
  {
    name: "Aysén",
    aliases: [
      "Región de Aysén",
      "Región de Aysén del General Carlos Ibáñez del Campo",
      "Aysén del General Carlos Ibáñez del Campo",
      "XI",
    ],
    cities: ["Chile Chico", "Cisnes", "Cochrane", "Coyhaique", "Guaitecas", "Lago Verde", "O'Higgins", "Puerto Aysén", "Río Ibáñez", "Tortel"],
  },
  {
    name: "Magallanes",
    aliases: [
      "Región de Magallanes",
      "Región de Magallanes y de la Antártica Chilena",
      "Magallanes y de la Antártica Chilena",
      "XII",
    ],
    cities: [
      "Antártica",
      "Cabo de Hornos",
      "Laguna Blanca",
      "Porvenir",
      "Primavera",
      "Puerto Natales",
      "Puerto Williams",
      "Punta Arenas",
      "Río Verde",
      "San Gregorio",
      "Timaukel",
      "Torres del Paine",
    ],
  },
];

function fold(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");
}

const regionByFold = new Map<string, string>();
const citiesByRegion = new Map<string, readonly string[]>();
const regionByCity = new Map<string, string>();
const ambiguousCities = new Set<string>();

for (const region of CHILE_REGIONS) {
  citiesByRegion.set(region.name, region.cities);
  for (const label of [region.name, ...region.aliases]) {
    regionByFold.set(fold(label), region.name);
  }
  for (const city of region.cities) {
    const key = fold(city);
    const previous = regionByCity.get(key);
    if (previous && previous !== region.name) {
      ambiguousCities.add(key);
      regionByCity.delete(key);
    } else if (!ambiguousCities.has(key)) {
      regionByCity.set(key, region.name);
    }
  }
}

/** País vacío o «Chile»: la ubicación usa esta lista. */
export function isChileCountry(country: string | null | undefined): boolean {
  const key = fold(country ?? "");
  return key === "" || key === "chile";
}

/** Nombre canónico de la región, o vacío si el texto no corresponde a ninguna. */
export function canonicalChileRegion(value: string | null | undefined): string {
  return regionByFold.get(fold(value ?? "")) ?? "";
}

/** Región de una ciudad, si el nombre aparece en una sola región. */
export function chileRegionForCity(city: string | null | undefined): string {
  return regionByCity.get(fold(city ?? "")) ?? "";
}

/** Ciudades de la región, en orden alfabético. La ciudad actual se conserva si no está en la lista. */
export function citiesInChileRegion(region: string | null | undefined, currentCity = ""): string[] {
  const name = canonicalChileRegion(region);
  const catalog = name ? [...(citiesByRegion.get(name) ?? [])] : [];
  catalog.sort((a, b) => a.localeCompare(b, "es"));
  const current = currentCity.trim();
  if (current && !catalog.some((city) => fold(city) === fold(current))) {
    catalog.unshift(current);
  }
  return catalog;
}

export function chileRegionNames(current = ""): string[] {
  const names = CHILE_REGIONS.map((region) => region.name);
  const canonical = canonicalChileRegion(current);
  const extra = current.trim();
  if (extra && !canonical) names.unshift(extra);
  return names;
}
