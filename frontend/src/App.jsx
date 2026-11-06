import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import NewArticle from "./pages/NewArticle.jsx";
import History from "./pages/History.jsx";
import ArticleView from "./pages/ArticleView.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="new" element={<NewArticle />} />
        <Route path="articles" element={<History />} />
        <Route path="articles/:id" element={<ArticleView />} />
        <Route path="*" element={<p className="p-8">Page not found.</p>} />
      </Route>
    </Routes>
  );
}
