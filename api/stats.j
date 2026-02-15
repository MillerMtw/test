import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    const today = new Date().toISOString().split('T')[0];

    // --- MÉTODO PARA RECIBIR DATOS DEL SCRIPT ---
    if (req.method === 'POST') {
        const { country, userId } = req.body;
        
        await kv.incr('stats:total'); // Total histórico
        await kv.incr(`stats:day:${today}`); // Hoy
        if (country) await kv.zincrby('stats:countries', 1, country.trim()); // Top Países
        if (userId) await kv.set(`active:${userId}`, 'true', { ex: 300 }); // Activo por 5 min
        
        return res.status(200).json({ success: true });
    }

    // --- MÉTODO PARA VER TUS STATS (GET) ---
    if (req.method === 'GET') {
        const total = await kv.get('stats:total') || 0;
        const hoy = await kv.get(`stats:day:${today}`) || 0;
        const activosKeys = await kv.keys('active:*');
        const activos = activosKeys.length;

        // Obtener el Top 3 de países
        const topPaisesRaw = await kv.zrange('stats:countries', 0, 2, { rev: true, withScores: true });
        let topPaisesStr = "";
        for (let i = 0; i < topPaisesRaw.length; i += 2) {
            topPaisesStr += `${topPaisesRaw[i]}: ${topPaisesRaw[i+1]} `;
        }

        // Formato de texto simple como pediste
        const respuestaText = `ACTIVOS: ${activos} | EJECUCIONES HOY: ${hoy} | TOTAL EJECUCIONES: ${total} | TOP PAISES: ${topPaisesStr || "N/A"}`;
        
        return res.status(200).send(respuestaText);
    }
}
