// 1. SUPABASE KURULUMU (Temiz başlangıç)
const supabaseUrl = 'https://mjmmfyuymrzsdeymnfvs.supabase.co';
const supabaseKey = 'sb_publishable_aa2L1IT-Ee8Bu1wd783kMw_lprHEpMk'; 
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// 2. HTML ELEMANLARI
const finansForm = document.getElementById('finansForm');
const islemListesiDOM = document.getElementById('islemListesi');
const toplamBakiyeDOM = document.getElementById('toplamBakiye');

// 3. GİRİŞ KONTROLÜ
async function kontrolEt() {
    const { data: { session } } = await supabase.auth.getSession();
    const authDiv = document.getElementById('auth-container');
    const appDiv = document.getElementById('app-container');

    if (session) {
        if(authDiv) authDiv.style.display = 'none';
        if(appDiv) appDiv.style.display = 'block';
        verileriGetir(); // Verileri Supabase'den çek
    } else {
        if(authDiv) authDiv.style.display = 'block';
        if(appDiv) appDiv.style.display = 'none';
    }
}

// 4. SUPABASE'DEN VERİ ÇEKME
async function verileriGetir() {
    const { data, error } = await supabase
        .from('islemler') // Supabase'de 'islemler' tablosu olmalı
        .select('*');

    if (error) {
        console.error("Veri çekme hatası:", error);
    } else {
        ekranaBas(data);
        kasaBakiyesiHesapla(data);
    }
}

// 5. EKRANA BASMA VE HESAPLAMA (Senin eski fonksiyonların)
function ekranaBas(islemler) {
    islemListesiDOM.innerHTML = '';
    islemler.forEach(islem => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${islem.aciklama}</strong> - ${islem.miktar} TL 
                        <button onclick="islemSil(${islem.id})">Sil</button>`;
        islemListesiDOM.appendChild(li);
    });
}

function kasaBakiyesiHesapla(islemler) {
    const netBakiye = islemler.reduce((top, i) => i.islemTipi === 'gelir' ? top + i.miktar : top - i.miktar, 0);
    toplamBakiyeDOM.textContent = `${netBakiye} TL`;
}

// 6. GİRİŞ YAPMA FONKSİYONU
async function girisYap() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('sifre').value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else location.reload();
}

// BAŞLAT
kontrolEt();