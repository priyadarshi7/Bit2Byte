import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Auth0Provider } from '@auth0/auth0-react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';

createRoot(document.getElementById('root')).render(
  <Auth0Provider
    domain="dev-udqndn3ec1rcacr4.us.auth0.com"
    clientId="bUWoAIzBH1cBC5hMvDKOtz3BjZSVxZG6"
    authorizationParams={{
      redirect_uri: window.location.origin,
      audience: "https://my-backend-api" 
    }}
  >    
  <BrowserRouter>   
  <AuthProvider>                             
    <App />
    </AuthProvider>
  </BrowserRouter> 
  </Auth0Provider>
)
