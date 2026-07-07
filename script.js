// 1. HTML Elemanlarını JavaScript Tarafında Yakalıyoruz
const finansForm = document.getElementById('finansForm');
const aciklamaInput = document.getElementById('aciklama');
const miktarInput = document.getElementById('miktar');
const kategoriSelect = document.getElementById('kategori');
const islemListesiDOM = document.getElementById('islemListesi');
const toplamBakiyeDOM = document.getElementById('toplamBakiye');
const aramaKutusu = document.getElementById('aramaKutusu');

// Tüm finansal hareketleri hafızada tutacağımız yerel dizi (Arama yaparken kullanacağız)
let tumIslemler = [];

const API_URL = 'https://ertisya-backend.mehmetberkucmakli.workers.dev/api/giderler';

// 2. Sunucudan Verileri Çeken ve Kasa Bakiyesini Hesaplayan Ana Fonksiyon
// Verileri backend'den çeken ve köprüyü kuran fonksiyon
async function finansalVerileriGetir() {
    try {
        const response = await fetch(API_URL);
        
        // Eğer bağlantı hatası varsa (404, 500 gibi) fırlat
        if (!response.ok) {
            throw new Error('Backend bağlantı hatası: ' + response.status);
        }

        const tumIslemler = await response.json();
        
        // Veri başarıyla geldi mi? Konsolda görelim:
        console.log("Köprü kuruldu, veri geldi:", tumIslemler);

        // Verileri ekrana bas
        ekranaBas(tumIslemler);
        kasaBakiyesiniHesapla(tumIslemler);

    } catch (error) {
        console.error('Köprü kurulamadı:', error);
    }
}

// Sayfa açıldığında bu fonksiyonu tetikle ki veri hemen gelsin
finansalVerileriGetir();

// 3. Verileri HTML Listesine Dinamik Olarak Basan Fonksiyon
function ekranaBas(islemler) {
    islemListesiDOM.innerHTML = '';

    islemler.forEach(islem => {
        const li = document.createElement('li');
        
        // İşlem tipine göre CSS sınıfı atıyoruz (Yeşil veya Kırmızı şerit)
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

// 4. Kasa Bakiyesini (Gelir - Gider) Hesaplayan Algoritma (Business Logic)
function kasaBakiyesiHesapla(islemler) {
    const netBakiye = islemler.reduce((toplam, islem) => {
        const miktar = parseFloat(islem.miktar);
        if (islem.islemTipi === 'gelir') {
            return toplam + miktar; // Gelir ise kasaya ekle
        } else {
            return toplam - miktar; // Gider ise kasadan düş
        }
    }, 0);

    // Bakiyeyi ekrana yazdırıyoruz
    toplamBakiyeDOM.textContent = `${netBakiye} TL`;

    // Eğer şirket zarardaysa bakiyeyi kırmızı, kârdaysa yeşil yapıyoruz
    if (netBakiye < 0) {
        toplamBakiyeDOM.style.color = '#e74c3c'; // Kırmızı
    } else {
        toplamBakiyeDOM.style.color = '#27ae60'; // Yeşil
    }
}

// 5. Yeni İşlem Ekleme (POST) Fonksiyonu - Akıllı Kategori Kontrollü
finansForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const secilenKategori = kategoriSelect.value;
    let otomatikIslemTipi = 'gider'; // Varsayılan olarak gider kabul edelim

    // Eğer seçilen kategori bu üç gelir kaleminden biriyse tipi otomatik 'gelir' yapıyoruz
    if (
        secilenKategori === 'Proje/Yazılım Satışı' ||
        secilenKategori === 'SaaS/Lisans Aboneliği' ||
        secilenKategori === 'Bakım & Destek Sözleşmesi'
    ) {
        otomatikIslemTipi = 'gelir';
    }

    const yeniIslem = {
        islemTipi: otomatikIslemTipi, // Algoritma bizim yerimize kararı verdi!
        aciklama: aciklamaInput.value,
        miktar: miktarInput.value,
        kategori: secilenKategori
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(yeniIslem)
        });

        if (response.ok) {
            finansForm.reset();
            finansalVerileriGetir(); // Kasayı ve listeyi güncelle
        }
    } catch (error) {
        console.error('İşlem kaydedilirken hata oluştu:', error);
    }
});

// 6. İşlem Silme (DELETE) Fonksiyonu
async function islemSil(id) {
    if (!confirm('Bu finansal kaydı silmek istediğinize emin misiniz? Şirket muhasebe kayıtlarından kaldırılacaktır.')) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            finansalVerileriGetir();
        }
    } catch (error) {
        console.error('Kayıt silinirken hata oluştu:', error);
    }
}

// 7. GERÇEK ZAMANLI ARAMA MOTORU (Real-time Search)
aramaKutusu.addEventListener('keyup', (e) => {
    const arananKelime = e.target.value.toLowerCase();

    const filtrelenmişIslemler = tumIslemler.filter(islem => {
        return islem.aciklama.toLowerCase().includes(arananKelime) || 
               islem.kategori.toLowerCase().includes(arananKelime);
    });

    ekranaBas(filtrelenmişIslemler);
});

// Sayfa ilk yüklendiğinde mevcut verileri getir
finansalVerileriGetir();