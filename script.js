// 1. HTML Elemanlarını JavaScript Tarafında Yakalıyoruz
const finansForm = document.getElementById('finansForm');
const aciklamaInput = document.getElementById('aciklama');
const miktarInput = document.getElementById('miktar');
const kategoriSelect = document.getElementById('kategori');
const islemListesiDOM = document.getElementById('islemListesi');
const toplamBakiyeDOM = document.getElementById('toplamBakiye');
const aramaKutusu = document.getElementById('aramaKutusu');

// Tüm finansal hareketleri hafızada tutacağımız yerel dizi
let tumIslemler = [];

const API_URL = 'https://ertisya-backend.mehmetberkucmakli.workers.dev/api/giderler';

// 2. Sunucudan Verileri Çeken Ana Fonksiyon
async function finansalVerileriGetir() {
    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error('Backend bağlantı hatası: ' + response.status);
        }

        // Düzeltme: const kaldırıldı, dışarıdaki tumIslemler güncelleniyor
        tumIslemler = await response.json();
        
        console.log("Köprü kuruldu, veri geldi:", tumIslemler);

        ekranaBas(tumIslemler);
        // Düzeltme: Fonksiyon ismi doğru yazıldı
        kasaBakiyesiHesapla(tumIslemler);

    } catch (error) {
        console.error('Köprü kurulamadı:', error);
    }
}

// Sayfa açıldığında veriyi getir
finansalVerileriGetir();

// 3. Verileri HTML Listesine Basan Fonksiyon
function ekranaBas(islemler) {
    islemListesiDOM.innerHTML = '';

    islemler.forEach(islem => {
        const li = document.createElement('li');
        
        if (islem.islemTipi === 'gelir') {
            li.classList.add('gelir-satiri');
        } else {
            li.classList.add('gider-satiri');
        }

        li.innerHTML = `
            <div>
                <strong>${islem.aciklama}</strong> - ${islem.miktar} TL 
                <small style="color: #7f8c8d; margin-left: 10px;">(${islem.kategori} - ${islem.tarih})</small>
            </div>
            <button class="sil-btn" onclick="islemSil(${islem.id})">Sil</button>
        `;
        islemListesiDOM.appendChild(li);
    });
}

// 4. Kasa Bakiyesini Hesaplayan Algoritma
function kasaBakiyesiHesapla(islemler) {
    const netBakiye = islemler.reduce((toplam, islem) => {
        const miktar = parseFloat(islem.miktar) || 0;
        if (islem.islemTipi === 'gelir') {
            return toplam + miktar;
        } else {
            return toplam - miktar;
        }
    }, 0);

    toplamBakiyeDOM.textContent = `${netBakiye} TL`;
    toplamBakiyeDOM.style.color = netBakiye < 0 ? '#e74c3c' : '#27ae60';
}

// 5. Yeni İşlem Ekleme (POST)
finansForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const secilenKategori = kategoriSelect.value;
    let otomatikIslemTipi = 'gider'; 

    if (
        secilenKategori === 'Proje/Yazılım Satışı' ||
        secilenKategori === 'SaaS/Lisans Aboneliği' ||
        secilenKategori === 'Bakım & Destek Sözleşmesi'
    ) {
        otomatikIslemTipi = 'gelir';
    }

    const yeniIslem = {
        islemTipi: otomatikIslemTipi,
        aciklama: aciklamaInput.value,
        miktar: miktarInput.value,
        kategori: secilenKategori
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(yeniIslem)
        });

        if (response.ok) {
            finansForm.reset();
            finansalVerileriGetir(); 
        }
    } catch (error) {
        console.error('İşlem kaydedilirken hata:', error);
    }
});

// 6. İşlem Silme (DELETE)
async function islemSil(id) {
    if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            finansalVerileriGetir();
        }
    } catch (error) {
        console.error('Silme hatası:', error);
    }
}

// 7. Arama Motoru
aramaKutusu.addEventListener('keyup', (e) => {
    const arananKelime = e.target.value.toLowerCase();
    const filtrelenmisIslemler = tumIslemler.filter(islem => 
        islem.aciklama.toLowerCase().includes(arananKelime) || 
        islem.kategori.toLowerCase().includes(arananKelime)
    );
    ekranaBas(filtrelenmisIslemler);
});