import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScanPage from "./pages/ScanPage";
import InitPage from "./pages/InitPage";
import LoadPage from "./pages/loadPage";
import HomePage from "./pages/HomePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/load" element={<LoadPage />} />
        <Route path="/init" element={<InitPage />} />
        
        <Route path="/scan" element={<ScanPage />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;