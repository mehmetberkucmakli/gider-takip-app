const supabaseUrl = 'https://mjmmfyuymrzsdeymnfvs.supabase.co';
const supabaseKey = 'sb_publishable_aa2L1It-Ee8Bu1wd783kMw_lprHEpMk';
const davetKodu = 'ERTISYA2026';
const registerApiUrl = '';
const gelirKategorileri = ['Maaş', 'Satış', 'Hizmet Geliri', 'Kira Geliri', 'Yatırım', 'Diğer Gelir'];
const giderKategorileri = ['Kira', 'Fatura', 'Market', 'Ulaşım', 'Yemek', 'Sağlık', 'Eğitim', 'Vergi', 'Personel', 'Malzeme', 'Abonelik', 'Diğer Gider'];
const kategoriTakmaAdlari = {
    Maas: 'Maaş',
    Satis: 'Satış',
    Yatirim: 'Yatırım',
    Ulasim: 'Ulaşım',
    Saglik: 'Sağlık',
    Egitim: 'Eğitim',
    'Diger Gelir': 'Diğer Gelir',
    'Diger Gider': 'Diğer Gider'
};

const sb = supabase.createClient(supabaseUrl, supabaseKey);

let tumIslemler = [];
let filtrelenenIslemler = null;
let authModu = 'giris';
let aktifKullanici = null;
let duzenlenenIslemId = null;

document.addEventListener('DOMContentLoaded', async () => {
    const { data } = await sb.auth.getSession();

    if (data.session) {
        aktifKullanici = data.session.user;
        uygulamayiGoster();
        await giderleriYukle();
    } else {
        girisiGoster();
    }

    document.getElementById('finansForm')?.addEventListener('submit', islemKaydet);
    document.getElementById('aramaKutusu')?.addEventListener('input', (event) => {
        islemleriListele(event.target.value);
    });
    document.getElementById('tipFiltresi')?.addEventListener('change', () => islemleriListele());
    document.getElementById('donemFiltresi')?.addEventListener('change', () => islemleriListele());
    document.getElementById('kategoriFiltresi')?.addEventListener('change', () => islemleriListele());
    document.getElementById('islemTipi')?.addEventListener('change', kategoriSecenekleriniGuncelle);
    kategoriSecenekleriniGuncelle();
    tarihAlaniniBuguneAyarla();
});

async function girisYap() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('sifre').value;

    if (authModu === 'kayit') {
        await kayitOl();
        return;
    }

    if (!email || !password) {
        alert('Lütfen e-posta ve şifre girin.');
        return;
    }

    const { data, error } = await sb.auth.signInWithPassword({ email, password });

    if (error) {
        alert(
            'Giriş başarısız: ' + error.message +
            '\n\nNot: Supabase tablosundaki kayıtlarla giriş yapılmaz. Kullanıcı Authentication > Users bölümünde oluşturulmuş olmalı.'
        );
        return;
    }

    aktifKullanici = data.user;
    uygulamayiGoster();
    await giderleriYukle();
}

async function kayitOl() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('sifre').value;
    const passwordAgain = document.getElementById('sifreTekrar').value;
    const inviteCode = document.getElementById('davetKodu').value.trim();

    if (!email || !password || !passwordAgain || !inviteCode) {
        alert('Lütfen tüm kayıt alanlarını doldurun.');
        return;
    }

    if (password.length < 6) {
        alert('Şifre en az 6 karakter olmalı.');
        return;
    }

    if (password !== passwordAgain) {
        alert('Şifreler aynı değil.');
        return;
    }

    if (registerApiUrl) {
        await backendUzerindenKayitOl(email, password, inviteCode);
        return;
    }

    if (inviteCode !== davetKodu) {
        alert('Davet kodu hatalı.');
        return;
    }

    const { error } = await sb.auth.signUp({ email, password });

    if (error) {
        alert('Kayıt başarısız: ' + error.message);
        return;
    }

    alert('Kayıt oluşturuldu. E-posta onayı açıksa, gelen kutusundan onay verdikten sonra giriş yapabilirsin.');
    authModunuAyarla('giris');
}

async function backendUzerindenKayitOl(email, password, inviteCode) {
    try {
        const response = await fetch(registerApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, inviteCode })
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(result.error || 'Kayıt tamamlanamadı.');
        }

        alert('Kayıt oluşturuldu. Şimdi giriş yapabilirsin.');
        authModunuAyarla('giris');
    } catch (error) {
        alert('Kayıt başarısız: ' + error.message);
    }
}

function authModunuDegistir() {
    authModunuAyarla(authModu === 'giris' ? 'kayit' : 'giris');
}

function authModunuAyarla(yeniMod) {
    authModu = yeniMod;

    const kayitModu = authModu === 'kayit';
    document.getElementById('auth-title').textContent = kayitModu ? 'Davet kodu ile kayıt ol' : 'Hesabınıza giriş yapın';
    document.getElementById('auth-submit').textContent = kayitModu ? 'Kayıt Ol' : 'Giriş Yap';
    document.getElementById('auth-toggle').textContent = kayitModu ? 'Giriş ekranına dön' : 'Kayıt ol';
    document.getElementById('sifreTekrar').style.display = kayitModu ? 'block' : 'none';
    document.getElementById('davetKodu').style.display = kayitModu ? 'block' : 'none';
}

async function cikisYap() {
    await sb.auth.signOut();
    aktifKullanici = null;
    girisiGoster();
}

function girisiGoster() {
    document.getElementById('auth-container').style.display = 'block';
    document.getElementById('app-container').style.display = 'none';
}

function uygulamayiGoster() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    aktifKullaniciBilgisiniGoster();
    cikisButonuEkle();
}

function aktifKullaniciBilgisiniGoster() {
    const element = document.getElementById('aktifKullaniciBilgisi');

    if (!element || !aktifKullanici) return;

    element.textContent = `Aktif hesap: ${aktifKullanici.email}`;
}

function cikisButonuEkle() {
    if (document.getElementById('cikisBtn')) return;

    const button = document.createElement('button');
    button.id = 'cikisBtn';
    button.type = 'button';
    button.textContent = 'Çıkış Yap';
    button.style.marginBottom = '16px';
    button.onclick = cikisYap;

    document.getElementById('app-container').prepend(button);
}

async function giderleriYukle() {
    const user = await aktifKullaniciyiGetir();

    if (!user) {
        girisiGoster();
        return;
    }

    const { data, error } = await sb
        .from('islemler')
        .select('*')
        .eq('user_id', user.id)
        .order('id', { ascending: true });

    if (error) {
        alert('Kayıtlar yüklenemedi: ' + error.message);
        return;
    }

    tumIslemler = data || [];
    kategoriFiltresiniGuncelle();
    islemleriListele();
}

async function islemKaydet(event) {
    event.preventDefault();

    const user = await aktifKullaniciyiGetir();

    if (!user) {
        alert('İşlem eklemek için tekrar giriş yapın.');
        girisiGoster();
        return;
    }

    const aciklama = document.getElementById('aciklama').value.trim();
    const miktar = Number(document.getElementById('miktar').value);
    const islemTipi = document.getElementById('islemTipi').value;
    const kategori = document.getElementById('kategori').value;
    const tarih = tarihInputunuKayitFormatinaCevir(document.getElementById('tarih').value);

    if (!tarih) {
        alert('Lütfen işlem tarihini seçin.');
        return;
    }

    const payload = {
        aciklama,
        miktar,
        kategori,
        islemTipi,
        tarih,
        user_id: user.id
    };

    const { error } = duzenlenenIslemId
        ? await sb
            .from('islemler')
            .update(payload)
            .eq('id', duzenlenenIslemId)
            .eq('user_id', user.id)
        : await sb.from('islemler').insert([payload]);

    if (error) {
        alert('Kayıt kaydedilemedi: ' + error.message);
        return;
    }

    formuSifirla();
    await giderleriYukle();
}

function islemDuzenle(id) {
    const islem = tumIslemler.find((item) => item.id === id);

    if (!islem) {
        alert('Düzenlenecek kayıt bulunamadı.');
        return;
    }

    duzenlenenIslemId = id;
    document.getElementById('aciklama').value = islem.aciklama || '';
    document.getElementById('miktar').value = islem.miktar || '';
    document.getElementById('tarih').value = tarihMetniniInputFormatinaCevir(islem.tarih) || bugununInputTarihi();
    document.getElementById('islemTipi').value = islemTipiBul(islem) ? 'gelir' : 'gider';
    kategoriSecenekleriniGuncelle();
    document.getElementById('kategori').value = kategoriAdiniNormalizeEt(islem.kategori, islemTipiBul(islem)) || '';
    document.getElementById('formSubmitBtn').textContent = 'Güncelle';
    document.getElementById('duzenlemeIptalBtn').style.display = 'block';
    document.getElementById('finansForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function duzenlemeyiIptalEt() {
    formuSifirla();
}

function formuSifirla() {
    duzenlenenIslemId = null;
    document.getElementById('finansForm').reset();
    kategoriSecenekleriniGuncelle();
    tarihAlaniniBuguneAyarla();
    document.getElementById('formSubmitBtn').textContent = 'Sisteme İşle';
    document.getElementById('duzenlemeIptalBtn').style.display = 'none';
}

async function islemSil(id) {
    const user = await aktifKullaniciyiGetir();

    if (!user) {
        alert('İşlem silmek için tekrar giriş yapın.');
        girisiGoster();
        return;
    }

    const { error } = await sb
        .from('islemler')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        alert('Kayıt silinemedi: ' + error.message);
        return;
    }

    await giderleriYukle();
}

async function aktifKullaniciyiGetir() {
    if (aktifKullanici) return aktifKullanici;

    const { data, error } = await sb.auth.getUser();

    if (error || !data.user) return null;

    aktifKullanici = data.user;
    return aktifKullanici;
}

function islemleriListele(aramaMetni = '') {
    const liste = document.getElementById('islemListesi');
    const toplamBakiye = document.getElementById('toplamBakiye');
    const aramaKutusu = document.getElementById('aramaKutusu');
    const tipFiltresi = document.getElementById('tipFiltresi')?.value || 'tum';
    const donemFiltresi = document.getElementById('donemFiltresi')?.value || 'tum';
    const kategoriFiltresi = document.getElementById('kategoriFiltresi')?.value || 'tum';
    const filtre = (aramaMetni || aramaKutusu?.value || '').toLocaleLowerCase('tr-TR');

    liste.innerHTML = '';

    const gosterilecekIslemler = tumIslemler.filter((islem) => {
        const aciklama = String(islem.aciklama || '').toLocaleLowerCase('tr-TR');
        const isGelir = islemTipiBul(islem);
        const kategori = kategoriAdiniNormalizeEt(islem.kategori, isGelir).toLocaleLowerCase('tr-TR');
        const metinUyuyor = aciklama.includes(filtre) || kategori.includes(filtre);
        const tipUyuyor =
            tipFiltresi === 'tum' ||
            (tipFiltresi === 'gelir' && isGelir) ||
            (tipFiltresi === 'gider' && !isGelir);
        const kategoriUyuyor = kategoriFiltresi === 'tum' || kategoriAdiniNormalizeEt(islem.kategori, isGelir) === kategoriFiltresi;
        const donemUyuyor = islemDonemeUyuyor(islem, donemFiltresi);

        return metinUyuyor && tipUyuyor && kategoriUyuyor && donemUyuyor;
    });

    filtrelenenIslemler = gosterilecekIslemler;

    if (gosterilecekIslemler.length === 0) {
        const li = document.createElement('li');
        li.className = 'bos-liste';
        li.textContent = tumIslemler.length === 0
            ? 'Henüz işlem kaydı yok.'
            : 'Bu filtreye uygun işlem bulunamadı.';
        liste.appendChild(li);
    }

    gosterilecekIslemler.forEach((islem) => {
        const isGelir = islemTipiBul(islem);
        const kategori = kategoriAdiniNormalizeEt(islem.kategori, isGelir);
        const li = document.createElement('li');
        li.className = isGelir ? 'gelir-satiri' : 'gider-satiri';

        li.innerHTML = `
            <span>
                <strong>${islem.aciklama}</strong><br>
                ${islem.tarih || '-'} - ${kategori} - ${Number(islem.miktar).toLocaleString('tr-TR')} TL
            </span>
            <span class="islem-actions">
                <button class="duzenle-btn" type="button" onclick="islemDuzenle(${islem.id})">Düzenle</button>
                <button class="sil-btn" type="button" onclick="islemSil(${islem.id})">Sil</button>
            </span>
        `;

        liste.appendChild(li);
    });

    const bakiye = gosterilecekIslemler.reduce((toplam, islem) => {
        const miktar = Number(islem.miktar) || 0;
        const isGelir = islemTipiBul(islem);
        return toplam + (isGelir ? miktar : -miktar);
    }, 0);

    toplamBakiye.textContent = `${bakiye.toLocaleString('tr-TR')} TL`;
    toplamBakiye.style.color = bakiye >= 0 ? '#27ae60' : '#e74c3c';
    raporuGuncelle(gosterilecekIslemler);
}

function csvDisariAktar() {
    const aktarilacakIslemler = Array.isArray(filtrelenenIslemler) ? filtrelenenIslemler : tumIslemler;

    if (aktarilacakIslemler.length === 0) {
        alert('Aktarılacak işlem bulunamadı.');
        return;
    }

    const basliklar = ['Tarih', 'Tip', 'Kategori', 'Açıklama', 'Miktar'];
    const satirlar = aktarilacakIslemler.map((islem) => {
        const isGelir = islemTipiBul(islem);

        return [
            islem.tarih || '',
            isGelir ? 'Gelir' : 'Gider',
            kategoriAdiniNormalizeEt(islem.kategori, isGelir),
            islem.aciklama || '',
            Number(islem.miktar) || 0
        ];
    });

    const csv = [basliklar, ...satirlar]
        .map((satir) => satir.map(csvHucreHazirla).join(';'))
        .join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `finans-islemleri-${bugununInputTarihi()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

function csvHucreHazirla(deger) {
    const metin = String(deger).replaceAll('"', '""');
    return `"${metin}"`;
}

function raporuGuncelle(islemler) {
    const raporGelir = document.getElementById('raporGelir');
    const raporGider = document.getElementById('raporGider');
    const raporNet = document.getElementById('raporNet');
    const raporKategori = document.getElementById('raporKategori');

    if (!raporGelir || !raporGider || !raporNet || !raporKategori) return;

    const ozet = islemler.reduce((sonuc, islem) => {
        const miktar = Number(islem.miktar) || 0;
        const isGelir = islemTipiBul(islem);
        const kategori = kategoriAdiniNormalizeEt(islem.kategori, isGelir);

        if (isGelir) {
            sonuc.gelir += miktar;
        } else {
            sonuc.gider += miktar;
        }

        sonuc.kategoriler[kategori] = (sonuc.kategoriler[kategori] || 0) + miktar;
        return sonuc;
    }, { gelir: 0, gider: 0, kategoriler: {} });

    const net = ozet.gelir - ozet.gider;
    const oneCikanKategori = Object.entries(ozet.kategoriler)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

    raporGelir.textContent = `${ozet.gelir.toLocaleString('tr-TR')} TL`;
    raporGider.textContent = `${ozet.gider.toLocaleString('tr-TR')} TL`;
    raporNet.textContent = `${net.toLocaleString('tr-TR')} TL`;
    raporNet.style.color = net >= 0 ? '#27ae60' : '#e74c3c';
    raporKategori.textContent = oneCikanKategori;
}

function kategoriFiltresiniGuncelle() {
    const select = document.getElementById('kategoriFiltresi');

    if (!select) return;

    const seciliDeger = select.value;
    const kategoriler = [...new Set(tumIslemler.map((islem) => kategoriAdiniNormalizeEt(islem.kategori, islemTipiBul(islem))).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, 'tr')
    );

    select.innerHTML = '<option value="tum">Tüm kategoriler</option>';

    kategoriler.forEach((kategori) => {
        const option = document.createElement('option');
        option.value = kategori;
        option.textContent = kategori;
        select.appendChild(option);
    });

    if ([...select.options].some((option) => option.value === seciliDeger)) {
        select.value = seciliDeger;
    }
}

function islemDonemeUyuyor(islem, donem) {
    if (donem === 'tum') return true;

    const tarih = tarihMetniniTariheCevir(islem.tarih);

    if (!tarih) return false;

    const bugun = new Date();
    const hedefYil = bugun.getFullYear();
    const hedefAy = donem === 'bu-ay' ? bugun.getMonth() : bugun.getMonth() - 1;
    const hedefTarih = new Date(hedefYil, hedefAy, 1);

    return tarih.getFullYear() === hedefTarih.getFullYear() && tarih.getMonth() === hedefTarih.getMonth();
}

function tarihMetniniTariheCevir(tarihMetni) {
    if (!tarihMetni) return null;

    const parcalar = String(tarihMetni).split('.');

    if (parcalar.length !== 3) return null;

    const [gun, ay, yil] = parcalar.map(Number);

    if (!gun || !ay || !yil) return null;

    return new Date(yil, ay - 1, gun);
}

function tarihInputunuKayitFormatinaCevir(inputTarihi) {
    if (!inputTarihi) return '';

    const [yil, ay, gun] = inputTarihi.split('-');

    if (!gun || !ay || !yil) return '';

    return `${gun}.${ay}.${yil}`;
}

function tarihMetniniInputFormatinaCevir(tarihMetni) {
    const tarih = tarihMetniniTariheCevir(tarihMetni);

    if (!tarih) return '';

    return tarihiInputFormatinaCevir(tarih);
}

function tarihAlaniniBuguneAyarla() {
    const tarihInput = document.getElementById('tarih');

    if (tarihInput) {
        tarihInput.value = bugununInputTarihi();
    }
}

function bugununInputTarihi() {
    return tarihiInputFormatinaCevir(new Date());
}

function tarihiInputFormatinaCevir(tarih) {
    const yil = tarih.getFullYear();
    const ay = String(tarih.getMonth() + 1).padStart(2, '0');
    const gun = String(tarih.getDate()).padStart(2, '0');

    return `${yil}-${ay}-${gun}`;
}

function kategoriSecenekleriniGuncelle() {
    const tipSelect = document.getElementById('islemTipi');
    const kategoriSelect = document.getElementById('kategori');

    if (!tipSelect || !kategoriSelect) return;

    const seciliKategori = kategoriSelect.value;
    const kategoriler = tipSelect.value === 'gelir' ? gelirKategorileri : giderKategorileri;

    kategoriSelect.innerHTML = '<option value="" disabled selected>Kategori Seçin</option>';

    kategoriler.forEach((kategori) => {
        const option = document.createElement('option');
        option.value = kategori;
        option.textContent = kategori;
        kategoriSelect.appendChild(option);
    });

    if (kategoriler.includes(seciliKategori)) {
        kategoriSelect.value = seciliKategori;
    }
}

function islemTipiBul(islem) {
    if (islem.islemTipi === 'gelir') return true;
    if (islem.islemTipi === 'gider') return false;
    return islem.kategori === 'Gelir';
}

function kategoriAdiniNormalizeEt(kategori, isGelir = false) {
    if (!kategori) return '';
    if (kategori === 'Gelir') return 'Diğer Gelir';
    if (kategori === 'Gider') return 'Diğer Gider';

    const temizKategori = kategoriTakmaAdlari[kategori] || kategori;

    const izinliKategoriler = isGelir ? gelirKategorileri : giderKategorileri;

    if (izinliKategoriler.includes(temizKategori)) return temizKategori;

    return isGelir ? 'Diğer Gelir' : 'Diğer Gider';
}
