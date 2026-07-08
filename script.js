// Global tanımlama
const supabaseUrl = 'https://mjmmfyuymrzsdeymnfvs.supabase.co';
const supabaseKey = 'sb_publishable_aa2L1IT-Ee8Bulwd783kMw_lprHEpMk';

// Supabase istemcisi
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Hata ayıklama: Supabase yüklendi mi?
console.log("Supabase istemcisi:", supabase);

// Fonksiyonları tanımla
async function girisYap() {
    console.log("Giriş denemesi...");
    const email = document.getElementById('email').value;
    const password = document.getElementById('sifre').value;

    const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        alert("Hata: " + error.message);
    } else {
        window.location.reload();
    }
}