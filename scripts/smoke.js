const fetch = require('node-fetch')
;(async ()=>{
  try{
    const base = 'http://localhost:3000'
    const h = await (await fetch(base + '/api/health')).json()
    console.log('health', h)

    const ev = await (await fetch(base + '/api/events')).json()
    console.log('events count', Array.isArray(ev) ? ev.length : 'non-array')

    const hex = await (await fetch(base + '/api/hex-aggregate')).json()
    if(hex && hex.type === 'FeatureCollection') console.log('hex-aggregate OK (features)', (hex.features||[]).length)
    else console.error('hex-aggregate invalid response')

    process.exit(0)
  }catch(e){ console.error(e); process.exit(1) }
})()
