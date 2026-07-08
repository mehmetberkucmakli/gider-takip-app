// Supabase değişkenleri
const supabaseUrl = 'https://mjmmfyuymrzsdeymnfvs.supabase.co';
const supabaseKey = 'sb_publishable_aa2L1IT-Ee8Bulwd783kMw_lprHEpMk';

// Eğer 'window.sb' zaten tanımlanmadıysa tanımla (bu hatayı engeller)
if (!window.sb) {
    window.sb = supabase.createClient(supabaseUrl, supabaseKey);
    console.log("Supabase istemcisi başarıyla başlatıldı.");
}

async function girisYap() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('sifre').value;

    const { error } = await window.sb.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        alert("Hata: " + error.message);
    } else {
        alert("Giriş başarılı!");
        window.location.reload();
    }
}