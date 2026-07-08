// 1. Değişkenleri en başa al
let supabase;

// 2. Sayfa yüklendiğinde Supabase'i başlat
document.addEventListener('DOMContentLoaded', () => {
    const supabaseUrl = 'https://mjmmfyuymrzsdeymnfvs.supabase.co';
    const supabaseKey = 'sb_publishable_aa2L1IT-Ee8Bulwd783kMw_lprHEpMk';
    supabase = supabase.createClient(supabaseUrl, supabaseKey);
    
    // Kurulum bittikten sonra kontrolü başlat
    kontrolEt();
});

// 3. Kontrol fonksiyonu
async function kontrolEt() {
    if (!supabase) return; // Supabase hazır değilse bekle
    
    const { data: { session } } = await supabase.auth.getSession();
    const authDiv = document.getElementById('auth-container');
    const appDiv = document.getElementById('app-container');

    if (session) {
        if(authDiv) authDiv.style.display = 'none';
        if(appDiv) appDiv.style.display = 'block';
    } else {
        if(authDiv) authDiv.style.display = 'block';
        if(appDiv) appDiv.style.display = 'none';
    }
}

// 4. Giriş fonksiyonu
async function girisYap() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('sifre').value;

    const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        alert("Hata: " + error.message);
    } else {
        location.reload();
    }
}