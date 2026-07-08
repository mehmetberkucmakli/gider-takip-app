const supabaseUrl = 'https://mjmmfyuymrzsdeymnfvs.supabase.co';
const supabaseKey = 'sb_publishable_aa2L1IT-Ee8Bulwd783kMw_lprHEpMk';

// İstemciyi başlat
const sb = supabase.createClient(supabaseUrl, supabaseKey);

async function girisYap() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('sifre').value;

    const { error } = await sb.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        alert("Giriş Hatası: " + error.message);
    } else {
        window.location.reload();
    }
}