import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout.tsx";
import { Dashboard } from "./pages/Dashboard.tsx";
import { Documents } from "./pages/Documents.tsx";
import { LegalMemory } from "./pages/LegalMemory.tsx";
import { Relationships } from "./pages/Relationships.tsx";
import { Changes } from "./pages/Changes.tsx";
import "./App.css";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/legal-memory" element={<LegalMemory />} />
          <Route path="/relationships" element={<Relationships />} />
          <Route path="/changes" element={<Changes />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
