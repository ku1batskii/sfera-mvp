import React from 'react'

// Placeholder component that injects Telegram Login Widget
export default function TelegramLogin(){
  React.useEffect(()=>{
    // define global callback for Telegram widget
    window.onTelegramAuth = function(user){
      // send user data to server to verify
      fetch('/api/auth/telegram', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(user)
      }).then(r=>r.json()).then(json=>{
        if(json && json.token){
          localStorage.setItem('sfera_token', json.token);
          alert('Logged in as ' + (json.first_name || json.telegram_id));
        } else {
          alert('Auth failed');
        }
      }).catch(()=>alert('Auth error'))
    }

    // insert widget script with attributes
    const botName = window.SFERA_BOT_USERNAME || '';
    const script = document.createElement('script');
    script.setAttribute('src', 'https://telegram.org/js/telegram-widget.js?7');
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-auth-url', '');
    script.setAttribute('data-onauth', 'onTelegramAuth');
    script.async = true;
    const container = document.createElement('div');
    container.id = 'tg-widget-container';
    container.appendChild(script);
    document.body.appendChild(container);

    return ()=>{
      try{ document.body.removeChild(container) }catch(e){}
      delete window.onTelegramAuth
    }
  }, [])

  return (
    <div id="tg-widget-placeholder" />
  )
}
