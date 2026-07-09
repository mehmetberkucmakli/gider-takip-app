const supabaseUrl = 'https://mjmmfyuymrzsdeymnfvs.supabase.co';
const supabaseKey = 'sb_publishable_aa2L1It-Ee8Bu1wd783kMw_lprHEpMk';

const sb = supabase.createClient(supabaseUrl, supabaseKey);

let tumIslemler = [];

document.addEventListener('DOMContentLoaded', async () => {
    const { data } = await sb.auth.getSession();

    if (data.session) {
        uygulamayiGoster();
        await giderleriYukle();
    } else {
        girisiGoster();
    }

    document.getElementById('finansForm')?.addEventListener('submit', islemEkle);
    document.getElementById('aramaKutusu')?.addEventListener('input', (event) => {
        islemleriListele(event.target.value);
    });
});

async function girisYap() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('sifre').value;

    if (!email || !password) {
        alert('Lutfen e-posta ve sifre girin.');
        return;
    }

    const { error } = await sb.auth.signInWithPassword({ email, password });

    if (error) {
        alert(
            'Giris basarisiz: ' + error.message +
            '\n\nNot: Supabase tablosundaki kayitlarla giris yapilmaz. Kullanici Authentication > Users bolumunde olusturulmus olmali.'
        );
        return;
    }

    uygulamayiGoster();
    await giderleriYukle();
}

async function cikisYap() {
    await sb.auth.signOut();
    girisiGoster();
}

function girisiGoster() {
    document.getElementById('auth-container').style.display = 'block';
    document.getElementById('app-container').style.display = 'none';
}

function uygulamayiGoster() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    cikisButonuEkle();
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
    const { data, error } = await sb
        .from('islemler')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        alert('Kayitlar yuklenemedi: ' + error.message);
        return;
    }

    tumIslemler = data || [];
    islemleriListele();
}

async function islemEkle(event) {
    event.preventDefault();

    const aciklama = document.getElementById('aciklama').value.trim();
    const miktar = Number(document.getElementById('miktar').value);
    const kategori = document.getElementById('kategori').value;
    const islemTipi = kategori === 'Gelir' ? 'gelir' : 'gider';

    const { error } = await sb.from('islemler').insert([
        {
            aciklama,
            miktar,
            kategori,
            islemTipi,
            tarih: new Date().toLocaleDateString('tr-TR')
        }
    ]);

    if (error) {
        alert('Kayit eklenemedi: ' + error.message);
        return;
    }

    event.target.reset();
    await giderleriYukle();
}

async function islemSil(id) {
    const { error } = await sb.from('islemler').delete().eq('id', id);

    if (error) {
        alert('Kayit silinemedi: ' + error.message);
        return;
    }

    await giderleriYukle();
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
            <button class="sil-btn" type="button" onclick="islemSil(${islem.id})">Sil</button>
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
