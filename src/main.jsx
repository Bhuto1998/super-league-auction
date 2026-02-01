import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuctionProvider } from './context/AuctionContext.jsx'
import { MultiplayerProvider } from './context/MultiplayerContext.jsx'
import { MatchProvider } from './context/MatchContext.jsx'
import { TournamentProvider } from './context/TournamentContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MultiplayerProvider>
      <AuctionProvider>
        <MatchProvider>
          <TournamentProvider>
            <App />
          </TournamentProvider>
        </MatchProvider>
      </AuctionProvider>
    </MultiplayerProvider>
  </React.StrictMode>,
)
