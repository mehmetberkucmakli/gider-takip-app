const supabaseUrl = 'https://mjmmfyuymrzsdeymnfvs.supabase.co';
const supabaseKey = 'sb_publishable_aa2L1It-Ee8Bu1wd783kMw_lprHEpMk';
const davetKodu = 'ERTISYA2026';

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
const $ = (id) => document.getElementById(id);

let tumIslemler = [];
let filtrelenenIslemler = [];
let authModu = 'giris';
let aktifKullanici = null;
let duzenlenenIslemId = null;

document.addEventListener('DOMContentLoaded', async () => {
    const { data } = await sb.auth.getSession();

    if (data.session) {
        aktifKullanici = data.session.user;
        uygulamayiGoster();
        await islemleriYukle();
    } else {
        girisiGoster();
    }

    // Sayfa açılınca form ve filtre olayları bağlanır.
    $('finansForm')?.addEventListener('submit', islemKaydet);
    $('aramaKutusu')?.addEventListener('input', islemleriListele);
    ['tipFiltresi', 'donemFiltresi', 'kategoriFiltresi'].forEach((id) => {
        $(id)?.addEventListener('change', islemleriListele);
    });
    $('islemTipi')?.addEventListener('change', kategoriSecenekleriniGuncelle);

    kategoriSecenekleriniGuncelle();
    tarihAlaniniBuguneAyarla();
});

async function girisYap() {
    if (authModu === 'kayit') {
        await kayitOl();
        return;
    }

    const email = $('email').value.trim();
    const password = $('sifre').value;

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
    await islemleriYukle();
}

async function kayitOl() {
    const email = $('email').value.trim();
    const password = $('sifre').value;
    const passwordAgain = $('sifreTekrar').value;
    const inviteCode = $('davetKodu').value.trim();

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

function authModunuDegistir() {
    authModunuAyarla(authModu === 'giris' ? 'kayit' : 'giris');
}

function authModunuAyarla(yeniMod) {
    authModu = yeniMod;

    const kayitModu = authModu === 'kayit';
    $('auth-title').textContent = kayitModu ? 'Davet kodu ile kayıt ol' : 'Hesabınıza giriş yapın';
    $('auth-submit').textContent = kayitModu ? 'Kayıt Ol' : 'Giriş Yap';
    $('auth-toggle').textContent = kayitModu ? 'Giriş ekranına dön' : 'Kayıt ol';
    $('sifreTekrar').style.display = kayitModu ? 'block' : 'none';
    $('davetKodu').style.display = kayitModu ? 'block' : 'none';
}

async function cikisYap() {
    await sb.auth.signOut();
    aktifKullanici = null;
    girisiGoster();
}

function girisiGoster() {
    $('auth-container').style.display = 'block';
    $('app-container').style.display = 'none';
}

function uygulamayiGoster() {
    $('auth-container').style.display = 'none';
    $('app-container').style.display = 'block';
    $('aktifKullaniciBilgisi').textContent = `Aktif hesap: ${aktifKullanici.email}`;
    cikisButonuEkle();
}

function cikisButonuEkle() {
    if ($('cikisBtn')) return;

    const button = document.createElement('button');
    button.id = 'cikisBtn';
    button.type = 'button';
    button.textContent = 'Çıkış Yap';
    button.style.marginBottom = '16px';
    button.onclick = cikisYap;

    $('app-container').prepend(button);
}

async function aktifKullaniciyiGetir() {
    if (aktifKullanici) return aktifKullanici;

    const { data, error } = await sb.auth.getUser();
    aktifKullanici = error ? null : data.user;
    return aktifKullanici;
}

async function islemleriYukle() {
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

    const payload = formVerisiniOku(user.id);

    if (!payload) return;

    const sorgu = duzenlenenIslemId
        ? sb.from('islemler').update(payload).eq('id', duzenlenenIslemId).eq('user_id', user.id)
        : sb.from('islemler').insert([payload]);

    const { error } = await sorgu;

    if (error) {
        alert('Kayıt kaydedilemedi: ' + error.message);
        return;
    }

    formuSifirla();
    await islemleriYukle();
}

function formVerisiniOku(userId) {
    const tarih = tarihInputunuKayitFormatinaCevir($('tarih').value);

    if (!tarih) {
        alert('Lütfen işlem tarihini seçin.');
        return null;
    }

    return {
        aciklama: $('aciklama').value.trim(),
        miktar: Number($('miktar').value),
        kategori: $('kategori').value,
        islemTipi: $('islemTipi').value,
        tarih,
        user_id: userId
    };
}

function islemDuzenle(id) {
    const islem = tumIslemler.find((item) => item.id === id);

    if (!islem) {
        alert('Düzenlenecek kayıt bulunamadı.');
        return;
    }

    duzenlenenIslemId = id;
    $('aciklama').value = islem.aciklama || '';
    $('miktar').value = islem.miktar || '';
    $('tarih').value = tarihMetniniInputFormatinaCevir(islem.tarih) || bugununInputTarihi();
    $('islemTipi').value = islemTipiBul(islem) ? 'gelir' : 'gider';
    kategoriSecenekleriniGuncelle();
    $('kategori').value = kategoriAdiniNormalizeEt(islem.kategori, islemTipiBul(islem));
    $('formSubmitBtn').textContent = 'Güncelle';
    $('duzenlemeIptalBtn').style.display = 'block';
    $('finansForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function duzenlemeyiIptalEt() {
    formuSifirla();
}

function formuSifirla() {
    duzenlenenIslemId = null;
    $('finansForm').reset();
    kategoriSecenekleriniGuncelle();
    tarihAlaniniBuguneAyarla();
    $('formSubmitBtn').textContent = 'Sisteme İşle';
    $('duzenlemeIptalBtn').style.display = 'none';
}

async function islemSil(id) {
    const user = await aktifKullaniciyiGetir();

    if (!user) {
        alert('İşlem silmek için tekrar giriş yapın.');
        girisiGoster();
        return;
    }

    const { error } = await sb.from('islemler').delete().eq('id', id).eq('user_id', user.id);

    if (error) {
        alert('Kayıt silinemedi: ' + error.message);
        return;
    }

    await islemleriYukle();
}

function islemleriListele() {
    const tip = $('tipFiltresi')?.value || 'tum';
    const donem = $('donemFiltresi')?.value || 'tum';
    const kategori = $('kategoriFiltresi')?.value || 'tum';
    const arama = ($('aramaKutusu')?.value || '').toLocaleLowerCase('tr-TR');

    filtrelenenIslemler = tumIslemler.filter((islem) => {
        const isGelir = islemTipiBul(islem);
        const temizKategori = kategoriAdiniNormalizeEt(islem.kategori, isGelir);
        const aramaMetni = `${islem.aciklama || ''} ${temizKategori}`.toLocaleLowerCase('tr-TR');

        return aramaMetni.includes(arama)
            && (tip === 'tum' || tip === islemTipiMetni(islem))
            && (kategori === 'tum' || kategori === temizKategori)
            && islemDonemeUyuyor(islem, donem);
    });

    listeyiYaz(filtrelenenIslemler);
    bakiyeyiYaz(filtrelenenIslemler);
    raporuGuncelle(filtrelenenIslemler);
}

function listeyiYaz(islemler) {
    const liste = $('islemListesi');
    liste.innerHTML = '';

    if (islemler.length === 0) {
        const li = document.createElement('li');
        li.className = 'bos-liste';
        li.textContent = tumIslemler.length === 0 ? 'Henüz işlem kaydı yok.' : 'Bu filtreye uygun işlem bulunamadı.';
        liste.appendChild(li);
        return;
    }

    islemler.forEach((islem) => {
        const isGelir = islemTipiBul(islem);
        const li = document.createElement('li');
        li.className = isGelir ? 'gelir-satiri' : 'gider-satiri';
        li.innerHTML = `
            <span>
                <strong>${islem.aciklama}</strong><br>
                ${islem.tarih || '-'} - ${kategoriAdiniNormalizeEt(islem.kategori, isGelir)} - ${paraYaz(islem.miktar)}
            </span>
            <span class="islem-actions">
                <button class="duzenle-btn" type="button" onclick="islemDuzenle(${islem.id})">Düzenle</button>
                <button class="sil-btn" type="button" onclick="islemSil(${islem.id})">Sil</button>
            </span>
        `;
        liste.appendChild(li);
    });
}

function bakiyeyiYaz(islemler) {
    const bakiye = islemler.reduce((toplam, islem) => {
        const miktar = Number(islem.miktar) || 0;
        return toplam + (islemTipiBul(islem) ? miktar : -miktar);
    }, 0);

    $('toplamBakiye').textContent = paraYaz(bakiye);
    $('toplamBakiye').style.color = bakiye >= 0 ? '#27ae60' : '#e74c3c';
}

function raporuGuncelle(islemler) {
    const ozet = islemler.reduce((sonuc, islem) => {
        const miktar = Number(islem.miktar) || 0;
        const isGelir = islemTipiBul(islem);
        const kategori = kategoriAdiniNormalizeEt(islem.kategori, isGelir);

        sonuc[isGelir ? 'gelir' : 'gider'] += miktar;
        sonuc.kategoriler[kategori] = (sonuc.kategoriler[kategori] || 0) + miktar;
        return sonuc;
    }, { gelir: 0, gider: 0, kategoriler: {} });

    const net = ozet.gelir - ozet.gider;
    const oneCikan = Object.entries(ozet.kategoriler).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

    $('raporGelir').textContent = paraYaz(ozet.gelir);
    $('raporGider').textContent = paraYaz(ozet.gider);
    $('raporNet').textContent = paraYaz(net);
    $('raporNet').style.color = net >= 0 ? '#27ae60' : '#e74c3c';
    $('raporKategori').textContent = oneCikan;
}

function csvDisariAktar() {
    if (filtrelenenIslemler.length === 0) {
        alert('Aktarılacak işlem bulunamadı.');
        return;
    }

    const satirlar = filtrelenenIslemler.map((islem) => {
        const isGelir = islemTipiBul(islem);
        return [
            islem.tarih || '',
            isGelir ? 'Gelir' : 'Gider',
            kategoriAdiniNormalizeEt(islem.kategori, isGelir),
            islem.aciklama || '',
            Number(islem.miktar) || 0
        ];
    });

    const csv = [['Tarih', 'Tip', 'Kategori', 'Açıklama', 'Miktar'], ...satirlar]
        .map((satir) => satir.map(csvHucreHazirla).join(';'))
        .join('\n');

    dosyaIndir(`finans-islemleri-${bugununInputTarihi()}.csv`, `\uFEFF${csv}`, 'text/csv;charset=utf-8;');
}

function dosyaIndir(dosyaAdi, icerik, tip) {
    const url = URL.createObjectURL(new Blob([icerik], { type: tip }));
    const link = document.createElement('a');
    link.href = url;
    link.download = dosyaAdi;
    link.click();
    URL.revokeObjectURL(url);
}

function csvHucreHazirla(deger) {
    return `"${String(deger).replaceAll('"', '""')}"`;
}

function kategoriFiltresiniGuncelle() {
    const select = $('kategoriFiltresi');
    const seciliDeger = select.value;
    const kategoriler = [...new Set(tumIslemler.map((islem) => kategoriAdiniNormalizeEt(islem.kategori, islemTipiBul(islem))))]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'tr'));

    select.innerHTML = '<option value="tum">Tüm kategoriler</option>';
    kategoriler.forEach((kategori) => select.add(new Option(kategori, kategori)));

    if ([...select.options].some((option) => option.value === seciliDeger)) {
        select.value = seciliDeger;
    }
}

function kategoriSecenekleriniGuncelle() {
    const kategoriler = $('islemTipi').value === 'gelir' ? gelirKategorileri : giderKategorileri;
    const seciliKategori = $('kategori').value;

    $('kategori').innerHTML = '<option value="" disabled selected>Kategori Seçin</option>';
    kategoriler.forEach((kategori) => $('kategori').add(new Option(kategori, kategori)));

    if (kategoriler.includes(seciliKategori)) {
        $('kategori').value = seciliKategori;
    }
}

function islemDonemeUyuyor(islem, donem) {
    if (donem === 'tum') return true;

    const tarih = tarihMetniniTariheCevir(islem.tarih);
    if (!tarih) return false;

    const bugun = new Date();
    const hedefAy = donem === 'bu-ay' ? bugun.getMonth() : bugun.getMonth() - 1;
    const hedefTarih = new Date(bugun.getFullYear(), hedefAy, 1);

    return tarih.getFullYear() === hedefTarih.getFullYear() && tarih.getMonth() === hedefTarih.getMonth();
}

function tarihMetniniTariheCevir(tarihMetni) {
    const [gun, ay, yil] = String(tarihMetni || '').split('.').map(Number);
    return gun && ay && yil ? new Date(yil, ay - 1, gun) : null;
}

function tarihInputunuKayitFormatinaCevir(inputTarihi) {
    const [yil, ay, gun] = String(inputTarihi || '').split('-');
    return gun && ay && yil ? `${gun}.${ay}.${yil}` : '';
}

function tarihMetniniInputFormatinaCevir(tarihMetni) {
    const tarih = tarihMetniniTariheCevir(tarihMetni);
    return tarih ? tarihiInputFormatinaCevir(tarih) : '';
}

function tarihAlaniniBuguneAyarla() {
    $('tarih').value = bugununInputTarihi();
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

function islemTipiBul(islem) {
    if (islem.islemTipi === 'gelir') return true;
    if (islem.islemTipi === 'gider') return false;
    return islem.kategori === 'Gelir';
}

function islemTipiMetni(islem) {
    return islemTipiBul(islem) ? 'gelir' : 'gider';
}

function kategoriAdiniNormalizeEt(kategori, isGelir = false) {
    if (!kategori) return '';
    if (kategori === 'Gelir') return 'Diğer Gelir';
    if (kategori === 'Gider') return 'Diğer Gider';

    const temizKategori = kategoriTakmaAdlari[kategori] || kategori;
    const izinliKategoriler = isGelir ? gelirKategorileri : giderKategorileri;
    return izinliKategoriler.includes(temizKategori)
        ? temizKategori
        : (isGelir ? 'Diğer Gelir' : 'Diğer Gider');
}

function paraYaz(deger) {
    return `${Number(deger || 0).toLocaleString('tr-TR')} TL`;
}
