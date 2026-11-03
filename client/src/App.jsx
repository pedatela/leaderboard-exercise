import LeaderboardPage from "./pages/LeaderboardPage.jsx";
import "./styles.css";

// The org is hard-coded for this exercise. In the real app it comes from the session.
const ORG_ID = 1;

export default function App() {
  return <LeaderboardPage orgId={ORG_ID} />;
}
