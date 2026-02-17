import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://jmzsokjokwgunjsxptzn.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptenNva2pva3dndW5qc3hwdHpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMTczNTAsImV4cCI6MjA4Njc5MzM1MH0.3mIObUpS7oJTS86KYLbu0Fte7O-fjQxWUTUFIyDH7u0'
);

export default async function handler(req, res) {
    try {
        if (req.method === 'POST') {
            const { country, userId } = req.body;
            const uId = String(userId);
            const ahoraIso = new Date().toISOString();

            const { data: userExists } = await supabase.from('stats').select('user_id').eq('user_id', uId).single();

            if (userExists) {
                await supabase.from('stats').update({ 
                    created_at: ahoraIso, 
                    country: country || 'Unknown' 
                }).eq('user_id', uId);
            } else {
                await supabase.from('stats').insert([
                    { 
                        user_id: uId, 
                        country: country || 'Unknown', 
                        created_at: ahoraIso,
                        first_seen: ahoraIso 
                    }
                ]);
            }
            return res.status(200).json({ success: true });
        }

        const { data: allStats, error } = await supabase.from('stats').select('*');
        if (error) throw error;

        const ahora = new Date();
        const hoyStr = ahora.toISOString().split('T')[0];
        
        const total = allStats.length;
        const todayExecs = allStats.filter(s => s.created_at.startsWith(hoyStr)).length;
        const newUsersToday = allStats.filter(s => s.first_seen && s.first_seen.startsWith(hoyStr)).length;
        
        const limiteActivos = new Date(ahora.getTime() - 7 * 1000).toISOString();
        const activos = allStats.filter(s => s.created_at >= limiteActivos).length;

        const responseText = `Online: ${activos} Today: ${todayExecs} New Users: ${newUsersToday} All Time: ${total}`;
        
        return res.status(200).send(responseText);

    } catch (error) {
        return res.status(500).send("SERVER ERROR");
    }
}
