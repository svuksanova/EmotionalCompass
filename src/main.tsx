import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route} from 'react-router-dom';
import './css/index.css';

import LoginPage   from './pages/LoginPage';


createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                {/* public */}
                <Route path="/login"  element={<LoginPage />} />
            </Routes>
        </BrowserRouter>
    </StrictMode>,
);
