import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { RiskFlags } from './pages/RiskFlags';
import { NewsImpact } from './pages/NewsImpact';
import { Chat } from './pages/Chat';
import { Upload } from './pages/Upload';
import { Status } from './pages/Status';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="risk" element={<RiskFlags />} />
          <Route path="news" element={<NewsImpact />} />
          <Route path="chat" element={<Chat />} />
          <Route path="upload" element={<Upload />} />
          <Route path="status" element={<Status />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
