// Testa o token da ZapSign com uma chamada de leitura (não consome créditos).
require('dotenv').config({ path: '.env.local' });

(async () => {
  const token = process.env.ZAPSIGN_API_TOKEN;
  if (!token) { console.error('SEM TOKEN'); process.exit(1); }
  const res = await fetch('https://api.zapsign.com.br/api/v1/docs/?page=1', {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const text = await res.text();
  console.log('STATUS', res.status);
  let j; try { j = JSON.parse(text); } catch { j = text; }
  if (res.ok) {
    const count = j.count ?? (Array.isArray(j.results) ? j.results.length : '?');
    console.log('OK — token válido. Documentos na conta:', count);
  } else {
    console.log('FALHOU:', JSON.stringify(j).slice(0, 400));
  }
})();
