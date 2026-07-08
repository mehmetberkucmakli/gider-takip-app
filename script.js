// 1. SUPABASE KURULUMU
const supabaseUrl = 'https://mjmmfyuymrzsdeymnfvs.supabase.co';
// Sadece 'anon' (Yayınlanabilir) anahtarını buraya yazıyoruz!
const supabaseKey = 'sb_publishable_aa2L1IT-Ee8Bulwd783kMw_lprHEpMk'; 

const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// 2. GİRİŞ KONTROLÜ
async function kontrolEt() {
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

// 3. GİRİŞ YAPMA FONKSİYONU
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
        location.reload(); 
    }
}

kontrolEt();