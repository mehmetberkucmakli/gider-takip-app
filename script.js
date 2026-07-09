const supabaseUrl = 'https://mjmmfyuymrzsdeymnfvs.supabase.co';
const supabaseKey = 'sb_publishable_aa2L1It-Ee8Bu1wd783kMw_lprHEpMk';
const davetKodu = 'ERTISYA2026';
const registerApiUrl = '';

const sb = supabase.createClient(supabaseUrl, supabaseKey);

let tumIslemler = [];
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
});

async function girisYap() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('sifre').value;

    if (authModu === 'kayit') {
        await kayitOl();
        return;
    }

    if (!email || !password) {
        alert('Lutfen e-posta ve sifre girin.');
        return;
    }

    const { data, error } = await sb.auth.signInWithPassword({ email, password });

    if (error) {
        alert(
            'Giris basarisiz: ' + error.message +
            '\n\nNot: Supabase tablosundaki kayitlarla giris yapilmaz. Kullanici Authentication > Users bolumunde olusturulmus olmali.'
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
        alert('Lutfen tum kayit alanlarini doldurun.');
        return;
    }

    if (password.length < 6) {
        alert('Sifre en az 6 karakter olmali.');
        return;
    }

    if (password !== passwordAgain) {
        alert('Sifreler ayni degil.');
        return;
    }

    if (registerApiUrl) {
        await backendUzerindenKayitOl(email, password, inviteCode);
        return;
    }

    if (inviteCode !== davetKodu) {
        alert('Davet kodu hatali.');
        return;
    }

    const { error } = await sb.auth.signUp({ email, password });

    if (error) {
        alert('Kayit basarisiz: ' + error.message);
        return;
    }

    alert('Kayit olusturuldu. E-posta onayi aciksa, gelen kutusundan onay verdikten sonra giris yapabilirsin.');
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
            throw new Error(result.error || 'Kayit tamamlanamadi.');
        }

        alert('Kayit olusturuldu. Simdi giris yapabilirsin.');
        authModunuAyarla('giris');
    } catch (error) {
        alert('Kayit basarisiz: ' + error.message);
    }
}

function authModunuDegistir() {
    authModunuAyarla(authModu === 'giris' ? 'kayit' : 'giris');
}

function authModunuAyarla(yeniMod) {
    authModu = yeniMod;

    const kayitModu = authModu === 'kayit';
    document.getElementById('auth-title').textContent = kayitModu ? 'Davet kodu ile kayit ol' : 'Hesabiniza giris yapin';
    document.getElementById('auth-submit').textContent = kayitModu ? 'Kayit Ol' : 'Giris Yap';
    document.getElementById('auth-toggle').textContent = kayitModu ? 'Giris ekranina don' : 'Kayit ol';
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
    button.textContent = 'Cikis Yap';
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
        alert('Kayitlar yuklenemedi: ' + error.message);
        return;
    }

    tumIslemler = data || [];
    islemleriListele();
}

async function islemKaydet(event) {
    event.preventDefault();

    const user = await aktifKullaniciyiGetir();

    if (!user) {
        alert('Islem eklemek icin tekrar giris yapin.');
        girisiGoster();
        return;
    }

    const aciklama = document.getElementById('aciklama').value.trim();
    const miktar = Number(document.getElementById('miktar').value);
    const kategori = document.getElementById('kategori').value;
    const islemTipi = kategori === 'Gelir' ? 'gelir' : 'gider';
    const payload = {
        aciklama,
        miktar,
        kategori,
        islemTipi,
        user_id: user.id
    };

    const { error } = duzenlenenIslemId
        ? await sb
            .from('islemler')
            .update(payload)
            .eq('id', duzenlenenIslemId)
            .eq('user_id', user.id)
        : await sb.from('islemler').insert([
            {
                ...payload,
                tarih: new Date().toLocaleDateString('tr-TR')
            }
        ]);

    if (error) {
        alert('Kayit kaydedilemedi: ' + error.message);
        return;
    }

    formuSifirla();
    await giderleriYukle();
}

function islemDuzenle(id) {
    const islem = tumIslemler.find((item) => item.id === id);

    if (!islem) {
        alert('Duzenlenecek kayit bulunamadi.');
        return;
    }

    duzenlenenIslemId = id;
    document.getElementById('aciklama').value = islem.aciklama || '';
    document.getElementById('miktar').value = islem.miktar || '';
    document.getElementById('kategori').value = islem.kategori || '';
    document.getElementById('formSubmitBtn').textContent = 'Guncelle';
    document.getElementById('duzenlemeIptalBtn').style.display = 'block';
    document.getElementById('finansForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function duzenlemeyiIptalEt() {
    formuSifirla();
}

function formuSifirla() {
    duzenlenenIslemId = null;
    document.getElementById('finansForm').reset();
    document.getElementById('formSubmitBtn').textContent = 'Sisteme Isle';
    document.getElementById('duzenlemeIptalBtn').style.display = 'none';
}

async function islemSil(id) {
    const user = await aktifKullaniciyiGetir();

    if (!user) {
        alert('Islem silmek icin tekrar giris yapin.');
        girisiGoster();
        return;
    }

    const { error } = await sb
        .from('islemler')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        alert('Kayit silinemedi: ' + error.message);
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
    const filtre = aramaMetni.toLocaleLowerCase('tr-TR');

    liste.innerHTML = '';

    const gosterilecekIslemler = tumIslemler.filter((islem) => {
        const aciklama = String(islem.aciklama || '').toLocaleLowerCase('tr-TR');
        const kategori = String(islem.kategori || '').toLocaleLowerCase('tr-TR');
        return aciklama.includes(filtre) || kategori.includes(filtre);
    });

    gosterilecekIslemler.forEach((islem) => {
        const isGelir = islem.islemTipi === 'gelir' || islem.kategori === 'Gelir';
        const li = document.createElement('li');
        li.className = isGelir ? 'gelir-satiri' : 'gider-satiri';

        li.innerHTML = `
            <span>
                <strong>${islem.aciklama}</strong><br>
                ${islem.kategori} - ${Number(islem.miktar).toLocaleString('tr-TR')} TL
            </span>
            <span class="islem-actions">
                <button class="duzenle-btn" type="button" onclick="islemDuzenle(${islem.id})">Duzenle</button>
                <button class="sil-btn" type="button" onclick="islemSil(${islem.id})">Sil</button>
            </span>
        `;

        liste.appendChild(li);
    });

    const bakiye = tumIslemler.reduce((toplam, islem) => {
        const miktar = Number(islem.miktar) || 0;
        const isGelir = islem.islemTipi === 'gelir' || islem.kategori === 'Gelir';
        return toplam + (isGelir ? miktar : -miktar);
    }, 0);

    toplamBakiye.textContent = `${bakiye.toLocaleString('tr-TR')} TL`;
    toplamBakiye.style.color = bakiye >= 0 ? '#27ae60' : '#e74c3c';
}
