import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScanPage from "./pages/ScanPage";
import InitPage from "./pages/InitPage";
import LoadPage from "./pages/loadPage";
import HomePage from "./pages/HomePage";
import ErrorPage from "./pages/ErrorPage";
import TipsPage from "./pages/TipsPage";
import BasicCodePage from "./pages/codes/BasicCodePage";
import WrongCodePage from "./pages/WrongCodePage";
import NextRoundPage from "./pages/NextRoundPage";
import AdminLogsPage from "./pages/AdminPage";
import MasterMindPage from "./pages/codes/MasterMindPage";
import CodeLayout from "./layouts/CodeLayout";
import PatroonCodePage from "./pages/codes/PatroonCodePage";
import GlazenBrugPage from "./pages/codes/GlazenBrugPage";
import WeegschaalPage from "./pages/codes/WeegschaalPage";
import MorseCodePage from "./pages/codes/MorseCodePage";
import RankingPage from "./pages/RankingPage";
import WinPage from "./pages/WiningPage";
import SetupPage from "./pages/SetupPage";
import GroupQuizPage from "./pages/codes/GroupQuizPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/admin" element={<AdminLogsPage />} />

        <Route path="/" element={<HomePage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/load" element={<LoadPage />} />
        <Route path="/init" element={<InitPage />} />
        <Route path="/ranking" element={<RankingPage />} />


        <Route path="/scan" element={<ScanPage />} />
        <Route path="/error" element={<ErrorPage />} />
        <Route path="/tips" element={<TipsPage />} />
        <Route path="/win" element={<WinPage />} />

        <Route path="/wrong_code" element={<WrongCodePage />} />
        <Route path="/next_round" element={<NextRoundPage />} />

        <Route path="/code" element={<CodeLayout />}>
          <Route path="basic" element={<BasicCodePage />} />
          <Route path="mastermind" element={<MasterMindPage />} />
          <Route path="patroon" element={<PatroonCodePage />} />
          <Route path="glazen-brug" element={<GlazenBrugPage  />} />
          <Route path="weegschaal" element={<WeegschaalPage  />} />
          <Route path="morse" element={<MorseCodePage  />} />
          <Route path="groupQuiz" element={<GroupQuizPage />} />
        </Route>

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;