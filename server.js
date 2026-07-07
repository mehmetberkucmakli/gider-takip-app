const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 3000;

// 1. Supabase Bağlantı Ayarları
// NOT: Aşağıdaki iki sabitin değerlerini kendi Supabase panelindeki değerlerle dolduracaksın!
const SUPABASE_URL = 'https://mjmmfyuymrzsdeymnfvs.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_aa2L1It-Ee8Bu1wd783kMw_lprHEpMk'; 

// Supabase İstemcisini Başlatıyoruz
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Middleware Yapılandırması
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 2. Tüm Finansal Hareketleri Getirme Rotası (GET Request)
app.get('/api/giderler', async (req, res) => {
    try {
        // Buluttaki 'islemler' tablosundan tüm verileri çek ve id'ye göre sırala
        const { data, error } = await supabase
            .from('islemler')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Veri çekme hatası:', error.message);
        res.status(500).send('Bulut veritabanından veriler alınamadı.');
    }
});

// 3. Yeni Finansal İşlem Ekleme Rotası (POST Request)
app.post('/api/giderler', async (req, res) => {
    const { aciklama, miktar, kategori } = req.body;

    if (!aciklama || !miktar || !kategori) {
        return res.status(400).send('Lütfen tüm alanları doldurun.');
    }

    // Akıllı Kategori Algoritması (Gelir mi Gider mi?)
    let islemTipi = 'gider';
    if (
        kategori === 'Proje/Yazılım Satışı' ||
        kategori === 'SaaS/Lisans Aboneliği' ||
        kategori === 'Bakım & Destek Sözleşmesi'
    ) {
        islemTipi = 'gelir';
    }

    try {
        // Yeni objeyi doğrudan buluttaki PostgreSQL tablosuna aktarıyoruz
        const { data, error } = await supabase
            .from('islemler')
            .insert([
                {
                    aciklama,
                    miktar: Number(miktar),
                    kategori,
                    islemTipi,
                    tarih: new Date().toLocaleDateString('tr-TR')
                }
            ])
            .select();

        if (error) throw error;

        res.status(201).json(data[0]);
    } catch (error) {
        console.error('Veri ekleme hatası:', error.message);
        res.status(500).send('İşlem bulut veritabanına kaydedilemedi.');
    }
});

// 4. İşlem Silme Rotası (DELETE Request)
app.delete('/api/giderler/:id', async (req, res) => {
    const islemId = req.params.id;

    try {
        // İlgili ID'ye sahip satırı buluttan siliyoruz
        const { error } = await supabase
            .from('islemler')
            .delete()
            .eq('id', islemId);

        if (error) throw error;

        res.send('Kayıt bulut veritabanından başarıyla silindi.');
    } catch (error) {
        console.error('Veri silme hatası:', error.message);
        res.status(500).send('Kayıt silinirken bir hata oluştu.');
    }
});

// Sunucuyu Başlatma
app.listen(PORT, () => {
    console.log(`Ertisya Finans Paneli Bulut Altyapısı ile http://localhost:${PORT} adresinde yayında!`);
});