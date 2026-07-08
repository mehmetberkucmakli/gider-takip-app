// 1. Merkezi Supabase Kurulumu (Hataları önlemek için 'let' ve 'const' yapısı)
const supabaseUrl = 'https://mjmmfyuymrzsdeymnfvs.supabase.co';
const supabaseKey = 'sb_publishable_aa2L1IT-Ee8Bulwd783kMw_lprHEpMk'; // 'anon' anahtarın

// Supabase istemcisini oluştur
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// 2. Giriş Kontrol Fonksiyonu
async function kontrolEt() {
    const { data: { session } } = await supabase.auth.getSession();
    const authDiv = document.getElementById('auth-container');
    const appDiv = document.getElementById('app-container');

    if (session) {
        if (authDiv) authDiv.style.display = 'none';
        if (appDiv) appDiv.style.display = 'block';
    } else {
        if (authDiv) authDiv.style.display = 'block';
        if (appDiv) appDiv.style.display = 'none';
    }
}

// 3. Giriş Yapma Fonksiyonu
async function girisYap() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('sifre').value;

    const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        alert("Giriş başarısız: " + error.message);
    } else {
        location.reload(); // Başarılı girişten sonra sayfayı yenile
    }
}

// 4. Sayfa yüklendiğinde otomatik başlat
window.onload = kontrolEt;