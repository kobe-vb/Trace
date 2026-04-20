import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScanPage from "./pages/ScanPage";
import InitPage from "./pages/InitPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InitPage />} />
        <Route path="/scan" element={<ScanPage />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;