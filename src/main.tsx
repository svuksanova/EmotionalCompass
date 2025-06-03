import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route} from 'react-router-dom';
import './css/Index.css';

import LoginPage   from './pages/LoginPage';
import ChatPage from './pages/ChatPage.tsx';
import MainPage from './pages/MainPage.tsx'


createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                {/* public */}
                <Route path="/login"  element={<LoginPage />} />
                <Route path="/chat"   element={<ChatPage/>}/>
                <Route path="/"  element={<MainPage/>}/>
            </Routes>
        </BrowserRouter>
    </StrictMode>,
);
