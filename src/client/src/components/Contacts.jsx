import React, { useState, useEffect } from 'react'

export default function Contacts(){
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    // Load contacts from localStorage or API
    const savedContacts = localStorage.getItem('sfera_contacts')
    if (savedContacts) {
      setContacts(JSON.parse(savedContacts))
      setLoading(false)
    } else {
      // For now, show empty state
      setLoading(false)
    }
  }, [])

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.username?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const addContact = (contact) => {
    const newContacts = [...contacts, { ...contact, id: Date.now() }]
    setContacts(newContacts)
    localStorage.setItem('sfera_contacts', JSON.stringify(newContacts))
  }

  const removeContact = (id) => {
    const newContacts = contacts.filter(c => c.id !== id)
    setContacts(newContacts)
    localStorage.setItem('sfera_contacts', JSON.stringify(newContacts))
  }

  const shareLocation = (contact) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const message = `Моё местоположение: ${pos.coords.latitude}, ${pos.coords.longitude}`
        // In a real app, this would send to Telegram
        alert(`Отправлено ${contact.name}: ${message}`)
      })
    }
  }

  return (
    <div className="contacts">
      <h3>Контакты Telegram</h3>

      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Поиск контактов..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #e3e9ef',
            borderRadius: '8px',
            fontSize: '14px'
          }}
        />
      </div>

      {loading && <div className="muted">Загрузка контактов...</div>}

      {!loading && contacts.length === 0 && (
        <div className="muted" style={{ textAlign: 'center', padding: '20px' }}>
          <p>Контакты не найдены</p>
          <p style={{ fontSize: '12px', marginTop: '8px' }}>
            Используйте Telegram для добавления контактов
          </p>
        </div>
      )}

      {filteredContacts.map(contact => (
        <div key={contact.id} className="contact-card" style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px',
          border: '1px solid #eef2f6',
          borderRadius: '8px',
          marginBottom: '8px',
          background: '#fff'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            marginRight: '12px'
          }}>
            {contact.name.charAt(0).toUpperCase()}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '500' }}>{contact.name}</div>
            {contact.username && (
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                @{contact.username}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => shareLocation(contact)}
              style={{
                padding: '6px 12px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Поделиться местом
            </button>

            <button
              onClick={() => removeContact(contact.id)}
              style={{
                padding: '6px 12px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Удалить
            </button>
          </div>
        </div>
      ))}

      <div style={{ marginTop: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Добавить контакт</h4>
        <form onSubmit={(e) => {
          e.preventDefault()
          const formData = new FormData(e.target)
          const name = formData.get('name')
          const username = formData.get('username')
          if (name) {
            addContact({ name, username })
            e.target.reset()
          }
        }}>
          <input
            name="name"
            placeholder="Имя контакта"
            required
            style={{
              width: '100%',
              padding: '8px',
              marginBottom: '8px',
              border: '1px solid #e3e9ef',
              borderRadius: '6px'
            }}
          />
          <input
            name="username"
            placeholder="Username (опционально)"
            style={{
              width: '100%',
              padding: '8px',
              marginBottom: '8px',
              border: '1px solid #e3e9ef',
              borderRadius: '6px'
            }}
          />
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '8px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Добавить контакт
          </button>
        </form>
      </div>
    </div>
  )
}
