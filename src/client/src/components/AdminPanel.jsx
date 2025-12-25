import React, {useEffect, useState} from 'react'

export default function AdminPanel(){
  const [token, setToken] = useState(localStorage.getItem('sfera_admin_token')||'')
  const [pending, setPending] = useState([])
  const [open, setOpen] = useState(false)

  useEffect(()=>{ if(open) fetchList() }, [open])

  function fetchList(){
    if(!token){ alert('Enter admin token'); return }
    fetch('/api/admin/pending', { headers:{ 'x-admin-token': token } })
      .then(r=>r.json()).then(j=> setPending(j)).catch(()=>alert('failed'))
  }

  function approve(id){
    fetch('/api/admin/events/'+id+'/approve', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ admin_token: token }) })
      .then(r=>{ if(r.ok){ fetchList() } else alert('approve failed') })
  }

  return (
    <div className="admin-panel">
      <button onClick={()=>setOpen(o=>!o)} className="admin-toggle">Admin</button>
      {open && (
        <div className="admin-body">
          <label>Admin token</label>
          <input value={token} onChange={e=>setToken(e.target.value)} onBlur={()=>localStorage.setItem('sfera_admin_token', token)} />
          <button onClick={fetchList}>Refresh</button>
          <div className="pending-list">
            {pending.map(p=> (
              <div key={p.id} className="pending-item">
                <div><strong>{p.title}</strong> — {p.city} — {new Date(p.created_at).toLocaleString()}</div>
                <div>{p.description}</div>
                <div><button onClick={()=>approve(p.id)}>Approve</button></div>
              </div>
            ))}
            {pending.length===0 && <div className="muted">No pending</div>}
          </div>
        </div>
      )}
    </div>
  )
}
