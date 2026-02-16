import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jmzsokjokwgunjsxptzn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptenNva2pva3dndW5qc3hwdHpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMTczNTAsImV4cCI6MjA4Njc5MzM1MH0.3mIObUpS7oJTS86KYLbu0Fte7O-fjQxWUTUFIyDH7u0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
    try {
        if (req.method === 'POST') {
            const { country, userId } = req.body;
            await supabase.from('stats').insert([{ country: country || 'Unknown', user_id: userId || '0' }]);
            return res.status(200).json({ success: true });
        }

        const { data: allStats, error } = await supabase.from('stats').select('*');
        
        if (error) throw error;

        const total = allStats.length;
        const hoyStr = new Date().toISOString().split('T')[0];
        const hoy = allStats.filter(s => s.created_at && s.created_at.startsWith(hoyStr)).length;
        
        const cincoMinAgo = new Date(Date.now() - 5 * 60000).toISOString();
        const activos = allStats.filter(s => s.created_at >= cincoMinAgo).length;

        const countries = allStats.reduce((acc, curr) => {
            if (curr.country) {
                acc[curr.country] = (acc[curr.country] || 0) + 1;
            }
            return acc;
        }, {});

        const topPaises = Object.entries(countries)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name, count]) => `${name}: ${count}`)
            .join(' ');

        const respuestaText = `ACTIVOS: ${activos} | EJECUCIONES HOY: ${hoy} | TOTAL: ${total} | TOP PAISES: ${topPaises || "N/A"}`;
        return res.status(200).send(respuestaText);

    } catch (error) {
        console.error(error);
        return res.status(500).send("Error en la API: Asegúrate de haber creado la tabla 'stats' en Supabase.");
    }
}
