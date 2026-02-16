import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    const today = new Date().toISOString().split('T')[0];

    if (req.method === 'POST') {
        const { country, userId } = req.body;
        
        await kv.incr('stats:total'); 
        await kv.incr(`stats:day:${today}`); 
        if (country) await kv.zincrby('stats:countries', 1, country.trim()); 
        if (userId) await kv.set(`active:${userId}`, 'true', { ex: 300 });
        
        return res.status(200).json({ success: true });
    }

    if (req.method === 'GET') {
        const total = await kv.get('stats:total') || 0;
        const hoy = await kv.get(`stats:day:${today}`) || 0;
        const activosKeys = await kv.keys('active:*');
        const activos = activosKeys.length;

        const topPaisesRaw = await kv.zrange('stats:countries', 0, 2, { rev: true, withScores: true });
        let topPaisesStr = "";
        for (let i = 0; i < topPaisesRaw.length; i += 2) {
            topPaisesStr += `${topPaisesRaw[i]}: ${topPaisesRaw[i+1]} `;
        }

        const respuestaText = `ACTIVOS: ${activos} | EJECUCIONES HOY: ${hoy} | TOTAL EJECUCIONES: ${total} | TOP PAISES: ${topPaisesStr || "N/A"}`;
        
        return res.status(200).send(respuestaText);
    }
}
