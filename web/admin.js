
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, getDocs, updateDoc, deleteDoc, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';
import { firebaseConfig } from './firebase.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// UI elements
const authBox = document.getElementById('auth');
const authed = document.getElementById('authed');
const email = document.getElementById('email');
const password = document.getElementById('password');
const signInBtn = document.getElementById('signInBtn');
const authStatus = document.getElementById('authStatus');
const signOutBtn = document.getElementById('signOutBtn');

const restoNameInput = document.getElementById('restoNameInput');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const heroFile = document.getElementById('heroFile');
const uploadHeroBtn = document.getElementById('uploadHeroBtn');
const heroStatus = document.getElementById('heroStatus');

const nameEl = document.getElementById('name');
const descriptionEl = document.getElementById('description');
const categoryEl = document.getElementById('category');
const priceEl = document.getElementById('price');
const sortEl = document.getElementById('sort');
const photoEl = document.getElementById('photo');
const addBtn = document.getElementById('addBtn');
const addStatus = document.getElementById('addStatus');

const itemsTable = document.querySelector('#itemsTable tbody');

const qrUrl = document.getElementById('qrUrl');
const makeQrBtn = document.getElementById('makeQrBtn');
const downloadQrBtn = document.getElementById('downloadQrBtn');
let qr;

function setLoading(el, on, text='Working...'){
  if(!el) return;
  if(on){ el.textContent = text; } else { el.textContent = ''; }
}

// Auth state handling
onAuthStateChanged(auth, async (user) => {
  if(user){
    authBox.style.display = 'none';
    authed.style.display = 'block';
    await loadSettings();
    await refreshItems();
  }else{
    authed.style.display = 'none';
    authBox.style.display = 'block';
  }
});

signInBtn.onclick = async () => {
  setLoading(authStatus, true, 'Signing in...');
  try{
    await signInWithEmailAndPassword(auth, email.value, password.value);
    setLoading(authStatus, false);
  }catch(e){
    setLoading(authStatus, true, e.message);
    setTimeout(()=>setLoading(authStatus,false), 4000);
  }
};

signOutBtn.onclick = () => signOut(auth);

// Settings
async function loadSettings(){
  const snap = await getDoc(doc(db,'settings','main'));
  if(snap.exists()){
    const s = snap.data();
    restoNameInput.value = s.name || '';
  }
}

saveSettingsBtn.onclick = async () => {
  setLoading(heroStatus, true, 'Saving...');
  try{
    await setDoc(doc(db,'settings','main'), {
      name: restoNameInput.value || 'Restaurant'
    }, { merge:true });
    setLoading(heroStatus, true, 'Saved ✔');
    setTimeout(()=>setLoading(heroStatus,false), 2000);
  }catch(e){
    setLoading(heroStatus, true, e.message);
    setTimeout(()=>setLoading(heroStatus,false), 4000);
  }
};

uploadHeroBtn.onclick = async () => {
  if(!heroFile.files[0]){ setLoading(heroStatus,true,'Choose a file first'); setTimeout(()=>setLoading(heroStatus,false),2000); return; }
  setLoading(heroStatus,true,'Uploading...');
  try{
    const f = heroFile.files[0];
    const r = ref(storage, 'images/hero-' + Date.now() + '-' + f.name);
    await uploadBytes(r, f);
    const url = await getDownloadURL(r);
    await setDoc(doc(db,'settings','main'), { heroImageURL: url }, { merge:true });
    setLoading(heroStatus,true,'Uploaded ✔');
    setTimeout(()=>setLoading(heroStatus,false), 2000);
  }catch(e){
    setLoading(heroStatus,true,e.message);
    setTimeout(()=>setLoading(heroStatus,false), 4000);
  }
};

// Items
addBtn.onclick = async () => {
  setLoading(addStatus,true,'Adding item...');
  try{
    let imageURL = '';
    if(photoEl.files[0]){
      const f = photoEl.files[0];
      const r = ref(storage, 'images/items/' + Date.now() + '-' + f.name);
      await uploadBytes(r, f);
      imageURL = await getDownloadURL(r);
    }
    const docRef = await addDoc(collection(db,'menuItems'), {
      name: nameEl.value, description: descriptionEl.value,
      category: categoryEl.value, price: Number(priceEl.value || 0),
      available: true, imageURL, sort: Number(sortEl.value || 0)
    });
    // clear form
    nameEl.value = descriptionEl.value = categoryEl.value = '';
    priceEl.value = ''; sortEl.value = 0; photoEl.value = '';
    setLoading(addStatus,true,'Added ✔');
    await refreshItems();
    setTimeout(()=>setLoading(addStatus,false), 2000);
  }catch(e){
    setLoading(addStatus,true,e.message);
    setTimeout(()=>setLoading(addStatus,false),4000);
  }
};

async function refreshItems(){
  const q = query(collection(db,'menuItems'), orderBy('category'), orderBy('sort'), orderBy('name'));
  const snap = await getDocs(q);
  const rows = snap.docs.map(d => ({id:d.id, ...d.data()}));
  renderRows(rows);
}

function renderRows(rows){
  itemsTable.innerHTML='';
  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="input" value="${r.name??''}" data-k="name"></td>
      <td><input class="input" value="${r.category??''}" data-k="category"></td>
      <td><input class="input" type="number" step="0.01" value="${r.price??0}" data-k="price" style="max-width:120px"></td>
      <td><input type="checkbox" ${r.available!==false?'checked':''} data-k="available"></td>
      <td class="flex">
        <button class="button secondary" data-act="save">Save</button>
        <button class="button danger" data-act="del">Delete</button>
      </td>
    `;
    tr.querySelector('[data-act="save"]').onclick = async () => {
      const name = tr.querySelector('[data-k="name"]').value;
      const category = tr.querySelector('[data-k="category"]').value;
      const price = Number(tr.querySelector('[data-k="price"]').value || 0);
      const available = tr.querySelector('[data-k="available"]').checked;
      await updateDoc(doc(db,'menuItems', r.id), { name, category, price, available });
      await refreshItems();
    };
    tr.querySelector('[data-act="del"]').onclick = async () => {
      if(confirm('Delete this item?')){
        await deleteDoc(doc(db,'menuItems', r.id));
        await refreshItems();
      }
    };
    itemsTable.appendChild(tr);
  });
}

// QR
makeQrBtn.onclick = () => {
  const url = qrUrl.value.trim();
  if(!url) return;
  const box = document.getElementById('qrcode');
  box.innerHTML='';
  qr = new QRCode(box, { text: url, width: 180, height: 180 });
};

downloadQrBtn.onclick = () => {
  const img = document.querySelector('#qrcode img') || document.querySelector('#qrcode canvas');
  if(!img){ alert('Generate QR first'); return; }
  let link = document.createElement('a');
  link.download = 'menu-qr.png';
  link.href = img.src || img.toDataURL('image/png');
  link.click();
};
