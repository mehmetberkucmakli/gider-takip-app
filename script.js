// Global tanımlama
const supabaseUrl = 'https://mjmmfyuymrzsdeymnfvs.supabase.co';
const supabaseKey = 'sb_publishable_aa2L1IT-Ee8Bulwd783kMw_lprHEpMk';

// Supabase istemcisi - İsmi 'sb' olarak güncelledik ki çakışma olmasın
const sb = supabase.createClient(supabaseUrl, supabaseKey);

// Hata ayıklama
console.log("Supabase istemcisi başarıyla yüklendi:", sb);

// Fonksiyonları tanımla
async function girisYap() {
    console.log("Giriş denemesi...");
    const email = document.getElementById('email').value;
    const password = document.getElementById('sifre').value;

    // Burada artık 'sb' kullanıyoruz
    const { error } = await sb.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        alert("Hata: " + error.message);
    } else {
        window.location.reload();
    }
}