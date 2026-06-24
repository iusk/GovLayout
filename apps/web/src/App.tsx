import { Route, Routes } from 'react-router-dom';
import IndexPage from './pages/IndexPage';
import ExecutivePage from './pages/ExecutivePage';
import JudicialPage from './pages/JudicialPage';
import SupremeCourtPage from './pages/SupremeCourtPage';
import LegislativePage from './pages/LegislativePage';
import SenatePage from './pages/SenatePage';
import HousePage from './pages/HousePage';
import NotFoundPage from './pages/NotFoundPage';
import SyncDataButton from './components/SyncDataButton';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/executive" element={<ExecutivePage />} />
        <Route path="/judicial" element={<JudicialPage />} />
        <Route path="/judicial/supreme-court" element={<SupremeCourtPage />} />
        <Route path="/legislative" element={<LegislativePage />} />
        <Route path="/legislative/senate" element={<SenatePage />} />
        <Route path="/legislative/house" element={<HousePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      {/* Local-only floating control; renders nothing in production builds. */}
      <SyncDataButton />
    </>
  );
}
