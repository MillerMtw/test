import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    try {
        const today = new Date().toISOString().split('T')[0];

        if (req.method === 'POST') {
            const { country, userId } = req.body;
            await kv.incr('stats:total');
            await kv.incr(`stats:day:${today}`);
            if (country) await kv.zincrby('stats:countries', 1, country.trim());
            if (userId) await kv.set(`active:${userId}`, 'true', { ex: 300 });
            return res.status(200).json({ success: true });
        }

        // Si es GET (lo que ves en el navegador)
        const total = await kv.get('stats:total') || 0;
        const hoy = await kv.get(`stats:day:${today}`) || 0;
        const activosKeys = await kv.keys('active:*');
        const activos = activosKeys ? activosKeys.length : 0;
        const topPaisesRaw = await kv.zrange('stats:countries', 0, 2, { rev: true, withScores: true });

        let topPaisesStr = "";
        if (topPaisesRaw) {
            for (let i = 0; i < topPaisesRaw.length; i += 2) {
                topPaisesStr += `${topPaisesRaw[i]}: ${topPaisesRaw[i+1]} `;
            }
        }

        return res.status(200).send(`ACTIVOS: ${activos} | EJECUCIONES HOY: ${hoy} | TOTAL EJECUCIONES: ${total} | TOP PAISES: ${topPaisesStr || "N/A"}`);

    } catch (error) {
        console.error(error);
        return res.status(500).send("Error de conexión con KV: Asegúrate de conectar el Storage en el panel de Vercel.");
    }
}
