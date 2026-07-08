// Supabase'i global olarak tanımla
const supabaseUrl = 'https://mjmmfyuymrzsdeymnfvs.supabase.co';
const supabaseKey = 'sb_publishable_aa2L1IT-Ee8Bulwd783kMw_lprHEpMk';

// "window.sb" yaparak tarayıcının her yerinden ulaşılabilir hale getiriyoruz
window.sb = supabase.createClient(supabaseUrl, supabaseKey);

async function girisYap() {
    console.log("Giriş yapılıyor...");
    const email = document.getElementById('email').value;
    const password = document.getElementById('sifre').value;

    // window.sb üzerinden erişiyoruz
    const { error } = await window.sb.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        alert("Hata: " + error.message);
    } else {
        alert("Başarılı!");
        window.location.reload();
    }
}