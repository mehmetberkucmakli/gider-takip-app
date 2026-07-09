import { createClient } from '@supabase/supabase-js';

export default {
  async fetch(request, env, ctx) {
    // CORS Ayarları (Frontend'imizin bu backend ile konuşabilmesi için zorunlu)
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Eğer tarayıcı ön kontrol (OPTIONS) isteği atarsa hemen CORS başlıklarıyla yanıt ver
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    
    // Supabase bağlantısını birazdan wrangler.toml dosyasına yazacağımız değişkenlerle başlatıyoruz
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

    if (url.pathname === '/api/register' && request.method === 'POST') {
      try {
        const { email, password, inviteCode } = await request.json();

        if (!email || !password || !inviteCode) {
          return new Response(JSON.stringify({ error: 'Tum alanlar zorunludur.' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 400
          });
        }

        if (!env.INVITE_CODE || inviteCode !== env.INVITE_CODE) {
          return new Response(JSON.stringify({ error: 'Davet kodu hatali.' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 403
          });
        }

        if (!env.SUPABASE_SERVICE_ROLE_KEY) {
          return new Response(JSON.stringify({ error: 'Kayit servisi henuz hazir degil.' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 500
          });
        }

        const adminSupabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
        const { data, error } = await adminSupabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true
        });

        if (error) throw error;

        return new Response(JSON.stringify({ userId: data.user.id }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 201
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 500
        });
      }
    }

    // 1. ROTA: GET /api/giderler (Tüm Verileri Çekme)
    if (url.pathname === '/api/giderler' && request.method === 'GET') {
      try {
        const { data, error } = await supabase
          .from('islemler')
          .select('*')
          .order('id', { ascending: true });

        if (error) throw error;

        return new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 200
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 500
        });
      }
    }

    // 2. ROTA: POST /api/giderler (Yeni İşlem Ekleme)
    if (url.pathname === '/api/giderler' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { aciklama, miktar, kategori } = body;

        if (!aciklama || !miktar || !kategori) {
          return new Response('Lütfen tüm alanları doldurun.', { status: 400, headers: corsHeaders });
        }

        // Akıllı Gelir/Gider Algoritmamız
        let islemTipi = 'gider';
        if (
          kategori === 'Proje/Yazılım Satışı' ||
          kategori === 'SaaS/Lisans Aboneliği' ||
          kategori === 'Bakım & Destek Sözleşmesi'
        ) {
          islemTipi = 'gelir';
        }

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

        return new Response(JSON.stringify(data[0]), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 201
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 500
        });
      }
    }

    // 3. ROTA: DELETE /api/giderler/:id (İşlem Silme)
    if (url.pathname.startsWith('/api/giderler/') && request.method === 'DELETE') {
      try {
        // URL'in sonundaki ID değerini yakalıyoruz
        const islemId = url.pathname.split('/').pop();

        const { error } = await supabase
          .from('islemler')
          .delete()
          .eq('id', islemId);

        if (error) throw error;

        return new Response('Kayıt başarıyla silindi.', { status: 200, headers: corsHeaders });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 500
        });
      }
    }

    return new Response('Rota Bulunamadı', { status: 404, headers: corsHeaders });
  },
};
