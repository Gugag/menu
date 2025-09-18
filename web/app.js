
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, getDocs, doc, getDoc, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { firebaseConfig } from './firebase.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const hero = document.getElementById('hero');
const restoName = document.getElementById('restoName');
const grid = document.getElementById('menuGrid');
const filters = document.getElementById('filters');
const itemCount = document.getElementById('itemCount');

const CURRENCY = '₾';

async function loadSettings(){
  const snap = await getDoc(doc(db,'settings','main'));
  if(snap.exists()){
    const s = snap.data();
    if(s.name) restoName.textContent = s.name;
    if(s.heroImageURL) hero.style.backgroundImage = `url('${s.heroImageURL}')`;
  }
}

function fmtPrice(n){
  if(typeof n !== 'number') return n;
  return new Intl.NumberFormat(undefined, { style:'currency', currency:'GEL', currencyDisplay:'narrowSymbol' }).format(n).replace('GEL', CURRENCY);
}

let allItems = [];
let activeCat = 'All';

async function loadMenu(){
  const q = query(collection(db,'menuItems'), orderBy('category'), orderBy('sort'), orderBy('name'));
  const snap = await getDocs(q);
  allItems = snap.docs.map(d => ({id:d.id, ...d.data()})).filter(x => x.available !== false);
  renderFilters();
  renderGrid();
}

function renderFilters(){
  const cats = ['All', ...Array.from(new Set(allItems.map(i => i.category).filter(Boolean)))];
  filters.innerHTML = '';
  cats.forEach(c => {
    const chip = document.createElement('div');
    chip.className = 'chip' + (c===activeCat?' active':'');
    chip.textContent = c;
    chip.onclick = () => { activeCat = c; renderFilters(); renderGrid(); };
    filters.appendChild(chip);
  });
}

function renderGrid(){
  grid.innerHTML = '';
  const items = activeCat==='All' ? allItems : allItems.filter(i => i.category === activeCat);
  itemCount.textContent = items.length + ' item' + (items.length===1?'':'s');
  items.forEach(i => {
    const card = document.createElement('div');
    card.className = 'card item';
    const img = document.createElement('img');
    img.src = i.imageURL || 'data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"92\" height=\"92\"><rect width=\"100%\" height=\"100%\" fill=\"%23222\"/><text x=\"50%\" y=\"50%\" dominant-baseline=\"middle\" text-anchor=\"middle\" fill=\"%23666\" font-size=\"12\">No image</text></svg>';
    const meta = document.createElement('div');
    meta.className = 'meta';
    const name = document.createElement('div'); name.className='name'; name.textContent = i.name;
    const desc = document.createElement('div'); desc.className='desc'; desc.textContent = i.description || '';
    const line = document.createElement('div'); line.className='line';
    const cat = document.createElement('div'); cat.className='muted'; cat.textContent = i.category || '';
    const price = document.createElement('div'); price.className='price'; price.textContent = fmtPrice(i.price);
    line.appendChild(cat); line.appendChild(price);
    meta.appendChild(name); meta.appendChild(desc); meta.appendChild(line);
    card.appendChild(img); card.appendChild(meta);
    grid.appendChild(card);
  });
}

await loadSettings();
await loadMenu();
